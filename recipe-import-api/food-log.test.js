import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/food-log-core.js';
const core = globalThis.FoodLogCore;
const date = '2026-10-11';
const label = { name: 'Snack bar', quantity: 100, unit: 'g', nutrition: { kcal: 400, p: 10, c: 50, f: 18, source: 'label' } };

test('food diary scales label quantities and combines snacks without counting the planned menu', () => {
  const state = { profile: { people: 4 }, week: [{ day: 'Monday', meals: ['dinner'] }], pantry: [{ name: 'Rice', qty: 500 }] };
  const plan = JSON.stringify(state.week), stock = JSON.stringify(state.pantry);
  core.record(state, { date, food: label, quantity: 25 }, { id: 'snack' });
  core.record(state, { date, food: { name: 'Dinner portion', unit: 'portion', quantity: 1, nutrition: { kcal: 600, p: 40, c: 70, f: 18, source: 'recipe' } }, quantity: 1.5 }, { id: 'meal' });
  const result = core.summary(state, date);
  assert.equal(result.totals.kcal, 1000); assert.equal(result.totals.p, 62.5);
  assert.equal(result.estimated, true);
  assert.equal(JSON.stringify(state.week), plan); assert.equal(JSON.stringify(state.pantry), stock);
  assert.equal(core.summary(state, '2026-10-12').totals.kcal, 0);
});

test('unknown macros remain explicitly incomplete and missing calories cannot become zero', () => {
  const state = {};
  core.record(state, { date, food: { ...label, nutrition: { kcal: 200, p: null, c: '', source: 'label' } }, quantity: 100 });
  const result = core.summary(state, date);
  assert.equal(result.missing.p, 1); assert.equal(result.missing.c, 1); assert.equal(result.missing.f, 1);
  assert.equal(result.totals.kcal, 200);
  for (const kcal of [null, '', undefined, NaN, Infinity, -2]) assert.throws(() => core.scaled({ ...label, nutrition: { kcal } }, 1), /calories/);
  assert.equal(core.scaled({ ...label, nutrition: { kcal: 0, p: 0, c: 0, f: 0 } }, 50).kcal, 0);
});

test('logging the same planned meal twice rejects duplication while editing replaces its entry', () => {
  const state = {}, row = { date, food: label, quantity: 25, originKey: 'plan::Monday::0' };
  core.record(state, row, { id: 'one' });
  assert.throws(() => core.record(state, row, { id: 'two' }), /already logged/);
  core.record(state, { ...row, id: 'one', quantity: 50 });
  assert.equal(state.foodLog.length, 1); assert.equal(core.summary(state, date).totals.kcal, 200);
  core.record(state, { ...row, date: '2026-10-12' }, { id: 'two' });
  assert.equal(state.foodLog.length, 2);
});

test('historical nutrition is a snapshot, even after recipe or label edits and backup restore', () => {
  const state = {}, food = structuredClone(label);
  core.saveFood(state, food, { id: 'saved' });
  const row = core.record(state, { date, food, quantity: 50 }, { id: 'log' });
  food.nutrition.kcal = 900; row.nutrition.kcal = 800; state.savedFoods[0].nutrition.kcal = 800;
  assert.equal(core.summary(state, date).totals.kcal, 200);
  const restored = core.normalizeState(JSON.parse(JSON.stringify(state)));
  assert.equal(core.summary(restored, date).totals.kcal, 200);
  assert.equal(restored.savedFoods[0].nutrition.kcal, 800);
});

test('valid dated history survives malformed imports, duplicate IDs and duplicate meal references', () => {
  const state = {};
  core.record(state, { date, food: label, quantity: 50, originKey: 'meal' }, { id: 'valid' });
  state.foodLog.push({ ...state.foodLog[0] }, { ...state.foodLog[0], id: 'duplicate' }, { ...state.foodLog[0], id: 'bad-date', date: '2026-02-30' }, { id: 'missing-food', date }, null);
  state.savedFoods = [{ ...label, id: 'saved' }, { ...label, id: 'bad', nutrition: { kcal: null } }];
  core.normalizeState(state);
  assert.equal(state.foodLog.length, 1); assert.equal(state.savedFoods.length, 1);
  assert.equal(core.validDate('2024-02-29'), true); assert.equal(core.validDate('2026-02-29'), false);
  for (const amount of [0, -1, null, '', Infinity]) assert.throws(() => core.scaled(label, amount), /amount/);
});
