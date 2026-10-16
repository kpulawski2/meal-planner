import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { normalizePersonalPriceOptions, personalProduct, withPersonalPriceIndex, isTrustedPersonalPrice } from './personal-prices.js';
import { normalizePlannerRequest } from './planner-request.js';

// Every price and recipe nutrition figure in this file is synthetic test data.
// The catalogue fixture deliberately has no public prices for the three meals.
const directory = await mkdtemp(path.join(os.tmpdir(), 'meal-personal-price-integration-'));
process.env.LIDL_CATALOGUE_PATH = path.join(directory, 'products.json');
process.env.LIDL_CATALOGUE_META_PATH = path.join(directory, 'metadata.json');
const now = new Date(), checkedAt = globalThis.PersonalPricesCore.today(now);
const dayAgo = days => new Date(Date.parse(checkedAt + 'T12:00:00Z') - days * 86400000).toISOString().slice(0, 10);
const products = Array.from({ length: 120 }, (_, index) => ({
  store: 'Lidl', id: String(18000000 + index),
  name: ['Crownfield Rolled Oats', 'Nixe Tuna in Spring Water', 'Birchwood Chicken Breast Fillets', 'Woodcote Eggs'][index] || `Fixture grocery ${index}`,
  category: ['Food & Drink > Cereals & Spreads', 'Food & Drink > Food Cupboard > Tinned Fish', 'Food & Drink > Meat & Poultry > Chicken & Turkey', 'Food & Drink > Cheese, Dairy & Eggs > Eggs'][index] || 'Food & Drink > Food Cupboard',
  url: `https://www.lidl.co.uk/p/test-fixture/p${18000000 + index}`,
  packQuantity: index === 1 ? 112 : index === 3 ? 6 : 1000,
  packUnit: index === 3 ? 'pieces' : 'g', packSize: index === 1 ? '112g drained' : index === 3 ? '6 pieces' : '1kg',
  price: index === 3 ? 2 : null, available: null, availability: 'in_store_only', checkedAt: now.toISOString(),
}));
const raw = JSON.stringify(products);
await writeFile(process.env.LIDL_CATALOGUE_PATH, raw);
await writeFile(process.env.LIDL_CATALOGUE_META_PATH, JSON.stringify({ store: 'Lidl', status: 'complete', products_saved: 120, products_expected: 120, coverage: 1, coverage_scope: 'official_sitemap_products', entire_store_inventory: false, with_price: 1, price_coverage: 1 / 120, refreshed_at: now.toISOString(), products_file_sha256: createHash('sha256').update(raw).digest('hex') }));
const catalog = await import('./catalog-adapter.js');
const worker = await import('./catalog-service.js');
const { optimizeMealPlan } = await import('./budget-planner.js');
test.after(() => rm(directory, { recursive: true, force: true }));

const observed = (ingredient, packQuantity, priceGBP, patch = {}) => ({ store: 'Lidl', ingredient, productName: `TEST ONLY shopper pack: ${ingredient}`, packQuantity, packUnit: 'g', priceGBP, checkedAt, source: 'receipt', branch: 'Test fixture branch', ...patch });
const prices = [observed('Rolled oats', 1000, 1), observed('Tuna in spring water', 112, .5), observed('Chicken breast', 1000, 5)];
const options = { allowPersonalPrices: true, personalPrices: prices };
const item = (name = 'Rolled oats', quantity = 1500, dimension = 'mass') => ({ key: name + '::' + dimension, name, quantity, dimension });
const recipes = [
  { id: 'fixture-oats', name: 'Test overnight oats', cat: 'Breakfast', servings: 1, ings: [['Rolled oats', 50, 'g']], nutrition: { kcal: 400, p: 30, c: 40, f: 10, complete: true } },
  { id: 'fixture-tuna', name: 'Test tuna salad', cat: 'Lunch', servings: 1, ings: [['Tuna in spring water', 112, 'g']], nutrition: { kcal: 400, p: 40, c: 35, f: 8, complete: true } },
  { id: 'fixture-chicken', name: 'Test chicken dinner', cat: 'Dinner', servings: 1, ings: [['Chicken breast', 200, 'g']], nutrition: { kcal: 400, p: 50, c: 30, f: 10, complete: true } },
];
function mealRequest() {
  return { profile: { supermarket: 'Lidl', lidlReferencePrices: false, days: 2, meals: 3, people: 1, calories: 1200, protein: 100, budget: 35, varietyMode: 'Repeat favourites', repeatMeals: { Breakfast: 'fixture-oats', Lunch: 'fixture-tuna', Dinner: 'fixture-chicken' } }, recipes, pantry: [], week: [], ...options };
}

