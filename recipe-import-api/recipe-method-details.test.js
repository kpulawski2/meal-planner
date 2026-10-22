import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../public/recipe-method-details.js';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/cooking-session-core.js';
import {readRecipeLibrary} from './recipe-fixtures.js';
const Details=globalThis.RecipeMethodDetails,Pantry=globalThis.PantryCore,Cooking=globalThis.CookingSessionCore;
const library=await readRecipeLibrary(),byId=new Map(library.map(r=>[r.id,r]));

test('reviewed methods cover the exact shipped recipes without changing ingredients, nutrition or cooked-meal signatures',()=>{
 assert.equal(Details.ids.length,426);
 for(const id of Details.ids){
  const recipe=byId.get(id);assert.ok(recipe,id);
  const before=structuredClone(recipe),signature=Pantry.recipeSignature(recipe),steps=Details.steps(recipe);
  assert.ok(steps.length>=2,id);assert.ok(steps.every(s=>typeof s==='string'&&s.trim().length>=8),id);
  assert.deepEqual(recipe,before,id);assert.equal(Pantry.recipeSignature(recipe),signature,id);
  steps[0]='Changed by caller';assert.notEqual(Details.steps(recipe)[0],steps[0],id);
 }
 assert.equal(Details.steps(byId.get('everyday-fuel10k-chocolate-flakes-milk')),null,'simple cereal does not gain unnecessary cooking steps');
});

test('each listed seasoning is used and raw chicken, frozen chicken and freezer batches retain the right preparation constraints',()=>{
 const seasonings=[['Paprika',/paprika/i],['Ground cumin',/cumin/i],['Curry powder',/curry powder/i],['Curry paste',/curry paste/i],['Tikka seasoning',/tikka seasoning/i],['Taco seasoning',/taco seasoning/i],['Fajita seasoning',/fajita seasoning/i],['Dried mixed herbs',/mixed herbs/i],['Chilli flakes',/chilli flakes/i],['Black pepper',/black pepper/i],['Garlic',/garlic/i],['Cinnamon',/cinnamon/i]];
 for(const id of Details.ids){
  const recipe=byId.get(id),text=Details.steps(recipe).join(' ');
  for(const [ingredient,pattern]of seasonings)if(recipe.ings.some(row=>row[0]===ingredient))assert.match(text,pattern,id+' must explain '+ingredient);
  if(recipe.ings.some(row=>row[0]==='Chicken breast'))assert.match(text,/75°C for (?:at least )?30 seconds/,id);
  if(id.startsWith('frozen-')){assert.match(text,/full cooking time/);assert.match(text,/40–45 minutes/);assert.match(text,/do-not-reheat/);assert.doesNotMatch(text,/fry chicken/i);}
  if(recipe.tags?.includes('freezer-burrito')){assert.match(text,/four burritos/);assert.match(text,/cool the filling promptly before this assembly step/);assert.match(text,/Freeze promptly/);assert.match(text,/Defrost in the fridge/);assert.match(text,/reheat only once/);}
 }
 const peri=Details.steps(byId.get('fakeaway-peri-peri-rice')).join(' ');assert.match(peri,/Reserve half.*before.*raw chicken/);assert.match(peri,/Do not use leftover raw-chicken marinade/);
 const curry=Details.steps(byId.get('fakeaway-butter-chicken')).join(' ');assert.match(curry,/tikka seasoning.*30 seconds/);assert.match(curry,/Avoid a hard boil/);
});

test('custom recipes, imports and changed ingredients or yields never receive an incompatible replacement method',()=>{
 const recipe=byId.get('fakeaway-peri-peri-rice');
 for(const changed of [{...recipe,custom:true},{...recipe,unavailable:true},{...recipe,id:'imported-peri'},{...recipe,servings:4},{...recipe,ings:recipe.ings.slice(1)},{...recipe,ings:recipe.ings.map((row,i)=>i===0?[row[0],row[1]+1,row[2]]:row)}])assert.equal(Details.steps(changed),null);
 assert.equal(Details.steps(null),null);assert.equal(Details.steps({id:'__proto__',ings:[]}),null);
});

test('updated cooking steps require restarting old in-progress step positions while cooked portions and pantry stay intact',()=>{
 const recipe=byId.get('fakeaway-peri-peri-rice'),oldSteps=['Cook chicken.','Serve with rice.'];
 const state={profile:{people:1},week:[{day:'Monday',meals:[recipe.id]}],pantry:[],foodLog:[]};Pantry.initialise(state);
 const slot=Pantry.slotKey(state,'Monday',0);state.pantryLedger.cooked[slot]={recipeId:recipe.id,recipeSignature:Pantry.recipeSignature(recipe),servings:.5};
 const before=structuredClone(state),raw={id:recipe.id,signature:Cooking.signature(recipe,oldSteps),portions:.5,step:1,savedAt:new Date().toISOString(),day:'Monday',index:0,planId:state.pantryLedger.planId,plannedPortions:1,cookedPortions:.5};
 const result=Cooking.inspect(raw,{state,recipe,steps:Details.steps(recipe),portions:1,cooked:.5});
 assert.equal(result.ok,false);assert.match(result.reason,/recipe has changed/i);assert.equal(Pantry.cookedPortions(state,'Monday',0,[recipe]),.5);assert.deepEqual(state,before);
});

test('the offline shell includes the detailed methods so cooking instructions remain available without a connection',async()=>{
 const [html,worker]=await Promise.all([readFile(new URL('../public/index.html',import.meta.url),'utf8'),readFile(new URL('../public/service-worker.js',import.meta.url),'utf8')]);
 assert.match(html,/<script src="\/recipe-method-details.js"><\/script>/);assert.match(worker,/'\/recipe-method-details.js'/);
});
