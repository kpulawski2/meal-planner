import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const files = ['budget-core', 'pantry-core', 'recipe-experience', 'swap-core', 'swap-ui'];
const scripts = await Promise.all(files.map(name => readFile(new URL(`../public/${name}.js`, import.meta.url), 'utf8')));
const plain = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const nutritionOf = recipe => recipe.nutrition;
const recipe = (id, cat, ingredient, quantity = 100, kcal = 500, p = 50) => ({ id, name: id, cat, servings: 1,
  ings: [[ingredient, quantity, ingredient === 'Eggs' ? 'pieces' : 'g']], nutrition: { kcal, p, complete: true } });

function fixture() {
  return { recipes: [recipe('chicken-lunch', 'Lunch', 'Chicken breast'), recipe('lentil-lunch', 'Lunch', 'Red lentils'),
    recipe('chicken-wrap', 'Lunch', 'Chicken breast', 150), recipe('egg-dinner', 'Dinner', 'Eggs', 2),
    recipe('egg-frittata', 'Dinner', 'Eggs', 2), recipe('tuna-lunch', 'Lunch', 'Tuna'), recipe('small-lunch', 'Lunch', 'Chicken breast', 100, 100, 10),
    recipe('breakfast', 'Breakfast', 'Oats'), recipe('snack', 'Snack', 'Oats'), recipe('fruit', 'Fruit', 'Apple')],
    state: { profile: { people: 1, days: 2, meals: 2, budget: 35, calories: 1000, protein: 100, supermarket: 'Asda', varietyMode: 'Balanced' },
      week: [{ day: 'Monday', meals: ['chicken-lunch', 'egg-dinner'] }, { day: 'Tuesday', meals: ['lentil-lunch', 'egg-frittata'] }],
      mealServings: {}, locked: {}, pantry: [], leftovers: [], shopping: {}, favorites: [], recipeFeedback: [], recentMeals: [] } };
}
const productUrl = (store, name = 'food') => store === 'Lidl' ? `https://www.lidl.co.uk/p/${encodeURIComponent(name)}/p10000001` : `https://www.asda.com/groceries/product/${encodeURIComponent(name)}/10000001`;
function response(store, items, generation = '2026-10-11T10:00:00Z', multiplier = 1) {
  return { store, refreshedAt: generation, recommendations: items.map(item => {
    const capacity = item.dimension === 'each' ? 6 : item.dimension === 'volume' ? 1000 : 100;
    const packs = Math.ceil(item.quantity / capacity), priceGBP = multiplier;
    const match = { url: productUrl(store, item.name), productName: item.name, priceGBP, available: true };
    return { key: item.key, dimension: item.dimension, match, confidence: 'high', plan: item.quantity > 0 ? { requestedQuantity: item.quantity,
      totalQuantity: packs * capacity, totalCostGBP: packs * priceGBP, products: [{ ...match, packs, totalQuantity: packs * capacity, costGBP: packs * priceGBP }] } : null };
  }) };
}

