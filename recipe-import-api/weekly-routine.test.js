import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/meal-preferences-core.js';
import '../public/weekly-routine-core.js';
import '../public/recipe-library-core.js';
import {normalizePlannerRequest} from './planner-request.js';
import {optimizeMealPlan} from './budget-planner.js';
import {readRecipeLibrary} from './recipe-fixtures.js';
const core=globalThis.WeeklyRoutineCore,prefs=globalThis.MealPreferencesCore;
const schedule={id:'test-routine',enabled:true,shopDay:'Saturday',shopTime:'09:00',prepDay:'Sunday',prepTime:'10:00',timeZone:'Europe/London',cookingStyle:'batch'};
const now=new Date('2026-10-19T12:00:00Z');
test('routine values are bounded and phone alerts are not inferred from enabling a card',()=>{
 const r=core.normalize({enabled:'true',id:'bad\nBEGIN:VEVENT',shopDay:'Funday',shopTime:'25:99',timeZone:'not/a-zone'});
 assert.equal(r.enabled,false);assert.equal(r.shopDay,'Saturday');assert.equal(r.shopTime,'09:00');assert.equal(r.timeZone,'Europe/London');assert.equal(r.id,'');
 assert.equal(r.pushEnabled,undefined);assert.equal(r.calendarRevision,'');
});
test('Saturday review and Sunday prep use local dates and reviewed days stay quiet',()=>{
 const saturday=new Date('2026-10-23T23:30:00Z'),s=core.status(schedule,saturday);assert.equal(s.today,'2026-10-24');assert.equal(s.reviewDue,true);assert.equal(s.prepDue,false);
 assert.equal(core.status({...schedule,reviewedDate:'2026-10-24'},saturday).reviewDue,false);
 assert.equal(core.status(schedule,new Date('2026-10-25T12:00:00Z')).prepDue,true);
 assert.equal(core.status({...schedule,cookingStyle:'fresh'},new Date('2026-10-25T12:00:00Z')).prepDue,false);
 assert.equal(core.status({...schedule,enabled:false},saturday).reviewDue,false);
});
test('next reminders retain the selected wall clock over autumn and spring changes',()=>{
 assert.equal(core.next('Saturday','09:00','Europe/London',now).toISOString(),'2026-10-24T08:00:00.000Z');
 assert.equal(core.next('Saturday','09:00','Europe/London',new Date('2026-10-25T12:00:00Z')).toISOString(),'2026-10-31T09:00:00.000Z');
 assert.equal(core.next('Sunday','10:00','Europe/London',new Date('2027-03-27T12:00:00Z')).toISOString(),'2027-03-28T09:00:00.000Z');
 assert.equal(core.next('Saturday','09:00','Asia/Kathmandu',now).toISOString(),'2026-10-24T03:15:00.000Z');
});
test('calendar export has two recurring local-time events, alerts and real timezone transitions',()=>{
 const profile={meals:3,mealStyles:{Lunch:{style:'burritos',strength:'mostly'}}},ics=core.calendar(schedule,profile,now),text=ics.replace(/\r\n /g,'');
 assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,2);assert.equal((text.match(/BEGIN:VALARM/g)||[]).length,2);
 assert.match(text,/DTSTART;TZID=Europe\/London:20261024T090000/);assert.match(text,/FREQ=WEEKLY;COUNT=52;BYDAY=SA/);assert.match(text,/FREQ=WEEKLY;COUNT=52;BYDAY=SU/);
 assert.match(text,/BEGIN:VTIMEZONE/);assert.match(text,/DTSTART:20261025T020000/);assert.match(text,/TZOFFSETFROM:\+0100\r\nTZOFFSETTO:\+0000/);
 assert.match(text,/Lunch: burritos/);assert.match(text,/#weekly-routine/);assert.doesNotMatch(text,/protein|pantry|calories|receipt/i);
 assert.equal((text.match(/UID:test-routine-/g)||[]).length,2);
 for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
 assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});
