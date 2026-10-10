/* Browser/worker rules for a large recipe library and optional appliances. */
(function(root){
 'use strict';
 const category=r=>r.cat==='Fruit'||r.cat==='Snacks'?'Snack':r.cat;
 function equipmentAllowed(recipe,profile={}){
  const available=new Set((Array.isArray(profile.equipment)?profile.equipment:[]).map(v=>String(v).toLowerCase()));
  return (Array.isArray(recipe.equipment)?recipe.equipment:[]).every(v=>available.has(String(v).toLowerCase()));
 }
 function planReady(recipe){
  return recipe.needsReview!==true&&Number(recipe.servings)>0&&recipe.nutrition?.complete===true&&Number(recipe.nutrition.kcal)>0&&Array.isArray(recipe.ings)&&recipe.ings.length>0&&recipe.ings.length<=40&&recipe.ings.every(row=>row[0]&&Number(row[1])>0);
 }
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 // Bound calculation work, not discovery or browsing. Round-robin category,
 // source and protein groups prevents appended collections being cut off.
 function selectPlannerRecipes(rows,state={},limit=250){
  const max=Math.max(1,Math.min(250,Number(limit)||250)),profile=state.profile||{};
  const allowed=rows.filter(r=>r&&r.id&&equipmentAllowed(r,profile));
  const byId=new Map(allowed.map(r=>[r.id,r])),selected=new Map();
  const keep=id=>{if(selected.size<max&&byId.has(id))selected.set(id,byId.get(id));};
  for(const day of state.week||[])for(const id of day.meals||[])keep(id);
  for(const id of state.favorites||[])keep(id);
  const ready=allowed.filter(planReady);
  if(ready.length+selected.size<=max){for(const row of ready)keep(row.id);return [...selected.values()];}
  const week=Math.floor(Date.now()/604800000),seed=JSON.stringify([week,profile.diet,profile.goal,profile.varietyMode,profile.dislikes,profile.likes]);
  const groups=new Map();
  for(const row of ready){
   const source=/^(web-|world-)/.test(row.id)?'web':row.id.startsWith('creami-')?'creami':'everyday';
   const family=root.MealBudgetCore?.proteinFamily(row)||row.proteinFamily||'other';
   const key=[category(row),source,family].join('::');
   if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);
  }
  for(const group of groups.values())group.sort((a,b)=>hash(seed+a.id)-hash(seed+b.id)||a.id.localeCompare(b.id));
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
