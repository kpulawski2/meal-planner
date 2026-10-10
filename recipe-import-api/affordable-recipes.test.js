import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { recommendCatalogItems } from './catalog-service.js';
import '../public/budget-core.js';

const recipes = await readRecipeLibrary({ includeCollections: false });
const added = recipes.filter(recipe => recipe.id.startsWith('afford-'));
test('the additional recipe library has quantified original meals and complete ingredient estimates', () => {
  assert.equal(added.length, 72);
  assert.equal(new Set(recipes.map(recipe => recipe.id)).size, recipes.length);
  assert.equal(recipes.length, 208);
  const categoryCounts = {};
  for (const recipe of added) {
    categoryCounts[recipe.cat] = (categoryCounts[recipe.cat] || 0) + 1;
    assert.ok(recipe.ings.every(ingredient => ingredient[0] && ingredient[1] > 0));
    assert.ok(recipe.method.length >= 1);
    assert.ok(recipe.cookTime > 0 && recipe.cookTime <= 45);
    assert.equal(recipe.cost, null, 'Prices must come from the catalogue');
    assert.equal(recipe.nutrition.complete, true, `${recipe.name}: ${recipe.nutrition.missing}`);
    assert.ok(recipe.nutrition.kcal > 0 && recipe.nutrition.p > 0);
  }
  assert.deepEqual(categoryCounts, { Breakfast: 24, Lunch: 16, Dinner: 20, Snack: 12 });
  assert.ok(new Set(added.filter(recipe => recipe.cat === 'Dinner').map(recipe => recipe.proteinFamily)).size >= 7);
});

test('every extra recipe ingredient has a reliable automatic ASDA pack price', { timeout: 60000 }, async () => {
  const core = globalThis.MealBudgetCore;
  const items = new Map();
  for (const recipe of added) for (const [name, qty, unit] of recipe.ings) {
    const meta = core.unitMeta(unit, name), key = `${core.canonicalIngredientName(name)}::${meta.dim}`;
    if (!items.has(key)) items.set(key, { key, name, dimension: meta.dim, quantity: qty * meta.factor });
  }
  const result = await recommendCatalogItems('Asda', [...items.values()]);
  assert.ok(result.indexSize >= 10000);
  for (const row of result.recommendations) {
    assert.equal(row.confidence, 'high', `No ingredient match: ${row.query}`);
    assert.ok(row.plan?.products.length, `No pack price: ${row.query}`);
  }
});
