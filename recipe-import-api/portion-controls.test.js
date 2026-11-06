import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import {normalizePlannerRequest} from './planner-request.js';
import {optimizeMealPlan} from './budget-planner.js';
import {macroPortionVertices} from './macro-portions.js';
const Core=globalThis.MealBudgetCore;
const recipe=(id,cat)=>({id,name:id,cat,servings:1,ings:[['Oats',100,'g']],nutrition:{kcal:500,p:50,c:50,f:10,complete:true},equipment:[],cookTime:5});
const recipes=[recipe('lunch','Lunch'),recipe('dinner','Dinner')];
const profile={days:1,meals:2,people:1,budget:50,calories:1500,protein:150,varietyMode:'Tailored',nutritionTargets:{calorieMode:'max'},portionMode:'fixed'};
const run=(p,extra={})=>optimizeMealPlan(normalizePlannerRequest({profile:p,recipes,...extra}));
test('fixed portions reject a target that would require resizing, while explicit automatic mode can meet it',async()=>{
 const fixed=await run(profile);assert.notEqual(fixed.status,'feasible');assert.match(fixed.warnings.join(' '),/portions.*not.*resized|chosen meal portions/);
 const automatic=await run({...profile,portionMode:'automatic'});assert.equal(automatic.status,'feasible',JSON.stringify(automatic.warnings));assert.ok(Object.values(automatic.mealServings).some(n=>Math.abs(n-1)>.001));assert.ok(automatic.nutrition.days.every(d=>d.meetsTargets));
});
test('user-selected portions stay exact for each meal and household shopping follows them',async()=>{
 const p={...profile,people:2,protein:125,calories:1250,mealPortions:{Lunch:.5,Dinner:2}},result=await run(p);
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.mealServings['Monday::0'],1);assert.equal(result.mealServings['Monday::1'],4);assert.ok(result.nutrition.days.every(d=>d.meetsTargets));
 const shopping=Core.buildShopping({recipes,week:result.week,people:2,mealServings:result.mealServings});assert.equal(shopping.oats.groups.mass.need,500);
});
test('an old automatically resized saved plan cannot bypass fixed portions as a fallback',async()=>{
 const result=await run(profile,{week:[{day:'Monday',meals:['lunch','dinner']}],mealServings:{'Monday::0':1,'Monday::1':2}});assert.notEqual(result.status,'feasible');
});
test('portion normalization rejects malformed preferences and supports earlier clients without changing their contract',()=>{
 for(const p of [{portionMode:'anything'},{mealPortions:{Lunch:0}},{mealPortions:{Dinner:11}},{mealPortions:'bad'},{people:50,mealPortions:{Lunch:3}}])assert.throws(()=>normalizePlannerRequest({profile:{...profile,...p},recipes}));
 assert.equal(normalizePlannerRequest({profile:{...profile,portionMode:undefined},recipes}).profile.portionMode,'automatic');
});
test('the macro solver holds fixed portions and personal cereal portions even in explicit automatic mode',()=>{
 const rows=[{...recipe('cereal','Breakfast'),fixedPortion:true,nutrition:{kcal:300,p:25,c:40,f:4,complete:true}},...recipes];
 const p={...profile,meals:3,calories:1600,protein:150,portionMode:'automatic'};
 const options=macroPortionVertices(rows,p);assert.ok(options.length);assert.ok(options.every(f=>Math.abs(f[0]-1)<1e-8));
 const fixed=macroPortionVertices(rows,{...p,portionMode:'fixed'});assert.equal(fixed.length,0);
});
test('200g weighed skimmed milk is converted consistently for shopping and pantry use',()=>{
 const r={id:'cereal',servings:1,ings:[['FUEL10K Chocolate Multigrain Flakes',70,'g'],['Skimmed milk',200,'g']]};
 const shopping=Core.buildShopping({recipes:[r],week:[{day:'Monday',meals:['cereal']}],pantry:[{name:'Skimmed milk',qty:100,unit:'ml'}]});
 assert.ok(Math.abs(shopping['skimmed milk'].groups.volume.need-200/1.035)<1e-8);assert.ok(Math.abs(shopping['skimmed milk'].groups.volume.remaining-(200/1.035-100))<1e-8);assert.equal(shopping['fuel10k chocolate multigrain flakes'].groups.mass.need,70);
});
test('partly cooked meals retain their actual quantities while new days use the chosen one-portion defaults',async()=>{
 const p={...profile,days:2,protein:100};const result=await run(p,{week:[{day:'Monday',meals:['lunch','dinner']}],mealServings:{'Monday::0':1,'Monday::1':2},cookedMeals:{'Monday::1':{recipeId:'dinner',servings:1}}});
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.mealServings['Monday::1'],2);assert.equal(result.mealServings['Tuesday::0'],1);assert.equal(result.mealServings['Tuesday::1'],1);assert.ok(result.nutrition.days.every(day=>day.meetsTargets));
});