function harness(options = {}) {
  const fixtureData = fixture(), state = options.state || fixtureData.state, recipes = options.recipes || fixtureData.recipes;
  const nodes = Object.fromEntries(['sheet', 'modal', 'swapOptionList', 'swapResultCount', 'swapNotice', 'swapSearch', 'swapMaxKcal', 'swapMinProtein', 'swapDayTargets', 'swapSafeOnly'].map(id => [id, { innerHTML: '', textContent: '', style: {}, value: '', checked: id === 'swapDayTargets' }]));
  const calls = [], messages = [], applied = []; let closed = 0, rendered = 0, generation = '2026-10-11T10:00:00Z';
  const context = { console, URL, AbortController, Date, setTimeout, clearTimeout,
    document: { getElementById: id => nodes[id] || null, querySelector: () => null, createElement: () => ({}) } };
  vm.createContext(context); scripts.forEach(source => vm.runInContext(source, context));
  context.PantryCore.initialise(state);
  const allowed = options.allowed || (() => true);
  context.MealSwapUI.configure({ getState: () => state, getRecipes: () => recipes, selectedStore: () => state.profile.supermarket,
    catalogueStamp: () => generation, allowed, nutritionOf,
    fetchRecommendations: async (store, items, signal) => {
      const row = { store, items: plain(items), signal }; calls.push(row);
      return options.fetch ? options.fetch(store, items, signal, calls.length) : response(store, items, generation);
    }, delay: options.delay || (async () => {}), toast: text => messages.push(text), closeModal: () => { ++closed; nodes.modal.style.display = 'none'; },
    showRecipe() {}, renderAll() { ++rendered; }, apply(next, details) { applied.push({ next: plain(next), details: plain(details) }); state.week = plain(next.week); state.mealServings = plain(next.mealServings); } });
  return { context, state, recipes, nodes, calls, messages, applied, allowed, get closed() { return closed; }, get rendered() { return rendered; },
    set generation(value) { generation = value; }, core: context.MealSwapCore, ui: context.MealSwapUI,
    next(id = 'chicken-wrap', day = 'Monday', index = 0) { return context.MealSwapCore.prospective({ state, recipes, day, index, replacementId: id, nutritionOf, allowed, isCooked: context.PantryCore.isCooked }); } };
}
function evaluate(app, next = app.next(), spending) {
  const beforeItems = app.core.shoppingItems(app.state, app.recipes), afterItems = app.core.shoppingItems(next.state, app.recipes);
  return app.core.evaluate({ state: app.state, prospectiveState: next.state, recipes: app.recipes, nutritionOf, day: next.day, spending, allowed: app.allowed,
    before: app.core.basket(response(app.state.profile.supermarket, beforeItems), beforeItems, app.state.profile.supermarket),
    after: app.core.basket(response(app.state.profile.supermarket, afterItems), afterItems, app.state.profile.supermarket) });
}

test('swap prospects preserve household portions, locks, pantry and other meals without mutating the plan', () => {
  const app = harness(); app.state.profile.people = 2; app.state.mealServings['Monday::0'] = 3;
  app.state.locked['Tuesday::1'] = true; app.state.pantry.push({ name: 'Chicken breast', qty: 200, unit: 'g' });
  const before = plain(app.state), next = app.next();
  assert.deepEqual(plain(app.state), before); assert.equal(next.servings, 3);
  assert.equal(next.state.week[0].meals[0], 'chicken-wrap'); assert.equal(next.state.mealServings['Monday::0'], 3);
  assert.deepEqual(plain(next.state.locked), before.locked); assert.deepEqual(plain(next.state.pantry), before.pantry);
  assert.deepEqual(plain(next.state.week[1]), before.week[1]); assert.equal(next.day.kcal, 1250); assert.equal(next.day.p, 125);
});

test('snack and fruit share a category and stay in a snack slot', () => {
  const app = harness(); app.state.profile.meals = 4; app.state.week[0].meals = ['breakfast', 'chicken-lunch', 'egg-dinner', 'snack'];
  assert.equal(app.core.category({ cat: 'Snacks' }), 'snack');
  assert.equal(app.next('fruit', 'Monday', 3).replacement.id, 'fruit');
});

test('wrong categories, unsuitable diets, missing recipes, invalid portions and locked slots cannot swap', () => {
  const app = harness({ allowed: item => item.id !== 'tuna-lunch' });
  for (const id of ['breakfast', 'tuna-lunch', 'missing', 'chicken-lunch']) assert.throws(() => app.next(id));
  app.state.locked['Monday::0'] = true; assert.throws(() => app.next(), /Unlock/); delete app.state.locked['Monday::0'];
  app.state.mealServings['Monday::0'] = .1; assert.throws(() => app.next(), /portion/);
  app.state.mealServings['Monday::0'] = 101; assert.throws(() => app.next(), /portion/);
});

test('a cooked or partially cooked slot cannot be replaced', () => {
  const app = harness(), recipeRow = app.recipes.find(row => row.id === 'chicken-lunch');
  app.state.pantryLedger.cooked[app.context.PantryCore.slotKey(app.state, 'Monday', 0)] = { recipeId: recipeRow.id, recipeSignature: app.context.PantryCore.recipeSignature(recipeRow), servings: .5 };
  assert.throws(() => app.next(), /already been cooked/); app.ui.open('Monday', 0);
  assert.equal(app.ui.inspect(), null); assert.match(app.messages.at(-1), /already been cooked/);
});

