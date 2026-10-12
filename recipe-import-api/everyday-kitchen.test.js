import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const context = vm.createContext({});
for (const file of ['cooking-session-core.js', 'recipe-experience.js', 'recipe-notes-ui.js']) {
  vm.runInContext(await readFile(new URL('../public/' + file, import.meta.url), 'utf8'), context);
}
const core = context.CookingSessionCore, notes = context.RecipeExperience;
const copy = value => JSON.parse(JSON.stringify(value));
const now = Date.now();
const recipe = { id: 'oats', name: 'Oats', servings: 1, ings: [['Oats', 40, 'g']], method: ['Measure.', 'Chill.'] };
const state = { week: [{ day: 'Monday', meals: ['oats'] }], pantryLedger: { planId: 'plan-1' }, pantry: [], foodLog: [] };
const saved = { id: recipe.id, signature: core.signature(recipe, recipe.method), portions: 2, step: 1, day: 'Monday', index: 0, planId: 'plan-1', savedAt: new Date(now).toISOString() };
const inspect = (value = saved, options = {}) => core.inspect(value, { state, recipe, steps: recipe.method, portions: 2, ...options });

test('saved steps resume only with the same recipe, plan, slot and portions', () => {
  assert.equal(inspect().ok, true);
  assert.equal(inspect(saved, { recipe: { ...recipe, ings: [['Oats', 60, 'g']] } }).ok, false);
  assert.equal(inspect(saved, { steps: ['A revised step.'] }).ok, false);
  assert.equal(inspect(saved, { state: { ...state, pantryLedger: { planId: 'plan-2' } } }).ok, false);
  assert.equal(inspect(saved, { state: { ...state, week: [{ day: 'Monday', meals: ['other'] }] } }).ok, false);
  assert.equal(inspect(saved, { portions: 3 }).ok, false);
  assert.equal(inspect(saved, { cooked: 2 }).ok, false);
  assert.equal(inspect(saved, { cooked: 1 }).ok, false);
  assert.equal(inspect({ ...saved, portions: 1, plannedPortions: 2, cookedPortions: 1 }, { cooked: 1 }).ok, true);
  assert.deepEqual(state.pantry, []); assert.deepEqual(state.foodLog, []);
});
test('standalone batches and extra planned meals keep their own quantities', () => {
  const standalone = { ...saved, day: null, index: null, planId: null, portions: 12 };
  assert.equal(inspect(standalone).value.portions, 12);
  assert.equal(inspect({ ...saved, step: 999 }).value.step, 1);
  assert.equal(inspect({ ...saved, index: 4 }, { state: { ...state, week: [{ day: 'Monday', meals: ['a','b','c','d','oats'] }] } }).ok, true);
  for (const bad of [{ step: -1 }, { index: null }, { portions: Infinity }, { portions: '2' }, { savedAt: 1 }, { planId: '' }]) assert.equal(core.session({ ...saved, ...bad }), null);
  assert.equal(inspect(saved, { recipe: { ...recipe, servings: null } }).ok, false);
});
test('multiple timers use elapsed wall time and paused timers survive reloads', () => {
  let timers = core.create([], 2, 'Rice', { now, id: 'rice' });
  timers = core.create(timers, 5, 'Chicken', { now, id: 'chicken' });
  const paused = core.pause(timers, 'rice', now + 30_000);
  assert.equal(core.remaining(paused[0], now + 500_000), 90);
  const restored = core.normalizeState(copy({ kitchenTimers: paused }), now + 45_000).kitchenTimers;
  assert.equal(core.remaining(restored[1], now + 45_000), 255);
  const resumed = core.resume(restored, 'rice', now + 60_000);
  assert.equal(core.remaining(resumed[0], now + 90_000), 60);
  assert.equal(timers[0].status, 'running', 'Pure transitions do not mutate the input');
  const elapsed = core.advance(resumed, now + 400_000);
  assert.deepEqual(copy(elapsed.completed), ['rice', 'chicken']);
  assert.deepEqual(copy(core.advance(elapsed.values, now + 500_000).completed), []);
});
test('timer limits and malformed backup rows cannot replace existing timers', () => {
  const timers = ['one','two','three'].reduce((rows,id) => core.create(rows, 2, id, { now, id }), []);
  assert.throws(() => core.create(timers, 1, 'Four', { now, id: 'four' }), /three timers/);
  for (const value of [0,-1,721,Infinity,'bad',true,null,{}]) assert.throws(() => core.create([], value, 'Bad', { now, id: 'bad' }));
  assert.throws(() => core.create([timers[0]], 1, 'Duplicate', { now, id: 'one' }), /unique/);
  const bad = [{ ...timers[0], id: '<img>' }, { ...timers[0], deadline: now + 50_000_000 }, { ...timers[0], status: 'paused', remainingMs: 0 }];
  assert.deepEqual(copy(core.timers([...bad, timers[0], timers[0], timers[1]], now)), copy(timers.slice(0,2)));
  assert.equal(core.pause(timers, 'one', now + 130_000)[0].status, 'done');
});
test('recipe notes normalize backups and stay independent of recipe nutrition and taste', () => {
  const app = { ...copy(state), recipeFeedback: [], recentMeals: [] }, original = copy(recipe);
  notes.setPersonalNote(app, recipe, '  Keep dressing separate.  ', { at: new Date(now).toISOString() });
  assert.equal(notes.personalNote(recipe, copy(app)), 'Keep dressing separate.');
  assert.deepEqual(recipe, original); assert.deepEqual(app.pantry, []); assert.deepEqual(app.foodLog, []);
  assert.deepEqual(app.recipeFeedback, []); assert.deepEqual(app.recentMeals, []);
  app.recipeNotes.push({ recipeId: 'oats', text: 'Older', updatedAt: new Date(now - 1_000).toISOString() }, { recipeId: 'bad', text: 'Bad', updatedAt: 'nonsense' });
  notes.normalizeState(app); assert.equal(app.recipeNotes.length, 1);
  notes.setPersonalNote(app, recipe, ''); assert.equal(notes.personalNote(recipe, app), '');
  assert.throws(() => notes.setPersonalNote(app, recipe, 'x'.repeat(2001)), /2,000/);
});
test('notes support a bounded library without dropping an existing note on failed save', () => {
  const app = { recipeNotes: Array.from({ length: 500 }, (_, index) => ({ recipeId: 'r' + index, text: 'Note', updatedAt: new Date(now).toISOString() })) };
  assert.throws(() => notes.setPersonalNote(app, 'new', 'New'), /full/); assert.equal(app.recipeNotes.length, 500);
  notes.setPersonalNote(app, 'r0', 'Updated'); assert.equal(notes.personalNote('r0', app), 'Updated');
  notes.setPersonalNote(app, 'r1', ''); notes.setPersonalNote(app, 'new', 'New'); assert.equal(app.recipeNotes.length, 500);
});
test('personal notes render as escaped text inside the editor', () => {
  const app = {}; notes.setPersonalNote(app, recipe, '</textarea><img src=x onerror="bad()">');
  context.RecipeNotesUI.configure({ state: () => app });
  const markup = context.RecipeNotesUI.panel(recipe);
  assert.match(markup, /&lt;\/textarea&gt;&lt;img/); assert.doesNotMatch(markup, /<img/);
  assert.equal((markup.match(/<\/textarea>/g) || []).length, 1);
});
