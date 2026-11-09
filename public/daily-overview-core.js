/* A dated view of planned meals and the diary's recorded intake. */
(function(root){
 'use strict';
 const valid=value=>root.FoodLogCore.validDate(value);
 function dateForPlan(state,day){const index=(state.week||[]).findIndex(row=>row.day===day);return index<0?null:root.PlanCalendarCore.shift(root.PlanCalendarCore.defaultStart(state),index);}
 function planForDate(state,date){
  if(!valid(date)||!state.week?.length)return null;
  const start=valid(state.profile?.startDate)?state.profile.startDate:root.PlanCalendarCore.defaultStart(state);
  const index=Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000);
  return state.week[index]||null;
 }
 function selectedDate(state,now=root.FoodLogCore.localDate()){
  const p=state.interfacePreferences||{};
  if(p.selectedOnDate===now){
   if(valid(p.dailyDate))return p.dailyDate;
   const preferred=root.AppExperienceCore.preferences(p).plannedDay,date=dateForPlan(state,preferred);
   if(date)return date;
  }
  return now;
 }
 function viewPreferences(state,date,now=root.FoodLogCore.localDate()){
  if(!valid(date))throw new Error('Choose a valid date.');
  const prefs=root.AppExperienceCore.preferences(state.interfacePreferences),planned=planForDate(state,date);
  return {...prefs,dailyDate:date,selectedOnDate:now,...(planned?{plannedDay:planned.day,homeDay:planned.day,planDay:planned.day}:{})};
 }
 function label(date){return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));}
 function model(state,recipes,{date=selectedDate(state),servings=()=>1,nutrition=r=>r.nutrition,cooked=()=>0}={}){
  if(!valid(date))throw new Error('Choose a valid date.');
  const plan=planForDate(state,date),diary=root.NutritionDiaryCore.day(state,date),people=Math.max(1,Number(state.profile?.people)||1),byId=new Map(recipes.map(row=>[row.id,row]));
  const meals=(plan?.meals||[]).map((id,index)=>{
   const recipe=byId.get(id),portions=servings(plan.day,index)/people,origin=(state.pantryLedger?.planId||'current')+'::'+plan.day+'::'+index;
   const entry=diary.rows.find(row=>row.originKey===origin)||null,n=recipe?nutrition(recipe):null;
   return {id,index,day:plan.day,recipe,portions,entry,cooked:Math.max(0,Number(cooked(plan.day,index))||0),nutrition:n&&Object.fromEntries(['kcal','p','c','f'].map(key=>[key,n[key]==null?null:n[key]*portions]))};
  });
  return {date,isToday:date===root.FoodLogCore.localDate(),plan,meals,diary,goals:root.NutritionDiaryCore.goals(state)};
 }
 root.DailyOverviewCore=Object.freeze({planForDate,dateForPlan,selectedDate,viewPreferences,label,model});
})(globalThis);
