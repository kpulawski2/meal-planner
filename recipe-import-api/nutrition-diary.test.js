import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/food-nutrients-core.js';
import '../public/barcode-core.js';
import '../public/food-log-core.js';
import '../public/nutrition-diary-core.js';
import {createFoodSearch} from './food-search.js';
const Food=globalThis.FoodLogCore,Diary=globalThis.NutritionDiaryCore,Nutrients=globalThis.FoodNutrientsCore;
const label={name:'Fixture cereal',quantity:100,unit:'g',nutrition:{kcal:400,p:25,c:50,f:6,fiber:8,calcium:120,vitaminD:2,source:'label'}};
test('diary groups measured food by meal, retains old uncategorised entries and distinguishes missing nutrients from zero',()=>{
 const state={};Food.record(state,{date:'2026-10-21',meal:'Breakfast',food:label,quantity:50},{id:'cereal'});Food.record(state,{date:'2026-10-21',food:{...label,nutrition:{kcal:100,f:0}},quantity:100},{id:'old'});
 const result=Diary.day(state,'2026-10-21');assert.equal(result.groups.find(g=>g.meal==='Breakfast').totals.kcal,200);assert.equal(result.groups.find(g=>g.meal==='Uncategorised').rows.length,1);assert.equal(result.missing.p,1);assert.equal(result.missing.f,0);assert.equal(result.extraTotals.calcium,60);assert.equal(result.extraMissing.calcium,1);
 const week=Diary.week(state,'2026-10-21');assert.equal(week.length,7);assert.equal(week[0].rows.length,0);assert.equal(week[6].rows.length,2);
});
test('diary goals follow planning limits unless explicitly overridden and never rewrite the planner',()=>{
 const state={profile:{calories:1600,protein:150,nutritionTargets:{calorieMode:'max',carbs:90,carbMode:'max',fatMax:20}}},before=structuredClone(state.profile);const goals=Diary.goals(state);assert.equal(goals.values.f,20);assert.equal(goals.kinds.c,'max');assert.equal(goals.kinds.p,'min');
 state.foodDiaryGoals=Diary.goalSettings({mode:'custom',kcal:'1800',p:'130',c:'',f:'0'});assert.equal(Diary.goals(state).values.kcal,1800);assert.equal(Diary.goals(state).values.c,null);assert.equal(Diary.goals(state).values.f,0);assert.deepEqual(state.profile,before);assert.throws(()=>Diary.goalSettings({mode:'custom',kcal:0}),/above zero/);assert.throws(()=>Diary.goalSettings({mode:'custom',kcal:1500,p:-1}),/valid diary goals/);
});
test('copying recorded meals reviews extra entries, detaches plan origins and preserves all other household state',()=>{
 const state={profile:{calories:1600},week:[{day:'Monday',meals:['oats']}],pantry:[{name:'Oats',qty:500}],shopping:{Oats:true},pantryLedger:{transactions:[{id:'purchase'}]}};
 Food.record(state,{date:'2026-10-20',meal:'Breakfast',originKey:'plan::Monday::0',food:label,quantity:50},{id:'breakfast'});Food.record(state,{date:'2026-10-20',meal:'Snack',food:label,quantity:10},{id:'snack'});Food.record(state,{date:'2026-10-21',meal:'Lunch',food:label,quantity:25},{id:'existing'});
 const preview=Diary.copyPreview(state,'2026-10-20','2026-10-21','Breakfast');assert.equal(preview.existing,1);assert.equal(preview.rows.length,1);const next=Diary.copyApply(state,preview);assert.equal(next.foodLog.length,4);assert.equal(state.foodLog.length,3);assert.equal(next.foodLog[3].originKey,null);assert.equal(next.foodLog[3].meal,'Breakfast');assert.equal(next.foodLog[3].nutrition.calcium,60);assert.equal(next.foodLog[3].date,'2026-10-21');for(const key of ['profile','week','pantry','shopping','pantryLedger'])assert.deepEqual(next[key],state[key]);
 Food.record(state,{date:'2026-10-21',food:label,quantity:5},{id:'changed'});assert.throws(()=>Diary.copyApply(state,preview),/diary changed/);assert.throws(()=>Diary.copyPreview(state,'2026-10-20','2026-10-20'),/different/);assert.throws(()=>Diary.copyPreview(state,'2026-10-19','2026-10-21'),/No recorded foods/);
});
test('vitamin and mineral values use consistent mg and microgram storage and preserve historical snapshots',()=>{
 const n=Nutrients.off({'calcium_100g':.12,'vitamin-d_100g':.000002,'vitamin-b12_100g':.0000005,'iron_100g':0});assert.equal(n.calcium,120);assert.equal(n.vitaminD,2);assert.equal(n.vitaminB12,.5);assert.equal(n.iron,0);assert.equal(n.magnesium,null);
 const state={};Food.record(state,{date:'2026-10-21',food:{...label,nutrition:{...label.nutrition,...n}},quantity:50},{id:'food'});Food.normalizeState(state);assert.equal(state.foodLog[0].nutrition.vitaminD,1);assert.equal(state.foodLog[0].nutrition.vitaminB12,.25);assert.equal(Food.summary(state,'2026-10-21').extraMissing.magnesium,1);
});
const product={code:'3017620422003',product_name:'Fixture skyr',brands:'Fixture',nutriments:{'energy-kcal_100g':63,proteins_100g:11,carbohydrates_100g:4,fat_100g:.2},product_quantity:450,product_quantity_unit:'g',serving_size:'150 g'};
const reply=raw=>({ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify(raw)});
test('packaged food search pins its source, requests UK listings and bounded fields, and caches only validated products',async()=>{
 const requests=[],search=createFoodSearch({fetchImpl:async(url,options)=>{requests.push({url,options});return reply({products:[product,product,{...product,code:'invalid'},{...product,code:'012345678905',product_type:'beauty'}]});}});
 const result=await search('  Fixture   skyr ');assert.equal(result.products.length,1);assert.equal(result.products[0].pack.quantity,450);assert.equal(result.products[0].serving.quantity,150);assert.equal(result.products[0].source,'Open Food Facts');assert.equal(requests[0].url.origin,'https://world.openfoodfacts.org');assert.equal(requests[0].url.pathname,'/cgi/search.pl');assert.equal(requests[0].url.searchParams.get('search_terms'),'Fixture skyr');assert.equal(requests[0].url.searchParams.get('tag_0'),'united-kingdom');assert.equal(requests[0].url.searchParams.get('page_size'),'20');assert.equal(requests[0].options.redirect,'error');assert.match(requests[0].options.headers['User-Agent'],/MealPlanner/);
 result.products[0].name='Changed by caller';assert.equal((await search('fixture skyr')).products[0].name,'Fixture skyr');assert.equal(requests.length,1);await assert.rejects(search(['skyr']),/food name/);await assert.rejects(search('x'),/2–80/);assert.equal(requests.length,1);
});
test('search shares in-flight queries, bounds upstream traffic, and refuses failed, malformed or oversized data',async()=>{
 let release,calls=0;const search=createFoodSearch({fetchImpl:async()=>{calls++;await new Promise(resolve=>{release=resolve;});return reply({products:[product]});}});const first=search('skyr'),second=search('SKYR');release();assert.deepEqual(await first,await second);assert.equal(calls,1);
 const limited=createFoodSearch({fetchImpl:async()=>reply({products:[]})});for(let i=0;i<8;i++)await limited('query '+i);await assert.rejects(limited('one more'),e=>e.status===429);
 await assert.rejects(createFoodSearch({fetchImpl:async()=>{throw new TypeError('Fetch failed')}})('skyr'),/could not connect/);await assert.rejects(createFoodSearch({fetchImpl:async()=>({status:429})})('skyr'),e=>e.status===429);
 for(const response of [{ok:false},reply({}),{ok:true,headers:{get:()=>600000}},{ok:true,headers:{get:()=>null},text:async()=>'<html>Gateway failed</html>'}])await assert.rejects(createFoodSearch({fetchImpl:async()=>response})('skyr'));
});
