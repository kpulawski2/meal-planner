import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/planner-settings-core.js';
import '../public/kitchen-plan-core.js';
import '../public/swap-core.js';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { recommendCatalogItems, productPriceUsable } from './catalog-adapter.js';
import { normalizePlannerRequest } from './planner-request.js';
import { optimizeMealPlan } from './budget-planner.js';
const Core=globalThis.PlannerSettingsCore,Pantry=globalThis.PantryCore,Plan=globalThis.KitchenPlanCore;
const foods=[{id:'b',name:'Breakfast',cat:'Breakfast',servings:1,ings:[['Oats',50,'g']]},{id:'l',name:'Lunch',cat:'Lunch',servings:1,ings:[['Rice',100,'g']]},{id:'d',name:'Dinner',cat:'Dinner',servings:1,ings:[['Chicken breast',200,'g']]}];
const saved=()=>({profile:{days:7,meals:3,people:1},week:[{day:'Monday',meals:['b','l','d']}],mealServings:{'Monday::1':1.5},locked:{'Monday::1':true},pantry:[{name:'Rice',qty:1000,unit:'g'}]});

test('3→2 and 2→3 remap kept meal roles and portions without mutating the saved plan',()=>{
 const state=saved(),before=structuredClone(state),two=Core.project(state,foods,{days:7,meals:2},{locked:state.locked});
 assert.deepEqual(two.week,[{day:'Monday',meals:['l','d']}]);assert.deepEqual(two.locked,{'Monday::0':true});assert.equal(two.mealServings['Monday::0'],1.5);assert.deepEqual(state,before);
 const three=Core.project({...state,...two},foods,{days:7,meals:3},{locked:two.locked});
 assert.deepEqual(three.week,[{day:'Monday',meals:['','l','d']}]);assert.deepEqual(three.locked,{'Monday::1':true});assert.equal(three.mealServings['Monday::1'],1.5);
});
test('cooked lunch and its undo history survive a slot move; removing cooked breakfast is explained',()=>{
 const state=saved();state.mealServings={};Pantry.initialise(state);
 const preview=Pantry.cookPreview(state,foods,{day:'Monday',index:1});assert.equal(preview.ok,true);
 const cooked=Pantry.applyCook(state,foods,preview);assert.equal(cooked.ok,true);assert.equal(state.pantry[0].qty,900);
 const life={locked:state.locked,cookedMeals:{'Monday::1':{recipeId:'l',servings:1}}},two=Core.project(state,foods,{days:7,meals:2},life);
 Core.applyMoves(state,two.moves);state.week=two.week;state.mealServings=two.mealServings;
 assert.equal(Pantry.cookedPortions(state,'Monday',0,foods),1);
 assert.equal(Pantry.undo(state,cooked.transaction.id).ok,true);assert.equal(state.pantry[0].qty,1000);assert.equal(Pantry.cookedPortions(state,'Monday',0,foods),0);
 const conflict=Core.project(saved(),foods,{days:7,meals:2},{cookedMeals:{'Monday::0':{recipeId:'b',servings:1}}});assert.match(conflict.conflicts[0],/Breakfast is already cooked/);
});
test('an added empty breakfast does not prevent a correctly positioned lunch lock from fitting',async()=>{
 const recipes=foods.map(r=>({...r,nutrition:{kcal:500,p:50,c:40,f:10,complete:true}}));
 const request=normalizePlannerRequest({profile:{supermarket:'Asda',days:1,meals:3,calories:1500,protein:100,budget:100,varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'b',Lunch:'l',Dinner:'d'}},recipes,
  week:[{day:'Monday',meals:['','l','d']}],locked:{'Monday::1':true},mealServings:{'Monday::1':1}});
 const result=await optimizeMealPlan(request);assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.week[0].meals[1],'l');assert.equal(result.mealServings['Monday::1'],1);
});
test('an explicit two-meal instruction beats old breakfast wording and chat uses edited budgets/counts',()=>{
 const parsed=globalThis.MealIntentCore.parse('2 meals per day. Breakfast: cereal; lunch: tuna; dinner: chicken',{days:7,meals:3,calories:1600,protein:150});assert.equal(parsed.meals,2);
 const old={days:7,meals:3,budget:35,calories:1600,protein:150,people:1},draft=Plan.merge('breakfast: cereal; lunch: tuna; dinner: chicken',null,old).draft;
 const updated={...old,meals:2,budget:50},rebased=Plan.rebase(draft,updated),next=Plan.merge('update my plan',rebased,updated).draft;
 assert.equal(next.meals,2);assert.equal(next.budget,50);assert.equal(Plan.merge('budget 70',next,updated).draft.budget,70);
});
test('exact cereal and drained tuna can be budgeted for Lidl without inventing Lidl stock or tin contents',async()=>{
 const items=[{key:'c',name:'FUEL10K Chocolate Multigrain Flakes',quantity:350,dimension:'mass'},{key:'t',name:'Tuna',quantity:409,dimension:'mass'}];
 const quote=await recommendCatalogItems('Lidl',items,{allowReferencePrices:true}),cereal=quote.recommendations[0].plan.products[0],tuna=quote.recommendations[1].plan;
 assert.equal(cereal.priceBasis,'other_store');assert.equal(cereal.sourceStore,'Asda');assert.equal(cereal.priceGBP,2.5);
 assert.equal(tuna.totalQuantity,816);assert.equal(tuna.totalCostGBP,4.98);assert.equal(tuna.products[0].sourceStore,'Aldi');assert.equal(tuna.products[0].packQuantity,408);
 assert.equal(globalThis.MealSwapCore.basket(quote,items,'Lidl').complete,true);
 const forged=structuredClone(quote);forged.recommendations[0].plan.products[0].url='https://www.asda.com/groceries/product/other/1';assert.equal(globalThis.MealSwapCore.basket(forged,items,'Lidl').complete,false);
 assert.equal(productPriceUsable({store:'Asda',price:2.5,estimatedPrice:true,priceBasis:'other_store'}),false);
 const strict=await recommendCatalogItems('Lidl',items);assert.equal(strict.recommendations[0].plan,null);
});
test('the requested cereal, tuna crunch choices and chicken dinners generate a checked seven-day plan',async()=>{
 const library=await readRecipeLibrary(),ids=['everyday-fuel10k-chocolate-flakes-milk','simple-tuna-crunch-wrap','simple-tuna-crunch-salad','frozen-teriyaki-rice','frozen-tomato-pasta'];
 const recipes=library.filter(r=>ids.includes(r.id));assert.equal(recipes.length,5);assert.ok(recipes.every(r=>r.nutrition.complete));
 const profile={supermarket:'Lidl',lidlReferencePrices:true,days:7,meals:3,budget:50,calories:1600,protein:150,equipment:['Hob','Oven'],nutritionTargets:{calorieMode:'max'},varietyMode:'Tailored',tailoredMeals:{
  Breakfast:{mode:'repeat',query:'FUEL10K cereal and milk',recipeIds:[ids[0]]},Lunch:{mode:'vary',query:'tuna crunch wrap or salad',recipeIds:ids.slice(1,3)},Dinner:{mode:'vary',query:'chicken',recipeIds:ids.slice(3)}}};
 const result=await optimizeMealPlan(normalizePlannerRequest({profile,recipes}));assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.week.length,7);assert.ok(result.basket.totalCostGBP<=50);
 assert.ok(result.week.every(day=>day.meals.length===3&&day.meals[0]===ids[0]));assert.equal(result.basket.complete,true);
});

test('the £35 repeated cereal, tuna crunch salad and chicken week meets 150 g protein without exceeding 1600 kcal',async()=>{
 const library=await readRecipeLibrary(),ids=['everyday-fuel10k-chocolate-flakes-milk','simple-tuna-crunch-salad','frozen-teriyaki-rice'],recipes=library.filter(r=>ids.includes(r.id));
 const profile={supermarket:'Lidl',lidlReferencePrices:true,days:7,meals:3,budget:35,calories:1600,protein:150,equipment:['Hob','Oven'],nutritionTargets:{calorieMode:'max'},varietyMode:'Repeat favourites',repeatMeals:{Breakfast:ids[0],Lunch:ids[1],Dinner:ids[2]}};
 const result=await optimizeMealPlan(normalizePlannerRequest({profile,recipes}));assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.ok(result.basket.totalCostGBP<=35);
 for(const day of result.week){assert.deepEqual(day.meals,ids);const totals=globalThis.MacroGoalsCore.total(day.meals.map(id=>recipes.find(r=>r.id===id).nutrition),day.meals.map((_,index)=>result.mealServings[day.day+'::'+index]||1));assert.ok(totals.kcal<=1600+.001);assert.ok(totals.p>=150-.001);}
});
