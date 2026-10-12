import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/equipment-core.js';
import '../public/meal-prep-core.js';
const core = globalThis.MealPrepCore, pantry = globalThis.PantryCore;
const now = new Date('2026-10-12T12:00:00Z');
const oats = { id: 'oats', name: 'Oats', servings: 1, cat: 'Breakfast', ings: [['Oats', 40, 'g'], ['Milk', 150, 'ml']], method: ['Prepare and chill.'], cookTime: 5, passiveMinutes: 360 };
const copy = value => JSON.parse(JSON.stringify(value));
function state(recipe = oats, days = ['Monday', 'Tuesday', 'Wednesday']) {
  const value = { profile: { people: 1, equipment: ['Hob', 'Slow cooker'] }, week: days.map(day => ({ day, meals: [recipe.id] })),
    mealServings: {}, pantry: [{ name: 'Oats', qty: 1000, unit: 'g' }, { name: 'Milk', qty: 1000, unit: 'ml' }], leftovers: [], prepPlan: {} };
  pantry.initialise(value, now); return value;
}
function leftover(recipe, servings, id = 'saved') { return { id, recipeId: recipe.id, recipeSignature: pantry.recipeSignature(recipe), recipeSnapshot: copy(recipe), servings, storage: 'Fridge', expiry: '2026-10-13' }; }
test('prep counts fractional portions, cooked records and globally reserved leftovers without changing state', () => {
  const value = state(); value.mealServings = { 'Monday::0': 1.25, 'Tuesday::0': 1.5, 'Wednesday::0': .75 };
  value.pantryLedger.cooked[pantry.slotKey(value, 'Monday', 0)] = { recipeId: oats.id, recipeSignature: pantry.recipeSignature(oats), servings: .5 };
  value.leftovers.push(leftover(oats, 1));
  const before = JSON.stringify(value), session = core.session(value, [oats], { count: 3 }, now);
  assert.equal(session.plannedPortions, 3.5); assert.equal(session.coveredPortions, 1.5); assert.equal(session.remainingPortions, 2);
  assert.deepEqual(session.tasks[0].slots, [{ day: 'Tuesday', index: 0, portions: 1.25 }, { day: 'Wednesday', index: 0, portions: .75 }]);
  assert.equal(session.ingredients.find(row => row.name === 'Oats').qty, 80);
  const later = core.session(value, [oats], { startDay: 'Wednesday', count: 1 }, now);
  assert.equal(later.remainingPortions, .75, 'Do not reserve the same leftover again in a later selected window');
  assert.equal(JSON.stringify(value), before);
});
test('fixed pots round to full batches and the shared ingredient list combines compatible units', () => {
  const pot = { id: 'pot', name: 'Chicken pot', servings: 4, fixedBatch: true, ings: [['Chicken breast', .6, 'kg'], ['Water', 500, 'ml']], method: ['Cook.'], equipment: ['Slow cooker'] };
  const side = { id: 'side', name: 'Chicken salad', servings: 1, ings: [['Chicken breast', 150, 'g']], method: ['Cook.'] };
  const value = state(pot, ['Monday']); value.week[0].meals.push(side.id);
  const result = core.session(value, [pot, side], {}, now);
  assert.equal(result.tasks.find(row => row.id === pot.id).preparedServings, 4);
  assert.equal(result.tasks.find(row => row.id === pot.id).portions, 1);
  assert.equal(result.ingredients.length, 2); assert.equal(result.ingredients[0].qty, 750); assert.equal(result.ingredients[0].unit, 'g');
  assert.equal(result.ingredients.find(row => row.name === 'Water').qty, 500, 'Scaled prep ingredients include measured cooking water');
  value.mealServings['Monday::0'] = 4.25;
  assert.equal(core.session(value, [pot, side], {}, now).ingredients[0].qty, 1350);
  assert.equal(core.session(value, [pot, side], {}, now).ingredients.find(row => row.name === 'Water').qty, 1000);
});
test('waiting recipes come first, smoothie bowls stay fresh and unknown quantities or equipment stay flagged', () => {
  const frozen = { ...oats, id: 'frozen', name: 'Frozen', freezeMinutes: 1440, passiveMinutes: 0 };
  const bowl = { ...oats, id: 'bowl', name: 'Bowl', tags: ['smoothie-bowl'], passiveMinutes: 0, equipment: ['Blender'] };
  const incomplete = { ...oats, id: 'missing', name: 'Incomplete', ings: [['Unknown', null, 'g']] };
  const value = state(); value.week = [{ day: 'Monday', meals: [bowl.id, incomplete.id, oats.id, frozen.id] }];
  const result = core.session(value, [oats, frozen, bowl, incomplete], {}, now);
  assert.equal(result.tasks[0].id, frozen.id); assert.equal(result.tasks[1].id, oats.id); assert.equal(result.tasks.at(-1).id, bowl.id);
  assert.match(result.tasks.at(-1).reason, /Blender/); assert.equal(result.tasks.at(-1).fresh, true);
  assert.equal(result.completeIngredients, false); assert.equal(result.tasks.find(row => row.id === incomplete.id).preparedServings, null);
});
test('scope bounds and signatures prevent obsolete ingredient checkmarks surviving changed quantities or recipes', () => {
  const value = state(); let task = core.session(value, [oats], {}, now).tasks[0];
  value.prepPlan.sessionChecks = { [task.id]: task.signature };
  assert.equal(core.session(value, [oats], {}, now).tasks[0].checked, true);
  value.mealServings['Tuesday::0'] = 2;
  assert.equal(core.session(value, [oats], {}, now).tasks[0].checked, false);
  delete value.mealServings['Tuesday::0'];
  assert.equal(core.session(value, [{ ...oats, method: ['Different method.'] }], {}, now).tasks[0].checked, false);
  assert.equal(core.session(value, [oats], { count: 1 }, now).tasks[0].checked, false);
  assert.equal(core.scope(value, { startDay: 'Unavailable', count: 200 }).count, 14);
  assert.equal(core.scope(value, { count: -2 }).count, 3);
  assert.deepEqual(core.scope(value, { startDay: 'Wednesday', count: 14 }).days.map(row => row.day), ['Wednesday']);
});
test('a partial batch request deducts ingredients once and supplies future meals while preserving earlier leftovers', () => {
  const value = state(); value.leftovers.push(leftover(oats, .25));
  const task = core.session(value, [oats], {}, now).tasks[0], request = core.batchRequest(task);
  assert.deepEqual(request, { day: 'Monday', index: 0, portions: .75, extraServings: 2 });
  const preview = pantry.cookPreview(value, [oats], { ...request, now });
  assert.equal(preview.preparedServings, 2.75); assert.equal(preview.requirements.find(row => row.name === 'Oats').qty, 110);
  const result = pantry.applyCook(value, [oats], preview, { now }); assert.equal(result.ok, true);
  assert.equal(value.pantry[0].qty, 890); assert.equal(value.leftovers[0].servings, .25); assert.equal(value.leftovers[1].servings, 2);
  assert.equal(core.session(value, [oats], {}, now).remainingPortions, 0);
  const before = JSON.stringify(value); assert.equal(pantry.applyCook(value, [oats], preview, { now }).ok, false); assert.equal(JSON.stringify(value), before);
  assert.equal(pantry.undo(value, result.transaction.id, now).ok, true); assert.equal(value.pantry[0].qty, 1000);
  assert.equal(core.session(value, [oats], {}, now).remainingPortions, 2.75);
});
test('batch requests bound extras and require fresh-bowl meals to be recorded individually', () => {
  assert.throws(() => core.batchRequest({ reason: 'Missing appliance' }), /Missing appliance/);
  assert.throws(() => core.batchRequest({ fresh: true }), /smoothie bowls fresh/);
  assert.throws(() => core.batchRequest({ portions: 102, slots: [{ day: 'Monday', index: 0, portions: 1 }] }), /at most 100/);
});
test('date alerts use the London calendar, validate real dates and distinguish passed, upcoming and undated leftovers', () => {
  const value = { pantry: [
    { id: 'passed', name: 'Milk', qty: 100, unit: 'ml', expiry: '2026-10-12' },
    { id: 'today', name: 'Oats', qty: 100, unit: 'g', expiry: '2026-10-13' },
    { id: 'later', name: 'Rice', qty: 100, unit: 'g', expiry: '2026-10-16' },
    { id: 'invalid', name: 'Eggs', qty: 1, unit: 'piece', expiry: '2026-02-30' },
    { id: 'used', name: 'Used', qty: 0, expiry: '2026-10-12' },
    { id: 'not-due', name: 'Spare', qty: 100, expiry: '2026-10-17' }
  ], leftovers: [{ id: 'undated', recipeId: 'oats', servings: .5, storage: 'Freezer' }] };
  const before = JSON.stringify(value), rows = core.dateAlerts(value, new Date('2026-10-12T23:30:00Z'));
  assert.deepEqual(rows.map(row => row.id), ['passed', 'invalid', 'today', 'later', 'undated']);
  assert.equal(rows.find(row => row.id === 'today').days, 0); assert.equal(rows.find(row => row.id === 'later').days, 3);
  assert.equal(rows.at(-1).status, 'undated'); assert.equal(JSON.stringify(value), before);
  for (const instant of ['2026-10-25T00:30:00Z', '2026-10-25T01:30:00Z']) {
    assert.equal(core.dateAlerts({ pantry: [{ name: 'Milk', qty: 1, expiry: '2026-10-25' }] }, new Date(instant))[0].days, 0);
  }
});
