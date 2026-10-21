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
      createElement: () => element(), addEventListener: (event, callback) => {
        const previous = listeners.get(event);
        listeners.set(event, () => { previous?.(); callback(); });
      },
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

function oneOffForm(app, changes={}) {
  for(const [key,value] of Object.entries({oneOffBudget:10,oneOffPeople:1,oneOffCategory:'Dinner',oneOffQuery:'Oneoff fixture',...changes}))app.node(key).value=value;
  app.node('oneOffPantry').checked=true;
}

test('meal-count buttons refresh the settings on touch browsers that leave focus in a number input',async()=>{
 const app=harness();await app.flush();app.context.showTab('profile');
 const input=app.node('bud');input.matches=selector=>selector==='input,textarea';app.context.document.activeElement=input;
 app.node('profile').contains=value=>value===input;
 app.context.setChoice('meals','2');
 assert.equal(app.state().profile.meals,2);assert.doesNotMatch(app.node('profile').innerHTML,/id="dailyMealBreakfast"/);
 assert.match(app.node('profile').innerHTML,/id="dailyMealLunch"/);assert.equal(JSON.parse(app.storage.get('mealPlannerState')).profile.meals,2);
 app.context.setChoice('meals','3');assert.match(app.node('profile').innerHTML,/id="dailyMealBreakfast"/);
});
const oneOffRecipe={id:'user-oneoff-fixture',name:'Oneoff fixture chicken rice',cat:'Dinner',custom:true,servings:1,cookTime:15,ings:[['Chicken breast',200,'g'],['Rice',50,'g']],method:['Cook the rice following the packet.','Cook the chicken thoroughly and serve with rice.']};
function oneOffReply(app, body) {
  const brief=app.context.OneOffMealCore.normalise(body),recipe=body.recipes[0],shopping=app.context.OneOffMealCore.shopping(recipe,brief,body.pantry);
  const recommendations=shopping.items.map(item=>{const product={productName:item.name,url:'https://www.asda.com/groceries/product/fixture/123',packs:1,packSize:'1 kg',packQuantity:1000,packUnit:'g',priceGBP:1,costGBP:1,totalQuantity:1000,sourceStore:'Asda'};return {key:item.key,query:item.name,dimension:item.dimension,match:product,plan:{requestedQuantity:item.quantity,totalQuantity:1000,totalCostGBP:1,products:[product]}};});
  return {ok:true,store:brief.store,brief,affordable:1,unpriced:0,options:[{recipeId:recipe.id,people:brief.people,totalCostGBP:recommendations.length,estimatedPrice:false,recommendations,refreshedAt:new Date().toISOString(),items:shopping.items}]};
}
test('one-off dinner uses its own £10 budget and full-pack quote without changing weekly meals, targets, stock or spending',async()=>{
  const app=harness({state:{customRecipes:[copy(oneOffRecipe)],profile:{supermarket:'Asda',days:14,budget:35,people:2,calories:1600,protein:150,equipment:['Hob']}}});await app.flush();
  assert.match(app.node('home').innerHTML,/One-off meal/);
  const before=app.state();await app.context.OneOffMealUI.open();oneOffForm(app);
  let sent;
  app.context.fetch=async(url,options)=>{assert.equal(url,'/api/meals/one-off');sent=JSON.parse(options.body);return {ok:true,json:async()=>oneOffReply(app,sent)};};
  await app.context.OneOffMealUI.find();
  assert.equal(sent.budget,10);assert.equal(sent.people,1);assert.equal(sent.category,'Dinner');assert.equal(sent.recipes.length,1);
  assert.equal(sent.week,undefined);assert.equal(sent.profile.calories,undefined);
  assert.match(app.node('oneOffResults').innerHTML,/£2.00 to buy|£2\.00 to buy/);
  assert.match(app.node('oneOffResults').innerHTML,/Copy this shopping list|View recipe/);
  app.context.OneOffMealUI.view(oneOffRecipe.id);assert.equal(app.node('recipeTargetServings').value,'1');
  const after=app.state();for(const key of ['week','profile','pantry','mealServings','shopping','pantryLedger','foodDiary'])assert.deepEqual(after[key],before[key],key+' must stay unchanged');
});
test('editing or closing one-off search cancels late quotes and the browser rejects a falsely cheap basket',async()=>{
  const app=harness({state:{customRecipes:[copy(oneOffRecipe)]}});await app.flush();await app.context.OneOffMealUI.open();oneOffForm(app);
  let release,body;app.context.fetch=(url,options)=>{body=JSON.parse(options.body);return new Promise(resolve=>{release=resolve;});};
  const pending=app.context.OneOffMealUI.find();app.node('oneOffBudget').value='1';app.context.OneOffMealUI.edit();release({ok:true,json:async()=>oneOffReply(app,body)});await pending;
  assert.equal(app.node('oneOffResults').innerHTML,'');
  oneOffForm(app);app.context.fetch=async(url,options)=>{const reply=oneOffReply(app,JSON.parse(options.body));reply.options[0].totalCostGBP=.01;return {ok:true,json:async()=>reply};};
  await app.context.OneOffMealUI.find();assert.equal(app.node('oneOffResults').innerHTML,'');assert.match(app.node('oneOffStatus').textContent,/could not be verified/);
  oneOffForm(app);app.context.fetch=(url,options)=>{body=JSON.parse(options.body);return new Promise(resolve=>{release=resolve;});};
  const closing=app.context.OneOffMealUI.find();app.context.closeModal();release({ok:true,json:async()=>oneOffReply(app,body)});await closing;
  assert.equal(app.node('modal').style.display,'none');assert.equal(app.node('oneOffResults').innerHTML,'');
  await app.context.OneOffMealUI.open();oneOffForm(app);app.context.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await app.context.OneOffMealUI.find();assert.match(app.node('oneOffStatus').textContent,/Go online and try again/);assert.equal(app.node('oneOffResults').innerHTML,'');
});

function tailoredForm(app,overrides={}){
  const fields={tailoredDays:7,tailoredCount:3,tailoredCalories:1800,tailoredProtein:180,tailoredCalorieMode:'max',tailoredCarbs:90,tailoredCarbMode:'target',tailoredFat:'',tailoredQueryBreakfast:'overnight oats',tailoredModeBreakfast:'vary',tailoredRecipeBreakfast:'tailored-berry-oats',tailoredQueryLunch:'tuna pickles eggs mayo wrap',tailoredModeLunch:'repeat',tailoredRecipeLunch:'tailored-tuna-wrap',tailoredQueryDinner:'chicken dish',tailoredModeDinner:'vary',tailoredRecipeDinner:'tailored-lemon-chicken',...overrides};
  for(const [id,value] of Object.entries(fields))app.node(id).value=value;
  app.node('tailoredLowerFat').checked=true;
  const original=app.context.document.querySelectorAll;
  app.context.document.querySelectorAll=selector=>selector==='[data-tailored-equipment]:checked'?[{value:'Hob'}]:original(selector);
}

