import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/personal-prices-core.js';
import '../public/food-log-core.js';
import '../public/app-experience-core.js';
import '../public/nutrition-diary-core.js';
import '../public/plan-calendar-core.js';
import '../public/daily-overview-core.js';
const core=DailyOverviewCore,food=FoodLogCore;
const recipes=[
 {id:'cereal',name:'Cereal and milk',cat:'Breakfast',nutrition:{kcal:350,p:25,c:40,f:6}},
 {id:'pasta',name:'Tuna pasta',cat:'Lunch',nutrition:{kcal:500,p:40,c:60,f:9}},
 {id:'chicken',name:'Chicken enchilada',cat:'Dinner',nutrition:{kcal:600,p:50,c:65,f:12}}
];
const fixture=()=>({profile:{startDate:'2026-11-08',people:2,calories:2000,protein:150,nutritionTargets:{fatMax:40}},interfacePreferences:{},week:Array.from({length:14},(_,i)=>({day:'day-'+i,meals:recipes.map(r=>r.id)})),mealServings:{'day-3::0':4,'day-3::1':2,'day-3::2':2},pantry:[{name:'Oats',qty:500,unit:'g'}],shopping:{milk:true},foodLog:[],pantryLedger:{planId:'plan-one'}});
const options=state=>({date:'2026-11-11',nutrition:r=>r.nutrition,servings:(day,index)=>state.mealServings[day+'::'+index]||2,cooked:()=>2});

test('a plan starting on Sunday maps dates to the actual meal slots, including week two',()=>{
 const state=fixture(),before=structuredClone(state);
 assert.equal(core.planForDate(state,'2026-11-08').day,'day-0');
 assert.equal(core.planForDate(state,'2026-11-18').day,'day-10');
 assert.equal(core.dateForPlan(state,'day-10'),'2026-11-18');
 assert.equal(core.planForDate(state,'2026-11-07'),null);assert.equal(core.planForDate(state,'2026-11-22'),null);
 assert.equal(core.planForDate(state,'2026-02-30'),null);assert.deepEqual(state,before);
});
test('Today starts with the real date and never silently substitutes a future or finished plan',()=>{
 const state=fixture();assert.equal(core.selectedDate(state,'2026-11-01'),'2026-11-01');
 state.interfacePreferences={plannedDay:'day-10',dailyDate:'2026-11-18',selectedOnDate:'2026-11-08'};
 assert.equal(core.selectedDate(state,'2026-11-09'),'2026-11-09');
 assert.equal(core.selectedDate(state,'2026-12-01'),'2026-12-01');
 assert.equal(core.model(state,recipes,{date:'2026-12-01'}).meals.length,0);
});
test('a deliberate selected date survives reload, while legacy weekly selections migrate to their dated meals',()=>{
 const state=fixture();state.interfacePreferences={plannedDay:'day-10',selectedOnDate:'2026-11-09'};
 assert.equal(core.selectedDate(state,'2026-11-09'),'2026-11-18');
 state.interfacePreferences=core.viewPreferences(state,'2026-11-11','2026-11-09');
 assert.equal(state.interfacePreferences.plannedDay,'day-3');
 assert.equal(core.selectedDate(JSON.parse(JSON.stringify(state)),'2026-11-09'),'2026-11-11');
 assert.equal(core.selectedDate(state,'2026-11-10'),'2026-11-10');
 assert.throws(()=>core.viewPreferences(state,'2026-02-30'),/valid date/);
});
test('prepared meals remain visible with exact 2/1/1 personal portions and separately recorded food',()=>{
 const state=fixture();food.record(state,{date:'2026-11-11',meal:'Breakfast',originKey:'plan-one::day-3::0',food:{name:'Cereal and milk',quantity:1,unit:'portion',nutrition:{...recipes[0].nutrition,source:'recipe'}},quantity:1.5},{id:'breakfast'});
 food.record(state,{date:'2026-11-11',meal:'Snack',food:{name:'Chocolate',quantity:100,unit:'g',nutrition:{kcal:500,p:null,c:50,f:20,source:'label'}},quantity:20},{id:'snack'});
 const before=structuredClone(state),model=core.model(state,recipes,options(state));
 assert.equal(model.meals.length,3);assert.deepEqual(model.meals.map(m=>m.portions),[2,1,1]);
 assert.equal(model.meals[0].nutrition.kcal,700);assert.equal(model.meals[0].entry.quantity,1.5);
 assert.equal(model.meals[0].cooked,2);assert.equal(model.meals[1].entry,null);
 assert.equal(model.diary.totals.kcal,625);assert.equal(model.diary.missing.p,1);
 assert.equal(model.meals.reduce((sum,m)=>sum+m.nutrition.kcal,0),1800);
 assert.deepEqual(state,before,'viewing food never cooks, resizes or logs meals');
});
test('custom diary goals and missing macro data remain identical on both daily views',()=>{
 const state=fixture();state.foodDiaryGoals={mode:'custom',kcal:1700,p:130,c:null,f:0};
 food.record(state,{date:'2026-11-11',meal:'Dinner',food:{name:'Unlabelled dinner',quantity:1,unit:'portion',nutrition:{kcal:400,p:null,c:null,f:0}},quantity:1},{id:'dinner'});
 const model=core.model(state,recipes,options(state));assert.equal(model.goals.values.kcal,1700);assert.equal(model.goals.values.f,0);assert.equal(model.diary.missing.p,1);assert.equal(model.diary.missing.f,0);assert.equal(state.profile.calories,2000);
});
test('editing or removing a diary record updates logged status without changing the planned meal',()=>{
 const state=fixture(),input={date:'2026-11-11',meal:'Lunch',originKey:'plan-one::day-3::1',food:{name:'Earlier lunch recipe',quantity:1,unit:'portion',nutrition:{kcal:450,p:30,c:50,f:8}},quantity:.5};
 food.record(state,input,{id:'lunch'});let model=core.model(state,recipes,options(state));assert.equal(model.meals[1].recipe.name,'Tuna pasta');assert.equal(model.meals[1].entry.food.name,'Earlier lunch recipe');
 food.record(state,{...input,id:'lunch',quantity:1});assert.equal(core.model(state,recipes,options(state)).diary.totals.kcal,450);
 state.foodLog=[];model=core.model(state,recipes,options(state));assert.equal(model.meals[1].entry,null);assert.equal(model.meals[1].recipe.id,'pasta');assert.equal(model.diary.totals.kcal,0);
});
test('the diary and plan share the UK calendar around summer and winter midnight boundaries',()=>{
 for(const [instant,date] of [['2026-06-01T23:30:00Z','2026-06-02'],['2026-11-09T23:30:00Z','2026-11-09'],['2026-10-25T00:30:00Z','2026-10-25']]){
  assert.equal(food.localDate(new Date(instant)),date);assert.equal(PlanCalendarCore.today(new Date(instant)),date);
 }
});
