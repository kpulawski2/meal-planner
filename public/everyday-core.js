(function(root){
 'use strict';
 const clone=v=>structuredClone(v),text=(v,max=160)=>typeof v==='string'?v.trim().slice(0,max):'';
 function pins(state){const rows=[];for(const raw of Array.isArray(state.foodPins)?state.foodPins:[]){try{const food=root.FoodLogCore.definition(raw.food),quantity=Number(raw.quantity);root.FoodLogCore.scaled(food,quantity);if(!raw.id||rows.some(r=>r.id===raw.id)||rows.length>=12)continue;rows.push({id:text(raw.id,100),food,quantity,meal:['Breakfast','Lunch','Dinner','Snack'].includes(raw.meal)?raw.meal:'Snack'});}catch{}}return rows;}
 function pin(state,food,quantity,meal){const definition=root.FoodLogCore.definition(food);root.FoodLogCore.scaled(definition,quantity);const rows=pins(state),key=root.ReceiptCore.hash(JSON.stringify([definition,Number(quantity),meal])),id='pin-'+key;if(rows.some(row=>row.id===id))return id;if(rows.length>=12)throw new Error('Remove an old usual food before pinning another (12 per device).');state.foodPins=[...rows,{id,food:definition,quantity:Number(quantity),meal:['Breakfast','Lunch','Dinner','Snack'].includes(meal)?meal:'Snack'}];return id;}
 function record(state,id,date=root.FoodLogCore.localDate()){const row=pins(state).find(row=>row.id===id);if(!row)throw new Error('This pinned food is no longer available.');return root.FoodLogCore.record(state,{date,meal:row.meal,food:clone(row.food),quantity:row.quantity});}
 function nudges(state,recipes,now=new Date()){
  if(state.prepReminders?.enabled!==true)return [];
  const today=root.PlanCalendarCore.today(now),tomorrow=root.PlanCalendarCore.shift(today,1),day=state.week?.find((_,i)=>root.PlanCalendarCore.dateFor(state,i)===tomorrow);if(!day)return [];
  const rows=[],byId=new Map(recipes.map(r=>[r.id,r]));for(const id of [...new Set(day.meals)]){const recipe=byId.get(id);if(!recipe)continue;const frozen=(state.leftovers||[]).some(row=>row.recipeId===id&&/freezer/i.test(row.storage||'')&&Number(row.servings)>0&&(!row.expiry||row.expiry>=tomorrow));
   const frozenIngredients=(recipe.ings||[]).filter(row=>/frozen/i.test(row[0])).map(row=>row[0]);
   if(frozen)rows.push({id:id+'-thaw',title:'Tomorrow: '+recipe.name,detail:'Check your frozen prepared portions. Thaw in the fridge if the recipe requires it, and follow its storage and reheating instructions.'});
   else if(frozenIngredients.length)rows.push({id:id+'-frozen',title:'Check tomorrow’s frozen ingredients',detail:recipe.name+': '+frozenIngredients.join(', ')+'. Follow the pack’s thawing or cook-from-frozen instructions.'});
   else if(/overnight/i.test(recipe.name))rows.push({id:id+'-prep',title:'Prepare tomorrow’s '+recipe.name,detail:'Use the planned quantities and keep refrigerated. Follow the recipe’s storage instructions.'});
  }return rows.slice(0,3);
 }
 function calendar(state,recipes,now=new Date()){
  if(!state.prepReminders?.enabled)throw new Error('Turn on prep reminders before creating calendar alerts.');if(!root.PlanCalendarCore.valid(state.profile.startDate)||!state.week?.length)throw new Error('Save a plan with dates first.');
  const r=state.prepReminders,time=/^\d{2}:\d{2}$/.test(r.time||'')?r.time:'19:00',[hour,minute]=time.split(':').map(Number);if(hour>23||minute>59)throw new Error('Choose a valid reminder time.');
  const esc=v=>String(v).replace(/\\/g,'\\\\').replace(/[\r\n]+/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;'),stamp=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),zone=root.WeeklyRoutineCore.zone(r.timeZone),byId=new Map(recipes.map(row=>[row.id,row])),events=[];
  for(const [i,day] of state.week.entries()){const date=root.PlanCalendarCore.shift(state.profile.startDate,i-1),[year,month,dayOfMonth]=date.split('-').map(Number),when=root.WeeklyRoutineCore.wallToUTC(year,month,dayOfMonth,hour,minute,zone);if(when<now)continue;
   const names=[...new Set(day.meals)].map(id=>byId.get(id)?.name).filter(Boolean);events.push('BEGIN:VEVENT','UID:prep-'+root.ReceiptCore.hash(state.profile.startDate+'::'+day.day)+'@meal-planner','DTSTAMP:'+stamp(now),'DTSTART:'+stamp(when),'DTEND:'+stamp(new Date(when.getTime()+10*60000)),'SUMMARY:Check tomorrow’s meals','DESCRIPTION:'+esc(names.join(' · ')+'. Check any overnight preparation and frozen ingredients; use fridge thawing or cook-from-frozen instructions from the pack/recipe. Keep chilled food refrigerated.'),'BEGIN:VALARM','TRIGGER:PT0S','ACTION:DISPLAY','DESCRIPTION:Check tomorrow’s meals','END:VALARM','END:VEVENT');
  }
  if(!events.length)throw new Error('This plan has no upcoming prep reminders.');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Meal Planner//Prep reminders//EN','CALSCALE:GREGORIAN',...events,'END:VCALENDAR',''].map(line=>{let out='',size=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(size+bytes>75){out+='\r\n ';size=1;}out+=char;size+=bytes;}return out;}).join('\r\n');
 }
 root.EverydayCore=Object.freeze({pins,pin,record,nudges,calendar});
})(globalThis);