function kitchenForm(app, overrides = {}) {
  for (const [id, value] of Object.entries({ kitchenIngredient: 'Chicken breast', kitchenGrams: 1000, kitchenBasis: 'raw', kitchenDays: 5, kitchenPeople: 1, kitchenStyle: 'curry', kitchenRecipe: 'afford-chicken-lentil-curry', ...overrides })) app.node(id).value = value;
}

function conversationalFixture(app,payload){
 const slots=app.context.MealBudgetCore.mealSlots(payload.profile.meals),week=app.context.MealBudgetCore.dayNames(payload.profile.days).map(day=>({day,meals:slots.map(cat=>payload.profile.tailoredMeals?.[cat]?.recipeIds[0]||payload.recipes.find(row=>row.cat===cat).id)})),mealServings=Object.fromEntries(week.flatMap(row=>row.meals.map((_,i)=>[row.day+'::'+i,.25])));
 app.context.planFixture={...app.state(),profile:payload.profile,week,mealServings};
 const shopping=app.run('MealBudgetCore.buildShopping(PantryCore.shoppingInput(planFixture,recipes))'),items=app.context.automaticCatalogItems(Object.entries(shopping));
 const recommendations=items.map(item=>({key:item.key,match:{productName:'Test pack for '+item.name},plan:{requestedQuantity:item.quantity,totalQuantity:item.quantity,totalCostGBP:.25,products:[{packs:1,costGBP:.25,productName:'Test pack',url:'https://groceries.asda.com/product/test'}]}}));
 return {status:'feasible',store:'Asda',week,mealServings,basket:{complete:true,totalCostGBP:recommendations.length*.25,recommendations}};
}
const directQuestion='Make a 1-day plan; breakfast: measured milk oats; lunch: tuna; dinner: turkey. Under 1600 calories per day and 0g protein.';
test('an assistant plan request interprets and saves a checked plan inside chat without opening the tailored form',async()=>{
 const app=harness();await app.flush();const before=app.state();
 app.context.fetch=async(url,request)=>{const body=JSON.parse(request.body);if(url==='/api/planner/interpret')return {ok:true,json:async()=>({source:'ai',calories:3000,protein:0,nutritionTargets:{fatMax:100},requests:{}})};if(url==='/api/planner/generate')return {ok:true,status:200,text:async()=>JSON.stringify(conversationalFixture(app,body))};return {ok:false,status:503,text:async()=>''};};
 app.context.KitchenAgentUI.open();app.node('agentQuestion').value=directQuestion;await app.context.KitchenAgentUI.send();
 assert.equal(app.state().kitchenConversation.messages.at(-1).planReceipt.status,'saved',app.state().kitchenConversation.messages.at(-1).text);assert.equal(app.state().week.length,1);assert.equal(app.state().profile.calories,1600);assert.equal(app.state().profile.nutritionTargets.calorieMode,'max');assert.match(app.node('agentMessages').innerHTML,/View my plan/);assert.doesNotMatch(app.node('sheet').innerHTML,/Tailor your next plan|Review my plan request/);
 for(const key of ['pantry','leftovers','pantryLedger','foodLog'])assert.deepEqual(app.state()[key],before[key],key);
 const restored=harness({state:app.state()});await restored.flush();restored.context.KitchenAgentUI.open();assert.match(restored.node('agentMessages').innerHTML,/Your saved plan/);
});
test('AI context off sends no saved defaults to interpretation while deterministic plan checks still use current constraints',async()=>{
 const app=harness();await app.flush();const before=app.state(),bodies=[];app.context.KitchenAgentUI.open();app.node('agentUseSettings').checked=false;app.node('agentUsePantry').checked=false;app.context.KitchenAgentUI.contextChanged();
 app.context.fetch=async(url,request)=>{bodies.push({url,body:JSON.parse(request.body)});return url==='/api/planner/interpret'?{ok:false,status:503}:{ok:true,status:200,text:async()=>JSON.stringify({status:'no_feasible_plan'})};};
 app.node('agentQuestion').value=directQuestion;await app.context.KitchenAgentUI.send();assert.deepEqual(bodies.find(row=>row.url==='/api/planner/interpret').body.defaults,{});
 const payload=bodies.find(row=>row.url==='/api/planner/generate').body;assert.equal(payload.profile.budget,before.profile.budget);assert.equal(payload.foodLog,undefined);assert.equal(payload.recipeNotes,undefined);assert.deepEqual(app.state().profile,before.profile);assert.deepEqual(app.state().week,before.week);
});
test('closing, stopping or changing context cancels direct planning and discards a late successful response',async()=>{
 for(const action of ['close','stop','context']){
  const app=harness();await app.flush();const before=app.state();let release,reached;const ready=new Promise(resolve=>reached=resolve);
  app.context.fetch=async(url,request)=>{if(url==='/api/planner/interpret')return {ok:false,status:503};if(url==='/api/planner/generate'){const fixture=conversationalFixture(app,JSON.parse(request.body));reached();await new Promise(resolve=>release=resolve);return {ok:true,status:200,text:async()=>JSON.stringify(fixture)};}return {ok:false,status:503,text:async()=>''};};
  app.context.KitchenAgentUI.open();app.node('agentQuestion').value=directQuestion;const pending=app.context.KitchenAgentUI.send();await ready;
  if(action==='close')app.context.closeModal();if(action==='stop')app.context.KitchenAgentUI.stopRequest();if(action==='context')app.context.KitchenAgentUI.contextChanged();release();await pending;
  for(const key of ['profile','week','pantry','foodLog','pantryLedger'])assert.deepEqual(app.state()[key],before[key],key+' '+action);assert.equal(app.state().kitchenConversation.draft,directQuestion);assert.equal(app.state().kitchenConversation.messages.length,0);
 }
});
test('inline duration clarification accepts a short reply and carries earlier meal requests into the new search',async()=>{
 const app=harness();await app.flush();app.context.KitchenAgentUI.open();app.node('agentQuestion').value='Make a month-long plan, breakfast: overnight oats variety';
 // Supported duration parsing uses the natural "for a month" form.
 app.node('agentQuestion').value='For a month, breakfast: overnight oats variety';await app.context.KitchenAgentUI.send();assert.match(app.node('agentMessages').innerHTML,/1 to 14/);assert.equal(app.state().kitchenConversation.planDraft.pendingField,'days');
 app.context.fetch=async(url,request)=>url==='/api/planner/interpret'?{ok:false,status:503}:{ok:true,status:200,text:async()=>JSON.stringify({status:'no_feasible_plan'})};
 app.node('agentQuestion').value='7';await app.context.KitchenAgentUI.send();assert.equal(app.state().kitchenConversation.planDraft.days,7);assert.equal(app.state().kitchenConversation.planDraft.requests.Breakfast.query,'overnight oats variety');assert.match(app.node('sheet').innerHTML,/Kitchen assistant/);
});

