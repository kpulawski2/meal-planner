/* Summaries use dated records; an unlogged day is never zero intake. */
(function(root){
 'use strict';
 const valid=value=>root.FoodLogCore.validDate(value),known=value=>(typeof value==='number'||typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value))&&Number.isFinite(Number(value))&&Number(value)>=0;
 function shift(date,days){if(!valid(date))throw new TypeError('Choose a valid review date.');return new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);}
 function dayOf(value){const time=Date.parse(value);if(!Number.isFinite(time))return null;const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));const get=type=>parts.find(part=>part.type===type).value;return get('year')+'-'+get('month')+'-'+get('day');}
 function review(state,end){const start=shift(end,-6),inRange=date=>date&&date>=start&&date<=end,dates=Array.from({length:7},(_,i)=>shift(start,i)),seen=new Set(),logs=[];
  for(const raw of state.foodLog||[]){if(!raw?.id||!inRange(raw.date)||seen.has(raw.id))continue;try{const n=root.FoodLogCore.scaled(raw.food,raw.quantity);seen.add(raw.id);logs.push({...raw,nutrition:n});}catch{}}
  const days=dates.map(date=>{const rows=logs.filter(row=>row.date===date),nutrition={};for(const key of ['kcal','p','c','f'])nutrition[key]=rows.length&&rows.every(row=>known(row.nutrition[key]))?rows.reduce((sum,row)=>sum+row.nutrition[key],0):null;return {date,entries:rows.length,nutrition,estimated:rows.some(row=>row.nutrition.source!=='label')};});
  const averages={};for(const key of ['kcal','p','c','f']){const included=days.filter(day=>day.nutrition[key]!==null);averages[key]={value:included.length?included.reduce((sum,day)=>sum+day.nutrition[key],0)/included.length:null,days:included.length,missingEntries:logs.filter(row=>!known(row.nutrition[key])).length};}
  const transactions=[],txIds=new Set();for(const row of state.pantryLedger?.transactions||[]){if(!row?.id||txIds.has(row.id)||row.undoneAt||!inRange(row.type==='purchase'&&valid(row.purchaseDate)?row.purchaseDate:dayOf(row.createdAt)))continue;txIds.add(row.id);transactions.push(row);}
  const purchases=transactions.filter(row=>row.type==='purchase'),purchaseKnown=purchases.every(row=>known(row.totalCostGBP)),cookRows=transactions.filter(row=>row.type==='cook'||row.type==='leftover-use');
  const cooked=new Map();for(const row of cookRows)if(row.recipeId)cooked.set(row.recipeId,(cooked.get(row.recipeId)||0)+1);
  const latestFeedback=new Map();for(const row of state.recipeFeedback||[])if(row.recipeId&&['again','skip'].includes(row.value)&&Number.isFinite(Date.parse(row.updatedAt))&&(!latestFeedback.has(row.recipeId)||Date.parse(latestFeedback.get(row.recipeId).updatedAt)<Date.parse(row.updatedAt)))latestFeedback.set(row.recipeId,row);
  const favourites=[...latestFeedback.values()].filter(row=>row.value==='again'&&(inRange(dayOf(row.updatedAt))||(cooked.get(row.recipeId)||0)>0)).map(row=>({recipeId:row.recipeId,cooks:cooked.get(row.recipeId)||0}));
  const suggestions=[];const loggedDays=days.filter(day=>day.entries).length;if(loggedDays<7)suggestions.push({kind:'logging',text:'You logged food on '+loggedDays+' of 7 days. Log more days if you want a fuller picture; missing days are not counted as zero.'});
  if(averages.p.missingEntries)suggestions.push({kind:'labels',text:averages.p.missingEntries+' food entries have unknown protein. Review their labels to make protein summaries more complete.'});
  if(favourites.length)suggestions.push({kind:'favourites',text:favourites.length+' meals marked “Would eat again” appeared in this review. Consider saving one as a repeated meal for next week.'});
  if(purchases.length&&!purchaseKnown)suggestions.push({kind:'purchases',text:'A recorded purchase has an unknown price. Review purchase history before judging your spending.'});
  if(!purchases.length)suggestions.push({kind:'purchases',text:'No purchases were recorded for these dates. Record shopping purchases to track spending; this does not mean you spent nothing.'});
  if(cookRows.some(row=>row.type==='leftover-use'))suggestions.push({kind:'leftovers',text:'You recorded leftover portions being used. Review what is still available before fitting your next plan.'});
  return {start,end,days,entries:logs.length,loggedDays,averages,estimated:logs.some(row=>row.nutrition.source!=='label'),purchases:{count:purchases.length,known:purchaseKnown,total:purchases.length&&purchaseKnown?purchases.reduce((sum,row)=>sum+Number(row.totalCostGBP),0):null},cookedMeals:cookRows.filter(row=>row.type==='cook').length,leftoverUses:cookRows.filter(row=>row.type==='leftover-use').length,favourites,suggestions};
 }
 root.WeeklyCheckinCore=Object.freeze({shift,review,dayOf});
})(globalThis);
