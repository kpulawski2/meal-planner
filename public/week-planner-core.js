/* Drafts and previews are independent of the saved plan. */
(function(root){
 'use strict';
 const clone=value=>structuredClone(value),slots=p=>root.MealBudgetCore.mealSlots(Number(p.meals));
 const category=r=>r.cat==='Fruit'?'Snack':r.cat;
 function draft(profile={}){
  const p=clone(profile),choices={},portions=root.MealBudgetCore.portionSettings(p,'fixed').meals;
  for(const cat of ['Breakfast','Lunch','Dinner','Snack']){
   const rule=p.varietyMode==='Tailored'?p.tailoredMeals?.[cat]:null;
   choices[cat]=rule?(rule.mode==='repeat'&&rule.recipeIds?.length===1?'recipe:'+rule.recipeIds[0]:'keep'):p.varietyMode==='Repeat favourites'&&p.repeatMeals?.[cat]?'recipe:'+p.repeatMeals[cat]:p.mealStyles?.[cat]?.style?'style:'+p.mealStyles[cat].style:'auto';
  }
  return {...p,budget:p.budget??45,people:p.people??1,days:p.days??7,meals:p.meals??3,calories:p.calories??2000,protein:p.protein??200,supermarket:p.supermarket||'Asda',choices,mealPortions:portions,nutritionTargets:root.MacroGoalsCore.normalise(p.nutritionTargets),cookingStyle:['batch','fresh','mixed'].includes(p.cookingStyle)?p.cookingStyle:'mixed'};
 }
 function bounded(value,min,max,label,integer=false){const n=Number(value);if(value==null||String(value).trim()===''||!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))throw new Error('Enter '+label+' between '+min+' and '+max+'.');return n;}
 function candidate(value,profile,recipes){
  const p=clone(profile),byId=new Map(recipes.map(r=>[r.id,r]));
  if(value.startDate!==undefined){if(!root.PlanCalendarCore?.valid(value.startDate))throw new Error('Choose a valid plan start date.');p.startDate=value.startDate;}
  for(const [key,min,max,int] of [['budget',0,10000,false],['people',1,50,true],['days',1,14,true],['meals',2,4,true],['calories',400,10000,false],['protein',0,1000,false]])p[key]=bounded(value[key],min,max,key,int);
  if(!['Asda','Lidl','Aldi'].includes(value.supermarket))throw new Error('Choose a supported supermarket.');
  if(!['batch','fresh','mixed'].includes(value.cookingStyle))throw new Error('Choose how you want to cook.');
  p.mealFocus=root.MealPreferencesCore.focus(value.mealFocus,true);p.supermarket=value.supermarket;p.supermarkets=[value.supermarket];p.cookingStyle=value.cookingStyle;p.batch=value.cookingStyle!=='fresh';p.mealPrep=value.cookingStyle==='batch';
  p.nutritionTargets=root.MacroGoalsCore.normalise(value.nutritionTargets,true);p.portionMode='fixed';p.mealPortions={...root.MealBudgetCore.portionSettings(profile,'fixed').meals};
  const rules=profile.varietyMode==='Tailored'?clone(profile.tailoredMeals||{}):profile.varietyMode==='Repeat favourites'?Object.fromEntries(Object.entries(profile.repeatMeals||{}).filter(([,id])=>id).map(([cat,id])=>[cat,{mode:'repeat',query:byId.get(id)?.name||'',recipeIds:[id]}])):{};
  p.scheduledMeals=clone(profile.scheduledMeals||[]);p.mealStyles=root.MealPreferencesCore.normalize(profile.mealStyles);
  for(const cat of slots(p)){
   p.mealPortions[cat]=bounded(value.mealPortions?.[cat],.25,Math.min(10,100/p.people),cat.toLowerCase()+' portions');
   const choice=value.choices?.[cat]||'auto';
   if(choice==='keep'){if(!rules[cat])throw new Error('Your '+cat.toLowerCase()+' choice changed. Reopen the planner.');continue;}
   delete rules[cat];delete p.mealStyles[cat];p.scheduledMeals=p.scheduledMeals.filter(row=>row.category!==cat);
   if(choice.startsWith('recipe:')){const r=byId.get(choice.slice(7));if(!r||category(r)!==cat)throw new Error('Choose an available '+cat.toLowerCase()+' recipe.');rules[cat]={mode:'repeat',query:r.name,recipeIds:[r.id]};}
   else if(choice.startsWith('style:')){const style=choice.slice(6);if(!root.MealPreferencesCore.styles.some(s=>s.id===style))throw new Error('Choose a supported meal style.');p.mealStyles[cat]={style,strength:'mostly'};}
   else if(choice!=='auto')throw new Error('Review your '+cat.toLowerCase()+' choice.');
  }
  p.tailoredMeals=Object.fromEntries(Object.entries(rules).filter(([cat])=>slots(p).includes(cat)));p.scheduledMeals=p.scheduledMeals.filter(row=>row.day<=p.days&&slots(p).includes(row.category));
  p.varietyMode=Object.keys(p.tailoredMeals).length||p.scheduledMeals.length?'Tailored':'Balanced';return p;
 }
 function cereal(base,settings,id){
  const grams=bounded(settings.grams,1,500,'cereal grams'),milk=bounded(settings.milk,1,1000,'milk amount');if(!['g','ml'].includes(settings.unit))throw new Error('Choose grams or millilitres for milk.');
  if(!base?.ings?.some(row=>/fuel10k/i.test(row[0])))throw new Error('Choose the FUEL10K cereal breakfast first.');
  return {...clone(base),id,name:'My FUEL10K Cereal & Skimmed Milk',servings:1,custom:true,personalCereal:true,fixedPortion:true,copiedFrom:{recipeId:base.id},ings:[['FUEL10K Chocolate Multigrain Flakes',grams,'g'],['Skimmed milk',milk,settings.unit]],method:['Weigh '+grams+' g cereal into your bowl.','Add '+milk+' '+settings.unit+' skimmed milk and serve. These amounts make one portion.'],kcal:null,p:null,c:null,f:null,cost:null,nutritionStatus:'estimated'};
 }
 function nutrition(model,recipes,nutritionOf){
  const byId=new Map(recipes.map(r=>[r.id,r])),people=Number(model.profile.people)||1;
  const days=model.week.map(day=>{const rows=day.meals.map(id=>nutritionOf(byId.get(id))),factors=day.meals.map((_,i)=>Number(model.mealServings[day.day+'::'+i]??people)/people),total={...root.MacroGoalsCore.total(rows,factors),complete:rows.every(n=>root.MacroGoalsCore.complete(n,model.profile))},issues=root.ManualPlanCore.issues(total,model.profile);return {day:day.day,...total,issues,meetsTargets:!issues.length};});
  return {days,met:days.filter(day=>day.meetsTargets).length};
 }
 function suggestions(model,recipes,{nutrition:n,allowed=()=>true}={}){
  const originalNutrition=n,cache=new Map();n=r=>{if(!cache.has(r.id))cache.set(r.id,originalNutrition(r));return cache.get(r.id);};
  const day=model.nutrition.days.find(d=>d.issues.length);if(!day)return [];
  const row=model.week.find(r=>r.day===day.day),byId=new Map(recipes.map(r=>[r.id,r])),people=Number(model.profile.people)||1,p={...model.profile,varietyMode:'Balanced',tailoredMeals:{},scheduledMeals:[]};
  const severity=total=>root.ManualPlanCore.issues(total,p).reduce((sum,issue)=>sum+(issue.kind==='unknown'?100:(issue.difference||0)/Math.max(1,issue.target)),0),before=severity(day),output=[];
  for(const [i,id] of row.meals.entries()){
   const current=byId.get(id),cat=category(current),factor=model.mealServings[row.day+'::'+i]/people,old=n(current);if(model.locked?.[row.day+'::'+i])continue;
   const alternatives=recipes.filter(r=>r.id!==id&&category(r)===cat&&!row.meals.includes(r.id)&&allowed(r,p)&&root.MacroGoalsCore.complete(n(r),p)).map(r=>{const change=n(r),next=Object.fromEntries(['kcal','p','c','f'].map(key=>[key,root.MacroGoalsCore.known(day[key])&&root.MacroGoalsCore.known(old[key])&&root.MacroGoalsCore.known(change[key])?day[key]+(change[key]-old[key])*factor:null]));return {recipe:r,score:severity(next),next};}).filter(r=>r.score<before-.00001).sort((a,b)=>a.score-b.score);
   if(alternatives[0]){const best=alternatives[0];output.push({category:cat,id:best.recipe.id,name:best.recipe.name,day:day.day,protein:best.next.p,kcal:best.next.kcal,fat:best.next.f,met:best.score===0});}
  }
  return output.slice(0,3);
 }
 function savedDraft(value){
  const keep=['startDate','budget','people','days','meals','calories','protein','supermarket','cookingStyle','mealFocus','choices','mealPortions','nutritionTargets','cereal'];
  const clean=Object.fromEntries(keep.filter(key=>Object.hasOwn(value,key)).map(key=>[key,clone(value[key])]));
  if(JSON.stringify(clean).length>30000)throw new Error('The plan draft is too large to save.');
  return {schemaVersion:1,value:clean,updatedAt:new Date().toISOString()};
 }
 function recoverDraft(saved,profile){if(saved?.schemaVersion!==1||!saved.value||typeof saved.value!=='object'||Array.isArray(saved.value))return null;try{const base=draft(profile),clean=savedDraft(saved.value).value,object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};return {...base,...clean,choices:{...base.choices,...Object.fromEntries(Object.entries(object(clean.choices)).filter(([cat,value])=>['Breakfast','Lunch','Dinner','Snack'].includes(cat)&&typeof value==='string'&&value.length<=200))},mealPortions:{...base.mealPortions,...object(clean.mealPortions)},nutritionTargets:{...base.nutritionTargets,...object(clean.nutritionTargets)},...(clean.cereal?{cereal:object(clean.cereal)}:{})};}catch{return null;}}
 root.WeekPlannerCore=Object.freeze({draft,candidate,cereal,nutrition,suggestions,savedDraft,recoverDraft});
})(globalThis);
