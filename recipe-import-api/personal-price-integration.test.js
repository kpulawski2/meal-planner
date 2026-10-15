import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const source=await Promise.all(['personal-prices-core','budget-core','consumer-tools','swap-core'].map(name=>readFile(new URL(`../public/${name}.js`,import.meta.url),'utf8')));
const date=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
function harness(){
 const values=new Map(),messages=[],downloads=[];
 const localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
 const context={URL,Date,console,localStorage,structuredClone,defaultProfile:{supermarket:'Asda'},SUPPORTED_STORES:['Asda','Lidl'],hadSavedProfile:true,builtInRecipes:[],recipes:[],state:{profile:{supermarket:'Lidl'},week:[],pantry:[],favorites:[]},MealIntentCore:{scheduled:value=>value||[]},FoodLogCore:{normalizeState(){}},invalidatePersonalPriceQuotes(){},renderAll(){},toast:message=>messages.push(message),downloadFile:(name,text)=>downloads.push({name,text}),FileReader:class {readAsText(file){this.result=file.contents;this.onload();}}};
 vm.createContext(context);source.forEach(code=>vm.runInContext(code,context));
 vm.runInContext(html.slice(html.indexOf('function backupData()'),html.indexOf('function downloadFile(')),context);
 const record=context.PersonalPricesCore.normalize({ingredient:'Oats',productName:'My oats pack',packQuantity:1000,packUnit:'g',priceGBP:1.25,source:'receipt',checkedAt:date,branch:'Alison Crescent'});
 const snapshot={schemaVersion:1,includeInPlanning:true,prices:[record]};
 const product={...record,url:'personal:lidl/'+record.id,estimatedPrice:true,priceBasis:'personal',personalPriceId:record.id,personalIngredient:record.ingredient,personalSource:record.source,personalBranch:record.branch,personalCheckedAt:record.checkedAt,priceSource:'Your Lidl receipt price',priceSourceUrl:null,available:true};
 const plan={requestedQuantity:1100,totalQuantity:2000,totalCostGBP:2.5,estimatedPrice:true,products:[{...product,packs:2,costGBP:2.5,totalQuantity:2000}]};
 return {context,values,messages,downloads,record,snapshot,product,plan,restore:payload=>context.restoreData({target:{files:[{contents:JSON.stringify(payload)}]}})};
}
test('private pack quotes survive an offline snapshot only while identical opted-in records remain eligible',()=>{
 const app=harness(),c=app.context;
 c.PersonalPricesCore.write(app.snapshot);
 const item={key:'oats::mass',name:'Oats',quantity:1100,dimension:'mass'},result={key:item.key,dimension:item.dimension,match:app.product,plan:app.plan};
 const basket={store:'Lidl',status:'ready',fingerprint:'same-personal-payload',loadedAt:Date.now(),items:[item],results:{[item.key]:result}};
 const saved=c.ConsumerTools.snapshot(basket);assert.ok(saved);assert.equal(c.ConsumerTools.restore(saved,'Lidl',basket.fingerprint).results[item.key].plan.estimatedPrice,true);
 assert.equal(c.MealSwapCore.basket({store:'Lidl',refreshedAt:new Date().toISOString(),recommendations:[result]},[item],'Lidl').total,2.5);
 for(const edit of [{personalBranch:'Different store'},{personalCheckedAt:'2020-01-01'},{priceGBP:0.5},{personalIngredient:'Chicken'},{url:'https://www.lidl.co.uk/p/oats/p10000001'}]){
  const changed=structuredClone(app.plan);Object.assign(changed.products[0],edit);assert.equal(c.ConsumerTools.validPlan(changed,{store:'Lidl',ingredient:'Oats',dimension:'mass'}),false);
  assert.equal(c.MealSwapCore.planValid(changed,1100,'Lidl',item),false);
 }
 const before=c.MealSwapCore.fingerprint({profile:{},week:[]},[],'Lidl');c.PersonalPricesCore.upsert({...app.record,priceGBP:1.5});assert.notEqual(c.MealSwapCore.fingerprint({profile:{},week:[]},[],'Lidl'),before);assert.equal(c.ConsumerTools.restore(saved,'Lidl',basket.fingerprint),null);
 c.PersonalPricesCore.write(app.snapshot);c.PersonalPricesCore.setIncluded(false);assert.equal(c.ConsumerTools.snapshot(basket),null);assert.equal(c.MealSwapCore.planValid(app.plan,1100,'Lidl',item),false);
});
test('personal pack backups round-trip through separate storage without placing notebook state in the app object',()=>{
 const app=harness(),c=app.context;c.PersonalPricesCore.write(app.snapshot);c.backupData();
 const backup=JSON.parse(app.downloads[0].text);assert.equal(backup.personalLidlPrices.prices[0].productName,'My oats pack');
 c.PersonalPricesCore.setIncluded(false);c.state.profile.supermarket='Asda';app.restore(backup);
 assert.equal(c.state.profile.supermarket,'Lidl');assert.equal(c.PersonalPricesCore.read().snapshot.includeInPlanning,true);assert.equal(c.state.personalLidlPrices,undefined);assert.match(app.messages.at(-1),/Backup imported/);
});
test('invalid or unwritable combined backups leave the current plan and private pack observations unchanged',()=>{
 const app=harness(),c=app.context;c.PersonalPricesCore.write(app.snapshot);c.localStorage.setItem('mealPlannerState',JSON.stringify(c.state));
 const beforePlan=JSON.stringify(c.state),beforeStore=Object.fromEntries(app.values);
 app.restore({profile:{supermarket:'Asda'},week:[],personalLidlPrices:{...app.snapshot,prices:[{...app.record,priceGBP:-1}]}});
 assert.equal(JSON.stringify(c.state),beforePlan);assert.deepEqual(Object.fromEntries(app.values),beforeStore);
 const realSet=c.localStorage.setItem;let failed=false;c.localStorage.setItem=(key,value)=>{if(key==='mealPlannerState'&&!failed){failed=true;throw new Error('Quota');}realSet(key,value);};
 app.restore({profile:{supermarket:'Asda'},week:[],personalLidlPrices:{...app.snapshot,includeInPlanning:false}});
 assert.equal(JSON.stringify(c.state),beforePlan);assert.deepEqual(Object.fromEntries(app.values),beforeStore);
});
test('restoring an older app backup keeps personal observations already stored on this device',()=>{
 const app=harness(),c=app.context;c.PersonalPricesCore.write(app.snapshot);app.restore({profile:{supermarket:'Asda'},week:[]});assert.equal(c.state.profile.supermarket,'Asda');assert.equal(c.PersonalPricesCore.read().snapshot.prices[0].id,app.record.id);
});

