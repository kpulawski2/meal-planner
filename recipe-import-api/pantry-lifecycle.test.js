import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import { calculatePackPurchase } from './catalog-adapter.js';

const core = globalThis.PantryCore, budget = globalThis.MealBudgetCore;
const now = new Date('2026-10-11T12:00:00Z');
const copy = value => JSON.parse(JSON.stringify(value));
const rice = { id: 'rice', name: 'Rice bowl', cat: 'Dinner', servings: 1, kcal: 400, p: 20, ings: [['Rice', 100, 'g'], ['Tap water', 200, 'ml']] };
const eggs = { id: 'eggs', name: 'Egg lunch', cat: 'Lunch', servings: 1, kcal: 300, p: 20, ings: [['Eggs', 2, 'pieces']] };
function state(overrides = {}) {
  const result = { profile: { people: 1, budget: 45 }, shoppingStore: 'Asda', shopping: {}, week: [{ day: 'Monday', meals: ['rice'] }, { day: 'Tuesday', meals: ['rice'] }], mealServings: {}, pantry: [], leftovers: [], ...copy(overrides) };
  core.initialise(result, now); return result;
}
function leftover(id, servings, recipe = rice, overrides = {}) { return { id, recipeId: recipe.id, recipeSignature: core.recipeSignature(recipe), recipeSnapshot: copy(recipe), servings, storage: 'Fridge', createdAt: now.toISOString(), expiry: '', ...overrides }; }
function shopping(s, recipes = [rice], at = now) { return budget.buildShopping(core.shoppingInput(s, recipes, at)); }
function fixture({ name = 'Rice', quantity = 150, dimension = 'mass', packQuantity = 500, packUnit = 'g', totalQuantity, store = 'Asda', ...overrides } = {}) {
  const key = budget.canonicalIngredientName(name), s = state({ shopping: { [key]: true } });
  const item = { name, groups: { [dimension]: { remaining: quantity, label: dimension === 'volume' ? 'ml' : dimension === 'each' ? 'pieces' : 'g' } } };
  const total = totalQuantity ?? packQuantity * budget.unitMeta(packUnit, name).factor;
  const product = { productName: store === 'Asda' ? 'ASDA ' + name : name, url: store === 'Asda' ? 'https://www.asda.com/groceries/product/fixture/123456' : 'https://www.lidl.co.uk/p/rice/p10012345', packs: 1, packQuantity, packUnit, packSize: packQuantity + ' ' + packUnit, priceGBP: 2, costGBP: 2, totalQuantity: total, checkedAt: now.toISOString(), ...overrides };
  const row = { key: key + '::' + dimension, name, dimension, quantity }, result = { key: row.key, match: copy(product), plan: { requestedQuantity: quantity, totalQuantity: total, totalCostGBP: product.costGBP, products: [product] } };
  return { state: s, entries: [[key, item]], store, basket: { status: 'ready', items: [row], results: [result] }, catalogue: { loadedAt: now.getTime(), fingerprint: 'fixture', store }, now };
}
function preview(f) { return core.purchasePreview(f); }

test('a frozen shelf product without frozen in its name goes into the freezer', () => {
  const f = fixture({ name: 'Chicken breast', productName: 'Plain Chicken Breast Fillets', storage: 'Freezer' });
  const p = preview(f); assert.equal(p.ok, true, p.error);
  assert.equal(p.lots[0].place, 'Freezer');
});

test('legacy stock gets stable unique identities without resetting the plan or purchase spend', () => {
  const s = state({ pantry: [null, { id: 'same', name: 'Rice', qty: 1, unit: 'kg' }, { id: 'same', name: 'Rice', qty: 100, unit: 'g' }], pantryLedger: [] });
  const id = s.pantryLedger.planId, first = copy(s.pantry); core.initialise(s, new Date(now.getTime() + 1000));
  assert.equal(s.pantry.length, 2); assert.equal(new Set(s.pantry.map(lot => lot.id)).size, 2); assert.deepEqual(s.pantry, first); assert.equal(s.pantryLedger.planId, id);
});

