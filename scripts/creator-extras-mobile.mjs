import assert from 'node:assert/strict';
import path from 'node:path';

export async function creatorExtrasChecks(page,output){
 const saved=await page.evaluate(()=>structuredClone(state)),priorIds=await page.evaluate(()=>recipes.map(row=>row.id));
 const retained=['profile','mealServings','pantry','leftovers','foodLog','pantryLedger','shopping','purchases'];
 try{
  await page.evaluate(()=>showTab('recipes'));await page.getByRole('button',{name:'Eliya Eats',exact:true}).click();
  assert.match(await page.locator('#recipeResultCount').innerText(),/of 157 recipes/);
  await page.locator('#recipeSearch').fill('chicken funghi');assert.equal(await page.locator('#recipeResults .recipe-card').count(),1);
  await page.locator('#recipeResults').getByRole('button',{name:'View recipe',exact:true}).click();
  assert.equal(await page.locator('#recipeTargetServings').inputValue(),'1');assert.match(await page.locator('#recipeIngredientPreview').innerText(),/180 g/);
  const source=page.locator('#sheet').getByRole('link',{name:'View creator recipe ↗',exact:true});assert.ok((await source.getAttribute('href')).startsWith('https://eliyaeats.com/lighter-creamy'));
  assert.match(await page.locator('#sheet').innerText(),/75°C for 30 seconds/);await page.locator('#sheet .close').click();
  await page.getByRole('button',{name:'Sauces & sides',exact:true}).click();await page.locator('#recipeSearch').fill('garlic lemon yoghurt');
  await page.locator('[data-recipe-id="extra-pairing-garlic-yoghurt"]').getByRole('button',{name:'View recipe',exact:true}).click();await page.locator('#sheet').getByRole('button',{name:'Pair with a meal',exact:true}).click();
  await page.locator('#mealExtraTarget').waitFor();assert.ok(await page.locator('#mealExtraTarget option').count()>0);await page.locator('#sheet .close').click();
  await page.evaluate(()=>MealExtrasUI.open('Monday',2));await page.locator('#mealExtraCap').fill('100');
  await page.locator('#mealExtraSauce').selectOption('extra-pairing-garlic-yoghurt');await page.locator('#mealExtraSideAmount').selectOption('0.5');await page.locator('#mealExtraSide').selectOption('extra-pairing-rice');
  const before=await page.evaluate(()=>structuredClone(state));for(const key of retained)assert.deepEqual(before[key],saved[key],key+' unchanged during preview');
  assert.equal(await page.locator('#mealExtraSave').isEnabled(),true);await page.locator('#mealExtraCap').fill('20');assert.equal(await page.locator('#mealExtraSave').isDisabled(),true);assert.match(await page.locator('#mealExtraPreview').innerText(),/exceed/);
  await page.locator('#mealExtraCap').fill('100');assert.equal(await page.locator('#mealExtraSave').isEnabled(),true);await page.screenshot({path:path.join(output,'phone-meal-extras.png'),fullPage:true});
  await page.evaluate(()=>{window.extrasSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='mealPlannerState')throw new DOMException('Storage full','QuotaExceededError');return window.extrasSetItem.call(this,key,value);};});
  await page.locator('#mealExtraSave').click();assert.match(await page.locator('#mealExtraPreview').innerText(),/Storage full/);assert.deepEqual(await page.evaluate(()=>state.week),saved.week);await page.evaluate(()=>{Storage.prototype.setItem=window.extrasSetItem;});
  await page.locator('#mealExtraSave').click();const updated=await page.evaluate(()=>structuredClone(state));for(const key of retained)assert.deepEqual(updated[key],saved[key],key+' preserved on save');
  assert.notEqual(updated.week[0].meals[2],saved.week[0].meals[2]);assert.deepEqual(updated.week[0].meals.slice(0,2),saved.week[0].meals.slice(0,2));assert.deepEqual(updated.week.slice(1),saved.week.slice(1));
  const combined=await page.evaluate(()=>getRecipe(state.week[0].meals[2]));assert.equal(combined.mealExtras.items.length,2);const base=combined.mealExtras.base,baseRice=base.ings.filter(row=>row[0]==='Rice').reduce((sum,row)=>sum+row[1],0);assert.equal(combined.ings.find(row=>row[0]==='Rice')[1],baseRice+17.5*(base.servings||1));
  await page.evaluate(()=>showRecipe(state.week[0].meals[2],'Monday',2));assert.match(await page.locator('#recipeIngredientPreview').innerText(),/Use each component’s amounts/);assert.ok(await page.locator('#recipeIngredientPreview h4').count()===3);await page.locator('#sheet .close').click();
  await page.evaluate(()=>ConsumerUI.start(state.week[0].meals[2],'Monday',2));await page.locator('.cook-ingredients summary').click();assert.equal(await page.locator('.cook-ingredients h4').count(),3);await page.getByRole('button',{name:'Save & close',exact:true}).click();
  const newKcal=await page.evaluate(()=>recipeNutrition(getRecipe(state.week[0].meals[2])).kcal);await page.evaluate(()=>FoodLogUI.openRecipe(state.week[0].meals[2],'Monday',2));assert.match(await page.locator('#diaryPreview').innerText(),new RegExp(String(newKcal)));
  await page.locator('#sheet').getByRole('button',{name:'Add to diary',exact:true}).click();const logs=await page.evaluate(()=>state.foodLog),log=logs.find(row=>!updated.foodLog.some(previous=>previous.id===row.id));assert.ok(log.food?.name.includes('with'));assert.equal(log.food.nutrition.kcal,newKcal);
  await page.evaluate(()=>MealExtrasUI.open('Tuesday',2));await page.locator('#mealExtraCap').fill('150');await page.locator('#mealExtraSauce').selectOption('extra-pairing-garlic-yoghurt');await page.locator('#mealExtraSideAmount').selectOption('0.5');await page.locator('#mealExtraSide').selectOption('extra-pairing-rice');await page.locator('#mealExtraSave').click();
  assert.equal(await page.evaluate(()=>state.week[1].meals[2]),combined.id);assert.equal(await page.evaluate(()=>state.customRecipes.length),updated.customRecipes.length);
  await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>MealExtrasUI.open('Tuesday',2));assert.equal(await page.locator('#mealExtraCap').inputValue(),'150');await page.locator('#sheet .close').click();
  await page.evaluate(()=>MealExtrasUI.open('Monday',2));assert.equal(await page.locator('#mealExtraCap').inputValue(),'100');assert.equal(await page.locator('#mealExtraSauce').inputValue(),'extra-pairing-garlic-yoghurt');assert.equal(await page.locator('#mealExtraSideAmount').inputValue(),'0.5');
  await page.locator('#mealExtraSauce').selectOption('');await page.locator('#mealExtraSide').selectOption('');await page.locator('#mealExtraCap').fill('0');await page.locator('#mealExtraSave').click();assert.equal(await page.evaluate(()=>state.week[0].meals[2]),saved.week[0].meals[2]);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.evaluate(()=>MealExtrasUI.open('Monday',2));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('#mealExtraSave').isVisible(),true);await page.locator('#sheet .close').click();}
  return {creatorRecipes:157,sourceAndOnePortion:true,pairFromLibrary:true,capEnforced:true,storageFailureRecovery:true,mealAndQuantitiesPreserved:true,shoppingIngredients:true,componentCookingAmounts:true,sharedPreparation:true,individualCaps:true,diary:true,reload:true,remove:true,layouts:true};
 }finally{
  await page.evaluate(({saved,priorIds})=>{closeModal();state=saved;const ids=new Set(priorIds);recipes=recipes.filter(row=>ids.has(row.id));localStorage.setItem('mealPlannerState',JSON.stringify(state));clearRecipeFilters();renderAll();},{saved,priorIds});await page.setViewportSize({width:390,height:844});
 }
}
