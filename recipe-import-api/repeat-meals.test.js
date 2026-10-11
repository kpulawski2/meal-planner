import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import '../public/budget-core.js';
import '../public/recipe-library-core.js';
import { normalizePlannerRequest } from './planner-request.js';

const directory = await mkdtemp(path.join(os.tmpdir(), 'repeat-meals-'));
process.env.ASDA_CATALOGUE_PATH = path.join(directory, 'products.json');
process.env.ASDA_CATALOGUE_META_PATH = path.join(directory, 'metadata.json');
const products = Array.from({ length: 110 }, (_, index) => ({ id: `asda-${8800000 + index}`, sku: String(8800000 + index), name: `ASDA Fixture Grocery ${index}`, category: 'Food cupboard', packQuantity: 1000, packUnit: 'g', packSize: '1kg', price: 2, available: true, availability: 'in_stock', url: `https://www.asda.com/groceries/product/fixture/${8800000 + index}` }));
Object.assign(products[0], { name: 'ASDA Porridge Oats 1kg', category: 'Food cupboard > Breakfast cereal > Porridge' });
Object.assign(products[1], { name: 'ASDA Long Grain Rice 1kg', category: 'Food cupboard > Rice' });
Object.assign(products[2], { name: 'ASDA Chicken Breast Fillets 1kg', category: 'Meat & Poultry > Chicken breasts', price: 4 });
await Promise.all([writeFile(process.env.ASDA_CATALOGUE_PATH, JSON.stringify(products)), writeFile(process.env.ASDA_CATALOGUE_META_PATH, JSON.stringify({ status: 'complete', products_expected: products.length, products_saved: products.length, coverage: 1, refreshed_at: new Date().toISOString() }))]);
const { optimizeMealPlan } = await import('./budget-planner.js');
test.after(() => rm(directory, { recursive: true, force: true }));
const recipe = (id, cat, ingredient) => ({ id, name: id, cat, servings: 1, ings: [[ingredient, 100, 'g']], cookTime: 10, nutrition: { kcal: 600, p: 40, complete: true, source: 'verified' } });
const recipes = [recipe('oats', 'Breakfast', 'Oats'), recipe('rice', 'Lunch', 'Rice'), recipe('chicken', 'Dinner', 'Chicken breast')];
const base = { profile: { meals: 3, days: 7, calories: 1800, protein: 120, budget: 100, people: 1, varietyMode: 'Repeat favourites', repeatMeals: { Breakfast: 'oats', Lunch: 'rice', Dinner: 'chicken' } }, recipes, pantry: [], week: [] };
const copy = value => JSON.parse(JSON.stringify(value));
async function optimize(raw = base) {
  const request = normalizePlannerRequest(raw), previous = copy(request), result = await optimizeMealPlan(request);
  assert.deepEqual(request, previous, 'checks must leave saved plans and inventory unchanged');
  return result;
}

test('three repeated favourites produce exactly three correctly typed meals every day with priced whole packs', async () => {
  const result = await optimize();
  assert.equal(result.status, 'feasible', JSON.stringify(result.warnings));
  assert.equal(result.week.length, 7);
  for (const day of result.week) assert.deepEqual(day.meals, ['oats', 'rice', 'chicken']);
  assert.equal(result.variety.met, true); assert.equal(result.variety.mode, 'Repeat favourites');
  assert.equal(result.basket.complete, true); assert.ok(result.basket.totalCostGBP > 0);
  assert.ok(result.nutrition.days.every(day => day.meetsTargets && day.complete));
  assert.deepEqual(Object.keys(result.variety.distinctRecipes), ['Breakfast', 'Lunch', 'Dinner']);
  assert.equal(result.variety.requiredFamilies, 0);
  const normal = globalThis.MealBudgetCore.inspectVariety(result.week, recipes, { ...base.profile, varietyMode: 'Balanced' });
  assert.equal(normal.met, false, 'ordinary variety requirements remain in effect outside the explicit repeat mode');
});

test('repeated favourites never silently substitute another recipe after diet, review or price failures', async () => {
  const saved = [{ day: 'Monday', meals: ['oats', 'rice', 'chicken'] }];
  for (const patch of [
    { profile: { ...base.profile, diet: 'Vegetarian' } },
    { profile: { ...base.profile, repeatMeals: { Breakfast: 'not-in-library' } } },
    { recipes: recipes.map(row => row.id === 'oats' ? { ...row, nutrition: { kcal: null, p: null, complete: false } } : row) },
    { recipes: recipes.map(row => row.id === 'oats' ? { ...row, ings: [['Unpublished snack dust', 100, 'g']] } : row) },
  ]) {
    const result = await optimize({ ...base, ...patch, week: saved });
    assert.notEqual(result.status, 'feasible'); assert.deepEqual(result.week, saved);
  }
});

test('repeat mode does not waive nutrition, budget, meal roles or within-day dish uniqueness', async () => {
  assert.notEqual((await optimize({ ...base, profile: { ...base.profile, budget: 0 } })).status, 'feasible');
  assert.notEqual((await optimize({ ...base, profile: { ...base.profile, protein: 1000 } })).status, 'feasible');
  assert.notEqual((await optimize({ ...base, profile: { ...base.profile, repeatMeals: { Breakfast: 'chicken' } } })).status, 'feasible');
  const duplicates = recipes.map(row => ({ ...row, dishFamily: 'identical-dish' }));
  assert.equal(globalThis.MealBudgetCore.inspectVariety([{ day: 'Monday', meals: ['oats', 'rice', 'chicken'] }], duplicates, base.profile).met, false);
});

test('a conflicting kept meal is retained and a cooked meal stays fixed under new repeated choices', async () => {
  const alternative = recipe('other-lunch', 'Lunch', 'Rice');
  const request = { ...base, profile: { ...base.profile, days: 1 }, recipes: [...recipes, alternative], week: [{ day: 'Monday', meals: ['oats', alternative.id, 'chicken'] }], locked: { 'Monday::1': true }, mealServings: { 'Monday::1': 1 } };
  const conflicting = await optimize(request);
  assert.notEqual(conflicting.status, 'feasible');
  const cooked = await optimize({ ...request, cookedMeals: { 'Monday::1': { recipeId: alternative.id, servings: 1 } } });
  assert.equal(cooked.status, 'feasible', JSON.stringify(cooked.warnings));
  assert.equal(cooked.week[0].meals[1], alternative.id); assert.equal(cooked.mealServings['Monday::1'], 1);
});

test('selected repeated recipes survive the 250-recipe planner limit', () => {
  const rows = Array.from({ length: 300 }, (_, index) => recipe('row-' + index, 'Breakfast', 'Oats'));
  const selected = globalThis.RecipeLibraryCore.selectPlannerRecipes(rows, { profile: { varietyMode: 'Repeat favourites', repeatMeals: { Breakfast: 'row-299' } } });
  assert.equal(selected.length, 250); assert.ok(selected.some(row => row.id === 'row-299'));
});
