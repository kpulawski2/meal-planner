import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';import '../public/equipment-core.js';import '../public/macro-goals-core.js';import '../public/meal-intent-core.js';import '../public/food-log-core.js';import '../public/weekly-checkin-core.js';import '../public/plan-explanation-core.js';import '../public/barcode-core.js';
import {createBarcodeLookup} from './barcode-products.js';
const Barcode=globalThis.BarcodeCore,Food=globalThis.FoodLogCore,Weekly=globalThis.WeeklyCheckinCore,Why=globalThis.PlanExplanationCore;
const code='3017620422003',raw={status:'success',product:{code,product_name:'Fixture snack',brands:'Fixture brand',nutrition_data_per:'100g',nutriments:{'energy-kcal_100g':500,proteins_100g:10,carbohydrates_100g:50,fat_100g:25}}};
test('EAN/UPC checks preserve leading zeroes, reject arbitrary identifiers and only accept a matching product',()=>{
 assert.equal(Barcode.code('3017 6204 2200-3'),code);assert.equal(Barcode.code('012345678905'),'012345678905');assert.equal(Barcode.same('012345678905','0012345678905'),true);
 for(const input of ['http://localhost','3017620422004','123','000000000000000000'])assert.throws(()=>Barcode.code(input));
 assert.throws(()=>Barcode.product({...raw,product:{...raw.product,code:'012345678905'}},code),/does not match/);
 assert.equal(Barcode.product(raw,code).sourceUrl,'https://world.openfoodfacts.org/product/'+code);
});
test('barcode nutrition retains unknown values, honours no-data flags and converts explicit kJ without deriving calories from macros',()=>{
 const n={...raw.product.nutriments};delete n['energy-kcal_100g'];delete n.fat_100g;n.proteins_100g=true;const product=Barcode.product({...raw,product:{...raw.product,nutriments:n}},code);assert.equal(product.nutrition.kcal,null);assert.equal(product.nutrition.p,null);assert.equal(product.nutrition.f,null);
 const kj=Barcode.product({...raw,product:{...raw.product,nutriments:{'energy-kj_100g':418.4,fat_100g:0}}},code);assert.equal(kj.nutrition.kcal,100);assert.equal(kj.nutrition.f,0);assert.match(kj.warnings.join(' '),/converted/);
 assert.equal(Barcode.product({...raw,product:{...raw.product,no_nutrition_data:'on'}},code).nutrition.kcal,null);
});
test('reviewed barcode labels survive diary normalization, scale correctly and update the saved label without altering older entries',()=>{
 const product=Barcode.product(raw,code),food={name:product.name,quantity:100,unit:'g',nutrition:product.nutrition,provenance:Barcode.provenance(product)},state={foodLog:[],savedFoods:[]};
 Food.saveFood(state,food,{id:'label'});Food.record(state,{date:'2026-10-12',food,quantity:25},{id:'eaten'});assert.equal(state.foodLog[0].nutrition.kcal,125);assert.equal(state.foodLog[0].food.provenance.barcode,code);
 Food.saveFood(state,{...food,nutrition:{...food.nutrition,kcal:400}},{id:'other'});assert.equal(state.savedFoods.length,1);assert.equal(state.savedFoods[0].id,'label');assert.equal(state.foodLog[0].nutrition.kcal,125);Food.normalizeState(state);assert.equal(state.savedFoods[0].provenance.source,'Open Food Facts');
});
test('product lookup is pinned, bounded, cached and validates codes before making a network request',async()=>{
 let calls=0,at=0;const requests=[];const lookup=createBarcodeLookup({now:()=>at,ttlMs:100,cacheLimit:2,fetchImpl:async(url,options)=>{calls++;requests.push({url:String(url),options});return {ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify(raw)};}});
 assert.equal((await lookup(code)).status,'found');assert.equal((await lookup(code)).product.name,'Fixture snack');assert.equal(calls,1);assert.match(requests[0].url,/^https:\/\/world\.openfoodfacts\.org\/api\/v3\/product\//);assert.equal(requests[0].options.redirect,'error');assert.match(requests[0].options.headers['User-Agent'],/MealPlanner/);
 at=101;await lookup(code);assert.equal(calls,2);await assert.rejects(lookup('https://other.example'),/EAN\/UPC/);assert.equal(calls,2);
 const missing=createBarcodeLookup({fetchImpl:async()=>({status:404})});assert.equal((await missing(code)).status,'not_found');
 const oversized=createBarcodeLookup({fetchImpl:async()=>({ok:true,status:200,headers:{get:()=>String(200000)}})});await assert.rejects(oversized(code),/too large/);
});
test('shared product lookups survive one caller disconnecting and never cache a mismatched product',async()=>{
 let release,calls=0;const lookup=createBarcodeLookup({fetchImpl:async()=>{calls++;await new Promise(resolve=>{release=resolve;});return {ok:true,status:200,text:async()=>JSON.stringify(raw)};}}),controller=new AbortController();
 const cancelled=lookup(code,{signal:controller.signal}),other=lookup(code);controller.abort();await assert.rejects(cancelled,{name:'AbortError'});release();assert.equal((await other).status,'found');assert.equal(calls,1);assert.equal((await lookup(code)).status,'found');assert.equal(calls,1);
 const wrong=createBarcodeLookup({fetchImpl:async()=>({ok:true,status:200,text:async()=>JSON.stringify({...raw,product:{...raw.product,code:'012345678905'}})})});await assert.rejects(wrong(code),/does not match/);
});
const recipe=(id,cat,kcal=500,p=50,c=20,f=10)=>({id,name:id,cat,servings:1,ings:[['Oats',20,'g']],nutrition:{kcal,p,c,f,complete:true}}),rows=[recipe('oats','Breakfast'),recipe('wrap','Lunch'),recipe('chicken','Dinner')];
const request={profile:{days:7,meals:3,people:1,budget:45,calories:1800,protein:180,nutritionTargets:{calorieMode:'max',fatMax:0}},recipes:rows,week:[],locked:{},cookedMeals:{}};
test('plan explanations prove individual target bounds but do not claim that a failed bounded search proves impossibility',()=>{
 const why=Why.explain({request,result:{status:'unavailable',warnings:['No fit found']}});assert.ok(why.issues.some(row=>row.kind==='fat'&&/at least 15g/.test(row.detail)));assert.equal(why.targets.includes('At most 0 g fat'),true);
 const protein=Why.explain({request:{...request,profile:{...request.profile,protein:400,nutritionTargets:{calorieMode:'max'}}}});assert.match(protein.issues.find(row=>row.kind==='protein').detail,/at most 300g/);
 const combined=Why.explain({request:{...request,profile:{...request.profile,nutritionTargets:{}}},result:{status:'no_feasible_plan',basket:{complete:false}}});assert.match(combined.issues.find(row=>row.kind==='combined').detail,/bounded search/);
});
test('explanations distinguish missing prices, conflicting uncooked locks, variety and recorded-spend budget suggestions',()=>{
 const p={...request.profile,varietyMode:'Tailored',tailoredMeals:{Breakfast:{mode:'vary',recipeIds:['oats']},Lunch:{mode:'repeat',recipeIds:['other-wrap']}},nutritionTargets:{}};
 const input={...request,profile:p,recipes:[...rows,recipe('other-wrap','Lunch')],week:[{day:'Monday',meals:['oats','wrap','chicken']}],locked:{'Monday::1':true}};
 const result={status:'no_feasible_plan',basket:{complete:true,totalCostGBP:50},diagnostics:{mealCoverage:[{category:'Dinner',complete:1,priced:0,unpricedIngredients:['Chicken breast']}]}};
 const why=Why.explain({request:input,result,state:{recordedSpend:10}});assert.ok(why.issues.some(row=>row.kind==='prices'&&row.detail.includes('Chicken breast')));assert.ok(why.issues.some(row=>row.kind==='locks'));assert.ok(why.issues.some(row=>row.kind==='variety'));assert.equal(why.issues.find(row=>row.kind==='budget').weeklyBudget,60);
 assert.ok(Why.explain({request:{...input,recipes:input.recipes.filter(r=>r.id!=='wrap')},alternatives:rows}).issues.some(row=>row.kind==='locks'),'Kept recipes excluded from the payload still need an explanation');
 const cooked=Why.explain({request:{...input,cookedMeals:{'Monday::1':{recipeId:'wrap',servings:1}}}});assert.equal(cooked.issues.some(row=>row.kind==='locks'),false);
});
test('fixed historical portions are not subject to the free-portion bounds used in an impossibility explanation',()=>{
 const input={...request,profile:{...request.profile,days:1},week:[{day:'Monday',meals:['oats','wrap','chicken']}],locked:{'Monday::0':true,'Monday::1':true,'Monday::2':true}};
 assert.equal(Why.explain({request:input}).issues.some(row=>row.kind==='fat'),false);
});

test('weekly spending follows a confirmed receipt purchase date rather than the later entry date',()=>{
 const state={foodLog:[],pantryLedger:{transactions:[
  {id:'old-receipt',type:'purchase',purchaseDate:'2026-10-01',createdAt:'2026-10-17T12:00:00Z',totalCostGBP:20},
  {id:'this-week',type:'purchase',purchaseDate:'2026-10-16',createdAt:'2026-10-17T12:00:00Z',totalCostGBP:5}
 ]}};
 const review=Weekly.review(state,'2026-10-17');assert.equal(review.purchases.count,1);assert.equal(review.purchases.total,5);
});
test('repeat-favourite explanations count only the recipe that the user selected',()=>{
 const why=Why.explain({request:{...request,profile:{...request.profile,varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'oats'}},recipes:[...rows,recipe('other-oats','Breakfast')]}});assert.equal(why.coverage[0].selected,1);
});
test('weekly averages exclude unlogged days and missing macros; actual records stay separate from plans',()=>{
 const state={foodLog:[],week:[{day:'Monday',meals:['oats']}],pantryLedger:{transactions:[]}};
 const food={name:'Label snack',quantity:100,unit:'g',nutrition:{kcal:200,p:20,c:30,f:4,source:'label'}};
 Food.record(state,{date:'2026-10-06',food,quantity:100},{id:'one'});Food.record(state,{date:'2026-10-12',food:{...food,nutrition:{...food.nutrition,p:null}},quantity:100},{id:'two'});const before=structuredClone(state),review=Weekly.review(state,'2026-10-12');
 assert.equal(review.start,'2026-10-06');assert.equal(review.loggedDays,2);assert.equal(review.averages.kcal.value,200);assert.equal(review.averages.kcal.days,2);assert.equal(review.averages.p.value,20);assert.equal(review.averages.p.days,1);assert.equal(review.averages.p.missingEntries,1);assert.equal(review.days[1].nutrition.kcal,null);assert.equal(review.purchases.total,null);assert.deepEqual(state,before);
});
test('weekly spending uses dated active purchases across plans and excludes undo, duplicates and estimates for unrecorded shopping',()=>{
 const tx=[{id:'buy',type:'purchase',createdAt:'2026-10-07T12:00:00Z',planId:'old',totalCostGBP:20},{id:'undone',type:'purchase',createdAt:'2026-10-09T12:00:00Z',totalCostGBP:30,undoneAt:'2026-10-10T12:00:00Z'},{id:'cook',type:'cook',recipeId:'oats',createdAt:'2026-10-10T12:00:00Z'},{id:'leftover',type:'leftover-use',recipeId:'oats',createdAt:'2026-10-11T12:00:00Z'}];
 const state={foodLog:[],pantryLedger:{planId:'new',transactions:[...tx,tx[0]]},recipeFeedback:[{recipeId:'oats',value:'again',updatedAt:'2026-10-01T12:00:00Z'}]};const review=Weekly.review(state,'2026-10-12');assert.equal(review.purchases.total,20);assert.equal(review.purchases.count,1);assert.equal(review.cookedMeals,1);assert.equal(review.leftoverUses,1);assert.equal(review.favourites[0].recipeId,'oats');
 state.pantryLedger.transactions.push({id:'unknown',type:'purchase',createdAt:'2026-10-11T12:00:00Z',totalCostGBP:null});assert.equal(Weekly.review(state,'2026-10-12').purchases.total,null);
 assert.equal(Weekly.dayOf('2026-10-11T23:30:00Z'),'2026-10-12','Purchases follow London calendar dates, including DST');
});
