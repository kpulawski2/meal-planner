import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const modules = [];
for (const script of scripts) {
  const path = script[0].match(/\bsrc="\/([a-z0-9-]+\.js)"/i)?.[1];
  if (path) modules.push(await readFile(new URL('../public/' + path, import.meta.url), 'utf8'));
  else if (script[1].trim()) modules.push(script[1]);
}
const fullSource = modules.join('\n');
const basic = {
  id: 'user_measured_oats', name: 'Measured milk oats', cat: 'Breakfast', icon: '🥣',
  servings: 1, ings: [['Oats', 40, 'g'], ['Milk', 150, 'ml']],
  method: ['Measure the oats and milk.', 'Simmer and stir until tender.'],
  cookTime: 8, custom: true, cost: null, kcal: null, p: null, c: null, f: null, nutritionStatus: 'estimated',
};
const copy = value => JSON.parse(JSON.stringify(value));
function element(value = '') {
  const classes = new Set(); let current = String(value);
  return {
    get value() { return current; }, set value(value) { current = String(value); },
    files: [], innerHTML: '', textContent: '', disabled: false, checked: false, hidden: false,
    style: {}, dataset: {}, attributes: {}, inert: false,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle(name, active) { if (active === undefined ? !classes.has(name) : active) classes.add(name); else classes.delete(name); } },
    setAttribute(name, value) { this.attributes[name] = value; }, focus() {}, scrollIntoView() {},
    click() {}, appendChild() {}, remove() {}, addEventListener() {},
  };
}

test('the dedicated Favourites tab keeps saved recipes across filters, reload, backup and removal', async () => {
  const app = harness({ state: { favorites: [basic.id, 'everyday-tuna-crunch-pitta', 'missing-web-recipe'] } }); await app.flush();
  app.context.showTab('favourites');
  assert.match(app.node('favouritesResults').innerHTML, /Measured milk oats/); assert.match(app.node('favouritesResults').innerHTML, /Tuna/);
  assert.match(app.node('favourites').innerHTML, /1 saved recipe is currently unavailable/);
  app.context.FavouritesUI.category('Breakfast'); assert.doesNotMatch(app.node('favouritesResults').innerHTML, /Tuna/);
  app.context.FavouritesUI.search('does not exist'); assert.match(app.node('favouritesResults').innerHTML, /No favourites match/);
  app.context.FavouritesUI.reset();
  const before = app.state().week; app.context.toggleFavorite(basic.id);
  assert.doesNotMatch(app.node('favouritesResults').innerHTML, /Measured milk oats/); assert.deepEqual(app.state().week, before);
  assert.deepEqual(JSON.parse(app.storage.get('mealPlannerState')).favorites, ['everyday-tuna-crunch-pitta', 'missing-web-recipe']);
  const restored = harness({ state: app.state() }); await restored.flush(); restored.context.showTab('favourites');
  assert.match(restored.node('favouritesResults').innerHTML, /Tuna/);
  restored.context.restoreData({ target: { files: [{ contents: JSON.stringify({ ...app.state(), favorites: [basic.id] }) }] } });
  assert.match(restored.node('favouritesResults').innerHTML, /Measured milk oats/);
});
test('Favourites can show saved recipes independently of restrictive library filters and paginate', async () => {
  const app = harness(); await app.flush();
  app.run('activeRecipeCollection="Ninja CREAMi";activeRecipeCategory="Dinner";activeRecipeQuery="no matches";state.favorites=["user_measured_oats"];');
  app.context.showTab('favourites'); assert.match(app.node('favouritesResults').innerHTML, /Measured milk oats/);
  app.run('for(let i=0;i<75;i++){const r={...state.customRecipes[0],id:"saved_"+i,name:"Saved oats "+i};recipes.push(r);state.favorites.push(r.id)}');
  app.context.FavouritesUI.render(); assert.equal((app.node('favouritesResults').innerHTML.match(/<article/g) || []).length, 60);
  app.context.FavouritesUI.more(); assert.equal((app.node('favouritesResults').innerHTML.match(/<article/g) || []).length, 76);
});
test('Lidl catalogue browser shows price uncertainty and prevents late search responses replacing newer results', async () => {
  const app = harness({ state: { profile: { supermarket: 'Lidl' } } }); await app.flush();
  assert.match(app.node('shop').innerHTML, /Browse Lidl ingredients/);
  const replies = [];
  app.context.fetch = (url, options) => new Promise(resolve => replies.push({ url, options, resolve }));
  app.context.CatalogueBrowser.open('mayonnaise');
  app.node('lidlBrowseQuery').value = 'tuna'; app.node('lidlBrowsePrice').value = 'all'; app.context.CatalogueBrowser.search();
  const response = name => ({ ok: true, json: async () => ({ ok: true, total: 1200, matched: 1, rangeReferences: 30, priced: 200, nextOffset: null, categories: ['Food Cupboard'], results: [{ productName: name, category: 'Food Cupboard', kind: 'range_reference', priceGBP: null, sourcePeriod: '2026-05', url: 'https://www.lidl.co.uk/static/assets/example.pdf' }] }) });
  replies[1].resolve(response('Tuna')); await app.flush();
  replies[0].resolve(response('Mayonnaise')); await app.flush();
  assert.match(app.node('lidlBrowseResults').innerHTML, /Tuna/); assert.doesNotMatch(app.node('lidlBrowseResults').innerHTML, /Mayonnaise/);
  assert.match(app.node('lidlBrowseResults').innerHTML, /Price unknown|Check today/); assert.match(app.node('lidlBrowseResults').innerHTML, /2026-05/);
  assert.deepEqual(app.state().shopping, {}); app.context.CatalogueBrowser.close();
});
test('an unavailable ingredient browser offers retry without changing saved shopping or pantry data', async () => {
  const app = harness(); await app.flush(); const before = app.state();
  app.context.CatalogueBrowser.open(); await app.flush();
  assert.match(app.node('lidlBrowseStatus').innerHTML, /catalogue is unavailable/); assert.match(app.node('lidlBrowseStatus').innerHTML, /Retry/);
  app.context.fetch = async () => ({ ok: true, json: async () => ({ ok: true, total: 1, matched: 1, rangeReferences: 0, priced: 1, nextOffset: null, categories: ['Food Cupboard'], results: [{ productName: 'Canned beans', category: 'Food Cupboard', kind: 'product', priceGBP: .49, url: 'https://www.lidl.co.uk/p/canned-beans/p10000001' }] }) });
  app.context.CatalogueBrowser.retry(); await app.flush();
  assert.match(app.node('lidlBrowseResults').innerHTML, /Canned beans/); assert.match(app.node('lidlBrowseResults').innerHTML, /£0.49/);
  assert.deepEqual(app.state().shopping, before.shopping); assert.deepEqual(app.state().pantry, before.pantry); assert.deepEqual(app.state().week, before.week);
});
function harness(options = {}) {
  const seed = {
    profile: { days: 7, meals: 3, budget: 45, people: 1, calories: 1200, protein: 60, cookTime: 30, supermarket: 'Asda' },
    setupComplete: true, week: [{ day: 'Monday', meals: [basic.id, 'everyday-tuna-crunch-pitta', 'everyday-turkey-sweet-potato'] }],
    shopping: {}, locked: {}, pantry: [{ name: 'Oats', qty: 1000, unit: 'g', place: 'Pantry' }, { name: 'Milk', qty: 1000, unit: 'ml', place: 'Fridge' }],
    leftovers: [], favorites: [], customRecipes: [copy(basic)], mealServings: {}, recipeFeedback: [], recentMeals: [],
    ...copy(options.state || {}),
  };
  const storage = new Map(options.fresh ? [] : [['mealPlannerState', JSON.stringify(seed)]]);
  const elements = new Map();
  // Keep value's DOM string conversion when creating lazily allocated inputs.
  const node = id => { if (!elements.has(id)) { const result = element(); result.id = id; elements.set(id, result); } return elements.get(id); };
  const nav = ['home', 'week', 'recipes', 'favourites', 'shop', 'pantry', 'profile'].map(id => { const result = element(); result.dataset.tab = id; return result; });
  const requests = [], downloads = [], errors = [], listeners = new Map();
  const context = {
    AbortController, AbortSignal, DOMException, FormData, Blob, URL, URLSearchParams, structuredClone,
    console: { log() {}, warn() {}, error: (...values) => errors.push(values) },
    location: { origin: 'https://meal-planner.example', protocol: 'https:', hostname: 'meal-planner.example' },
    navigator: { onLine: options.online !== false },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) },
    document: { hidden: false, body: element(), getElementById: node,
      querySelectorAll: selector => selector === '.tabs button' ? nav : selector === '.screen' ? ['home', 'week', 'recipes', 'favourites', 'shop', 'pantry', 'profile'].map(node) : [],
      querySelector: selector => selector === '.screen.active' ? { id: options.active || 'home' } : selector === '.app' ? node('app') : null,
      createElement: () => element(), addEventListener: (event, callback) => listeners.set(event, callback),
    },
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    fetch: async (url, request) => { requests.push({ url, request }); return { ok: false, status: 503, text: async () => '', headers: { get: () => null } }; },
    FileReader: class { readAsText(file) { this.result = file.contents; this.onload?.(); } },
  };
  context.window = context; context.addEventListener = () => {}; context.scrollTo = () => {};
  const sandbox = vm.createContext(context);
  vm.runInContext(fullSource, sandbox, { timeout: 10_000 });
  context.downloadFile = (name, contents, type) => downloads.push({ name, contents, type });
  return { context, elements, storage, requests, downloads, errors, listeners, node,
    run: source => vm.runInContext(source, sandbox, { timeout: 10_000 }),
    state: () => copy(vm.runInContext('state', sandbox)),
    flush: async () => { await new Promise(resolve => setImmediate(resolve)); },
  };
}

