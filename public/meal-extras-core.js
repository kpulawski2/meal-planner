/* Optional extras become an immutable measured recipe, so shopping, portions,
   cooking, diary and backup continue to use the same meal quantities. */
(function(root){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const measured=n=>n?.complete===true&&['kcal','p','c','f'].every(key=>Number.isFinite(n[key])&&n[key]>=0);
 const role=recipe=>['Sauce','Side'].includes(recipe?.recipeRole)?recipe.recipeRole:null;
 const pairable=recipe=>Boolean(role(recipe))&&recipe.fixedBatch!==true;
 const number=(value,label,min,max)=>{if(value===null||value===undefined||value===''||typeof value==='boolean'||!Number.isFinite(Number(value))||Number(value)<min||Number(value)>max)throw new Error(label);return Number(value);};
 const ingredients=recipe=>Array.isArray(recipe?.ings)&&recipe.ings.length>0&&recipe.ings.every(row=>Array.isArray(row)&&typeof row[0]==='string'&&row[0].trim()&&Number.isFinite(row[1])&&row[1]>0&&['g','ml','piece','slice','tsp','tbsp','portion',''].includes(row[2]||''));
 function candidates(recipes,{nutrition,allowed=()=>true}={}){return recipes.filter(recipe=>pairable(recipe)&&ingredients(recipe)&&Number.isFinite(recipe.servings)&&recipe.servings>=1&&measured(nutrition(recipe))&&allowed(recipe)).sort((a,b)=>a.name.localeCompare(b.name));}
 const definition=recipe=>JSON.stringify([recipe.name,recipe.cat,recipe.servings,recipe.ings,recipe.method,recipe.equipment,recipe.fixedBatch,recipe.cookTime,recipe.nutritionStatus,recipe.kcal,recipe.p,recipe.c,recipe.f]);
 function baseOf(recipe){
  if(recipe?.mealExtras?.version===1&&recipe.mealExtras.base&&recipe.mealExtras.definition===definition(recipe))return clone(recipe.mealExtras.base);
  const base=clone(recipe);delete base.mealExtras;return base;
 }
 function mergeIngredients(rows){
  const merged=new Map();for(const row of rows){const key=[String(row[0]).trim().toLowerCase().replace(/\byogurt\b/g,'yoghurt'),row[2]||''].join('::');if(merged.has(key))merged.get(key)[1]+=row[1];else merged.set(key,[...row]);}
  return [...merged.values()].map(row=>[row[0],Number(row[1].toFixed(8)),row[2]]);
 }
 function componentGroups(recipe,portions=1){
  const meta=recipe?.mealExtras;if(!meta?.base||meta.definition!==definition(recipe)||!ingredients(meta.base)||!Array.isArray(meta.items)||meta.items.some(item=>!ingredients(item?.recipe)||!(Number(item.recipe.servings)>0)||!(Number(item.servings)>0)))return [];
  const yieldCount=Number(recipe.servings)||1,amount=Number(portions);if(!Number.isFinite(amount)||amount<=0)return [];
  const factor=recipe.fixedBatch?Math.ceil(amount/yieldCount):amount/yieldCount;
  return [{name:'Main · '+meta.base.name,ings:meta.base.ings.map(row=>[row[0],row[1]*factor,row[2]])},...meta.items.map(item=>({name:item.recipe.name,ings:item.recipe.ings.map(row=>[row[0],row[1]*factor*yieldCount*item.servings/item.recipe.servings,row[2]])}))];
 }
 function preview(recipe,picks=[],{recipes=[],calorieLimit=150,nutrition,steps=r=>r.method||[],allowed=()=>true,id='custom-extra-preview'}={}){
  const cap=number(calorieLimit,'Enter an extra-calorie limit from 0 to 1,000 kcal.',0,1000),base=baseOf(recipe),yieldCount=Number(base.servings??1);
  if(!ingredients(base)||!Number.isFinite(yieldCount)||yieldCount<1||yieldCount>1000||!measured(nutrition(base)))throw new Error('Review the main recipe’s measured ingredients first.');
  if(!allowed(base))throw new Error('This meal conflicts with your current food preferences or equipment.');
  if(!Array.isArray(picks)||picks.length>2)throw new Error('Choose one sauce and one side at most.');
  const byId=new Map(recipes.map(row=>[row.id,row])),roles=new Set(),items=[];
  for(const pick of picks){
   const extra=byId.get(pick?.recipeId),amount=number(pick?.servings,'Choose an extra amount from ¼ to 4 portions.',.25,4),kind=role(extra);
   if(!pairable(extra)||roles.has(kind)||!ingredients(extra)||!Number.isFinite(extra.servings)||extra.servings<1||!allowed(extra)||!measured(nutrition(extra)))throw new Error('Choose a suitable measured sauce or side. Batch bakes stay separate.');
   const method=steps(extra);if(!Array.isArray(method)||!method.length||method.some(step=>typeof step!=='string'||!step.trim()))throw new Error('This extra needs complete cooking instructions.');
   roles.add(kind);items.push({recipeId:extra.id,servings:amount,recipe:clone({...extra,method}),nutrition:nutrition(extra)});
  }
  const mainSteps=steps(base);if(!Array.isArray(mainSteps)||!mainSteps.length||mainSteps.some(step=>typeof step!=='string'||!step.trim()))throw new Error('Review the main recipe’s cooking instructions first.');
  const extraNutrition=Object.fromEntries(['kcal','p','c','f'].map(key=>[key,items.reduce((sum,item)=>sum+item.nutrition[key]*item.servings,0)]));
  const combined=clone(base);Object.assign(combined,{id,name:base.name+(items.length?' with '+items.map(item=>item.recipe.name).join(' & '):''),servings:yieldCount,custom:true,collection:'personal',kcal:null,p:null,c:null,f:null,cost:null,nutritionStatus:'estimated',testedInKitchen:false,ings:mergeIngredients([...base.ings,...items.flatMap(item=>item.recipe.ings.map(row=>[row[0],row[1]*item.servings*yieldCount/item.recipe.servings,row[2]]))]),method:items.length?['Make the main and extras using the quantities shown. Extras are for each meal portion and scale with that portion. '+(base.fixedBatch?'Preparing the full batch includes extras for every portion.':''),...mainSteps.map(step=>'Main: '+step),...items.flatMap(item=>[item.recipe.name+' — '+item.servings+' extra portion(s) per meal portion:',...item.recipe.method]),'Serve the main with the selected extras. Follow the shortest storage time among the components; rice must be cooled within one hour and refrigerated for no more than 24 hours.']:mainSteps,equipment:[...new Set([...(base.equipment||[]),...items.flatMap(item=>item.recipe.equipment||[])])],cookTime:Number(base.cookTime??base.time??0)+items.reduce((sum,item)=>sum+Number(item.recipe.cookTime??item.recipe.time??0),0),tags:[...new Set([...(base.tags||[]),'meal-extra-combination'])],copiedFrom:base.copiedFrom||{recipeId:base.id,source:base.source||'',sourceName:base.sourceName||''},dishFamily:base.dishFamily||root.MealBudgetCore?.dishFamily(base)||base.id,mealExtras:{version:1,baseRecipeId:base.id,base:clone({...base,method:mainSteps}),calorieLimit:cap,items:items.map(item=>({recipeId:item.recipeId,servings:item.servings,recipe:item.recipe}))}});
  delete combined.nutrition;delete combined.recipeRole;delete combined.servingLabel;delete combined.personalCereal;
  if(combined.ings.length>40)throw new Error('These extras make too many ingredients. Choose a simpler sauce or side.');
  combined.mealExtras.definition=definition(combined);
  const total=nutrition(combined);if(!measured(total))throw new Error('The combined meal’s nutrition is incomplete.');
  const addedKcal=Math.max(extraNutrition.kcal,total.kcal-nutrition(base).kcal,0);
  return {base,recipe:combined,items,extraNutrition:{...extraNutrition,kcal:addedKcal},nutrition:total,calorieLimit:cap,withinLimit:addedKcal<=cap+1e-7,remaining:cap-addedKcal};
 }
 function fingerprint(state,day,index,recipes=[]){
  const meal=state.week?.find(row=>row.day===day)?.meals?.[index],recipe=recipes.find(row=>row.id===meal);
  return JSON.stringify([day,index,meal,recipe,state.mealServings?.[day+'::'+index],state.mealExtraCaps?.[day+'::'+index],state.profile,state.planProfile,state.locked,state.recipeFeedback,state.pantryLedger?.cooked,state.pantryLedger?.planId,state.leftovers,state.planStartDate,recipes.filter(pairable).map(row=>[row.id,definition(row)])]);
 }
 function apply(state,{day,index,picks=[],calorieLimit=150,expectedFingerprint,id,at=new Date().toISOString()},recipes,{nutrition,steps,allowed=()=>true,cooked=()=>false}={}){
  if(!Number.isInteger(index)||index<0||index>3)throw new Error('Choose a planned meal.');
  const row=state.week?.find(item=>item.day===day),current=recipes.find(item=>item.id===row?.meals?.[index]);if(!current)throw new Error('This planned meal is no longer available.');
  if(expectedFingerprint&&expectedFingerprint!==fingerprint(state,day,index,recipes))throw new Error('Your plan or settings changed. Reopen the extras for this meal.');
  if(cooked(state,day,index,recipes))throw new Error('Cooked portions stay fixed. Undo the cooking record before changing their extras.');
  const recipeId=typeof id==='string'&&/^[a-z0-9_-]{1,120}$/i.test(id)?id:'user_extras_'+Date.parse(at)+'_'+Math.random().toString(36).slice(2,8);
  if(recipes.some(item=>item.id===recipeId))throw new Error('This recipe identifier is already in use. Reopen extras and try again.');
  const result=preview(current,picks,{recipes,calorieLimit,nutrition,steps,allowed,id:recipeId});if(!result.withinLimit)throw new Error('The selected extras exceed your calorie limit. Reduce the amount or increase the limit.');
  const next=clone(state);let savedRecipe=result.recipe;
  next.customRecipes=Array.isArray(next.customRecipes)?next.customRecipes:[];
  if(picks.length===0){
   savedRecipe=recipes.find(item=>item.id===result.base.id);
   if(!savedRecipe){savedRecipe={...result.base,id:recipeId,custom:true};next.customRecipes.push(savedRecipe);}
  }else{
   // Reuse an identical preparation across days, especially for fixed batches.
   // Calorie allowances belong to meal slots, not to a duplicate food recipe.
   const same=recipes.find(row=>row.custom&&row.mealExtras?.baseRecipeId===result.base.id&&row.mealExtras.definition===definition(row)&&definition(row)===definition(savedRecipe)&&JSON.stringify(row.mealExtras.items.map(item=>[item.recipeId,item.servings]))===JSON.stringify(savedRecipe.mealExtras.items.map(item=>[item.recipeId,item.servings])));
   if(same)savedRecipe=same;else next.customRecipes.push(savedRecipe);
  }
  next.week.find(item=>item.day===day).meals[index]=savedRecipe.id;
  next.mealExtraCaps=next.mealExtraCaps&&typeof next.mealExtraCaps==='object'&&!Array.isArray(next.mealExtraCaps)?next.mealExtraCaps:{};
  if(picks.length)next.mealExtraCaps[day+'::'+index]={recipeId:savedRecipe.id,calorieLimit:result.calorieLimit};else delete next.mealExtraCaps[day+'::'+index];
  next.planSource='manual';next.planCost=null;delete next.planBudgetResult;
  if(root.PlanHistoryCore)root.PlanHistoryCore.record(next,state,picks.length?'Before adding meal extras':'Before removing meal extras');
  return {state:next,recipe:savedRecipe,preview:result};
 }
 root.MealExtrasCore=Object.freeze({role,pairable,candidates,baseOf,preview,componentGroups,fingerprint,apply});
})(globalThis);
