import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const directory=await mkdtemp(path.join(os.tmpdir(),'generic-price-test-'));
// Missing snapshots deliberately exercise independent planning estimates.
for(const store of ['ASDA','LIDL','ALDI']){
 process.env[store+'_CATALOGUE_PATH']=path.join(directory,store+'.json');
 process.env[store+'_CATALOGUE_META_PATH']=path.join(directory,store+'-meta.json');
}
const {recommendCatalogItems,productPriceUsable}=await import('./catalog-adapter.js');
const {optimizeMealPlan}=await import('./budget-planner.js');
await import('../public/consumer-tools.js');
await import('../public/swap-core.js');
await import('../public/receipt-core.js');
const G=globalThis.GenericPricesCore,P=globalThis.PersonalPricesCore;
const today=P.today();
const item={key:'frozen banana::mass',name:'Frozen banana',dimension:'mass',quantity:650};
const recipes=['Breakfast','Lunch','Dinner'].map((cat,i)=>({id:cat,cat,name:cat,servings:1,ings:[[i?'Unlisted '+cat:'Frozen banana',100,'g']],nutrition:{kcal:500,p:50,c:35,f:8,complete:true}}));
const input=store=>({profile:{supermarket:store,calories:1600,protein:100,nutritionTargets:{calorieMode:'max'},portionMode:'fixed',mealPortions:{Breakfast:1,Lunch:1,Dinner:1},days:2,meals:3,people:1,budget:1,varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'Breakfast',Lunch:'Lunch',Dinner:'Dinner'}},recipes,week:[],pantry:[],mealServings:{}});
test.after(()=>rm(directory,{recursive:true,force:true}));
for(const store of ['Asda','Lidl','Aldi'])test(store+': missing catalogue/banana prices still produce a populated plan and priced shopping',async()=>{
 const request=input(store),before=structuredClone(request),result=await optimizeMealPlan(request);
 assert.deepEqual(request,before);assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.week.length,2);assert.ok(result.week.every(day=>day.meals.length===3));assert.ok(result.nutrition.days.every(day=>day.meetsTargets));assert.equal(result.basket.complete,true);assert.ok(result.basket.totalCostGBP>result.budget.planGBP);assert.ok(result.budget.overGBP>0);assert.match(result.warnings.join(' '),/Generic planning estimates/);
 const priced=await recommendCatalogItems(store,[item],{allowGenericPrices:true});const row=priced.recommendations[0];
 assert.equal(row.plan.estimatedPrice,true);assert.ok(row.plan.totalCostGBP>0);assert.equal(row.plan.products[0].priceBasis,'generic_estimate');assert.equal(row.plan.products[0].sourceStore,null);assert.equal(row.plan.products[0].priceSourceUrl,null);assert.equal(row.plan.products[0].packs,2);
 assert.equal(globalThis.ConsumerTools.validPlan(row.plan,{store,ingredient:item.name,dimension:item.dimension}),true);
 assert.equal(globalThis.MealSwapCore.planValid(row.plan,item.quantity,store,item),true);
 const bad=structuredClone(row.plan);bad.products[0].priceGBP=.01;assert.equal(globalThis.ConsumerTools.validPlan(bad,{store,ingredient:item.name,dimension:item.dimension}),false);
});
for(const store of ['Asda','Lidl','Aldi'])test(store+': a reviewed receipt replaces the generic allowance only for its store',async()=>{
 const observed=P.normalize({store,ingredient:item.name,productName:'My frozen bananas',packQuantity:750,packUnit:'g',priceGBP:1.69,source:'receipt',checkedAt:today});
 const options={allowGenericPrices:true,allowPersonalPrices:true,personalPrices:[observed]};
 const priced=await recommendCatalogItems(store,[item],options),row=priced.recommendations[0];assert.equal(row.plan.products[0].priceBasis,'personal');assert.equal(row.plan.totalCostGBP,1.69);assert.equal(P.productMatches(row.plan.products[0],{store,ingredient:item.name,dimension:item.dimension,prices:[observed]}),true,JSON.stringify({observed,product:row.plan.products[0]}));
 const other=await recommendCatalogItems(store==='Asda'?'Aldi':'Asda',[item],options);assert.equal(other.recommendations[0].plan.products[0].priceBasis,'generic_estimate');
 const result=await optimizeMealPlan({...input(store),...options});assert.equal(result.status,'feasible');assert.ok(result.basket.recommendations.some(r=>r.plan.products.some(p=>p.priceBasis==='personal')));
});
test('generic evidence cannot masquerade as a retailer price or invent unknown quantities',async()=>{
 assert.equal(G.pack('Banana','','Asda'),null);assert.equal(G.pack('Banana','mass','Unknown'),null);
 assert.equal(productPriceUsable({price:1,priceBasis:'generic_estimate',estimatedPrice:true,url:'estimate:asda/banana/mass'}),false);
 const result=await recommendCatalogItems('Asda',[{...item,dimension:'',quantity:0}],{allowGenericPrices:true});assert.equal(result.recommendations[0].plan,null);
 const controller=new AbortController();controller.abort();await assert.rejects(recommendCatalogItems('Asda',[item],{allowGenericPrices:true,signal:controller.signal}));
});
