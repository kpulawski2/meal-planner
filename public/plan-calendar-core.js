/* Calendar labels do not rename planner/stock-ledger meal keys. */
(function(root){
 'use strict';
 const valid=value=>root.FoodLogCore.validDate(value),shift=(date,n)=>root.FoodLogCore.shiftDate(date,n),today=(now=new Date())=>root.FoodLogCore.localDate(now);
 function defaultStart(state,now=today()){if(!state.week?.length)return now;if(valid(state.profile?.startDate))return state.profile.startDate;const weekday=new Date(now+'T12:00:00Z').getUTCDay();return shift(now,-((weekday+6)%7));}
 function dateFor(state,day){const index=typeof day==='number'?day:(state.week||[]).findIndex(row=>row.day===day);return valid(state.profile?.startDate)&&index>=0&&index<(state.week||[]).length?shift(state.profile.startDate,index):null;}
 function label(state,day){const date=dateFor(state,day);return date?((date===today()?'Today · ':date===shift(today(),1)?'Tomorrow · ':'')+new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'))):String(typeof day==='number'?state.week?.[day]?.day||'':day);}
 function selected(state,preferred,selectedOn,now=today()){
  const week=state.week||[];if(!week.length)return null;if(!valid(state.profile?.startDate))return null;
  if(selectedOn===now&&week.some(row=>row.day===preferred))return week.find(row=>row.day===preferred);
  const index=Math.round((Date.parse(now+'T12:00:00Z')-Date.parse(state.profile.startDate+'T12:00:00Z'))/86400000);return week[Math.max(0,Math.min(week.length-1,index))];
 }
 function assertDates(state,profile,recipes=[]){
  if(!valid(profile.startDate))throw new Error('Choose a valid plan start date.');
  if(!state.week?.length||profile.startDate===defaultStart(state))return;
  const cooked=(state.week||[]).some(day=>day.meals.some((_,i)=>(root.PantryCore?.cookedPortions(state,day.day,i,recipes)||0)>0));
  if(cooked)throw new Error('This week already has cooked meals. Start a new week before changing its calendar dates; your pantry and history will carry over.');
 }
 root.PlanCalendarCore=Object.freeze({valid,shift,today,defaultStart,dateFor,label,selected,assertDates});
})(globalThis);
