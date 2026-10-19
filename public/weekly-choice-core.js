/* Draft weekly choices without changing saved meals or daily nutrition targets. */
(function(root){
 'use strict';
 const Prefs=()=>root.MealPreferencesCore,slots=meals=>root.MealBudgetCore.mealSlots(Number(meals));
 function hasRule(p,cat){return Boolean(p.varietyMode==='Tailored'&&p.tailoredMeals?.[cat]||p.varietyMode==='Repeat favourites'&&p.repeatMeals?.[cat]);}
 function draft(profile={},routine={}){const r=root.WeeklyRoutineCore.normalize(routine),styles=Prefs().normalize(profile.mealStyles);return {
  budget:profile.budget??45,people:profile.people??1,days:profile.days??7,meals:profile.meals??3,
  mealFocus:Prefs().focus(profile.mealFocus),cookingStyle:profile.cookingStyle||r.cookingStyle,prepDay:r.prepDay,
  choices:Object.fromEntries(Prefs().categories.map(cat=>[cat,{style:hasRule(profile,cat)?'keep':styles[cat]?.style||'',strength:styles[cat]?.strength||'mostly'}]))
 };}
 function bounded(value,min,max,label,integer=false){const n=Number(value);if(value==null||value===''||!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))throw new Error('Choose '+label+' between '+min+' and '+max+'.');return n;}
 function candidate(value,profile={}){
  const budget=bounded(value.budget,0,10000,'a weekly household budget'),people=bounded(value.people,1,50,'the number of people',true),days=bounded(value.days,1,14,'a plan length',true),meals=bounded(value.meals,2,4,'meals per day',true);
  if(!['batch','fresh','mixed'].includes(value.cookingStyle))throw new Error('Choose how you want to cook.');
  if(!root.WeeklyRoutineCore.days.includes(value.prepDay))throw new Error('Choose a prep day.');
  const preferences={...Prefs().normalize(profile.mealStyles)},overrides=[];
  for(const cat of slots(meals)){const choice=value.choices?.[cat];if(choice?.style==='keep'){if(!hasRule(profile,cat))throw new Error('Your saved '+cat.toLowerCase()+' choice changed. Reopen weekly setup.');continue;}
   if(!choice||typeof choice.style!=='string')throw new Error('Choose a meal style for '+cat.toLowerCase()+'.');overrides.push(cat);
   if(choice.style)preferences[cat]={style:choice.style,strength:choice.strength};else delete preferences[cat];
  }
  return {...Prefs().apply(profile,preferences,value.cookingStyle,overrides),budget,people,days,meals,mealFocus:Prefs().focus(value.mealFocus,true)};
 }
 function routine(value,current,now=new Date()){const r=root.WeeklyRoutineCore.normalize(current);return {...r,cookingStyle:value.cookingStyle,prepDay:value.prepDay,reviewedDate:root.WeeklyRoutineCore.date(now,r.timeZone)};}
 root.WeeklyChoiceCore=Object.freeze({draft,candidate,routine,hasRule,slots});
})(globalThis);