test('failed-plan ingredient gaps open the exact pack notebook action before a saved plan exists',()=>{
 const app=harness(),c=app.context;c.selectedShoppingStore=()=>c.state.profile.supermarket;c.PersonalPricesUI={};c.budgetPlannerState={status:'unavailable'};c.escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 vm.runInContext(html.slice(html.indexOf('function personalPlannerGapHtml('),html.indexOf('function budgetPlannerPanel(')),c);
 const result={diagnostics:{mealCoverage:[{unpricedIngredients:['Oats',"Tuna & pickle's wrap",'Oats']}]}};
 const markup=c.personalPlannerGapHtml(result);assert.match(markup,/Add missing pack prices/);assert.match(markup,/2 ingredients to check/);assert.match(markup,/Tuna &amp; pickle&#39;s wrap/);
 const firstAction=markup.match(/onclick="([^"]+)"/)[1];let opened;c.openPersonalPrice=name=>opened=name;vm.runInContext(firstAction,c);assert.equal(opened,'Oats');
 c.state.profile.supermarket='Asda';assert.equal(c.personalPlannerGapHtml(result),'');
});
test('planner requests carry eligible personal packs only after opt-in and outside the public profile',()=>{
 const app=harness(),c=app.context;c.recipes=[];c.selectedShoppingStore=()=>c.state.profile.supermarket;c.lifecyclePlannerInput=()=>({cookedMeals:{},locked:{},pantry:[],leftovers:[]});c.planBudget=()=>35;c.planCashSpent=()=>0;
 vm.runInContext(html.slice(html.indexOf('function personalPricePayload('),html.indexOf('function personalProductValid('))+'\n'+html.slice(html.indexOf('function budgetPlannerPayload('),html.indexOf('function budgetPlannerFingerprint(')),c);
 c.PersonalPricesCore.write({...app.snapshot,includeInPlanning:false});assert.equal(c.budgetPlannerPayload().allowPersonalPrices,undefined);
 c.PersonalPricesCore.setIncluded(true);const payload=c.budgetPlannerPayload();assert.equal(payload.allowPersonalPrices,true);assert.equal(payload.personalPrices[0].id,app.record.id);assert.equal(payload.profile.personalPrices,undefined);
 c.state.profile.supermarket='Asda';assert.equal(c.budgetPlannerPayload().personalPrices,undefined);
});
test('editing or opting out immediately cancels pending planner, basket and swap quotes and clears saved Lidl estimates',()=>{
 const app=harness(),c=app.context;c.AbortController=AbortController;c.automaticCatalogController=new AbortController();c.budgetPlannerController=new AbortController();const before=[c.automaticCatalogController.signal,c.budgetPlannerController.signal];c.automaticCatalogRequestId=4;c.budgetPlannerRequestId=6;c.automaticCatalogState={status:'ready'};c.budgetPlannerState={status:'loading'};let invalidated=0;c.MealSwapUI={invalidate:()=>invalidated++};c.state.savedBaskets={Lidl:{old:1},Asda:{keep:1}};c.state.packQuotes={Lidl:{old:1}};
 vm.runInContext(html.slice(html.indexOf('function invalidatePersonalPriceQuotes('),html.indexOf("if(typeof PersonalPricesUI!=='undefined')PersonalPricesUI.configure")),c);
 c.invalidatePersonalPriceQuotes(false);assert.ok(before.every(signal=>signal.aborted));assert.equal(c.automaticCatalogRequestId,5);assert.equal(c.budgetPlannerRequestId,7);assert.equal(c.automaticCatalogState.status,'idle');assert.equal(c.budgetPlannerState.status,'idle');assert.equal(c.state.savedBaskets.Lidl,undefined);assert.ok(c.state.savedBaskets.Asda);assert.equal(c.state.packQuotes.Lidl,undefined);assert.equal(invalidated,1);
});

