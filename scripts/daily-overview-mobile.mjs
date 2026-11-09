import assert from 'node:assert/strict';
import path from 'node:path';

export async function dailyOverviewChecks(page,output){
 const saved=await page.evaluate(()=>({state:structuredClone(state),date:FoodLogUI.getDate()})),today='2026-11-09';
 const home=()=>page.evaluate(()=>showTab('home'));
 const compare=async()=>{
  await home();const overview=await page.locator('#home .daily-intake-summary').innerHTML(),date=await page.locator('#dailyDate').inputValue();
  await page.locator('#home .daily-recorded-intake').getByRole('button',{name:'Open diary →',exact:true}).click();
  assert.equal(await page.locator('#nutritionDiaryDate').inputValue(),date);
  assert.equal(await page.locator('#diary .daily-intake-summary').innerHTML(),overview,'both views use the same recorded totals, goals and missing-value labels');
  await home();
 };
 const chooseDiaryDate=async date=>{
  await page.evaluate(()=>showTab('diary'));await page.locator('#nutritionDiaryDate').fill(date);await page.locator('#nutritionDiaryDate').dispatchEvent('change');await home();
 };
 try{
  await page.clock.setFixedTime(new Date(today+'T12:00:00Z'));
  await page.evaluate(today=>{
   state.profile.startDate=today;state.foodLog=[];state.foodDiaryGoals={mode:'custom',kcal:1700,p:130,c:160,f:40};state.interfacePreferences={...AppExperienceUI.prefs(),simpleMode:true};
   state.week[3].meals[2]='creator-eliya-chicken-funghi';
   FoodLogCore.record(state,{date:today,meal:'Snack',quantity:1,food:{name:'Today snack',quantity:1,unit:'portion',nutrition:{kcal:100,p:10,c:12,f:3,source:'label'}}},{id:'daily-today-snack'});
   FoodLogCore.record(state,{date:'2026-11-12',meal:'Snack',quantity:1,food:{name:'Thursday snack',quantity:1,unit:'portion',nutrition:{kcal:250,p:20,c:25,f:8,source:'label'}}},{id:'daily-thursday-snack'});
   FoodLogCore.record(state,{date:'2026-11-08',meal:'Snack',quantity:1,food:{name:'Yesterday snack',quantity:1,unit:'portion',nutrition:{kcal:50,p:2,c:5,f:1,source:'label'}}},{id:'daily-yesterday-snack'});
   save();FoodLogUI.setDate(today);showTab('home');
  },today);
  const domain=await page.evaluate(()=>JSON.stringify([state.profile,state.week,state.mealServings,state.pantry,state.pantryLedger,state.shopping,state.purchases]));
  assert.equal(await page.locator('#home .daily-meal-card').count(),3);assert.equal(await page.locator('#dailyDate').inputValue(),today);await compare();
  assert.match(await page.locator('#home .daily-intake-summary').innerText(),/1,700/);assert.match(await page.locator('#home .diary-energy h2').innerText(),/100/);
  await page.evaluate(()=>{window.dateStorageSave=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='mealPlannerState')throw new DOMException('Storage full','QuotaExceededError');return window.dateStorageSave.call(this,key,value);};FoodLogUI.setDate('2026-11-12');Storage.prototype.setItem=window.dateStorageSave;});
  assert.equal(await page.locator('#dailyDate').inputValue(),today);assert.equal(await page.evaluate(()=>FoodLogUI.getDate()),today);
  await page.evaluate(()=>{showTab('week');Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};});
  await page.locator('#planDay').selectOption('3');assert.equal(await page.locator('#planDay').inputValue(),'0');
  await page.evaluate(()=>{Storage.prototype.setItem=window.dateStorageSave;showTab('home');});assert.equal(await page.locator('#dailyDate').inputValue(),today);
  console.log('Daily: shared logged totals, custom goals and failed-date recovery passed.');

  await page.evaluate(()=>showTab('week'));await page.locator('#planDay').selectOption('3');await home();
  assert.equal(await page.locator('#dailyDate').inputValue(),'2026-11-12');assert.match(await page.locator('#home .daily-meal-card[data-daily-meal="2"]').innerText(),/Chicken Funghi/i);
  assert.match(await page.locator('#home .diary-energy h2').innerText(),/250/);await compare();
  await page.locator('#home .daily-date-bar').getByRole('button',{name:'Today',exact:true}).click();
  assert.equal(await page.locator('#dailyDate').inputValue(),today);assert.equal(await page.locator('#planDay').inputValue(),'0');

  const breakfast=page.locator('#home .daily-meal-card[data-daily-meal="0"]');
  await breakfast.getByRole('button',{name:'Log eaten',exact:true}).click();assert.equal(await page.locator('#diaryAmount').inputValue(),'2');assert.equal(await page.locator('#diaryDate').inputValue(),today);
  await page.locator('#diaryAmount').fill('1.5');await page.getByRole('button',{name:'Add to diary',exact:true}).click();
  assert.match(await breakfast.innerText(),/Logged:.*1.5 portion/);assert.match(await breakfast.innerText(),/2 portions per person/);await compare();
  await breakfast.getByRole('button',{name:'Review log',exact:true}).click();await page.locator('#diaryAmount').fill('1');await page.getByRole('button',{name:'Save entry',exact:true}).click();await compare();
  await breakfast.getByRole('button',{name:'Review log',exact:true}).click();await page.getByRole('button',{name:'Remove entry',exact:true}).click();assert.equal(await breakfast.getByRole('button',{name:'Log eaten',exact:true}).count(),1);await compare();
  await page.evaluate(today=>FoodLogUI.openLabel({name:'Snack with unknown protein',quantity:100,unit:'g',nutrition:{kcal:200,p:null,c:20,f:5}},today,'Snack'),today);
  await page.locator('#diaryAmount').fill('20');await page.locator('#diarySaveFood').uncheck();await page.getByRole('button',{name:'Add to diary',exact:true}).click();await compare();assert.match(await page.locator('#home .diary-macro-p b').innerText(),/≥/);
  assert.equal(await page.evaluate(()=>JSON.stringify([state.profile,state.week,state.mealServings,state.pantry,state.pantryLedger,state.shopping,state.purchases])),domain,'logging, editing, removing and browsing never resize the plan or change stock');
  console.log('Daily: dated meal selection, exact portions, edited/removed logs and unknown macros passed.');

  await page.evaluate(()=>{for(const [index,id] of state.week[0].meals.entries())state.pantryLedger.cooked[PantryCore.slotKey(state,'Monday',index)]={recipeId:id,recipeSignature:PantryCore.recipeSignature(getRecipe(id)),servings:getMealServings('Monday',index)};save();renderAll();});
  assert.equal(await page.locator('#home .daily-meal-card').count(),3);assert.equal(await page.locator('#home .daily-meal-status').getByText('Prepared',{exact:true}).count(),3);
  assert.doesNotMatch(await page.locator('#home').innerText(),/You’re done for today|Meals prepared/);await compare();
  for(const simple of [false,true]){
   await page.evaluate(simple=>EverydayUI.simple(simple),simple);assert.equal(await page.locator('#home .daily-meal-card').count(),3);await compare();
  }
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('#home .daily-meal-card').count(),3);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'daily-meals-light.png'),fullPage:true});const mealTitle=await page.locator('#home .daily-meal-card h3').first().boundingBox(),navigation=await page.locator('.tabs').boundingBox();assert.ok(mealTitle.y+mealTitle.height<navigation.y-8,'the first meal is visible above the phone navigation without scrolling: '+JSON.stringify({mealTitle,navigation}));
  await page.evaluate(()=>AppExperienceUI.theme('dark'));await page.screenshot({path:path.join(output,'daily-meals-dark.png'),fullPage:true});
  console.log('Daily: all prepared meals remain visible in both views and four viewport sizes.');

  await chooseDiaryDate('2026-11-08');assert.equal(await page.locator('#dailyDate').inputValue(),'2026-11-08');assert.equal(await page.locator('#home .daily-meal-card').count(),0);assert.match(await page.locator('#home').innerText(),/No meals planned for this date/);await compare();
  await page.reload({waitUntil:'networkidle'});await home();assert.equal(await page.locator('#dailyDate').inputValue(),'2026-11-08');await compare();
  await page.evaluate(today=>{state.profile.startDate=FoodLogCore.shiftDate(today,7);save();FoodLogUI.setDate(today);},today);await home();
  assert.equal(await page.locator('#home .daily-meal-card').count(),0);assert.match(await page.locator('#home').innerText(),/Your upcoming plan/);
  await page.getByRole('button',{name:'View upcoming meals',exact:true}).click();assert.equal(await page.locator('#dailyDate').inputValue(),'2026-11-16');assert.equal(await page.locator('#home .daily-meal-card').count(),3);await compare();
  await page.evaluate(today=>{state.profile.startDate=today;save();FoodLogUI.setDate(today);},today);
  await page.clock.setFixedTime(new Date('2026-11-10T00:05:00Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await home();
  assert.equal(await page.locator('#dailyDate').inputValue(),'2026-11-10');assert.equal(await page.locator('#planDay').inputValue(),'1');await compare();
  return {allMealsVisible:true,preparedMealsRemain:true,sharedRecordedTotalsAndGoals:true,sharedDates:true,plannedVersusEatenAmounts:true,editAndRemove:true,unknownMacros:true,stockAndPortionsPreserved:true,reload:true,upcomingAndUnplannedDays:true,midnightRefresh:true,responsive:true};
 }finally{
  await page.clock.setFixedTime(new Date());await page.evaluate(saved=>{closeModal();state=saved.state;localStorage.setItem('mealPlannerState',JSON.stringify(state));FoodLogUI.setDate(saved.date,{persist:false,notify:false});calendarScreenDate=PlanCalendarCore.today();AppExperienceUI.applyTheme();renderAll();},saved);await page.setViewportSize({width:390,height:844});
 }
}
