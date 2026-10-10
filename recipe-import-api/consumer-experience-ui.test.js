import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const core=await readFile(new URL('../public/budget-core.js',import.meta.url),'utf8');
const affordable=await readFile(new URL('../public/affordable-recipes.js',import.meta.url),'utf8');
function source(start,end){const from=html.indexOf(start),to=html.indexOf(end,from+start.length);assert.ok(from>=0&&to>from,start);return html.slice(from,to);}
function element(value=''){const classes=new Set();return {value,files:[],style:{},textContent:'',innerHTML:'',disabled:false,attributes:{},dataset:{},classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);},contains:name=>classes.has(name)},setAttribute(name,value){this.attributes[name]=value;},focus(){this.focused=true;},scrollIntoView(){}};}
function importHarness(options={}){
 const ids=['sheet','modal','newSource','newNotes','newVideoFile','importApiUrl','importApiToken','aiImportBtn','importStatus','importRecovery','newName','newCat','newIcon','newIngredients','newMethod','newServings','newCookTime','newKcal','newProtein','newNutritionStatus','importPreview','importReviewNotes','importNutritionPreview'];
 const elements=Object.fromEntries(ids.map(id=>[id,element()])),stored=new Map(Object.entries(options.storage||{})),requests=[],toasts=[];
 const context={AbortController,AbortSignal,FormData,setTimeout,clearTimeout,console,location:{origin:'https://meal-planner.example',protocol:'https:'},document:{getElementById:id=>elements[id]},localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)},escape:String,toast:message=>toasts.push(message),fetch:async(url,request)=>{requests.push({url,request});if(options.throw)throw options.throw;return {ok:options.status?options.status<400:true,status:options.status||200,text:async()=>options.raw??JSON.stringify(options.result||{recipe:{name:'Chicken rice bowl',category:'Dinner',servings:2,prepMinutes:10,cookMinutes:20,ingredients:[{name:'Chicken breast',quantity:200,unit:'g'},{name:'Olive oil',quantity:1,unit:'tbsp'}],steps:['Prepare ingredients.','Cook the chicken.']},extraction:{method:'pasted-text'}})};},state:{customRecipes:[]},recipes:[],save(){},closeModal(){},renderRecipes(){}};
 vm.runInNewContext(core+'\n'+source('const NUTRITION_PROFILES=','function mealKey(')+'\n'+source('let recipeImportController=','function openEditRecipe(')+'\n'+source('function saveNewRecipe(){','function showTab(')+'\n globalThis.canonicalIngredientName=MealBudgetCore.canonicalIngredientName;',context);
 elements.newNotes.value='Chicken rice bowl\nServes 2\nIngredients\n200g chicken breast\n1 tbsp olive oil\nMethod\nCook the chicken.';
 elements.newNutritionStatus.value='estimated';
 return {context,elements,stored,requests,toasts};
}

