import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { interpretKitchenRequest } from './kitchen-assistant.js';
const Core = globalThis.KitchenAssistantCore;
const recipe = { id: 'measured-curry', name: 'Chicken curry', cat: 'Dinner', servings: 2,
  ings: [['Chicken breast', 400, 'g'], ['Chopped tomatoes', 300, 'g'], ['Onion', 100, 'g'], ['Cooking oil', 6, 'g'], ['Water', 100, 'ml']],
  method: ['Cook the chicken through in the curry sauce.'], equipment: ['Hob'] };
const brief = Core.parse('How should I prep my 1kg of chicken for the next few days? I am thinking curry.');

test('the requested chicken example captures grams, raw basis, a few days and curry', () => {
  assert.deepEqual(brief, { ingredient: 'Chicken breast', grams: 1000, basis: 'raw', days: 3, people: 1, query: 'curry' });
  const week = Core.parse('Meal prep 1.5 kg chicken breast curry for the week ahead for 2 people');
  assert.equal(week.days, 7); assert.equal(week.people, 2); assert.equal(week.grams, 1500);
  assert.equal(Core.parse('500 grams of cooked chicken breast for 4 days').basis, 'cooked');
  assert.equal(Core.parse('800g tofu stir-fry for 4 days').query, 'stir fry');
});
test('the main weight does not borrow a rice side weight and missing quantities stay unknown', () => {
  assert.equal(Core.parse('Use 300g rice and 1kg chicken breast for curry').grams, 1000);
  assert.equal(Core.parse('chicken breast 750 g, curry for 5 days').grams, 750);
  assert.equal(Core.parse('make chicken curry').grams, null);
  assert.equal(Core.parse('use raw chicken thigh 1 kg for stew').ingredient, 'Chicken thigh');
  assert.equal(Core.parse('I have 500g rice and want chicken curry').grams, null, 'A side weight cannot become the main ingredient weight.');
  assert.equal(Core.parse('1kg raw chicken breast with cooked rice curry').basis, 'raw', 'A cooked side must not change the chicken weight basis.');
  assert.equal(Core.parse('1kg cooked chicken breast with raw tomato salad').basis, 'cooked');
});
test('invalid weights, periods, people and unsupported proteins require correction', () => {
  for (const text of ['0g chicken curry', '11kg chicken curry', 'chicken curry for 15 days', 'chicken curry for 9 people', '1 kg pork stew']) assert.throws(() => Core.parse(text), TypeError);
  for (const data of [{ grams: -1 }, { days: 1.5 }, { people: Infinity }, { basis: 'guess' }, { query: 'x'.repeat(121) }, { ingredient: '<script>' }]) assert.throws(() => Core.normalise(data), TypeError);
});
test('batch math uses exactly the available ingredient and redistributes the entire recipe into equal portions', () => {
  const before = JSON.stringify(recipe), value = Core.proposal(recipe, { ...brief, days: 5, people: 2 });
  assert.equal(value.factor, 2.5); assert.equal(value.portions, 10); assert.equal(value.recipe.servings, 10);
  assert.deepEqual(value.recipe.ings, [['Chicken breast', 1000, 'g'], ['Chopped tomatoes', 750, 'g'], ['Onion', 250, 'g'], ['Cooking oil', 15, 'g'], ['Water', 250, 'ml']]);
  assert.equal(value.recipe.cost, null); assert.equal(value.recipe.kcal, null); assert.equal(value.recipe.nutrition, undefined);
  assert.equal(JSON.stringify(recipe), before); assert.match(value.recipe.method[0], /10 equal portions/);
});
test('cooked weights, bone-in and processed chicken are never treated as raw breast equivalents', () => {
  const cooked = { ...recipe, ings: [['Cooked chicken breast', 300, 'g']] };
  assert.equal(Core.candidates([cooked, recipe], brief).length, 1);
  assert.equal(Core.candidates([cooked, recipe], { ...brief, basis: 'cooked' })[0].ings[0][0], 'Cooked chicken breast');
  for (const name of ['Whole chicken', 'Bone-in chicken breast', 'Chicken sausages', 'Chicken stock', 'Chicken thigh']) {
    assert.equal(Core.anchorMass({ ...recipe, ings: [[name, 1000, 'g']] }, brief), 0, name);
  }
  assert.throws(() => Core.proposal(cooked, brief), TypeError);
});
test('unknown ingredient amounts, unknown yield and fixed appliance batches cannot be scaled', () => {
  assert.equal(Core.candidates([{ ...recipe, fixedBatch: true }, { ...recipe, servings: null }], brief).length, 0);
  for (const change of [{ fixedBatch: true }, { servings: null }, { method: [] }, { ings: [...recipe.ings, ['Spice', 0, 'g']] }, { ings: [['Chicken breast', 1, 'portion']] }]) assert.throws(() => Core.proposal({ ...recipe, ...change }, brief));
  assert.equal(Core.candidates([recipe], brief, () => false).length, 0);
});
test('refrigeration covers only the first 48 hours and the remaining week goes to the freezer', () => {
  const plan = Core.storage(recipe, { ...brief, days: 7, people: 2 });
  assert.equal(plan.fridgeHours, 48); assert.equal(plan.chilled, 4); assert.equal(plan.frozen, 10);
  assert.ok(plan.steps.some(row => /75°C for 30 seconds/.test(row)));
  assert.ok(plan.steps.some(row => /24 hours of fully thawing/.test(row)));
  assert.ok(plan.steps.some(row => /Reheat only once/.test(row)));
});
test('rice-containing prep keeps just one day refrigerated and uses a faster cooling rule', () => {
  const rice = { ...recipe, ings: [...recipe.ings, ['Dry rice', 100, 'g']] }, plan = Core.storage(rice, { ...brief, days: 7, people: 2 });
  assert.equal(plan.fridgeHours, 24); assert.equal(plan.chilled, 2); assert.equal(plan.frozen, 12);
  assert.ok(plan.steps.some(row => /within one hour/.test(row)));
  assert.equal(Core.storage({ ...recipe, ings: [...recipe.ings, ['Rice flour', 10, 'g']] }, brief).rice, false);
});
test('real curry library options scale to one kilogram and retain honest nutrition from ingredients', async () => {
  const library = await readRecipeLibrary();
  const choices = Core.candidates(library, brief, row => row.nutrition.complete && Array.isArray(row.method));
  assert.ok(choices.length >= 2);
  for (const choice of choices) { const batch = Core.proposal(choice, brief); assert.ok(Math.abs(Core.anchorMass(batch.recipe, brief) - 1000) < 0.00001); assert.equal(batch.recipe.servings, 3); }
});
test('AI interpretation cannot override explicit ingredient, quantity, cooked basis, days or people', async () => {
  const value = await interpretKitchenRequest('1kg cooked chicken breast curry for 5 days for 2 people', {}, async () => JSON.stringify({ ingredient: 'Tofu', grams: 9999, basis: 'raw', days: 1, people: 8, query: 'soup' }));
  assert.equal(value.source, 'ai'); assert.deepEqual(value.brief, { ingredient: 'Chicken breast', grams: 1000, basis: 'cooked', days: 5, people: 2, query: 'curry' });
});
test('unfamiliar flavour interpretation is bounded and malformed AI falls back to editable local data', async () => {
  const value = await interpretKitchenRequest('1kg chicken breast with lemon and herbs', {}, async () => JSON.stringify({ query: 'lemon', ingredient: 'Chicken breast', basis: 'raw', grams: 1000, days: 4, people: 1, recipes: [{ invented: true }] }));
  assert.equal(value.brief.query, 'lemon'); assert.equal(value.recipes, undefined);
  for (const response of ['not JSON', JSON.stringify({ grams: -1 }), JSON.stringify({ query: 'x'.repeat(200) })]) { const result = await interpretKitchenRequest('1kg chicken curry', {}, async () => response); assert.equal(result.source, 'local'); assert.equal(result.brief.grams, 1000); }
});
