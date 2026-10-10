import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlannerRequest } from './planner-request.js';
const recipe = { id: 'oats', name: 'Oats bowl', cat: 'Breakfast', servings: 2, ings: [['Oats', 100, 'g']], nutrition: { kcal: 200, p: 10, complete: true } };
const request = overrides => ({ profile: { days: 7, meals: 4, people: 1, budget: 45 }, recipes: [recipe], ...overrides });

test('planner input retains settings, recipe yields, fractions, stock and locks with bounded fields', () => {
  const value = normalizePlannerRequest(request({ pantry: [{ name: 'Oats', qty: 1, unit: 'kg' }], week: [{ day: 'Monday', meals: ['oats'] }], mealServings: { 'Monday::0': .5 }, locked: { 'Monday::0': true }, favorites: ['oats', 'missing'] }));
  assert.equal(value.profile.budget, 45);
  assert.equal(value.profile.calories, 2000);
  assert.equal(value.recipes[0].servings, 2);
  assert.equal(value.mealServings['Monday::0'], .5);
  assert.equal(value.pantry[0].qty, 1);
  assert.equal(value.locked['Monday::0'], true);
  assert.deepEqual(value.favorites, ['oats']);
});

test('zero budget and protein target are supported without reverting to defaults', () => {
  const value = normalizePlannerRequest(request({ profile: { budget: 0, protein: 0 } }));
  assert.equal(value.profile.budget, 0);
  assert.equal(value.profile.protein, 0);
});

test('goals and variety settings reach the optimizer with singular and plural goal compatibility', () => {
  const value = normalizePlannerRequest(request({ profile: { goal: ['Gain muscle', 'Gain muscle', 'Eat healthy', 'unsupported'], varietyMode: 'More variety' } }));
  assert.deepEqual(value.profile.goal, ['Gain muscle', 'Eat healthy']);
  assert.equal(value.profile.varietyMode, 'More variety');
  assert.deepEqual(normalizePlannerRequest(request({ profile: { goals: ['Save money'] } })).profile.goal, ['Save money']);
  const defaults = normalizePlannerRequest(request()).profile;
  assert.equal(defaults.varietyMode, 'Balanced');
  assert.deepEqual(defaults.goal, ['Eat healthy', 'Save money', 'Make cooking easier']);
});

test('invalid or excessive work is rejected before catalogue processing', () => {
  for (const profile of [{ budget: -1 }, { budget: Infinity }, { days: 15 }, { meals: 1 }, { people: 0 }, { people: 1.5 }, { calories: 0 }, { protein: -1 }]) assert.throws(() => normalizePlannerRequest(request({ profile })), TypeError);
  assert.throws(() => normalizePlannerRequest(request({ recipes: Array(251).fill(recipe) })), TypeError);
  assert.throws(() => normalizePlannerRequest(request({ recipes: [recipe, recipe] })), /unique/);
  assert.throws(() => normalizePlannerRequest(request({ recipes: [{ ...recipe, ings: [['Oats', -1, 'g']] }] })), /quantity/);
  assert.throws(() => normalizePlannerRequest(request({ recipes: [{ ...recipe, ings: Array(41).fill(['Oats', 1, 'g']) }] })), /40/);
  assert.throws(() => normalizePlannerRequest(request({ pantry: Array(301).fill({ name: 'Oats', qty: 1 }) })), /300/);
});

test('unrelated private or bulky saved data is excluded from the optimizer contract', () => {
  const value = normalizePlannerRequest(request({ importerConfig: { token: 'not-needed' }, recipes: [{ ...recipe, method: 'not-needed', source: 'not-needed' }] }));
  assert.equal(value.importerConfig, undefined);
  assert.equal(value.recipes[0].method, undefined);
  assert.equal(value.recipes[0].source, undefined);
  assert.equal(JSON.stringify(value).includes('not-needed'), false);
});

test('a browser recipe with an unknown cooking time remains eligible for checking', () => {
  const value = normalizePlannerRequest(request({ recipes: [{ ...recipe, cookTime: null }] }));
  assert.equal(value.recipes[0].cookTime, null);
});