test('purchase adds exact full packs with metadata and spend, then clears the checked shopping rows', () => {
  const f = fixture(), p = preview(f); assert.equal(p.ok, true, p.error);
  const before = copy(f.state), result = core.applyPurchase(f.state, p, preview(f), now); assert.equal(result.ok, true, result.error);
  assert.equal(f.state.pantry.length, 1); assert.equal(f.state.pantry[0].qty, 500); assert.equal(f.state.pantry[0].unit, 'g');
  assert.equal(f.state.pantry[0].product.costGBP, 2); assert.equal(f.state.pantry[0].store, 'Asda'); assert.equal(f.state.pantry[0].product.checkedAt, now.toISOString());
  assert.deepEqual(f.state.shopping, {}); assert.equal(core.spentTotal(f.state), 2);
  assert.equal(core.applyPurchase(f.state, p, p, now).ok, false); assert.equal(f.state.pantry.length, 1); assert.equal(core.spentTotal(f.state), 2);
  assert.equal(core.undo(f.state, result.transaction.id, now).ok, true); assert.deepEqual(f.state.pantry, before.pantry); assert.equal(core.spentTotal(f.state), 0);
  assert.equal(core.undo(f.state, result.transaction.id, now).ok, false);
});

test('unchecked, incomplete, offline and unsupported purchase quotes cannot replace existing stock', () => {
  for (const mutate of [f => { f.state.shopping = {}; }, f => { f.basket.status = 'loading'; }, f => { f.basket.offline = true; }, f => { f.catalogue.offline = true; }, f => { f.store = 'Aldi'; }, f => { f.entries[0][1].unknown = true; }, f => { f.basket.results[0].plan = null; }, f => { f.basket.results[0].match = null; }]) {
    const f = fixture(); f.state.pantry.push({ id: 'healthy', name: 'Eggs', qty: 6, unit: 'pieces' }); mutate(f); const saved = copy(f.state);
    assert.equal(preview(f).ok, false); assert.deepEqual(f.state, saved);
  }
});

test('purchase validation rejects stale, future, expired, member and regional prices', () => {
  for (const mutate of [f => { f.catalogue.loadedAt -= 31 * 60000; }, f => { f.catalogue.loadedAt += 2 * 60000; }, f => { f.basket.results[0].plan.products[0].checkedAt = '2026-10-01T12:00:00Z'; }, f => { f.basket.results[0].plan.products[0].checkedAt = '2026-10-12T12:00:00Z'; }, f => { f.basket.results[0].plan.products[0].validThrough = '2026-10-10'; }, f => { f.basket.results[0].plan.products[0].validFrom = '2026-10-12'; }, f => { f.basket.results[0].plan.products[0].priceMemberOnly = true; }, f => { f.basket.results[0].plan.products[0].offer = { validForMemberTier: 'Lidl Plus' }; }, f => { f.basket.results[0].plan.products[0].regionRestricted = true; }, f => { f.basket.results[0].plan.products[0].available = false; }]) {
    const f = fixture(); mutate(f); const saved = copy(f.state); assert.equal(preview(f).ok, false); assert.deepEqual(f.state, saved);
  }
  const f = fixture({ validFrom: '2026-10-11', validThrough: '2026-10-11' }); assert.equal(preview(f).ok, true, 'date-only offers remain valid through the whole local day');
});

test('purchase quote requires official product links, coherent quantities and matching result keys', () => {
  for (const mutate of [f => { f.basket.results[0].key = 'eggs::each'; }, f => { f.basket.items[0].quantity = 100; }, f => { f.basket.results[0].plan.requestedQuantity = null; }, f => { f.basket.results[0].plan.totalQuantity = 10; }, f => { f.basket.results[0].plan.products[0].url = 'https://www.asda.com.evil.example/product/123'; }, f => { f.basket.results[0].plan.products[0].url = 'http://www.asda.com/groceries/product/123'; }, f => { f.basket.results[0].plan.products[0].url = 'https://user:password@www.asda.com/groceries/product/123'; }, f => { f.basket.results[0].plan.products[0].packs = 1.5; }, f => { f.basket.results[0].plan.products[0].priceGBP = null; }, f => { f.basket.results[0].plan.products[0].costGBP = 8; }, f => { f.basket.results[0].plan.products[0].packUnit = 'ml'; }]) {
    const f = fixture(); mutate(f); assert.equal(preview(f).ok, false);
  }
  assert.equal(preview(fixture({ store: 'Lidl' })).ok, true);
});

