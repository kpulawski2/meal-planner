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
  assert.equal(refs.length,143);
  assert.equal(refs.find(row=>row.storeSku==='1073').priceGBP,.99);
  assert.equal(refs.find(row=>row.storeSku==='1073').sourceDate,null);
  assert.equal(refs.find(row=>row.name==='Alesto Pecan Nuts').packQuantity,200);
  for(const change of [doc=>doc.sources[0].url='https://www.lidl.co.uk.evil.test/a.pdf',doc=>doc.sources[0].url='https://user@www.lidl.co.uk/static/assets/a.pdf',doc=>doc.references[0].priceGBP=-1,doc=>doc.references[0].packQuantity=0,doc=>doc.references[0].regions=['Republic of Ireland'],doc=>doc.references.push(doc.references[0]),doc=>doc.sources.at(-1).url='https://www.lidl.ie/static/assets/test.pdf',doc=>doc.references.at(-1).storeSku='1073',doc=>doc.references.at(-1).regions=[]]) {
    const bad=structuredClone(document);change(bad);assert.throws(()=>validatePriceReferences(bad));
  }
  assert.equal(productPriceUsable({store:'Lidl',price:.01,priceBasis:'reference',estimatedPrice:true}),false,'a reference flag cannot bypass evidence validation');
});
test('reference quantities use whole packs, retain UK regions, exclude variable weights and preserve pint capacity', () => {
  const beans=referenceProduct(refs.find(row=>row.name==='Freshona Cannellini Beans'));
  const plan=calculatePackPurchase([beans],500,'mass');
  assert.equal(plan.totalCostGBP,1.35);assert.equal(plan.products[0].packs,3);assert.equal(plan.totalQuantity,720);assert.equal(plan.estimatedPrice,true);
  assert.equal(plan.products[0].sourcePeriod,'May 2026');assert.equal(plan.products[0].priceCheckedAt,null);
  for(const ref of refs.filter(row=>row.packQuantity===null))assert.equal(calculatePackPurchase([referenceProduct(ref)],100,'mass'),null);
  for(const ref of refs.filter(row=>row.regions.length&&row.packQuantity!==null)) {
    const dimension=ref.packUnit==='pieces'?'count':['ml','pint'].includes(ref.packUnit)?'volume':'mass';
    const regional=calculatePackPurchase([referenceProduct(ref)],1,dimension);
    assert.ok(regional&&regional.estimatedPrice);assert.deepEqual(regional.products[0].referenceRegions,ref.regions);
  }
  const milk=referenceProduct(refs.find(row=>row.packUnit==='pint'));
  assert.equal(calculatePackPurchase([milk],1100,'volume').products[0].packs,1);
});
test('Northern Ireland oats and chicken references fill their UK estimate gaps without using member discounts or GB SKU joins', async () => {
  const result = await recommendCatalogItems('Lidl', [item('Oats', 1001), item('Chicken breast', 1100)], { allowReferencePrices: true });
  for (const [index, row] of result.recommendations.entries()) {
    assert.equal(row.confidence, 'high');
    assert.ok(row.plan.estimatedPrice);
    assert.equal(row.plan.products.length, 1);
    const product=row.plan.products[0];
    assert.equal(product.packQuantity,1000);assert.equal(product.packUnit,'g');assert.equal(product.packs,2);
    assert.deepEqual(product.referenceRegions,['Northern Ireland']);
    assert.match(product.priceSourceUrl,/^https:\/\/www\.lidl-ni\.co\.uk\/static\/assets\/[^/]+\.pdf$/);
    assert.equal(product.priceGBP,index?6.44:1.99);assert.equal(row.plan.totalCostGBP,index?12.88:3.98);
    assert.equal(product.sourceDate,index?'2025-07-03':null);
    assert.match(product.productName,index?/Chicken Breast Fillets/:/Organic Jumbo Porridge Oats/);
    const quote={store:'Lidl',refreshedAt:new Date().toISOString(),recommendations:[row]};
    const basket=globalThis.MealSwapCore.basket(quote,[{key:row.key,name:row.query,dimension:'mass',quantity:index?1100:1001}],'Lidl');
    assert.equal(basket.complete,true);assert.equal(basket.estimatedPrice,true);
  }
  assert.equal(refs.find(row=>row.id==='ni-chicken-breast-1kg').storeSku,null);
  assert.equal(refs.find(row=>row.id==='ni-organic-oats-1kg').storeSku,null);
});
test('the October shopping list preserves drained yields and cannot turn an oil-tuna net tin weight into edible recipe grams', () => {
  const corn = refs.find(row => row.id === 'oct2026-15');
  assert.equal(corn.sourceDate, '2026-10-12');
  assert.match(corn.packSize, /340g.*285g drained/);
  const purchase = calculatePackPurchase([referenceProduct(corn)], 500, 'mass');
  assert.equal(purchase.products[0].packs, 2);
  assert.equal(purchase.totalQuantity, 570);
  assert.equal(purchase.totalCostGBP, 1.1);
  const tuna = refs.find(row => row.id === 'oct2026-07');
  assert.equal(tuna.priceGBP, .65); assert.match(tuna.packSize, /145/);
  assert.equal(tuna.packQuantity, null);
  assert.equal(calculatePackPurchase([referenceProduct(tuna)], 150, 'mass'), null);
});
test('the newest dated exact mayonnaise pack is used ahead of an older observation', async () => {
  const result = await recommendCatalogItems('Lidl', [item('light mayonnaise', 500, 'mass')], { allowReferencePrices: true });
  const product = result.recommendations[0].plan.products[0];
  assert.equal(product.priceGBP, .89);
  assert.equal(product.sourceDate, '2026-10-12');
  assert.equal(product.estimatedQuantity, true);
  assert.match(product.quantityBasis, /density/);
});
test('dated vegetable and oil references use specific food shelves while strict callers keep their gaps', async () => {
  const requests = [item('Frozen mixed vegetables', 1001), item('Cooking oil', 500, 'volume')];
  const result = await recommendCatalogItems('Lidl', requests, { allowReferencePrices: true });
  const vegetables = result.recommendations[0].plan;
  assert.equal(vegetables.products[0].packs, 2); assert.equal(vegetables.totalCostGBP, 1.98);
  assert.equal(vegetables.products[0].sourceDate, '2026-10-12');
  const oil = result.recommendations[1].plan;
  assert.equal(oil.totalCostGBP, 4.19); assert.match(oil.products[0].productName, /Extra Virgin Olive Oil/);
  assert.equal(oil.products[0].sourceDate, '2023-02-06');
  const strict = await recommendCatalogItems('Lidl', requests);
  assert.ok(strict.recommendations.every(row => row.plan === null));
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