test('personal pack prices stay request-local and a corrected pack recomputes full-pack costs', async () => {
  const strict = await catalog.recommendCatalogItems('Lidl', [item()]);
  assert.equal(strict.recommendations[0].plan, null);
  const first = await catalog.recommendCatalogItems('Lidl', [item()], options);
  const plan = first.recommendations[0].plan;
  assert.ok(plan); assert.equal(plan.totalCostGBP, 2); assert.equal(plan.totalQuantity, 2000); assert.equal(plan.products[0].packs, 2);
  assert.equal(plan.products[0].productName, prices[0].productName); assert.equal(plan.products[0].priceBasis, 'personal'); assert.equal(plan.estimatedPrice, true);
  assert.equal(plan.products[0].personalSource, 'receipt'); assert.equal(plan.products[0].personalBranch, 'Test fixture branch'); assert.equal(plan.products[0].personalCheckedAt, checkedAt);
  assert.equal(globalThis.PersonalPricesCore.productMatches(plan.products[0], { store: 'Lidl', ingredient: 'Rolled oats', dimension: 'mass', prices }), true);
  const changed = await catalog.recommendCatalogItems('Lidl', [item()], { allowPersonalPrices: true, personalPrices: [observed('Rolled oats', 500, .8)] });
  assert.equal(changed.recommendations[0].plan.totalCostGBP, 2.4); assert.equal(changed.recommendations[0].plan.products[0].packs, 3);
  const otherHousehold = await catalog.recommendCatalogItems('Lidl', [item()]);
  const optedOut = await catalog.recommendCatalogItems('Lidl', [item()], { ...options, allowPersonalPrices: false });
  assert.equal(otherHousehold.recommendations[0].plan, null); assert.equal(optedOut.recommendations[0].plan, null);
  const originalAgain = await catalog.recommendCatalogItems('Lidl', [item()], options);
  assert.equal(originalAgain.recommendations[0].plan.totalCostGBP, 2);
  assert.equal(first.indexSize, strict.indexSize, 'personal observations must not inflate official listing counts');
});

test('worker messages preserve private price provenance without leaking one request into the next', async () => {
  const personal = await worker.recommendCatalogItems('Lidl', [item()], options);
  assert.equal(personal.recommendations[0].plan.totalCostGBP, 2);
  assert.equal(personal.recommendations[0].plan.products[0].priceBasis, 'personal');
  assert.equal(personal.recommendations[0].plan.products[0].personalCheckedAt, checkedAt);
  const strict = await worker.recommendCatalogItems('Lidl', [item()]);
  assert.equal(strict.recommendations[0].plan, null);
  const changed = await worker.recommendCatalogItems('Lidl', [item()], { allowPersonalPrices: true, personalPrices: [observed('Rolled oats', 500, .8)] });
  assert.equal(changed.recommendations[0].plan.totalCostGBP, 2.4);
});

