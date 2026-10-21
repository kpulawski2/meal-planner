(function(root){
 'use strict';
 const keys=['kcal','p','c','f'],meals=['Breakfast','Lunch','Dinner','Snack','Uncategorised'];
 function goalSettings(raw={}){
  if(raw.mode!=='custom')return {mode:'plan'};
  const result={mode:'custom'};for(const key of keys){const value=raw[key];if(value==null||value===''){result[key]=null;continue;}if(!['string','number'].includes(typeof value)||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>100000)throw new Error('Enter valid diary goals, or leave optional goals blank.');result[key]=Number(value);}if(!(result.kcal>0))throw new Error('Enter a calorie goal above zero.');return result;
 }
 function goals(state){let settings;try{settings=goalSettings(state.foodDiaryGoals);}catch{settings={mode:'plan'};}if(settings.mode==='custom')return {mode:'custom',values:settings,kinds:{kcal:'target',p:'target',c:'target',f:'target'}};const p=state.profile||{},n=p.nutritionTargets||{};return {mode:'plan',values:{kcal:Number(p.calories)||null,p:Number(p.protein)||null,c:n.carbs==null?null:Number(n.carbs),f:n.fatMax==null?null:Number(n.fatMax)},kinds:{kcal:n.calorieMode==='max'?'max':'target',p:'min',c:n.carbMode==='max'?'max':'target',f:'max'}};}
 function day(state,date){if(!root.FoodLogCore.validDate(date))throw new Error('Choose a valid diary date.');const result=root.FoodLogCore.summary(state,date);return {...result,groups:meals.map(meal=>{const rows=result.rows.filter(row=>(row.meal||'Uncategorised')===meal),totals={},missing={};for(const key of keys){totals[key]=rows.reduce((sum,row)=>sum+(row.nutrition[key]??0),0);missing[key]=rows.filter(row=>row.nutrition[key]==null).length;}return {meal,rows,totals,missing};})};}
 function week(state,end){return Array.from({length:7},(_,i)=>{const date=root.FoodLogCore.shiftDate(end,i-6);return {date,...day(state,date)};});}
 function copyPreview(state,source,target,meal='All'){
  if(!root.FoodLogCore.validDate(source)||!root.FoodLogCore.validDate(target)||source===target)throw new Error('Choose two different valid dates.');if(!['All',...meals].includes(meal))throw new Error('Choose a diary meal.');
  const rows=day(state,source).rows.filter(row=>meal==='All'||(row.meal||'Uncategorised')===meal);if(!rows.length)throw new Error('No recorded foods match that date and meal.');if(rows.length>100)throw new Error('Copy one meal at a time when a day has more than 100 foods.');if((state.foodLog||[]).length+rows.length>5000)throw new Error('Your food diary is full. Export a backup before removing older entries.');
  return {source,target,meal,rows,existing:day(state,target).rows.length,snapshot:JSON.stringify(state.foodLog||[])};
 }
 function copyApply(state,preview){if(!preview||JSON.stringify(state.foodLog||[])!==preview.snapshot)throw new Error('The diary changed. Review the foods to copy again.');const current=copyPreview(state,preview.source,preview.target,preview.meal),next=structuredClone(state);for(const row of current.rows)root.FoodLogCore.record(next,{date:current.target,food:row.food,quantity:row.quantity,meal:row.meal,originKey:null});return next;}
 root.NutritionDiaryCore=Object.freeze({keys,meals,goalSettings,goals,day,week,copyPreview,copyApply});
})(globalThis);
