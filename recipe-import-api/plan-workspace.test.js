import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/food-log-core.js';
import '../public/pantry-core.js';
import '../public/plan-calendar-core.js';
import '../public/plan-workspace-core.js';
const core=PlanWorkspaceCore,recipes=[{id:'oats',name:'Oats and milk',cat:'Breakfast',servings:1,ings:[['Oats',70,'g'],['Skimmed milk',200,'g']]},{id:'chicken',name:'Chicken',cat:'Dinner',servings:1,ings:[['Chicken breast',200,'g']]}];
function fixture(){const state={profile:{startDate:FoodLogCore.localDate(),people:1,days:1,meals:2,calories:2000,diet:'No restrictions',equipment:['Hob']},week:[{day:'Monday',meals:['oats','chicken']}],mealServings:{'Monday::0':2,'Monday::1':1},locked:{'Monday::0':true},shopping:{oats:true},prepPlan:{checked:{a:true},storage:{}},pantry:[{name:'Oats',qty:500,unit:'g'},{name:'Chicken breast',qty:500,unit:'g'}],leftovers:[],foodLog:[{id:'existing'}],customRecipes:[{id:'personal-cereal',ings:[['Cereal',70,'g'],['Milk',200,'g']]}],interfacePreferences:{theme:'dark'}};PantryCore.initialise(state);return state;}
const start=()=>FoodLogCore.shiftDate(FoodLogCore.localDate(),7);
test('repeat creates a separate next week with exact recipes and 2/1 portions while preserving shared food and stock',()=>{
 const s=fixture(),before=structuredClone(s);core.create(s,start(),{repeat:true});assert.equal(core.mode(s),'next');assert.deepEqual(s.week,before.week);assert.deepEqual(s.mealServings,before.mealServings);assert.deepEqual(s.locked,{});assert.deepEqual(s.shopping,{});assert.notEqual(s.pantryLedger.planId,before.pantryLedger.planId);assert.deepEqual(core.plans(s).current.week,before.week);
 for(const key of ['pantry','leftovers','foodLog','customRecipes'])assert.deepEqual(s[key],before[key]);
 s.week[0].meals[1]='oats';core.select(s,'current');assert.deepEqual(s.week,before.week);assert.deepEqual(s.locked,before.locked);assert.deepEqual(s.shopping,before.shopping);assert.equal(s.pantryLedger.planId,before.pantryLedger.planId);
 core.select(s,'next');assert.equal(s.week[0].meals[1],'oats');assert.deepEqual(s.mealServings,before.mealServings);
});
test('new-meal setup leaves the current plan recoverable and keeps independent drafts and shopping checks',()=>{
 const s=fixture();s.weekDraft={draft:'current'};core.create(s,start());assert.deepEqual(s.week,[]);assert.equal(s.weekDraft,undefined);s.weekDraft={draft:'next'};s.shopping={chicken:true};core.select(s,'current');assert.deepEqual(s.weekDraft,{draft:'current'});assert.deepEqual(s.shopping,{oats:true});core.select(s,'next');assert.deepEqual(s.weekDraft,{draft:'next'});assert.deepEqual(s.shopping,{chicken:true});
});
test('transactions and pantry purchases remain shared while cooked slots and weekly spending follow the selected plan',()=>{
 const s=fixture(),id=s.pantryLedger.planId;s.pantryLedger.cooked[PantryCore.slotKey(s,'Monday',0)]={recipeId:'oats',recipeSignature:PantryCore.recipeSignature(recipes[0]),servings:2};s.pantryLedger.transactions.push({id:'old-purchase',type:'purchase',planId:id,totalCostGBP:4});core.create(s,start(),{repeat:true});assert.deepEqual(s.pantryLedger.cooked,{});assert.equal(PantryCore.spentTotal(s),0);s.pantryLedger.transactions.push({id:'new-purchase',type:'purchase',planId:s.pantryLedger.planId,totalCostGBP:7});s.pantry[0].qty=600;core.select(s,'current');assert.equal(PantryCore.cookedPortions(s,'Monday',0,recipes),2);assert.equal(PantryCore.spentTotal(s),4);assert.equal(s.pantryLedger.transactions.length,2);assert.equal(s.pantry[0].qty,600);core.select(s,'next');assert.equal(PantryCore.spentTotal(s),7);
});
test('next week reserves current uncooked ingredients and excludes stock expiring before the future start',()=>{
 const s=fixture();s.pantry.push({name:'Skimmed milk',qty:1000,unit:'g',expiry:FoodLogCore.shiftDate(FoodLogCore.localDate(),1)});core.create(s,start(),{repeat:true});const available=core.availablePantry(s,recipes,s.pantry);assert.equal(available.find(x=>x.name==='Oats').qty,360);assert.equal(available.find(x=>x.name==='Chicken breast').qty,300);assert.equal(available.some(x=>x.name==='Skimmed milk'),false);assert.equal(s.pantry[0].qty,500);
});
test('activation on the start date archives the old week once and retains next-week advance purchases and stock',()=>{
 const s=fixture(),old=structuredClone(s.week);core.create(s,start(),{repeat:true});const nextId=s.pantryLedger.planId;s.shopping={oats:true};assert.equal(core.activateDue(s,FoodLogCore.localDate()),false);assert.equal(core.activateDue(s,start()),true);assert.equal(s.planWorkspace,undefined);assert.equal(s.pantryLedger.planId,nextId);assert.deepEqual(s.shopping,{oats:true});assert.deepEqual(s.planHistory[0].week,old);assert.equal(core.activateDue(s,start()),false);assert.equal(s.planHistory.length,1);
});
test('backup round trip preserves both weeks and shared diet preferences carry between them',()=>{
 let s=fixture();core.create(s,start(),{repeat:true});s=JSON.parse(JSON.stringify(s));s.profile.diet='Vegetarian';core.select(s,'current');assert.equal(s.profile.diet,'Vegetarian');core.select(s,'next');assert.equal(s.profile.diet,'Vegetarian');assert.throws(()=>core.create(s,start(),{repeat:true}),/already saved/);
});
test('soon-expiring stock is reserved for current meals before reserving longer-lasting stock',()=>{
 const s=fixture();s.pantry.push({name:'Oats',qty:300,unit:'g',expiry:FoodLogCore.shiftDate(FoodLogCore.localDate(),1)});core.create(s,start(),{repeat:true});const available=core.availablePantry(s,recipes,s.pantry);assert.equal(available.find(x=>x.name==='Oats').qty,500);assert.equal(available.filter(x=>x.name==='Oats').length,1);
});
test('activation from the current view retains advance cooking and the latest shared food restrictions',()=>{
 const s=fixture();core.create(s,start(),{repeat:true});s.profile.budget=95;const id=s.pantryLedger.planId,key=PantryCore.slotKey(s,'Monday',1);s.pantryLedger.cooked[key]={recipeId:'chicken',recipeSignature:PantryCore.recipeSignature(recipes[1]),servings:1};core.select(s,'current');s.profile.dislikes='mushrooms';assert.equal(core.activateDue(s,start()),true);assert.equal(s.profile.budget,95);assert.equal(s.profile.dislikes,'mushrooms');assert.equal(s.pantryLedger.planId,id);assert.equal(PantryCore.cookedPortions(s,'Monday',1,recipes),1);
});
