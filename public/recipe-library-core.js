/* Browser/worker rules for a large recipe library and optional appliances. */
(function(root){
 'use strict';
 const category=r=>r.cat==='Fruit'||r.cat==='Snacks'?'Snack':r.cat;
 function equipmentAllowed(recipe,profile={}){
  if(root.KitchenEquipment)return root.KitchenEquipment.allowed(recipe,profile);
  const available=new Set((Array.isArray(profile.equipment)?profile.equipment:[]).map(v=>String(v).toLowerCase()));
  return (Array.isArray(recipe.equipment)?recipe.equipment:[]).every(v=>available.has(String(v).toLowerCase()));
 }
 function planReady(recipe){
  return recipe.needsReview!==true&&Number(recipe.servings)>0&&Number.isFinite(Number(recipe.servings))&&recipe.nutrition?.complete===true&&Number(recipe.nutrition.kcal)>0&&Number.isFinite(Number(recipe.nutrition.kcal))&&recipe.nutrition.p!=null&&Number.isFinite(Number(recipe.nutrition.p))&&Number(recipe.nutrition.p)>=0&&Array.isArray(recipe.ings)&&recipe.ings.length>0&&recipe.ings.length<=40&&recipe.ings.every(row=>Array.isArray(row)&&row[0]&&Number(row[1])>0&&Number.isFinite(Number(row[1])));
 }
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 // Bound calculation work, not discovery or browsing. Round-robin category,
 // source and protein groups prevents appended collections being cut off.
 function selectPlannerRecipes(rows,state={},limit=250){
  const max=Math.max(1,Math.min(250,Number(limit)||250)),profile=state.profile||{};
  const allowed=rows.filter(r=>r&&r.id&&(r.cookedOnly===true||equipmentAllowed(r,profile)&&(!root.MealIntentCore||root.MealIntentCore.allowed(r,profile))&&(!root.RecipeExperience||root.RecipeExperience.allowedFeedback(r,state))));
  const byId=new Map(allowed.map(r=>[r.id,r])),selected=new Map();
  const keep=id=>{if(selected.size<max&&byId.has(id))selected.set(id,byId.get(id));};
  if(profile.varietyMode==='Repeat favourites')for(const id of Object.values(profile.repeatMeals||{}))keep(id);
  if(profile.varietyMode==='Tailored')for(const rule of [...Object.values(profile.tailoredMeals||{}),...(profile.scheduledMeals||[])])for(const id of rule.recipeIds||[])keep(id);
  for(const day of state.week||[])for(const id of day.meals||[])keep(id);
  for(const id of state.favorites||[])keep(id);
  for(const row of root.RecipeExperience?root.RecipeExperience.rank(allowed,state):[])if(root.RecipeExperience.feedbackValue(row,state)==='again')keep(row.id);
  const ready=allowed.filter(r=>r.cookedOnly!==true&&planReady(r)&&(!root.MacroGoalsCore||root.MacroGoalsCore.complete(r.nutrition,profile)));
  if(ready.length+selected.size<=max){for(const row of ready)keep(row.id);return [...selected.values()];}
  const week=Math.floor(Date.now()/604800000),rotation=root.MealRotationCore?.scores(ready,state)||new Map(),seed=JSON.stringify([week,profile.diet,profile.goal,profile.varietyMode,profile.dislikes,profile.likes,profile.rotateMeals===false?[]:root.MealRotationCore?.recent(state).map(row=>[row.planId,row.archivedAt,row.week.flatMap(day=>day?.meals||[])])]);
  const groups=new Map();
  for(const row of ready){
   const source=['social','fakeaway'].includes(row.collection)?'social':/^(web-|world-)/.test(row.id)?'web':row.id.startsWith('creami-')?'creami':'everyday';
   const family=root.MealBudgetCore?.proteinFamily(row)||row.proteinFamily||'other';
   const key=[category(row),source,family].join('::');
   if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);
  }
  for(const group of groups.values())group.sort((a,b)=>(rotation.get(a.id)||0)-(rotation.get(b.id)||0)||(root.RecipeExperience?root.RecipeExperience.feedbackScore(b,state)-root.RecipeExperience.feedbackScore(a,state):0)||hash(seed+a.id)-hash(seed+b.id)||a.id.localeCompare(b.id));
  const ordered=[...groups].sort(([a],[b])=>a.localeCompare(b));
  let more=true;
  while(selected.size<max&&more){more=false;for(const [,group] of ordered){if(!group.length)continue;more=true;keep(group.shift().id);if(selected.size>=max)break;}}
  return [...selected.values()];
 }
 function validLibrary(data){
  return data?.schemaVersion===1&&data.status==='complete'&&Array.isArray(data.recipes)&&data.recipes.length>0&&new Set(data.recipes.map(r=>r.id)).size===data.recipes.length&&data.recipes.every(r=>r?.id?.startsWith('web-')&&typeof r.name==='string'&&Array.isArray(r.ings)&&r.ings.length>0&&Array.isArray(r.method)&&r.method.length>0&&typeof r.source==='string'&&r.source.startsWith('https://en.wikibooks.org/')&&r.license==='CC BY-SA 4.0');
 }
 root.RecipeLibraryCore=Object.freeze({equipmentAllowed,planReady,selectPlannerRecipes,validLibrary});
})(typeof globalThis!=='undefined'?globalThis:this);
