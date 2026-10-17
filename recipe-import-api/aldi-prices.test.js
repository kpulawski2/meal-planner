import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAldiPrices, loadAldiPrices, aldiProduct } from './aldi-prices.js';
import { recommendCatalogItems, catalogPurchaseOffers, browseCatalog, catalogueStatus, catalogStoreInfo, productPriceUsable, calculatePackPurchase, rankCatalogCandidates } from './catalog-adapter.js';
import { recommendCatalogItems as workerRecommend } from './catalog-service.js';
import { normalizePlannerRequest } from './planner-request.js';
import { optimizeMealPlan } from './budget-planner.js';
import '../public/swap-core.js';
import '../public/consumer-tools.js';
import '../public/pantry-core.js';

const manifest = JSON.parse(await readFile(new URL('../data/aldi-prices.json', import.meta.url)));
const rows = await loadAldiPrices();
const item = (name, quantity = 100, dimension = 'mass') => ({ key: name, name, quantity, dimension });

test('Aldi source validation preserves dates and actual Aldi packs while rejecting overseas, forged and invalid prices', () => {
  assert.equal(rows.length, 114);
  assert.equal(rows.find(row => /Frozen Mixed Berries/.test(row.name)).sourceDate, '2026-05-07');
  assert.equal(rows.find(row => /Maris Piper/.test(row.name)).packQuantity, 2500);
  assert.equal(rows.find(row => /Maris Piper/.test(row.name)).priceGBP, 2.25, 'use Aldi actual price, not the 1.80 Tesco pro-rata comparison');
  for (const mutate of [d => d.currency = 'EUR', d => d.products[0].priceGBP = 0, d => d.products[0].packQuantity = 0,
    d => d.products[0].sourceUrl = 'https://www.aldi.ie/product/test-123', d => d.products[0].sourceUrl = 'https://www.aldi.co.uk.evil.test/product/test-123',
    d => d.products[0].sourceUrl = 'https://user@www.aldi.co.uk/product/test-123', d => d.products[0].sourceDate = '2099-01-01',
    d => d.products[0].sourceUrl = 'https://digitalcontent.api.tesco.com/unreviewed.pdf#page=1', d => d.products.push(d.products[0])]) {
    const bad = structuredClone(manifest); mutate(bad); assert.throws(() => validateAldiPrices(bad));
  }
  assert.throws(() => aldiProduct({ ...rows[0] }), /Unvalidated/);
  assert.equal(productPriceUsable({ store: 'Aldi', price: .01, priceBasis: 'aldi_reference', estimatedPrice: true }), false);
  const trusted = aldiProduct(rows[0]); assert.equal(productPriceUsable(trusted), true);
  assert.equal(productPriceUsable({ ...trusted }), false, 'copying a trusted flag cannot manufacture a new price');
});

test('Aldi is a separate curated store with browsable source links and positive whole-pack prices', async () => {
  assert.ok(catalogStoreInfo().some(store => store.name === 'Aldi'));
  const status = await catalogueStatus('Aldi');
  assert.equal(status.healthy, true); assert.equal(status.products_saved, 114);
  assert.equal(status.coverage_scope, 'curated_recipe_ingredients');
  const browse = await browseCatalog('Aldi', { query: 'wholemeal wraps' });
  assert.equal(browse.total, 114); assert.equal(browse.results.length, 1);
  assert.equal(browse.results[0].priceGBP, .99); assert.equal(browse.results[0].sourceStore, 'Aldi');
  assert.equal(browse.results[0].priceBasis, 'aldi_reference');
  const result = await recommendCatalogItems('Aldi', [item('Wholemeal wrap', 9, 'each'), item('Frozen mixed berries', 1001)]);
  const [wraps, berries] = result.recommendations.map(row => row.plan);
  assert.equal(wraps.totalCostGBP, 1.98); assert.equal(wraps.totalQuantity, 16);
  assert.equal(berries.totalCostGBP, 5.98); assert.equal(berries.totalQuantity, 2000);
  assert.equal(berries.estimatedPrice, true); assert.equal(berries.products[0].sourceDate, '2026-05-07');
});

test('Lidl uses Aldi only for missing compatible prices and keeps strict callers and listing counts separate', async () => {
  const items = [item('Wholemeal wrap', 9, 'each'), item('Frozen mixed berries', 1001), item('Oats', 1001), item('Chicken breast', 1100)];
  const result = await recommendCatalogItems('Lidl', items, { allowReferencePrices: true });
  for (const row of result.recommendations) { assert.equal(row.confidence, 'high'); assert.ok(row.plan); }
  assert.equal(result.recommendations[0].plan.products[0].priceBasis, 'aldi_estimate');
  assert.equal(result.recommendations[1].plan.products[0].sourceStore, 'Aldi');
  assert.equal(result.recommendations[2].plan.products[0].priceBasis, 'reference', 'saved Lidl oats win even when Aldi is cheaper');
  assert.equal(result.recommendations[2].plan.products[0].priceGBP, 1.99);
  assert.equal(result.recommendations[3].plan.products[0].priceGBP, 6.44);
  const strict = await recommendCatalogItems('Lidl', items);
  assert.equal(strict.indexSize, result.indexSize);
  assert.equal(strict.recommendations[0].plan, null);
  const directory = await browseCatalog('Lidl', { query: 'Village Bakery', allowReferencePrices: true });
  assert.equal(directory.matched, 0, 'Aldi packs must not inflate the Lidl catalogue');
  const offers = await catalogPurchaseOffers(items, { store: 'Lidl', allowReferencePrices: true });
  assert.deepEqual(offers.rows[0].offers, [{ capacity: 8, cents: 99 }]);
});