test('fresh cooking exports only the planning reminder and unsaved or disabled routines cannot export',()=>{
 assert.equal((core.calendar({...schedule,cookingStyle:'fresh'}, {},now).match(/BEGIN:VEVENT/g)||[]).length,1);
 for(const value of [{...schedule,id:''},{...schedule,enabled:false}])assert.throws(()=>core.calendar(value,{},now),/Save your weekly routine/);
 assert.throws(()=>core.calendar(schedule,{},now,'javascript:alert(1)'),/secure app link/);
 assert.equal(core.revision(schedule,{mealStyles:{Lunch:{style:'burritos',strength:'mostly'}}}),core.revision({...schedule,reviewedDate:'2026-10-24'},{mealStyles:{Lunch:{style:'burritos',strength:'mostly'}}}));
});
test('plain-language routine interprets shopping, prep, times and multiple meal preferences',()=>{
 const r=core.interpret('I shop on Saturdays at 8:30am and batch cook on Sunday at 2pm. Mostly burritos for lunch and curry for dinner.');
 assert.equal(r.routine.shopDay,'Saturday');assert.equal(r.routine.shopTime,'08:30');assert.equal(r.routine.prepDay,'Sunday');assert.equal(r.routine.prepTime,'14:00');assert.equal(r.routine.cookingStyle,'batch');
 assert.equal(r.mealStyles.Lunch.style,'burritos');assert.equal(r.mealStyles.Dinner.style,'curry');assert.deepEqual(r.mealCategories,['Lunch','Dinner']);
 assert.throws(()=>core.interpret('I shop Saturday at 25:00'),/valid reminder time/);
});
test('hypothetical, negated or unrelated conversation does not silently enable a routine',()=>{
 assert.equal(core.interpret('How should I shop on Saturday?'),null);assert.equal(core.interpret("I don't shop on Saturday"),null);assert.equal(core.interpret('I ate a burrito today'),null);
 const r=core.interpret('I prefer burritos for lunch');assert.equal(r.routine.enabled,false);assert.equal(r.mealStyles.Lunch.style,'burritos');
 const withOld=core.interpret('I prefer curry for dinner',schedule,{mealStyles:{Lunch:{style:'burritos',strength:'mostly'}}});assert.equal(withOld.mealStyles.Lunch.style,'burritos');assert.deepEqual(withOld.mealCategories,['Dinner']);
});
test('weekly choices replace only explicitly selected meal rules and keep macros, schedules and other repeats',()=>{
 const original={meals:3,budget:35,calories:1600,protein:150,varietyMode:'Tailored',tailoredMeals:{Breakfast:{mode:'repeat',recipeIds:['cereal']},Lunch:{mode:'repeat',recipeIds:['tuna']}},scheduledMeals:[{day:7,category:'Dinner',recipeIds:['steak']}],nutritionTargets:{fatMax:20}};
 const next=prefs.apply(original,{Lunch:{style:'burritos',strength:'mostly'}},'batch',['Lunch']);
 assert.equal(next.tailoredMeals.Lunch,undefined);assert.deepEqual(next.tailoredMeals.Breakfast,original.tailoredMeals.Breakfast);assert.deepEqual(next.scheduledMeals,original.scheduledMeals);assert.deepEqual(next.nutritionTargets,original.nutritionTargets);assert.equal(next.budget,35);assert.equal(next.protein,150);assert.equal(original.tailoredMeals.Lunch.recipeIds[0],'tuna');assert.equal(next.mealPrep,true);
 const keep=prefs.apply(original,{Lunch:{style:'burritos',strength:'mostly'}},'mixed',[]);assert.deepEqual(keep.tailoredMeals.Lunch,original.tailoredMeals.Lunch);
 assert.equal(prefs.describe({meals:2,mealStyles:{Breakfast:{style:'oats'},Lunch:{style:'burritos'}}}).length,1);
});
const recipe=(id,cat,name=id,nutrition={kcal:500,p:50,c:40,f:1,complete:true})=>({id,name,cat,servings:1,ings:[['Rice',80,'g']],nutrition,cookTime:20});
test('meal styles are soft and specific to the chosen role, with explicit cooking preferences',()=>{
 const burrito=recipe('b','Lunch','Buffalo burrito');const p={mealStyles:{Lunch:{style:'burritos',strength:'mostly'}}};
 assert.ok(prefs.score(burrito,p)>prefs.score(burrito,{mealStyles:{Lunch:{style:'burritos',strength:'prefer'}}}));assert.equal(prefs.score({...burrito,cat:'Dinner'},p),0);assert.equal(prefs.score({...burrito,name:'Salad'},p),0);
 assert.ok(prefs.score(burrito,{mealStyles:{Lunch:{style:'burritos',strength:'prefer'}}})>0);
 assert.ok(prefs.score({...burrito,fixedBatch:true},{cookingStyle:'batch'})>prefs.score(burrito,{cookingStyle:'batch'}));
 assert.throws(()=>normalizePlannerRequest({profile:{mealStyles:{Lunch:{style:'anything'}}},recipes:[burrito]}),/supported meal style/);
 assert.throws(()=>normalizePlannerRequest({profile:{mealStyles:[]},recipes:[burrito]}),/Meal preferences/);
});
test('large-library selection preserves preferred meal candidates and existing explicit choices',()=>{
 const recipes=Array.from({length:500},(_,i)=>recipe(String(i),'Lunch','Rice '+i));recipes.push(recipe('burrito','Lunch','Chicken Burrito'));
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(recipes,{profile:{mealStyles:{Lunch:{style:'burritos',strength:'mostly'}}},week:[{day:'Monday',meals:['499']}]},50);
 assert.equal(selected.length,50);assert.ok(selected.some(r=>r.id==='burrito'));assert.ok(selected.some(r=>r.id==='499'));
});
const foods=[recipe('breakfast','Breakfast'),recipe('b1','Lunch','Buffalo burrito'),recipe('b2','Lunch','Beef burrito'),recipe('plain','Lunch','Plain rice'),recipe('d1','Dinner'),recipe('d2','Dinner')];
const profile={days:7,meals:3,people:1,calories:1500,protein:120,budget:40,varietyMode:'Tailored',tailoredMeals:{Breakfast:{mode:'repeat',query:'Breakfast',recipeIds:['breakfast']}},mealStyles:{Lunch:{style:'burritos',strength:'mostly'}}};
const run=(p,recipes,extra={})=>optimizeMealPlan(normalizePlannerRequest({profile:p,recipes,...extra}));
test('mostly burritos strongly favours that slot while kept meals and daily targets remain enforced',async()=>{
 const result=await run(profile,foods,{week:[{day:'Monday',meals:['breakfast','plain','d1']}],locked:{'Monday::1':true}});
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.week[0].meals[1],'plain');assert.ok(result.mealPreferences[0].matched>=5);assert.ok(result.nutrition.days.every(d=>d.meetsTargets));assert.ok(result.basket.totalCostGBP<=40);
});
test('a preferred style cannot waive an explicit fat limit and suitable alternatives stay available',async()=>{
 const next=foods.map(r=>r.name.includes('burrito')?{...r,nutrition:{...r.nutrition,f:30}}:r);
 const result=await run({...profile,nutritionTargets:{fatMax:5}},next);
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.mealPreferences[0].matched,0);assert.ok(result.nutrition.days.every(d=>d.f<=5.01&&d.meetsTargets));
});
test('real cereal breakfast and mostly burrito lunches fit a whole-pack week within the chosen targets', {timeout:45000},async t=>{
 const recipes=await readRecipeLibrary();const p={...profile,calories:1600,protein:150,budget:45,nutritionTargets:{calorieMode:'max'},equipment:['Hob','Oven','Microwave'],cookTime:45,tailoredMeals:{Breakfast:{mode:'repeat',query:'cereal',recipeIds:['everyday-fuel10k-chocolate-flakes-milk']}}};
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(recipes,{profile:p});
 const result=await run(p,selected);assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.ok(result.week.every(day=>day.meals[0]==='everyday-fuel10k-chocolate-flakes-milk'));assert.ok(result.mealPreferences[0].matched>=4,JSON.stringify(result.mealPreferences));assert.ok(result.nutrition.days.every(day=>day.kcal<=1600.01&&day.p>=149.99));assert.ok(result.basket.totalCostGBP<=45);t.diagnostic(JSON.stringify({cost:result.basket.totalCostGBP,preferences:result.mealPreferences}));
});
test('mostly burritos remains meaningful with the default money-saving goals and a saved cereal repeat', {timeout:45000},async()=>{
 const recipes=await readRecipeLibrary(),p={...profile,calories:1800,protein:120,budget:50,varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'everyday-fuel10k-chocolate-flakes-milk'},tailoredMeals:{},cookingStyle:'batch',mealPrep:true,batch:true,goal:['Eat healthy','Save money','Make cooking easier'],likes:'chicken, beef, rice, potato, salad',equipment:['Hob','Oven','Microwave'],cookTime:45};
 const result=await run(p,globalThis.RecipeLibraryCore.selectPlannerRecipes(recipes,{profile:p}));
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.ok(result.mealPreferences[0].matched>=4,JSON.stringify(result.mealPreferences));assert.ok(result.week.every(day=>day.meals[0]===p.repeatMeals.Breakfast));assert.ok(result.basket.totalCostGBP<=50);assert.ok(result.nutrition.days.every(day=>day.meetsTargets));
});