test('the conversational assistant retains food requests across follow-ups and keeps all plan/stock/intake records read-only', async () => {
 const app=harness();await app.flush();const before=app.state();app.context.KitchenAgentUI.open();
 app.node('agentQuestion').value='Find high-protein chicken dinners';await app.context.KitchenAgentUI.send();
 let conversation=app.state().kitchenConversation;assert.equal(conversation.messages.length,2);assert.equal(conversation.focus.protein,'chicken');assert.ok(conversation.messages[1].recipeIds.length);assert.match(app.node('agentMessages').innerHTML,/Per portion/);
 app.node('agentQuestion').value='Make it lower fat';await app.context.KitchenAgentUI.send();conversation=app.state().kitchenConversation;assert.equal(conversation.messages.length,4);assert.equal(conversation.focus.protein,'chicken');assert.equal(conversation.focus.lowerFat,true);assert.equal(conversation.focus.category,'Dinner');
 app.node('agentQuestion').value='Compare these recipes';await app.context.KitchenAgentUI.send();assert.equal(app.state().kitchenConversation.messages.at(-1).kind,'compare');
 for(const key of ['week','profile','pantry','leftovers','foodLog','savedFoods','shopping','pantryLedger'])assert.deepEqual(app.state()[key],before[key],key);
 const restored=harness({state:app.state()});await restored.flush();restored.context.KitchenAgentUI.open();assert.match(restored.node('agentMessages').innerHTML,/Make it lower fat/);assert.equal(restored.state().kitchenConversation.focus.protein,'chicken');
});
test('assistant context selection strips private data and closing a pending request retains a retryable draft',async()=>{
 const app=harness();await app.flush();app.context.KitchenAgentUI.open();app.node('agentUseSettings').checked=false;app.node('agentUsePantry').checked=false;app.context.KitchenAgentUI.contextChanged();
 let resolve,body;app.context.fetch=(_url,options)=>new Promise(done=>{body=JSON.parse(options.body);resolve=done;});app.node('agentQuestion').value='Find chicken dinners';const pending=app.context.KitchenAgentUI.send();
 assert.equal(body.context,null);assert.equal(body.foodLog,undefined);assert.equal(body.personalNotes,undefined);assert.ok(body.recipes.every(row=>row.personalNote===undefined));
 app.context.closeModal();const before=app.state();resolve({ok:true,json:async()=>({text:'A late response',source:'ai',recipeIds:body.recipes.slice(0,1).map(row=>row.id)})});await pending;assert.deepEqual(app.state(),before);assert.equal(app.state().kitchenConversation.draft,'Find chicken dinners');assert.equal(app.state().kitchenConversation.messages.length,0);
});
test('changed recipes disable assistant actions and batch handoff retains confirmed quantities through follow-ups',async()=>{
 const app=harness({state:{profile:{days:7,meals:3,budget:35,people:1,calories:1600,protein:150,cookTime:45,supermarket:'Asda',equipment:['Hob']}}});await app.flush();app.context.KitchenAgentUI.open();
 app.node('agentQuestion').value='Help me prep 1kg raw chicken breast curry for 5 days';await app.context.KitchenAgentUI.send();app.node('agentQuestion').value='Make it lower fat';await app.context.KitchenAgentUI.send();
 let message=app.state().kitchenConversation.messages.at(-1);const id=message.recipeIds[0];app.context.KitchenAgentUI.prepare(id,3);await app.flush();assert.match(app.node('kitchenReview').innerHTML,/Weight available/);assert.match(app.node('kitchenProposal').innerHTML,/1,000 g raw chicken breast/);assert.match(app.node('kitchenProposal').innerHTML,/5 equal portions/);
 app.context.closeModal();app.context.KitchenAgentUI.open();app.run('recipes.find(r=>r.id===state.kitchenConversation.messages[3].recipeIds[0]).ings[0][1]+=1');
 const before=app.state().week;app.context.KitchenAgentUI.view(id,3);assert.deepEqual(app.state().week,before);assert.match(app.node('toast').textContent,/settings changed/);
});
test('assistant storage advice stays deterministic and failed direct plans remain in chat without changing saved meals',async()=>{
 const app=harness();await app.flush();const before=app.state();app.context.KitchenAgentUI.open();app.node('agentQuestion').value='How long can I keep cooked rice in the fridge?';await app.context.KitchenAgentUI.send();
 assert.match(app.node('agentMessages').innerHTML,/24 hours/);assert.match(app.node('agentMessages').innerHTML,/within one hour/);assert.match(app.node('agentMessages').innerHTML,/Food Standards Agency|gov.uk/);
 app.context.fetch=async url=>url==='/api/planner/generate'?{ok:true,status:200,text:async()=>JSON.stringify({status:'no_feasible_plan',basket:{complete:false}})}:{ok:false,status:503,json:async()=>({})};
 app.node('agentQuestion').value='For the next 14 days, overnight oats for breakfast, tuna for lunch and chicken for dinner, 1600 calories per day';await app.context.KitchenAgentUI.send();assert.doesNotMatch(app.node('agentMessages').innerHTML,/Review my plan request/);assert.match(app.node('agentMessages').innerHTML,/saved plan is unchanged/);
 assert.deepEqual(app.state().week,before.week);assert.deepEqual(app.state().profile,before.profile);assert.deepEqual(app.state().pantry,before.pantry);
 assert.match(app.node('sheet').innerHTML,/Kitchen assistant/);assert.doesNotMatch(app.node('sheet').innerHTML,/Tailor your next plan/);assert.equal(app.state().kitchenConversation.planDraft.days,14);assert.deepEqual(app.state().week,before.week);
});
test('new navy defaults and selectable palettes survive reload without changing food or planning preferences',async()=>{
 const app=harness();await app.flush();const before=app.state();assert.equal(app.context.AppExperienceUI.prefs().palette,'navy');
 app.context.AppExperienceUI.palette('clay');assert.equal(app.state().interfacePreferences.palette,'clay');app.context.AppExperienceUI.theme('dark');assert.match(app.context.AppExperienceUI.more(),/Navy &amp; soft blue|Navy & soft blue/);
 for(const key of ['week','profile','pantry','foodLog','pantryLedger'])assert.deepEqual(app.state()[key],before[key],key);
 const restored=harness({state:app.state()});await restored.flush();assert.equal(restored.context.AppExperienceUI.prefs().palette,'clay');assert.equal(restored.context.AppExperienceUI.prefs().theme,'dark');
});
test('assistant food requests can tighten a vegan profile but cannot loosen its animal-ingredient restrictions',async()=>{
 const app=harness({state:{profile:{days:7,meals:3,budget:35,people:1,calories:1600,protein:150,cookTime:45,supermarket:'Asda',equipment:['Hob'],diet:'Vegan'}}});await app.flush();app.context.KitchenAgentUI.open();
 app.node('agentQuestion').value='Find vegetarian dinners';await app.context.KitchenAgentUI.send();
 const ids=app.state().kitchenConversation.messages.at(-1).recipeIds;assert.ok(ids.length);
 for(const id of ids)assert.equal(app.run('recipeAllowed(getRecipe('+JSON.stringify(id)+'),{...state.profile,varietyMode:"Balanced",tailoredMeals:{},scheduledMeals:[]})'),true);
 assert.equal(app.state().profile.diet,'Vegan');
});

