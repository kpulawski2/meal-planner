import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import '../public/budget-core.js';
import { normalizePlannerRequest } from './planner-request.js';

const core = globalThis.MealBudgetCore;
const directory = await mkdtemp(path.join(os.tmpdir(), 'meal-started-plan-'));
process.env.ASDA_CATALOGUE_PATH = path.join(directory, 'products.json');
process.env.ASDA_CATALOGUE_META_PATH = path.join(directory, 'metadata.json');
const products = Array.from({ length: 110 }, (_, index) => ({ id: 'asda-' + (9100000 + index), sku: String(9100000 + index), name: 'ASDA Fixture Grocery ' + index, category: 'Food cupboard', packQuantity: 500, packUnit: 'g', packSize: '500g', price: 1, available: true, availability: 'in_stock', url: 'https://www.asda.com/groceries/product/fixture/' + (9100000 + index) }));
Object.assign(products[0], { name: 'ASDA Long Grain Rice 500g', category: 'Food cupboard > Rice' });
Object.assign(products[1], { name: 'ASDA Red Split Lentils 500g', category: 'Food cupboard > Lentils' });
Object.assign(products[2], { name: 'ASDA Porridge Oats 500g', category: 'Food cupboard > Breakfast cereal > Porridge' });
Object.assign(products[3], { name: 'ASDA Chicken Breast Fillets 500g', category: 'Meat & Poultry > Chicken breasts', price: 2 });
Object.assign(products[4], { name: 'ASDA Kidney Beans 500g', category: 'Food cupboard > Tinned Beans' });
Object.assign(products[5], { name: 'ASDA Semi Skimmed Milk 1L', category: 'Chilled Food > Milk', packQuantity: 1000, packUnit: 'ml', packSize: '1L' });
await Promise.all([writeFile(process.env.ASDA_CATALOGUE_PATH, JSON.stringify(products)), writeFile(process.env.ASDA_CATALOGUE_META_PATH, JSON.stringify({ status: 'complete', products_expected: products.length, products_saved: products.length, coverage: 1, refreshed_at: new Date().toISOString() }))]);
const { optimizeMealPlan, plannerShoppingInput } = await import('./budget-planner.js');
test.after(() => rm(directory, { recursive: true, force: true }));
const recipe = (id, cat, ingredient, quantity = 100, unit = 'g', extras = {}) => ({ id, name: id, cat, servings: 1, ings: [[ingredient, quantity, unit]], cookTime: 10, nutrition: { kcal: 500, p: 50, complete: true, source: 'verified' }, ...extras });
const lunch = recipe('lentil-lunch', 'Lunch', 'Red lentils', 200), dinner = recipe('rice-dinner', 'Dinner', 'Rice');
const base = { profile: { supermarket: 'Asda', days: 1, meals: 2, people: 1, calories: 1000, protein: 100, budget: 14, priority: 'Cheapest', goal: ['Save money'] }, recipes: [lunch, dinner], week: [{ day: 'Monday', meals: [lunch.id, dinner.id] }], mealServings: { 'Monday::0': 1, 'Monday::1': 1 }, locked: { 'Monday::0': true, 'Monday::1': true }, pantry: [] };
const copy = value => JSON.parse(JSON.stringify(value));
async function optimize(raw) { const request = normalizePlannerRequest(raw), original = copy(request), result = await optimizeMealPlan(request); assert.deepEqual(request, original, 'search must not mutate the saved plan/stock request'); return result; }
function assertCost(result, expected) {
  assert.equal(result.status, 'feasible', JSON.stringify(result.warnings)); assert.equal(result.basket.complete, true); assert.equal(result.basket.totalCostGBP, expected); assert.equal(result.diagnostics.searchCostGBP, expected, 'beam search and final pack basket must agree');
  assert.ok(result.basket.totalCostGBP <= result.budget.planGBP + .001); assert.equal(result.variety.met, true); assert.ok(result.nutrition.days.every(day => day.complete && day.meetsTargets));
}

test('started-plan search deducts partial cooked portions and leftover reservations exactly once', async () => {
  const request = { ...copy(base), cookedMeals: { 'Monday::0': { recipeId: lunch.id, servings: .5 } }, leftovers: [{ id: 'dinner-leftover', recipeId: dinner.id, servings: .25 }], pantry: [{ name: 'Red lentils', qty: 60, unit: 'g' }] };
  const result = await optimize(request); assertCost(result, 2); assert.deepEqual(result.week, request.week); assert.deepEqual(result.mealServings, request.mealServings);
  assert.equal(result.basket.items.find(item => item.key === 'red lentils::mass').quantity, 40); assert.equal(result.basket.items.find(item => item.key === 'rice::mass').quantity, 75);
  assert.equal(result.nutrition.days[0].kcal, 1000); assert.equal(result.nutrition.days[0].p, 100);
});

test('a served locked unpriced meal contributes nutrition but no new purchase requirement', async () => {
  const unpriced = recipe('served-unknown-lunch', 'Lunch', 'Uncatalogued red lentils zzz', 200);
  const request = { ...copy(base), recipes: [lunch, dinner, unpriced], week: [{ day: 'Monday', meals: [unpriced.id, dinner.id] }], cookedMeals: { 'Monday::0': { recipeId: unpriced.id, servings: 1 } } };
  const result = await optimize(request); assertCost(result, 1); assert.deepEqual(result.week, request.week); assert.equal(result.basket.items.length, 1); assert.equal(result.basket.items[0].name, 'Rice'); assert.equal(result.mealServings['Monday::0'], 1);
});

