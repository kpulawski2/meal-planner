import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {everydayChecks} from './everyday-mobile.mjs';
import {fullscreenScannerChecks} from './fullscreen-scanner-mobile.mjs';
import {creatorExtrasChecks} from './creator-extras-mobile.mjs';
import {planWorkspaceChecks} from './plan-workspace-mobile.mjs';
import {dailyOverviewChecks} from './daily-overview-mobile.mjs';
const repo=fileURLToPath(new URL('..',import.meta.url)),port=Number(process.env.SMOKE_TEST_PORT)||4391,origin='http://127.0.0.1:'+port;
const output=path.resolve(process.env.SMOKE_ARTIFACT_DIR||'/tmp/meal-planner-mobile-artifacts');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['--max-old-space-size=256','recipe-import-api/server.js'],{cwd:repo,env:{...process.env,PORT:String(port),PRIVATE_APP_PASSWORD:'',IMPORT_API_TOKEN:'',GROQ_API_KEY:''},stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',data=>logs+=data);server.stderr.on('data',data=>logs+=data);
let browser,context,page;const errors=[];
const withoutDraft=value=>{const next=structuredClone(value);delete next.weekDraft;return next;};
const saved=()=>page.evaluate(()=>structuredClone(state));
const seed={setupComplete:true,profile:{supermarket:'Lidl',supermarkets:['Lidl'],days:7,meals:3,people:1,calories:2000,protein:150,budget:45,portionMode:'fixed',mealPortions:{Breakfast:2,Lunch:1,Dinner:1},nutritionTargets:{calorieMode:'max',fatMax:40},equipment:['Hob','Oven','Microwave'],varietyMode:'Balanced',cookTime:45},week:[],shopping:{},locked:{},pantry:[{name:'Oats',qty:1000,unit:'g',place:'Pantry'}],leftovers:[],favorites:[],customRecipes:[],foodLog:[],mealServings:{}};
async function openWeek(){await page.locator('.tabs [data-tab="week"]').click();await page.locator('#week .page-actions > .btn').click();await page.locator('#weekPlannerForm').waitFor();}
async function chooseMeals(){
 await page.locator('#week-budget').fill('80');await page.locator('#week-meals').selectOption('2');assert.equal(await page.locator('#week-meal-Breakfast').count(),0);await page.locator('#week-meals').selectOption('3');
 for(const [cat,id] of [['Breakfast','everyday-fuel10k-chocolate-flakes-milk'],['Lunch','tuna'],['Dinner','extra31']])await page.locator('#week-meal-'+cat).selectOption('recipe:'+id);
 await page.locator('#week-portions-Breakfast').fill('2');await page.locator('#week-portions-Lunch').fill('1');await page.locator('#week-portions-Dinner').fill('1');await page.locator('#week-cereal').fill('70');await page.locator('#week-milk').fill('200');await page.locator('#week-milkUnit').selectOption('g');assert.match(await page.locator('#week-bowl').innerText(),/140g cereal \+ 400g milk/);
}
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/health')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(ready,'Local test server starts');
 browser=await chromium.launch({...(process.env.MOBILE_BROWSER_EXECUTABLE?{executablePath:process.env.MOBILE_BROWSER_EXECUTABLE}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(value=>{if(!localStorage.getItem('mealPlannerState'))localStorage.setItem('mealPlannerState',JSON.stringify(value));},seed);
 await page.route('**/api/catalog/recommend',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Offline price-check fixture'})}));
 await page.goto(origin,{waitUntil:'networkidle'});const original=await saved();
 await openWeek();await chooseMeals();assert.deepEqual(withoutDraft(await saved()),withoutDraft(original),'Editing a draft preserves the saved plan');await page.getByRole('button',{name:'Preview my week',exact:true}).click();await page.locator('#weekSaveButton').waitFor();assert.match(await page.locator('#weekPlanner').innerText(),/1911 kcal/);assert.match(await page.locator('#weekPlanner').innerText(),/prices are pending/);assert.deepEqual(withoutDraft(await saved()),withoutDraft(original),'Preview does not save');
 await page.screenshot({path:path.join(output,'phone-preview.png'),fullPage:true});await page.locator('#sheet .close').click();assert.deepEqual(withoutDraft(await saved()),withoutDraft(original),'Cancel preserves the saved plan');
 await openWeek();await chooseMeals();await page.getByRole('button',{name:'Preview my week',exact:true}).click();await page.locator('#weekSaveButton').click();let stateNow=await saved();assert.equal(stateNow.week.length,7);assert.equal(stateNow.profile.budget,80);assert.equal(stateNow.mealServings['Monday::0'],2);assert.equal(stateNow.mealServings['Monday::1'],1);assert.equal(stateNow.mealServings['Monday::2'],1);assert.equal(stateNow.week[0].meals[1],'tuna');assert.equal(stateNow.week[0].meals[2],'extra31');assert.deepEqual(stateNow.pantry,original.pantry);const first=stateNow;
 await page.reload({waitUntil:'networkidle'});assert.equal((await saved()).mealServings['Monday::0'],2);
 await openWeek();await page.locator('#week-budget').fill('70');await page.getByRole('button',{name:'Preview my week',exact:true}).click();await page.locator('#weekSaveButton').click();assert.equal((await saved()).profile.budget,70);assert.equal((await saved()).customRecipes.length,first.customRecipes.length,'Unchanged cereal amounts reuse the existing personal recipe');assert.ok((await saved()).planRevisions.length>0);
 await page.evaluate(()=>showTab('more'));await page.getByRole('button',{name:/Plan history & undo/}).click();await page.getByRole('button',{name:'Preview undo',exact:true}).click();await page.locator('#weekSaveButton').click();stateNow=await saved();assert.equal(stateNow.profile.budget,80);assert.deepEqual(stateNow.week,first.week);assert.deepEqual(stateNow.mealServings,first.mealServings);assert.deepEqual(stateNow.pantry,first.pantry);assert.deepEqual(stateNow.foodLog,first.foodLog);
 await page.evaluate(()=>showTab('shop'));assert.match(await page.locator('#shop').innerText(),/Tuna/);assert.match(await page.locator('#shop').innerText(),/Chicken breast/);
 await page.evaluate(()=>showRecipe('fajita'));await page.locator('#sheet .recipe-feedback').getByRole('button',{name:'Like',exact:true}).click();await page.locator('#sheet .taste-reasons summary').click();await page.getByRole('button',{name:'Great flavour',exact:true}).click();assert.ok((await saved()).recipeFeedback.find(row=>row.recipeId==='fajita').reasons.includes('flavour'));await page.locator('#sheet .close').click();
 await page.evaluate(()=>showRecipe('tuna'));assert.match(await page.locator('#sheet').innerText(),/serving illustration/);const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aIl8AAAAASUVORK5CYII=','base64');await page.evaluate(()=>{window.photoStorageSave=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='mealPlannerState')throw new DOMException('Full','QuotaExceededError');return window.photoStorageSave.call(this,key,value);};});await page.locator('#recipePhotoFile').setInputFiles({name:'test-food.png',mimeType:'image/png',buffer:pixel});await page.waitForFunction(()=>document.getElementById('recipePhotoStatus')?.textContent.includes('Full'));assert.equal(Boolean((await saved()).recipePhotos?.tuna),false);await page.evaluate(()=>{Storage.prototype.setItem=window.photoStorageSave;});await page.locator('#recipePhotoFile').setInputFiles({name:'test-food.png',mimeType:'image/png',buffer:pixel});await page.waitForFunction(()=>Boolean(state.recipePhotos?.tuna));assert.equal(await page.locator('#sheet .recipe-photo img').count(),1);await page.locator('#sheet .close').click();
 await page.evaluate(()=>showTab('recipes'));await page.locator('#recipeSearch').fill('tuna pasta');assert.ok(await page.locator('.recipe-photo').count()>0);
 const everyday=await everydayChecks(page,output);
 const dailyOverview=await dailyOverviewChecks(page,output);
 const scanner=await fullscreenScannerChecks(page,output);
 const creatorExtras=await creatorExtrasChecks(page,output);
 const planWorkspace=await planWorkspaceChecks(page,output);
 const layouts=[];for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await openWeek();layouts.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.locator('#sheet .close').click();}assert.ok(layouts.every(row=>!row.overflow),JSON.stringify(layouts));
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>AppExperienceUI.theme('dark'));await openWeek();await page.screenshot({path:path.join(output,'phone-setup-dark.png'),fullPage:true});await page.locator('#sheet .close').click();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);assert.ok((await page.evaluate(()=>caches.keys())).includes('meal-planner-shell-v64-two-week'));await context.setOffline(true);await page.reload({waitUntil:'load'});await openWeek();await page.getByRole('button',{name:'Preview my week',exact:true}).click();await page.locator('#weekSaveButton').click();assert.equal((await saved()).mealServings['Monday::0'],2);assert.ok((await saved()).recipePhotos.tuna);assert.deepEqual(errors,[]);
 await writeFile(path.join(output,'report.json'),JSON.stringify({passed:true,everyday,dailyOverview,scanner,creatorExtras,planWorkspace,story:'cereal / tuna pasta / chicken enchilada at 2/1/1',draftAndCancel:true,shopping:true,undo:true,tasteReasons:true,localFoodPhoto:true,reload:true,offline:true,layouts,errors},null,2));console.log('Mobile planning, exact portions, cancel, undo, taste reasons, food photo, shopping, reload and offline checks passed.');
}catch(error){if(page)await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'server.log'),logs);await browser?.close();server.kill('SIGTERM');}
