import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadPriceReferences, validatePriceReferences, referenceProduct } from './lidl-price-references.js';
import { browseCatalog, recommendCatalogItems, productPriceUsable, calculatePackPurchase } from './catalog-adapter.js';
import { recommendCatalogItems as workerRecommend } from './catalog-service.js';
import { optimizeMealPlan } from './budget-planner.js';
import '../public/swap-core.js';
const document = JSON.parse(await readFile(new URL('../data/lidl-price-references.json',import.meta.url)));
const snapshot = JSON.parse(await readFile(new URL('../data/lidl-products.json',import.meta.url)));
const refs = await loadPriceReferences();
const item = (name, quantity=500, dimension='mass') => ({key:name,name,quantity,dimension});

test('reference manifest retains explicit original periods and validates packs, regions and evidence', () => {
  assert.equal(refs.length,102);
  assert.equal(refs.find(row=>row.storeSku==='1073').priceGBP,.99);
  assert.equal(refs.find(row=>row.storeSku==='1073').sourceDate,null);
  assert.equal(refs.find(row=>row.name==='Alesto Pecan Nuts').packQuantity,200);
  for(const change of [doc=>doc.sources[0].url='https://www.lidl.co.uk.evil.test/a.pdf',doc=>doc.sources[0].url='https://user@www.lidl.co.uk/static/assets/a.pdf',doc=>doc.references[0].priceGBP=-1,doc=>doc.references[0].packQuantity=0,doc=>doc.references[0].regions=['Northern Ireland'],doc=>doc.references.push(doc.references[0])]) {
    const bad=structuredClone(document);change(bad);assert.throws(()=>validatePriceReferences(bad));
  }
  assert.equal(productPriceUsable({store:'Lidl',price:.01,priceBasis:'reference',estimatedPrice:true}),false,'a reference flag cannot bypass evidence validation');
});
test('reference quantities use whole packs, exclude regional and variable weights, and preserve pint capacity', () => {
  const beans=referenceProduct(refs.find(row=>row.name==='Freshona Cannellini Beans'));
  const plan=calculatePackPurchase([beans],500,'mass');
  assert.equal(plan.totalCostGBP,1.35);assert.equal(plan.products[0].packs,3);assert.equal(plan.totalQuantity,720);assert.equal(plan.estimatedPrice,true);
  assert.equal(plan.products[0].sourcePeriod,'May 2026');assert.equal(plan.products[0].priceCheckedAt,null);
  for(const ref of refs.filter(row=>row.regions.length||row.packQuantity===null))assert.equal(calculatePackPurchase([referenceProduct(ref)],100,'mass'),null);
  const milk=referenceProduct(refs.find(row=>row.packUnit==='pint'));
  assert.equal(calculatePackPurchase([milk],1100,'volume').products[0].packs,1);
});
test('the same item number cannot transfer Dairy Manor milk or organic egg prices to another variant', async () => {
  const rows=(await browseCatalog('Lidl',{query:'milk',allowReferencePrices:true,limit:100})).results;
  const manor=rows.find(row=>row.productName==='Dairy Mannor UHT Skimmed Milk 0.3%'), milbona=rows.find(row=>row.productName==='Milbona UHT Skimmed Milk');
  assert.equal(manor.priceGBP,.99);assert.equal(manor.estimatedPrice,true);
  assert.equal(milbona.priceGBP,null);assert.equal(milbona.estimatedPrice,false);
  const eggs=(await browseCatalog('Lidl',{query:'eggs',allowReferencePrices:true,limit:100})).results;
  assert.equal(eggs.find(row=>row.productName==='Woodcote 6 Organic Eggs').priceGBP,2.25);
  assert.equal(eggs.find(row=>row.productName==='Woodcote 6 Medium Free Range Eggs').estimatedPrice,false);
});
test('strict price callers remain isolated after reference searches and the worker preserves the mode', async () => {
  const items=[item('cannellini beans')];
  const priced=await workerRecommend('Lidl',items,{allowReferencePrices:true});
  assert.equal(priced.recommendations[0].plan.estimatedPrice,true);
  assert.equal(priced.indexSize,snapshot.length);
  const strict=await recommendCatalogItems('Lidl',items);
  assert.equal(strict.recommendations[0].plan,null);
  const milk=await recommendCatalogItems('Lidl',[item('skimmed milk',1000,'volume')],{allowReferencePrices:true});
  assert.match(milk.recommendations[0].plan.products[0].productName,/Dairy Mannor/);
});
test('all departments expose every published website identity, with current prices taking precedence', async () => {
  let page=await browseCatalog('Lidl',{scope:'all',allowReferencePrices:true,limit:100}),rows=[...page.results];
  while(page.nextOffset!==null){page=await browseCatalog('Lidl',{scope:'all',allowReferencePrices:true,limit:100,offset:page.nextOffset});rows.push(...page.results);}
  assert.equal(rows.length,page.total);assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);
  const byId=new Map(rows.map(row=>[row.id,row]));
  for(const product of snapshot.filter(row=>row.discoveryStatus!=='not_listed')) {
    const row=byId.get(String(product.id||product.sku||product.url));assert.ok(row,'missing '+product.name);
    if(productPriceUsable(product)){assert.equal(row.priceGBP,Number(product.price));assert.equal(row.estimatedPrice,false);}
  }
  assert.equal(page.verifiedProducts,snapshot.filter(row=>row.discoveryStatus!=='not_listed').length);
  assert.ok(rows.some(row=>row.category==='Household'&&row.estimatedPrice));
  const food=await browseCatalog('Lidl',{allowReferencePrices:true});assert.ok(food.total<page.total);
  assert.equal((await recommendCatalogItems('Lidl',[item('laundry cleanser')],{allowReferencePrices:true})).recommendations[0].plan,null);
});
test('reference offers can produce an explicitly estimated plan without relaxing nutrition or budget limits', async () => {
  const recipes=['Lunch','Dinner'].map((cat,index)=>({id:'bean-'+index,name:cat+' cannellini bowl',cat,servings:1,ings:[['Cannellini beans',240,'g']],nutrition:{kcal:400,p:30,c:40,f:5,complete:true}}));
  const request={profile:{supermarket:'Lidl',lidlReferencePrices:true,days:1,meals:2,calories:800,protein:50,budget:35,varietyMode:'Repeat favourites',repeatMeals:{Lunch:'bean-0',Dinner:'bean-1'}},recipes,week:[],pantry:[]};
  const result=await optimizeMealPlan(request);
  assert.equal(result.status,'feasible');assert.equal(result.basket.estimatedPrice,true);assert.ok(result.nutrition.days.every(day=>day.meetsTargets));
  assert.match(result.warnings.join(' '),/historical or undated/);
  const strict=await optimizeMealPlan({...request,profile:{...request.profile,lidlReferencePrices:false}});assert.notEqual(strict.status,'feasible');
  const tiny=await optimizeMealPlan({...request,profile:{...request.profile,budget:.01}});assert.notEqual(tiny.status,'feasible');
  const quote={store:'Lidl',refreshedAt:new Date().toISOString(),recommendations:result.basket.recommendations};
  const basket=globalThis.MealSwapCore.basket(quote,result.basket.items,'Lidl');assert.equal(basket.complete,true);assert.equal(basket.estimatedPrice,true);
});