test('pantry filters and reversible quantity corrections keep the diary, meal plan and paid spending separate', async () => {
  const app = harness(); await app.flush(); const before = app.state(); app.context.PantryUI.renderPantry();
  app.node('pantryStockQuery').value = 'milk'; app.node('pantryStockPlace').value = 'Fridge'; app.node('pantryStockStatus').value = 'all'; app.context.PantryUI.searchStock();
  assert.match(app.node('pantryStockResults').innerHTML, /Milk/); assert.doesNotMatch(app.node('pantryStockResults').innerHTML, />Oats</);
  assert.deepEqual(app.state(), before);
  const id = before.pantry.find(row => row.name === 'Milk').id; app.context.PantryUI.editStock(id);
  for (const [key, value] of Object.entries({ stockEditQty: 600, stockEditPlace: 'Fridge', stockEditExpiry: '', stockEditReason: 'Used outside the plan' })) app.node(key).value = value;
  app.context.PantryUI.saveStock(); let current = app.state(); assert.equal(current.pantry.find(row => row.id === id).qty, 600);
  assert.match(app.node('pantry').innerHTML, /Used outside the plan/);
  for (const key of ['week', 'foodLog', 'profile', 'leftovers', 'shopping']) assert.deepEqual(current[key], before[key], key);
  app.context.PantryUI.undo(current.pantryLedger.transactions.at(-1).id); assert.deepEqual(app.state().pantry, before.pantry);
  app.context.PantryUI.removeItem(id); current = app.state(); assert.equal(current.pantry.length, before.pantry.length - 1);
  app.context.PantryUI.undo(current.pantryLedger.transactions.at(-1).id); assert.deepEqual(app.state().pantry, before.pantry);
});
test('closed, invalid or changed pantry editors cannot apply a stale stock adjustment', async () => {
  const app = harness(); await app.flush(); const id = app.state().pantry[0].id; app.context.PantryUI.editStock(id);
  for (const [key, value] of Object.entries({ stockEditQty: -1, stockEditPlace: 'Pantry', stockEditExpiry: '', stockEditReason: 'Stock correction' })) app.node(key).value = value;
  const before = app.state(); app.context.PantryUI.saveStock(); assert.deepEqual(app.state(), before); assert.match(app.node('stockEditError').textContent, /remaining quantity/);
  app.node('stockEditQty').value = 500; app.run('state.pantry[0].qty=200'); const changed = app.state(); app.context.PantryUI.saveStock(); assert.deepEqual(app.state(), changed); assert.match(app.node('stockEditError').textContent, /stock changed/);
  app.context.closeModal(); app.context.PantryUI.saveStock(); assert.deepEqual(app.state(), changed);
});
test('recent-food shortcuts review frozen label values and selected diary dates before creating a separate intake entry', async () => {
  const app = harness(); await app.flush();
  app.run('FoodLogCore.record(state,{date:"2026-10-12",food:{name:"My snack",quantity:100,unit:"g",nutrition:{kcal:400,p:10,c:50,f:null,source:"label"}},quantity:25,originKey:"meal-reference"},{id:"past-snack"});FoodLogCore.saveFood(state,{name:"My snack",quantity:100,unit:"g",nutrition:{kcal:900,p:20,c:70,f:20,source:"label"}},{id:"new-label"});renderHome()');
  const before = app.state(); assert.match(app.node('home').innerHTML, /Log a recent food again/);
  app.context.FoodLogUI.setDate('2026-10-13'); app.context.FoodLogUI.openRecent('past-snack');
  assert.equal(app.node('diaryAmount').value, '25'); assert.equal(app.node('diaryUnit').value, 'g'); assert.match(app.node('diaryPreview').innerHTML, /100 kcal/); assert.match(app.node('diaryPreview').innerHTML, /missing macros/);
  assert.deepEqual(app.state(), before, 'Opening the shortcut records nothing.');
  app.node('diaryDate').value = '2026-10-13'; app.node('diarySaveFood').checked = false; app.context.FoodLogUI.commit();
  const current = app.state(); assert.equal(current.foodLog.length, 2); assert.equal(current.foodLog[1].date, '2026-10-13'); assert.equal(current.foodLog[1].nutrition.kcal, 100); assert.equal(current.foodLog[1].nutrition.f, null); assert.equal(current.foodLog[1].originKey, null);
  for (const key of ['week', 'pantry', 'leftovers', 'profile', 'savedFoods', 'pantryLedger']) assert.deepEqual(current[key], before[key], key);
  const restored = harness({ state: current }); await restored.flush(); restored.context.FoodLogUI.openRecent(current.foodLog[1].id); assert.match(restored.node('diaryPreview').innerHTML, /100 kcal/);
});
test('diary date navigation and changing entry mode retain the chosen calendar date without logging', async () => {
  const app = harness(); await app.flush(); const before = app.state();
  app.context.FoodLogUI.setDate('2026-10-31'); app.context.FoodLogUI.moveDate(1); assert.match(app.context.FoodLogUI.panel(), /value="2026-11-01"/);
  app.context.FoodLogUI.open(); app.node('diaryDate').value = '2026-11-01'; app.context.FoodLogUI.mode(true); assert.match(app.node('sheet').innerHTML, /value="2026-11-01"/);
  app.context.FoodLogUI.moveDate(-1); assert.match(app.context.FoodLogUI.panel(), /value="2026-10-31"/); assert.deepEqual(app.state(), before);
});
test('the kitchen assistant builds a real measured batch offline and keeps the plan, diary, stock and targets intact', async () => {
  const app = harness(); await app.flush(); const before = app.state();
  assert.match(app.node('home').innerHTML, /kitchen assistant/i);
  await app.context.KitchenAssistantUI.open();
  app.node('kitchenQuestion').value = 'How should I prep 1kg chicken curry for the next 5 days?';
  await app.context.KitchenAssistantUI.ask();
  assert.match(app.node('kitchenStatus').textContent, /Review the weight/);
  assert.match(app.node('kitchenProposal').innerHTML, /1,000 g raw chicken breast/);
  assert.match(app.node('kitchenProposal').innerHTML, /5 equal portions/);
  assert.match(app.node('kitchenProposal').innerHTML, /24 hours/);
  kitchenForm(app); app.context.KitchenAssistantUI.edit();
  const id = app.context.KitchenAssistantUI.saveBatch(); assert.ok(id);
  const saved = app.state().customRecipes.find(row => row.id === id);
  assert.equal(saved.servings, 5); assert.equal(saved.ings.find(([name]) => name === 'Chicken breast')[1], 1000);
  assert.equal(saved.cost, null); assert.match(saved.method.join(' '), /Reheat only once/);
  app.context.KitchenAssistantUI.saveBatch(); assert.equal(app.state().customRecipes.length, before.customRecipes.length + 1);
  app.context.KitchenAssistantUI.exportGuide(); assert.match(app.downloads.at(-1).contents, /later portions to freeze/);
  for (const key of ['week', 'pantry', 'leftovers', 'profile', 'shopping', 'foodLog', 'pantryLedger']) assert.deepEqual(app.state()[key], before[key], key);
  app.context.KitchenAssistantUI.cook(); assert.match(app.node('sheet').innerHTML, /Cooking mode/); assert.match(app.node('sheet').innerHTML, /5 household portions/);
  assert.equal(app.state().cookingSession.day, null); assert.deepEqual(app.state().pantry, before.pantry);
});
test('kitchen drafts survive closing and reload, and changed or invalid fields cannot save a stale proposal', async () => {
  const app = harness(); await app.flush(); await app.context.KitchenAssistantUI.open();
  kitchenForm(app); app.node('kitchenQuestion').value = 'My saved chicken curry question'; app.context.KitchenAssistantUI.edit();
  const count = app.state().customRecipes.length;
  app.node('kitchenGrams').value = 700; assert.equal(app.context.KitchenAssistantUI.saveBatch(), null); assert.equal(app.state().customRecipes.length, count);
  app.node('kitchenGrams').value = -1; app.context.KitchenAssistantUI.edit(); assert.match(app.node('kitchenStatus').textContent, /10 g to 10 kg/); assert.equal(app.context.KitchenAssistantUI.saveBatch(), null);
  kitchenForm(app); app.context.KitchenAssistantUI.edit(); app.context.closeModal();
  const restored = harness({ state: app.state() }); await restored.flush(); await restored.context.KitchenAssistantUI.open();
  assert.match(restored.node('sheet').innerHTML, /My saved chicken curry question/); assert.match(restored.node('kitchenProposal').innerHTML, /5 equal portions/);
  kitchenForm(restored); restored.run('recipes.find(r=>r.id==="afford-chicken-lentil-curry").ings[0][1]=200');
  assert.equal(restored.context.KitchenAssistantUI.saveBatch(), null);
});
test('closed or edited kitchen requests discard late responses and cooked weights require matching recipes', async () => {
  const app = harness(); await app.flush(); await app.context.KitchenAssistantUI.open();
  let resolve; app.context.fetch = () => new Promise(done => { resolve = done; });
  app.node('kitchenQuestion').value = '1kg chicken curry for 5 days'; const pending = app.context.KitchenAssistantUI.ask();
  app.context.closeModal(); const snapshot = app.state();
  resolve({ ok: true, json: async () => ({ source: 'ai', brief: { ingredient: 'Chicken breast', grams: 1000, basis: 'raw', days: 5, people: 1, query: 'curry' } }) });
  await pending; assert.deepEqual(app.state(), snapshot); assert.equal(app.node('modal').style.display, 'none');
  await app.context.KitchenAssistantUI.open(); kitchenForm(app, { kitchenBasis: 'cooked' }); app.context.KitchenAssistantUI.edit();
  assert.match(app.node('kitchenReview').innerHTML, /Raw and cooked weights cannot be swapped/); assert.equal(app.context.KitchenAssistantUI.saveBatch(), null);
});

