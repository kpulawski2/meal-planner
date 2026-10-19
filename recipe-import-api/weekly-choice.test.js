import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/meal-preferences-core.js';
import '../public/weekly-routine-core.js';
import '../public/weekly-choice-core.js';
import '../public/recipe-library-core.js';
import {normalizePlannerRequest} from './planner-request.js';
import {optimizeMealPlan} from './budget-planner.js';
import {readRecipeLibrary} from './recipe-fixtures.js';
const Core=globalThis.WeeklyChoiceCore,Prefs=globalThis.MealPreferencesCore,Routine=globalThis.WeeklyRoutineCore;
const profile={days:7,meals:3,people:1,budget:35,calories:1600,protein:150,nutritionTargets:{fatMax:20},equipment:['Hob'],varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'cereal'},mealStyles:{Lunch:{style:'wraps',strength:'prefer'}}};
test('weekly draft uses explicit saved choices and never invents a burrito or fakeaway preference',()=>{
 const empty=Core.draft({meals:3});assert.equal(empty.mealFocus,'balanced');assert.ok(Object.values(empty.choices).every(row=>row.style===''));
 const draft=Core.draft(profile);assert.equal(draft.choices.Breakfast.style,'keep');assert.equal(draft.choices.Lunch.style,'wraps');assert.equal(draft.budget,35);
 draft.choices.Lunch.style='burritos';assert.equal(profile.mealStyles.Lunch.style,'wraps');
});
test('weekly budget, people, meal count and cooking changes leave targets and other daily choices intact',()=>{
 const draft=Core.draft(profile);draft.budget='45';draft.people='2';draft.days='14';draft.meals='3';draft.mealFocus='fakeaway';draft.cookingStyle='batch';draft.prepDay='Sunday';draft.choices.Lunch={style:'burritos',strength:'mostly'};
 const next=Core.candidate(draft,profile);assert.equal(next.budget,45);assert.equal(next.people,2);assert.equal(next.days,14);assert.equal(next.meals,3);assert.equal(next.repeatMeals.Breakfast,'cereal');assert.equal(next.mealFocus,'fakeaway');assert.equal(next.mealStyles.Lunch.style,'burritos');assert.equal(next.mealPrep,true);assert.equal(next.calories,1600);assert.equal(next.protein,150);assert.deepEqual(next.nutritionTargets,{fatMax:20});assert.equal(profile.budget,35);
 draft.meals='2';assert.deepEqual(Core.slots(Core.candidate(draft,profile).meals),['Lunch','Dinner']);draft.meals='3';assert.equal(Core.candidate(draft,profile).repeatMeals.Breakfast,'cereal');
});
test('invalid weekly input cannot become a zero budget, fractional household or unsupported focus',()=>{
 for(const [key,value] of [['budget',''],['budget',-1],['budget','NaN'],['people',1.5],['days',15],['meals',1],['cookingStyle','unknown'],['mealFocus','miracle diet']]){const d={...Core.draft(profile),[key]:value};assert.throws(()=>Core.candidate(d,profile),undefined,key);}
 assert.throws(()=>normalizePlannerRequest({profile:{mealFocus:'miracle diet'},recipes:[]}),/supported weekly/);
 const d=Core.draft(profile);d.choices.Lunch={style:'unknown',strength:'mostly'};assert.throws(()=>Core.candidate(d,profile),/supported meal style/);
});
test('shopping-day setup is due once after its local time, with explicit opt-out and review suppression',()=>{
 const r={enabled:true,shopDay:'Saturday',shopTime:'09:00',timeZone:'Europe/London'};
 assert.equal(Routine.status(r,new Date('2026-10-24T07:59:00Z')).promptDue,false);
 assert.equal(Routine.status(r,new Date('2026-10-24T08:00:00Z')).promptDue,true);
 for(const change of [{promptOnShopDay:false},{promptedDate:'2026-10-24'},{reviewedDate:'2026-10-24'},{enabled:false}])assert.equal(Routine.status({...r,...change},new Date('2026-10-24T10:00:00Z')).promptDue,false);
 assert.equal(Routine.status({...r,promptedDate:'2026-10-24'},new Date('2026-10-31T10:00:00Z')).promptDue,true);
 const saved=Core.routine({...Core.draft(profile),cookingStyle:'fresh',prepDay:'Monday'},r,new Date('2026-10-24T10:00:00Z'));assert.equal(saved.reviewedDate,'2026-10-24');assert.equal(saved.cookingStyle,'fresh');
});
const recipe=(id,cat,name=id,extra={})=>({id,cat,name,servings:1,cookTime:20,ings:[['Rice',80,'g']],nutrition:{kcal:500,p:50,c:40,f:1,complete:true},...extra});
test('focus ranking needs an explicit choice and healthy mode uses quantities rather than a recipe title',()=>{
 const plain=recipe('plain','Lunch'),fake=recipe('fake','Lunch','Crispy fakeaway chicken'),healthy=recipe('veg','Lunch','Rice bowl',{ings:[['Broccoli',200,'g'],['Kidney beans',100,'g'],['Brown rice',50,'g']]}),title=recipe('title','Lunch','Healthy miracle bowl');
 assert.equal(Prefs.focusScore(fake,undefined),0);assert.ok(Prefs.focusScore(fake,'fakeaway')>Prefs.focusScore(plain,'fakeaway'));assert.ok(Prefs.focusScore(healthy,'healthy')>Prefs.focusScore(title,'healthy'));assert.equal(Prefs.focusScore({...plain,cookTime:null},'quick'),0);assert.ok(Prefs.focusScore(plain,'quick')>0);assert.equal(Prefs.focusScore({...plain,cookTime:60},'quick'),0);
 assert.ok(Prefs.score(plain,{cookingStyle:'fresh'})>Prefs.score({...plain,fixedBatch:true},{cookingStyle:'fresh'}));
});
test('bounded library selection retains requested focus choices as well as existing meals',()=>{
 const rows=Array.from({length:500},(_,i)=>recipe(String(i),'Lunch'));rows.push(recipe('fake','Lunch','Crispy Fakeaway Chicken'));
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(rows,{profile:{mealFocus:'fakeaway'},week:[{day:'Monday',meals:['499']}]},50);assert.equal(selected.length,50);assert.ok(selected.some(r=>r.id==='fake'));assert.ok(selected.some(r=>r.id==='499'));
});
test('food focus changes a real checked plan but cannot waive the budget or fat cap',async()=>{
 const foods=[recipe('cereal','Breakfast'),recipe('plain','Lunch'),recipe('fake','Lunch','Chicken Fakeaway'),recipe('dinner','Dinner')],p={days:7,meals:3,people:1,budget:40,calories:1500,protein:120,varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'cereal',Dinner:'dinner'},mealFocus:'fakeaway'};
 let result=await optimizeMealPlan(normalizePlannerRequest({profile:p,recipes:foods}));assert.equal(result.status,'feasible');assert.ok(result.week.filter(day=>day.meals[1]==='fake').length>=4);assert.ok(result.basket.totalCostGBP<=40);assert.ok(result.nutrition.days.every(day=>day.meetsTargets));
 const highFat=foods.map(r=>r.id==='fake'?{...r,nutrition:{...r.nutrition,f:40}}:r);result=await optimizeMealPlan(normalizePlannerRequest({profile:{...p,nutritionTargets:{fatMax:5}},recipes:highFat}));assert.equal(result.status,'feasible');assert.ok(result.week.every(day=>day.meals[1]==='plain'));assert.ok(result.nutrition.days.every(day=>day.f<=5.01));
});
test('a broad fakeaway focus complements a specific burrito lunch within a tight real budget', {timeout:45000},async()=>{
 const recipes=await readRecipeLibrary(),p={days:7,meals:3,people:1,budget:45,calories:1600,protein:150,nutritionTargets:{calorieMode:'max'},varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'everyday-fuel10k-chocolate-flakes-milk'},mealStyles:{Lunch:{style:'burritos',strength:'mostly'}},mealFocus:'fakeaway',cookingStyle:'batch',mealPrep:true,batch:true,goal:['Eat healthy','Save money','Make cooking easier'],likes:'chicken, beef, rice, potato, salad',equipment:['Hob','Oven','Microwave'],cookTime:45};
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(recipes,{profile:p}),result=await optimizeMealPlan(normalizePlannerRequest({profile:p,recipes:selected}));
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.ok(result.mealPreferences[0].matched>=4,JSON.stringify(result.mealPreferences));assert.ok(result.week.every(day=>day.meals[0]===p.repeatMeals.Breakfast));assert.ok(result.nutrition.days.every(day=>day.kcal<=1600.01&&day.p>=149.99));assert.ok(result.basket.totalCostGBP<=45);
});
