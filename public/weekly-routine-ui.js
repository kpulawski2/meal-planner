(function(root){
 'use strict';
 const Core=()=>root.WeeklyRoutineCore,Prefs=()=>root.MealPreferencesCore;
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 let api,openedProfile='';
 function routine(){return Core().normalize(api.state().weeklyRoutine);}
 function summary(){const r=routine();return r.enabled?'Shop '+r.shopDay+' · '+(r.cookingStyle==='fresh'?'cook fresh':(r.cookingStyle==='batch'?'batch cook ':'prep & fresh meals ')+r.prepDay):'Choose shopping and cooking days';}
 function homePanel(){
  if(!api)return '';const r=routine(),s=Core().status(r),choices=Prefs().describe(api.state().profile),due=s.reviewDue?'Choose your meals before shopping':s.prepDue?'Your prep day is here':'Your weekly routine';
  return '<section class="card weekly-routine-card" aria-label="Weekly shopping and cooking routine"><div class="section-heading"><div><h2>'+esc(r.enabled?due:'Make the week work for you')+'</h2><p class="sub">'+esc(summary())+'</p></div></div>'+(choices.length?'<p class="sub">'+choices.map(row=>esc(row.category+': '+(row.strength==='mostly'?'mostly ':'favour ')+row.label.toLowerCase())).join(' · ')+'</p>':'')+(r.enabled&&s.reviewDue?'<p>Choose the meals you want, then check your plan and shopping list.</p>':'')+'<div class="actions"><button class="btn '+(s.reviewDue?'':'secondary small')+'" onclick="WeeklyRoutineUI.open()">'+(r.enabled?'Choose meals & routine':'Set up my week')+'</button>'+(s.prepDue&&api.state().week.length?'<button class="btn secondary small" onclick="WeeklyRoutineUI.prep()">Open prep centre</button>':'')+'</div></section>';
 }
 function options(values,current){return values.map(([value,label])=>'<option value="'+esc(value)+'" '+(current===value?'selected':'')+'>'+esc(label)+'</option>').join('');}
 function hasRule(p,cat){return p.varietyMode==='Tailored'&&p.tailoredMeals?.[cat]||p.varietyMode==='Repeat favourites'&&p.repeatMeals?.[cat];}
 function open(draft=null){
  api.captureDraft();const state=api.state(),p=state.profile,r=Core().normalize(draft?.routine||state.weeklyRoutine),preferences=Prefs().normalize(draft?.mealStyles||p.mealStyles);
  if(!state.weeklyRoutine?.timeZone){try{r.timeZone=Core().zone(Intl.DateTimeFormat().resolvedOptions().timeZone);}catch{}}
  openedProfile=JSON.stringify(p);
  const slots=root.MealBudgetCore.mealSlots(p.meals),mealFields=slots.map(cat=>{
   const rule=preferences[cat],selected=draft?.mealCategories?.includes(cat)?rule?.style||'':hasRule(p,cat)?'keep':rule?.style||'';
   const choices=Prefs().styles.filter(style=>api.recipes().some(recipe=>(recipe.cat===cat||cat==='Snack'&&recipe.cat==='Fruit')&&Prefs().matches(recipe,style.id)));
   const values=[...(hasRule(p,cat)?[['keep','Keep my specific meal choice']]:[]),['','Planner chooses'],...choices.map(style=>[style.id,style.label])];
   return '<div class="weekly-meal-choice"><div class="field"><label for="weeklyStyle'+cat+'">'+cat+'</label><select id="weeklyStyle'+cat+'" onchange="WeeklyRoutineUI.styleChanged(\''+cat+'\')">'+options(values,selected)+'</select></div><div class="field" id="weeklyFrequency'+cat+'"><label for="weeklyStrength'+cat+'">How often?</label><select id="weeklyStrength'+cat+'">'+options([['mostly','Mostly this style'],['prefer','Mix with other meals']],rule?.strength||'mostly')+'</select></div></div>';
  }).join('');
  const calendarChanged=r.calendarRevision&&r.calendarRevision!==Core().revision(r,p);
  api.openSheet('<section class="weekly-routine-sheet"><h2>Your week, your way</h2><p class="sub">Choose your routine and the meals you fancy. Your budget, daily targets, food exclusions and equipment still apply.</p><form onsubmit="return false"><h3>1. Shopping & cooking</h3><label class="tailored-check"><input id="weeklyEnabled" type="checkbox" '+(r.enabled?'checked':'')+'> Show my weekly routine</label><div class="grid"><div class="field"><label for="weeklyShopDay">I shop on</label><select id="weeklyShopDay">'+options(Core().days.map(day=>[day,day]),r.shopDay)+'</select></div><div class="field"><label for="weeklyShopTime">Time to choose meals</label><input id="weeklyShopTime" type="time" value="'+r.shopTime+'"></div></div><div class="field"><label for="weeklyCookingStyle">How I cook</label><select id="weeklyCookingStyle" onchange="WeeklyRoutineUI.cookingChanged()">'+options([['mixed','A mix of prep and fresh cooking'],['batch','Batch cook for the week'],['fresh','Cook meals fresh']],draft?r.cookingStyle:p.cookingStyle||r.cookingStyle)+'</select></div><div id="weeklyPrepFields" class="grid"><div class="field"><label for="weeklyPrepDay">Prep day</label><select id="weeklyPrepDay">'+options(Core().days.map(day=>[day,day]),r.prepDay)+'</select></div><div class="field"><label for="weeklyPrepTime">Prep reminder time</label><input id="weeklyPrepTime" type="time" value="'+r.prepTime+'"></div></div><div class="field"><label for="weeklyTimeZone">Time zone</label><input id="weeklyTimeZone" value="'+esc(r.timeZone)+'" list="weeklyZones"><datalist id="weeklyZones"><option>Europe/London</option><option>Europe/Dublin</option><option>Europe/Warsaw</option><option>Europe/Bucharest</option><option>America/New_York</option><option>America/Los_Angeles</option><option>Australia/Sydney</option></datalist></div><h3>2. Meals I fancy</h3><p class="sub">“Mostly” strongly favours your choice. Other recipes can fill gaps when the budget, nutrition or variety needs them. A new style replaces that meal type’s old daily choice; other repeats and kept meals stay protected.</p>'+mealFields+'<p id="weeklyRoutineError" class="notice" role="status" tabindex="-1"></p><div class="actions"><button type="button" class="btn" onclick="WeeklyRoutineUI.save(true)">Save choices & fit my plan</button><button type="button" class="btn secondary" onclick="WeeklyRoutineUI.save(false)">Save routine only</button></div></form><h3>3. Phone reminders</h3><p class="sub">Calendar reminders can alert you while Meal Planner is closed. Save your routine, then add the events to your phone’s calendar and check their alerts. Downloading the file alone does not enable notifications.</p>'+(calendarChanged?'<p class="sub">Your schedule changed. Remove the old calendar reminders before adding replacements.</p>':'')+'<div class="actions"><button type="button" class="btn secondary" onclick="WeeklyRoutineUI.calendar()">Add weekly calendar reminders</button></div><p class="sub">Repeats weekly for one year. Your phone calendar controls alerts. On iPhone, open the downloaded calendar file and add its events. Google Calendar supports importing the file from a computer. Changing or disabling this routine does not edit events already added to your calendar.</p></section>');
  cookingChanged();slots.forEach(styleChanged);
 }
 function styleChanged(cat){const node=document.getElementById('weeklyFrequency'+cat),value=document.getElementById('weeklyStyle'+cat)?.value;if(node)node.hidden=!value||value==='keep';}
 function cookingChanged(){const node=document.getElementById('weeklyPrepFields');if(node)node.hidden=document.getElementById('weeklyCookingStyle').value==='fresh';}
 function read(){
  if(openedProfile!==JSON.stringify(api.state().profile))throw new Error('Your meal settings changed. Reopen the weekly routine to use the latest settings.');
  const state=api.state(),previous=Core().normalize(state.weeklyRoutine),raw={...previous,enabled:document.getElementById('weeklyEnabled').checked,shopDay:document.getElementById('weeklyShopDay').value,shopTime:document.getElementById('weeklyShopTime').value,prepDay:document.getElementById('weeklyPrepDay').value,prepTime:document.getElementById('weeklyPrepTime').value,cookingStyle:document.getElementById('weeklyCookingStyle').value,timeZone:document.getElementById('weeklyTimeZone').value};
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.shopTime)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.prepTime))throw new Error('Choose a valid reminder time.');
  try{new Intl.DateTimeFormat('en-GB',{timeZone:raw.timeZone}).format();}catch{throw new Error('Choose a recognised time zone, such as Europe/London.');}
  const preferences={...Prefs().normalize(state.profile.mealStyles)},overrides=[];
  for(const cat of root.MealBudgetCore.mealSlots(state.profile.meals)){const style=document.getElementById('weeklyStyle'+cat).value;if(style==='keep')continue;overrides.push(cat);if(style)preferences[cat]={style,strength:document.getElementById('weeklyStrength'+cat).value};else delete preferences[cat];}
  const next=structuredClone(state);next.profile=Prefs().apply(next.profile,preferences,raw.cookingStyle,overrides);next.weeklyRoutine=Core().normalize({...raw,id:previous.id||identifier(),reviewedDate:Core().date(new Date(),raw.timeZone)});
  if(raw.cookingStyle!=='fresh')next.prepPlan={...next.prepPlan,day:raw.prepDay};
  if(overrides.length&&next.kitchenConversation)next.kitchenConversation.planDraft=null;
  return next;
 }
 function fail(error){const node=document.getElementById('weeklyRoutineError');if(node){node.textContent=error.message;node.focus();}else api.toast(error.message);}
 function commit(next){try{api.commit(next);}catch(error){throw new Error(/quota|storage/i.test(error.message)||error.name==='QuotaExceededError'?'Your device could not save the routine. Nothing changed. Free some storage or export a backup, then try again.':'The routine could not be saved. Nothing changed; try again.');}}
 function identifier(){return root.crypto?.randomUUID?.()||'routine-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);}
 function applyInterpretation(proposal){
  const next=structuredClone(api.state()),r=Core().normalize(proposal.routine);
  next.profile=Prefs().apply(next.profile,proposal.mealStyles,r.cookingStyle,proposal.mealCategories||[]);
  if(r.cookingStyle!=='fresh')next.prepPlan={...next.prepPlan,day:r.prepDay};
  next.weeklyRoutine={...r,id:r.id||identifier()};if(next.kitchenConversation)next.kitchenConversation.planDraft=null;
  commit(next);api.renderAll();return {profile:next.profile,text:(r.enabled?'Shopping: '+r.shopDay+' at '+r.shopTime+'. '+(r.cookingStyle==='fresh'?'Cook meals fresh.':'Prep: '+r.prepDay+' at '+r.prepTime+'. '):'')+Prefs().describe(next.profile).map(row=>row.category+': '+(row.strength==='mostly'?'mostly ':'favour ')+row.label.toLowerCase()).join('. ')};
 }
 async function save(fit=false){try{const next=read();commit(next);api.close();api.renderAll();if(fit){api.showTab('week');await api.generate(next.profile);}else api.toast('Weekly routine and meal choices saved');}catch(error){fail(error);}}
 function calendar(){try{
  const next=read();if(!next.weeklyRoutine.enabled)throw new Error('Turn on your weekly routine before adding calendar reminders.');
  const text=Core().calendar(next.weeklyRoutine,next.profile,new Date(),root.location.origin+'/');next.weeklyRoutine.calendarRevision=Core().revision(next.weeklyRoutine,next.profile);
  commit(next);openedProfile=JSON.stringify(next.profile);api.download('meal-planner-weekly-reminders.ics',text,'text/calendar;charset=utf-8');api.renderAll();api.toast('Calendar file downloaded. Add its events and check alerts in your calendar.');
 }catch(error){fail(error);}}
 function prep(){api.close();api.showTab('week');const node=document.querySelector('[data-ui-section="plan-tools"]');if(node){node.open=true;root.AppExperienceUI?.rememberSection(node);node.scrollIntoView?.({block:'start',behavior:'smooth'});}}
 function handleHash(){if(root.location.hash==='#weekly-routine'){if(!api)return;open();}}
 root.WeeklyRoutineUI={configure(value){api=value;root.addEventListener?.('hashchange',handleHash);},open,homePanel,summary,save,calendar,cookingChanged,styleChanged,prep,handleHash,applyInterpretation};
})(globalThis);