test('consumer inline script compiles and affordable recipes load before the library',()=>{
 for(const block of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(block[1].trim())new vm.Script(block[1]);
 assert.ok(html.indexOf('src="/affordable-recipes.js"')<html.indexOf('const builtInRecipes='));
 assert.match(html,/if\(Array\.isArray\(r\.method\)\)/);
});

test('the complete app starts and renders every panel with a new or saved plan',()=>{
 const inline=Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map(block=>block[1]).filter(block=>block.trim()).join('\n');
 for(const existingPlan of [false,true]){
  const elements=Object.fromEntries(['home','week','shop','pantry','recipes','profile','toast','modal','sheet','recipeResults','recipeResultCount','recipeSearch'].map(id=>[id,element()]));
  for(const item of Object.values(elements)){item.classList.add=()=>{};item.classList.remove=()=>{};}
  const nav=['home','week','recipes','shop','pantry','profile'].map(id=>({...element(),dataset:{tab:id}}));
  const state={profile:{days:7,meals:4,budget:45,people:1,calories:2000,protein:200},week:existingPlan?[{day:'Monday',meals:['overnightoats','chickenwrap','beefpasta','snack']}]:[],shopping:{},locked:{},pantry:[],favorites:[],customRecipes:[],mealServings:{}};
  const storage=new Map([['mealPlannerState',JSON.stringify(state)]]);
  const context={AbortController,DOMException,AbortSignal,FormData,Blob,console,navigator:{},location:{origin:'https://meal-planner.example',protocol:'https:',hostname:'meal-planner.example'},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},document:{hidden:false,getElementById:id=>elements[id]||(elements[id]=element()),querySelectorAll:selector=>selector==='.tabs button'?nav:selector==='.screen'?['home','week','shop','pantry','recipes','profile'].map(id=>elements[id]):[],querySelector:selector=>selector==='.screen.active'?{id:'home'}:null,addEventListener(){}},setTimeout:()=>0,clearTimeout(){},fetch:async()=>({ok:false,status:503,text:async()=>''})};
  const scrolls=[];context.window=context;context.addEventListener=()=>{};context.scrollTo=options=>scrolls.push(options);
  vm.runInNewContext(core+'\n'+affordable+'\n'+inline,context);
  for(const id of ['home','week','shop','pantry','recipes','profile'])assert.ok(elements[id].innerHTML.length>30,id+' rendered on '+(existingPlan?'saved':'fresh')+' startup');
  assert.match(elements.recipes.innerHTML,/196 recipes/);
  assert.match(elements.recipeResults.innerHTML,/View recipe/);
  assert.match(elements.profile.innerHTML,/Make it your week/);
  assert.equal(context.recipeCategory({cat:'snacks'}),'Snack');
  assert.equal(context.recipeCategory({cat:'fresh fruit'}),'Fruit');
  for(const button of nav){assert.equal(typeof button.onclick,'function');button.onclick();assert.ok(elements[button.dataset.tab].innerHTML.length>30,'navigation renders '+button.dataset.tab);}
  assert.equal(scrolls.length,nav.length);assert.ok(scrolls.every(options=>options.top===0&&options.left===0),'each navigation starts at the top');
  delete context.scrollTo;context.showTab('profile');assert.ok(elements.profile.innerHTML.length>30,'navigation also works without scrollTo in a harness');
 }
});

test('ordinary recipe imports automatically use this app with no private token',async()=>{
 const app=importHarness();await app.context.importRecipe();
 assert.equal(app.requests.length,1);
 assert.equal(app.requests[0].url,'https://meal-planner.example/api/import-recipe');
 assert.equal(app.requests[0].request.headers['x-import-token'],undefined);
 assert.equal(app.elements.newName.value,'Chicken rice bowl');
 assert.equal(app.elements.newServings.value,2);
 assert.equal(app.elements.newCookTime.value,30);
 assert.equal(app.elements.newKcal.value,'181');
 assert.equal(app.elements.newProtein.value,'23.1');
 assert.match(app.elements.importNutritionPreview.innerHTML,/Estimate per serving/);
 assert.match(app.elements.importStatus.textContent,/Recipe imported/);
 assert.equal(app.elements.aiImportBtn.disabled,false);
});

test('saved external importer connection still sends an optional access token',async()=>{
 const app=importHarness({storage:{mealPlannerImportApiUrl:'https://other.example',mealPlannerImportApiToken:'example-token'}});await app.context.importRecipe();
 assert.equal(app.requests[0].url,'https://other.example/api/import-recipe');
 assert.equal(app.requests[0].request.headers['x-import-token'],'example-token');
});

test('connection saving and health check do not require an AI key or token',async()=>{
 const app=importHarness({result:{ok:true,aiConfigured:false,tokenConfigured:false}});
 assert.equal(app.context.saveImporterConfig(),true);
 await app.context.testImporterConnection();
 assert.match(app.elements.importStatus.textContent,/Connected/);
 assert.equal(app.requests.length,1);
 assert.equal(app.requests[0].url,'https://meal-planner.example/health');
});

test('empty and malformed importer responses give recovery actions and preserve draft fields',async()=>{
 for(const raw of ['', '<html>Service waking up</html>', '{}']){
  const app=importHarness({raw});app.elements.newName.value='My draft';app.elements.newIngredients.value='Oats | 60 | g';
  await app.context.importRecipe();
  assert.equal(app.elements.newName.value,'My draft');assert.equal(app.elements.newIngredients.value,'Oats | 60 | g');
  assert.match(app.elements.importRecovery.innerHTML,/Paste recipe text/);
  assert.doesNotMatch(app.elements.importStatus.textContent,/Unexpected|JSON|<html>/);
  assert.equal(app.elements.aiImportBtn.disabled,false);
 }
});

test('importer errors are useful without exposing raw server HTML',async()=>{
 const app=importHarness({status:502,raw:'<html>Bad gateway</html>'});await app.context.importRecipe();
 assert.match(app.elements.importStatus.textContent,/waking up/);
 assert.doesNotMatch(app.elements.importStatus.textContent,/<html>|JSON/);
 assert.equal(app.elements.importRecovery.style.display,'flex');
});

