import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/food-log-core.js';
const Stock = globalThis.PantryCore, Diary = globalThis.FoodLogCore;
const now = new Date('2026-10-13T12:00:00Z');
const copy = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const state = { profile: { people: 1, budget: 35 }, week: [{ day: 'Monday', meals: ['oats'] }],
    pantry: [{ id: 'milk', name: 'Milk', qty: 1000, unit: 'ml', place: 'Fridge', expiry: '2026-10-17', store: 'Asda', estimated: false,
      product: { name: 'Milk 1L', packs: 1, packSize: '1L', priceGBP: 1.4, url: 'https://www.asda.com/groceries/product/milk/1' } }],
    leftovers: [], foodLog: [], shopping: { milk: true } };
  Stock.initialise(state, now);
  state.pantryLedger.transactions.push({ id: 'paid', type: 'purchase', planId: state.pantryLedger.planId, totalCostGBP: 1.4,
    changes: [{ collection: 'pantry', id: 'milk', before: null, after: copy(state.pantry[0]) }], createdAt: now.toISOString() });
  return state;
}
const patch = state => ({ id: 'milk', qty: 600, place: 'Fridge', expiry: '2026-10-17', reason: 'Used outside the plan', expected: Stock.stockSnapshot(state.pantry[0]) });

test('stock quantity corrections retain pack provenance, paid costs and all plan/diary records', () => {
  const state = fixture(), before = copy(state), result = Stock.adjustStock(state, patch(state), now);
  assert.equal(result.ok, true); assert.equal(state.pantry[0].qty, 600);
  for (const key of ['id', 'name', 'unit', 'store', 'product', 'estimated']) assert.deepEqual(state.pantry[0][key], before.pantry[0][key]);
  for (const key of ['week', 'profile', 'foodLog', 'leftovers', 'shopping']) assert.deepEqual(state[key], before[key]);
  assert.equal(Stock.spentTotal(state), 1.4); assert.equal(Stock.canUndo(state, 'paid').ok, false);
  assert.equal(Stock.undo(state, result.transaction.id, now).ok, true); assert.deepEqual(state.pantry, before.pantry);
  assert.equal(Stock.canUndo(state, 'paid').ok, true); assert.equal(Stock.spentTotal(state), 1.4);
});
test('zero stock is an explicit valid correction, with unchanged unit and a recoverable record', () => {
  const state = fixture(), result = Stock.adjustStock(state, { ...patch(state), qty: 0, reason: 'Thrown away' }, now);
  assert.equal(result.ok, true); assert.equal(Stock.activePantry(state.pantry, now).length, 0);
  assert.equal(Stock.browseStock(state.pantry, { status: 'empty' }, now)[0].unit, 'ml');
  assert.equal(Stock.undo(state, result.transaction.id, now).ok, true); assert.equal(state.pantry[0].qty, 1000);
});
test('invalid stock edits and stale review snapshots make no mutations', () => {
  for (const changes of [{ qty: -1 }, { qty: '' }, { qty: null }, { qty: Infinity }, { qty: 1000001 }, { place: 'Cupboard maybe' }, { expiry: '2026-02-30' }, { reason: 'invalid' }, { expected: 'outdated' }]) {
    const state = fixture(), before = copy(state);
    assert.equal(Stock.adjustStock(state, { ...patch(state), ...changes }, now).ok, false);
    assert.deepEqual(state, before);
  }
  const state = fixture(), reviewed = patch(state); state.pantry[0].qty = 500; const before = copy(state);
  assert.equal(Stock.adjustStock(state, reviewed, now).ok, false); assert.deepEqual(state, before);
});
test('stock removals restore the original position and are blocked from undo after a conflicting item reappears', () => {
  const state = fixture(); state.pantry.push({ id: 'rice', name: 'Rice', qty: 500, unit: 'g', place: 'Pantry' });
  const before = copy(state.pantry), result = Stock.removeStock(state, 'milk', 'pantry', now);
  assert.equal(result.ok, true); assert.deepEqual(state.pantry.map(row => row.id), ['rice']); assert.equal(Stock.spentTotal(state), 1.4);
  state.pantry.push({ ...before[0], qty: 200 }); assert.equal(Stock.canUndo(state, result.transaction.id).ok, false);
  state.pantry.pop(); assert.equal(Stock.undo(state, result.transaction.id, now).ok, true); assert.deepEqual(state.pantry, before);
  assert.equal(Stock.undo(state, result.transaction.id, now).ok, false);
});
test('leftover removal and undo preserve the measured recipe snapshot and original cooked record', () => {
  const state = fixture(); state.leftovers = [{ id: 'leftover', recipeId: 'oats', recipeSnapshot: { name: 'Prepared oats', ings: [['Oats', 40, 'g']] }, recipeSignature: 'measured', servings: 2, storage: 'Freezer', expiry: '2026-11-01' }];
  state.pantryLedger.cooked = { slot: { recipeId: 'oats', servings: 1 } }; const before = copy(state);
  const result = Stock.removeStock(state, 'leftover', 'leftovers', now);
  assert.equal(result.ok, true); assert.equal(state.leftovers.length, 0); assert.deepEqual(state.pantryLedger.cooked, before.pantryLedger.cooked);
  assert.equal(Stock.undo(state, result.transaction.id, now).ok, true); assert.deepEqual(state.leftovers, before.leftovers);
});
test('a subsequent stock correction must be undone before earlier stock activity', () => {
  const state = fixture(), first = Stock.adjustStock(state, patch(state), now);
  const second = Stock.adjustStock(state, { ...patch(state), qty: 300 }, now);
  assert.equal(Stock.canUndo(state, first.transaction.id).ok, false);
  assert.equal(Stock.undo(state, second.transaction.id, now).ok, true);
  assert.equal(Stock.undo(state, first.transaction.id, now).ok, true); assert.equal(state.pantry[0].qty, 1000);
});
test('stock filters respect London dates, unknown dates, empty stock and accent-insensitive search', () => {
  const rows = [
    { id: 'expired', name: 'Chicken', qty: 100, place: 'Fridge', expiry: '2026-10-13' },
    { id: 'soon', name: 'Śmietana', qty: 100, place: 'Fridge', expiry: '2026-10-15', product: { name: 'Polish sour cream' } },
    { id: 'invalid', name: 'Tomato', qty: 100, place: 'Fridge', expiry: '2026-02-30' },
    { id: 'blank', name: 'Oats', qty: 500, place: 'Pantry' },
    { id: 'empty', name: 'Tuna', qty: 0, place: 'Pantry' },
  ];
  const midnight = new Date('2026-10-13T23:30:00Z'), before = copy(rows);
  assert.equal(Stock.today(midnight), '2026-10-14');
  assert.deepEqual(Stock.browseStock(rows, { status: 'attention' }, midnight).map(row => row.id), ['invalid', 'expired']);
  assert.equal(Stock.browseStock(rows, { status: 'soon', query: 'smietana', place: 'Fridge' }, midnight)[0].id, 'soon');
  assert.equal(Stock.browseStock(rows, { query: 'sour cream' }, midnight)[0].id, 'soon');
  assert.equal(Stock.browseStock(rows, { status: 'undated' }, midnight)[0].id, 'blank');
  assert.equal(Stock.browseStock(rows, { status: 'empty' }, midnight)[0].id, 'empty');
  assert.equal(Stock.browseStock(rows, {}, midnight).length, 4); assert.deepEqual(rows, before);
});
const label = { name: 'Snack bar', quantity: 100, unit: 'g', nutrition: { kcal: 400, p: 10, c: 50, f: null, source: 'label' } };
test('recent diary foods use frozen values and amounts while deduplicating identical food definitions', () => {
  const state = {};
  Diary.record(state, { date: '2026-10-12', food: label, quantity: 25 }, { id: 'first' });
  Diary.record(state, { date: '2026-10-13', food: label, quantity: 40 }, { id: 'last' });
  Diary.saveFood(state, { ...label, nutrition: { ...label.nutrition, kcal: 900 } }, { id: 'changed-label' });
  const before = copy(state), recent = Diary.recentFoods(state);
  assert.equal(recent.length, 1); assert.equal(recent[0].id, 'last'); assert.equal(recent[0].quantity, 40);
  assert.equal(recent[0].food.nutrition.kcal, 400); assert.equal(recent[0].food.nutrition.f, null);
  recent[0].food.nutrition.kcal = 1000; assert.deepEqual(state, before);
});
test('different recorded nutrient versions stay distinct, invalid history is skipped and shortcuts carry no planned-meal reference', () => {
  const state = {};
  Diary.record(state, { date: '2026-10-12', food: label, quantity: 25, originKey: 'plan::Monday::0' }, { id: 'old' });
  Diary.record(state, { date: '2026-10-13', food: { ...label, nutrition: { ...label.nutrition, kcal: 500 } }, quantity: 30 }, { id: 'new' });
  state.foodLog.push(null, { id: 'invalid', date: '2026-10-13', food: { ...label, nutrition: { kcal: null } }, quantity: 10 });
  const recent = Diary.recentFoods(state, 2); assert.deepEqual(recent.map(row => row.id), ['new', 'old']); assert.equal(recent[1].originKey, undefined);
  Diary.normalizeState(state);
  Diary.record(state, { date: '2026-10-13', food: recent[1].food, quantity: recent[1].quantity }, { id: 'repeat' });
  assert.equal(state.foodLog.find(row => row?.id === 'repeat').nutrition.kcal, 100);
});
test('diary date shortcuts handle leap years, month boundaries and daylight-saving changes as calendar days', () => {
  assert.equal(Diary.shiftDate('2024-02-28', 1), '2024-02-29');
  assert.equal(Diary.shiftDate('2026-03-01', -1), '2026-02-28');
  assert.equal(Diary.shiftDate('2026-10-25', 1), '2026-10-26');
  assert.equal(Diary.shiftDate('2026-12-31', 1), '2027-01-01');
  for (const [date, offset] of [['2026-02-30', 1], ['2026-01-01', 1.5], ['2026-01-01', 367]]) assert.throws(() => Diary.shiftDate(date, offset));
});