test('piece packs and unsupported unit requests cannot be confused or counted as free', async () => {
  const eggs = observed('Eggs', 6, 1.2, { packUnit: 'pieces' });
  const result = await catalog.recommendCatalogItems('Lidl', [item('Eggs', 7, 'each')], { allowPersonalPrices: true, personalPrices: [eggs] });
  assert.ok(result.recommendations[0].plan, 'the browser uses the each dimension for egg counts');
  assert.equal(result.recommendations[0].plan.totalCostGBP, 2.4); assert.equal(result.recommendations[0].plan.products[0].packs, 2);
  const incompatible = observed('Eggs', 300, 1.2);
  const fallback = await catalog.recommendCatalogItems('Lidl', [item('Eggs', 7, 'each')], { allowPersonalPrices: true, personalPrices: [incompatible] });
  assert.equal(fallback.recommendations[0].plan.totalCostGBP, 4, 'an incompatible saved gram pack must not hide a usable official piece pack');
  assert.equal(fallback.recommendations[0].plan.products[0].priceBasis, 'website');
  const unsupported = await catalog.recommendCatalogItems('Lidl', [item('Rolled oats', 100, 'volume')], options);
  assert.equal(unsupported.recommendations[0].plan, null, 'an unproven gram-to-millilitre conversion cannot create a zero-cost plan');
  const mayo = observed('Mayonnaise', 500, 1, { packUnit: 'ml' });
  const converted = await catalog.recommendCatalogItems('Lidl', [item('Mayonnaise', 600, 'mass')], { allowPersonalPrices: true, personalPrices: [mayo] });
  const convertedPlan = converted.recommendations[0].plan;
  assert.equal(convertedPlan.totalCostGBP, 2); assert.equal(convertedPlan.totalQuantity, 1000); assert.equal(convertedPlan.estimatedQuantity, true);
  assert.match(convertedPlan.products[0].quantityBasis, /Estimated density 1 g\/ml/);
  assert.equal(globalThis.PersonalPricesCore.productMatches(convertedPlan.products[0], { store: 'Lidl', dimension: 'mass', ingredient: 'Mayonnaise', prices: [mayo] }), true, 'browser and backend use the same labelled conversion');
  const drained = await catalog.recommendCatalogItems('Lidl', [item('Sauerkraut', 200)], { allowPersonalPrices: true, personalPrices: [observed('Sauerkraut', 300, 1)] });
  assert.equal(drained.recommendations[0].plan.totalCostGBP, 1, 'explicit personal drained weight does not require inference from an official unit price');
  const wrongIngredient = await catalog.recommendCatalogItems('Lidl', [item('Chicken breast', 200)], { allowPersonalPrices: true, personalPrices: [prices[0]] });
  assert.equal(wrongIngredient.recommendations[0].plan, null, 'an assigned oat pack cannot price chicken');
});

test('only independently validated personal products can enter costing, with expired observations excluded', () => {
  const original = personalProduct(prices[0]);
  assert.equal(isTrustedPersonalPrice(original), true); assert.equal(catalog.productPriceUsable(original), true);
  assert.equal(isTrustedPersonalPrice({ ...original }), false); assert.equal(catalog.productPriceUsable({ ...original }), false);
  assert.equal(catalog.productPriceUsable({ ...original, estimatedPrice: false, priceBasis: 'website', priceSource: 'Lidl GB official product page' }), false, 'official-looking flags cannot elevate a copied personal record');
  const aged = observed('Rolled oats', 1000, 1, { checkedAt: dayAgo(91) });
  assert.deepEqual(normalizePersonalPriceOptions({ allowPersonalPrices: true, personalPrices: [aged] }).personalPrices, []);
  assert.throws(() => personalProduct(aged), /90 days/);
  for (const bad of [observed('Rolled oats', 0, 1), observed('Rolled oats', 1000, -1), observed('Rolled oats', 1000, 1, { checkedAt: dayAgo(-1) }), observed('Rolled oats', 1.5, 1, { packUnit: 'pieces' })]) assert.throws(() => normalizePersonalPriceOptions({ allowPersonalPrices: true, personalPrices: [bad] }), TypeError);
  assert.throws(() => normalizePersonalPriceOptions(options, 'Asda'), /Lidl only/);
  assert.throws(() => normalizePersonalPriceOptions({ allowPersonalPrices: 'true', personalPrices: prices }), TypeError);
  const baseIndex = { urls: [], products: [] }, before = JSON.stringify(baseIndex);
  const overlaid = withPersonalPriceIndex(baseIndex, options, 'Lidl');
  assert.notEqual(overlaid, baseIndex); assert.equal(baseIndex.personalByIngredient, undefined); assert.equal(JSON.stringify(baseIndex), before);
});

