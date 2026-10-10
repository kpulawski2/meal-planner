import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { recommendCatalogItems } from './catalog-service.js';
import '../public/budget-core.js';

const [html, source] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/creami-recipes.js', import.meta.url), 'utf8'),
]);
const nutrition = html.slice(html.indexOf('const NUTRITION_PROFILES='), html.indexOf('function nutritionSourceLabel'));
const context = { canonicalIngredientName: globalThis.MealBudgetCore.canonicalIngredientName };
vm.runInNewContext(`${source}\n${nutrition}\nglobalThis.rows=CREAMI_RECIPES.map(recipe=>({...recipe,nutrition:recipeNutrition(recipe)}));`, context, { timeout: 2000 });
const recipes = JSON.parse(JSON.stringify(context.rows));

test('CREAMi recipes are original, measured whole-tub batches with a separate 24-hour freeze', () => {
  assert.equal(recipes.length, 24);
  assert.equal(new Set(recipes.map(recipe => recipe.id)).size, recipes.length);
  assert.equal(new Set(recipes.map(recipe => recipe.name)).size, recipes.length);
  assert.ok(recipes.filter(recipe => recipe.tags.includes('vegan')).length >= 4);
  for (const recipe of recipes) {
    assert.deepEqual(recipe.equipment, ['Ninja CREAMi']);
    assert.equal(recipe.cat, 'Snack');
    assert.equal(recipe.servings, 2);
    assert.equal(recipe.fixedBatch, true, 'Shopping must buy a whole prepared tub while nutrition uses consumed portions');
    assert.equal(recipe.freezeMinutes, 1440);
    assert.ok(recipe.cookTime > 0 && recipe.cookTime <= 15);
    assert.equal(recipe.tubSizeMl, 493);
    assert.match(recipe.batchLabel, /2 servings/);
    assert.equal(recipe.cost, null);
    assert.equal(recipe.kcal, null, 'Use the ingredient calculation, not a marketing calorie claim');
    assert.equal(recipe.sourceName, 'Original Meal Planner recipe');
    assert.equal(recipe.license, 'CC0-1.0');
    assert.equal(recipe.sourceType, 'technique-reference');
    assert.match(recipe.techniqueSource, /^https:\/\/support\.ninjakitchen\.co\.uk\//);
    assert.equal(recipe.testedInKitchen, false, 'Do not claim a physical recipe test');
    assert.ok(recipe.ings.every(([name, quantity, unit]) => name && Number.isFinite(quantity) && quantity > 0 && ['g', 'ml'].includes(unit)));
    assert.ok(recipe.ings.reduce((sum, ingredient) => sum + ingredient[1], 0) < 470, 'Allow headroom under a standard tub fill line');
    const method = recipe.method.join(' ');
    assert.match(method, /MAX FILL/);
    assert.match(method, /at least 24 hours/);
    assert.match(method, /loose frozen chunks or plain ice/);
    assert.match(method, /2 equal servings/);
    assert.ok(!recipe.tags.includes('low-calorie'), 'Classify lower-calorie portions from computed nutrition');
  }
});

test('every CREAMi ingredient including finishing liquid and mix-ins is in per-serving nutrition', () => {
  for (const recipe of recipes) {
    assert.equal(recipe.nutrition.complete, true, `${recipe.name}: ${JSON.stringify(recipe.nutrition.missing)}`);
    assert.ok(recipe.nutrition.kcal > 0 && recipe.nutrition.p > 0);
    const liquid = recipe.reSpinLiquid;
    assert.equal(liquid.quantity, 30);
    assert.equal(liquid.unit, 'ml');
    assert.equal(liquid.included, true);
    assert.ok(recipe.ings.some(([name, qty, unit]) => name === liquid.name && unit === liquid.unit && qty >= liquid.quantity));
    assert.match(recipe.method[0], /Reserve 30 ml/);
    assert.match(recipe.method[3], /reserved 30 ml/);
    for (const mixIn of recipe.mixIns) assert.ok(recipe.ings.some(ingredient => JSON.stringify(ingredient) === JSON.stringify(mixIn)));
  }
  const plain = recipes.find(recipe => recipe.id === 'creami-plain-skyr');
  // 240 g Skyr (63 kcal/100 g) + 180 ml skimmed milk (35 kcal/100 ml).
  assert.equal(plain.nutrition.kcal, Math.round((240 * .63 + 180 * .35) / 2));
  assert.equal(plain.nutrition.p, Math.round((240 * .11 + 180 * .036) / 2 * 10) / 10);
});

test('CREAMi ingredient batches have automatic product and pack prices', { timeout: 60000 }, async () => {
  const core = globalThis.MealBudgetCore;
  const items = new Map();
  for (const recipe of recipes) for (const [name, qty, unit] of recipe.ings) {
    const meta = core.unitMeta(unit, name), key = `${core.canonicalIngredientName(name)}::${meta.dim}`;
    if (!items.has(key)) items.set(key, { key, name, dimension: meta.dim, quantity: qty * meta.factor });
  }
  const result = await recommendCatalogItems('Asda', [...items.values()]);
  assert.ok(result.indexSize >= 10000);
  for (const row of result.recommendations) {
    assert.equal(row.confidence, 'high', `No safe ingredient match: ${row.query}`);
    assert.ok(row.plan?.products.length, `No automatic pack price: ${row.query}`);
  }
});
