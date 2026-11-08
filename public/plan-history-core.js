/* Restores meal choices, never rolls back stock, purchases or cooking. */
(function(root){
 'use strict';
 const clone=v=>structuredClone(v),category=r=>r?.cat==='Fruit'?'Snack':r?.cat;
 function snapshot(state,label='Plan changed',at=new Date().toISOString()){
  return {id:'revision_'+Date.parse(at)+'_'+Math.random().toString(36).slice(2,9),label:String(label).slice(0,100),archivedAt:at,profile:clone(state.planProfile||state.profile),week:clone(state.week||[]),mealServings:clone(state.mealServings||{}),locked:clone(state.locked||{}),planSource:state.planSource||'manual'};
 }
 function record(next,before,label){
  if(!before.week?.length)return false;
  if(JSON.stringify([before.planProfile||before.profile,before.week,before.mealServings])===JSON.stringify([next.planProfile||next.profile,next.week,next.mealServings]))return false;
  next.planRevisions=[snapshot(before,label),...(Array.isArray(before.planRevisions)?before.planRevisions:[])].slice(0,12);return true;
 }
 function entries(state){return [...(Array.isArray(state.planRevisions)?state.planRevisions:[]),...(Array.isArray(state.planHistory)?state.planHistory:[]).map((row,i)=>({...row,id:'archive_'+i,label:'Previous week'}))].filter(row=>row?.profile&&typeof row.profile==='object'&&Array.isArray(row.week)&&row.week.length>0&&row.week.length<=14&&row.week.every(day=>day&&typeof day.day==='string'&&Array.isArray(day.meals)&&day.meals.length>=2&&day.meals.length<=4&&day.meals.every(id=>typeof id==='string'&&id.length>0&&id.length<=120))&&Number.isFinite(Date.parse(row.archivedAt))).slice(0,24);}
 function restore(state,entry,recipes,{locked={},cookedMeals={},allowed=()=>true,nutrition}={}){
  if(!entry||!Array.isArray(entry.week)||!entry.week.length)throw new Error('This saved plan is unavailable.');
  const p={...clone(entry.profile),diet:state.profile.diet,equipment:clone(state.profile.equipment||[]),dislikes:state.profile.dislikes,cookTime:state.profile.cookTime},slots=root.MealBudgetCore.mealSlots(Number(p.meals)),names=root.MealBudgetCore.dayNames(Number(p.days)||entry.week.length),byId=new Map(recipes.map(r=>[r.id,r]));
  p.days=Number(p.days??entry.week.length);p.people=Number(p.people??1);p.meals=Number(p.meals);p.supermarket=p.supermarket||state.profile.supermarket||'Asda';
  if(![2,3,4].includes(p.meals)||!Number.isInteger(p.days)||p.days<1||p.days>14||!Number.isInteger(p.people)||p.people<1||p.people>50||entry.week.length!==names.length)throw new Error('Review the saved plan’s length, meals and household size.');
  if(!Number.isFinite(Number(p.calories))||p.calories<400||p.calories>10000||!Number.isFinite(Number(p.protein))||p.protein<0||p.protein>1000||!Number.isFinite(Number(p.budget))||p.budget<0||p.budget>10000)throw new Error('Review the saved plan’s nutrition goals and budget.');
  p.nutritionTargets=root.MacroGoalsCore.normalise(p.nutritionTargets,true);
  const fixed={...state.locked,...locked};for(const key of Object.keys(cookedMeals))fixed[key]=true;
  const projected=root.PlannerSettingsCore.project(state,recipes,p,{locked:fixed,cookedMeals});if(projected.conflicts.length)throw new Error(projected.conflicts[0]);
  const week=[],mealServings={};let protectedMeals=0;
  for(const [d,day] of entry.week.entries()){
   if(!day||day.day!==names[d]||day.meals?.length!==slots.length)throw new Error('This saved plan has an invalid meal layout.');
   const row={day:day.day,meals:[]},prior=projected.week.find(r=>r.day===day.day);
   for(const [i,cat] of slots.entries()){
    const key=day.day+'::'+i,protectedMeal=projected.locked[key]===true,id=protectedMeal?prior?.meals[i]:day.meals[i],recipe=byId.get(id),amount=Number(protectedMeal?projected.mealServings[key]??p.people:entry.mealServings?.[key]??p.people);
    if(!recipe||recipe.unavailable||category(recipe)!==cat)throw new Error('A '+cat.toLowerCase()+' recipe in this saved plan is unavailable.');
    const fullyCooked=(projected.cookedMeals[key]?.servings||0)+.000001>=amount;
    if(!fullyCooked&&!allowed(recipe,{...p,varietyMode:'Balanced',tailoredMeals:{},scheduledMeals:[]}))throw new Error(recipe.name+' conflicts with your current recipe preferences or the saved food/equipment settings.');
    if(!Number.isFinite(amount)||amount<.25||amount>100)throw new Error('A saved portion count needs review.');
    if(protectedMeal)protectedMeals++;row.meals.push(id);mealServings[key]=amount;
   }
   week.push(row);
  }
  const model={ok:true,profile:p,week,mealServings,locked:projected.locked,moves:projected.moves,protectedMeals,shoppingVerified:false};model.nutrition=root.WeekPlannerCore.nutrition(model,recipes,nutrition);return model;
 }
 root.PlanHistoryCore=Object.freeze({snapshot,record,entries,restore});
})(globalThis);