test('purchase confirmation rejects edits to quantities, pantry and the refreshed quote', () => {
  for (const mutate of [f => { f.state.pantry.push({ id: 'manual', name: 'Rice', qty: 5, unit: 'g' }); }, f => { f.entries[0][1].groups.mass.remaining = 180; f.basket.items[0].quantity = 180; f.basket.results[0].plan.requestedQuantity = 180; }, f => { f.catalogue.fingerprint = 'changed'; }, f => { f.basket.results[0].plan.products[0].priceGBP = 3; f.basket.results[0].plan.products[0].costGBP = 3; f.basket.results[0].plan.totalCostGBP = 3; }]) {
    const f = fixture(), p = preview(f); mutate(f); const saved = copy(f.state); assert.equal(core.applyPurchase(f.state, p, preview(f), now).ok, false); assert.deepEqual(f.state, saved);
  }
  const f = fixture(), p = preview(f); assert.equal(core.applyPurchase(f.state, p, p, new Date(now.getTime() + 31 * 60000)).ok, false);
});

test('purchase confirmation tolerates time spent reviewing while quote freshness still expires', () => {
  const f = fixture(), p = preview(f), confirmedAt = new Date(now.getTime() + 5000), current = core.purchasePreview({ ...f, now: confirmedAt });
  assert.equal(current.ok, true, current.error); assert.equal(current.quote, p.quote); assert.equal(current.purchaseKey, p.purchaseKey); assert.notEqual(current.lots[0].purchasedAt, p.lots[0].purchasedAt);
  const result = core.applyPurchase(f.state, p, current, confirmedAt); assert.equal(result.ok, true, result.error); assert.equal(f.state.pantry[0].purchasedAt, confirmedAt.toISOString()); assert.equal(core.spentTotal(f.state), 2);
  const stale = fixture(), old = preview(stale), tooLate = new Date(now.getTime() + 31 * 60000), expired = core.purchasePreview({ ...stale, now: tooLate });
  assert.equal(expired.ok, false); assert.equal(core.applyPurchase(stale.state, old, expired, tooLate).ok, false); assert.equal(stale.state.pantry.length, 0); assert.equal(core.spentTotal(stale.state), 0);
});

test('purchase keeps standard kilograms/litres, drained edible estimates and count-labelled packs safely', () => {
  for (const [options, quantity, unit] of [ [{ packQuantity: 1, packUnit: 'kg' }, 1, 'kg'], [{ name: 'Milk', quantity: 1000, dimension: 'volume', packQuantity: 2, packUnit: 'l' }, 2, 'l'], [{ name: 'Tuna', packQuantity: 145, totalQuantity: 204, packs: 2, priceGBP: .59, costGBP: 1.18, estimatedQuantity: true, quantityBasis: 'Using 102 g drained edible contents inferred from ASDA unit prices.' }, 204, 'g'], [{ name: 'Wholemeal wrap', quantity: 3, dimension: 'each', packQuantity: 360, packUnit: 'g', totalQuantity: 6, productName: 'ASDA 6 Wholemeal Wraps', quantityBasis: '6 items declared in the product name.' }, 6, 'pieces'] ]) {
    const f = fixture(options), p = preview(f); assert.equal(p.ok, true, p.error); assert.equal(p.lots[0].qty, quantity); assert.equal(p.lots[0].unit, unit);
  }
  const invalid = fixture({ name: 'Rice', packQuantity: 500, totalQuantity: 600, estimatedQuantity: true }); assert.equal(preview(invalid).ok, false, 'quantity estimates require their visible basis');
  const cucumber = fixture({ name: 'Cucumber', quantity: 100, packQuantity: 1, packUnit: 'pieces', totalQuantity: 300, estimatedQuantity: true, quantityBasis: 'Cucumber estimated at 300 g each.' });
  const p = preview(cucumber); assert.equal(p.ok, true, p.error); assert.equal(p.lots[0].qty, 1); assert.equal(budget.unitMeta(p.lots[0].unit, p.lots[0].name).factor, 300);
});