test('same-day duplicate dish families cannot be introduced', () => {
  const app = harness(); app.recipes.find(row => row.id === 'chicken-wrap').dishFamily = 'same'; app.recipes.find(row => row.id === 'egg-dinner').dishFamily = 'same';
  assert.throws(() => app.next(), /already planned/);
});

test('basket uses the whole supermarket packs and returns a delta including pack thresholds', () => {
  const app = harness(), result = evaluate(app);
  assert.equal(result.beforeTotal, 3); assert.equal(result.total, 4); assert.equal(result.delta, 1);
  assert.equal(result.safe, true); assert.equal(result.nutritionMet, true); assert.equal(result.varietyMet, true);
  assert.equal(result.budget, 10);
});

test('cash already spent is added to remaining shopping and can make a swap exceed budget', () => {
  const app = harness(); app.state.pantryLedger.transactions.push({ type: 'purchase', planId: app.state.pantryLedger.planId, totalCostGBP: 7 });
  const result = evaluate(app); assert.equal(result.spent, 7); assert.equal(result.remaining, 4); assert.equal(result.total, 11);
  assert.equal(result.budgetMet, false); assert.equal(result.safe, false);
  app.state.pantryLedger.transactions[0].undoneAt = new Date().toISOString(); assert.equal(evaluate(app).spent, 0);
});

test('unknown purchase amounts prevent a complete or safe cost certificate', () => {
  const app = harness(); app.state.pantryLedger.transactions.push({ type: 'purchase', planId: app.state.pantryLedger.planId, totalCostGBP: null });
  const result = evaluate(app); assert.equal(result.complete, false); assert.equal(result.total, null); assert.equal(result.safe, false);
});

test('pantry deductions, cooked portions and leftovers change the remaining basket', () => {
  const app = harness(); app.state.pantry.push({ name: 'Chicken breast', qty: 125, unit: 'g' });
  assert.equal(app.core.shoppingItems(app.state, app.recipes).some(row => row.name === 'Chicken breast'), false);
  const nextItems = app.core.shoppingItems(app.next().state, app.recipes);
  assert.equal(nextItems.find(row => row.name === 'Chicken breast').quantity, 25);
  const dinner = app.recipes.find(row => row.id === 'egg-dinner');
  app.state.pantryLedger.cooked[app.context.PantryCore.slotKey(app.state, 'Monday', 1)] = { recipeId: dinner.id, recipeSignature: app.context.PantryCore.recipeSignature(dinner), servings: 1 };
  assert.equal(app.core.shoppingItems(app.state, app.recipes).find(row => row.name === 'Eggs').quantity, 2);
  app.state.leftovers.push({ id: 'leftover', recipeId: 'egg-frittata', recipeSignature: app.context.PantryCore.recipeSignature(app.recipes.find(row => row.id === 'egg-frittata')), servings: 1 });
  assert.equal(app.core.shoppingItems(app.state, app.recipes).some(row => row.name === 'Eggs'), false);
});

test('a known quantity cannot hide an unmeasured quantity of the same ingredient', () => {
  const app = harness(); app.recipes.find(row => row.id === 'chicken-lunch').ings.push(['Chicken breast', null, 'g']);
  const items = app.core.shoppingItems(app.state, app.recipes);
  assert.ok(items.some(row => row.key === 'chicken breast::unknown'));
  const basket = app.core.basket(response('Asda', items), items, 'Asda'); assert.equal(basket.complete, false); assert.equal(basket.total, null);
});

test('whole-plan nutrition checks include unchanged days and incomplete recipes', () => {
  const app = harness(); app.state.mealServings['Tuesday::0'] = .25;
  let result = evaluate(app); assert.equal(result.dayMet, true); assert.equal(result.nutritionMet, false); assert.equal(result.safe, false);
  delete app.state.mealServings['Tuesday::0']; app.recipes.find(row => row.id === 'egg-frittata').nutrition.complete = false;
  result = evaluate(app); assert.equal(result.nutritionMet, false); assert.equal(result.safe, false);
});