test('the Romanian and Polish collection filters dishes without changing a saved plan or preferences',async()=>{
 const app=harness();await app.flush();const before=app.state();app.context.showTab('recipes');app.context.setRecipeCollection('Romanian & Polish');
 assert.match(app.node('recipes').innerHTML,/Recipe cuisine/);assert.match(app.node('recipeResultCount').textContent,/48 of 48/);
 app.context.setRecipeCuisine('Polish');assert.match(app.node('recipeResultCount').textContent,/24 of 24/);assert.doesNotMatch(app.node('recipeResults').innerHTML,/Chicken Ostropel/);
 app.context.setRecipeCategory('Breakfast');assert.match(app.node('recipeResultCount').textContent,/4 of 4/);
 app.context.setRecipeCategory('All');app.node('recipeSearch').value='golabki';app.context.filterRecipes();assert.match(app.node('recipeResultCount').textContent,/1 of 1/);assert.match(app.node('recipeResults').innerHTML,/Gołąbki/);
 // This minimal DOM keeps old input nodes after innerHTML replacement; mirror
 // the empty search input that reset renders in the browser.
 app.node('recipeSearch').value='';app.context.clearRecipeFilters();app.context.setRecipeCollection('Romanian & Polish');app.context.setRecipeCuisine('Romanian');assert.match(app.node('recipeResultCount').textContent,/24 of 24/);
 app.context.setRecipeCollection('Everyday');assert.equal(app.run('activeRecipeCuisine'),'All');
 for(const key of ['week','profile','pantry','pantryLedger','foodLog'])assert.deepEqual(app.state()[key],before[key]);
});
test('regional favourites and recipe copies keep culture credit, complete estimates and dietary checks',async()=>{
 const app=harness();await app.flush();const id='regional-ostropel',recipe=app.context.getRecipe(id);
 assert.equal(app.context.recipeNutrition(recipe).complete,true);assert.equal(app.context.recipeAllowed(recipe,{...app.state().profile,diet:'Vegan'}),false);
 app.context.toggleFavorite(id);app.context.showTab('favourites');assert.match(app.node('favouritesResults').innerHTML,/Chicken Ostropel/);
 app.context.showRecipe(id);assert.match(app.node('sheet').innerHTML,/Romanian cuisine guide|Original Meal Planner/);
 app.context.makeRecipeCopy(id);const copied=app.state().customRecipes.at(-1);assert.equal(copied.cuisine,'Romanian');assert.equal(copied.sourceType,'cuisine-reference');
 assert.equal(app.context.recipeNutrition(copied).complete,true);const restored=harness({state:app.state()});await restored.flush();assert.ok(restored.state().favorites.includes(id));
});
test('English import review forwards source-language hints and keeps translation provenance in saved recipes',async()=>{
 const app=harness();await app.flush();app.context.openAddRecipe();app.node('newSourceLanguage').value='ro';app.node('newNotes').value='Ingrediente: 200 g piept de pui.';
 let request;app.context.fetch=async(url,options)=>{request={url,options};return{ok:true,text:async()=>JSON.stringify({recipe:{name:'Romanian Chicken Soup',category:'Lunch',servings:2,outputLanguage:'en',sourceLanguage:'ro',sourceLanguageBasis:'selected',ingredients:[{name:'Chicken breast',quantity:200,unit:'g'}],steps:['Simmer until fully cooked.'],warnings:['Check the unclear source amount.']},extraction:{method:'ai'}})};};
 await app.context.importRecipe();assert.equal(JSON.parse(request.options.body).sourceLanguage,'ro');assert.match(app.node('importPreview').innerHTML,/English recipe.*Romanian/);
 assert.match(app.node('importPreview').innerHTML,/details open.*Source details to review.*unclear source amount/);
 assert.equal(app.node('newIngredients').value,'Chicken breast | 200 | g');assert.match(app.node('newMethod').value,/Simmer until fully cooked/);
 app.context.saveNewRecipe();const recipe=app.state().customRecipes.at(-1);assert.equal(recipe.translation.outputLanguage,'en');assert.equal(recipe.translation.sourceLanguage,'ro');
 const restored=harness({state:app.state()});await restored.flush();restored.context.showRecipe(recipe.id);assert.match(restored.node('sheet').innerHTML,/Imported into English.*Romanian/);
});
test('video uploads carry the language hint and a failed translation preserves the current review draft',async()=>{
 const app=harness();await app.flush();app.context.openAddRecipe();app.node('newSourceLanguage').value='pl';app.node('newVideoFile').files=[new File(['video'],'recipe.mp4',{type:'video/mp4'})];app.node('newName').value='Keep my draft';app.node('newIngredients').value='Oats | 40 | g';
 let body;app.context.fetch=async(url,options)=>{body=options.body;return{ok:false,status:502,text:async()=>JSON.stringify({error:'The importer could not confirm English recipe output. Retry.'})};};
 await app.context.importRecipe();assert.equal(body.get('sourceLanguage'),'pl');assert.equal(body.get('video').name,'recipe.mp4');
 assert.equal(app.node('newName').value,'Keep my draft');assert.equal(app.node('newIngredients').value,'Oats | 40 | g');assert.equal(app.node('newSourceLanguage').value,'pl');assert.match(app.node('importStatus').textContent,/English recipe output/);
});