test('real catalogue pack-plan responses produce usable pantry stock for drained tins, wraps and loose produce', () => {
  for (const [name, quantity, dimension, wantedDimension, product, expected] of [
    ['Tuna', 145, 'mass', 'mass', { name: 'ASDA Tuna Chunks in Brine 145g', packQuantity: 145, packUnit: 'g', packSize: '145g', price: .59, pricePerUnit: 5.78431, pricePerUnitLabel: '£5.78431/KG', category: 'Food cupboard > Tinned Fish > Tuna' }, 204],
    ['Wholemeal wrap', 3, 'each', 'count', { name: 'ASDA 6 Wholemeal Wraps', packQuantity: 360, packUnit: 'g', packSize: '360g', price: 1.1, category: 'Bakery > Wraps' }, 6],
    ['Cucumber', 100, 'mass', 'mass', { name: 'ASDA Cucumber', packQuantity: 1, packUnit: 'pieces', packSize: 'each', price: .89, category: 'Fresh Fruit & Vegetables > Salad' }, 300],
  ]) {
    const f = fixture({ name, quantity, dimension }), plan = calculatePackPurchase([{ ...product, checkedAt: now.toISOString(), url: 'https://www.asda.com/groceries/product/fixture/123456' }], quantity, wantedDimension);
    assert.ok(plan); f.basket.results[0].plan = plan; f.basket.results[0].match = plan.products[0]; const p = preview(f); assert.equal(p.ok, true, p.error);
    assert.equal(p.lots.reduce((sum, lot) => sum + lot.qty * budget.unitMeta(lot.unit, lot.name).factor, 0), expected);
  }
});

test('fractional optimizer portions retain full precision through shopping and purchase confirmation', () => {
  const potato = { id: 'potato-dinner', name: 'Potato dinner', cat: 'Dinner', servings: 1, ings: [['Potato', 700, 'g']] }, portions = .667585429118;
  const s = state({ week: [{ day: 'Monday', meals: [potato.id] }], mealServings: { 'Monday::0': portions }, shopping: { potato: true } });
  const direct = budget.buildShopping({ week: s.week, recipes: [potato], mealServings: s.mealServings, people: 1 }), actual = shopping(s, [potato]);
  assert.equal(core.shoppingInput(s, [potato], now).mealServings['Monday::0'], portions); assert.equal(actual.potato.groups.mass.remaining, direct.potato.groups.mass.remaining);
  const quantity = actual.potato.groups.mass.remaining, plan = calculatePackPurchase([{ name: 'ASDA Potatoes 1kg', category: 'Fresh Fruit & Vegetables > Potatoes', packQuantity: 1000, packUnit: 'g', packSize: '1kg', price: 1.29, checkedAt: now.toISOString(), url: 'https://www.asda.com/groceries/product/fixture/123456' }], quantity, 'mass');
  const f = fixture({ name: 'Potato', quantity }); f.state = s; f.entries = Object.entries(actual); f.basket.results[0].plan = plan; f.basket.results[0].match = plan.products[0];
  let p = preview(f); assert.equal(p.ok, true, p.error); assert.equal(core.applyPurchase(s, p, preview(f), now).ok, true); assert.equal(s.pantry[0].qty, 1000);
  const floating = fixture({ name: 'Potato', quantity }); floating.basket.results[0].plan.requestedQuantity += .0004;
  p = preview(floating); assert.equal(p.ok, true, p.error); floating.basket.items[0].quantity += .0004; assert.equal(preview(floating).ok, false, 'the live basket item identity still compares raw quantities strictly');
});