test('an oats, tuna and chicken routine can be costed with explicit personal packs without enabling historical references', async () => {
  const request = normalizePlannerRequest(mealRequest());
  assert.equal(request.profile.lidlReferencePrices, false); assert.equal(request.allowPersonalPrices, true);
  const strict = await optimizeMealPlan({ ...request, allowPersonalPrices: false });
  assert.equal(strict.status, 'unavailable'); assert.equal(strict.basket.complete, false); assert.equal(strict.basket.totalCostGBP, null);
  const result = await optimizeMealPlan(request);
  assert.equal(result.status, 'feasible', result.warnings.join(' ')); assert.equal(result.week.length, 2); assert.equal(result.basket.complete, true); assert.equal(result.basket.estimatedPrice, true);
  assert.ok(result.nutrition.days.every(day => day.complete && day.meetsTargets)); assert.ok(result.basket.totalCostGBP <= result.budget.planGBP);
  assert.match(result.warnings.join(' '), /saved Lidl shelf or receipt prices/);
  for (const recommendation of result.basket.recommendations) {
    assert.ok(recommendation.plan.totalCostGBP > 0); assert.ok(recommendation.plan.totalQuantity >= recommendation.plan.requestedQuantity - .00001);
    assert.ok(recommendation.plan.products.every(product => product.priceBasis === 'personal' && product.estimatedPrice && !product.priceSourceUrl));
  }
  const again = await optimizeMealPlan({ ...request, allowPersonalPrices: false });
  assert.equal(again.status, 'unavailable', 'an earlier personal plan cannot change the shared catalogue');
});

test('HTTP recommendations and planning reject malformed personal inputs and require the explicit opt-in', { timeout: 45000 }, async t => {
  process.env.PORT = '0';
  const { httpServer } = await import('./server.js');
  t.after(async () => { httpServer.closeAllConnections(); await new Promise(resolve => httpServer.close(resolve)); });
  if (!httpServer.listening) await once(httpServer, 'listening');
  const base = `http://127.0.0.1:${httpServer.address().port}`;
  const send = (route, body) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const body = { store: 'Lidl', items: [item()], ...options };
  for (const patch of [{ allowPersonalPrices: 'true' }, { personalPrices: {} }, { personalPrices: [observed('Rolled oats', 1000, 0)] }, { personalPrices: [observed('Rolled oats', 1000, 1, { checkedAt: dayAgo(-1) })] }, { store: 'Asda' }]) {
    const response = await send('/api/catalog/recommend', { ...body, ...patch });
    assert.equal(response.status, 400, JSON.stringify(patch)); assert.equal(typeof (await response.json()).error, 'string');
  }
  const optedOut = await send('/api/catalog/recommend', { ...body, allowPersonalPrices: false });
  assert.equal(optedOut.status, 200); assert.equal((await optedOut.json()).recommendations[0].plan, null);
  const enabled = await send('/api/catalog/recommend', body);
  assert.equal(enabled.status, 200); const priced = await enabled.json(); assert.equal(priced.recommendations[0].plan.totalCostGBP, 2); assert.equal(priced.recommendations[0].plan.products[0].priceBasis, 'personal');
  const invalidPlan = await send('/api/planner/generate', { ...mealRequest(), allowPersonalPrices: 'yes' });
  assert.equal(invalidPlan.status, 400);
  const planned = await send('/api/planner/generate', mealRequest());
  assert.equal(planned.status, 200); const result = await planned.json(); assert.equal(result.status, 'feasible'); assert.equal(result.basket.complete, true); assert.equal(result.basket.estimatedPrice, true);
});
