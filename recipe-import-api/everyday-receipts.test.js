import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/food-nutrients-core.js';
import '../public/food-log-core.js';
import '../public/personal-prices-core.js';
import '../public/receipt-core.js';
import '../public/barcode-core.js';
import '../public/barcode-scan-core.js';
import '../public/plan-calendar-core.js';
import '../public/weekly-routine-core.js';
import '../public/everyday-core.js';
import '../public/budget-core.js';
import '../public/macro-goals-core.js';
import '../public/meal-preferences-core.js';
import '../public/week-planner-core.js';
import {readReceiptImage,receiptPrompt} from './receipt-reader.js';
const {ReceiptCore:R,PersonalPricesCore:P,FoodLogCore:F,EverydayCore:E,PlanCalendarCore:C,BarcodeScanCore:B,WeekPlannerCore:W}=globalThis;
const now=new Date('2026-11-08T14:00:00Z'),opts={now};
function storage(){let value=null,writes=0;return {getItem:()=>value,setItem:(_key,next)=>{writes++;value=next;},value:()=>value,writes:()=>writes};}
const item=(extra={})=>({name:'Natural Skyr',quantity:1,unitPriceGBP:1.49,lineTotalGBP:1.49,ingredient:'Skyr',productName:'Natural Skyr',packQuantity:450,packUnit:'g',useInPlanning:true,...extra});
const receipt=(extra={})=>({confirmed:true,store:'Lidl',currency:'GBP',date:'2026-11-07',totalGBP:1.49,branch:'Sheffield',items:[item()],...extra});
test('receipt text preserves multipacks, drained-weight uncertainty and printed adjacent discounts',()=>{
 const result=R.parseText('LIDL\nNatural Skyr 1.49 A\nTuna Chunks in Brine 24x £0.59 14.16 A\n6 Minimum Net Weight 2 x £0.99 1.98 A\nSesame Oil 1.99 A\nPrice Cut\n-0.84\nLoose Carrots 0.60 A\n0.864 kg @ £0.69/kg\nTOTAL 19.38\nCARD 19.38\nMASTERCARD 1234 5678 9012 3456\nDate: 07/11/26');
 assert.equal(result.date,'2026-11-07');assert.equal(result.totalGBP,19.38);assert.equal(result.items.length,5);assert.equal(result.items[1].quantity,24);assert.equal(result.items[1].unitPriceGBP,.59);assert.equal(result.items[2].quantity,2);assert.equal(result.items[2].packQuantity,null,'six eggs are confirmed at review, never guessed from a truncated receipt name');assert.equal(result.items[3].unitPriceGBP,1.15);assert.equal(result.items[4].packQuantity,.864);assert.equal(result.items[4].packUnit,'kg');assert.equal(result.items[0].packQuantity,null);assert.doesNotMatch(JSON.stringify(result),/1234|MASTERCARD|CARD /);
});
test('unknown pack sizes remain references, while reviewed Lidl packs reach the existing price request without receipt history',()=>{
 const store=storage(),saved=R.save(receipt({items:[item(),item({name:'Sauce',productName:'Sauce',unitPriceGBP:1.39,ingredient:'',packQuantity:null,useInPlanning:false})]}),store,opts);
 assert.equal(store.writes(),1,'one atomic storage write');assert.equal(saved.snapshot.receipts[0].items.length,2);assert.equal(saved.snapshot.prices.length,1);assert.equal(saved.snapshot.includeInPlanning,true);const body=P.requestPayload(saved.snapshot,{store:'Lidl',now});assert.equal(body.personalPrices[0].priceGBP,1.49);assert.equal(body.personalPrices[0].packQuantity,450);assert.equal(body.receipts,undefined);assert.equal(body.personalPrices[0].receipt,undefined);assert.equal(body.personalPrices[0].source,'receipt');assert.deepEqual(P.requestPayload(saved.snapshot,{store:'Asda',now}),{});
 const restored=P.normalizeSnapshot(JSON.parse(store.value()),opts);assert.deepEqual(restored,saved.snapshot,'backup round trip retains reviewed observations');
});
test('review and native pack dimensions are required before receipt prices can influence planning',()=>{
 for(const raw of [receipt({confirmed:false}),receipt({date:'2026-11-09'}),receipt({date:'2026-02-30'}),receipt({currency:'EUR'}),receipt({items:[item({packQuantity:null})]}),receipt({items:[item({packQuantity:1.5,packUnit:'pieces'})]}),receipt({items:[item({unitPriceGBP:1.001})]})])assert.throws(()=>R.reviewed(raw,opts));
 const eggs=R.reviewed(receipt({items:[item({ingredient:'Eggs',productName:'6 mixed free-range eggs',packQuantity:6,packUnit:'pieces',unitPriceGBP:.99,quantity:2})]}),opts);assert.equal(eggs.prices[0].packQuantity,6);assert.equal(eggs.prices[0].priceGBP,.99);
 const other=R.reviewed(receipt({store:'Aldi',items:[item({useInPlanning:false,packQuantity:null})]}),opts);assert.equal(other.prices.length,0);assert.throws(()=>R.reviewed(receipt({store:'Aldi'}),opts),/Lidl receipts/);
});
test('receipt correction replaces its earlier mapped pack while retaining unrelated prices and other receipts',()=>{
 const store=storage(),first=R.save(receipt(),store,opts);const second=R.save(receipt({date:'2026-11-08',items:[item({name:'Tuna',ingredient:'Tuna',productName:'Tuna',packQuantity:100,unitPriceGBP:.59})]}),store,opts);assert.equal(second.snapshot.prices.length,2);
 const fixed=R.save(receipt({replaceId:first.receipt.id,items:[item({packQuantity:500,unitPriceGBP:1.59})]}),store,opts);assert.equal(fixed.snapshot.receipts.length,2);assert.equal(fixed.snapshot.prices.length,2);assert.ok(fixed.snapshot.prices.some(row=>row.ingredient==='Tuna'));assert.equal(fixed.snapshot.prices.find(row=>row.ingredient==='Skyr').packQuantity,500);
 assert.throws(()=>R.save(receipt({items:[item({packQuantity:500,unitPriceGBP:1.59})]}),store,opts),/already saved/);
 const unchanged=store.value();assert.throws(()=>R.save(receipt({replaceId:'receipt-no-longer-present'}),store,opts),/changed/);assert.equal(store.value(),unchanged);
});
test('an older imported receipt cannot overwrite a newer checked pack price',()=>{
 const store=storage();R.save(receipt({date:'2026-11-08',items:[item({unitPriceGBP:1.69})]}),store,opts);R.save(receipt({date:'2026-11-01',items:[item({unitPriceGBP:1.29})]}),store,opts);assert.equal(P.read(store,opts).snapshot.prices[0].priceGBP,1.69);assert.equal(P.read(store,opts).snapshot.receipts.length,2);
});
test('duplicate imports and quota failures leave the existing catalogue unchanged',()=>{
 const store=storage();R.save(receipt(),store,opts);const before=store.value();assert.throws(()=>R.save(receipt(),store,opts),/already saved/);assert.equal(store.value(),before);
 const broken={getItem:()=>before,setItem:()=>{throw new DOMException('Full','QuotaExceededError');}};assert.throws(()=>R.save(receipt({date:'2026-11-08'}),broken,opts),/Full/);assert.equal(store.value(),before);assert.equal(P.read(store,opts).snapshot.receipts.length,1);
});
test('receipt extraction removes financial fields, rejects overseas prices and never fabricates pack weights',()=>{
 const data=R.extraction({currency:'GBP',store:'Lidl',items:[{name:'CARD 1234567890123456',unitPriceGBP:50},{name:'Natural Skyr',unitPriceGBP:1.49,warnings:['Card 1234567890123456 is uncertain']}],cardNumber:'1234567890123456',image:'secret'});assert.equal(data.items.length,1);assert.equal(data.items[0].packQuantity,null);assert.doesNotMatch(JSON.stringify(data),/1234567890123456|secret/);assert.throws(()=>R.extraction({currency:'EUR',items:[item()]}),/UK receipt/);assert.throws(()=>R.parseText('Skyr €1.49'),/UK receipt/);assert.throws(()=>R.extraction({items:[]}),/No complete/);
});
test('the receipt vision adapter uses bounded JPEG input and structured uncertain fields',async()=>{
 let request;const output=await readReceiptImage(Buffer.from([255,216,255,1]),{generate:async options=>{request=options;return JSON.stringify({store:'Lidl',currency:'GBP',date:'2026-11-07',items:[{name:'Skyr',quantity:1,unitPriceGBP:1.49,packQuantity:null}]});}});assert.equal(output.items[0].packQuantity,null);assert.match(receiptPrompt,/untrusted/);assert.match(receiptPrompt,/Do not invent/);assert.equal(request.frameImages.length,1);assert.equal(request.generationConfig.temperature,0);assert.equal(request.generationConfig.responseMimeType,'application/json');assert.equal(request.timeoutMs,25000);await assert.rejects(readReceiptImage(Buffer.from('not an image'),{generate:async()=>{throw new Error('must not call');}}),/JPEG/);await assert.rejects(readReceiptImage(Buffer.alloc(3*1024*1024+1)),/JPEG/);await assert.rejects(readReceiptImage(Buffer.from([255,216,255,1]),{generate:async()=>'{bad json'}),/incomplete data/);
});
test('scanner asks for an HD rear camera, prioritises the main lens, restricts food codes and expands UPC-E',()=>{
 assert.equal(B.constraints().video.width.ideal,1920);assert.equal(B.constraints().video.height.ideal,1080);assert.equal(B.constraints().video.facingMode.ideal,'environment');assert.equal(B.constraints('main').video.deviceId.exact,'main');assert.deepEqual(B.hints().get(2),[7,6,14,15,8]);assert.equal(B.hints().get(3),true);
 const cams=B.cameras([{kind:'videoinput',deviceId:'front',label:'Front camera'},{kind:'videoinput',deviceId:'ultra',label:'Back Ultra Wide Camera'},{kind:'videoinput',deviceId:'main',label:'Back Wide Camera'}]);assert.equal(cams[0].id,'main');assert.equal(B.value('04252614','upc_e'),'042100005264');assert.throws(()=>B.value('04252615','upc_e'));assert.equal(B.zoom({zoom:{min:1,max:10,step:.1}},{zoom:2}).max,4);assert.equal(B.zoom({}),null);
});
test('dated plans begin on the selected day without changing internal meal and pantry ledger keys',()=>{
 const state={profile:{startDate:'2026-11-08'},week:[{day:'Monday',meals:['cereal']},{day:'Tuesday',meals:['wrap']},{day:'Wednesday',meals:['chicken']}]},before=structuredClone(state);assert.equal(C.dateFor(state,'Monday'),'2026-11-08');assert.match(C.label(state,'Monday'),/Sun 8 Nov/);assert.equal(C.selected(state,'Wednesday','2026-11-07','2026-11-09').day,'Tuesday');assert.equal(C.selected(state,'Wednesday','2026-11-09','2026-11-09').day,'Wednesday');assert.equal(C.selected(state,'Monday','2026-11-08','2026-11-10').day,'Wednesday');assert.deepEqual(state,before);assert.equal(C.defaultStart({week:[]},'2026-11-08'),'2026-11-08');assert.equal(C.defaultStart({week:[{}],profile:{}},'2026-11-08'),'2026-11-02');assert.equal(C.today(new Date('2026-06-01T23:30:00Z')),'2026-06-02');
});
test('changing calendar dates protects already cooked meals and leaves the stock ledger untouched',()=>{
 const prior=globalThis.PantryCore;globalThis.PantryCore={cookedPortions:()=>1};try{const state={profile:{startDate:'2026-11-08'},week:[{day:'Monday',meals:['a']}]},before=structuredClone(state);assert.doesNotThrow(()=>C.assertDates(state,{startDate:'2026-11-08'}));assert.throws(()=>C.assertDates(state,{startDate:'2026-11-15'}),/already has cooked/);assert.deepEqual(state,before);}finally{globalThis.PantryCore=prior;}
});
test('recoverable drafts hold unfinished choices without copying stock, log entries or the active week',()=>{
 const profile={meals:3,budget:80},value={...W.draft(profile),startDate:'2026-11-08',budget:'',cereal:{grams:'70',milk:'200',unit:'g'},pantry:['private'],foodLog:['private'],week:['active']},saved=W.savedDraft(value),restored=W.recoverDraft(JSON.parse(JSON.stringify(saved)),profile);assert.equal(restored.budget,'');assert.equal(restored.cereal.grams,'70');assert.equal(saved.value.pantry,undefined);assert.equal(saved.value.foodLog,undefined);assert.equal(saved.value.week,undefined);assert.equal(W.recoverDraft({schemaVersion:2},profile),null);assert.throws(()=>W.savedDraft({...value,choices:{Dinner:'x'.repeat(31000)}}),/too large/);
});
test('usual foods preserve exact quantities and nutrition, log independently and retain unknown nutrient values',()=>{
 const state={profile:{budget:80},week:[{day:'Monday',meals:['cereal','tuna','chicken']}],pantry:[{name:'Milk',qty:1000}],foodLog:[]},before=JSON.stringify([state.profile,state.week,state.pantry]),food={name:'My cereal and milk',quantity:1,unit:'portion',nutrition:{kcal:340,p:24,c:50,f:3},note:'70g cereal + 200g skimmed milk'};const id=E.pin(state,food,2,'Breakfast');assert.equal(E.pin(state,food,2,'Breakfast'),id);assert.equal(E.pins(state).length,1);E.record(state,id,'2026-11-08');assert.equal(state.foodLog[0].quantity,2);assert.equal(state.foodLog[0].nutrition.kcal,680);assert.equal(state.foodLog[0].meal,'Breakfast');assert.match(state.foodLog[0].food.note,/70g/);assert.equal(JSON.stringify([state.profile,state.week,state.pantry]),before);const restored=JSON.parse(JSON.stringify(state));assert.equal(E.pins(restored)[0].quantity,2);assert.throws(()=>E.record(state,'missing'),/no longer/);
});
test('prep nudges are opt-in, use tomorrow’s dated meals and avoid expired frozen portions',()=>{
 const recipes=[{id:'oats',name:'Berry Overnight Oats',ings:[['Oats',50,'g']]},{id:'chicken',name:'Chicken curry',ings:[['Chicken breast',150,'g']]}],state={profile:{startDate:'2026-11-09'},week:[{day:'Monday',meals:['oats','chicken']}],leftovers:[{recipeId:'chicken',storage:'Freezer',servings:1,expiry:'2026-11-08'}]};assert.deepEqual(E.nudges(state,recipes,now),[]);state.prepReminders={enabled:true};assert.equal(E.nudges(state,recipes,now).length,1);state.leftovers[0].expiry='2026-11-12';assert.equal(E.nudges(state,recipes,now).length,2);assert.match(E.nudges(state,recipes,now)[1].detail,/fridge/);
});
test('phone calendar prep alerts use local wall time across daylight saving and fold long UTF-8 lines',()=>{
 const state={profile:{startDate:'2026-06-03'},week:[{day:'Monday',meals:['a']}],prepReminders:{enabled:true,time:'19:00',timeZone:'Europe/London'}},recipes=[{id:'a',name:'Żurek '+('A flavourful chicken meal '.repeat(10))}];const ics=E.calendar(state,recipes,new Date('2026-06-01T10:00:00Z'));assert.match(ics,/DTSTART:20260602T180000Z/);assert.match(ics,/BEGIN:VALARM/);assert.match(ics,/TRIGGER:PT0S/);assert.ok(ics.split('\r\n').every(line=>new TextEncoder().encode(line).length<=75));assert.throws(()=>E.calendar({...state,prepReminders:{enabled:false}},recipes,now),/Turn on/);assert.throws(()=>E.calendar(state,recipes,now),/no upcoming/);
});
