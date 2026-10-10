import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { optimizeMealPlan } from './budget-planner.js';
import '../public/budget-core.js';

const core = globalThis.MealBudgetCore;
const recipes = await readRecipeLibrary();
const profile = { days: 7, meals: 4, people: 1, calories: 2000, protein: 200, budget: 45, cookTime: 45,
  varietyMode: 'Balanced', goal: ['Eat healthy', 'Save money', 'Make cooking easier'] };
const run = patch => optimizeMealPlan({ profile: { ...profile, ...patch }, recipes, pantry: [], week: [], locked: {}, mealServings: {}, favorites: [] });
function verify(result, settings) {
  assert.equal(result.status, 'feasible', JSON.stringify({ cost: result.basket.totalCostGBP, warnings: result.warnings }));
  assert.equal(result.basket.complete, true);
  assert.ok(result.basket.totalCostGBP <= settings.budget);
  assert.equal(result.variety.met, true);
  assert.equal(core.inspectVariety(result.week, recipes, settings).met, true);
  assert.ok(result.nutrition.days.every(day => day.complete && day.meetsTargets && day.p >= settings.protein - .01));
  assert.ok(result.basket.recommendations.every(row => row.plan && row.plan.totalQuantity + .00001 >= row.plan.requestedQuantity));
  assert.ok(result.diagnostics.elapsedMs < 30000, 'A bounded search must remain suitable for the free service');
}

test('the full shipped library gives a genuinely varied whole-pack week inside the default budget', { timeout: 45000 }, async t => {
  const result = await run({});
  verify(result, profile);
  assert.ok(result.variety.distinctRecipes.Breakfast >= 2 && result.variety.distinctRecipes.Snack >= 2);
  assert.ok(result.variety.distinctRecipes.Lunch >= 3 && result.variety.distinctRecipes.Dinner >= 3);
  assert.ok(result.variety.proteinFamilies.length >= 3);
  assert.ok(result.variety.dominantFamilyCount <= 7);
  assert.ok(Object.entries(result.variety.recipeCounts).every(([id, count]) => count <= result.variety.repeatLimitByCategory[recipes.find(row => row.id === id).cat === 'Fruit' ? 'Snack' : recipes.find(row => row.id === id).cat]));
  const cheapest = await run({ priority: 'Cheapest' });
  verify(cheapest, { ...profile, priority: 'Cheapest' });
  assert.ok(cheapest.basket.totalCostGBP <= result.basket.totalCostGBP + .001, 'Cheapest retains all Balanced portion candidates and chooses the cheapest valid finalist');
  t.diagnostic(`Default £${result.basket.totalCostGBP.toFixed(2)}; Cheapest £${cheapest.basket.totalCostGBP.toFixed(2)}; ${result.diagnostics.uniqueMeals} distinct dishes; ${result.diagnostics.elapsedMs} ms`);
});

test('higher variety gives extra options, and lower configured protein needs can support a smaller budget', { timeout: 45000 }, async t => {
  const more = await run({ varietyMode: 'More variety' });
  verify(more, { ...profile, varietyMode: 'More variety' });
  assert.ok(more.variety.distinctRecipes.Lunch >= 4 && more.variety.distinctRecipes.Dinner >= 4);
  assert.ok(more.variety.distinctRecipes.Breakfast >= 3 && more.variety.distinctRecipes.Snack >= 3);
  const smaller = await run({ protein: 120, budget: 30 });
  verify(smaller, { ...profile, protein: 120, budget: 30 });
  assert.equal(smaller.nutrition.proteinTarget, 120);
  const vegetarian = await run({ diet: 'Vegetarian', protein: 120, budget: 35 });
  verify(vegetarian, { ...profile, diet: 'Vegetarian', protein: 120, budget: 35 });
  assert.ok(vegetarian.variety.proteinFamilies.every(family => !['chicken', 'fish', 'pork', 'beef', 'turkey', 'lamb'].includes(family)));
  t.diagnostic(`More variety £${more.basket.totalCostGBP.toFixed(2)}; user-selected 120g protein £${smaller.basket.totalCostGBP.toFixed(2)}; vegetarian £${vegetarian.basket.totalCostGBP.toFixed(2)}`);
});

test('goals alter real recipe selections without changing the configured nutrition bounds', { timeout: 45000 }, async () => {
  const easy = await run({ goal: ['Make cooking easier'] });
  const healthy = await run({ goal: ['Eat healthy'] });
  const muscle = await run({ goal: ['Gain muscle'] });
  const weight = await run({ goal: ['Lose weight'] });
  for (const [goal, result] of [['Make cooking easier', easy], ['Eat healthy', healthy], ['Gain muscle', muscle], ['Lose weight', weight]]) {
    verify(result, { ...profile, goal: [goal] });
    assert.deepEqual(result.goals.active, [goal]);
    assert.equal(result.nutrition.calorieMin, 1800);
    assert.equal(result.nutrition.calorieMax, 2200);
    assert.equal(result.nutrition.proteinTarget, 200);
  }
  assert.notDeepEqual(easy.week.map(day => day.meals), healthy.week.map(day => day.meals));
  assert.notDeepEqual(muscle.week.map(day => day.meals), weight.week.map(day => day.meals));
  assert.ok(easy.goals.knownCookTimeRecipes > 0);
});