test('mixed-pack purchase adds each pack line once and rejects duplicate checked rows', () => {
  const f = fixture({ quantity: 750 }), product = f.basket.results[0].plan.products[0];
  f.basket.results[0].plan = { requestedQuantity: 750, totalQuantity: 800, totalCostGBP: 3, products: [product, { ...product, packQuantity: 300, packSize: '300g', totalQuantity: 300, priceGBP: 1, costGBP: 1 }] };
  const p = preview(f); assert.equal(p.ok, true, p.error); assert.equal(p.lots.length, 2); assert.equal(core.applyPurchase(f.state, p, p, now).ok, true); assert.equal(f.state.pantry.reduce((sum, lot) => sum + lot.qty, 0), 800); assert.equal(core.spentTotal(f.state), 3);
  const duplicate = fixture(); duplicate.entries.push(duplicate.entries[0]); assert.equal(preview(duplicate).ok, false); assert.equal(duplicate.state.pantry.length, 0);
});

test('cash spend survives regeneration and stock changes; only an explicit new week resets current-plan spend', () => {
  const f = fixture(), p = preview(f); core.applyPurchase(f.state, p, p, now); const id = f.state.pantryLedger.planId;
  f.state.week = [{ day: 'Monday', meals: ['eggs'] }]; core.initialise(f.state, now); assert.equal(f.state.pantryLedger.planId, id); assert.equal(core.spentTotal(f.state), 2);
  f.state.pantry[0].qty = 0; assert.equal(core.spentTotal(f.state), 2); assert.equal(core.canUndo(f.state, f.state.pantryLedger.transactions[0].id).ok, false);
  core.resetPlan(f.state, now); assert.notEqual(f.state.pantryLedger.planId, id); assert.equal(core.spentTotal(f.state), 0); assert.equal(core.spentTotal(f.state, { planOnly: false }), 2); assert.equal(f.state.pantryLedger.transactions.length, 1);
});

test('unknown historical purchase amounts are never represented as a complete known spend', () => {
  const s = state(); s.pantryLedger.transactions.push({ id: 'legacy', planId: s.pantryLedger.planId, type: 'purchase', totalCostGBP: null });
  assert.deepEqual(core.spentSummary(s), { totalCostGBP: 0, known: false, purchases: 1 });
});

test('recording cooking deducts measured stock in earliest-expiry order and removes cooked demand only', () => {
  const s = state({ pantry: [{ id: 'later', name: 'Rice', qty: 1, unit: 'kg', expiry: '2026-10-15' }, { id: 'soon', name: 'Rice', qty: 50, unit: 'g', expiry: '2026-10-11' }] });
  const p = core.cookPreview(s, [rice], { day: 'Monday', index: 0, now }); assert.equal(p.ok, true); assert.deepEqual(p.allocations.map(row => [row.id, row.used]), [['soon', 50], ['later', .05]]); assert.equal(p.missing.length, 0); assert.equal(p.requirements.length, 1, 'tap water needs no pantry stock');
  const result = core.applyCook(s, [rice], p, { now }); assert.equal(result.ok, true); assert.equal(s.pantry.find(row => row.id === 'soon').qty, 0); assert.equal(s.pantry.find(row => row.id === 'later').qty, .95);
  assert.equal(core.cookedPortions(s, 'Monday', 0, [rice]), 1); assert.equal(shopping(s).rice, undefined, 'remaining stock covers the uncooked Tuesday demand');
  const inputs = core.shoppingInput(s, [rice], now); assert.deepEqual(inputs.week.map(day => day.meals), [[], ['rice']]); assert.equal(inputs.mealServings['Tuesday::0'], 1);
  assert.equal(core.cookPreview(s, [rice], { day: 'Monday', index: 0, now }).ok, false); assert.equal(core.applyCook(s, [rice], p, { now }).ok, false);
  assert.equal(core.undo(s, result.transaction.id, now).ok, true); assert.equal(s.pantry.find(row => row.id === 'soon').qty, 50); assert.equal(core.cookedPortions(s, 'Monday', 0, [rice]), 0);
});