test('unknown ingredient quantities and recipe yield are never accepted as complete nutrition',async()=>{
 const app=importHarness({result:{recipe:{name:'Bowl',servings:null,ingredients:[{name:'Oats',quantity:60,unit:'g'},{name:'Olive oil',quantity:null,unit:'tbsp'}],steps:['Cook.']},extraction:{method:'pasted-text'}}});
 await app.context.importRecipe();
 assert.equal(app.elements.newServings.value,'');assert.equal(app.elements.newKcal.value,'');assert.equal(app.elements.newProtein.value,'');
 assert.match(app.elements.importNutritionPreview.innerHTML,/Partial estimate/);
 assert.match(app.elements.importReviewNotes.textContent,/Confirm.*amount|yield/);
 app.context.saveNewRecipe();assert.equal(app.context.state.customRecipes.length,0);assert.match(app.toasts.at(-1),/servings/);
});

test('ingredient nutrition includes oils by tablespoon and distinguishes cooked rice',()=>{
 const app=importHarness();
 const oil=app.context.calculateIngredientNutrition({servings:1,ings:[['Extra virgin olive oil',1,'tbsp']]});
 assert.equal(oil.complete,true);assert.ok(Math.abs(oil.kcal-121.992)<.001);
 const raw=app.context.calculateIngredientNutrition({servings:1,ings:[['Rice',100,'g']]}),cooked=app.context.calculateIngredientNutrition({servings:1,ings:[['Cooked rice',100,'g']]});
 assert.equal(raw.kcal,360);assert.equal(cooked.kcal,130);
 const described=app.context.calculateIngredientNutrition({servings:1,ings:[['Boneless skinless chicken breast',200,'g'],['Large eggs',2,'pieces']]});assert.equal(described.complete,true);
 const milk=app.context.getNutritionProfile('Semi skimmed milk');assert.equal(milk.k,47);
});

test('unambiguous source ingredient plurals and stock receive labelled generic profiles',()=>{
 const app=importHarness(),nutrition=app.context.calculateIngredientNutrition({servings:4,ings:[['Carrots',250,'g'],['Split red lentils',150,'g'],['Vegetable stock',1000,'ml']]});
 assert.equal(nutrition.complete,true);assert.equal(nutrition.matched,3);assert.ok(nutrition.assumptions.some(note=>note.includes('Generic vegetable stock estimate')));
 for(const [plural,singular] of [['Potatoes','Potato'],['Tomatoes','Tomato'],['Onions','Onion'],['Apples','Apple']])assert.equal(app.context.getNutritionProfile(plural).k,app.context.getNutritionProfile(singular).k);
 assert.equal(app.context.getNutritionProfile('Carrots in cream sauce'),null);
 assert.equal(app.context.getNutritionProfile('Cooked split red lentils'),null);
 const incomplete=app.context.calculateIngredientNutrition({servings:4,ings:[['Carrots',250,'g'],['Plain yogurt',0,'g'],['Naan bread',0,'pieces']]});assert.equal(incomplete.complete,false);assert.ok(incomplete.missing.some(item=>item.includes('Plain yogurt')));assert.ok(incomplete.missing.some(item=>item.includes('Naan bread')));
});

test('editing import quantities recalculates automatic values and preserves source nutrition',async()=>{
 const app=importHarness();await app.context.importRecipe();app.elements.newIngredients.value='Chicken breast | 400 | g\nOlive oil | 1 | tbsp';app.context.updateImportNutritionPreview();assert.equal(app.elements.newKcal.value,'301');
 app.elements.newKcal.value='333';app.elements.newIngredients.value='Chicken breast | 200 | g';app.context.updateImportNutritionPreview();assert.equal(app.elements.newKcal.value,'333');
 app.elements.newIngredients.value='Chicken breast | | g';app.context.updateImportNutritionPreview();assert.equal(app.elements.newProtein.value,'');
});

test('imported recipes save cook time and automatically calculated nutrition without shelf-price fields',async()=>{
 const app=importHarness();await app.context.importRecipe();app.context.saveNewRecipe();const recipe=app.context.state.customRecipes[0];assert.equal(recipe.cookTime,30);assert.equal(recipe.servings,2);assert.equal(recipe.kcal,181);assert.equal(recipe.cost,null);assert.equal(recipe.custom,true);
 assert.doesNotMatch(source('function openAddRecipe(){','function focusImportReview()'),/Enter the backend access token|newCost|set up once/);
});