test('saved cooking resumes across reload and backup without recording stock or food', async () => {
  const app = harness(); await app.flush(); const before = app.state();
  app.context.ConsumerUI.start(basic.id, 'Monday', 0); app.context.ConsumerUI.step(1); app.context.ConsumerUI.closeCooking();
  assert.equal(app.state().cookingSession.step, 1); assert.equal(app.node('modal').style.display, 'none');
  assert.match(app.node('home').innerHTML, /Continue cooking/);
  const restored = harness({ state: app.state() }); await restored.flush(); restored.context.CookingSessionUI.resume();
  assert.match(restored.node('sheet').innerHTML, /Step 2 of 2/);
  restored.context.ConsumerUI.closeCooking();
  restored.context.restoreData({ target: { files: [{ contents: JSON.stringify(app.state()) }] } });
  restored.context.CookingSessionUI.resume(); assert.match(restored.node('sheet').innerHTML, /Step 2 of 2/);
  for (const key of ['pantry','pantryLedger','foodLog','week']) assert.deepEqual(restored.state()[key], before[key]);
  restored.context.CookingSessionUI.discard(); assert.equal(restored.state().cookingSession, null);
});
test('a changed recipe, replaced plan or changed servings blocks stale cooking confirmation', async () => {
  for (const mutation of ['state.customRecipes[0].ings[0][1]=60', 'state.pantryLedger.planId="replacement"', 'state.mealServings["Monday::0"]=2', 'state.week[0].meals[0]="everyday-tuna-crunch-pitta"']) {
    const app = harness(); await app.flush(); const before = app.state();
    app.context.ConsumerUI.start(basic.id, 'Monday', 0); app.run(mutation); app.context.ConsumerUI.finishCooking();
    assert.doesNotMatch(app.node('sheet').innerHTML, /Confirm cooking & update pantry/);
    assert.deepEqual(app.state().pantry, before.pantry); assert.deepEqual(app.state().pantryLedger.transactions, before.pantryLedger.transactions);
    app.context.ConsumerUI.closeCooking(); app.context.CookingSessionUI.resume(); assert.equal(app.node('modal').style.display, 'none');
  }
});
test('partially cooked meals scale steps to the remaining portions and reject later cooking changes',async()=>{
  const app=harness({state:{mealServings:{'Monday::0':2}}});await app.flush();
  app.context.PantryUI.openCook('Monday',0,0,'Fridge','',1);app.context.PantryUI.confirmCook(false);
  assert.equal(app.context.PantryCore.cookedPortions(app.run('state'),'Monday',0,app.run('recipes')),1);
  const before=app.state();app.context.ConsumerUI.start(basic.id,'Monday',0);
  assert.equal(app.state().cookingSession.portions,1);assert.equal(app.state().cookingSession.plannedPortions,2);
  assert.match(app.node('sheet').innerHTML,/>40 g</);assert.doesNotMatch(app.node('sheet').innerHTML,/>80 g</);
  app.context.ConsumerUI.closeCooking();const restored=harness({state:app.state()});await restored.flush();restored.context.CookingSessionUI.resume();
  assert.match(restored.node('sheet').innerHTML,/Step 1 of 2/);assert.deepEqual(restored.state().pantry,before.pantry);
  restored.context.PantryUI.openCook('Monday',0);restored.context.PantryUI.confirmCook(false);restored.context.closeModal();
  restored.context.CookingSessionUI.resume();assert.equal(restored.node('modal').style.display,'none');
});
test('standalone cooking progress appears on Today before a plan exists',async()=>{
  const app=harness({state:{week:[]}});await app.flush();app.context.ConsumerUI.start(basic.id);app.context.ConsumerUI.closeCooking();
  assert.match(app.node('home').innerHTML,/Continue cooking/);assert.equal(app.state().cookingSession.day,null);
});
test('three independent kitchen timers pause, resume, restore and finish once', async () => {
  const app = harness(); await app.flush(); app.context.ConsumerUI.start(basic.id); const before = app.state();
  for (const label of ['Rice','Chicken','Vegetables']) { app.node('cookTimerLabel').value=label; app.context.ConsumerUI.setTimer(5); }
  const timers = app.state().kitchenTimers; assert.equal(timers.length, 3);
  app.context.ConsumerUI.setTimer(1); assert.equal(app.state().kitchenTimers.length, 3);
  app.context.CookingSessionUI.pauseTimer(timers[0].id); const paused = app.state().kitchenTimers[0].remainingMs;
  app.context.ConsumerUI.closeCooking(); const restored=harness({state:app.state()}); await restored.flush();
  assert.equal(restored.state().kitchenTimers[0].remainingMs, paused);
  restored.context.CookingSessionUI.openTimers(); assert.match(restored.node('cookTimer').innerHTML, /Paused/);
  restored.context.CookingSessionUI.resumeTimer(timers[0].id);
  restored.run('state.kitchenTimers[1].deadline=Date.now()-1'); restored.context.CookingSessionUI.tick();
  assert.equal(restored.state().kitchenTimers[1].status, 'done'); const saved=restored.storage.get('mealPlannerState');
  restored.context.CookingSessionUI.tick(); assert.equal(restored.storage.get('mealPlannerState'),saved);
  restored.context.CookingSessionUI.cancelTimer(timers[1].id); assert.equal(restored.state().kitchenTimers.length,2);
  for(const key of ['pantry','pantryLedger','foodLog','week']) assert.deepEqual(restored.state()[key],before[key]);
});
test('personal notes persist and copy separately while remaining outside planner requests', async () => {
  const app=harness(); await app.flush(); const id='everyday-tuna-crunch-pitta',before=app.state();
  app.context.showRecipe(id); app.node('personalRecipeNote').value='</textarea><img src=x onerror="bad()">'; app.context.RecipeNotesUI.save(id);
  const restored=harness({state:app.state()}); await restored.flush(); restored.context.showRecipe(id);
  assert.match(restored.node('sheet').innerHTML,/&lt;\/textarea&gt;&lt;img/); assert.doesNotMatch(restored.node('sheet').innerHTML,/<img src=x/);
  restored.context.ConsumerUI.start(id); assert.match(restored.node('sheet').innerHTML,/Your cooking notes/); restored.context.ConsumerUI.closeCooking();
  restored.context.makeRecipeCopy(id); const copied=restored.state().customRecipes.at(-1).id;
  assert.equal(restored.context.RecipeExperience.personalNote(copied,restored.state()),app.state().recipeNotes[0].text);
  restored.context.RecipeExperience.setPersonalNote(restored.run('state'),copied,'Different note');
  assert.equal(restored.context.RecipeExperience.personalNote(id,restored.state()),app.state().recipeNotes[0].text);
  assert.doesNotMatch(JSON.stringify(restored.context.budgetPlannerPayload()),/Different note|onerror|recipeNotes/);
  for(const key of ['pantry','pantryLedger','foodLog','week','profile']) assert.deepEqual(restored.state()[key],before[key]);
});
test('delayed wake locks release after close and resume only while cooking is visible', async () => {
  const app=harness(); await app.flush(); let resolve,released=0,requests=0;
  app.context.navigator.wakeLock={request:()=>{requests++;return new Promise(done=>{resolve=done;});}};
  const lock=()=>({release:async()=>{released++;},addEventListener(){}});
  app.context.ConsumerUI.start(basic.id); app.context.ConsumerUI.closeCooking(); resolve(lock()); await app.flush();
  assert.equal(released,1); assert.equal(requests,1);
  app.context.CookingSessionUI.resume(); resolve(lock()); await app.flush();
  app.context.document.hidden=true; app.listeners.get('visibilitychange')(); await app.flush(); assert.equal(released,2);
  app.context.document.hidden=false; app.listeners.get('visibilitychange')(); resolve(lock()); await app.flush(); assert.equal(requests,3);
  app.context.closeModal(); await app.flush(); assert.equal(released,3);
});
test('copying a recipe when notes are full still saves the recipe and preserves its original note',async()=>{
  const id='everyday-tuna-crunch-pitta', recipeNotes=Array.from({length:500},(_,i)=>({recipeId:i===0?id:'r'+i,text:'Keep my note',updatedAt:new Date().toISOString()}));
  const app=harness({state:{recipeNotes}});await app.flush();app.context.makeRecipeCopy(id);
  assert.equal(app.state().customRecipes.length,2);assert.equal(app.state().recipeNotes.length,500);
  assert.equal(app.context.RecipeExperience.personalNote(id,app.state()),'Keep my note');
  assert.equal(JSON.parse(app.storage.get('mealPlannerState')).customRecipes.length,2);
  assert.match(app.node('toast').textContent,/note was not copied/);
});
test('unchecking an older shopping flag with spaces removes the legacy selection',async()=>{
  const app=harness({state:{shopping:{'Tuna in water':true}}});await app.flush();
  app.context.toggleShoppingItem('tuna in water::g',false,'Tuna in water');
  assert.equal(app.state().shopping['Tuna in water'],undefined);assert.equal(app.state().shopping['tuna in water::g'],false);
});
test('scheduled meal review is editable and preserves its draft on a failed fit',async()=>{
 const app=harness({state:{profile:{days:14,meals:3,budget:35,people:1,calories:1600,protein:150,cookTime:45,equipment:['Hob'],supermarket:'Asda'}}});await app.flush();await app.context.TailoredPlanUI.open();app.node('tailoredText').value='For 14 days, breakfast: overnight oats variety\nlunch: tuna based dish, salad boxes or wrap\ndinner: anything chicken, 1 day where i can have a steak at the end\ncalories: 1600 or less\nprotein: 150g\ncarbs: 90g\nfats: 20g';await app.context.TailoredPlanUI.interpret();assert.match(app.node('tailoredReview').innerHTML,/Meals on specific days/);assert.match(app.node('tailoredReview').innerHTML,/scheduledDay0/);
 tailoredForm(app,{tailoredDays:14,tailoredCalories:1600,tailoredProtein:150,tailoredFat:20,tailoredQueryBreakfast:'overnight oats',tailoredQueryLunch:'tuna salad or wrap',tailoredModeLunch:'vary',tailoredQueryDinner:'anything chicken'});for(const [id,value] of Object.entries({scheduledDay0:14,scheduledCategory0:'Dinner',scheduledQuery0:'steak',scheduledRecipe0:'tailored-medallion-steak'}))app.node(id).value=value;
 const originalFetch=app.context.fetch;app.context.fetch=async(url,...args)=>url.includes('/api/planner/generate')?{ok:true,text:async()=>JSON.stringify({status:'unavailable',week:[],warnings:['No fit in fixture']})}:originalFetch(url,...args);
 const before=app.state();await app.context.TailoredPlanUI.apply();assert.equal(app.state().profile.varietyMode,'Tailored');assert.equal(app.state().profile.scheduledMeals[0].day,14);assert.deepEqual(app.state().week,before.week);assert.equal(app.state().tailoredDraft.brief.scheduledMeals[0].day,14);assert.equal(app.state().tailoredDraft.brief.scheduledMeals[0].selected,'tailored-medallion-steak');
 await app.context.TailoredPlanUI.open();app.context.TailoredPlanUI.manual();assert.match(app.node('tailoredReview').innerHTML,/scheduledDay0/);app.context.TailoredPlanUI.clear(false);assert.deepEqual(app.state().profile.scheduledMeals,[]);
});
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

