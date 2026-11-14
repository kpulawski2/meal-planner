import assert from 'node:assert/strict';
import path from 'node:path';
export async function genericPriceChecks(page,output){
 const saved=await page.evaluate(()=>{window.genericOldPromise=recipeLibraryPromise;return {state:structuredClone(state),recipes:structuredClone(recipes),prices:localStorage.getItem(PersonalPricesCore.STORAGE_KEY)};});
 await page.unroute('**/api/catalog/recommend');
 const stores=[];
 try{
  for(const store of ['Asda','Lidl','Aldi']){
   await page.evaluate(store=>{
    closeModal();recipes=['Breakfast','Lunch','Dinner'].map(cat=>({id:'generic_test_'+cat,name:cat==='Breakfast'?'Frozen banana breakfast':'Test '+cat,cat,servings:1,custom:true,nutritionStatus:'verified',kcal:500,p:50,c:35,f:8,time:10,equipment:[],ings:[[cat==='Breakfast'?'Frozen banana':'Missing test '+cat,100,'g']],method:['Measure the ingredients.','Prepare and serve following pack instructions.']}));recipeLibraryPromise=Promise.resolve();
    state.customRecipes=structuredClone(recipes);Object.assign(state.profile,{supermarket:store,supermarkets:[store],days:2,meals:3,people:1,calories:1600,protein:100,budget:1,portionMode:'fixed',mealPortions:{Breakfast:1,Lunch:1,Dinner:1},nutritionTargets:{calorieMode:'max',fatMax:null,carbs:null},varietyMode:'Balanced',tailoredMeals:{},repeatMeals:{},scheduledMeals:[],dislikes:'',custom:'',diet:'',cookTime:45});
    state.week=[];state.mealServings={};state.locked={};state.pantry=[];state.leftovers=[];state.pantryLedger={planId:'generic-'+store,cooked:{},transactions:[],sequence:0};state.shopping={};state.savedBaskets={};delete state.weekDraft;delete state.planWorkspace;state.foodLog=[];localStorage.removeItem(PersonalPricesCore.STORAGE_KEY);save();renderProfile();renderAll();
   },store);
   await page.evaluate(()=>WeekPlannerUI.open());await page.locator('#weekPlannerForm').waitFor();
   await page.locator('#week-meal-Breakfast').selectOption('recipe:generic_test_Breakfast');await page.locator('#week-meal-Dinner').selectOption('recipe:generic_test_Dinner');
   // Lunch stays automatic: missing prices must not prevent the app filling it.
   await page.getByRole('button',{name:'Preview my week',exact:true}).click();
   await page.locator('#weekSaveButton').waitFor({timeout:60000});assert.match(await page.locator('#weekPlanner').innerText(),/Generic estimates fill missing store prices/);assert.match(await page.locator('#weekPlanner').innerText(),/over budget/);
   await page.locator('#weekSaveButton').click();
   const plan=await page.evaluate(()=>({week:structuredClone(state.week),portions:structuredClone(state.mealServings),food:JSON.stringify([state.pantry,state.foodLog,state.pantryLedger])}));
   assert.equal(plan.week.length,2);assert.ok(plan.week.every(day=>day.meals.join(',')==='generic_test_Breakfast,generic_test_Lunch,generic_test_Dinner'));assert.ok(Object.values(plan.portions).every(n=>n===1));
   await page.evaluate(()=>showTab('shop'));assert.match(await page.locator('#shop').innerText(),/Generic planning estimate/);assert.equal(await page.locator('#shop a[href^="estimate:"]').count(),0);
   await page.screenshot({path:path.join(output,'generic-prices-'+store.toLowerCase()+'.png'),fullPage:true});
   await page.evaluate(()=>ReceiptUI.open());await page.locator('.receipt-import summary').click();await page.locator('#receiptText').fill('Frozen banana 1.69');await page.getByRole('button',{name:'Read this text',exact:true}).click();await page.locator('#receipt-store').selectOption(store);
   await page.locator('#receipt-0-planning').check();await page.locator('#receipt-0-ingredient').fill('Frozen banana');await page.locator('#receipt-0-packQuantity').fill('750');await page.locator('#receipt-0-packUnit').selectOption('g');await page.locator('#receipt-date').fill(await page.evaluate(()=>PersonalPricesCore.today()));await page.locator('#receiptConfirmed').check();await page.getByRole('button',{name:'Save reviewed prices',exact:true}).click();assert.match(await page.locator('#sheet').innerText(),/Receipt prices saved/);
   const after=await page.evaluate(async()=>{const rows=await fetchAutomaticCatalogRecommendations(state.profile.supermarket,[{key:'frozen banana::mass',name:'Frozen banana',dimension:'mass',quantity:200}],new AbortController().signal);return {week:state.week,portions:state.mealServings,food:JSON.stringify([state.pantry,state.foodLog,state.pantryLedger]),product:rows.recommendations[0].plan.products[0],price:rows.recommendations[0].plan.totalCostGBP};});
   assert.deepEqual(after.week,plan.week);assert.deepEqual(after.portions,plan.portions);assert.equal(after.food,plan.food);assert.equal(after.product.priceBasis,'personal');assert.equal(after.price,1.69);stores.push(store);
  }
  return {stores,automaticMealsPopulated:true,estimatedOverBudgetCanSave:true,shoppingReady:true,receiptReplacesEstimate:true,portionsAndFoodPreserved:true};
 }finally{
  await page.evaluate(saved=>{closeModal();state=saved.state;recipes=saved.recipes;recipeLibraryPromise=window.genericOldPromise;if(saved.prices===null)localStorage.removeItem(PersonalPricesCore.STORAGE_KEY);else localStorage.setItem(PersonalPricesCore.STORAGE_KEY,saved.prices);localStorage.setItem('mealPlannerState',JSON.stringify(state));invalidatePersonalPriceQuotes(false);renderProfile();renderAll();},saved);
  await page.route('**/api/catalog/recommend',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Offline price-check fixture'})}));
 }
}
