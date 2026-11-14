import assert from 'node:assert/strict';
import path from 'node:path';

export async function planWorkspaceChecks(page,output){
 const saved=await page.evaluate(()=>({state:structuredClone(state),date:FoodLogUI.getDate(),ids:recipes.map(r=>r.id)}));
 try{
  await page.evaluate(()=>showTab('week'));await page.locator('#week').getByRole('button',{name:'Plan next week',exact:true}).click();
  const start=await page.evaluate(()=>FoodLogCore.shiftDate(state.profile.startDate,state.week.length));await page.locator('#nextPlanStart').fill(start);
  await page.evaluate(()=>{window.workspaceStorage=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='mealPlannerState')throw new DOMException('Storage full','QuotaExceededError');return window.workspaceStorage.call(this,key,value);};});
  await page.getByRole('button',{name:'Repeat this week',exact:true}).click();assert.match(await page.locator('#planWorkspaceError').innerText(),/Storage full/);assert.equal(await page.evaluate(()=>state.planWorkspace),undefined);assert.deepEqual(await page.evaluate(()=>state.week),saved.state.week);await page.evaluate(()=>{Storage.prototype.setItem=window.workspaceStorage;});
  await page.locator('#sheet .close').click();await page.locator('#week').getByRole('button',{name:'Repeat week',exact:true}).click();
  let next=await page.evaluate(()=>structuredClone(state));assert.equal(next.planWorkspace.view,'next');assert.equal(next.profile.startDate,start);assert.deepEqual(next.week,saved.state.week);assert.deepEqual(next.mealServings,saved.state.mealServings);assert.deepEqual(next.shopping,{});assert.deepEqual(next.pantryLedger.cooked,{});
  for(const key of ['pantry','foodLog','leftovers','customRecipes'])assert.deepEqual(next[key],saved.state[key],key+' preserved while copying');
  assert.deepEqual(next.planWorkspace.other.week,saved.state.week);
  await page.evaluate(()=>setMealServings('Monday',1,1.5));
  await page.evaluate(()=>MealExtrasUI.open('Monday',2));await page.locator('#mealExtraCap').fill('100');await page.locator('#mealExtraSauce').selectOption('extra-pairing-garlic-yoghurt');await page.locator('#mealExtraSave').click();
  const changed=await page.evaluate(()=>structuredClone(state));assert.notEqual(changed.week[0].meals[2],saved.state.week[0].meals[2]);assert.equal(changed.mealServings['Monday::1'],1.5);
  await page.evaluate(()=>{state.profile.budget=95;save();renderAll();});
  await page.locator('#week .plan-workspace').getByRole('button',{name:'This week',exact:true}).click();
  let current=await page.evaluate(()=>structuredClone(state));assert.deepEqual(current.week,saved.state.week);assert.deepEqual(current.mealServings,saved.state.mealServings);assert.deepEqual(current.shopping,saved.state.shopping);assert.equal(current.pantryLedger.planId,saved.state.pantryLedger.planId);
  assert.equal(current.profile.budget,saved.state.profile.budget);
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};});await page.locator('#week .plan-workspace').getByRole('button',{name:'Next week',exact:true}).click();assert.equal(await page.evaluate(()=>PlanWorkspaceCore.mode(state)),'current');await page.evaluate(()=>{Storage.prototype.setItem=window.workspaceStorage;});
  await page.locator('#week .plan-workspace').getByRole('button',{name:'Next week',exact:true}).click();await page.evaluate(()=>showTab('shop'));
  assert.equal(await page.locator('#shop .plan-workspace').getByRole('button',{name:'Next week',exact:true}).getAttribute('aria-pressed'),'true');assert.match(await page.locator('#shop .plan-workspace').innerText(),/Stock needed for this week is reserved/);
  const checkbox=page.locator('#shop [data-shopping-key] input[type="checkbox"]').first();await checkbox.check();
  const checked=await page.evaluate(()=>structuredClone(state.shopping));assert.ok(Object.values(checked).some(Boolean));
  await page.evaluate(()=>showTab('home'));assert.equal(await page.evaluate(()=>PlanWorkspaceCore.mode(state)),'current');assert.deepEqual(await page.evaluate(()=>state.week),saved.state.week);
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>PlanWorkspaceCore.mode(state)),'current');
  await page.evaluate(()=>showTab('week'));await page.locator('#week .plan-workspace').getByRole('button',{name:'Next week',exact:true}).click();
  assert.equal(await page.evaluate(()=>state.mealServings['Monday::1']),1.5);assert.deepEqual(await page.evaluate(()=>state.shopping),checked);assert.equal(await page.evaluate(()=>state.week[0].meals[2]),changed.week[0].meals[2]);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'next-week-plan.png'),fullPage:true});
  await page.clock.setFixedTime(new Date(start+'T12:00:00Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  const activated=await page.evaluate(()=>structuredClone(state));assert.equal(activated.planWorkspace,undefined);assert.equal(activated.profile.startDate,start);assert.equal(activated.mealServings['Monday::1'],1.5);assert.equal(activated.week[0].meals[2],changed.week[0].meals[2]);assert.deepEqual(activated.planHistory[0].week,saved.state.week);
  await page.evaluate(()=>showTab('profile'));assert.equal(await page.locator('#bud').inputValue(),'95');assert.equal(await page.evaluate(()=>state.profile.budget),95);
  for(const key of ['pantry','foodLog','leftovers'])assert.deepEqual(activated[key],saved.state[key],key+' retained on activation');
  return {exactRepeat:true,separateEdits:true,independentShopping:true,currentToday:true,reload:true,responsive:true,automaticStart:true,historyAndStockPreserved:true};
 }finally{
  await page.clock.setFixedTime(new Date());await page.evaluate(saved=>{closeModal();state=saved.state;const ids=new Set(saved.ids);recipes=recipes.filter(r=>ids.has(r.id));localStorage.setItem('mealPlannerState',JSON.stringify(state));FoodLogUI.setDate(saved.date,{persist:false,notify:false});calendarScreenDate=PlanCalendarCore.today();renderAll();},saved);await page.setViewportSize({width:390,height:844});
 }
}
