import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const core=await readFile(new URL('../public/budget-core.js',import.meta.url),'utf8');
function source(start,end){const from=html.indexOf(start),to=html.indexOf(end,from+start.length);assert.ok(from>=0&&to>from,start);return html.slice(from,to);}
function element(value=''){return {value,innerHTML:'',textContent:'',dataset:{},style:{},attributes:{},classList:{toggle(){}},setAttribute(name,value){this.attributes[name]=value;}};}
function row(id,patch={}){return {id,name:id,cat:'Dinner',ings:[['Oats',100,'g']],method:['Simmer the oats until tender.'],servings:1,cookTime:10,source:'https://en.wikibooks.org/wiki/Cookbook:Oats',sourceName:'Wikibooks Cookbook',license:'CC BY-SA 4.0',...patch};}
function harness(options={}){
 const base=[row('everyday')],custom=row('user_saved',{custom:true}),elements=Object.fromEntries(['recipes','recipeResults','recipeResultCount','recipeSearch','profile','sheet','modal'].map(id=>[id,element()]));
 const state={profile:{equipment:[]},customRecipes:[custom],favorites:[],week:[],...options.state};
 let fetches=0,homeRenders=0,settingsRenders=0;
 const context={console,AbortSignal,window:null,state,builtInRecipes:base,recipes:base.concat(custom),activeRecipeCategory:'All',activeRecipeProtein:'All',activeRecipeQuick:false,activeRecipeCollection:'All',activeRecipeQuery:'',recipePageSize:60,recipeLibraryPromise:null,recipeLibraryState:{status:'loading',count:0,error:''},document:{getElementById:id=>elements[id],querySelector:()=>({id:options.active||'recipes'}),querySelectorAll:()=>[]},fetch:async()=>{fetches++;if(options.fetch) return options.fetch();return {ok:true,text:async()=>JSON.stringify(options.data||{schemaVersion:1,recipes:[row('web-one')]})};},escape:value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;'),recipeCostText:()=> 'Price checked when planned',recipeCategory:recipe=>recipe.cat,recipeProteinGroup:()=> 'Plant proteins',recipeMethodSteps:recipe=>Array.isArray(recipe.method)?recipe.method:[],renderHome(){homeRenders++;},renderWeek(){},renderShop(){},renderProfile(){settingsRenders++;},captureProfileDraft(){},save(){}};
 context.window=context;
 vm.runInNewContext(core+'\nfunction canonicalIngredientName(name){return MealBudgetCore.canonicalIngredientName(name)}\n'+source('const NUTRITION_PROFILES=','function mealKey(')+'\n'+source('function recipeEquipmentReady(','function migrateAutomaticPricing()')+'\n'+source('function renderRecipes(){','let recipeImportController=')+'\n'+source('function toggleEquipment(','function toggleShop('),context);
 return {context,state,elements,get fetches(){return fetches;},get settingsRenders(){return settingsRenders;},get homeRenders(){return homeRenders;}};
}

test('web library merges once without replacing saved custom recipes or typed settings',async()=>{
 const app=harness({active:'profile'});app.elements.profile.innerHTML='Typed budget draft';
 await Promise.all([app.context.loadRecipeLibrary(),app.context.loadRecipeLibrary()]);
 assert.equal(app.fetches,1);assert.equal(app.context.recipes.length,3);
 assert.equal(app.context.recipes.find(recipe=>recipe.id==='user_saved'),app.state.customRecipes[0]);
 assert.equal(app.context.recipeLibraryState.count,1);assert.equal(app.settingsRenders,0);
 assert.equal(app.elements.profile.innerHTML,'Typed budget draft');
 await app.context.loadRecipeLibrary(true);assert.equal(app.fetches,2);assert.equal(app.context.recipes.length,3,'retry does not duplicate the collection');
});

test('failed or malformed collection loads preserve saved recipes and offer a retry',async()=>{
 for(const data of [{schemaVersion:2,recipes:[]},{schemaVersion:1,recipes:{}},null]){
  const app=harness({fetch:async()=>({ok:true,text:async()=>JSON.stringify(data)})});
  const before=app.context.recipes.slice();await app.context.loadRecipeLibrary();
  assert.equal(app.context.recipeLibraryState.status,'unavailable');assert.deepEqual(app.context.recipes,before);
  assert.match(app.elements.recipes.innerHTML,/Retry/);assert.match(app.elements.recipes.innerHTML,/saved recipes are safe/);
 }
});

test('a large collection renders only 60 cards while every recipe remains searchable',async()=>{
 const app=harness({data:{schemaVersion:1,recipes:Array.from({length:1000},(_,index)=>row('web-'+index))}});
 await app.context.loadRecipeLibrary();assert.equal(app.context.recipes.length,1002);
 assert.equal((app.elements.recipeResults.innerHTML.match(/<article/g)||[]).length,60);
 assert.match(app.elements.recipeResultCount.textContent,/Showing 60 of 1002/);
 app.context.showMoreRecipes();assert.equal((app.elements.recipeResults.innerHTML.match(/<article/g)||[]).length,120);
 app.elements.recipeSearch.value='web-999';app.context.filterRecipes();assert.equal((app.elements.recipeResults.innerHTML.match(/<article/g)||[]).length,1);assert.match(app.elements.recipeResults.innerHTML,/web-999/);
});

test('collections filter independently of categories and do not hide unowned CREAMi recipes',()=>{
 const app=harness();app.context.recipes.push(row('web-chicken'),row('creami-vanilla',{cat:'Snack',equipment:['Ninja CREAMi'],cookTime:8,freezeMinutes:1440}));
 app.context.setRecipeCollection('Web recipes');assert.match(app.elements.recipeResults.innerHTML,/web-chicken/);assert.doesNotMatch(app.elements.recipeResults.innerHTML,/creami-vanilla|everyday/);
 app.context.setRecipeCollection('Ninja CREAMi');assert.match(app.elements.recipeResults.innerHTML,/creami-vanilla/);assert.match(app.elements.recipes.innerHTML,/Turn on Ninja CREAMi/);
 assert.match(app.elements.recipeResults.innerHTML,/8 min active · 24h freeze/);assert.match(app.elements.recipeResults.innerHTML,/Enable CREAMi/);
 assert.match(app.elements.recipes.innerHTML,/aria-pressed="true" onclick="setRecipeCollection\('Ninja CREAMi'\)"/);
});

test('CREAMi equipment starts disabled and opt-in toggles access without changing food goals',()=>{
 const app=harness(),recipe=row('creami-vanilla',{equipment:['Ninja CREAMi']});app.state.profile.goal=['Eat healthy'];
 assert.equal(app.context.recipeEquipmentReady(recipe),false);app.context.toggleEquipment('Ninja CREAMi');assert.equal(app.context.recipeEquipmentReady(recipe),true);
 assert.deepEqual(app.state.profile.goal,['Eat healthy']);app.context.toggleEquipment('Ninja CREAMi');assert.equal(app.context.recipeEquipmentReady(recipe),false);
});

test('unknown source yield stays incomplete even when every ingredient is mapped',()=>{
 const app=harness(),recipe=row('web-unknown',{servings:null});
 const nutrition=app.context.recipeNutrition(recipe);assert.equal(nutrition.complete,false);assert.ok(nutrition.missing.includes('Recipe servings needed'));
 assert.equal(app.context.recipeNeedsReview(recipe),true);assert.match(app.context.recipeCardHtml(recipe),/Needs review/);
 assert.equal(app.context.recipeNutrition(row('everyday')).complete,true);
 assert.equal(app.context.recipeNutrition({...recipe,nutritionStatus:'verified',kcal:100,p:10}).complete,false,'verified calories cannot invent a recipe yield');
 assert.doesNotMatch(app.context.recipeCardHtml(recipe),/~389 kcal/,'A partial known-ingredient subtotal cannot be presented as meal calories');
 assert.match(app.context.recipeCardHtml(recipe),/Calories —/);
});

test('source contributor credit and modification notices stay accessible without expanding recipe cards',()=>{
 const app=harness(),recipe=row('web-credit',{attribution:'Wikibooks contributors',modifications:'Measured adaptation',authorsUrl:'https://en.wikibooks.org/w/index.php?title=Cookbook:Test&action=history',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'});
 assert.match(app.context.recipeSourceHtml(recipe),/creativecommons.org/);
 const credits=app.context.recipeSourceDetails(recipe);assert.match(credits,/Recipe credits & changes/);assert.match(credits,/Contributor history/);assert.match(credits,/Measured adaptation/);
});

test('one CREAMi serving still prepares the complete tub and leaves a frozen serving',()=>{
 const app=harness(),recipe=row('creami-oat',{equipment:['Ninja CREAMi'],freezeMinutes:1440,fixedBatch:true,servings:2});
 app.elements.recipeTargetServings=element('1');app.elements.recipeNutritionPreview=element();app.elements.recipeIngredientPreview=element();
 app.context.recipeModalRecipeId=recipe.id;app.context.getRecipe=()=>recipe;app.context.portionLabel=value=>value;app.context.ingredientQuantityLabel=(quantity,unit,factor)=>quantity*factor+' '+unit;
 vm.runInNewContext(source('function updateRecipeServingPreview(){','function applyRecipeServingsToMeal()'),app.context);
 app.context.updateRecipeServingPreview();
 assert.match(app.elements.recipeNutritionPreview.innerHTML,/Prepare 1 whole tub \(2 servings\)/);
 assert.match(app.elements.recipeNutritionPreview.innerHTML,/keep 1 frozen for later/);
 assert.match(app.elements.recipeIngredientPreview.innerHTML,/100 g/);assert.doesNotMatch(app.elements.recipeIngredientPreview.innerHTML,/50 g/);
 const card=app.context.recipeCardHtml(recipe);assert.match(card,/2 servings \/ tub/);assert.match(card,/kcal \/ whole tub/);
});

test('source attribution includes its licence and ignores unsafe source links',()=>{
 const app=harness();assert.match(app.context.recipeSourceHtml(row('web-one')),/Wikibooks Cookbook/);assert.match(app.context.recipeSourceHtml(row('web-one')),/CC BY-SA 4.0/);
 assert.equal(app.context.recipeSourceHtml(row('unsafe',{source:'javascript:alert(1)'})),'');
 const technique=app.context.recipeSourceHtml(row('creami',{sourceType:'technique-reference',sourceName:'Original Meal Planner recipe',techniqueSource:'https://support.ninjakitchen.co.uk/manual.pdf',license:'CC0-1.0'}));
 assert.match(technique,/Original Meal Planner recipe · CC0-1.0/);assert.match(technique,/Ninja model guide/);assert.match(technique,/ninjakitchen.co.uk\/manual.pdf/);
});

test('the planner delegates its entire eligible library to the diverse bounded pool',()=>{
 const rows=Array.from({length:400},(_,index)=>row('web-'+index)),calls=[];
 const context={state:{profile:{},week:[],pantry:[],favorites:[]},recipes:rows,recipeAllowed:()=>true,recipeNutrition:()=>({kcal:389,p:16.9,complete:true}),recipeCategory:recipe=>recipe.cat,RecipeLibraryCore:{selectPlannerRecipes(recipes,state){calls.push({recipes,state});return recipes.slice(350);}}};
 vm.runInNewContext(source('function budgetPlannerPayload(){','function budgetPlannerFingerprint()'),context);
 const payload=context.budgetPlannerPayload();assert.equal(calls[0].recipes.length,400);assert.equal(calls[0].recipes[399].nutrition.complete,true);
 assert.equal(payload.recipes[0].id,'web-350');assert.equal(payload.recipes.length,50);assert.ok(Array.isArray(payload.recipes[0].equipment));
});

test('offline shell includes the web collection and CREAMi/helper scripts',async()=>{
 const worker=await readFile(new URL('../public/service-worker.js',import.meta.url),'utf8');
 for(const path of ['/recipe-library.json','/creami-recipes.js','/world-recipes.js','/recipe-library-core.js'])assert.ok(worker.includes(path));
 assert.ok(html.indexOf('src="/creami-recipes.js"')<html.indexOf('const builtInRecipes='));
 assert.ok(html.indexOf('src="/recipe-library-core.js"')<html.indexOf('const builtInRecipes='));
 assert.match(source('async function generateWeek(){','function budgetPlannerControls()'),/await loadRecipeLibrary\(\)/);
});

test('garlic cloves use an explicit estimated 3 g weight and unrelated cups stay incomplete',()=>{
 const app=harness(),nutrition=app.context.calculateIngredientNutrition(row('garlic',{ings:[['Garlic',2,'cloves']]}));
 assert.equal(nutrition.complete,true);assert.ok(Math.abs(nutrition.kcal-8.94)<.0001);assert.ok(nutrition.assumptions.some(note=>note.includes('typical cloves weight')));
 assert.equal(app.context.calculateIngredientNutrition(row('cup',{ings:[['Oats',1,'cup']]})).complete,false);
});
