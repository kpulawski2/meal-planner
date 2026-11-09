/* A sauce and a side, with an explicit calorie allowance per meal portion. */
(function(root){
 'use strict';
 let api={},draft=null;
 const html=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arg=value=>encodeURIComponent(String(value)).replace(/'/g,'%27');
 const round=value=>Math.round(Number(value)*10)/10;
 const options=()=>({recipes:api.recipes(),nutrition:api.nutrition,steps:api.steps,allowed:api.allowed});
 const selected=()=>['Sauce','Side'].flatMap(role=>draft[role]?.recipeId?[{recipeId:draft[role].recipeId,servings:draft[role].servings}]:[]);
 function result(){return MealExtrasCore.preview(draft.recipe,selected(),{...options(),calorieLimit:draft.cap});}
 function open(day,index,preferredId){
  const state=api.state(),recipe=api.recipes().find(row=>row.id===state.week?.find(row=>row.day===day)?.meals?.[index]);
  if(!recipe){api.toast('Choose a planned meal first.');return;}
  if(api.cooked(state,day,index,api.recipes())){api.toast('Cooked portions stay fixed. Undo the cooking record before changing extras.');return;}
  const prior=MealExtrasCore.baseOf(recipe).id===recipe.id?null:recipe.mealExtras;
  const savedCap=state.mealExtraCaps?.[day+'::'+index];
  draft={day,index,recipe,cap:savedCap?.recipeId===recipe.id?savedCap.calorieLimit:prior?.calorieLimit??150,fingerprint:MealExtrasCore.fingerprint(state,day,index,api.recipes()),Sauce:{recipeId:'',servings:1},Side:{recipeId:'',servings:1}};
  for(const item of prior?.items||[]){const role=MealExtrasCore.role(item.recipe);if(role)draft[role]={recipeId:item.recipeId,servings:item.servings};}
  if(preferredId){const extra=api.recipes().find(row=>row.id===preferredId);if(MealExtrasCore.pairable(extra))draft[MealExtrasCore.role(extra)]={recipeId:extra.id,servings:1};}
  render();
 }
 function selectionHtml(role,rows){
  const id='mealExtra'+role,value=draft[role],other=draft[role==='Sauce'?'Side':'Sauce'];
  const otherRecipe=api.recipes().find(row=>row.id===other.recipeId),used=otherRecipe?api.nutrition(otherRecipe).kcal*Number(other.servings||0):0,limit=Number(draft.cap),amount=Number(value.servings);
  const available=rows.filter(row=>MealExtrasCore.role(row)===role),visible=available.filter(row=>row.id===value.recipeId||Number.isFinite(limit)&&api.nutrition(row).kcal*amount+used<=limit+1e-7);
  return '<div class="card"><div class="grid"><div class="field"><label for="'+id+'">'+role+' (optional)</label><select id="'+id+'" onchange="MealExtrasUI.choose(\''+role+'\',this.value)"><option value="">No '+role.toLowerCase()+'</option>'+visible.map(row=>'<option value="'+html(row.id)+'" '+(value.recipeId===row.id?'selected':'')+'>'+html(row.name)+' · ~'+Math.ceil(api.nutrition(row).kcal*amount)+' kcal</option>').join('')+'</select></div><div class="field"><label for="'+id+'Amount">Extra portions</label><select id="'+id+'Amount" onchange="MealExtrasUI.amount(\''+role+'\',this.value)">'+[.25,.5,1,1.5,2,3,4].map(n=>'<option value="'+n+'" '+(amount===n?'selected':'')+'>'+n+'</option>').join('')+'</select></div></div><small class="sub">'+(value.recipeId?html(available.find(row=>row.id===value.recipeId)?.servingLabel||'One listed recipe portion')+'. ':'')+(visible.length<available.length?'Showing options that fit the remaining allowance. Choose a smaller portion or raise the limit for more.':'Amounts are for each portion of the main meal.')+'</small></div>';
 }
 function render(){
  if(!draft)return;
  const rows=MealExtrasCore.candidates(api.recipes(),options()),base=MealExtrasCore.baseOf(draft.recipe),portions=api.servings(draft.day,draft.index)/Math.max(1,Number(api.state().profile.people)||1);
  api.openSheet('<div id="mealExtras"><h2>Sauce or side</h2><p class="sub">'+html(base.name)+' · '+round(portions)+' meal portion'+(portions===1?'':'s')+' per person</p><div class="field"><label for="mealExtraCap">Maximum extra calories per meal portion</label><input id="mealExtraCap" type="number" min="0" max="1000" step="1" value="'+html(draft.cap)+'" oninput="MealExtrasUI.cap(this.value)"></div><p class="sub">Your main meal and portion count stay selected. Extras scale with those portions.</p><div id="mealExtraChoices">'+selectionHtml('Sauce',rows)+selectionHtml('Side',rows)+'</div><div id="mealExtraPreview" aria-live="polite"></div><div class="actions"><button id="mealExtraSave" class="btn" onclick="MealExtrasUI.save()">Save extras</button><button class="btn secondary" onclick="MealExtrasUI.cancel()">Cancel</button></div></div>');
  refresh();
 }
 function refreshChoices(){const node=document.getElementById('mealExtraChoices'),focused=document.activeElement?.id;if(node){const rows=MealExtrasCore.candidates(api.recipes(),options());node.innerHTML=selectionHtml('Sauce',rows)+selectionHtml('Side',rows);if(focused&&focused!=='mealExtraCap')document.getElementById(focused)?.focus({preventScroll:true});}refresh();}
 function refresh(){
  if(!draft)return;const node=document.getElementById('mealExtraPreview'),button=document.getElementById('mealExtraSave');if(!node||!button)return;
  try{
   const next=result(),portions=api.servings(draft.day,draft.index)/Math.max(1,Number(api.state().profile.people)||1),before=api.nutrition(draft.recipe),day=api.totals(draft.day),dayKcal=day.kcal+(next.nutrition.kcal-before.kcal)*portions,target=Number(api.state().profile.calories),over=target>0&&dayKcal>target;
   node.innerHTML='<div class="card"><h3>Review your meal</h3><p><b>~'+Math.ceil(next.extraNutrition.kcal)+' / '+next.calorieLimit+' kcal of extras</b> per meal portion</p><p>With '+round(portions)+' portion'+(portions===1?'':'s')+': ~'+Math.round(next.nutrition.kcal*portions)+' kcal · ~'+round(next.nutrition.p*portions)+'g protein per person.</p><p class="sub">Day total: ~'+Math.round(dayKcal)+' kcal'+(target>0?' / '+target+' kcal goal':'')+'. '+(over?'This puts the day above your calorie goal. Your chosen main meal is kept.':'')+'</p>'+(next.withinLimit?'':'<p role="alert">Extras exceed your limit. Reduce an amount or raise the allowance.</p>')+(next.items.length?'<details class="planner-help"><summary>Extra ingredients & sources</summary>'+next.items.map(item=>'<h4>'+html(item.recipe.name)+'</h4><ul>'+item.recipe.ings.map(row=>'<li>'+html(api.quantity(row[1],row[2],item.servings/Math.max(1,item.recipe.servings),row[0]))+' '+html(row[0])+'</li>').join('')+'</ul>'+(api.source?api.source(item.recipe):'')).join('')+'</details>':'<p class="sub">No extras selected. Saving restores the main recipe.</p>')+(baseFixed(next.base)?'<p class="sub">This is a batch recipe. Shopping includes extras for every portion prepared in the full batch.</p>':'')+'<p class="sub">Shopping and meal totals update when saved. Check the new weekly cost; prices are estimates.</p></div>';
   button.disabled=!next.withinLimit;button.textContent=next.items.length?'Save extras':'Save without extras';
  }catch(error){node.innerHTML='<p role="alert">'+html(error.message)+'</p>';button.disabled=true;}
 }
 const baseFixed=recipe=>recipe.fixedBatch===true;
 function choose(role,value){if(draft&&['Sauce','Side'].includes(role)){draft[role].recipeId=value;refreshChoices();}}
 function amount(role,value){if(draft&&['Sauce','Side'].includes(role)){draft[role].servings=Number(value);refreshChoices();}}
 function cap(value){if(!draft)return;draft.cap=value;refreshChoices();}
 function save(){
  if(!draft)return;
  try{
   const change=MealExtrasCore.apply(api.state(),{day:draft.day,index:draft.index,picks:selected(),calorieLimit:draft.cap,expectedFingerprint:draft.fingerprint},api.recipes(),{...options(),cooked:api.cooked});
   api.commit(change.state,change.recipe);draft=null;api.close();api.changed();api.toast('Meal saved. Totals and shopping include your extras.');
  }catch(error){const node=document.getElementById('mealExtraPreview');if(node)node.innerHTML='<p role="alert">'+html(error.message)+'</p>';}
 }
 function cancel(){draft=null;api.close();}
 function ingredients(recipe,portions,quantity){
  const groups=MealExtrasCore.componentGroups(recipe,portions);if(!groups.length)return '';
  return '<p class="sub">Use each component’s amounts in its own steps.</p>'+groups.map(group=>'<h4>'+html(group.name)+'</h4>'+group.ings.map(row=>'<div class="recipe-ing"><span>'+html(row[0])+'</span><b>'+html(quantity(row))+'</b></div>').join('')).join('');
 }
 function chooseMeal(recipeId){
  const extra=api.recipes().find(row=>row.id===recipeId);if(!MealExtrasCore.pairable(extra)){api.toast('Prepare this batch recipe separately.');return;}
  const state=api.state(),choices=(state.week||[]).flatMap(day=>day.meals.map((id,index)=>({day:day.day,index,recipe:api.recipes().find(row=>row.id===id)}))).filter(row=>row.recipe&&!api.cooked(state,row.day,row.index,api.recipes()));
  api.openSheet('<h2>Pair with a meal</h2><p class="sub">'+html(extra.name)+'</p>'+(choices.length?'<div class="field"><label for="mealExtraTarget">Planned meal</label><select id="mealExtraTarget">'+choices.map((row,index)=>'<option value="'+index+'">'+html(row.day+' · '+row.recipe.cat+' · '+row.recipe.name)+'</option>').join('')+'</select></div><button class="btn" id="mealExtraContinue">Choose extras</button>':'<p>Plan a meal first, then add its sauce or side.</p>'));
  const button=document.getElementById('mealExtraContinue');if(button)button.onclick=()=>{const choice=choices[Number(document.getElementById('mealExtraTarget').value)];if(choice)open(choice.day,choice.index,recipeId);};
 }
 root.MealExtrasUI=Object.freeze({configure:value=>{api=value;},open,choose,amount,cap,save,cancel,chooseMeal,ingredients});
})(globalThis);