test('Aldi estimates cannot change an explicit brand, dairy type, protein variant or unknown usable quantity', async () => {
  for (const fallback of [false, true]) {
    const tin = aldiProduct(rows.find(row => /Tinned Lentils/.test(row.name)), { fallback });
    assert.equal(calculatePackPurchase([tin], 200, 'mass'), null, 'tin net weight is not a verified drained weight');
    const stock = aldiProduct(rows.find(row => /Stock Cubes/.test(row.name)), { fallback });
    assert.equal(calculatePackPurchase([stock], 500, 'volume'), null, 'cube weight is not liquid stock volume');
  }
  const result = await recommendCatalogItems('Aldi', [item('FUEL10K Chocolate Multigrain Flakes High Protein Breakfast Cereal'), item('Plain Skyr yoghurt'), item('0% Greek yoghurt'), item('Raw prawns'), item('Lentils')]);
  assert.equal(result.recommendations[0].plan.products[0].priceBasis,'other_store');
  assert.ok(result.recommendations.slice(1).every(row => row.plan === null));
  assert.equal(rankCatalogCandidates('Lentils', [{ store: 'Lidl', name: 'SNAKTASTIC Lentil Curls Multipack', category: 'Food & Drink > Confectionery & Snacks', url: 'https://www.lidl.co.uk/p/snack/p123' }]).length, 0);
});

test('worker, offline baskets and copies retain Aldi provenance; altered sources and store mismatches fail', async () => {
  const items = [item('Wholemeal wrap', 9, 'each'), item('Frozen mixed berries', 1001)];
  for (const store of ['Lidl', 'Aldi']) {
    const result = await workerRecommend(store, items, { allowReferencePrices: true });
    const basket = globalThis.MealSwapCore.basket(result, items, store);
    assert.equal(basket.complete, true); assert.equal(basket.total, 7.96); assert.equal(basket.estimatedPrice, true);
    const catalogue = { store, status: 'ready', fingerprint: 'aldi-test', loadedAt: Date.now(), items, results: Object.fromEntries(result.recommendations.map(row => [row.key, row])) };
    const saved = globalThis.ConsumerTools.snapshot(catalogue); assert.ok(saved);
    const restored = globalThis.ConsumerTools.restore(saved, store, 'aldi-test');
    assert.equal(restored.results['Frozen mixed berries'].plan.products[0].sourceDate, '2026-05-07');
    const bad = structuredClone(result); bad.recommendations[0].plan.products[0].url = 'https://www.aldi.co.uk.evil.test/product/wraps-123';
    assert.equal(globalThis.MealSwapCore.basket(bad, items, store).complete, false);
    const opposite = store === 'Aldi' ? 'Lidl' : 'Aldi';
    assert.equal(globalThis.RetailerPriceSources.aldiProduct(result.recommendations[0].plan.products[0], opposite), false);
  }
});

// Synthetic recipe nutrition isolates the pricing integration from macro search.
test('a repeated 14-day plan can price Aldi and mixed Lidl/Aldi baskets without treating estimates as recorded spending', async () => {
  const recipes = [
    { id: 'fixture-oats', name: 'Fixture berry oats', cat: 'Breakfast', ings: [['Oats', 50, 'g'], ['Skimmed milk', 150, 'ml'], ['Frozen mixed berries', 100, 'g']] },
    { id: 'fixture-wrap', name: 'Fixture cottage wrap', cat: 'Lunch', ings: [['Wholemeal wrap', 1, 'pieces'], ['Cottage cheese', 150, 'g']] },
    { id: 'fixture-chicken', name: 'Fixture chicken rice', cat: 'Dinner', ings: [['Chicken breast', 200, 'g'], ['Rice', 50, 'g'], ['Frozen mixed vegetables', 150, 'g']] },
  ].map(recipe => ({ ...recipe, servings: 1, cookTime: 15, nutrition: { kcal: 500, p: 50, c: 30, f: 8, complete: true, source: 'fixture' } }));
  for (const store of ['Aldi', 'Lidl']) {
    const request = normalizePlannerRequest({ profile: { supermarket: store, lidlReferencePrices: store === 'Lidl', days: 14, meals: 3, budget: 35, calories: 1500, protein: 100, varietyMode: 'Repeat favourites', repeatMeals: { Breakfast: recipes[0].id, Lunch: recipes[1].id, Dinner: recipes[2].id } }, recipes });
    const result = await optimizeMealPlan(request);
    assert.equal(result.status, 'feasible', JSON.stringify(result.warnings));
    assert.equal(result.week.length, 14); assert.equal(result.basket.complete, true);
    assert.ok(result.basket.totalCostGBP <= 70); assert.equal(result.basket.estimatedPrice, true);
    assert.ok(result.warnings.some(warning => /Aldi/.test(warning)));
    const state = { shopping: { wraps: true }, pantry: [], week: [] };
    const quote = await recommendCatalogItems(store, [item('Wholemeal wrap', 9, 'each')], { allowReferencePrices: true });
    const preview = globalThis.PantryCore.purchasePreview({ state, entries: [['wraps', { name: 'Wholemeal wrap', groups: { each: { remaining: 9 } } }]], store,
      basket: { status: 'ready', items: [{ key: 'wraps::each', name: 'Wholemeal wrap', quantity: 9, dimension: 'each' }], results: quote.recommendations.map(row => ({ ...row, key: 'wraps::each' })) }, catalogue: { loadedAt: Date.now() } });
    assert.equal(preview.ok, false); assert.match(preview.error, /receipt/);
  }
});
