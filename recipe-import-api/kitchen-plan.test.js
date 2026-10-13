import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/macro-goals-core.js';
import '../public/meal-intent-core.js';
import '../public/budget-core.js';
import '../public/kitchen-plan-core.js';
import '../public/kitchen-agent-core.js';
import {interpretMealRequest} from './meal-intent.js';
const Plan=globalThis.KitchenPlanCore;
const profile={days:7,meals:3,calories:1600,protein:150,nutritionTargets:{calorieMode:'max',carbs:90,carbMode:'target',fatMax:20},budget:35,people:1,equipment:['Hob'],diet:'No restrictions'};
const example='For the next 14 days, breakfast: overnight oats variety; lunch: tuna salad or wrap; dinner: anything chicken, one day steak at the end. Under 1600 calories per day, 150g protein, 90g carbs and max 20g fat.';
const row=(id,cat,name,ings)=>({id,cat,name,ings:ings.map(name=>[name,100,'g']),cookTime:20,nutrition:{complete:true,kcal:400,p:40,c:30,f:5}});
const recipes=[row('oats-1','Breakfast','Berry Overnight Oats',['Oats','Berries']),row('oats-2','Breakfast','Apple Overnight Oats',['Oats','Apple']),row('tuna-1','Lunch','Tuna Wrap',['Tuna','Wrap']),row('tuna-2','Lunch','Tuna Salad',['Tuna','Salad']),row('chicken-1','Dinner','Chicken Curry',['Chicken','Rice']),row('chicken-2','Dinner','Chicken Traybake',['Chicken','Broccoli']),row('steak','Dinner','Steak',['Steak'])];
test('a single-paragraph plan separates meal wording from daily macros and retains the final steak',()=>{
 const {draft}=Plan.merge(example,null,profile);assert.equal(draft.days,14);assert.equal(draft.calories,1600);assert.equal(draft.protein,150);assert.equal(draft.nutritionTargets.fatMax,20);assert.equal(draft.nutritionTargets.calorieMode,'max');
 assert.equal(draft.requests.Dinner.query,'anything chicken');assert.equal(draft.scheduledMeals[0].day,14);assert.equal(draft.scheduledMeals[0].atEnd,true);
 const p=Plan.prepare(draft,profile,recipes);assert.equal(p.tailoredMeals.Breakfast.recipeIds.length,2);assert.equal(p.tailoredMeals.Lunch.recipeIds.length,2);assert.deepEqual(p.scheduledMeals[0].recipeIds,['steak']);assert.equal(profile.days,7);
});
test('AI food recognition cannot relax a numeric/default target or replace a recognised meal',()=>{
 const evil={source:'ai',days:1,calories:2400,protein:20,nutritionTargets:{fatMax:80},requests:{Lunch:{query:'beef',mode:'repeat'}}};
 const {draft}=Plan.merge(example,null,profile,evil);assert.equal(draft.days,14);assert.equal(draft.calories,1600);assert.equal(draft.protein,150);assert.equal(draft.nutritionTargets.fatMax,20);assert.equal(draft.requests.Lunch.query,'tuna salad or wrap');
 const zero=Plan.merge('Make a plan with exactly zero fat',null,profile).draft;assert.equal(zero.nutritionTargets.fatMax,0);assert.equal(Plan.merge('£40 weekly budget',zero,profile,evil).draft.nutritionTargets.fatMax,0);
});
test('follow-ups preserve unspecified meals and caps, revise a slot/budget and move an end-of-plan exception',()=>{
 const first=Plan.merge(example,null,profile).draft,next=Plan.merge('Change lunch to tuna wrap; make it lower fat, for seven days, £40 weekly',first,profile).draft;
 assert.equal(next.days,7);assert.equal(next.budget,40);assert.equal(next.protein,150);assert.equal(next.nutritionTargets.fatMax,20);assert.equal(next.requests.Breakfast.query,first.requests.Breakfast.query);assert.equal(next.requests.Lunch.query,'tuna wrap');assert.equal(next.nutritionTargets.minimiseFat,true);assert.equal(next.scheduledMeals[0].day,7);
 assert.equal(Plan.merge('35 weekly',next,profile).draft.budget,35);
});
test('the direct interpreter shares prior food requests but cannot invent changes to saved numeric targets',async()=>{
 let sent;const prior={...profile,requests:{Breakfast:{query:'overnight oats',mode:'vary'}},personalNotes:'private'};
 const result=await interpretMealRequest('Change lunch to tuna salad',prior,async options=>{sent=JSON.parse(options.userText);return JSON.stringify({days:1,meals:2,calories:3000,protein:10,nutritionTargets:{fatMax:90},requests:{Lunch:{query:'tuna salad',mode:'repeat'}}});},true);
 assert.equal(result.source,'ai');assert.equal(result.days,7);assert.equal(result.meals,3);assert.equal(result.calories,1600);assert.equal(result.protein,150);assert.equal(result.nutritionTargets.fatMax,20);assert.equal(sent.defaults.requests.Breakfast.query,'overnight oats');assert.equal(sent.defaults.personalNotes,undefined);
});
test('variety is scoped to the specified meal and does not turn an exact lunch into a variety request',()=>{
 const b=Plan.merge('For 3 days: breakfast: overnight oats variety; lunch: tuna pickles eggs mayo wrap; dinner: chicken dishes variety. Under 1600 calories, 150g protein, 90g carbs and max 20g fat.',null,profile).draft;
 assert.equal(b.requests.Breakfast.mode,'vary');assert.equal(b.requests.Lunch.mode,'repeat');assert.equal(b.requests.Dinner.mode,'vary');
});
test('clarification accepts bare numbers without forgetting earlier meals or strict fat limits',()=>{
 const b=Plan.merge(example,null,profile).draft;b.pendingField='days';const seven=Plan.merge('7',b,profile).draft;assert.equal(seven.days,7);assert.equal(seven.nutritionTargets.fatMax,20);assert.equal(seven.requests.Lunch.query,b.requests.Lunch.query);
 const more=Plan.merge('More protein',seven,profile).draft;assert.throws(()=>Plan.prepare(more,profile,recipes),/minimum protein/);more.pendingField='protein';const updated=Plan.merge('180g',more,profile).draft;assert.equal(updated.protein,180);assert.equal(updated.requireProtein,false);assert.equal(updated.nutritionTargets.fatMax,20);
});
test('stored repeat favourites remain the chosen dishes when only a new period is requested',()=>{
 const p={...profile,varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'oats-1',Lunch:'tuna-1',Dinner:'chicken-1'}},b=Plan.merge('Make a 3-day plan',null,p).draft,proposal=Plan.prepare(b,p,recipes);
 assert.deepEqual(proposal.tailoredMeals.Lunch.recipeIds,['tuna-1']);assert.deepEqual(proposal.tailoredMeals.Dinner.recipeIds,['chicken-1']);
});
test('invalid periods and targets remain invalid through unrelated follow-ups instead of being silently reset',()=>{
 const long=Plan.merge('For a month, breakfast: overnight oats variety',null,profile).draft;assert.equal(long.days,30);assert.throws(()=>Plan.prepare(long,profile,recipes),/days/);
 const fat=Plan.merge('Make a plan with 1001g fat',null,profile).draft;assert.equal(fat.nutritionTargets.fatMax,1001);const again=Plan.merge('£40 weekly',fat,profile).draft;assert.equal(again.nutritionTargets.fatMax,1001);assert.throws(()=>Plan.prepare(again,profile,recipes),/fatMax/);
 const zero=Plan.merge('Make a plan at 0 calories',null,profile).draft;assert.equal(Plan.merge('£40 weekly',zero,profile).draft.calories,0);
 const negative=Plan.merge('Make a plan with -1g fat',null,profile).draft;assert.equal(negative.nutritionTargets.fatMax,-1);assert.throws(()=>Plan.prepare(negative,profile,recipes));
});
test('inline repeat answers retain the matching dish and exclusions apply to free planner slots as well',()=>{
 const b=Plan.merge('Make a 3-day plan, breakfast: berry overnight oats variety',null,profile).draft;
 let error;try{Plan.prepare(b,profile,recipes);}catch(e){error=e;}assert.equal(error.category,'Breakfast');b.pendingCategory=error.category;
 const repeat=Plan.merge('repeat it',b,profile).draft;assert.equal(repeat.requests.Breakfast.query,'berry overnight oats variety');assert.equal(repeat.requests.Breakfast.mode,'repeat');assert.equal(Plan.prepare(repeat,profile,recipes).tailoredMeals.Breakfast.recipeIds.length,1);
 const without=Plan.merge('without rice',repeat,profile).draft;assert.match(Plan.prepare(without,profile,recipes).dislikes,/rice/);
});
test('new vegan requests tighten a profile and existing vegan rules cannot be loosened by AI or a vegetarian phrase',()=>{
 const b=Plan.merge('Make a vegetarian plan',null,{...profile,diet:'Vegan'},{source:'ai',diet:'No restrictions',requests:{}}).draft;assert.equal(Plan.prepare(b,{...profile,diet:'Vegan'},[]).diet,'Vegan');
});
test('informational questions and cooking/storage comparisons do not automatically create a plan',()=>{
 for(const text of ['Is 1600 calories per day enough?','How many calories should I eat per day?',"Don't make a plan yet",'Compare these meal plans']){const kind=globalThis.KitchenAgentCore.interpret(text).kind;assert.equal(Plan.isPlan(text,kind,null,null),false,text);}
 assert.equal(Plan.isPlan('Could you build my meal plan for 7 days?','plan',null,null),true);
 assert.equal(Plan.isPlan('Help me prep 1kg chicken curry for 5 days','prep',null,null),false);
});
test('restored plan drafts/receipts are bounded data and cannot carry recipes, personal notes or executable actions',()=>{
 const raw={...Plan.merge(example,null,profile).draft,toolCalls:['delete all'],personalNotes:'private',recipes:[{id:'madeup'}]},saved=Plan.normalizeDraft(raw);assert.equal(saved.toolCalls,undefined);assert.equal(saved.recipes,undefined);assert.equal(saved.personalNotes,undefined);
 assert.equal(Plan.normalizeReceipt({status:'execute',action:'erase'}),null);const receipt=Plan.normalizeReceipt({status:'saved',cost:12,signature:'a'.repeat(100000),action:'erase'});assert.equal(receipt.signature.length,30000);assert.equal(receipt.action,undefined);
});