test('missing and incompatible stock require confirmation while expired stock is never consumed', () => {
  const s = state({ pantry: [{ id: 'expired', name: 'Rice', qty: 200, unit: 'g', expiry: '2026-10-10' }, { id: 'different-unit', name: 'Rice', qty: 1000, unit: 'ml' }, { id: 'invalid-date', name: 'Rice', qty: 100, unit: 'g', expiry: '2026-02-30' }] });
  const p = core.cookPreview(s, [rice], { day: 'Monday', index: 0, now }); assert.equal(p.allocations.length, 0); assert.deepEqual(p.missing, [{ name: 'Rice', qty: 100, unit: 'g' }]); const before = copy(s);
  assert.equal(core.applyCook(s, [rice], p, { now }).ok, false); assert.deepEqual(s, before);
  assert.equal(core.applyCook(s, [rice], p, { confirmMissing: true, now }).ok, true); assert.deepEqual(s.pantry, before.pantry); assert.equal(core.cookedPortions(s, 'Monday', 0, [rice]), 1); assert.equal(shopping(s).rice.groups.mass.need, 100);
});

test('cooking preview is invalidated by recipe, portion, stock edits and stock expiring at midnight', () => {
  for (const mutate of [s => { s.mealServings['Monday::0'] = 2; }, s => { s.pantry[0].qty = 500; }, s => { s.week[0].meals[0] = 'eggs'; }]) {
    const s = state({ pantry: [{ id: 'rice-stock', name: 'Rice', qty: 200, unit: 'g' }] }), p = core.cookPreview(s, [rice, eggs], { day: 'Monday', index: 0, now }); mutate(s); const saved = copy(s);
    assert.equal(core.applyCook(s, [rice, eggs], p, { now }).ok, false); assert.deepEqual(s, saved);
  }
  const s = state({ pantry: [{ id: 'rice-stock', name: 'Rice', qty: 200, unit: 'g', expiry: '2026-10-11' }] }), p = core.cookPreview(s, [rice], { day: 'Monday', index: 0, now });
  assert.equal(core.applyCook(s, [{ ...rice, ings: [['Rice', 200, 'g']] }], p, { now }).ok, false);
  assert.equal(core.applyCook(s, [rice], p, { now: new Date('2026-10-12T12:00:00Z') }).ok, false); assert.equal(s.pantry[0].qty, 200);
});

test('partial cooking, extra portions and compacted shopping slots preserve exact remaining requirements', () => {
  const s = state({ week: [{ day: 'Monday', meals: ['rice', 'eggs'] }], mealServings: { 'Monday::0': 2, 'Monday::1': 1 }, pantry: [{ id: 'rice-stock', name: 'Rice', qty: 300, unit: 'g' }] });
  const p = core.cookPreview(s, [rice, eggs], { day: 'Monday', index: 0, portions: 1, extraServings: .5, now }); assert.equal(p.preparedServings, 1.5); assert.equal(p.requirements[0].qty, 150);
  assert.equal(core.applyCook(s, [rice, eggs], p, { now }).ok, true); assert.equal(s.leftovers[0].servings, .5); assert.equal(core.plannerCoverage(s, [rice, eggs], now)['Monday::0'].remainingPortions, .5);
  const input = core.shoppingInput(s, [rice, eggs], now); assert.deepEqual(input.week[0].meals, ['rice', 'eggs']); assert.equal(input.mealServings['Monday::0'], .5); assert.equal(input.mealServings['Monday::1'], 1);
  s.pantryLedger.cooked[core.slotKey(s, 'Monday', 0)].servings = 2;
  const compact = core.shoppingInput(s, [rice, eggs], now); assert.deepEqual(compact.week[0].meals, ['eggs']); assert.equal(compact.mealServings['Monday::0'], 1); assert.equal(compact.mealServings['Monday::1'], undefined);
});