test('scanned serving fractions log declared weights, extra nutrients and meal groups without touching the household plan',async()=>{
 const app=harness();await app.flush();const before=app.state();
 app.context.FoodLogUI.openLabel({barcode:'3017620422003',name:'Fixture skyr',quantity:100,unit:'g',serving:{quantity:150,unit:'g'},pack:{quantity:450,unit:'g'},nutrition:{kcal:63,p:11,c:4,f:.2,fiber:0,sodium:40},source:'Pack label'},'2026-10-21');
 assert.equal(app.node('diaryUnit').value,'serving');assert.match(app.node('diaryPreview').innerHTML,/94.5/);
 app.context.FoodLogUI.portion(.5);app.node('barcodeConfirmed').checked=true;app.node('diaryMeal').value='Snack';app.node('diaryDate').value='2026-10-21';app.node('diarySaveFood').checked=true;app.context.FoodLogUI.commit(true);
 const saved=app.state();assert.equal(saved.foodLog[0].quantity,75);assert.equal(saved.foodLog[0].nutrition.kcal,47.25);assert.equal(saved.foodLog[0].nutrition.sodium,30);assert.equal(saved.foodLog[0].nutrition.fiber,0);assert.equal(saved.foodLog[0].meal,'Snack');assert.equal(saved.savedFoods[0].serving.quantity,150);assert.match(app.node('sheet').innerHTML,/Scan a food barcode/);
 for(const key of ['week','profile','pantry','pantryLedger'])assert.deepEqual(saved[key],before[key],key);
});