test('historical cooked meals remain part of nutrition and variety after a taste or diet change', async () => {
  const app = harness({ allowed: row => row.id !== 'chicken-lunch' });
  app.recipes.push(recipe('lentil-soup', 'Lunch', 'Red lentils', 150));
  const historical = app.recipes.find(row => row.id === 'chicken-lunch');
  const slotKey = app.context.PantryCore.slotKey(app.state, 'Monday', 0);
  app.state.pantryLedger.cooked[slotKey] = { recipeId: historical.id, recipeSignature: app.context.PantryCore.recipeSignature(historical), servings: 1 };
  app.ui.open('Tuesday', 0); await app.ui.check('lentil-soup');
  const checked = app.ui.inspect().previews.get('lentil-soup');
  assert.equal(checked.evaluation.slotsMet, true); assert.equal(checked.evaluation.nutritionMet, true); assert.equal(checked.evaluation.safe, true);
  await app.ui.choose('lentil-soup'); assert.equal(app.applied.length, 1); assert.equal(app.applied[0].details.wholePlanSafe, true);
  assert.equal(app.state.week[0].meals[0], historical.id); assert.equal(app.state.pantryLedger.cooked[slotKey].servings, 1);
});

test('the cooked-history exception cannot allow an uncooked future occurrence of a skipped recipe', () => {
  const app = harness({ allowed: row => row.id !== 'egg-dinner' }), historical = app.recipes.find(row => row.id === 'egg-dinner');
  app.state.pantryLedger.cooked[app.context.PantryCore.slotKey(app.state, 'Monday', 1)] = { recipeId: historical.id, recipeSignature: app.context.PantryCore.recipeSignature(historical), servings: 1 };
  app.state.week[1].meals[1] = historical.id;
  const checked = evaluate(app); assert.equal(checked.slotsMet, false); assert.equal(checked.nutritionMet, false); assert.equal(checked.safe, false);
});

test('partially cooked portions do not exempt future servings from updated preferences', () => {
  const app = harness({ allowed: row => row.id !== 'egg-dinner' }), historical = app.recipes.find(row => row.id === 'egg-dinner');
  app.state.pantryLedger.cooked[app.context.PantryCore.slotKey(app.state, 'Monday', 1)] = { recipeId: historical.id, recipeSignature: app.context.PantryCore.recipeSignature(historical), servings: .5 };
  const checked = evaluate(app); assert.equal(checked.slotsMet, false); assert.equal(checked.nutritionMet, false); assert.equal(checked.safe, false);
});

test('weekly variety and all meal slots must pass before a swap is certified safe', () => {
  const app = harness(); app.state.week[1].meals[1] = 'egg-dinner';
  let result = evaluate(app); assert.equal(result.varietyMet, false); assert.equal(result.safe, false);
  app.state.week[1].meals = ['breakfast', 'egg-frittata'];
  result = evaluate(app); assert.equal(result.slotsMet, false); assert.equal(result.safe, false);
});

test('a missing variety calculator cannot produce a safe certificate', () => {
  const app = harness(), next = app.next();
  const result = app.core.evaluate({ state: app.state, prospectiveState: next.state, recipes: app.recipes, nutritionOf, day: next.day,
    core: { mealSlots: () => ['Lunch', 'Dinner'] }, spending: { total: 0, complete: true },
    before: { complete: true, total: 3 }, after: { complete: true, total: 4, subtotal: 4, missing: [] } });
  assert.equal(result.varietyMet, false); assert.equal(result.safe, false);
});

test('price validation rejects mismatched requests, totals, quantities, identities and stores', () => {
  const app = harness(), items = app.core.shoppingItems(app.state, app.recipes);
  assert.equal(app.core.basket(response('Asda', items), items, 'Asda').complete, true);
  for (const mutate of [
    data => { data.recommendations[0].plan.requestedQuantity += 1; },
    data => { data.recommendations[0].plan.totalCostGBP += 1; },
    data => { data.recommendations[0].plan.totalQuantity += 1; },
    data => { data.recommendations[0].plan.products[0].packs = .5; },
    data => { data.recommendations[0].plan.products[0].priceGBP = null; },
    data => { data.recommendations[0].plan.products[0].available = false; },
    data => { data.recommendations[0].plan.products[0].url = productUrl('Lidl'); },
    data => { data.recommendations[0].match.url = 'https://www.asda.com.example.com/product/100'; },
    data => { data.recommendations[0].dimension = 'volume'; },
    data => { data.recommendations[0].plan = null; },
  ]) { const data = response('Asda', items); mutate(data); assert.equal(app.core.basket(data, items, 'Asda').complete, false); }
  for (const mutate of [data => { data.store = 'Lidl'; }, data => { data.refreshedAt = ''; }, data => { data.recommendations.pop(); },
    data => { data.recommendations[1].key = data.recommendations[0].key; }, data => { data.recommendations[0].key = 'other'; }]) {
    const data = response('Asda', items); mutate(data); assert.throws(() => app.core.basket(data, items, 'Asda'), /incomplete price check/);
  }
});

