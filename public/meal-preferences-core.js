/* Meal styles rank suitable recipes. They never relax diet, equipment or targets. */
(function(root){
 'use strict';
 const categories=['Breakfast','Lunch','Dinner','Snack'];
 const focuses=[
  {id:'balanced',label:'A bit of everything',description:'Let the planner mix suitable meals.'},
  {id:'fakeaway',label:'Fakeaway',description:'Takeaway flavours, cooked at home.'},
  {id:'healthy',label:'Healthy focused',description:'More vegetables, beans and wholegrains.'},
  {id:'quick',label:'Quick & easy',description:'Prefer known cooking times of 25 minutes or less.'}
 ];
 function focus(value,strict=false){if(value==null||value==='')return 'balanced';if(focuses.some(row=>row.id===value))return value;if(strict)throw new TypeError('Choose a supported weekly meal focus.');return 'balanced';}
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
 function focusScore(recipe,value){
  const id=focus(value);if(id==='balanced')return 0;
  if(id==='fakeaway')return ['Lunch','Dinner'].includes(category(recipe))&&matches(recipe,'fakeaway')?400:0;
  if(id==='quick'){const minutes=Number(recipe.cookTime);return recipe.cookTime!=null&&recipe.cookTime!==''&&Number.isFinite(minutes)&&minutes>0&&minutes<=25?250:0;}
  // Ingredient-based choice guidance, not a medical score or invented nutrient data.
  let plants=0,wholegrain=0,pulses=0;
  for(const [name,quantity,unit] of recipe.ings||[]){const words=String(name).toLowerCase(),perPortion=Number(quantity)/Math.max(1,Number(recipe.servings)||1),grams=unit==='kg'?perPortion*1000:unit==='g'||unit==='ml'?perPortion:unit==='piece'?perPortion*80:0;if(!Number.isFinite(grams)||grams<=0)continue;
   if(/tomato|carrot|spinach|broccoli|courgette|cabbage|cauliflower|\bpeas\b|vegetable|onion|mushroom|berries|\bapple|\bbanana|pepper/.test(words)&&grams>=40)plants+=Math.min(200,grams);
   if(/lentil|chickpea|\bbeans\b/.test(words)&&grams>=30)pulses+=Math.min(150,grams);
   if(/wholegrain|wholewheat|wholemeal|brown rice|\boats\b/.test(words)&&grams>=15)wholegrain+=Math.min(100,grams);
  }
  return Math.min(400,plants+pulses*1.5+wholegrain*1.5);
 }
 function score(recipe,profile={}){
  const rule=normalize(profile.mealStyles)[category(recipe)];let score=(rule&&matches(recipe,rule.style)?rule.strength==='mostly'?2000:600:0)+focusScore(recipe,profile.mealFocus);
  const tags=Array.isArray(recipe.tags)?recipe.tags:[];
  if(profile.cookingStyle==='batch')score+=recipe.fixedBatch?70:tags.includes('meal-prep')?35:0;
  if(profile.cookingStyle==='fresh')score+=recipe.fixedBatch?-1200:Number(recipe.cookTime)>0&&Number(recipe.cookTime)<=25?100:0;
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
 root.MealPreferencesCore=Object.freeze({categories,styles,focuses,focus,focusScore,normalize,matches,score,describe,report,apply});
})(globalThis);
