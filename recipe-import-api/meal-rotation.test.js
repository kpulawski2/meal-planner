import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/meal-rotation-core.js';
import '../public/recipe-library-core.js';
import {normalizePlannerRequest} from './planner-request.js';
import {optimizeMealPlan,recipeRankingAdjustment} from './budget-planner.js';
const rotation=globalThis.MealRotationCore;
const recipe=(id,cat='Lunch',flavourProfile='')=>({id,name:id,cat,servings:1,ings:[[cat==='Breakfast'?'Oats':'Rice',80,'g']],nutrition:{kcal:500,p:50,c:40,f:10,complete:true},cookTime:20,flavourProfile});
const rows=[recipe('cereal','Breakfast'),...['Lunch','Dinner'].flatMap(cat=>['a','b','c','d'].map((id,i)=>recipe(cat+id,cat,['cajun','barbecue','satay','teriyaki'][i])))];
const archive=ids=>({planId:ids.join('-'),archivedAt:'2026-10-18T12:00:00Z',week:Array.from({length:Math.ceil(ids.length/8)},(_,i)=>({day:String(i),meals:ids.slice(i*8,i*8+8)}))});
test('recent plans weight exact meals and matching flavours without penalising every chicken dish',()=>{
 const foods=[recipe('old'),recipe('flavoured','Lunch','cajun'),recipe('new','Lunch','cajun'),recipe('fresh','Lunch','satay')];
 const state={profile:{},planHistory:[archive(['old','old','flavoured']),archive(['old']),archive(['old']),archive(['fresh'])]};
 const scores=rotation.scores(foods,state);assert.equal(scores.get('old'),22);assert.ok(scores.get('flavoured')>scores.get('new'));assert.ok(scores.get('new')>0);assert.equal(scores.get('fresh'),0);
 assert.equal(rotation.flavour({name:'Tuna Crunch Wrap'}),'tuna-creamy');assert.equal(rotation.flavour({name:'Chicken with potatoes'}),'');
 assert.equal(rotation.scores(foods,{...state,profile:{rotateMeals:false}}).size,0);
});
test('explicit daily favourites and repeat rules override rotation while automatic slots still rotate',()=>{
 const profile={varietyMode:'Tailored',tailoredMeals:{Breakfast:{mode:'repeat',recipeIds:['cereal']},Dinner:{mode:'vary',recipeIds:['Dinnera','Dinnerb']}}};
 const scores=rotation.scores(rows,{profile,planHistory:[archive(['cereal','Dinnera'])]});
 assert.equal(scores.get('cereal'),0);assert.ok(scores.get('Dinnera')>0);
 assert.equal(rotation.penalty({id:'cereal',cat:'Breakfast',recentUseScore:40},profile),0);
 assert.equal(rotation.fixedCategory({varietyMode:'Repeat favourites',repeatMeals:{Lunch:'Luncha'}},'Lunch'),true);
 assert.equal(rotation.fixedCategory({varietyMode:'Repeat favourites',repeatMeals:{Lunch:'Luncha'}},'Dinner'),false);
 assert.equal(rotation.secondWeekPenalty(rows[1],[{rows:[rows[1]]}],{rotateMeals:false}),0);
});
test('bounded selector leaves room for fresh alternatives from the same source and protein group',()=>{
 const foods=Array.from({length:300},(_,i)=>recipe(String(i))),history=[archive(foods.slice(0,100).map(r=>r.id))];
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(foods,{profile:{},planHistory:history},50);
 assert.equal(selected.length,50);assert.ok(selected.every(r=>Number(r.id)>=100));
});
test('only bounded recency scores and flavour names enter the planner request',()=>{
 const input={profile:{rotateMeals:false},recipes:[{...rows[1],recentUseScore:13,flavourProfile:'cajun'}],planHistory:[archive(['private-history'])]};
 const normalized=normalizePlannerRequest(input);assert.equal(normalized.profile.rotateMeals,false);assert.equal(normalized.recipes[0].recentUseScore,13);assert.equal(normalized.planHistory,undefined);
 assert.throws(()=>normalizePlannerRequest({...input,recipes:[{...rows[1],recentUseScore:41}]}),/Recent recipe use/);
 assert.throws(()=>normalizePlannerRequest({...input,recipes:[{...rows[1],recentUseScore:-1}]}),/Recent recipe use/);
 assert.equal(recipeRankingAdjustment({recentUseScore:40},{rotateMeals:false}),0);
});
const profile={days:7,meals:3,people:1,calories:1500,protein:120,budget:40,varietyMode:'Tailored',goal:['Make cooking easier'],tailoredMeals:{Breakfast:{mode:'repeat',query:'cereal',recipeIds:['cereal']},Lunch:{mode:'vary',query:'lunch',recipeIds:rows.filter(r=>r.cat==='Lunch').map(r=>r.id)},Dinner:{mode:'vary',query:'dinner',recipeIds:rows.filter(r=>r.cat==='Dinner').map(r=>r.id)}}};
async function run(profile,recipes,extra={}){return optimizeMealPlan(normalizePlannerRequest({profile,recipes,...extra}));}
test('starting the next week chooses different meals while retaining daily breakfast, nutrition and budget',async()=>{
 const first=await run(profile,rows);assert.equal(first.status,'feasible',JSON.stringify(first.warnings));
 const scores=rotation.scores(rows,{profile,planHistory:[{week:first.week}]});
 const second=await run(profile,rows.map(r=>({...r,recentUseScore:scores.get(r.id)})));
 assert.equal(second.status,'feasible',JSON.stringify(second.warnings));
 const before=new Set(first.week.flatMap(day=>day.meals.slice(1))),after=new Set(second.week.flatMap(day=>day.meals.slice(1)));
 assert.ok([...after].some(id=>!before.has(id)),JSON.stringify({before:[...before],after:[...after]}));
 assert.ok(second.week.every(day=>day.meals[0]==='cereal'));assert.ok(second.nutrition.days.every(day=>day.meetsTargets));assert.ok(second.basket.totalCostGBP<=40);
 const locked=await run(profile,rows.map(r=>({...r,recentUseScore:40})),{week:second.week,mealServings:second.mealServings,locked:{'Monday::1':true}});
 assert.equal(locked.status,'feasible');assert.equal(locked.week[0].meals[1],second.week[0].meals[1]);
});
test('two-week plans prefer different second-week dishes and scarce choices remain usable',async()=>{
 const result=await run({...profile,days:14},rows);assert.equal(result.status,'feasible',JSON.stringify(result.warnings));
 const before=new Set(result.week.slice(0,7).flatMap(day=>day.meals.slice(1)));
 assert.ok(result.week.slice(7).flatMap(day=>day.meals.slice(1)).some(id=>!before.has(id)));
 const scarce=rows.filter(r=>r.id==='cereal'||/a$|b$/.test(r.id));
 const limitedProfile={...profile,tailoredMeals:Object.fromEntries(Object.entries(profile.tailoredMeals).map(([cat,rule])=>[cat,{...rule,recipeIds:rule.recipeIds.filter(id=>scarce.some(r=>r.id===id))}]))};
 const fallback=await run(limitedProfile,scarce.map(r=>({...r,recentUseScore:40})));
 assert.equal(fallback.status,'feasible');assert.ok(fallback.nutrition.days.every(day=>day.meetsTargets));
});