test('an empty remaining basket costs zero and still includes this plan’s prior purchases', () => {
  const app = harness(); app.state.pantry = [{ name: 'Chicken breast', qty: 1000, unit: 'g' }, { name: 'Red lentils', qty: 1000, unit: 'g' }, { name: 'Eggs', qty: 12, unit: 'pieces' }];
  const empty = app.core.shoppingItems(app.state, app.recipes); assert.equal(empty.length, 0);
  assert.equal(app.core.basket(null, empty, 'Lidl').total, 0);
  const result = evaluate(app, app.next(), { total: 3, complete: true }); assert.equal(result.total, 3); assert.equal(result.safe, true);
});

test('fingerprints cover catalogue, store, feedback, cooked history, recipe edits and portions', () => {
  const app = harness(), initial = app.core.fingerprint(app.state, app.recipes, 'Asda', 'one', ['chicken-wrap']);
  assert.notEqual(initial, app.core.fingerprint(app.state, app.recipes, 'Lidl', 'one', ['chicken-wrap']));
  assert.notEqual(initial, app.core.fingerprint(app.state, app.recipes, 'Asda', 'two', ['chicken-wrap']));
  app.state.recentMeals.push({ recipeId: 'chicken-wrap', transactionId: 'test', cookedAt: new Date().toISOString() });
  assert.notEqual(initial, app.core.fingerprint(app.state, app.recipes, 'Asda', 'one', ['chicken-wrap']));
  app.state.recentMeals = []; app.recipes.find(row => row.id === 'chicken-wrap').name = 'New wrap';
  assert.notEqual(initial, app.core.fingerprint(app.state, app.recipes, 'Asda', 'one', ['chicken-wrap']));
});

test('previewing a swap leaves saved meals untouched and a safe choice requires a final price check', async () => {
  const app = harness(), before = plain(app.state); app.ui.open('Monday', 0);
  await app.ui.check('chicken-wrap'); assert.deepEqual(plain(app.state), before); assert.equal(app.applied.length, 0);
  assert.equal(app.calls.length, 2); assert.equal(app.ui.inspect().previews.get('chicken-wrap').evaluation.safe, true);
  await app.ui.choose('chicken-wrap'); assert.equal(app.calls.length, 3); assert.equal(app.applied.length, 1);
  assert.equal(app.applied[0].details.wholePlanSafe, true); assert.equal(app.applied[0].details.evaluation.nutritionMet, true);
  assert.equal(app.applied[0].details.evaluation.varietyMet, true); assert.equal(app.state.week[0].meals[0], 'chicken-wrap');
  assert.equal(app.ui.inspect(), null); assert.equal(app.rendered, 1);
});

test('quotes and safe choices always use the selected supermarket', async () => {
  const app = harness(); app.state.profile.supermarket = 'Lidl'; app.ui.open('Monday', 0);
  await app.ui.check('chicken-wrap'); await app.ui.choose('chicken-wrap');
  assert.ok(app.calls.every(call => call.store === 'Lidl')); assert.equal(app.applied.length, 1);
  assert.ok(app.applied[0].details.recommendations.every(row => row.match.url.startsWith('https://www.lidl.co.uk/')));
});

test('unpriced swaps cannot be applied even with an attempted acknowledgement', async () => {
  const app = harness({ fetch: (store, items) => { const data = response(store, items); data.recommendations[0].plan = null; return data; } });
  app.ui.open('Monday', 0); await app.ui.check('chicken-wrap');
  assert.equal(app.ui.inspect().previews.get('chicken-wrap').evaluation.complete, false);
  app.ui.acknowledge('chicken-wrap', true); await app.ui.choose('chicken-wrap');
  assert.equal(app.applied.length, 0); assert.equal(app.state.week[0].meals[0], 'chicken-lunch');
  assert.match(app.nodes.swapOptionList.innerHTML, /Unpriced/);
});