test('fixed batch cooking deducts a complete batch and saves the uneaten portions for later meals', () => {
  const tub = { ...rice, id: 'tub', name: 'Frozen rice bowl', servings: 2, fixedBatch: true, ings: [['Rice', 240, 'g']] };
  const s = state({ week: [{ day: 'Monday', meals: ['tub'] }, { day: 'Tuesday', meals: ['tub'] }], pantry: [{ id: 'rice-stock', name: 'Rice', qty: 240, unit: 'g' }] });
  const p = core.cookPreview(s, [tub], { day: 'Monday', index: 0, storage: 'Freezer', now }); assert.equal(p.requirements[0].qty, 240); assert.equal(p.preparedServings, 2); assert.equal(p.leftoverServings, 1);
  const cooked = core.applyCook(s, [tub], p, { now }); assert.equal(cooked.ok, true); assert.equal(s.pantry[0].qty, 0); assert.equal(s.leftovers[0].servings, 1); assert.equal(s.leftovers[0].storage, 'Freezer'); assert.deepEqual(shopping(s, [tub]), {});
  const served = core.useLeftover(s, [tub], { day: 'Tuesday', index: 0, leftoverId: s.leftovers[0].id, portions: 1, expectedRevision: core.revision(s, [tub]), now }); assert.equal(served.ok, true); assert.equal(s.leftovers[0].servings, 0); assert.equal(core.cookedPortions(s, 'Tuesday', 0, [tub]), 1);
  assert.equal(core.canUndo(s, cooked.transaction.id).ok, false, 'cannot restore ingredients while its leftovers were eaten');
  assert.equal(core.undo(s, served.transaction.id, now).ok, true); assert.equal(s.leftovers[0].servings, 1); assert.equal(core.undo(s, cooked.transaction.id, now).ok, true); assert.equal(s.pantry[0].qty, 240); assert.equal(s.leftovers.length, 0);
});

test('coverage reserves each matching available leftover lot once and excludes stale recipes, dates and stocks', () => {
  const s = state({ week: [{ day: 'Monday', meals: ['rice'] }, { day: 'Tuesday', meals: ['rice'] }, { day: 'Wednesday', meals: ['rice'] }], mealServings: { 'Monday::0': 2, 'Tuesday::0': 2, 'Wednesday::0': 2 }, leftovers: [leftover('later', 2, rice, { expiry: '2026-10-15' }), leftover('soon', 1, rice, { expiry: '2026-10-11' }), leftover('expired', 99, rice, { expiry: '2026-10-10' }), leftover('bad-date', 99, rice, { expiry: '2026-02-30' }), leftover('edited', 99, { ...rice, kcal: 700 }), leftover('other', 99, eggs), leftover('empty', 0)] });
  const coverage = core.plannerCoverage(s, [rice, eggs], now); assert.deepEqual(Object.values(coverage).map(item => item.leftoverPortions), [2, 1, 0]); assert.deepEqual(coverage['Monday::0'].leftoverReservations, [{ leftoverId: 'soon', servings: 1 }, { leftoverId: 'later', servings: 1 }]);
  assert.equal(shopping(s, [rice, eggs]).rice.groups.mass.need, 300); assert.equal(s.leftovers[0].servings, 2, 'reservation is read-only until portions are served');
});

test('serving leftovers never deducts raw stock twice and rejects stale revisions, mismatches and duplicates', () => {
  const s = state({ pantry: [{ id: 'rice-stock', name: 'Rice', qty: 1000, unit: 'g' }], leftovers: [leftover('rice-leftover', 1)] }), options = { day: 'Monday', index: 0, leftoverId: 'rice-leftover', portions: 1, expectedRevision: core.revision(s, [rice]), now };
  const result = core.useLeftover(s, [rice], options); assert.equal(result.ok, true); assert.equal(s.pantry[0].qty, 1000); assert.equal(s.leftovers[0].servings, 0); assert.equal(core.useLeftover(s, [rice], options).ok, false);
  assert.equal(core.undo(s, result.transaction.id, now).ok, true); assert.equal(s.leftovers[0].servings, 1); assert.equal(core.useLeftover(s, [{ ...rice, ings: [['Rice', 50, 'g']] }], { ...options, expectedRevision: undefined }).ok, false);
  assert.equal(core.useLeftover(s, [rice], { ...options, portions: 2, expectedRevision: undefined }).ok, false);
  s.leftovers[0].expiry = '2026-10-10'; assert.equal(core.useLeftover(s, [rice], { ...options, expectedRevision: undefined }).ok, false);
});

