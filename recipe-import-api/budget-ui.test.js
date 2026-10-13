import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const core = await readFile(new URL('../public/budget-core.js', import.meta.url), 'utf8');
const macros = await readFile(new URL('../public/macro-goals-core.js', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('let budgetPlannerState='), html.indexOf('function getRecipe('));
const recipes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((cat, id) => ({ id: String(id), name: cat, cat, servings: 1, ings: [['Oats', 100, 'g']], nutrition: { kcal: 500, p: 50, complete: true } }));
for (const [id, cat, ingredient] of [['l1','Lunch','Chicken breast'],['l2','Lunch','Kidney beans'],['d1','Dinner','Eggs'],['d2','Dinner','Red lentils']]) recipes.push({id,name:id,cat,servings:1,ings:[['Oats',100,'g'],[ingredient,.01,'g']],nutrition:{kcal:500,p:50,complete:true}});
for (const [id,cat] of [['b1','Breakfast'],['s1','Snack']])recipes.push({id,name:id,cat,servings:1,ings:[['Oats',100,'g']],nutrition:{kcal:500,p:50,complete:true}});

function harness(options = {}) {
  let saved = 0, activeRequest, requestedBody;
  const state = { profile: { days: 7, meals: 4, people: 1, budget: 45, calories: 2000, protein: 200 }, week: [{ day: 'Old day', meals: ['0', '1', '2', '3'] }], mealServings: {}, locked: {}, pantry: [], favorites: [], prepPlan: { checked: { old: true }, storage: {} }, ...options.state };
  const context = { selectedShoppingStore:()=>state.profile.supermarket||'Asda', state, recipes, AbortController, DOMException, structuredClone, console, setTimeout, clearTimeout,
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
    fetch: async (_url, init) => { requestedBody = JSON.parse(init.body); if (options.deferred) await new Promise(resolve => { activeRequest = resolve; }); return { ok: true, status: 200, text: async () => JSON.stringify(options.result || context.makeFeasible(requestedBody.profile)) }; },
  };
  vm.runInNewContext(macros + '\n' + core + '\n' + source + '\n globalThis.run=generateWeek;globalThis.cancel=cancelBudgetPlan;globalThis.validate=budgetPlanValidation;globalThis.planner=()=>budgetPlannerState;globalThis.targetsMet=dailyTargetsMet;', context);
  context.buildShopping = () => context.MealBudgetCore.buildShopping({ ...state, recipes, people: state.profile.people });
  context.makeFeasible = (profile=state.profile) => {
    const choices={Breakfast:['0','b1'],Lunch:['1','l1','l2'],Dinner:['2','d1','d2'],Snack:['3','s1']};
    const week = context.MealBudgetCore.dayNames(profile.days).map((day,index) => ({ day, meals:context.MealBudgetCore.mealSlots(profile.meals).map(cat=>choices[cat][index%choices[cat].length]) }));
    const shopping=context.MealBudgetCore.buildShopping({week,recipes,people:profile.people,pantry:state.pantry});
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

test('a conversational profile is staged privately and saved with its checked plan only after success',async()=>{
 const app=harness({deferred:true}),before=structuredClone(app.state),candidate={...before.profile,days:3,meals:3,calories:1500,protein:150,budget:60};
 const pending=app.context.run({profile:candidate});assert.deepEqual(app.state,before);assert.equal(app.requestedBody.profile.days,3);app.release();const result=await pending;
 assert.equal(result.status,'feasible');assert.equal(app.state.week.length,3);assert.equal(app.state.profile.days,3);assert.equal(app.state.profile.meals,3);assert.equal(app.state.profile.budget,60);
 assert.deepEqual(app.state.pantry,before.pantry);assert.deepEqual(candidate,{...before.profile,days:3,meals:3,calories:1500,protein:150,budget:60});
});
test('effective conversational targets are validated rather than the easier previous saved targets',async()=>{
 const app=harness({result:{status:'feasible',week:[],basket:{complete:true,totalCostGBP:0,recommendations:[]}}}),before=structuredClone(app.state);
 app.context.fetch=async()=>({ok:true,status:200,text:async()=>JSON.stringify(app.context.makeFeasible())});
 const result=await app.context.run({profile:{...before.profile,calories:1000}});assert.equal(result.status,'unavailable');assert.deepEqual(app.state,before);assert.equal(app.saved,0);
});
test('failed, aborted, stale and rejected conversational searches never save their proposed profile',async()=>{
 for(const action of ['failed','abort','settings','pantry','source','guard']){
  const app=harness({deferred:true,...(action==='failed'?{result:{status:'no_feasible_plan'}}:{})}),before=structuredClone(app.state),candidate={...before.profile,budget:60},controller=new AbortController();
  const pending=app.context.run({profile:candidate,signal:controller.signal,guard:()=>action!=='guard'});
  if(action==='abort')controller.abort();if(action==='settings')app.state.profile.budget=40;if(action==='pantry')app.state.pantry.push({name:'Oats',qty:10,unit:'g'});
  const oldNutrition=recipes[0].nutrition;if(action==='source')recipes[0].nutrition={...oldNutrition,kcal:501};app.release();await pending;recipes[0].nutrition=oldNutrition;
  assert.deepEqual(app.state.week,before.week);assert.equal(app.state.profile.budget,action==='settings'?40:45);assert.equal(app.saved,0);
 }
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
test('a shorter period or fewer meal slots cannot silently omit a kept or cooked meal',()=>{
 for(const cooked of [false,true])for(const change of [{days:1},{meals:3,calories:1500,protein:150}]){
  const app=harness();app.state.week=app.context.makeFeasible().week;
  if(cooked)app.context.PantryCore={spentTotal:()=>0,spentSummary:()=>({known:true}),activePantry:rows=>rows,cookedPortions:(_state,day,index)=>day==='Wednesday'&&index===3?1:0};else app.state.locked['Wednesday::3']=true;
  const p={...app.state.profile,...change};assert.equal(app.context.validate(app.context.makeFeasible(p),p),false);
 }
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