test('a label cannot be partially saved when device storage is full',async()=>{
 const app=harness();await app.flush();const before=app.state();app.context.FoodLogUI.openLabel({barcode:'3017620422003',name:'Snack',quantity:100,unit:'g',nutrition:{kcal:100},source:'Pack label'},'2026-10-21');app.node('barcodeConfirmed').checked=true;app.node('diaryDate').value='2026-10-21';app.node('diarySaveFood').checked=true;
 app.context.localStorage.setItem=()=>{throw new DOMException('Storage full','QuotaExceededError');};app.context.FoodLogUI.commit();assert.deepEqual(app.state().foodLog,before.foodLog);assert.deepEqual(app.state().savedFoods,before.savedFoods);assert.deepEqual(app.state().week,before.week);
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
test('failed tailored fits keep the explicit settings while preserving the plan, pantry, cooked history and food diary',async()=>{
  const app=harness();await app.flush();await app.context.TailoredPlanUI.open();app.context.TailoredPlanUI.manual();tailoredForm(app,{tailoredFat:0});
  const before=app.state();app.run('fetch=async()=>({ok:true,status:200,text:async()=>JSON.stringify({status:"unavailable",warnings:["A zero-fat cap cannot fit."],basket:{complete:false}})})');
  await app.context.TailoredPlanUI.apply();const after=app.state();
  for(const key of ['week','pantry','pantryLedger','foodLog'])assert.deepEqual(after[key],before[key],key);
  assert.equal(after.profile.nutritionTargets.fatMax,0);assert.equal(JSON.parse(app.storage.get('mealPlannerState')).profile.nutritionTargets.fatMax,0);
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
    assert.equal(app.run('recipes.filter(row=>row.id.startsWith("everyday-")).length'), 26);
    assert.equal(app.errors.length, 0);
    assert.match(app.node('week').innerHTML, /PantryUI.openCook/);
    assert.match(app.node('pantry').innerHTML, /Confirm purchases in Shopping/);
  }
});

test('Lidl planning and browsing use one collected price list without a separate reference switch', async () => {
  const app = harness({ state: { shoppingStore: 'Lidl', profile: { supermarket: 'Lidl', supermarkets: ['Lidl'], lidlReferencePrices: false } } }); await app.flush();
  assert.equal(app.run('budgetPlannerPayload().profile.lidlReferencePrices'), true);
  assert.match(app.run('lidlPriceSettingsHtml()'), /any UK branch/);
  assert.doesNotMatch(app.run('lidlPriceSettingsHtml()'), /type="checkbox"|setLidlReferencePrices/);
  app.context.CatalogueBrowser.open();
  assert.match(app.node('sheet').innerHTML, /One price list/);
  assert.doesNotMatch(app.node('sheet').innerHTML, /lidlBrowseReferences|Include reference prices|value="reference"/);
});

test('Aldi survives reload and backup restore, offers its own catalogue, and supports measured mixed-berry recipes', async () => {
  const app = harness({state:{shoppingStore:'Aldi',profile:{supermarket:'Aldi',supermarkets:['Aldi']}}});await app.flush();
  assert.equal(app.state().profile.supermarket,'Aldi');assert.equal(app.state().shoppingStore,'Aldi');
  assert.match(app.node('shop').innerHTML,/Browse Aldi ingredients/);
  app.context.CatalogueBrowser.open();assert.match(app.node('sheet').innerHTML,/Aldi catalogue/);assert.doesNotMatch(app.node('sheet').innerHTML,/Lidl Plus offers|One price list from Lidl/);
  assert.ok(app.requests.some(row=>String(row.url).includes('/api/catalog/browse?store=Aldi')));
  app.context.CatalogueBrowser.close();
  const restored=harness({state:app.state()});await restored.flush();assert.equal(restored.state().profile.supermarket,'Aldi');
  restored.context.restoreData({target:{files:[{contents:JSON.stringify(app.state())}]}});assert.equal(restored.state().profile.supermarket,'Aldi');
  const nutrition=app.run('recipeNutrition({ings:[["Oats",50,"g"],["Skimmed milk",150,"ml"],["Frozen mixed berries",100,"g"]]})');
  assert.equal(nutrition.complete,true);assert.equal(nutrition.kcal,297);assert.ok(nutrition.assumptions.some(note=>/mixed-berry estimate/.test(note)));
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
  assert.match(app.node('sheet').innerHTML, /Like/);
  app.context.setRecipeFeedback(basic.id, 'again');
  assert.match(app.node('sheet').innerHTML, /aria-pressed="true" class="on"/);
  assert.equal(app.state().recipeFeedback[0].value, 'again');
  assert.equal(JSON.parse(app.storage.get('mealPlannerState')).recipeFeedback[0].value, 'again');
  let payload = copy(app.context.budgetPlannerPayload());
  assert.ok(payload.recipes.find(row => row.id === basic.id).preferenceScore > 0);
  app.context.setRecipeFeedback(basic.id, 'skip');
  payload = copy(app.context.budgetPlannerPayload());
  assert.ok(payload.excludedRecipeIds.includes(basic.id));
  assert.ok(!payload.recipes.some(row => row.id === basic.id));
  assert.match(app.node('sheet').innerHTML, /You disliked this recipe/);
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
  assert.match(app.node('cookTimer').innerHTML, />[12]:[05]\d<\/span>/);
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
  app.context.FoodLogUI.preview(); assert.match(app.node('diaryPreview').innerHTML, /100 kcal/);
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