test('cooking a changed slot does not inherit served portions from the previous recipe', () => {
  const s = state({ pantry: [{ id: 'rice-stock', name: 'Rice', qty: 200, unit: 'g' }, { id: 'eggs-stock', name: 'Eggs', qty: 6, unit: 'pieces' }] });
  core.applyCook(s, [rice, eggs], core.cookPreview(s, [rice, eggs], { day: 'Monday', index: 0, now }), { now }); s.week[0].meals[0] = 'eggs';
  assert.equal(core.cookedPortions(s, 'Monday', 0, [rice, eggs]), 0); const cooked = core.applyCook(s, [rice, eggs], core.cookPreview(s, [rice, eggs], { day: 'Monday', index: 0, now }), { now });
  assert.equal(cooked.ok, true); assert.equal(core.cookedPortions(s, 'Monday', 0, [rice, eggs]), 1); assert.equal(s.pantry.find(lot => lot.id === 'eggs-stock').qty, 4);
});

test('expiry editing and use-up suggestions validate dates, match units and use London calendar days', () => {
  const s = state({ pantry: [{ id: 'rice-stock', name: 'Rice', qty: 200, unit: 'g' }, { id: 'eggs-stock', name: 'Eggs', qty: 4, unit: 'pieces', expiry: '2026-10-12' }] });
  assert.equal(core.setExpiry(s, 'rice-stock', '2026-02-30').ok, false); assert.equal(core.setExpiry(s, 'rice-stock', '2026-10-11').ok, true); assert.equal(core.expired(s.pantry[0], now), false); assert.equal(core.expired(s.pantry[0], new Date('2026-10-12T00:00:00Z')), true);
  assert.equal(core.today(new Date('2026-10-10T23:30:00Z')), '2026-10-11'); assert.ok(core.recipeUseUpScore(rice, s.pantry, now) > 0); assert.ok(core.recipeUseUpScore(eggs, s.pantry, now) > 0); assert.equal(core.recipeUseUpScore({ ...rice, ings: [['Rice', 200, 'ml']] }, s.pantry, now), 0);
  assert.equal(core.setExpiry(s, 'rice-stock', '').ok, true); assert.equal(core.recipeUseUpScore(rice, s.pantry, now), 0);
});

test('recipes without a valid yield or ingredient amounts cannot deduct pantry stock', () => {
  for (const recipe of [{ ...rice, servings: 0 }, { ...rice, servings: null }, { ...rice, servings: '' }, { ...rice, ings: [['Rice', null, 'g']] }, { ...rice, ings: [['Rice', 'a handful', 'g']] }, { ...rice, ings: [null] }, { ...rice, ings: [] }]) assert.equal(core.requiredIngredients(recipe, 1).ok, false);
  assert.equal(core.requiredIngredients(rice, 0).ok, false); assert.equal(core.requiredIngredients(rice, Infinity).ok, false);
});

test('pantry UI opens visible confirmation sheets and removes only the undone cook history event', async () => {
  const ui = await readFile(new URL('../public/pantry-ui.js', import.meta.url), 'utf8');
  const elements = Object.fromEntries(['modal', 'sheet'].map(id => [id, { innerHTML: '', style: {} }])), s = state({ pantry: [{ id: 'rice-stock', name: 'Rice', qty: 300, unit: 'g' }], recentMeals: [{ transactionId: 'unrelated', recipeId: 'rice' }] });
  const messages = [], context = { PantryCore: core, state: s, recipes: [rice], document: { getElementById: id => elements[id] }, save() {}, closeModal() { elements.modal.style.display = 'none'; }, renderAll() {}, toast: message => messages.push(message), RecipeExperience: { recordCook(target, recipe, event) { target.recentMeals.push({ recipeId: recipe.id, ...event }); } } };
  vm.runInNewContext(ui, context); context.PantryUI.openCook('Monday', 0); assert.equal(elements.modal.style.display, 'flex'); assert.match(elements.sheet.innerHTML, /Confirm cooking/);
  context.PantryUI.confirmCook(false); assert.equal(elements.modal.style.display, 'none'); assert.equal(s.recentMeals.length, 2); const transaction = s.pantryLedger.transactions[0];
  context.PantryUI.undo(transaction.id); assert.equal(s.recentMeals.length, 1); assert.equal(s.recentMeals[0].transactionId, 'unrelated'); assert.equal(s.pantry[0].qty, 300); assert.match(messages.at(-1), /undone/);
});
