import test from 'node:test';
import assert from 'node:assert/strict';
import {readRecipeLibrary} from './recipe-fixtures.js';
import {recommendCatalogItems,optimizeMealPlan} from './catalog-service.js';
import {calculatePackPurchase,rankCatalogCandidates} from './catalog-adapter.js';
import {normalizePlannerRequest} from './planner-request.js';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/equipment-core.js';
import '../public/recipe-discovery-core.js';
const rows=(await readRecipeLibrary()).filter(row=>row.collection==='regional'),core=globalThis.MealBudgetCore;

test('48 Romanian and Polish adaptations cover every meal with complete measured estimates',()=>{
 assert.equal(rows.length,48);assert.equal(new Set(rows.map(row=>row.id)).size,48);assert.equal(new Set(rows.map(row=>row.name)).size,48);
 for(const cuisine of ['Romanian','Polish']){
  const selected=rows.filter(row=>row.cuisine===cuisine);assert.equal(selected.length,24);
  assert.deepEqual(selected.reduce((counts,row)=>{counts[row.cat]=(counts[row.cat]||0)+1;return counts;},{}),{Breakfast:4,Lunch:7,Dinner:10,Snack:3});
 }
 for(const row of rows){
  assert.equal(row.nutrition.complete,true,row.name);assert.ok(row.nutrition.kcal>=150&&row.nutrition.kcal<=700,row.name);assert.ok(row.nutrition.p>=15,row.name);
  assert.ok(row.ings.every(([name,quantity,unit])=>name&&quantity>0&&Number.isFinite(quantity)&&['g','ml','piece'].includes(unit)));
  assert.ok(row.equipment.every(value=>globalThis.KitchenEquipment.names.includes(value)));assert.equal(row.kcal,null);assert.equal(row.cost,null);assert.equal(row.testedInKitchen,false);
  assert.equal(row.sourceType,'cuisine-reference');assert.match(row.attribution,/Original Meal Planner/);assert.match(row.modifications,/adaptation/);assert.ok(row.originalName&&row.method.length>=2);
 }
 assert.ok(rows.filter(row=>row.tags.includes('vegetarian')).length>=16);assert.ok(rows.some(row=>row.equipment.includes('Air fryer')));assert.ok(rows.some(row=>row.equipment.includes('Slow cooker')));
});
test('country and traditional dish names are discoverable with and without Polish diacritics',()=>{
 const matches=globalThis.RecipeDiscoveryCore.matches;
 assert.equal(rows.filter(row=>matches(row,'Romanian')).length,24);assert.equal(rows.filter(row=>matches(row,'Polish')).length,24);
 for(const [query,id]of [['golabki','golabki-turkey'],['gołąbki','golabki-turkey'],['twarozek','twarozek'],['sarmale','sarmale-turkey'],['clatite','clatite-cheese'],['nalesniki','nalesniki']])assert.ok(matches(rows.find(row=>row.id==='regional-'+id),query),query);
});
test('closely related dishes from both countries do not count as different dishes for variety',()=>{
 for(const [a,b]of [['sarmale-turkey','golabki-turkey'],['romanian-apple-porridge','owsianka'],['clatite-cheese','nalesniki'],['branza-toast','twarozek']]){
  const pair=[a,b].map(id=>rows.find(row=>row.id==='regional-'+id));assert.equal(core.distinctDishes(pair),false);
 }
});
test('regional meal choices retain macro and equipment requirements in planning',()=>{
 const dinner=rows.find(row=>row.id==='regional-ostropel');
 assert.equal(globalThis.KitchenEquipment.allowed(dinner,{equipment:[]}),false);assert.equal(globalThis.KitchenEquipment.allowed(dinner,{equipment:['Hob']}),true);
 const request=normalizePlannerRequest({profile:{days:1,meals:3,people:1,budget:35,calories:1800,protein:100,cookTime:45,equipment:['Hob'],nutritionTargets:{calorieMode:'max',fatMax:0}},recipes:rows});
 assert.equal(request.profile.nutritionTargets.fatMax,0);assert.ok(request.recipes.some(row=>row.id===dinner.id));
});
test('a real regional menu fits its verified basket and strict limits while a zero-fat request stays infeasible',async()=>{
 const ids=['regional-romanian-apple-porridge','regional-ciorba-chicken','regional-romanian-fish-polenta'],recipes=rows.filter(row=>ids.includes(row.id));
 const profile={days:1,meals:3,people:1,budget:200,calories:1600,protein:120,cookTime:45,equipment:['Hob'],supermarket:'Asda',varietyMode:'Repeat favourites',nutritionTargets:{calorieMode:'max',fatMax:20},repeatMeals:{Breakfast:ids[0],Lunch:ids[1],Dinner:ids[2]}};
 const request={profile,recipes,week:[],pantry:[],locked:{},mealServings:{},favorites:[]};
 const result=await optimizeMealPlan(request);assert.equal(result.status,'feasible',result.warnings?.join(' '));assert.equal(result.basket.complete,true);
 assert.ok(result.basket.totalCostGBP<=profile.budget/7);assert.ok(result.nutrition.days.every(day=>day.meetsTargets&&day.kcal<=1600&&day.p>=119.99&&day.f<=20));
 const strict={...request,profile:{...profile,nutritionTargets:{calorieMode:'max',fatMax:0}}};const failed=await optimizeMealPlan(strict);assert.notEqual(failed.status,'feasible');assert.equal(strict.profile.nutritionTargets.fatMax,0);
});
test('regional fixed batches round ingredient use up without touching the food diary',()=>{
 const recipe=rows.find(row=>row.id==='regional-sarmale-turkey'),state={profile:{people:1},week:[{day:'Monday',meals:[recipe.id]}],mealServings:{'Monday::0':1},pantry:[],foodLog:[]};
 globalThis.PantryCore.initialise(state);const preview=globalThis.PantryCore.cookPreview(state,rows,{day:'Monday',index:0});
 assert.equal(preview.ok,true);assert.equal(preview.leftoverServings,3);assert.deepEqual(state.foodLog,[]);
 assert.ok(preview.requirements.find(row=>/rice/i.test(row.name)).qty>=140);
});
test('all regional ingredients have verified ASDA full-pack options with explicit usable-weight assumptions',async()=>{
 const items=new Map();for(const row of rows)for(const[name,quantity,unit]of row.ings){if(core.isCookingWater(name))continue;const meta=core.unitMeta(unit,name),key=core.canonicalIngredientName(name)+'::'+meta.dim;items.set(key,{key,name,dimension:meta.dim,quantity:Math.max(items.get(key)?.quantity||0,quantity*meta.factor)});}
 const result=await recommendCatalogItems('Asda',[...items.values()]);
 for(const row of result.recommendations){assert.equal(row.confidence,'high',row.query);assert.ok(row.plan?.products.length,row.query);}
 const buckwheat=result.recommendations.find(row=>row.query==='Buckwheat');assert.ok(buckwheat.plan.products.every(row=>!/ready meal|cooked/i.test(row.productName)));
 const cabbage=result.recommendations.find(row=>row.query==='White cabbage');assert.equal(cabbage.plan.estimatedQuantity,true);assert.match(cabbage.plan.estimateNotes.join(' '),/typical|weight/i);
 const sauerkraut=result.recommendations.find(row=>row.query==='Sauerkraut');assert.equal(sauerkraut.plan.estimatedQuantity,true);assert.match(sauerkraut.plan.estimateNotes.join(' '),/drained/);
});
test('prepared grain and wrong flour products cannot stand in for dry recipe quantities',()=>{
 const product=(name,category='Food Cupboard > Cooking Ingredients')=>({name,category,price:1,packQuantity:500,packUnit:'g'});
 assert.equal(rankCatalogCandidates('Buckwheat',[product('Ready Meal Buckwheat','Ready Meals')]).length,0);
 assert.equal(rankCatalogCandidates('Plain flour',[product('Self Raising Flour','Home Baking > Flour')]).length,0);
 assert.equal(rankCatalogCandidates('Polenta',[product('Ready Made Polenta')]).length,0);
 assert.equal(rankCatalogCandidates('Vegetable stock',[product('Rainbow Vegetable')]).length,0);
});
test('variable weights and drained jars require coherent evidence and never use an unverified net weight',()=>{
 const cabbage={name:'White Cabbage (Typically 1.2KG)',packSize:'PER KG',price:1.2,pricePerUnit:1,pricePerUnitLabel:'£1.00/KG',category:'Fresh Vegetables'};
 const plan=calculatePackPurchase([cabbage],1000,'mass');assert.equal(plan.totalQuantity,1200);assert.equal(plan.estimatedQuantity,true);
 assert.equal(calculatePackPurchase([{...cabbage,price:5}],1000,'mass'),null);
 const jar={name:'Sauerkraut 500g',packQuantity:500,packUnit:'g',packSize:'500G',price:2,category:'Pickled Vegetables'};
 assert.equal(calculatePackPurchase([jar],300,'mass'),null);
 const drained=calculatePackPurchase([{...jar,pricePerUnit:8,pricePerUnitLabel:'£8.00/KG'}],300,'mass');assert.equal(drained.products[0].packs,2);assert.equal(drained.totalQuantity,500);assert.match(drained.estimateNotes[0],/250 g drained/);
});
