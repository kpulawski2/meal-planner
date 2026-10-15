import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
const directory=await mkdtemp(path.join(os.tmpdir(),'meal-lidl-'));
process.env.LIDL_CATALOGUE_PATH=path.join(directory,'products.json');process.env.LIDL_CATALOGUE_META_PATH=path.join(directory,'metadata.json');
const rows=Array.from({length:120},(_,i)=>({store:'Lidl',id:String(10000000+i),name:i===0?'Milbona Semi Skimmed Milk':i===1?'Cucumber':i===2?'Birchwood Chicken Breast Fillets':`Grocery ${i}`,category:i===0?'Food & Drink > Cheese, Dairy & Eggs > Milk & Cream':i===1?'Food & Drink > Fruit & veg > Vegetables':i===2?'Food & Drink > Meat & Poultry > Chicken & Turkey':'Food & Drink > Food Cupboard',url:`https://www.lidl.co.uk/p/product/p${10000000+i}`,packQuantity:i===1?1:1000,packUnit:i===1?'pieces':i===0?'ml':'g',packSize:i===1?'Each':i===0?'1L':'1kg',price:i===0?null:i===1?.79:5,available:null,availability:'in_store_only',checkedAt:'2026-10-10T12:00:00Z'}));
Object.assign(rows[2],{priceSource:'Lidl GB official search listing',priceSourceUrl:'https://www.lidl.co.uk/q/query/Birchwood%20chicken',priceCheckedAt:new Date().toISOString()});
Object.assign(rows[0],{memberOffers:[{priceGBP:.79,label:'With Lidl Plus',validFrom:null,validThrough:null}]});
Object.assign(rows[1],{menuCategoryIds:['10071012','10095593'],memberOffers:[{priceGBP:.49,label:'With Lidl Plus',validFrom:null,validThrough:null}]});
const raw=JSON.stringify(rows);
const metadata={menu_status:'complete',menu_categories:[{id:'10071012',name:'Fruit & veg',url:'https://www.lidl.co.uk/h/fruit/h10071012',parent:null,productsChecked:1},{id:'10095593',name:'Vegetables',url:'https://www.lidl.co.uk/h/veg/h10095593',parent:'https://www.lidl.co.uk/h/fruit/h10071012',productsChecked:1}],store:'Lidl',status:'complete',products_saved:120,products_expected:120,coverage:1,coverage_scope:'official_sitemap_products',entire_store_inventory:false,with_price:119,price_coverage:119/120,refreshed_at:'2026-10-10T12:00:00Z',products_file_sha256:createHash('sha256').update(raw).digest('hex')};
await writeFile(process.env.LIDL_CATALOGUE_PATH,raw);await writeFile(process.env.LIDL_CATALOGUE_META_PATH,JSON.stringify(metadata));
const catalog=await import('./catalog-adapter.js');
const {optimizeMealPlan}=await import('./budget-planner.js');
test.after(()=>rm(directory,{recursive:true,force:true}));
test('Lidl loads a complete validated snapshot and matches plain produce and milk',async()=>{
  const status=await catalog.catalogueStatus('Lidl');assert.equal(status.healthy,true);assert.equal(status.products_saved,120);assert.equal(status.entire_store_inventory,false);
  const result=await catalog.recommendCatalogItems('Lidl',[{key:'milk',name:'Milk',dimension:'volume',quantity:1000},{key:'cucumber',name:'Cucumber',dimension:'mass',quantity:300},{key:'chicken',name:'Chicken breast',dimension:'mass',quantity:1500}]);
  assert.equal(result.store,'Lidl');assert.equal(result.recommendations[0].match.productName,'Milbona Semi Skimmed Milk');assert.equal(result.recommendations[0].plan,null);
  assert.equal(result.recommendations[1].match.productName,'Cucumber');assert.equal(result.recommendations[1].plan.totalCostGBP,.79);
  assert.equal(result.recommendations[2].plan.totalCostGBP,10);assert.ok(result.recommendations[2].plan.products.every(p=>p.url.includes('www.lidl.co.uk')));
  const evidence={priceSource:rows[2].priceSource,priceSourceUrl:rows[2].priceSourceUrl,priceCheckedAt:rows[2].priceCheckedAt};
  for(const row of [result.recommendations[2].match,...result.recommendations[2].plan.products,await catalog.fetchProductPage('Lidl',rows[2].url),...(await catalog.searchCatalog('Lidl','Chicken breast')).results]) {
    for(const [field,value] of Object.entries(evidence)) assert.equal(row[field],value);
  }
  assert.equal(result.recommendations[1].match.priceSource,'Lidl GB official product page');
  assert.equal(result.recommendations[1].match.priceSourceUrl,rows[1].url);
});
test('website menu filtering and member offers do not change public budget prices',async()=>{
  const page=await catalog.browseCatalog('Lidl',{menu:'10095593',price:'member',source:'products'});
  assert.equal(page.matched,1);assert.equal(page.results[0].productName,'Cucumber');assert.equal(page.results[0].priceGBP,.79);assert.equal(page.results[0].memberOffers[0].priceGBP,.49);
  assert.equal(page.websiteMenu.length,2);assert.equal(page.menuCheckedAt,metadata.refreshed_at);
  assert.equal((await catalog.browseCatalog('Lidl',{menu:'no-such-menu'})).matched,0);
  const milk=await catalog.recommendCatalogItems('Lidl',[{key:'milk',name:'Milk',dimension:'volume',quantity:1000}]);assert.equal(milk.recommendations[0].plan,null,'a member-only number cannot fill an unpublished public price');
});
test('Lidl budget retains saved meals when milk has no published price',async()=>{
  const recipes=[{id:'lunch',name:'Milk lunch',cat:'Lunch',servings:1,ings:[['Milk',1000,'ml']],nutrition:{kcal:400,p:40,complete:true}},{id:'dinner',name:'Chicken dinner',cat:'Dinner',servings:1,ings:[['Chicken breast',100,'g']],nutrition:{kcal:400,p:40,complete:true}}];
  const week=[{day:'Monday',meals:['lunch','dinner']}];
  const result=await optimizeMealPlan({profile:{supermarket:'Lidl',days:1,meals:2,people:1,calories:800,protein:80,budget:45},recipes,week,pantry:[],locked:{}});
  assert.equal(result.store,'Lidl');assert.equal(result.status,'unavailable');assert.equal(result.basket.complete,false);assert.equal(result.basket.totalCostGBP,null);assert.deepEqual(result.week,week);assert.match(result.warnings[0],/Lidl does not publish prices/);
});
test('expired, future, regional and member-only substitutes are excluded',()=>{
  const base={...rows[2],price:1,priceSource:'Lidl GB official product page'};const now=new Date('2026-10-10T12:00:00Z');
  assert.equal(catalog.productPriceUsable({...base,validFrom:'2026-10-11T00:00:00Z'},now),false);
  assert.equal(catalog.productPriceUsable({...base,validThrough:'2026-10-10T11:00:00Z'},now),false);
  assert.equal(catalog.productPriceUsable({...base,validThrough:'2026-10-10'},now),true);
  assert.equal(catalog.productPriceUsable({...base,regionRestricted:true},now),false);
  assert.equal(catalog.productPriceUsable({...base,price:null},now),false);
  assert.equal(catalog.productPriceUsable({...base,priceMemberOnly:true},now),false);
  assert.equal(catalog.productPriceUsable({...base,offer:{validForMemberTier:'Lidl Plus'}},now),false);
  assert.equal(catalog.productPriceUsable({...base,memberOffersAvailable:true},now),true);
  assert.equal(catalog.rankCatalogCandidates('Lighter than light mayonnaise',[{name:'Light Mayonnaise',price:1,category:'Food Cupboard > Condiments'},{name:'Hellmanns Lighter Than Light Mayonnaise',price:2,category:'Food Cupboard > Condiments'}])[0].product.name,'Hellmanns Lighter Than Light Mayonnaise');
  assert.equal(catalog.rankCatalogCandidates('Milk',[{...rows[0],category:'Home > Decorations',name:'Milk Decorative Jar'}]).length,0);
  assert.equal(catalog.rankCatalogCandidates('Milk',[{...rows[0],category:'Food & Drink > Confectionery & Snacks > Chocolate & Chocolate Bars',name:'MALTESERS Milk Reindeers',price:1.45,packQuantity:59,packUnit:'g'}]).length,0);
  assert.equal(catalog.rankCatalogCandidates('Chicken breast',[{...rows[2],name:'Birchwood Lean Turkey Breast Mince 2% Fat'}]).length,0);
  assert.equal(catalog.rankCatalogCandidates('Chicken breast',[{...rows[2],name:'Deluxe Whole Chicken'}]).length,0);
});
test('supplementary search prices require recent verified official evidence',()=>{
  const now=new Date('2026-10-10T12:00:00Z');
  const base={...rows[2],priceCheckedAt:'2026-10-10T11:00:00Z'};
  assert.equal(catalog.productPriceUsable(base,now),true);
  assert.equal(catalog.productPriceUsable({...base,priceCheckedAt:'2026-10-08T12:00:00Z'},now),true);
  for(const priceCheckedAt of [null,'','2026-10-08T11:59:59Z','2026-10-10T12:00:01Z','not a date','2026-10-10']) {
    assert.equal(catalog.productPriceUsable({...base,priceCheckedAt},now),false,String(priceCheckedAt));
  }
  for(const priceSourceUrl of [null,'https://example.com/q/query/chicken','https://www.lidl.co.uk.example.com/q/query/chicken','http://www.lidl.co.uk/q/query/chicken','https://user@www.lidl.co.uk/q/query/chicken','https://www.lidl.co.uk:444/q/query/chicken']) {
    assert.equal(catalog.productPriceUsable({...base,priceSourceUrl},now),false,String(priceSourceUrl));
  }
  assert.equal(catalog.productPriceUsable({...base,priceSource:'Estimated price'},now),false);
  assert.equal(catalog.productPriceUsable({...base,priceSource:'Lidl GB official product page',priceCheckedAt:'2020-01-01T00:00:00Z'},now),true);
});
test('leaflet prices require a current explicit offer window and recent official evidence',()=>{
  const now=new Date('2026-10-10T12:00:00Z');
  const base={...rows[2],priceSource:'Lidl GB official leaflet',priceSourceUrl:'https://www.lidl.co.uk/l/en/online-leaflets/weekly-offers/ar/0',priceCheckedAt:'2026-10-10T11:00:00Z',validFrom:'2026-10-10',validThrough:'2026-10-10'};
  assert.equal(catalog.productPriceUsable(base,now),true);
  for(const priceSourceUrl of ['https://endpoints.leaflets.schwarz/v4/flyer','https://assets.leaflets.schwarz/weekly.pdf','https://lidl.leaflets.schwarz/']) assert.equal(catalog.productPriceUsable({...base,priceSourceUrl},now),true);
  for(const change of [{validFrom:null},{validThrough:null},{validFrom:'2026-10-11'},{validThrough:'2026-10-09'},{priceCheckedAt:'2026-10-08T11:59:59Z'},{priceMemberOnly:true},{regionRestricted:true},{priceSourceUrl:'https://example.com/leaflet.pdf'}]) {
    assert.equal(catalog.productPriceUsable({...base,...change},now),false,JSON.stringify(change));
  }
  assert.equal(catalog.productPriceUsable({...base,validFrom:null,validThrough:null,offer:{validFrom:'2026-10-10',validThrough:'2026-10-10'}},now),true);
});
test('uncertain Lidl pack quantities stay excluded from purchase plans',()=>{
  const base={...rows[2],priceSource:'Lidl GB official product page',price:1};
  for(const packSize of ['70/85g','1.2kg - 1.6kg','1kg']) {
    assert.equal(catalog.calculatePackPurchase([{product:{...base,packSize,packQuantity:null,packUnit:null}}],100,'mass'),null,packSize);
  }
  assert.equal(catalog.calculatePackPurchase([{product:base}],100,'mass').totalCostGBP,1);
});
test('newly priced fish in sauce cannot replace a plain recipe ingredient',()=>{
  const products=[{...rows[2],name:'Cod Fillet in Butter Sauce',category:'Food & Drink > Frozen > Frozen Fish & Seafood'},
    {...rows[2],name:'Cod Fillets in Parsley Sauce',category:'Food & Drink > Frozen > Frozen Fish & Seafood'},
    {...rows[2],name:'Cod Fillets',category:'Food & Drink > Frozen > Frozen Fish & Seafood'}];
  assert.deepEqual(catalog.rankCatalogCandidates('Cod fillet',products).map(row=>row.product.name),['Cod Fillets']);
});
test('corrupted or mismatched generations are not loaded as a healthy catalogue',async()=>{
  await catalog.clearCatalogCache('Lidl');await writeFile(process.env.LIDL_CATALOGUE_PATH,JSON.stringify(rows.slice(1)));
  assert.equal((await catalog.catalogueStatus('Lidl')).healthy,false);await assert.rejects(catalog.recommendCatalogItems('Lidl',[{key:'milk',name:'Milk',dimension:'volume',quantity:1000}]),/same validated refresh/);
});