test('labelled personal liquid conversions survive offline and swap checks without allowing invented pack coverage',()=>{
 const app=harness(),c=app.context,record=c.PersonalPricesCore.normalize({...app.record,id:undefined,ingredient:'Mayonnaise',productName:'My light mayonnaise',packUnit:'ml',packQuantity:500,priceGBP:1.45});
 c.PersonalPricesCore.write({...app.snapshot,prices:[record]});const capacity=c.PersonalPricesCore.purchaseQuantity(record,'mass');
 const product={...record,url:'personal:lidl/'+record.id,estimatedPrice:true,priceBasis:'personal',personalPriceId:record.id,personalIngredient:record.ingredient,personalSource:record.source,personalBranch:record.branch,personalCheckedAt:record.checkedAt,priceSource:'Your Lidl receipt price',priceSourceUrl:null,available:true};
 const plan={requestedQuantity:600,totalQuantity:1000,totalCostGBP:2.9,estimatedPrice:true,estimatedQuantity:true,products:[{...product,packs:2,costGBP:2.9,totalQuantity:1000,estimatedQuantity:capacity.estimatedQuantity,quantityBasis:capacity.quantityBasis}]};
 assert.equal(c.ConsumerTools.validPlan(plan,{store:'Lidl',ingredient:'Mayonnaise',dimension:'mass'}),true);assert.equal(c.MealSwapCore.planValid(plan,600,'Lidl',{name:'Mayonnaise',dimension:'mass'}),true);
 for(const edit of [{totalQuantity:100000},{quantityBasis:'No calculation needed'},{estimatedQuantity:false}]){const changed=structuredClone(plan);Object.assign(changed.products[0],edit);assert.equal(c.ConsumerTools.validPlan(changed,{store:'Lidl',ingredient:'Mayonnaise',dimension:'mass'}),false);assert.equal(c.MealSwapCore.planValid(changed,600,'Lidl',{name:'Mayonnaise',dimension:'mass'}),false);}
});