function settingsHarness(profile={}){
 const elements={profile:element(),cal:element('2100'),pro:element('125'),bud:element('32'),cook:element('30'),people:element('2'),dis:element('Pork'),likes:element('Beans'),custom:element('no fish'),goalDetails:element()},buttons=Object.keys({'Lose weight':1,'Gain muscle':1,'Eat healthy':1,'Save money':1,'Make cooking easier':1}).map(goal=>({...element(),dataset:{goal}}));
 let saved=0;const context={state:{profile:{days:7,meals:3,budget:45,calories:2000,protein:100,cookTime:45,people:1,supermarkets:['Asda'],goal:['Eat healthy'],varietyMode:'Balanced',...profile}},defaultProfile:{goal:['Eat healthy','Save money','Make cooking easier']},document:{getElementById:id=>elements[id],querySelectorAll:()=>buttons},RETAILER_NAMES:['Asda','Aldi'],escape:String,save(){saved++;},cancelBudgetPlan(){},renderAll(){},generateWeek(){},budgetPlannerState:{status:'idle'}};
 vm.runInNewContext(source('function selectedPlannerGoals(){','function budgetPlannerPanel(){')+'\n'+source('function migratePlannerPreferences(){','function save(){')+'\n'+source('function presetButtons(','let pendingSwap=null;'),context);
 return {context,elements,buttons,get saved(){return saved;}};
}

test('selected settings light up with accessible state and retain typed values',()=>{
 const app=settingsHarness();app.context.setChoice('days','7 days');assert.equal(app.context.state.profile.days,7);assert.equal(app.context.state.profile.budget,32);assert.equal(app.context.state.profile.dislikes,'Pork');
 assert.match(app.elements.profile.innerHTML,/class="chip on" aria-pressed="true" data-setting="days" onclick="setChoice\('days','7 days'\)"/);
 app.context.setChoice('varietyMode','More variety');assert.equal(app.context.state.profile.varietyMode,'More variety');assert.match(app.elements.profile.innerHTML,/aria-pressed="true" data-setting="varietyMode"/);
 app.context.setChoice('diet','Vegetarian');assert.match(app.elements.profile.innerHTML,/aria-pressed="true" data-setting="diet"/);
});

test('budget preset currency is a prefix and other units remain suffixes',()=>{
 const app=settingsHarness();assert.match(app.context.presetButtons('budget',[45],45,'£'),/>£45<\/button>/);assert.doesNotMatch(app.context.presetButtons('budget',[45],45,'£'),/45£/);assert.match(app.context.presetButtons('protein',[100],100,'g'),/>100g<\/button>/);
});

test('goals toggle and explain their effect without changing calorie or protein targets',()=>{
 const app=settingsHarness();app.context.toggleGoal('Gain muscle');assert.ok(app.context.state.profile.goal.includes('Gain muscle'));assert.equal(app.context.state.profile.calories,2100);assert.equal(app.context.state.profile.protein,125);
 assert.match(app.elements.goalDetails.innerHTML,/protein-dense recipes/);
 const button=app.buttons.find(button=>button.dataset.goal==='Gain muscle');assert.equal(button.attributes['aria-pressed'],'true');
 app.context.toggleGoal('Gain muscle');assert.equal(button.attributes['aria-pressed'],'false');
});

test('only untouched conflicting legacy defaults migrate to sensible goals',()=>{
 const legacy=['Lose weight','Gain muscle','Eat healthy','Save money','Make cooking easier'];const app=settingsHarness({goal:legacy});assert.deepEqual(Array.from(app.context.state.profile.goal),['Eat healthy','Save money','Make cooking easier']);assert.equal(app.context.state.goalVersion,1);
 const custom=settingsHarness({goal:['Gain muscle']});assert.deepEqual(custom.context.state.profile.goal,['Gain muscle']);
});

test('weekly overview is compact and explanatory text is behind expandable details',()=>{
 const panel=source('function budgetPlannerPanel(){','function getRecipe(');assert.match(panel,/weekly-overview/);assert.match(panel,/ASDA checkout/);assert.match(panel,/Meal variety/);assert.match(panel,/<details class="planner-help"/);
 const styles=html.slice(html.indexOf('/* Keep the navigation reachable'),html.indexOf('</style>'));assert.match(styles,/\.tabs\{position:fixed;bottom:0/);assert.doesNotMatch(styles,/position:sticky/);
});