function tailoredForm(app,overrides={}){
  const fields={tailoredDays:7,tailoredCount:3,tailoredCalories:1800,tailoredProtein:180,tailoredCalorieMode:'max',tailoredCarbs:90,tailoredCarbMode:'target',tailoredFat:'',tailoredQueryBreakfast:'overnight oats',tailoredModeBreakfast:'vary',tailoredRecipeBreakfast:'tailored-berry-oats',tailoredQueryLunch:'tuna pickles eggs mayo wrap',tailoredModeLunch:'repeat',tailoredRecipeLunch:'tailored-tuna-wrap',tailoredQueryDinner:'chicken dish',tailoredModeDinner:'vary',tailoredRecipeDinner:'tailored-lemon-chicken',...overrides};
  for(const [id,value] of Object.entries(fields))app.node(id).value=value;
  app.node('tailoredLowerFat').checked=true;
  const original=app.context.document.querySelectorAll;
  app.context.document.querySelectorAll=selector=>selector==='[data-tailored-equipment]:checked'?[{value:'Hob'}]:original(selector);
}
test('barcode results require label review and preserve corrected nutrition through reload and repeat scans',async()=>{
 const app=harness();await app.flush();const before=app.state(),code='3017620422003';
 app.context.fetch=async()=>({ok:true,json:async()=>({status:'found',product:{barcode:code,name:'Pack snack',quantity:100,unit:'g',nutrition:{kcal:500,p:10,c:50,f:null},source:'Open Food Facts',warnings:['Check your pack.']}})});
 app.context.BarcodeUI.open('2026-10-12');app.node('barcodeNumber').value=code;await app.context.BarcodeUI.lookup();
 for(const [id,value] of Object.entries({diaryDate:'2026-10-12',diaryBasis:100,diaryAmount:25,'diary-kcal':400}))app.node(id).value=value;
 app.node('diarySaveFood').checked=true;app.context.FoodLogUI.commit();assert.equal(app.state().foodLog.length,0);
 app.node('barcodeConfirmed').checked=true;app.context.FoodLogUI.commit();assert.equal(app.state().foodLog[0].nutrition.kcal,100);assert.equal(app.state().foodLog[0].nutrition.f,null);assert.equal(app.state().savedFoods[0].provenance.barcode,code);
 for(const key of ['week','profile','pantry','pantryLedger'])assert.deepEqual(app.state()[key],before[key]);
 const restored=harness({state:app.state()});await restored.flush();restored.context.fetch=()=>{throw new Error('Saved labels must work offline');};restored.context.BarcodeUI.open('2026-10-12');restored.node('barcodeNumber').value=code;await restored.context.BarcodeUI.lookup();assert.equal(restored.node('diary-kcal').value,'400');assert.match(restored.node('sheet').innerHTML,/saved reviewed label/);
});
test('camera permission, detection and lookup results arriving after close cannot reopen a scanner or log food',async()=>{
 const app=harness();await app.flush();let release,stopped=0,detect;app.context.isSecureContext=true;app.node('barcodeVideo').play=async()=>{};
 app.context.BarcodeDetector=class {static async getSupportedFormats(){return ['ean_13','ean_8','upc_a'];}detect(){return new Promise(resolve=>{detect=resolve;});}};
 app.context.navigator.mediaDevices={getUserMedia:()=>new Promise(resolve=>{release=resolve;})};const stream={getTracks:()=>[{stop:()=>stopped++}]};
 app.context.BarcodeUI.open();const permission=app.context.BarcodeUI.camera();await app.flush();app.context.closeModal();release(stream);await permission;assert.equal(stopped,1);assert.equal(app.node('modal').style.display,'none');
 app.context.navigator.mediaDevices.getUserMedia=async()=>stream;app.context.BarcodeUI.open();await app.context.BarcodeUI.camera();await app.flush();app.context.closeModal();detect([{rawValue:'3017620422003'}]);await app.flush();assert.equal(stopped,2);assert.equal(app.node('modal').style.display,'none');assert.equal(app.state().foodLog.length,0);
 app.context.BarcodeUI.open();app.node('barcodeNumber').value='3017620422003';app.context.fetch=()=>new Promise(resolve=>{release=resolve;});const lookup=app.context.BarcodeUI.lookup();app.context.closeModal();release({ok:true,json:async()=>({status:'found',product:{barcode:'3017620422003'}})});await lookup;assert.equal(app.node('modal').style.display,'none');
});
test('fallback camera cleanup stops owned tracks during delayed decoder startup and page hiding',async()=>{
 const app=harness();await app.flush();let release,stopped=0,controls=0;app.context.isSecureContext=true;app.context.navigator.mediaDevices={getUserMedia:async()=>({getTracks:()=>[{stop:()=>stopped++}]})};
 app.context.ZXingBrowser={BrowserMultiFormatReader:class{decodeFromStream(){return new Promise(resolve=>{release=resolve;});}}};app.context.BarcodeUI.open();const pending=app.context.BarcodeUI.camera();await app.flush();app.context.document.hidden=true;app.listeners.get('visibilitychange')();assert.equal(stopped,1);release({stop:()=>controls++});await pending;assert.equal(controls,1);
});
test('check-ins use actual dated food and a failed request explanation retains its unsaved limits',async()=>{
 const app=harness();await app.flush();app.run('FoodLogCore.record(state,{date:"2026-10-12",food:{name:"Label food",quantity:100,unit:"g",nutrition:{kcal:200,p:20,c:30,f:4,source:"label"}},quantity:100});');const before=app.state();app.context.KitchenInsightsUI.review('2026-10-12');assert.match(app.node('sheet').innerHTML,/1\/7/);assert.match(app.node('sheet').innerHTML,/200 kcal/);assert.match(app.node('sheet').innerHTML,/Unlogged days are excluded/);assert.deepEqual(app.state(),before);
 app.run('budgetPlannerLastRequest=budgetPlannerPayload();budgetPlannerLastRequest.profile.nutritionTargets={calorieMode:"max",fatMax:0};budgetPlannerState={status:"error",message:"No fit",result:{status:"unavailable"}};');app.context.KitchenInsightsUI.why();assert.match(app.node('sheet').innerHTML,/At most 0 g fat/);assert.match(app.node('sheet').innerHTML,/failed request can differ/);assert.deepEqual(app.state(),before);
 app.context.KitchenInsightsUI.action('budget','',60);assert.equal(app.node('bud').value,'60');assert.deepEqual(app.state().profile,before.profile);
});
test('the redesigned daily browser keeps week-two choices and plan views separate from saved meal and stock data',async()=>{
  const week=Array.from({length:14},(_,i)=>({day:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i%7]+(i>6?' (Week 2)':''),meals:[basic.id,'tailored-tuna-wrap','tailored-lemon-chicken']}));
  const app=harness({state:{week}});await app.flush();const before=app.state();
  app.context.AppExperienceUI.selectDay('home',7);assert.equal(app.state().interfacePreferences.homeDay,'Monday (Week 2)');assert.match(app.node('home').innerHTML,/Monday \(Week 2\)/);
  app.context.AppExperienceUI.selectDay('week',13);assert.match(app.node('week').innerHTML,/Sunday \(Week 2\)/);assert.equal((app.node('week').innerHTML.match(/class="card meal-plan-card"/g)||[]).length,3);
  app.context.AppExperienceUI.planView('all');assert.equal((app.node('week').innerHTML.match(/class="card meal-plan-card"/g)||[]).length,42);
  for(const key of ['week','mealServings','profile','pantry','pantryLedger','foodLog'])assert.deepEqual(app.state()[key],before[key],key);
  const restored=harness({state:app.state()});await restored.flush();assert.equal(restored.state().interfacePreferences.homeDay,'Monday (Week 2)');assert.equal(restored.state().interfacePreferences.planView,'all');
});
test('appearance and the kitchen menu persist while retaining direct access to saved recipes, inventory and preferences',async()=>{
  const app=harness();await app.flush();app.context.showTab('more');assert.match(app.node('more').innerHTML,/Your favourites/);assert.match(app.node('more').innerHTML,/Pantry &amp; leftovers|Pantry & leftovers/);
  const before=app.state();app.context.AppExperienceUI.theme('dark');assert.equal(app.state().interfacePreferences.theme,'dark');assert.match(app.node('more').innerHTML,/aria-pressed="true" class="selected" onclick="AppExperienceUI.theme\('dark'\)/);
  const restored=harness({state:app.state()});await restored.flush();assert.equal(restored.state().interfacePreferences.theme,'dark');
  for(const key of ['week','profile','pantry','pantryLedger','foodLog'])assert.deepEqual(app.state()[key],before[key],key);
});
test('the actual recipe view searches separate words, sorts known nutrition and previews a suitable recipe without adding a meal',async()=>{
  const app=harness();await app.flush();app.node('recipeSearch').value='tuna pickles wrap';app.context.renderRecipeResults();
  assert.match(app.node('recipeResults').innerHTML,/Tuna, Pickle, Egg/);assert.match(app.node('recipeResults').innerHTML,/data-recipe-id="tailored-tuna-wrap"/);
  app.context.AppExperienceUI.sort('protein');assert.equal(app.state().interfacePreferences.recipeSort,'protein');
  const before=app.state();app.context.AppExperienceUI.surprise();assert.match(app.node('sheet').innerHTML,/Tuna, Pickle, Egg/);
  for(const key of ['week','profile','pantry','pantryLedger','foodLog'])assert.deepEqual(app.state()[key],before[key],key);
});
test('tailored requests roll back failed settings without changing the plan, pantry, cooked history or food diary',async()=>{
  const app=harness();await app.flush();await app.context.TailoredPlanUI.open();app.context.TailoredPlanUI.manual();tailoredForm(app,{tailoredFat:0});
  const before=app.state();app.run('fetch=async()=>({ok:true,status:200,text:async()=>JSON.stringify({status:"unavailable",warnings:["A zero-fat cap cannot fit."],basket:{complete:false}})})');
  await app.context.TailoredPlanUI.apply();const after=app.state();
  for(const key of ['profile','week','pantry','pantryLedger','foodLog'])assert.deepEqual(after[key],before[key],key);
  assert.equal(after.tailoredDraft.brief.nutritionTargets.fatMax,0);
  assert.equal(app.run('budgetPlannerState.status'),'unavailable');
});
test('a tailored-plan response arriving after a settings edit preserves the new edit',async()=>{
  const app=harness();await app.flush();await app.context.TailoredPlanUI.open();app.context.TailoredPlanUI.manual();tailoredForm(app);
  const before=app.state();let release;const ready=new Promise(resolve=>{release=resolve;});
  app.context.fetch=async()=>{await ready;return {ok:true,status:200,text:async()=>JSON.stringify({status:'unavailable',basket:{complete:false}})};};
  const pending=app.context.TailoredPlanUI.apply();await app.flush();app.run('state.profile.budget=88');release();await pending;
  assert.equal(app.state().profile.budget,88);assert.equal(app.run('budgetPlannerState.status'),'stale');
  for(const key of ['week','pantry','pantryLedger','foodLog'])assert.deepEqual(app.state()[key],before[key],key);
});
test('tailored meal rules survive reload and clearing them retains the plan and optional nutrition limits',async()=>{
  const settings={days:7,meals:3,calories:1800,protein:180,budget:70,cookTime:45,people:1,varietyMode:'Tailored',equipment:['Hob'],nutritionTargets:{calorieMode:'max',carbs:90,carbMode:'target',fatMax:30,minimiseFat:true},tailoredMeals:{Lunch:{query:'tuna pickles eggs mayo wrap',mode:'repeat',recipeIds:['tailored-tuna-wrap']}}};
  const app=harness({state:{profile:settings}});await app.flush();assert.equal(app.state().profile.varietyMode,'Tailored');assert.match(app.node('home').innerHTML,/At most 1800 kcal/);
  const before=app.state();app.context.TailoredPlanUI.clear(false);assert.equal(app.state().profile.varietyMode,'Balanced');assert.deepEqual(app.state().week,before.week);assert.deepEqual(app.state().profile.nutritionTargets,before.profile.nutritionTargets);
});

test('the actual shipped external modules and whole inline app start and render every mobile panel', async () => {
  for (const fresh of [false, true]) {
    const app = harness({ fresh }); await app.flush();
    for (const name of ['MealBudgetCore', 'PantryCore', 'PantryUI', 'ConsumerTools', 'ConsumerUI', 'MealSwapCore', 'MealSwapUI', 'RecipeExperience', 'RecipeLibraryCore']) assert.ok(app.context[name], name);
    if (fresh) { assert.equal(app.node('setup').hidden, false); assert.equal(app.node('app').inert, true); continue; }
    for (const button of app.run('document.querySelectorAll(".tabs button")')) {
      assert.equal(typeof button.onclick, 'function'); button.onclick();
      assert.ok(app.node(button.dataset.tab).innerHTML.length > 30, button.dataset.tab);
    }
    assert.equal(app.run('recipes.filter(row=>row.id.startsWith("everyday-")).length'), 25);
    assert.equal(app.errors.length, 0);
    assert.match(app.node('week').innerHTML, /PantryUI.openCook/);
    assert.match(app.node('pantry').innerHTML, /Confirm purchases in Shopping/);
  }
});

test('prep centre records a partially covered batch once, keeps edited storage and can undo the stock change', async () => {
  const app = harness({ state: { week: ['Monday', 'Tuesday', 'Wednesday'].map(day => ({ day, meals: [basic.id] })) } }); await app.flush();
  app.run('state.leftovers.push({id:"old-quarter",recipeId:"user_measured_oats",recipeSignature:PantryCore.recipeSignature(getRecipe("user_measured_oats")),servings:0.25,storage:"Fridge",expiry:""});renderAll();');
  const before = app.state(); app.context.MealPrepUI.openSession();
  assert.match(app.node('sheet').innerHTML, /Prepare 2.75 portions/);
  app.context.MealPrepUI.record(basic.id); assert.match(app.node('sheet').innerHTML, /Serve 0.75 portions/);
  app.node('cookExtra').value = '2'; app.node('cookStorage').value = 'Freezer'; app.node('cookExpiry').value = '2099-01-01';
  app.context.PantryUI.updateCookPreview(); assert.match(app.node('sheet').innerHTML, /Serve 0.75 portions/);
  app.context.PantryUI.confirmCook(false); app.context.PantryUI.confirmCook(false);
  let current = app.state();
  assert.equal(current.pantry[0].qty, before.pantry[0].qty - 110);
  assert.equal(current.pantry[1].qty, before.pantry[1].qty - 412.5);
  assert.equal(current.leftovers.find(row => row.id === 'old-quarter').servings, .25);
  const saved = current.leftovers.find(row => row.id !== 'old-quarter');
  assert.equal(saved.servings, 2); assert.equal(saved.storage, 'Freezer'); assert.equal(saved.expiry, '2099-01-01');
  assert.equal(current.pantryLedger.transactions.length, 1); assert.deepEqual(current.foodLog, []);
  assert.deepEqual(current.week, before.week); assert.equal(current.profile.calories, before.profile.calories);
  app.context.MealPrepUI.openSession(); assert.match(app.node('sheet').innerHTML, /already cooked or covered by leftovers/);
  app.context.PantryUI.undo(current.pantryLedger.transactions[0].id);
  current = app.state(); assert.equal(current.pantry[0].qty, before.pantry[0].qty); assert.equal(current.leftovers.length, 1);
  app.context.MealPrepUI.openSession(); assert.match(app.node('sheet').innerHTML, /Prepare 2.75 portions/);
  app.run('state.pantry[0].qty-=1'); const stale = app.state();
  app.context.MealPrepUI.record(basic.id);
  assert.match(app.node('toast').textContent, /plan or stock changed/); assert.deepEqual(app.state(), stale);
});
test('prep cooking, checklist export and portion shortcuts preview amounts without changing intake, stock or plan', async () => {
  const app = harness({ state: { week: ['Monday', 'Tuesday', 'Wednesday'].map(day => ({ day, meals: [basic.id] })) } }); await app.flush();
  const before = app.state(); app.context.MealPrepUI.openSession(); app.context.MealPrepUI.cook(basic.id);
  assert.match(app.node('sheet').innerHTML, /3 household portions/); assert.match(app.node('sheet').innerHTML, /120 g/);
  assert.doesNotMatch(app.node('sheet').innerHTML, />Meal cooked</);
  app.context.ConsumerUI.closeCooking(); app.context.MealPrepUI.openSession(); app.context.MealPrepUI.exportSession();
  assert.equal(app.downloads[0].name, 'meal-prep-session.txt'); assert.match(app.downloads[0].contents, /Oats: 120 g/);
  app.context.MealPrepUI.check(basic.id, true);
  assert.equal(app.run('MealPrepCore.session(state,recipes).tasks[0].checked'), true);
  app.context.showRecipe(basic.id); app.context.MealPrepUI.choosePortions(3);
  assert.match(app.node('recipeNutritionPreview').innerHTML, /For 3 portions/); assert.match(app.node('recipeIngredientPreview').innerHTML, /120 g/);
  app.context.MealPrepUI.choosePortions(3, true); app.context.openAddToPlan(basic.id, true);
  assert.equal(app.run('pendingPlanServings'), 1, 'A multi-day batch preview adds normal household portions for one meal');
  assert.match(app.node('sheet').innerHTML, /1 household portion for the selected meal/);
  app.context.closeModal(); app.context.showRecipe(basic.id); app.context.MealPrepUI.choosePortions(3, true);
  app.node('recipeTargetServings').value = '2'; app.context.updateRecipeServingPreview(); app.context.openAddToPlan(basic.id, true);
  assert.equal(app.run('pendingPlanServings'), 2, 'Explicitly edited meal portions still apply after a batch preview');
  app.context.closeModal();
  const after = app.state(); for (const field of ['week', 'pantry', 'leftovers', 'pantryLedger', 'foodLog']) assert.deepEqual(after[field], before[field]);
  const reload = harness({ state: after }); await reload.flush();
  assert.equal(reload.run('MealPrepCore.session(state,recipes).tasks[0].checked'), true);
  app.run('state.mealServings["Monday::0"]=2'); assert.equal(app.run('MealPrepCore.session(state,recipes).tasks[0].checked'), false);
  app.run('state.week=[{day:"Monday",meals:["social-chocolate-yoghurt-bark"]}];renderAll()');
  app.context.MealPrepUI.openSession(); app.context.MealPrepUI.cook('social-chocolate-yoghurt-bark');
  assert.match(app.node('sheet').innerHTML, /Whole batches prepare 4 portions/);
  app.context.ConsumerUI.closeCooking(); app.context.MealPrepUI.openSession(); app.context.MealPrepUI.record('social-chocolate-yoghurt-bark');
  assert.match(app.node('sheet').innerHTML, /<option selected>Freezer<\/option>/, 'Frozen recipes start with freezer storage');
});
test('use-soon reminders save real dates without creating stock, spending or food-log transactions', async () => {
  const app = harness(); await app.flush();
  app.run('state.pantry[0].expiry=PantryCore.today();renderAll()');
  assert.match(app.node('home').innerHTML, /Due today/); assert.match(app.node('pantry').innerHTML, /Use soon &amp; check dates|Use soon & check dates/);
  const before = app.state(), id = before.pantry[0].id;
  app.context.MealPrepUI.openDates(); assert.match(app.node('sheet').innerHTML, /Recorded expiry/);
  app.context.MealPrepUI.date('pantry', id, '2026-02-30', 0);
  assert.match(app.node('toast').textContent, /valid expiry date/); assert.equal(app.state().pantry[0].expiry, before.pantry[0].expiry);
  app.context.MealPrepUI.date('pantry', id, '2099-01-01', 0);
  assert.equal(app.state().pantry[0].expiry, '2099-01-01'); assert.match(app.node('prepDateStatus-0').textContent, /Date saved/);
  const after = app.state(); for (const field of ['week', 'pantryLedger', 'foodLog']) assert.deepEqual(after[field], before[field]);
  assert.equal(after.pantry[0].qty, before.pantry[0].qty);
});

test('taste controls persist, show selected states and remove skipped recipes from future payloads', async () => {
  const app = harness(); await app.flush();
  app.context.showRecipe(basic.id, 'Monday', 0);
  assert.match(app.node('sheet').innerHTML, /Would eat again/);
  app.context.setRecipeFeedback(basic.id, 'again');
  assert.match(app.node('sheet').innerHTML, /aria-pressed="true" onclick="setRecipeFeedback\('user_measured_oats','again'\)"/);
  assert.equal(app.state().recipeFeedback[0].value, 'again');
  assert.equal(JSON.parse(app.storage.get('mealPlannerState')).recipeFeedback[0].value, 'again');
  let payload = copy(app.context.budgetPlannerPayload());
  assert.ok(payload.recipes.find(row => row.id === basic.id).preferenceScore > 0);
  app.context.setRecipeFeedback(basic.id, 'skip');
  payload = copy(app.context.budgetPlannerPayload());
  assert.ok(payload.excludedRecipeIds.includes(basic.id));
  assert.ok(!payload.recipes.some(row => row.id === basic.id));
  assert.match(app.node('sheet').innerHTML, /You chose Skip next time/);
  app.context.setRecipeFeedback(basic.id, null);
  assert.equal(app.state().recipeFeedback.length, 0);
  assert.ok(app.context.budgetPlannerPayload().recipes.some(row => row.id === basic.id));
});

test('editable-copy controls keep source rows and provenance untouched while saving measured corrections', async () => {
  const app = harness(); await app.flush();
  const sourceId = 'everyday-chicken-pepper-couscous';
  const original = copy(app.context.getRecipe(sourceId));
  app.context.showRecipe(sourceId);
  assert.match(app.node('sheet').innerHTML, /Make editable copy/);
  app.context.makeRecipeCopy(sourceId);
  const copied = app.state().customRecipes.find(row => row.copiedFrom?.recipeId === sourceId);
  assert.ok(copied); assert.equal(copied.custom, true); assert.equal(copied.cost, null);
  assert.match(app.node('sheet').innerHTML, /Edit recipe/);
  app.node('editName').value = 'My lighter chicken couscous';
  app.node('editServings').value = '2';
  app.node('editIngredients').value = 'Chicken breast | 180 | g\nCouscous | 60 | g\nFrozen mixed peppers | 240 | g\nCooking oil | 6 | g';
  app.node('editMethod').value = 'Prepare weighed dry couscous.\nCook chicken and peppers in all the measured oil until fully cooked.';
  app.context.saveEditedRecipe(copied.id);
  const edited = app.state().customRecipes.find(row => row.id === copied.id);
  assert.equal(edited.servings, 2); assert.equal(edited.nutritionStatus, 'estimated');
  assert.equal(edited.kcal, null); assert.equal(edited.p, null); assert.equal(edited.correctionDraft, false);
  assert.equal(edited.copiedFrom.recipeId, sourceId);
  assert.equal(app.context.recipeNutrition(edited).complete, true);
  assert.deepEqual(copy(app.context.getRecipe(sourceId)), original);
});

test('recipe review reasons and ready filter use calculated nutrition and measured corrections', async () => {
  const incomplete = { ...copy(basic), id: 'user_unknown', servings: null, ings: [['Oats', null, 'g']], method: [], needsReview: true };
  const app = harness({ state: { customRecipes: [copy(basic), incomplete] } }); await app.flush();
  app.context.showRecipe(incomplete.id);
  assert.match(app.node('sheet').innerHTML, /Confirm how many portions/);
  assert.match(app.node('sheet').innerHTML, /Confirm the quantity/);
  assert.match(app.node('sheet').innerHTML, /Add the cooking steps/);
  assert.match(app.node('sheet').innerHTML, /Fix recipe details/);
  app.run('activeRecipeReady=true;renderRecipes()');
  assert.doesNotMatch(app.node('recipeResults').innerHTML, /user_unknown/);
  app.context.openEditRecipe(incomplete.id);
  app.node('editServings').value = '1'; app.node('editIngredients').value = 'Oats | 40 | g\nMilk | 150 | ml'; app.node('editMethod').value = 'Simmer the measured oats and milk until tender.';
  app.context.saveEditedRecipe(incomplete.id);
  const corrected = app.state().customRecipes.find(row => row.id === incomplete.id);
  assert.equal(app.context.recipeNutrition(corrected).complete, true);
  assert.equal(app.context.recipeReadinessHtml(corrected), '');
});

test('cooking mode runs the shipped step controls and confirmation deducts stock once with recent meal history', async () => {
  const app = harness(); await app.flush();
  const before = app.state().pantry;
  app.context.ConsumerUI.start(basic.id, 'Monday', 0);
  assert.match(app.node('sheet').innerHTML, /Step 1 of 2/);
  assert.match(app.node('sheet').innerHTML, /Measure the oats and milk/);
  app.context.ConsumerUI.step(1);
  assert.match(app.node('sheet').innerHTML, /Step 2 of 2/);
  app.context.ConsumerUI.step(5);
  assert.match(app.node('sheet').innerHTML, /Step 2 of 2/);
  app.context.ConsumerUI.setTimer(2);
  assert.match(app.node('cookTimer').textContent, /^1:5\d|2:00$/);
  app.context.ConsumerUI.cancelTimer(); assert.equal(app.node('cookTimer').textContent, 'No timer running');
  app.context.ConsumerUI.finishCooking();
  assert.match(app.node('sheet').innerHTML, /Confirm cooking & update pantry/);
  app.context.PantryUI.confirmCook(false);
  let current = app.state();
  assert.equal(current.pantry.find(row => row.name === 'Oats').qty, before.find(row => row.name === 'Oats').qty - 40);
  assert.equal(current.pantry.find(row => row.name === 'Milk').qty, before.find(row => row.name === 'Milk').qty - 150);
  assert.equal(current.recentMeals.length, 1); assert.equal(current.recentMeals[0].recipeId, basic.id);
  assert.equal(current.pantryLedger.transactions.length, 1);
  app.context.PantryUI.confirmCook(false);
  current = app.state(); assert.equal(current.recentMeals.length, 1); assert.equal(current.pantryLedger.transactions.length, 1);
  assert.match(app.context.PantryUI.mealActions('Monday', 0), /Cooked \/ served/);
  assert.doesNotMatch(app.context.PantryUI.mealActions('Monday', 0), /Meal cooked/);
  app.context.PantryUI.undo(current.recentMeals[0].transactionId);
  assert.equal(app.state().recentMeals.length, 0);
  assert.equal(app.state().pantry.find(row => row.name === 'Oats').qty, 1000);
});

test('cooked meals remain locked in payload even after a skip preference or diet change', async () => {
  const app = harness(); await app.flush();
  app.context.PantryUI.openCook('Monday', 0); app.context.PantryUI.confirmCook(false);
  app.context.setRecipeFeedback(basic.id, 'skip');
  app.run('state.profile.diet="Vegan"');
  const payload = copy(app.context.budgetPlannerPayload());
  assert.equal(payload.locked['Monday::0'], true);
  assert.equal(payload.cookedMeals['Monday::0'].recipeId, basic.id);
  assert.equal(payload.cookedMeals['Monday::0'].servings, 1);
  assert.ok(payload.recipes.some(row => row.id === basic.id), 'Keep past recipe nutrition and identity in the payload');
  assert.ok(payload.excludedRecipeIds.includes(basic.id), 'The past slot is retained, while future uncooked occurrences remain excluded');
});

test('changing extra cooked portions at confirmation first shows the revised ingredient preview', async () => {
  const app = harness(); await app.flush();
  app.context.PantryUI.openCook('Monday', 0);
  app.context.document.getElementById('cookExtra').value = '.25';
  app.context.PantryUI.confirmCook(false);
  assert.equal(app.state().pantryLedger.transactions.length, 0);
  assert.match(app.elements.get('sheet').innerHTML, /0.25 cooked portions/);
  app.context.PantryUI.confirmCook(false);
  assert.equal(app.state().leftovers[0].servings, .25);
  assert.equal(app.state().pantry.find(row => row.name === 'Oats').qty, 950);
});

test('next up advances past cooked meals and shows a finished day once every slot is served', async () => {
  const app = harness(); await app.flush();
  app.context.PantryUI.openCook('Monday', 0); app.context.PantryUI.confirmCook(false);
  assert.notEqual(app.context.nextMealIndex(app.state().week[0]), 0);
  app.run('for(const [index,id] of state.week[0].meals.entries()){const recipe=getRecipe(id);state.pantryLedger.cooked[PantryCore.slotKey(state,"Monday",index)]={recipeId:id,recipeSignature:PantryCore.recipeSignature(recipe),servings:getMealServings("Monday",index)};}renderHome();');
  assert.equal(app.context.nextMealIndex(app.state().week[0]), -1);
  assert.match(app.elements.get('home').innerHTML, /You’re done for today/);
});

test('export and actual backup import retain pantry transactions, taste and cooking history', async () => {
  const app = harness(); await app.flush();
  app.context.setRecipeFeedback(basic.id, 'again');
  app.context.PantryUI.openCook('Monday', 0); app.context.PantryUI.confirmCook(false);
  app.context.backupData();
  assert.equal(app.downloads.length, 1); assert.match(app.downloads[0].name, /backup/);
  const saved = JSON.parse(app.downloads[0].contents);
  app.context.setRecipeFeedback(basic.id, 'skip');
  app.context.restoreData({ target: { files: [{ contents: JSON.stringify(saved) }] } });
  const restored = app.state();
  assert.deepEqual(restored.recipeFeedback, saved.recipeFeedback);
  assert.deepEqual(restored.recentMeals, saved.recentMeals);
  assert.deepEqual(restored.pantry, saved.pantry);
  assert.deepEqual(restored.pantryLedger, saved.pantryLedger);
  assert.deepEqual(restored.customRecipes, saved.customRecipes);
  assert.equal(app.node('toast').textContent, 'Backup imported');
  const before = app.state();
  app.context.restoreData({ target: { files: [{ contents: '{invalid' }] } });
  assert.equal(app.node('toast').textContent, 'Invalid backup file');
  assert.deepEqual(app.state(), before);
});

test('dashboard includes real paid spend and payload reduces the remaining full-pack budget', async () => {
  const app = harness(); await app.flush();
  app.run('state.pantryLedger.transactions.push({id:"paid",type:"purchase",planId:state.pantryLedger.planId,createdAt:new Date().toISOString(),store:"Asda",totalCostGBP:20,changes:[]});state.profile.days=7;state.week=Array.from({length:7},(_,i)=>({day:MealBudgetCore.dayNames(7)[i],meals:["user_measured_oats","everyday-tuna-crunch-pitta","everyday-turkey-sweet-potato"]}));renderHome()');
  assert.match(app.node('home').innerHTML, /This week · Asda/);
  assert.match(app.node('home').innerHTML, /Still to buy/);
  assert.match(app.node('home').innerHTML, /Daily targets/);
  assert.match(app.node('home').innerHTML, /Meal variety/);
  assert.match(app.node('home').innerHTML, /£20\.00 purchases recorded/);
  assert.equal(app.context.planCashSpent(), 20);
  assert.equal(app.context.budgetPlannerPayload().profile.budget, 25);
  assert.ok(app.context.budgetPlannerPayload().pantry.every(row => row.qty > 0));
});

test('saved offline basket keeps its price date while changed quantities require a new online quote', async () => {
  const app = harness({ online: false }); await app.flush();
  app.run('state.week=[{day:"Monday",meals:["user_measured_oats"]}];state.pantry=[];const items=automaticCatalogItems(Object.entries(buildShopping()));const results=Object.fromEntries(items.map(item=>[item.key,{key:item.key,query:item.name,confidence:"high",match:{productName:item.name},plan:{requestedQuantity:item.quantity,totalQuantity:1000,totalCostGBP:1,products:[{packs:1,costGBP:1,url:"https://www.asda.com/groceries/product/1"}]}}]));state.savedBaskets={Asda:ConsumerTools.snapshot({store:"Asda",status:"ready",items,results,fingerprint:automaticCatalogFingerprint("Asda",items),loadedAt:Date.now()-60000})};automaticCatalogState={store:"",status:"idle",items:[],results:{},fingerprint:"",error:""};requestAutomaticCatalogMatches(Object.entries(buildShopping()),"Asda")');
  assert.equal(app.run('automaticCatalogState.offline'), true);
  app.context.renderShop();
  assert.match(app.node('shop').innerHTML, /Offline · saved prices checked/);
  assert.match(app.node('shop').innerHTML, /Refresh online before confirming a purchase or swap/);
  app.run('state.mealServings["Monday::0"]=2;requestAutomaticCatalogMatches(Object.entries(buildShopping()),"Asda")');
  assert.equal(app.run('automaticCatalogState.status'), 'error');
  assert.match(app.run('automaticCatalogState.error'), /Go online to price this changed list/);
});

test('the actual diary scales personal food, preserves history in backups and leaves household planning unchanged', async () => {
  const app = harness(); await app.flush();
  const original = app.state();
  assert.match(app.node('home').innerHTML, /Food diary/);
  app.context.FoodLogUI.mode(true);
  for (const [id, value] of Object.entries({ diaryDate: '2026-10-11', diaryName: 'Snack bar', diaryBasis: '100', diaryBasisUnit: 'g', 'diary-kcal': '400', 'diary-p': '', 'diary-c': '50', 'diary-f': '18', diaryAmount: '25' })) app.node(id).value = value;
  app.node('diarySaveFood').checked = true;
  app.context.FoodLogUI.preview(); assert.match(app.node('diaryPreview').textContent, /100 kcal/);
  app.context.FoodLogUI.commit();
  const saved = app.state(); assert.equal(saved.foodLog[0].nutrition.kcal, 100); assert.equal(saved.foodLog[0].nutrition.p, null); assert.equal(saved.savedFoods.length, 1);
  assert.deepEqual(saved.week, original.week); assert.deepEqual(saved.pantry, original.pantry);
  assert.match(app.node('home').innerHTML, /some macros missing/);
  assert.equal(app.context.budgetPlannerPayload().foodLog, undefined);
  app.context.backupData(); const backup = app.downloads.at(-1).contents;
  app.context.confirmNextPlan(); assert.equal(app.state().foodLog.length, 1);
  app.context.restoreData({ target: { files: [{ contents: backup }] } }); assert.equal(app.state().foodLog[0].nutrition.kcal, 100);
});

test('logging a planned meal uses personal portions and rejects a second entry for the same date and slot', async () => {
  const app = harness({ state: { mealServings: { 'Monday::0': 3 } } }); await app.flush();
  app.run('state.profile.people=2');
  app.context.FoodLogUI.openRecipe(basic.id, 'Monday', 0);
  assert.equal(Number(app.node('diaryAmount').value), 1.5);
  app.node('diaryDate').value = '2026-10-11'; app.context.FoodLogUI.commit();
  assert.equal(app.state().foodLog.length, 1);
  const originalCalories = app.state().foodLog[0].nutrition.kcal;
  app.context.FoodLogUI.openRecipe(basic.id, 'Monday', 0); app.node('diaryDate').value = '2026-10-11'; app.context.FoodLogUI.commit();
  assert.equal(app.state().foodLog.length, 1); assert.equal(app.state().foodLog[0].nutrition.kcal, originalCalories);
  app.context.FoodLogUI.edit(app.state().foodLog[0].id); app.node('diaryDate').value = '2026-10-11'; app.node('diaryAmount').value = '1'; app.context.FoodLogUI.commit();
  assert.ok(app.state().foodLog[0].nutrition.kcal < originalCalories);
});

test('daily favourites persist in settings and planner payloads without waiving ingredient nutrition', async () => {
  const app = harness(); await app.flush();
  app.context.repeatRecipeEveryDay(basic.id);
  assert.equal(app.state().profile.varietyMode, 'Repeat favourites'); assert.equal(app.state().profile.repeatMeals.Breakfast, basic.id);
  assert.match(app.node('profile').innerHTML, /Every day · Breakfast/);
  const payload = app.context.budgetPlannerPayload(); assert.equal(payload.profile.meals, 3); assert.equal(payload.profile.repeatMeals.Breakfast, basic.id);
  const wrap = app.run('recipeNutrition(getRecipe("everyday-tuna-pickle-egg-mayo-wrap"))'); assert.equal(wrap.complete, true); assert.ok(wrap.kcal > 400);
  app.context.openEditRecipe(basic.id); app.node('editServings').value = '2'; app.context.updateEditedNutritionPreview();
  assert.match(app.node('editNutritionPreview').innerHTML, /Estimate per serving/);
  app.node('editIngredientName').value = 'Olive oil'; app.node('editIngredientAmount').value = '5'; app.node('editIngredientUnit').value = 'g'; app.context.appendMeasuredIngredient('edit');
  assert.match(app.node('editIngredients').value, /Olive oil \| 5 \| g/);
});
