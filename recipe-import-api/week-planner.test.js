import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/macro-goals-core.js';
import '../public/planner-settings-core.js';
import '../public/manual-plan-core.js';
import '../public/meal-preferences-core.js';
import '../public/week-planner-core.js';
import '../public/plan-history-core.js';
import '../public/recipe-experience.js';
import '../public/recipe-visuals.js';
import '../public/meal-intent-core.js';
import '../public/plan-explanation-core.js';
import {readRecipeLibrary} from './recipe-fixtures.js';
const recipes=await readRecipeLibrary(),Core=globalThis.WeekPlannerCore,History=globalThis.PlanHistoryCore,Taste=globalThis.RecipeExperience;
const ids=['everyday-fuel10k-chocolate-flakes-milk','tuna','extra31'];
const profile={days:7,meals:3,people:1,calories:2000,protein:150,budget:80,supermarket:'Lidl',portionMode:'fixed',mealPortions:{Breakfast:2,Lunch:1,Dinner:1},nutritionTargets:{calorieMode:'max',fatMax:40},varietyMode:'Repeat favourites',repeatMeals:{Breakfast:ids[0],Lunch:ids[1],Dinner:ids[2]},equipment:['Hob','Oven'],diet:'No restrictions'};
const state=()=>({profile:structuredClone(profile),week:globalThis.MealBudgetCore.dayNames(7).map(day=>({day,meals:[...ids]})),mealServings:Object.fromEntries(globalThis.MealBudgetCore.dayNames(7).flatMap(day=>[2,1,1].map((n,i)=>[day+'::'+i,n]))),locked:{},pantry:[{name:'Rice',qty:300,unit:'g'}],foodLog:[{id:'diary-entry'}],pantryLedger:{planId:'current',purchases:[]}});
test('weekly drafts preserve chosen meals and independent portions without editing the saved profile',()=>{
 const original=structuredClone(profile),draft=Core.draft(profile);draft.budget=65;draft.meals=2;const candidate=Core.candidate(draft,profile,recipes);assert.equal(candidate.budget,65);assert.equal(candidate.meals,2);assert.equal(candidate.mealPortions.Lunch,1);assert.equal(candidate.tailoredMeals.Lunch.recipeIds[0],'tuna');assert.equal(candidate.tailoredMeals.Breakfast,undefined);assert.deepEqual(profile,original);
 draft.meals=3;const restored=Core.candidate(draft,profile,recipes);assert.equal(restored.tailoredMeals.Breakfast.recipeIds[0],ids[0]);assert.equal(restored.mealPortions.Breakfast,2);assert.equal(restored.nutritionTargets.fatMax,40);
});
test('measured cereal in a draft preserves 2/1/1 without changing the saved recipe library',()=>{
 const base=recipes.find(r=>r.id===ids[0]),copy=Core.cereal(base,{grams:70,milk:200,unit:'g'},'user-preview-cereal'),rows=[...recipes,copy],draft=Core.draft(profile);draft.choices.Breakfast='recipe:'+copy.id;const p=Core.candidate(draft,profile,rows);
 assert.equal(copy.servings,1);assert.equal(copy.fixedPortion,true);assert.equal(p.mealPortions.Breakfast,2);assert.deepEqual(copy.ings[1],['Skimmed milk',200,'g']);assert.equal(recipes.some(r=>r.id===copy.id),false);assert.equal(base.ings[0][1],50);const taste={};Taste.setFeedback(taste,base,'skip');assert.equal(Taste.allowedFeedback(copy,taste),false);
});
test('weekly setup defaults to seven days for older profiles without a saved period',()=>{
 const draft=Core.draft({meals:3,calories:2000,protein:150});assert.equal(draft.days,7);assert.equal(draft.people,1);assert.equal(draft.budget,45);assert.equal(draft.supermarket,'Asda');
});
test('fixed-portion guidance explains the 39 calorie minimum gap using the actual chosen amounts',()=>{
 const rows=recipes.filter(r=>ids.includes(r.id)),p={...profile,nutritionTargets:{calorieMode:'range',fatMax:40}},report=globalThis.PlanExplanationCore.explain({request:{profile:p,recipes:rows},nutrition:r=>r.nutrition});assert.match(report.issues.find(r=>r.kind==='calories').detail,/1761 kcal/);assert.match(report.issues.find(r=>r.kind==='calories').detail,/1800 kcal/);
});
test('suggested recipe changes stay optional, respect food restrictions and leave explicit selections unchanged',()=>{
 const p={...profile,protein:190},s=state(),before=structuredClone(s),model=globalThis.ManualPlanCore.build(s,recipes,p,{nutrition:r=>r.nutrition});const suggestions=Core.suggestions(model,recipes,{nutrition:r=>r.nutrition,allowed:()=>false});assert.deepEqual(suggestions,[]);assert.deepEqual(s,before);assert.equal(model.profile.repeatMeals.Lunch,'tuna');assert.equal(model.profile.protein,190);
});
test('clearing inherited recipe feedback also clears inherited reasons for the copied recipe',()=>{
 const original={id:'source',cookTime:40,ings:[]},copy={id:'copy',copiedFrom:{recipeId:'source'},ings:[]},s={};Taste.setFeedback(s,original,'skip');Taste.setReasons(s,original,['effort']);assert.deepEqual(Taste.reasonsFor(copy,s),['effort']);Taste.setFeedback(s,copy,null);assert.equal(Taste.feedbackValue(copy,s),null);assert.deepEqual(Taste.reasonsFor(copy,s),[]);
});
test('new styles replace only their chosen meal slot and invalid draft amounts are rejected',()=>{
 const draft=Core.draft(profile);draft.choices.Dinner='auto';const p=Core.candidate(draft,profile,recipes);assert.equal(p.tailoredMeals.Dinner,undefined);assert.equal(p.tailoredMeals.Lunch.recipeIds[0],'tuna');
 for(const changed of [{budget:''},{calories:200},{people:1.5},{meals:5},{supermarket:'unknown'},{mealPortions:{Breakfast:0}},{nutritionTargets:{fatMax:-1}},{choices:{Breakfast:'recipe:tuna'}}])assert.throws(()=>Core.candidate({...Core.draft(profile),...changed},profile,recipes));
});
test('plan revisions are bounded, skip identical plans and contain no stock or diary rollback',()=>{
 const before=state(),next=structuredClone(before);assert.equal(History.record(next,before,'Same'),false);next.week[0].meals[1]='afford-tuna-pea-pasta';assert.equal(History.record(next,before,'Before swap'),true);assert.equal(next.planRevisions.length,1);assert.deepEqual(next.planRevisions[0].week,before.week);assert.equal(next.planRevisions[0].pantry,undefined);assert.equal(next.planRevisions[0].foodLog,undefined);
 let current=next;for(let i=0;i<20;i++){const previous=structuredClone(current);current.week[0].meals[1]='test-'+i;History.record(current,previous,'Change');}assert.equal(current.planRevisions.length,12);
});
test('restoring a week retains current cooked meals and quantities while recovering other exact portion counts',()=>{
 const current=state(),saved=History.snapshot(current,'Before swap');current.week[0].meals[1]='afford-tuna-pea-pasta';current.mealServings['Monday::1']=1.5;const before=structuredClone(current),cooked={'Monday::1':{recipeId:'afford-tuna-pea-pasta',servings:.5}};
 const model=History.restore(current,saved,recipes,{cookedMeals:cooked,nutrition:r=>r.nutrition});assert.equal(model.week[0].meals[1],'afford-tuna-pea-pasta');assert.equal(model.mealServings['Monday::1'],1.5);assert.equal(model.week[1].meals[1],'tuna');assert.equal(model.mealServings['Monday::0'],2);assert.equal(model.protectedMeals,1);assert.equal(model.shoppingVerified,false);assert.deepEqual(current,before);
 assert.throws(()=>History.restore(current,{...saved,week:saved.week.slice(0,2)},recipes,{nutrition:r=>r.nutrition}));assert.throws(()=>History.restore(current,saved,recipes.filter(r=>r.id!=='tuna'),{nutrition:r=>r.nutrition}),/unavailable/);
});
test('undo respects current food restrictions and disliked recipes instead of reviving an excluded choice',()=>{
 const current=state(),entry=History.snapshot(current);current.profile.diet='Vegan';assert.throws(()=>History.restore(current,entry,recipes,{allowed:(r,p)=>p.diet!=='Vegan'||!r.ings.some(row=>/chicken|tuna/i.test(row[0])),nutrition:r=>r.nutrition}),/conflicts/);
});
test('taste reasons survive normalization and backup while gently ranking comparable suggestions',()=>{
 const long={id:'long',cookTime:55,cost:3,ings:[['Chicken',200,'g']]},fast={id:'quick',cookTime:15,cost:1,ings:[['Chicken',200,'g'],['Garlic',2,'g'],['Cumin',1,'g'],['Paprika',1,'g']]},slow={...long,id:'another-slow'},s={};Taste.setFeedback(s,long,'skip');Taste.setReasons(s,long,['effort','bland','cost']);Taste.normalizeState(s);assert.deepEqual(Taste.reasonsFor(long,s),['effort','bland','cost']);assert.equal(Taste.allowedFeedback(long,s),false);assert.ok(Taste.feedbackScore(fast,s)>Taste.feedbackScore(slow,s));assert.equal(Taste.allowedFeedback(slow,s),true);assert.deepEqual(Taste.reasonsFor(long,JSON.parse(JSON.stringify(s))),['effort','bland','cost']);assert.throws(()=>Taste.setReasons(s,long,['unknown']));Taste.setFeedback(s,long,null);assert.deepEqual(Taste.reasonsFor(long,s),[]);
});
test('photo inputs accept bounded local image data and do not treat arbitrary images as an exact recipe photo',()=>{
 const Visual=globalThis.RecipeVisualsUI;assert.equal(Visual.valid('https://example.com/image.png'),false);assert.equal(Visual.valid('data:image/svg+xml;base64,PHN2Zz4='),false);assert.equal(Visual.valid('data:image/png;base64,iVBORw0KGgo='),true);assert.equal(Visual.valid('data:image/png;base64,'+'A'.repeat(250000)),false);assert.equal(Visual.tile({name:'Chicken Enchilada Rice Bake',cat:'Dinner'}),3);assert.equal(Visual.tile({name:'Tomato soup',cat:'Dinner'}),null);
});
