import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const core = await readFile(new URL('../public/budget-core.js', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('let budgetPlannerState='), html.indexOf('function getRecipe('));
const recipes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((cat, id) => ({ id: String(id), name: cat, cat, servings: 1, ings: [['Oats', 100, 'g']], nutrition: { kcal: 500, p: 50, complete: true } }));
for (const [id, cat, ingredient] of [['l1','Lunch','Chicken breast'],['l2','Lunch','Kidney beans'],['d1','Dinner','Eggs'],['d2','Dinner','Red lentils']]) recipes.push({id,name:id,cat,servings:1,ings:[['Oats',100,'g'],[ingredient,.01,'g']],nutrition:{kcal:500,p:50,complete:true}});
for (const [id,cat] of [['b1','Breakfast'],['s1','Snack']])recipes.push({id,name:id,cat,servings:1,ings:[['Oats',100,'g']],nutrition:{kcal:500,p:50,complete:true}});

function harness(options = {}) {
  let saved = 0, activeRequest, requestedBody;
  const state = { profile: { days: 7, meals: 4, people: 1, budget: 45, calories: 2000, protein: 200 }, week: [{ day: 'Old day', meals: ['0', '1', '2', '3'] }], mealServings: {}, locked: {}, pantry: [], favorites: [], prepPlan: { checked: { old: true }, storage: {} }, ...options.state };
  const context = { selectedShoppingStore:()=>state.profile.supermarket||'Asda', state, recipes, AbortController, DOMException, console, setTimeout, clearTimeout,
    recipeAllowed: () => true, recipeCategory: recipe => recipe.cat, recipeNutrition: recipe => recipe.nutrition,
    mealKey: (day, index) => `${day}::${index}`, getMealServings: (day, index) => state.mealServings[`${day}::${index}`] || state.profile.people,
    automaticCatalogItems: entries => entries.flatMap(([key, item]) => Object.entries(item.groups).filter(([, group]) => group.remaining > .000001).map(([dimension, group]) => ({ key: `${key}::${dimension}`, name: item.name, dimension, quantity: group.remaining }))),
    automaticCatalogPlanValid: plan => !!plan?.products?.length && Number.isFinite(plan.totalCostGBP) && plan.totalQuantity >= plan.requestedQuantity,
    automaticCatalogFingerprint: (store, items) => JSON.stringify([store, items.map(item => [item.key, item.name, item.dimension, item.quantity])]),
    automaticCatalogState: {}, automaticCatalogController: null, automaticCatalogRequestId: 0,
    automaticCatalogError: (message, retryable = false) => Object.assign(new Error(message), { retryable }),
    automaticCatalogRetryAfter: () => 0, automaticCatalogDelay: async () => {},
    getRecipeImportBackend: () => ({ baseUrl: '' }),
    money: value => `£${Number(value).toFixed(2)}`, escape: String,
    renderHome() {}, renderWeek() {}, renderShop() {}, renderAll() {}, toast() {},
    save() { saved++; },
    fetch: async (_url, init) => { requestedBody = JSON.parse(init.body); if (options.deferred) await new Promise(resolve => { activeRequest = resolve; }); return { ok: true, status: 200, text: async () => JSON.stringify(options.result || context.makeFeasible()) }; },
  };
  vm.runInNewContext(core + '\n' + source + '\n globalThis.run=generateWeek;globalThis.cancel=cancelBudgetPlan;globalThis.validate=budgetPlanValidation;globalThis.planner=()=>budgetPlannerState;globalThis.targetsMet=dailyTargetsMet;', context);
  context.buildShopping = () => context.MealBudgetCore.buildShopping({ ...state, recipes, people: state.profile.people });
  context.makeFeasible = () => {
    const week = context.MealBudgetCore.dayNames(7).map((day,index) => ({ day, meals: [['0','b1'][index%2], ['1','l1','l2'][index%3], ['2','d1','d2'][(index+1)%3], ['3','s1'][index%2]] }));
    const shopping=context.MealBudgetCore.buildShopping({week,recipes,people:state.profile.people,pantry:state.pantry});
    const recommendations=context.automaticCatalogItems(Object.entries(shopping)).map(item=>({key:item.key,match:{productName:'ASDA '+item.name},plan:{requestedQuantity:item.quantity,totalQuantity:item.quantity+100,totalCostGBP:3,products:[{packs:1,costGBP:3}]}}));
    return { status: 'feasible', week, mealServings: {}, basket: { complete: true, totalCostGBP:recommendations.length*3, recommendations } };
  };
  return { context, state, get saved() { return saved; }, get requestedBody() { return requestedBody; }, release() { activeRequest(); } };
}

test('budget generation uses ASDA priced pack totals and replaces a plan only when all constraints validate', async () => {
  const app = harness();
  await app.context.run();
  assert.equal(app.context.planner().status, 'feasible');
  assert.equal(app.state.week.length, 7);
  assert.equal(app.context.automaticCatalogState.status, 'ready');
  assert.equal(app.saved, 1);
  assert.equal(app.requestedBody.profile.budget, 45);
  assert.equal(app.requestedBody.recipes[0].nutrition.p, 50);
});

test('infeasible searches preserve saved meals, portions and prep completion', async () => {
  const app = harness({ result: { status: 'no_feasible_plan', warnings: ['Targets need a larger budget.'] } });
  const before = JSON.stringify(app.state);
  await app.context.run();
  assert.equal(JSON.stringify(app.state), before);
  assert.equal(app.saved, 0);
  assert.equal(app.context.planner().status, 'no_feasible_plan');
});

test('browser verification rejects overspend, missing prices, missing meals and nutrition shortfalls', () => {
  const app = harness();
  assert.equal(app.context.validate(app.context.makeFeasible()), true);
  for (const mutate of [
    result => { result.basket.totalCostGBP = 46; },
    result => { result.basket.complete = false; },
    result => { result.basket.recommendations = []; },
    result => { result.basket.recommendations[0].plan.requestedQuantity = 100; },
    result => { result.week[0].meals.pop(); },
    result => { result.mealServings['Monday::0'] = .25; },
    result => { result.week[0].meals[0] = '1'; },
  ]) { const result = app.context.makeFeasible(); mutate(result); assert.equal(app.context.validate(result), false); }
});

test('cancelled and stale searches cannot overwrite a saved plan', async () => {
  for (const action of ['cancel', 'settings', 'pantry', 'plan']) {
    const app = harness({ deferred: true });
    const before = JSON.stringify(app.state.week);
    const pending = app.context.run();
    if (action === 'cancel') app.context.cancel();
    if (action === 'settings') app.state.profile.budget = 40;
    if (action === 'pantry') app.state.pantry.push({ name: 'Oats', qty: 1, unit: 'kg' });
    if (action === 'plan') app.state.mealServings['Old day::0'] = 2;
    app.release(); await pending;
    assert.equal(JSON.stringify(app.state.week), before);
    assert.equal(app.saved, 0);
    assert.equal(app.context.planner().status, action === 'cancel' ? 'cancelled' : 'stale');
  }
});

test('planner refuses to change locked meals or their portions', () => {
  const app = harness({ state: { week: [{ day: 'Monday', meals: ['0', '1', '2', '3'] }], locked: { 'Monday::0': true }, mealServings: { 'Monday::0': 2 } } });
  assert.equal(app.context.validate(app.context.makeFeasible()), false);
});

test('browser rejects a priced nutrition-complete plan that repeats the same main meals all week',()=>{
 const app=harness(),result=app.context.makeFeasible();
 result.week=result.week.map(day=>({...day,meals:['0','1','2','3']}));
 assert.equal(app.context.validate(result),false);
});

test('daily badges and gap lists agree on floating-point nutrition boundaries', () => {
  const app = harness();
  assert.equal(app.context.targetsMet({ kcalComplete: true, pComplete: true, kcal: 2200.000000001, p: 199.9999999999 }), true);
  assert.equal(app.context.targetsMet({ kcalComplete: true, pComplete: true, kcal: 2201, p: 200 }), false);
  assert.equal(app.context.targetsMet({ kcalComplete: true, pComplete: true, kcal: 2000, p: 190 }), false);
});
