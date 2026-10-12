/* Presentation preferences never change a plan, stock, purchases or food log. */
(function(root){
 'use strict';
 function preferences(value={}){return {theme:['system','light','dark'].includes(value.theme)?value.theme:'system',homeDay:typeof value.homeDay==='string'?value.homeDay.slice(0,100):'',planDay:typeof value.planDay==='string'?value.planDay.slice(0,100):'',planView:value.planView==='all'?'all':'focus',recipeSort:['recommended','protein','calories','time','name'].includes(value.recipeSort)?value.recipeSort:'recommended'};}
 function selectedDay(week,preferred,weekday){return week.find(day=>day.day===preferred)||week.find(day=>day.day===weekday)||week[0]||null;}
 function format(value,known=true){return known&&value!=null&&Number.isFinite(Number(value))?Math.round(Number(value)).toLocaleString('en-GB'):'—';}
 root.AppExperienceCore=Object.freeze({preferences,selectedDay,format});
})(globalThis);