test('feedback can preserve an already served meal but cannot waive its remaining dietary constraints', async () => {
  const served = { ...copy(base), excludedRecipeIds: [lunch.id], cookedMeals: { 'Monday::0': { recipeId: lunch.id, servings: 1 } } };
  const completed = await optimize(served); assertCost(completed, 1); assert.deepEqual(completed.week, base.week);
  const partial = await optimize({ ...served, cookedMeals: { 'Monday::0': { recipeId: lunch.id, servings: .5 } } });
  assert.notEqual(partial.status, 'feasible'); assert.deepEqual(partial.week, base.week);
});

test('fully served meals with unpublished prices remain a valid zero-purchase plan', async () => {
  const recipes = [recipe('unknown-lunch', 'Lunch', 'Uncatalogued red lentils zzz'), recipe('unknown-dinner', 'Dinner', 'Uncatalogued rice zzz')];
  const request = { ...copy(base), profile: { ...base.profile, budget: 0 }, recipes, week: [{ day: 'Monday', meals: recipes.map(row => row.id) }], cookedMeals: { 'Monday::0': { recipeId: recipes[0].id, servings: 1 }, 'Monday::1': { recipeId: recipes[1].id, servings: 1 } } };
  const result = await optimize(request); assertCost(result, 0); assert.deepEqual(result.week, request.week); assert.deepEqual(result.basket.items, []); assert.deepEqual(result.basket.recommendations, []);
});

test('prepared leftovers can satisfy unpriced ingredients without treating unmade food as free', async () => {
  const recipes = [recipe('leftover-lunch', 'Lunch', 'Uncatalogued red lentils zzz'), recipe('leftover-dinner', 'Dinner', 'Uncatalogued rice zzz')];
  const request = { ...copy(base), profile: { ...base.profile, budget: 0 }, recipes, week: [{ day: 'Monday', meals: recipes.map(row => row.id) }], leftovers: recipes.map((row, index) => ({ id: 'prepared-' + index, recipeId: row.id, servings: 1 })) };
  const result = await optimize(request); assertCost(result, 0); assert.deepEqual(result.week, request.week); assert.deepEqual(result.basket.items, []);
  const short = await optimize({ ...request, leftovers: request.leftovers.map(row => ({ ...row, servings: .5 })) }); assert.notEqual(short.status, 'feasible'); assert.ok(short.basket.complete === false || short.basket.totalCostGBP > 0, 'unprepared ingredients need published prices');
});

test('lifecycle shopping compacts slots while preserving cooked nutrition and one leftover allocation', () => {
  const plan = { week: [{ day: 'Monday', meals: [lunch.id, dinner.id] }, { day: 'Tuesday', meals: [lunch.id, dinner.id] }], mealServings: { 'Monday::0': 1, 'Monday::1': 2, 'Tuesday::0': 1, 'Tuesday::1': 2 } };
  const input = plannerShoppingInput(plan, [lunch, dinner], 1, [], { cookedMeals: { 'Monday::0': { recipeId: lunch.id, servings: 1 } }, leftovers: [{ id: 'rice-portions', recipeId: dinner.id, servings: 3 }] });
  assert.deepEqual(input.week, [{ day: 'Monday', meals: [] }, { day: 'Tuesday', meals: [lunch.id, dinner.id] }]); assert.deepEqual(input.mealServings, { 'Tuesday::0': 1, 'Tuesday::1': 1 });
  const shopping = core.buildShopping(input); assert.equal(shopping['red lentils'].groups.mass.need, 200); assert.equal(shopping.rice.groups.mass.need, 100);
});

test('started three-day plans share fixed batches after partial cooking and leftovers before pantry subtraction', async () => {
  const recipes = [recipe('b1', 'Breakfast', 'Oats'), recipe('b2', 'Breakfast', 'Oats'), recipe('chicken-lunch', 'Lunch', 'Chicken breast'), lunch, recipe('d2', 'Dinner', 'Kidney beans'), dinner,
    recipe('tub', 'Snack', 'Milk', 2000, 'ml', { servings: 2, fixedBatch: true, equipment: ['Ninja CREAMi'] }), recipe('ordinary-snack', 'Snack', 'Rice', 50)];
  const week = [{ day: 'Monday', meals: ['b1', 'chicken-lunch', dinner.id, 'tub'] }, { day: 'Tuesday', meals: ['b2', lunch.id, 'd2', 'ordinary-snack'] }, { day: 'Wednesday', meals: ['b1', 'chicken-lunch', dinner.id, 'tub'] }];
  const locked = Object.fromEntries(week.flatMap(day => day.meals.map((_, index) => [day.day + '::' + index, true]))), mealServings = Object.fromEntries(Object.keys(locked).map(key => [key, 1]));
  const request = { profile: { ...base.profile, days: 3, meals: 4, calories: 2000, protein: 200, budget: 56 / 3, equipment: ['Ninja CREAMi'] }, recipes, week, locked, mealServings, pantry: [{ name: 'Milk', qty: 500, unit: 'ml' }], cookedMeals: { 'Monday::3': { recipeId: 'tub', servings: .5 } }, leftovers: [{ id: 'part-tub', recipeId: 'tub', servings: .25 }] };
  const result = await optimize(request); assertCost(result, 8); assert.deepEqual(result.week, week); assert.deepEqual(result.mealServings, mealServings);
  assert.equal(result.basket.items.find(item => item.key === 'milk::volume').quantity, 1500); assert.equal(result.basket.recommendations.find(item => item.key === 'milk::volume').plan.totalCostGBP, 2); assert.ok(result.nutrition.days.every(day => day.kcal === 2000 && day.p === 200));
});