test('over-budget swaps require an explicit visible acknowledgement and receive no safe certificate', async () => {
  const app = harness(); app.state.profile.budget = 7; app.ui.open('Monday', 0); await app.ui.check('chicken-wrap');
  const preview = app.ui.inspect().previews.get('chicken-wrap'); assert.equal(preview.evaluation.safe, false); assert.equal(preview.evaluation.complete, true);
  assert.match(app.nodes.swapOptionList.innerHTML, /swap-preview over/);
  assert.match(app.nodes.swapOptionList.innerHTML, /£2.00 over the £2.00 budget/); assert.match(app.nodes.swapOptionList.innerHTML, /I understand this change exceeds the budget/);
  await app.ui.choose('chicken-wrap'); assert.equal(app.applied.length, 0);
  app.ui.acknowledge('chicken-wrap', true); assert.match(app.nodes.swapOptionList.innerHTML, /id="swapAccept-chicken-wrap" checked/);
  await app.ui.choose('chicken-wrap'); assert.equal(app.applied.length, 1); assert.equal(app.applied[0].details.wholePlanSafe, false);
});

test('variety failures are visible and cannot receive a safe certificate after acknowledgement', async () => {
  const app = harness(); app.state.week[1].meals[1] = 'egg-dinner'; app.ui.open('Monday', 0); await app.ui.check('chicken-wrap');
  assert.match(app.nodes.swapOptionList.innerHTML, /Weekly variety targets not met/); assert.match(app.nodes.swapOptionList.innerHTML, /misses weekly variety targets/);
  assert.equal(app.ui.inspect().previews.get('chicken-wrap').evaluation.safe, false);
  app.ui.acknowledge('chicken-wrap', true); await app.ui.choose('chicken-wrap');
  assert.equal(app.applied[0].details.wholePlanSafe, false);
});

test('preview cancellation aborts the active request and does not request an after basket', async () => {
  const hold = deferred(), app = harness({ fetch: async (store, items) => { await hold.promise; return response(store, items); } });
  app.ui.open('Monday', 0); const task = app.ui.check('chicken-wrap'); app.ui.cancel(); hold.resolve(); await task;
  assert.equal(app.calls[0].signal.aborted, true); assert.equal(app.calls.length, 1); assert.equal(app.applied.length, 0); assert.equal(app.ui.inspect(), null);
});

test('state changes while a quote is pending discard that quote', async () => {
  for (const mutate of [app => { app.state.profile.budget = 45; }, app => { app.state.profile.supermarket = 'Lidl'; },
    app => { app.state.pantry.push({ name: 'Oats', qty: 200, unit: 'g' }); }, app => { app.state.mealServings['Monday::0'] = 2; },
    app => { app.state.locked['Monday::0'] = true; }, app => { app.state.recipeFeedback.push({ recipeId: 'chicken-wrap', value: 'skip', updatedAt: new Date().toISOString() }); },
    app => { app.generation = '2026-10-11T11:00:00Z'; }]) {
    const hold = deferred(), app = harness({ fetch: async (store, items, _signal, number) => { if (number === 2) await hold.promise; return response(store, items); } });
    app.ui.open('Monday', 0); const task = app.ui.check('chicken-wrap'); await Promise.resolve(); await Promise.resolve();
    mutate(app); hold.resolve(); await task; await app.ui.choose('chicken-wrap');
    assert.equal(app.applied.length, 0); assert.equal(app.state.week[0].meals[0], 'chicken-lunch');
    assert.equal(app.ui.inspect().previews.has('chicken-wrap'), false);
  }
});

test('cancellation or cooking during final confirmation cannot apply a checked swap', async () => {
  for (const action of ['cancel', 'cook']) {
    const hold = deferred(), app = harness({ fetch: async (store, items, _signal, number) => { if (number === 3) await hold.promise; return response(store, items); } });
    app.ui.open('Monday', 0); await app.ui.check('chicken-wrap'); const task = app.ui.choose('chicken-wrap');
    if (action === 'cancel') app.ui.cancel();
    else { const row = app.recipes.find(item => item.id === 'chicken-lunch'); app.state.pantryLedger.cooked[app.context.PantryCore.slotKey(app.state, 'Monday', 0)] = { recipeId: row.id, recipeSignature: app.context.PantryCore.recipeSignature(row), servings: 1 }; }
    hold.resolve(); await task; assert.equal(app.applied.length, 0); assert.equal(app.state.week[0].meals[0], 'chicken-lunch');
  }
});

