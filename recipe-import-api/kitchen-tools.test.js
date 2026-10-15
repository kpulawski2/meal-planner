import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/kitchen-tools-core.js';
import { rankCatalogCandidates, browseCatalog } from './catalog-adapter.js';
const core = globalThis.KitchenToolsCore, now = new Date('2026-10-11T12:00:00Z');
const oats = { id: 'oats', name: 'Overnight oats', cat: 'Breakfast', servings: 2, ings: [['Oats', 100, 'g'], ['Milk', 200, 'ml'], ['Milk', 100, 'ml'], ['Water', 50, 'ml']] };
test('pantry suggestions aggregate lots and duplicate ingredients at household quantities without modifying stock', () => {
  const stock = [{ name: 'Oats', qty: .05, unit: 'kg' }, { name: 'Oats', qty: 50, unit: 'g', expiry: '2026-10-12' }, { name: 'Milk', qty: .2, unit: 'l' }, { name: 'Milk', qty: 100, unit: 'ml' }];
  const before = JSON.stringify(stock), rows = core.suggestions([oats], stock, 2, now);
  assert.equal(rows[0].ready, true); assert.equal(rows[0].useUp, 1); assert.equal(JSON.stringify(stock), before);
  const larger = core.suggestions([oats], stock, 4, now)[0];
  assert.equal(larger.ready, false); assert.deepEqual(larger.missing.map(row => row.qty), [100, 300]);
});
test('expired and invalid dated lots do not count; expiry today counts; partial stock cannot claim readiness', () => {
  const stock = [{ name: 'Oats', qty: 50, unit: 'g', expiry: '2026-10-11' }, { name: 'Milk', qty: 1000, unit: 'ml', expiry: '2026-10-10' }, { name: 'Milk', qty: 1000, unit: 'ml', expiry: '2026-02-30' }];
  const row = core.suggestions([oats], stock, 1, now)[0];
  assert.equal(row.ready, false); assert.equal(row.useUp, 1); assert.equal(row.missing[0].qty, 150);
  assert.equal(core.suggestions([oats], [], 1, now).length, 0);
});
test('fixed batches require a whole batch and quantity estimates stay visible', () => {
  const recipe = { ...oats, fixedBatch: true };
  const stock = [{ name: 'Oats', qty: 50, unit: 'g', estimated: true }, { name: 'Milk', qty: 150, unit: 'ml' }];
  const row = core.suggestions([recipe], stock, 1, now)[0];
  assert.equal(row.preparedServings, 2); assert.equal(row.ready, false); assert.equal(row.estimated, true);
  assert.equal(core.suggestions([{ ...oats, ings: [['Oats', null, 'g']] }], stock, 1, now).length, 0);
});
test('routines preserve budgets, targets and household size, reject missing or incompatible recipes and bound imported data', () => {
  const profile = { meals: 3, people: 4, budget: 50, calories: 2000, diet: 'Vegan', varietyMode: 'Repeat favourites', repeatMeals: { Breakfast: 'oats', Snack: 'ignored' } };
  const routine = core.createRoutine(profile, 'My week', 'saved');
  assert.deepEqual(routine.repeatMeals, { Breakfast: 'oats' });
  assert.deepEqual(core.routineProfile(profile, routine, [oats]), { ...profile, repeatMeals: { Breakfast: 'oats' } });
  assert.throws(() => core.routineProfile(profile, routine, []), /Review/);
  assert.throws(() => core.routineProfile(profile, routine, [oats], () => false), /Review/);
  assert.throws(() => core.createRoutine({ ...profile, varietyMode: 'Balanced' }, 'Name', 'id'), /Repeat/);
  assert.equal(core.normalizeRoutines([null, {}, routine, routine, { ...routine, id: 'bad', meals: 9 }]).length, 1);
  assert.equal(core.normalizeRoutines(Array.from({ length: 30 }, (_, i) => ({ ...routine, id: String(i) }))).length, 20);
});
test('real verified Lidl listings match named pasta and Skyr without inventing products or prices', async () => {
  const products = JSON.parse(await readFile(new URL('../data/lidl-products.json', import.meta.url)));
  assert.ok(rankCatalogCandidates('Pasta', products).some(row => row.product.id === '10000271'));
  const skyr = rankCatalogCandidates('Skyr yoghurt', products)[0];
  assert.equal(skyr.product.id, '10041733'); assert.ok(skyr.score >= 9); assert.equal(skyr.product.price, null);
  for (const row of rankCatalogCandidates('Oats', products)) assert.doesNotMatch(row.product.name, /bites|cocoa|vanilla/i);
  for (const row of rankCatalogCandidates('Tuna', products)) assert.doesNotMatch(row.product.name, /salad/i);
  const shape = { name: 'Penne Pasta Filled with Cheese', category: 'Food Cupboard > Filled Pasta' };
  assert.equal(rankCatalogCandidates('Pasta', [shape]).length, 0);
});
test('verified-only Lidl browsing excludes historical references while preserving explicitly requested references', async () => {
  const products = await browseCatalog('Lidl', { source: 'products', query: 'Mayonnaise' });
  assert.ok(products.results.every(row => row.kind === 'product' && /^https:\/\/www\.lidl\.co\.uk\/p\//.test(row.url)), 'Mayo aliases may reveal an official assorted sauce, but cannot include a historical range reference');
  assert.ok(products.verifiedProducts > 1000);
  const all = await browseCatalog('Lidl', { source: 'all', query: 'Mayonnaise' });
  assert.ok(all.results.some(row => row.kind === 'range_reference'));
  const first = await browseCatalog('Lidl', { source: 'products', limit: 100 });
  assert.ok(first.results.every(row => row.kind === 'product'));
});
