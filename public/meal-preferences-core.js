/* Meal styles rank suitable recipes. They never relax diet, equipment or targets. */
(function(root){
 'use strict';
 const categories=['Breakfast','Lunch','Dinner','Snack'];
 const styles=[
  {id:'burritos',label:'Burritos',pattern:/\bburritos?\b/},
  {id:'wraps',label:'Wraps & pittas',pattern:/\bwraps?\b|\bpittas?\b|\bgyros\b/},
  {id:'salads',label:'Salads & lunch boxes',pattern:/\bsalads?\b|\bsalad boxes\b/},
  {id:'rice',label:'Rice bowls',pattern:/\brice\b|\bbowls?\b/},
  {id:'pasta',label:'Pasta & noodles',pattern:/\bpasta\b|\bnoodles?\b|\bmacaroni\b|\borzo\b/},
  {id:'curry',label:'Curries',pattern:/\bcurr(?:y|ies)\b|\btikka\b|\bdahl\b|\bbutter chicken\b/},
  {id:'fakeaway',label:'Fakeaways',pattern:/\bfakeaway\b/},
  {id:'oats',label:'Oats & porridge',pattern:/\boats\b|\bporridge\b|\bowsianka\b/},
  {id:'cereal',label:'Cereal & milk',pattern:/\bcereal\b|\bflakes\b/},
  {id:'eggs',label:'Egg breakfasts',pattern:/\beggs?\b|\bomelette\b|\bfrittata\b/},
  {id:'smoothie',label:'Smoothie bowls',pattern:/\bsmoothie[ -]bowl\b|\bprotein bowl\b/},
  {id:'sandwiches',label:'Sandwiches & toast',pattern:/\bsandwich\b|\btoast\b|\bbagel\b/},
  {id:'roast',label:'Roasts & traybakes',pattern:/\broast|\btray[ -]?bake|\bwedges\b|\bloaded fries\b/}
 ];
 const category=r=>r?.cat==='Fruit'?'Snack':r?.cat;
 function normalize(value,strict=false){
  if(value!=null&&(typeof value!=='object'||Array.isArray(value))){if(strict)throw new TypeError('Meal preferences must describe meal types.');return {};}
  const result={};for(const cat of categories){const rule=value?.[cat];if(rule==null)continue;
   const valid=rule&&typeof rule==='object'&&!Array.isArray(rule)&&styles.some(s=>s.id===rule.style)&&['prefer','mostly'].includes(rule.strength||'mostly');
   if(!valid){if(strict)throw new TypeError('Choose a supported meal style and preference strength.');continue;}
   result[cat]={style:rule.style,strength:rule.strength||'mostly'};
  }return result;
 }
 function matches(recipe,id){const style=styles.find(s=>s.id===id);if(!style)return false;const tags=Array.isArray(recipe.tags)?recipe.tags:[];return style.pattern.test([recipe.name,...tags].join(' ').toLowerCase());}
 function score(recipe,profile={}){
  const rule=normalize(profile.mealStyles)[category(recipe)];let score=rule&&matches(recipe,rule.style)?rule.strength==='mostly'?2000:600:0;
  const tags=Array.isArray(recipe.tags)?recipe.tags:[];
  if(profile.cookingStyle==='batch')score+=recipe.fixedBatch?70:tags.includes('meal-prep')?35:0;
  if(profile.cookingStyle==='fresh'&&Number(recipe.cookTime)>0&&Number(recipe.cookTime)<=25)score+=25;
  return score;
 }
 function describe(profile={}){const active=profile.meals===2?['Lunch','Dinner']:profile.meals===3?['Breakfast','Lunch','Dinner']:categories;return Object.entries(normalize(profile.mealStyles)).filter(([cat])=>active.includes(cat)).map(([cat,rule])=>({category:cat,label:styles.find(s=>s.id===rule.style).label,...rule}));}
 function report(week,recipes,profile={}){const byId=new Map(recipes.map(r=>[r.id,r]));return describe(profile).map(row=>{
  const meals=week.flatMap(day=>day.meals||[]).map(id=>byId.get(id)).filter(r=>r&&category(r)===row.category);
  return {...row,matched:meals.filter(r=>matches(r,row.style)).length,total:meals.length};
 });}
 function apply(profile,preferences,cookingStyle,overrides=Object.keys(preferences||{})){
  const mealStyles=normalize(preferences,true),next={...profile,mealStyles,cookingStyle:['batch','fresh','mixed'].includes(cookingStyle)?cookingStyle:'mixed',tailoredMeals:{...profile.tailoredMeals},repeatMeals:{...profile.repeatMeals}};
  // Choosing a new weekly style explicitly replaces that slot's old daily rule.
  // Other daily favourites and all per-day/cooked locks stay in force.
  for(const cat of overrides.filter(cat=>categories.includes(cat))){delete next.tailoredMeals[cat];delete next.repeatMeals[cat];}
  if(next.varietyMode==='Tailored'&&!Object.keys(next.tailoredMeals).length&&!next.scheduledMeals?.length)next.varietyMode='Balanced';
  if(next.varietyMode==='Repeat favourites'&&!Object.keys(next.repeatMeals).length)next.varietyMode='Balanced';
  next.mealPrep=next.cookingStyle==='batch';next.batch=next.cookingStyle!=='fresh';return next;
 }
 root.MealPreferencesCore=Object.freeze({categories,styles,normalize,matches,score,describe,report,apply});
})(globalThis);
