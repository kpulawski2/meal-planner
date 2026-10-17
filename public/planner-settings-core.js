/* Project saved meals into the selected meal roles without moving a lunch lock
   onto dinner when breakfast is removed. Stock and cooking history stay intact. */
(function(root){
 'use strict';
 const category=recipe=>recipe?.cat==='Fruit'?'Snack':recipe?.cat;
 function signature(profile){return JSON.stringify(['days','meals','budget','people','calories','protein','nutritionTargets','diet','equipment','dislikes','likes','custom','cookTime','varietyMode','tailoredMeals','scheduledMeals','repeatMeals','supermarket','goal'].map(key=>profile?.[key]));}
 function project(state,recipes,profile,life={}){
  const slots=root.MealBudgetCore.mealSlots(profile.meals),names=root.MealBudgetCore.dayNames(Number(profile.days)||7),byId=new Map(recipes.map(r=>[r.id,r]));
  const week=[],locked={},mealServings={},cookedMeals={},moves={},conflicts=[];
  for(const day of state.week||[]){
   const next={day:day.day,meals:slots.map(()=> '')},used=new Set();
   for(const [oldIndex,id] of (day.meals||[]).entries()){
    const before=day.day+'::'+oldIndex,slot=slots.indexOf(category(byId.get(id))),cooked=life.cookedMeals?.[before];
    if(!names.includes(day.day)||slot<0||used.has(slot)){
     if(cooked)conflicts.push(day.day+' '+(category(byId.get(id))||'meal')+' is already cooked. Start a new week before removing that meal or day.');
     continue;
    }
    used.add(slot);next.meals[slot]=id;const after=day.day+'::'+slot;moves[before]=after;
    if(life.locked?.[before])locked[after]=true;
    if(state.mealServings?.[before]!=null)mealServings[after]=state.mealServings[before];
    if(cooked)cookedMeals[after]=cooked;
   }
   if(names.includes(day.day))week.push(next);
  }
  return {week,locked,mealServings,cookedMeals,moves,conflicts};
 }
 function applyMoves(state,moves){
  const ledger=state.pantryLedger;if(!ledger?.planId)return;
  const prefix=ledger.planId+'::',remap=key=>key?.startsWith(prefix)?prefix+(moves[key.slice(prefix.length)]||key.slice(prefix.length)):key;
  ledger.cooked=Object.fromEntries(Object.entries(ledger.cooked||{}).map(([key,value])=>[remap(key),value]));
  for(const transaction of ledger.transactions||[]){if(transaction.slotKey)transaction.slotKey=remap(transaction.slotKey);if(transaction.cookedChange)transaction.cookedChange.key=remap(transaction.cookedChange.key);}
 }
 root.PlannerSettingsCore={project,applyMoves,signature};
})(globalThis);
