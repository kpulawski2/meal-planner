/* Plan-specific fields travel together; food, stock and transactions stay shared. */
(function(root){
 'use strict';
 const clone=v=>structuredClone(v),fields=['profile','planProfile','week','mealServings','locked','shopping','prepPlan','planSource','planCost','planBudgetResult','weekDraft','mealExtraCaps','shoppingTripActive','shoppingStore'];
 function snapshot(state){const result={};for(const key of fields)if(state[key]!==undefined)result[key]=clone(state[key]);result.planId=state.pantryLedger?.planId;result.cooked=clone(state.pantryLedger?.cooked||{});return result;}
 function install(state,plan){for(const key of fields){delete state[key];if(plan[key]!==undefined)state[key]=clone(plan[key]);}root.PantryCore.initialise(state);state.pantryLedger.planId=plan.planId;state.pantryLedger.cooked=clone(plan.cooked||{});delete state.interfacePreferences?.dailyDate;delete state.interfacePreferences?.selectedOnDate;}
 function mode(state){return state.planWorkspace?.view==='next'?'next':'current';}
 function plans(state){const active=snapshot(state),other=state.planWorkspace?.other;return mode(state)==='next'?{current:other,next:active}:{current:active,next:other};}
 function select(state,target){if(!['current','next'].includes(target))throw new Error('Choose this week or next week.');if(mode(state)===target)return false;const other=state.planWorkspace?.other;if(!other)throw new Error('Plan next week first.');const previous=snapshot(state),targetPlan=clone(other);for(const key of ['diet','dislikes','equipment'])if(previous.profile?.[key]!==undefined)targetPlan.profile[key]=clone(previous.profile[key]);install(state,targetPlan);state.planWorkspace={version:1,view:target,other:previous};return true;}
 function create(state,startDate,{repeat=false}={}){
  if(!root.FoodLogCore.validDate(startDate)||startDate<=root.FoodLogCore.localDate())throw new Error('Choose a future start date for next week.');
  if(plans(state).next)throw new Error('A next-week plan is already saved. Open it to make changes.');
  root.PantryCore.initialise(state);const current=snapshot(state),next=clone(current);if(repeat&&!next.week?.length)throw new Error('Save a current week before repeating it.');root.PantryCore.resetPlan(state);next.planId=state.pantryLedger.planId;state.pantryLedger.planId=current.planId;state.pantryLedger.cooked=clone(current.cooked);
  next.profile.startDate=startDate;if(next.planProfile)next.planProfile.startDate=startDate;
  next.cooked={};next.locked={};next.shopping={};next.prepPlan={...(next.prepPlan||{}),checked:{},storage:{}};next.planCost=null;next.shoppingTripActive=false;delete next.weekDraft;delete next.planBudgetResult;
  if(!repeat){next.week=[];next.mealServings={};}else if(!next.week?.length)throw new Error('Save a current week before repeating it.');
  state.planWorkspace={version:1,view:'current',other:next};select(state,'next');return state;
 }
 function activateDue(state,now=root.FoodLogCore.localDate()){
  const p=plans(state);if(!p.next?.week?.length||!root.FoodLogCore.validDate(p.next.profile?.startDate)||p.next.profile.startDate>now)return false;
  const old=p.current;state.planHistory=state.planHistory||[];if(old?.week?.length)state.planHistory.unshift({...clone(old),archivedAt:new Date().toISOString()});state.planHistory=state.planHistory.slice(0,12);const nextPlan=clone(p.next);for(const key of ['diet','dislikes','equipment'])if(old?.profile?.[key]!==undefined)nextPlan.profile[key]=clone(old.profile[key]);install(state,nextPlan);delete state.planWorkspace;return true;
 }
 function availablePantry(state,recipes,pantry){
  if(mode(state)!=='next'||!state.planWorkspace?.other)return pantry;
  const current=clone(state);delete current.planWorkspace;install(current,state.planWorkspace.other);
  const input=root.PantryCore.shoppingInput(current,recipes),requirements=root.MealBudgetCore.buildShopping({...input,pantry:[]}),reserved={};
  for(const [key,item] of Object.entries(requirements))for(const [dim,group] of Object.entries(item.groups))reserved[key+'::'+dim]=group.need;
  return [...pantry].sort((a,b)=>String(a.expiry||'9999-12-31').localeCompare(String(b.expiry||'9999-12-31'))).map(lot=>{const meta=root.MealBudgetCore.unitMeta(lot.unit,lot.name),key=root.MealBudgetCore.canonicalIngredientName(lot.name)+'::'+meta.dim,used=Math.min(Number(lot.qty)*meta.factor,reserved[key]||0);reserved[key]=Math.max(0,(reserved[key]||0)-used);return {...lot,qty:Math.max(0,Number(lot.qty)-used/meta.factor)};}).filter(lot=>lot.qty>0&&(!lot.expiry||lot.expiry>=state.profile.startDate));
 }
 root.PlanWorkspaceCore=Object.freeze({snapshot,mode,plans,select,create,activateDue,availablePantry});
})(globalThis);
