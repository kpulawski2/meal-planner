import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/macro-goals-core.js';
import '../public/planner-settings-core.js';
import '../public/manual-plan-core.js';
import {readRecipeLibrary} from './recipe-fixtures.js';
const Core=globalThis.ManualPlanCore,recipes=await readRecipeLibrary();
const ids=['everyday-fuel10k-chocolate-flakes-milk','tuna','extra31'];
const profile={days:7,meals:3,people:1,calories:2000,protein:150,budget:80,portionMode:'fixed',mealPortions:{Breakfast:2,Lunch:1,Dinner:1},nutritionTargets:{calorieMode:'range',fatMax:40},varietyMode:'Repeat favourites',repeatMeals:{Breakfast:ids[0],Lunch:ids[1],Dinner:ids[2]}};
const state=()=>({profile:structuredClone(profile),week:[],mealServings:{},locked:{}});
test('the reported cereal x2, tuna pasta x1 and enchilada x1 choices save without claiming that the hidden calorie minimum passed',()=>{
 const input=state(),before=structuredClone(input),plan=Core.build(input,recipes,profile);assert.equal(plan.ok,true);assert.equal(plan.week.length,7);assert.deepEqual(plan.week[0].meals,ids);assert.equal(plan.mealServings['Monday::0'],2);assert.equal(plan.mealServings['Monday::1'],1);assert.equal(plan.mealServings['Monday::2'],1);
 const d=plan.nutrition.days[0];assert.equal(d.kcal,1761);assert.equal(d.p,164.8);assert.equal(d.f,26.1);assert.equal(d.meetsTargets,false);assert.equal(d.issues.length,1);assert.equal(d.issues[0].difference,39);assert.equal(d.issues[0].target,1800);assert.equal(plan.shoppingVerified,false);assert.deepEqual(input,before);assert.equal(plan.profile.nutritionTargets.calorieMode,'range');
});
test('an explicit 2000 calorie ceiling accepts the same portions and preserves the 150g protein and 40g fat limits',()=>{
 const p={...profile,nutritionTargets:{calorieMode:'max',fatMax:40}},plan=Core.build(state(),recipes,p);assert.equal(plan.nutrition.met,7);assert.ok(plan.nutrition.days.every(d=>d.meetsTargets));assert.equal(plan.profile.protein,150);assert.equal(plan.profile.nutritionTargets.fatMax,40);assert.equal(plan.profile.budget,80);
});
test('household quantities multiply portions while nutrition stays per person',()=>{
 const plan=Core.build(state(),recipes,{...profile,people:2});assert.equal(plan.mealServings['Monday::0'],4);assert.equal(plan.mealServings['Monday::1'],2);assert.equal(plan.nutrition.days[0].kcal,1761);
});
test('missing choices are explained rather than silently filled with unrelated meals',()=>{
 const p={...profile,repeatMeals:{Breakfast:ids[0]}},plan=Core.build(state(),recipes,p);assert.equal(plan.ok,false);assert.deepEqual(plan.missing,['Lunch','Dinner']);assert.equal(Core.hasChoices(p),false);assert.equal(Core.hasChoices(profile),true);
});
test('scheduled meals and variety rules remain on their intended days',()=>{
 const p={...profile,varietyMode:'Tailored',tailoredMeals:{Breakfast:{recipeIds:[ids[0]],mode:'repeat'},Lunch:{recipeIds:['tuna','afford-tuna-pea-pasta'],mode:'vary'},Dinner:{recipeIds:['extra31'],mode:'repeat'}},scheduledMeals:[{day:7,category:'Dinner',recipeIds:['tailored-medallion-steak']}]};
 const plan=Core.build(state(),recipes,p);assert.equal(plan.week[1].meals[1],'afford-tuna-pea-pasta');assert.equal(plan.week[6].meals[2],'tailored-medallion-steak');assert.equal(plan.week[5].meals[2],'extra31');
});
test('protected meals and partial cooked portions are retained without mutating their records',()=>{
 const input=state();input.week=[{day:'Monday',meals:ids}];input.mealServings={'Monday::2':2};input.locked={'Monday::2':true};const cooked={'Monday::2':{recipeId:'extra31',servings:.5}},before=structuredClone(input);
 const p={...profile,repeatMeals:{...profile.repeatMeals,Dinner:'tailored-lemon-chicken'}},plan=Core.build(input,recipes,p,{cookedMeals:cooked});assert.equal(plan.week[0].meals[2],'extra31');assert.equal(plan.mealServings['Monday::2'],2);assert.equal(plan.week[1].meals[2],'tailored-lemon-chicken');assert.deepEqual(input,before);assert.equal(cooked['Monday::2'].servings,.5);
});
test('manual choices cannot bypass food/equipment restrictions or invalid portion and target values',()=>{
 assert.throws(()=>Core.build(state(),recipes,profile,{allowed:r=>r.id!=='tuna'}),/conflicts/);
 for(const p of [{mealPortions:{Breakfast:0}},{mealPortions:{Breakfast:11}},{calories:200},{people:2.5},{meals:5},{nutritionTargets:{fatMax:-1}}])assert.throws(()=>Core.build(state(),recipes,{...profile,...p}));
});
test('unknown nutrition stays unknown rather than passing a manual-plan target check',()=>{
 const rows=recipes.map(r=>r.id==='tuna'?{...r,nutrition:{kcal:500,p:null,complete:false}}:r),plan=Core.build(state(),rows,profile);assert.equal(plan.ok,true);assert.equal(plan.nutrition.days[0].p,null);assert.equal(plan.nutrition.days[0].meetsTargets,false);assert.ok(plan.nutrition.days[0].issues.some(i=>i.kind==='unknown'));
});
