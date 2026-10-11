/* Pure helpers for recipe corrections and taste history. All saved data stays
   inside the exported app state; this module does not contact a server. */
(function(root){
 'use strict';
 const DAY=86400000;
 let copySequence=0;
 // State helpers replace these arrays when they write. Cache their normalized
 // indexes across recipe-card and planner comparisons instead of sorting the
 // same preference history for every one of thousands of recipes.
 const tasteCache=new WeakMap();
 const text=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
 const idOf=recipe=>text(typeof recipe==='string'?recipe:recipe?.id);
 function feedbackRows(state={}){
  const latest=new Map();
  for(const row of Array.isArray(state.recipeFeedback)?state.recipeFeedback:[]){
   const recipeId=text(row?.recipeId),value=row?.value;
   if(!recipeId||!['again','skip'].includes(value)||!validTime(row.updatedAt))continue;
   if(!latest.has(recipeId)||Date.parse(latest.get(recipeId).updatedAt)<=Date.parse(row.updatedAt))latest.set(recipeId,{recipeId,value,updatedAt:new Date(row.updatedAt).toISOString()});
  }
  return [...latest.values()].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)).slice(0,5000);
 }
 function historyRows(state={},now=Date.now()){
  const seen=new Set();
  return (Array.isArray(state.recentMeals)?state.recentMeals:[]).filter(row=>{
   if(!text(row?.recipeId)||!validTime(row.cookedAt)||Date.parse(row.cookedAt)>now+300000)return false;
   const key=text(row.transactionId,180)||[row.recipeId,row.cookedAt].join('::');
   if(seen.has(key))return false;seen.add(key);return true;
  }).map(row=>({recipeId:text(row.recipeId),dishFamily:text(row.dishFamily,80),cookedAt:new Date(row.cookedAt).toISOString(),transactionId:text(row.transactionId,180),portions:Number.isFinite(Number(row.portions))&&Number(row.portions)>0?Math.min(100,Number(row.portions)):null})).sort((a,b)=>Date.parse(b.cookedAt)-Date.parse(a.cookedAt)).slice(0,120);
 }
 function normalizeState(state={},options={}){
  state.recipeFeedback=feedbackRows(state);state.recentMeals=historyRows(state,options.now??Date.now());tasteCache.delete(state);return state;
 }
 function tasteIndex(state={}){
  if(!state||typeof state!=='object')return {feedback:new Map(),history:[]};
  const previous=tasteCache.get(state),feedback=state.recipeFeedback,history=state.recentMeals;
  if(previous&&previous.feedbackSource===feedback&&previous.historySource===history&&previous.feedbackLength===feedback?.length&&previous.historyLength===history?.length)return previous;
  const value={feedbackSource:feedback,historySource:history,feedbackLength:feedback?.length,historyLength:history?.length,feedback:new Map(feedbackRows(state).map(row=>[row.recipeId,row.value])),history:historyRows(state,Infinity)};
  tasteCache.set(state,value);return value;
 }
 function feedbackValue(recipe,state={}){
  const id=idOf(recipe),source=text(recipe?.copiedFrom?.recipeId);
  const values=tasteIndex(state).feedback;return values.get(id)||values.get(source)||null;
 }
 function allowedFeedback(recipe,state={}){return feedbackValue(recipe,state)!=='skip';}
 function setFeedback(state,recipe,value,options={}){
  const recipeId=idOf(recipe);if(!recipeId||!['again','skip',null].includes(value))throw new TypeError('Choose would eat again, skip next time, or clear.');
  const at=options.at||new Date().toISOString();if(!validTime(at))throw new TypeError('Feedback needs a valid date.');
  state.recipeFeedback=feedbackRows(state).filter(row=>row.recipeId!==recipeId);
  if(value)state.recipeFeedback.unshift({recipeId,value,updatedAt:new Date(at).toISOString()});
  state.recipeFeedback=state.recipeFeedback.slice(0,5000);
  return state.recipeFeedback;
 }
 function recordCook(state,recipe,options={}){
  const recipeId=idOf(recipe),transactionId=text(options.transactionId,180),cookedAt=options.cookedAt||new Date().toISOString(),now=options.now??Date.now();
  if(!recipeId||!transactionId||!validTime(cookedAt)||Date.parse(cookedAt)>now+300000)throw new TypeError('Cooking history needs a recipe, transaction and valid date.');
  const current=historyRows(state,now);if(current.some(row=>row.transactionId===transactionId)){state.recentMeals=current;return false;}
  state.recentMeals=historyRows({recentMeals:[{recipeId,dishFamily:text(recipe?.dishFamily,80)||root.MealBudgetCore?.dishFamily?.(recipe)||'',cookedAt,transactionId,portions:options.portions},...current]},now);
  return true;
 }
 function feedbackScore(recipe,state={},options={}){
  const now=options.now??Date.now(),id=idOf(recipe),family=text(recipe?.dishFamily,80)||root.MealBudgetCore?.dishFamily?.(recipe)||'';
  let score=feedbackValue(recipe,state)==='again'?24:0,penalty=0;
  for(const row of tasteIndex(state).history){
   const age=(now-Date.parse(row.cookedAt))/DAY;if(age<0||age>=21)continue;
   const exact=row.recipeId===id||row.recipeId===recipe?.copiedFrom?.recipeId;
   if(!exact&&!(family&&row.dishFamily===family))continue;
   penalty+=(age<3?28:age<7?18:age<14?10:4)*(exact?1:.5);
  }
  return Math.max(-40,Math.min(40,score-Math.min(40,penalty)));
 }
 function rank(rows,state={},options={}){
  return rows.filter(row=>allowedFeedback(row,state)).slice().sort((a,b)=>feedbackScore(b,state,options)-feedbackScore(a,state,options)||idOf(a).localeCompare(idOf(b)));
 }
 function readiness(recipe={},options={}){
  const reasons=[],add=(code,label,ingredient)=>reasons.push({code,label,...(ingredient?{ingredient}: {})}),nutrition=options.nutrition||recipe.nutrition||{};
  if(recipe.unavailable)add('unavailable','The saved recipe is unavailable.');
  if(recipe.servings!==undefined&&(!(Number(recipe.servings)>0)||!Number.isFinite(Number(recipe.servings))))add('yield','Confirm how many portions the recipe makes.');
  const ings=Array.isArray(recipe.ings)?recipe.ings:[];
  if(!ings.length)add('ingredients','Add the ingredients and measured quantities.');
  if(ings.length>40)add('ingredients_limit','Use at most 40 ingredients for automatic planning.');
  for(const row of ings){
   if(!Array.isArray(row)){add('quantity','Each ingredient needs a name, measured quantity and unit.');continue;}
   const ingredient=text(row?.[0]);
   if(!ingredient)add('ingredient_name','An ingredient needs its name.');
   if(!(Number(row?.[1])>0)||!Number.isFinite(Number(row?.[1])))add('quantity','Confirm the quantity for '+(ingredient||'the unnamed ingredient')+'.',ingredient);
   // Legacy measured item counts (for example one egg) use a blank unit. The
   // shared nutrition calculation confirms those known conversions explicitly.
   if(!text(row?.[2],40)&&nutrition.complete!==true)add('unit','Confirm the unit for '+(ingredient||'the unnamed ingredient')+'.',ingredient);
  }
  const method=Array.isArray(recipe.method)?recipe.method.filter(step=>text(step,5000)):typeof recipe.method==='string'?recipe.method.trim():'';
  if(!method.length)add('method','Add the cooking steps.');
  if(nutrition.complete!==true||!(Number(nutrition.kcal)>0)||!Number.isFinite(Number(nutrition.kcal))||nutrition.p==null||!Number.isFinite(Number(nutrition.p))||Number(nutrition.p)<0){
   if(Array.isArray(nutrition.missing)&&nutrition.missing.length)for(const label of [...new Set(nutrition.missing)])add('nutrition','Nutrition estimate needs '+String(label)+'.');
   else add('nutrition','Complete the ingredient nutrition estimate or supply verified calories and protein.');
  }
  if(recipe.needsReview===true&&!reasons.some(reason=>['yield','quantity','unit','method','nutrition'].includes(reason.code))){
   const notes=Array.isArray(recipe.reviewReasons)?recipe.reviewReasons.filter(Boolean):[];
   for(const label of notes.length?notes:['Check the source details before automatic planning.'])add('source_review',String(label));
  }
  const profile=options.profile||{},available=new Set((Array.isArray(profile.equipment)?profile.equipment:[]).map(v=>String(v).toLowerCase()));
  for(const name of Array.isArray(recipe.equipment)?recipe.equipment:[])if(!available.has(String(name).toLowerCase()))add('equipment','Enable '+String(name)+' in your kitchen equipment.');
  if(options.state&&!allowedFeedback(recipe,options.state))add('feedback','You chose Skip next time. Clear that preference to use this recipe again.');
  // Unchecked prices are not an error. Only report gaps from an actual catalogue check.
  const pricing=options.pricing;
  if(pricing?.checked===true&&pricing.complete===false){
   const missing=Array.isArray(pricing.missing)?pricing.missing.filter(Boolean):[];
   for(const name of missing.length?missing:[null])add('pricing',name?'No verified '+(pricing.store||'supermarket')+' pack price for '+String(name)+'.':'Some ingredients have no verified supermarket pack price.',name);
  }
  const correctionCodes=['unavailable','yield','ingredients','ingredients_limit','ingredient_name','quantity','unit','method','nutrition','source_review'];
  return {ready:!reasons.length,reasons,correctionNeeded:reasons.some(reason=>correctionCodes.includes(reason.code)),pricingChecked:pricing?.checked===true};
 }
 function editableCopy(recipe,options={}){
  if(!recipe||!idOf(recipe))throw new TypeError('Choose a recipe to make an editable copy.');
  const copied=clone(recipe),at=options.at||new Date().toISOString(),id=text(options.id||'user_copy_'+Date.now()+'_'+(++copySequence),120);
  if(!id||id===recipe.id||!validTime(at))throw new TypeError('The editable copy needs its own ID and a valid date.');
  copied.id=id;copied.custom=true;copied.copiedFrom={recipeId:text(recipe.copiedFrom?.recipeId)||recipe.id,name:text(recipe.copiedFrom?.name)||recipe.name,copiedAt:new Date(at).toISOString()};
  copied.changeNotice='Local editable copy. Quantities and servings are not assumed; changes are saved only to this copy.';
  copied.modifications=[text(recipe.modifications,5000),copied.changeNotice].filter(Boolean).join(' ');
  copied.cost=null;copied.correctionDraft=true;return copied;
 }
 function applyCorrections(recipe,patch={}){
  if(recipe.custom!==true)throw new TypeError('Make an editable copy before changing this recipe.');
  const next=clone(recipe),fields=['name','cat','icon','servings','ings','method','cookTime','equipment','kcal','p','c','f','nutritionStatus'];
  for(const field of fields)if(Object.hasOwn(patch,field))next[field]=clone(patch[field]);
  const quantitiesChanged=JSON.stringify(next.ings)!==JSON.stringify(recipe.ings)||next.servings!==recipe.servings;
  if(quantitiesChanged){next.nutritionStatus='estimated';next.kcal=null;next.p=null;next.c=null;next.f=null;delete next.nutrition;}
  next.needsReview=false;next.reviewReasons=[];next.correctionDraft=false;next.cost=null;
  next.changeNotice='Local edited copy. Ingredient amounts, yield or instructions may differ from the source.';
  next.modifications=[text(recipe.modifications,5000),next.changeNotice].filter(Boolean).join(' ');
  return next;
 }
 root.RecipeExperience=Object.freeze({normalizeState,feedbackValue,allowedFeedback,setFeedback,recordCook,feedbackScore,rank,readiness,editableCopy,applyCorrections});
})(globalThis);
