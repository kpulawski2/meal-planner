import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { normalizePlannerRequest } from './planner-request.js';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/equipment-core.js';
import '../public/recipe-library-core.js';
const recipes = (await readRecipeLibrary()).filter(recipe => recipe.id.startsWith('social-'));
const equipment = globalThis.KitchenEquipment;

test('sixty measured social ideas cover oats, bowls, meal prep, air frying, slow cooking and ordinary meals', () => {
  assert.equal(recipes.length, 60);
  assert.equal(new Set(recipes.map(recipe => recipe.id)).size, 60);
  assert.equal(new Set(recipes.map(recipe => recipe.name)).size, 60);
  for (const [tag, count] of [['overnight-oats', 12], ['smoothie-bowl', 10], ['air-fryer', 10], ['slow-cooker', 10]]) assert.equal(recipes.filter(recipe => recipe.tags.includes(tag)).length, count);
  assert.ok(recipes.filter(recipe => recipe.tags.includes('meal-prep')).length >= 30);
  for (const recipe of recipes) {
    assert.equal(recipe.nutrition.complete, true, recipe.name);
    assert.ok(recipe.nutrition.kcal >= 100 && recipe.nutrition.kcal < 1200, recipe.name);
    assert.ok(recipe.nutrition.p > 0 && Number.isFinite(recipe.nutrition.p));
    assert.ok(recipe.ings.every(([name, quantity, unit]) => name && quantity > 0 && Number.isFinite(quantity) && ['g', 'ml', 'piece'].includes(unit)));
    assert.ok(recipe.method.length > 0);
    assert.equal(recipe.kcal, null); assert.equal(recipe.cost, null); assert.equal(recipe.testedInKitchen, false);
    assert.ok(recipe.equipment.every(name => equipment.names.includes(name)));
  }
});
test('creator adaptations retain public video identity and expose selected metric weights and substitutions', () => {
  const rows = recipes.filter(recipe => recipe.creator === '@smoothieflip');
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(recipe => new URL(recipe.source).searchParams.get('v')), ['v1zwei2PTqQ', 'MJB_ZATvb48', '32FhG9FvsCQ']);
  for (const recipe of rows) {
    assert.equal(recipe.sourceType, 'creator-adaptation');
    assert.match(recipe.modifications, /selected weights rather than exact cup or scoop conversions/);
    assert.equal(recipe.nutrition.source, 'ingredients');
  }
  assert.match(rows[0].modifications, /Peanut butter replaces PBfit/);
  assert.ok(rows[0].ings.some(row => row[0] === '0% Greek yoghurt'), 'Count the topping substitution');
});
test('equipment whitelist spans 21 appliances and aliases without silently allowing unknown requirements', () => {
  assert.equal(equipment.names.length, 21);
  assert.deepEqual(equipment.normalize(['Airfryer', 'AIR FRYER', 'instant pot', 'Slowcooker', 'not an appliance']), ['Air fryer', 'Pressure cooker', 'Slow cooker']);
  assert.equal(equipment.allowed({ equipment: ['Air fryer', 'Hob'] }, { equipment: ['Air fryer'] }), false);
  assert.equal(equipment.allowed({ equipment: ['Air fryer', 'Hob'] }, { equipment: ['airfryer', 'stove'] }), true);
  assert.equal(equipment.allowed({ equipment: ['Unknown special cooker'] }, { equipment: ['Unknown special cooker'] }), false);
  for (const recipe of recipes.filter(recipe => recipe.equipment.length)) {
    assert.equal(equipment.allowed(recipe, { equipment: [] }), false);
    assert.equal(equipment.allowed(recipe, { equipment: recipe.equipment }), true);
  }
});
test('new appliances and slow cooking times survive the bounded planner request', () => {
  const slow = recipes.find(recipe => recipe.tags.includes('slow-cooker'));
  const body = { profile: { equipment: ['Slow cooker', 'Hob', 'Air fryer', 'Blender', 'Slow cooker', 'unsupported'] }, recipes: [slow] };
  const value = normalizePlannerRequest(body);
  assert.deepEqual(value.profile.equipment, ['Slow cooker', 'Hob', 'Air fryer', 'Blender']);
  assert.equal(value.recipes[0].cookTime, 15); assert.equal(value.recipes[0].passiveMinutes, 240);
  assert.equal(value.recipes[0].fixedBatch, true); assert.equal(value.recipes[0].batchStorage, 'recipe');
  const allRequirements = normalizePlannerRequest({ profile: { equipment: equipment.names.slice(0, -1) }, recipes: [{ ...slow, equipment: equipment.names }] });
  assert.deepEqual(allRequirements.recipes[0].equipment, equipment.names);
  assert.equal(equipment.allowed(allRequirements.recipes[0], allRequirements.profile), false, 'Never discard an unowned requirement beyond the first four');
  assert.throws(() => normalizePlannerRequest({ ...body, recipes: [{ ...slow, equipment: [...equipment.names, 'Unknown cooker'] }] }), /at most 21 appliances/);
  assert.throws(() => normalizePlannerRequest({ ...body, recipes: [{ ...slow, passiveMinutes: 10081 }] }), /waiting time/);
});
test('one slow-cooker portion buys a full pot, then shares it across days with storage instructions', () => {
  const recipe = recipes.find(recipe => recipe.id === 'social-chicken-taco');
  const shopping = portions => globalThis.MealBudgetCore.buildShopping({ recipes: [recipe], week: portions.map((_, i) => ({ day: String(i), meals: [recipe.id] })), mealServings: Object.fromEntries(portions.map((p, i) => [i + '::0', p])) });
  assert.equal(shopping([1])['chicken breast'].groups.mass.need, 600);
  assert.equal(shopping([1, 1, 1, 1])['chicken breast'].groups.mass.need, 600);
  assert.equal(shopping([1, 1, 1, 1, 1])['chicken breast'].groups.mass.need, 1200);
  assert.match(shopping([1])['chicken breast'].quantityNotes.join(' '), /1 full batch, 3 extra servings store as directed/);
  assert.doesNotMatch(shopping([1])['chicken breast'].quantityNotes.join(' '), /tub|kept frozen/);
  const required = globalThis.PantryCore.requiredIngredients(recipe, 1);
  assert.equal(required.preparedServings, 4);
  assert.equal(required.requirements.find(row => row.name === 'Chicken breast').qty, 600);
});
test('planner selection includes the new collection when owned and excludes all unowned appliances', () => {
  const library = globalThis.RecipeLibraryCore;
  const missing = library.selectPlannerRecipes(recipes, { profile: { equipment: [] } }, 250);
  assert.ok(missing.length > 0); assert.ok(missing.every(recipe => !recipe.equipment.length));
  const all = library.selectPlannerRecipes(recipes, { profile: { equipment: equipment.names } }, 250);
  assert.equal(all.length, 60);
  const favorite = recipes.find(recipe => recipe.tags.includes('air-fryer'));
  assert.equal(library.selectPlannerRecipes(recipes, { profile: { equipment: [] }, favorites: [favorite.id] }).some(recipe => recipe.id === favorite.id), false);
});
