(function(root){
 'use strict';
 const Core=()=>root.WeeklyChoiceCore,Prefs=()=>root.MealPreferencesCore;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let api,value,step=0,baseline='',active=false,busy=false,controller=null,session=0,attemptedDate='';
 const snapshot=()=>JSON.stringify([api.state().profile,api.state().weeklyRoutine,api.state().week]);
 const options=(rows,current)=>rows.map(([id,label])=>'<option value="'+esc(id)+'" '+(String(id)===String(current)?'selected':'')+'>'+esc(label)+'</option>').join('');
 function open(){
  api.close();api.captureDraft();const state=api.state();value=Core().draft(state.profile,state.weeklyRoutine);baseline=snapshot();step=0;active=true;busy=false;session++;draw();
 }
 function capture(){
  if(!active)return;
  if(step===0)for(const [key,id] of [['budget','choiceBudget'],['people','choicePeople'],['days','choiceDays'],['meals','choiceMeals']])value[key]=document.getElementById(id)?.value??value[key];
  if(step===1)for(const cat of Core().slots(value.meals)){const style=document.getElementById('choiceStyle'+cat),strength=document.getElementById('choiceStrength'+cat);if(style)value.choices[cat]={style:style.value,strength:strength?.value||value.choices[cat].strength};}
  if(step===2)value.prepDay=document.getElementById('choicePrepDay')?.value||value.prepDay;
 }
 function error(message){const node=document.getElementById('weeklyChoiceError');if(node){node.textContent=message;node.focus();}}
 function totals(){const amount=Number(value.budget)*Number(value.days)/7;return Number.isFinite(amount)?'£'+amount.toFixed(2)+' for '+value.days+' days · '+value.people+' '+(Number(value.people)===1?'person':'people'):'';}
 function budget(){return '<h3>What are we working with?</h3><p class="sub">Your budget is for the whole household. Daily nutrition targets stay as you set them.</p><div class="field"><label for="choiceBudget">Weekly food budget (£)</label><input id="choiceBudget" type="number" inputmode="decimal" min="0" max="10000" step="0.01" value="'+esc(value.budget)+'" oninput="WeeklyChoiceUI.budgetChanged()"></div><div class="grid"><div class="field"><label for="choicePeople">People</label><input id="choicePeople" type="number" inputmode="numeric" min="1" max="50" step="1" value="'+esc(value.people)+'" oninput="WeeklyChoiceUI.budgetChanged()"></div><div class="field"><label for="choiceDays">Plan length</label><select id="choiceDays" onchange="WeeklyChoiceUI.budgetChanged()">'+options(Array.from({length:14},(_,i)=>[i+1,(i+1)+' days']),value.days)+'</select></div></div><div class="field"><label for="choiceMeals">Meals each day</label><select id="choiceMeals">'+options([[2,'2 · lunch and dinner'],[3,'3 · breakfast, lunch and dinner'],[4,'4 · breakfast, lunch, dinner and snack']],value.meals)+'</select></div><p id="choiceBudgetTotal" class="choice-summary">'+esc(totals())+'</p><p class="sub">Recorded purchases count towards this budget. Pantry stock reduces what you still need to buy.</p>';}
 function tiles(rows,current,handler){return '<div class="choice-tiles">'+rows.map(row=>'<button type="button" aria-pressed="'+(row.id===current)+'" onclick="WeeklyChoiceUI.'+handler+'(\''+row.id+'\')"><b>'+esc(row.label)+'</b><span>'+esc(row.description)+'</span></button>').join('')+'</div>';}
 function meals(){
  const profile=api.state().profile,neutral={...profile,varietyMode:'Balanced',tailoredMeals:{},scheduledMeals:[]};
  const ready=api.recipes().filter(r=>api.allowed(r,neutral));
  return '<h3>What sounds good this week?</h3><p class="sub">Choose your focus, then meal styles if you have something in mind.</p><div role="group" aria-label="This week’s food focus">'+tiles(Prefs().focuses,value.mealFocus,'focus')+'</div><p class="sub">Healthy focused means ingredients such as vegetables, beans and wholegrains. Every focus still uses your existing nutrition targets.</p>'+Core().slots(value.meals).map(cat=>{
   const rule=value.choices[cat],styles=Prefs().styles.filter(s=>s.id===rule.style||ready.some(r=>(r.cat===cat||cat==='Snack'&&r.cat==='Fruit')&&Prefs().matches(r,s.id)));
   const matches=ready.filter(r=>(r.cat===cat||cat==='Snack'&&r.cat==='Fruit')&&Prefs().matches(r,rule.style));
   const kept=Core().hasRule(profile,cat),specific=profile.varietyMode==='Repeat favourites'?api.recipes().find(r=>r.id===profile.repeatMeals?.[cat])?.name:profile.tailoredMeals?.[cat]?.query;
   return '<div class="choice-meal"><div class="field"><label for="choiceStyle'+cat+'">'+cat+'</label><select id="choiceStyle'+cat+'" onchange="WeeklyChoiceUI.style(\''+cat+'\')">'+options([...(kept?[['keep','Keep my specific meal choice']]:[]),['','Choose a mix for me'],...styles.map(s=>[s.id,s.label])],rule.style)+'</select></div>'+(rule.style==='keep'?'<p class="sub">Keeping '+esc(specific||'your daily choice')+'.</p>':rule.style?'<div class="field"><label for="choiceStrength'+cat+'">Include this style</label><select id="choiceStrength'+cat+'">'+options([['mostly','Mostly this style'],['prefer','Mix with other meals']],rule.strength)+'</select></div><p class="sub">'+matches.length+' ready matches'+(matches.length?': '+esc(matches.slice(0,2).map(r=>r.name).join(' · ')):'. Other suitable meals can fill the gaps.')+'</p>':'')+'</div>';
  }).join('')+'<p class="sub">A new style replaces only that meal type’s daily choice. Kept and cooked meals stay protected.</p>';
 }
 function cookingStep(){const p=api.state().profile,focus=Prefs().focuses.find(row=>row.id===value.mealFocus);return '<h3>How do you want to cook?</h3><div role="group" aria-label="Cooking approach">'+tiles([{id:'batch',label:'Batch cook',description:'Prefer recipes that make several portions together.'},{id:'fresh',label:'Individual cooks',description:'Prefer one-meal recipes over fixed batch dishes.'},{id:'mixed',label:'A mix of both',description:'Some meal prep, some meals cooked fresh.'}],value.cookingStyle,'cooking')+'</div>'+(value.cookingStyle!=='fresh'?'<div class="field"><label for="choicePrepDay">My main prep day</label><select id="choicePrepDay">'+options(root.WeeklyRoutineCore.days.map(day=>[day,day]),value.prepDay)+'</select></div>':'')+'<section class="choice-review"><h3>Your choices</h3><p><b>'+esc(totals())+'</b></p><p>'+esc(value.meals+' meals a day · '+focus.label+' · '+(p.supermarket||'Asda'))+'</p><p class="sub">'+esc(root.MacroGoalsCore.summary(p).join(' · '))+'</p><p class="sub">Your saved plan changes only after the budget, portions and daily targets pass. Other recipes may fill gaps; specific meals you kept still apply.</p></section>';}
 function draw(){
  if(!active)return;api.openSheet('<section class="weekly-choice-sheet"><span class="eyebrow">YOUR WEEK, YOUR CHOICES</span><h2>Plan this week</h2><ol class="choice-progress" aria-label="Weekly setup progress">'+['Budget','Meals','Cooking'].map((label,i)=>'<li '+(i===step?'aria-current="step"':'')+'><span>'+(i+1)+'</span>'+label+'</li>').join('')+'</ol><form onsubmit="return false">'+[budget,meals,cookingStep][step]()+'<p id="weeklyChoiceError" class="notice" tabindex="-1" role="alert"></p><p id="weeklyChoiceProgress" role="status" aria-live="polite"></p><div class="actions">'+(step?'<button type="button" class="btn secondary" onclick="WeeklyChoiceUI.back()">Back</button>':'')+'<button type="button" id="weeklyChoiceNext" class="btn" onclick="WeeklyChoiceUI.'+(step===2?'build()':'next()')+'">'+(step===2?'Build my plan':'Continue')+'</button><button type="button" class="text-button" onclick="WeeklyChoiceUI.dismiss()">Not now</button></div></form></section>');
 }
 function budgetChanged(){capture();const node=document.getElementById('choiceBudgetTotal');if(node)node.textContent=totals();}
 function next(){if(busy)return;try{capture();Core().candidate(value,api.state().profile);step=Math.min(2,step+1);draw();}catch(e){error(e.message);}}
 function back(){if(busy)return;capture();step=Math.max(0,step-1);draw();}
 function focus(id){if(busy)return;capture();value.mealFocus=Prefs().focus(id,true);draw();}
 function style(){if(busy)return;capture();draw();}
 function cooking(id){if(busy)return;capture();value.cookingStyle=id;draw();}
 function busyUI(flag){document.querySelectorAll('.weekly-choice-sheet form input,.weekly-choice-sheet form select,.weekly-choice-sheet form button').forEach(node=>{node.disabled=flag;});}
 async function build(){
  if(busy)return;let candidate,routine;try{capture();if(snapshot()!==baseline)throw new Error('Your saved settings or meals changed. Close and reopen weekly setup to use the latest details.');candidate=Core().candidate(value,api.state().profile);routine=Core().routine(value,api.state().weeklyRoutine);}catch(e){error(e.message);return;}
  const current=++session,request=new AbortController();controller=request;busy=true;busyUI(true);const progress=text=>{const node=document.getElementById('weeklyChoiceProgress');if(node)node.textContent=text;};progress('Checking your choices, daily targets and supermarket packs…');
  let result;try{result=await api.generate(candidate,{weeklyRoutine:routine,signal:request.signal,guard:()=>active&&current===session&&snapshot()===baseline,onProgress:progress});}catch(e){result={status:'unavailable',message:e.message};}
  if(!active||current!==session)return;controller=null;busy=false;busyUI(false);progress('');
  if(result?.status!=='feasible'){error(result?.message||'The plan could not be checked. Your previous meals and settings are unchanged.');return;}
  const total=Number(result.result.basket.totalCostGBP)+Number(api.spent?.()||0);api.openSheet('<section class="weekly-choice-sheet"><span class="eyebrow">CHECKED AND SAVED</span><h2>Your week is ready</h2><p>Your '+candidate.days+'-day plan has '+candidate.meals+' meals a day, using your '+esc(Prefs().focuses.find(row=>row.id===candidate.mealFocus).label.toLowerCase())+' choices.</p><p class="choice-summary">£'+total.toFixed(2)+' / £'+(candidate.budget*candidate.days/7).toFixed(2)+' household budget</p><p class="sub">Meals, portions, daily targets and supermarket packs passed the planner’s checks.</p><div class="actions"><button class="btn" onclick="WeeklyChoiceUI.show(\'week\')">View my plan</button><button class="btn secondary" onclick="WeeklyChoiceUI.show(\'shop\')">Shopping list</button></div></section>');
 }
 function cancel(){controller?.abort();controller=null;busy=false;active=false;session++;}
 function dismiss(){api.close();}
 function show(tab){api.close();api.showTab(tab);}
 function maybePrompt(){
  if(!api||active||!api.canPrompt())return;const s=root.WeeklyRoutineCore.status(api.state().weeklyRoutine);if(!s.promptDue||attemptedDate===s.today)return;
  attemptedDate=s.today;const next=structuredClone(api.state());next.weeklyRoutine={...s.routine,promptedDate:s.today};try{api.commit(next);api.renderAll();open();}catch{ /* A storage failure must not repeatedly interrupt someone. */ }
 }
 root.WeeklyChoiceUI={configure(value){api=value;root.addEventListener?.('focus',maybePrompt);document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybePrompt();});root.setInterval(maybePrompt,60000);},open,capture,next,back,focus,style,cooking,budgetChanged,build,cancel,dismiss,show,maybePrompt};
})(globalThis);
