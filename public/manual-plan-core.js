/* Explicit meal choices can form a usable plan without pretending that an
   incomplete price check or a missed nutrition target has passed. */
(function(root){
 'use strict';
 const category=recipe=>recipe?.cat==='Fruit'?'Snack':recipe?.cat;
 function hasChoices(profile={}){
  const slots=root.MealBudgetCore.mealSlots(profile.meals);
  return slots.every(cat=>profile.varietyMode==='Tailored'?profile.tailoredMeals?.[cat]?.recipeIds?.length>0:profile.varietyMode==='Repeat favourites'&&Boolean(profile.repeatMeals?.[cat]));
 }
 function issues(total,profile){
  const limits=root.MacroGoalsCore.targets(profile),known=root.MacroGoalsCore.known,result=[];
  const check=(key,label,min,max,unit)=>{
   if(!known(total[key])){result.push({key,kind:'unknown',label:label+' unavailable'});return;}
   const value=Number(total[key]);
   if(min!==null&&value<min-.000001)result.push({key,kind:'below',value,target:min,difference:min-value,label:label+' '+round(min-value)+unit+' below '+round(min)+unit});
   if(max!==null&&value>max+.000001)result.push({key,kind:'above',value,target:max,difference:value-max,label:label+' '+round(value-max)+unit+' above '+round(max)+unit});
  };
  check('kcal','Calories',limits.min,limits.max,' kcal');check('p','Protein',limits.protein,null,'g');
  if(limits.requireC)check('c','Carbs',limits.carbMin,limits.carbMax,'g');
  if(limits.fatMax!==null)check('f','Fat',null,limits.fatMax,'g');
  if(total.complete===false&&!result.some(row=>row.kind==='unknown'))result.push({key:'nutrition',kind:'unknown',label:'Some nutrition estimates are incomplete'});
  return result;
 }
 function round(value){return Math.round(value*10)/10;}
 function build(state,recipes,profile,options={}){
  const p=structuredClone(profile),days=Number(p.days||7),people=Number(p.people||1),settings=root.MealBudgetCore.portionSettings(p,'fixed');
  if(!Number.isInteger(days)||days<1||days>14||!Number.isInteger(people)||people<1||people>50)throw new Error('Choose 1–14 days and a valid household size.');
  if(!Number.isFinite(Number(p.calories))||Number(p.calories)<400||Number(p.calories)>10000||!Number.isFinite(Number(p.protein))||Number(p.protein)<0||Number(p.protein)>1000||!Number.isFinite(Number(p.budget))||Number(p.budget)<0||Number(p.budget)>10000)throw new Error('Review the calories, protein and budget before saving.');
  if(![2,3,4].includes(Number(p.meals)))throw new Error('Choose 2, 3 or 4 meals per day.');
  p.nutritionTargets=root.MacroGoalsCore.normalise(p.nutritionTargets,true);
  for(const cat of root.MealBudgetCore.mealSlots(p.meals)){const amount=Number(p.mealPortions?.[cat]??1);if(!Number.isFinite(amount)||amount<.25||amount>10||amount*people>100)throw new Error('Review the '+cat.toLowerCase()+' portion amount.');}
  const slots=root.MealBudgetCore.mealSlots(p.meals),names=root.MealBudgetCore.dayNames(days),byId=new Map(recipes.map(r=>[r.id,r]));
  const life={locked:{...(state.locked||{}),...(options.locked||{})},cookedMeals:options.cookedMeals||{}};
  for(const key of Object.keys(life.cookedMeals))life.locked[key]=true;
  const projected=root.PlannerSettingsCore.project(state,recipes,p,life);if(projected.conflicts.length)throw new Error(projected.conflicts[0]);
  const week=[],mealServings={},nutritionDays=[],missing=new Set(),allowed=options.allowed||(()=>true),nutrition=options.nutrition||(r=>r.n||r.nutrition||{});
  for(const [dayIndex,name] of names.entries()){
   const prior=projected.week.find(row=>row.day===name),row={day:name,meals:[]};
   for(const [index,cat] of slots.entries()){
    const key=name+'::'+index,protectedMeal=projected.locked[key]===true;
    const scheduled=(p.scheduledMeals||[]).find(rule=>rule.day===dayIndex+1&&rule.category===cat);
    const rule=scheduled||(p.varietyMode==='Tailored'?p.tailoredMeals?.[cat]:null),ids=rule?.recipeIds||[];
    const id=protectedMeal?prior?.meals[index]:ids.length?ids[rule.mode==='vary'?dayIndex%ids.length:0]:p.varietyMode==='Repeat favourites'&&p.repeatMeals?.[cat]?p.repeatMeals[cat]:prior?.meals[index];
    const recipe=byId.get(id);if(!recipe){missing.add(cat);row.meals.push('');continue;}
    const servings=protectedMeal?Number(projected.mealServings[key]||people):settings.meals[cat]*people;
    if(!Number.isFinite(servings)||servings<.25||servings>100)throw new Error('Review the '+cat.toLowerCase()+' portion amount.');
    const fullyCooked=Number(projected.cookedMeals[key]?.servings||0)+.000001>=servings;
    if(category(recipe)!==cat||!fullyCooked&&!allowed(recipe))throw new Error('Your '+cat.toLowerCase()+' choice conflicts with your food, equipment or cooking settings. Review that choice before saving.');
    if(!Array.isArray(recipe.ings)||!recipe.ings.length||!(Number(recipe.servings===undefined?1:recipe.servings)>0))throw new Error('Review the ingredient amounts and yield for '+recipe.name+'.');
    row.meals.push(id);mealServings[key]=servings;
   }
   week.push(row);
   if(row.meals.every(Boolean)){
    const rows=row.meals.map(id=>nutrition(byId.get(id))),factors=row.meals.map((id,index)=>mealServings[name+'::'+index]/people);
    const total={...root.MacroGoalsCore.total(rows,factors),complete:rows.every(n=>root.MacroGoalsCore.complete(n,p))};
    const gaps=issues(total,p);nutritionDays.push({day:name,...total,issues:gaps,meetsTargets:gaps.length===0});
   }
  }
  if(missing.size)return {ok:false,missing:[...missing],message:'Choose a meal for '+[...missing].join(', ')+' first, or let the automatic planner fill those meals.'};
  p.portionMode='fixed';p.mealPortions=settings.meals;
  return {ok:true,profile:p,week,mealServings,locked:projected.locked,moves:projected.moves,nutrition:{days:nutritionDays,met:nutritionDays.filter(row=>row.meetsTargets).length},shoppingVerified:false};
 }
 root.ManualPlanCore=Object.freeze({hasChoices,issues,build});
})(globalThis);