test('a new catalogue generation or changed prices during final confirmation require a new preview', async () => {
  for (const change of ['generation', 'price', 'unknown']) {
    const app = harness({ fetch: (store, items, _signal, number) => {
      const data = response(store, items, number === 3 && change === 'generation' ? '2026-10-11T11:00:00Z' : undefined, number === 3 && change === 'price' ? 2 : 1);
      if (number === 3 && change === 'unknown') data.recommendations[0].plan = null; return data;
    } });
    app.ui.open('Monday', 0); await app.ui.check('chicken-wrap'); await app.ui.choose('chicken-wrap');
    assert.equal(app.applied.length, 0); assert.match(app.ui.inspect().message, /Prices or pack availability changed/);
  }
});

test('mixed catalogue generations cannot create a baseline comparison', async () => {
  const app = harness({ fetch: (store, items, _signal, number) => response(store, items, number === 2 ? '2026-10-11T11:00:00Z' : undefined) });
  app.ui.open('Monday', 0); await app.ui.check('chicken-wrap');
  assert.equal(app.ui.inspect().previews.get('chicken-wrap').status, 'error'); assert.match(app.nodes.swapOptionList.innerHTML, /prices changed/);
  await app.ui.choose('chicken-wrap'); assert.equal(app.applied.length, 0);
});

test('retryable quote errors retry once while hard errors leave the meal unchanged', async () => {
  let delayed = 0;
  const app = harness({ delay: async () => { ++delayed; }, fetch: (store, items, _signal, number) => {
    if (number === 1) throw Object.assign(new Error('Busy'), { retryable: true, retryAfterMs: 2000 }); return response(store, items);
  } });
  app.ui.open('Monday', 0); await app.ui.check('chicken-wrap'); assert.equal(delayed, 1); assert.equal(app.calls.length, 3);
  assert.equal(app.ui.inspect().previews.get('chicken-wrap').evaluation.safe, true);
  const broken = harness({ fetch: () => { throw new Error('Prices unavailable'); } }); broken.ui.open('Monday', 0); await broken.ui.check('chicken-wrap');
  assert.equal(broken.calls.length, 1); assert.equal(broken.ui.inspect().previews.get('chicken-wrap').status, 'error');
  await broken.ui.choose('chicken-wrap'); assert.equal(broken.applied.length, 0);
});

test('the UI preserves adjusted portions and uses those quantities for the full basket', async () => {
  const app = harness(); app.state.profile.people = 2; app.state.profile.calories = 1250; app.state.profile.protein = 100;
  app.state.mealServings = { 'Monday::0': 3, 'Monday::1': 2, 'Tuesday::0': 3, 'Tuesday::1': 2 }; app.state.profile.budget = 70;
  app.ui.open('Monday', 0); await app.ui.check('chicken-wrap');
  assert.equal(app.ui.inspect().previews.get('chicken-wrap').next.servings, 3);
  assert.equal(app.calls[1].items.find(row => row.name === 'Chicken breast').quantity, 450);
  await app.ui.choose('chicken-wrap'); assert.equal(app.state.mealServings['Monday::0'], 3); assert.equal(app.applied.length, 1);
});

test('feedback marked skip removes swap candidates automatically', () => {
  const app = harness(); app.context.RecipeExperience.setFeedback(app.state, 'chicken-wrap', 'skip'); app.ui.open('Monday', 0);
  assert.equal(app.ui.inspect().candidates.some(row => row.id === 'chicken-wrap'), false);
});

test('invalid candidate IDs produce a useful message instead of an unhandled promise', async () => {
  const app = harness(); app.ui.open('Monday', 0); await app.ui.check('missing');
  assert.equal(app.calls.length, 0); assert.match(app.messages.at(-1), /no longer available/); assert.equal(app.applied.length, 0);
});
