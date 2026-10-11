import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlannerRequest } from './planner-request.js';
import { plannerShoppingInput } from './budget-planner.js';
import '../public/pantry-core.js';
const core = globalThis.MealBudgetCore;
const recipes = [{ id: 'rice', name: 'Rice plate', cat: 'Lunch', servings: 1, ings: [['Rice', 100, 'g']], nutrition: { kcal: 500, p: 40, complete: true } },
  { id: 'tub', name: 'Frozen oat tub', cat: 'Dinner', servings: 2, fixedBatch: true, ings: [['Oats', 100, 'g']], nutrition: { kcal: 500, p: 40, complete: true } }];
const plan = () => ({ week: [{ day: 'Monday', meals: ['rice', 'tub'] }, { day: 'Tuesday', meals: ['rice', 'tub'] }], mealServings: {} });
test('cooking records force the original planned slot to stay locked', () => {
  const normalized = normalizePlannerRequest({ profile: { days: 2, meals: 2, people: 1 }, recipes, ...plan(), cookedMeals: { 'Monday::0': { recipeId: 'rice', servings: 1 } } });
  assert.equal(normalized.locked['Monday::0'], true);
  assert.equal(normalized.cookedMeals['Monday::0'].servings, 1);
});
test('malformed, mismatched or overdrawn cooking and leftover records are rejected', () => {
  for (const cookedMeals of [[], { 'Wednesday::0': { recipeId: 'rice', servings: 1 } }, { 'Monday::0': { recipeId: 'tub', servings: 1 } }, { 'Monday::0': { recipeId: 'rice', servings: 2 } }, { 'Monday::0': { recipeId: 'rice', servings: -1 } }]) {
    assert.throws(() => normalizePlannerRequest({ recipes, ...plan(), cookedMeals }));
  }
  for (const leftovers of [[{ id: 'same', recipeId: 'rice', servings: 1 }, { id: 'same', recipeId: 'rice', servings: 2 }], [{ id: 'one', recipeId: 'unknown', servings: 1 }], [{ id: 'one', recipeId: 'rice', servings: null }]]) {
    assert.throws(() => normalizePlannerRequest({ recipes, ...plan(), leftovers }));
  }
});
test('cooked meals retain full nutrition portions while new shopping omits their ingredients', () => {
  const original = plan();
  const shopping = core.buildShopping(plannerShoppingInput(original, recipes, 1, [], { cookedMeals: { 'Monday::0': { recipeId: 'rice', servings: 1 } } }));
  assert.equal(shopping.rice.groups.mass.need, 100);
  assert.deepEqual(original, plan());
});
test('matching leftovers are allocated exactly once before complete batch rounding', () => {
  const original = plan();
  const shopping = core.buildShopping(plannerShoppingInput(original, recipes, 1, [], { cookedMeals: { 'Monday::1': { recipeId: 'tub', servings: 1 } }, leftovers: [{ id: 'tub-left', recipeId: 'tub', servings: 1 }, { id: 'rice-left', recipeId: 'rice', servings: .5 }] }));
  assert.equal(shopping.oats, undefined, 'one cooked serving and one stored serving cover both tub meals');
  assert.equal(shopping.rice.groups.mass.need, 150);
  const noStoredTub = core.buildShopping(plannerShoppingInput(original, recipes, 1, [], { cookedMeals: { 'Monday::1': { recipeId: 'tub', servings: 1 } } }));
  assert.equal(noStoredTub.oats.groups.mass.need, 100, 'one remaining portion requires a full two-serving batch');
});
test('prospective recipe changes cannot spend leftover portions for another dish', () => {
  const original = plan(); original.week[0].meals[0] = 'tub';
  const shopping = core.buildShopping(plannerShoppingInput(original, recipes, 1, [], { leftovers: [{ id: 'rice-left', recipeId: 'rice', servings: 1 }] }));
  assert.equal(shopping.rice, undefined);
  assert.equal(shopping.oats.groups.mass.need, 200);
});
test('worker and browser lifecycle shopping agree after cooked and leftover portions', () => {
  const state = { ...plan(), profile: { people: 1 }, pantry: [{ name: 'Rice', qty: .05, unit: 'kg' }], leftovers: [], shopping: {} };
  globalThis.PantryCore.initialise(state);
  state.pantryLedger.cooked[globalThis.PantryCore.slotKey(state, 'Monday', 0)] = { recipeId: 'rice', recipeSignature: globalThis.PantryCore.recipeSignature(recipes[0]), servings: .5 };
  state.leftovers = [{ id: 'oat-extra', recipeId: 'tub', recipeSignature: globalThis.PantryCore.recipeSignature(recipes[1]), servings: 1 }];
  const browser = core.buildShopping(globalThis.PantryCore.shoppingInput(state, recipes));
  const worker = core.buildShopping(plannerShoppingInput(plan(), recipes, 1, state.pantry, { cookedMeals: { 'Monday::0': { recipeId: 'rice', servings: .5 } }, leftovers: [{ id: 'oat-extra', recipeId: 'tub', servings: 1 }] }));
  assert.deepEqual(worker, browser);
});
