import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
const directory=await mkdtemp(path.join(os.tmpdir(),'meal-lidl-'));
process.env.LIDL_CATALOGUE_PATH=path.join(directory,'products.json');process.env.LIDL_CATALOGUE_META_PATH=path.join(directory,'metadata.json');
const rows=Array.from({length:120},(_,i)=>({store:'Lidl',id:String(10000000+i),name:i===0?'Milbona Semi Skimmed Milk':i===1?'Cucumber':i===2?'Birchwood Chicken Breast Fillets':`Grocery ${i}`,category:i===0?'Food & Drink > Cheese, Dairy & Eggs > Milk & Cream':i===1?'Food & Drink > Fruit & veg > Vegetables':i===2?'Food & Drink > Meat & Poultry > Chicken & Turkey':'Food & Drink > Food Cupboard',url:`https://www.lidl.co.uk/p/product/p${10000000+i}`,packQuantity:i===1?1:1000,packUnit:i===1?'pieces':i===0?'ml':'g',packSize:i===1?'Each':i===0?'1L':'1kg',price:i===0?null:i===1?.79:5,available:null,availability:'in_store_only',checkedAt:'2026-10-10T12:00:00Z'}));
const raw=JSON.stringify(rows);
const metadata={store:'Lidl',status:'complete',products_saved:120,products_expected:120,coverage:1,coverage_scope:'official_sitemap_products',entire_store_inventory:false,with_price:119,price_coverage:119/120,refreshed_at:'2026-10-10T12:00:00Z',products_file_sha256:createHash('sha256').update(raw).digest('hex')};
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
});
test('Lidl budget retains saved meals when milk has no published price',async()=>{
  const recipes=[{id:'lunch',name:'Milk lunch',cat:'Lunch',servings:1,ings:[['Milk',1000,'ml']],nutrition:{kcal:400,p:40,complete:true}},{id:'dinner',name:'Chicken dinner',cat:'Dinner',servings:1,ings:[['Chicken breast',100,'g']],nutrition:{kcal:400,p:40,complete:true}}];
  const week=[{day:'Monday',meals:['lunch','dinner']}];
  const result=await optimizeMealPlan({profile:{supermarket:'Lidl',days:1,meals:2,people:1,calories:800,protein:80,budget:45},recipes,week,pantry:[],locked:{}});
  assert.equal(result.store,'Lidl');assert.equal(result.status,'unavailable');assert.equal(result.basket.complete,false);assert.equal(result.basket.totalCostGBP,null);assert.deepEqual(result.week,week);assert.match(result.warnings[0],/Lidl does not publish prices/);
});
test('expired, future, regional and member-only substitutes are excluded',()=>{
  const base={...rows[2],price:1};const now=new Date('2026-10-10T12:00:00Z');
  assert.equal(catalog.productPriceUsable({...base,validFrom:'2026-10-11T00:00:00Z'},now),false);
  assert.equal(catalog.productPriceUsable({...base,validThrough:'2026-10-10T11:00:00Z'},now),false);
  assert.equal(catalog.productPriceUsable({...base,validThrough:'2026-10-10'},now),true);
  assert.equal(catalog.productPriceUsable({...base,regionRestricted:true},now),false);
  assert.equal(catalog.productPriceUsable({...base,price:null},now),false);
  assert.equal(catalog.rankCatalogCandidates('Lighter than light mayonnaise',[{name:'Light Mayonnaise',price:1,category:'Food Cupboard > Condiments'},{name:'Hellmanns Lighter Than Light Mayonnaise',price:2,category:'Food Cupboard > Condiments'}])[0].product.name,'Hellmanns Lighter Than Light Mayonnaise');
  assert.equal(catalog.rankCatalogCandidates('Milk',[{...rows[0],category:'Home > Decorations',name:'Milk Decorative Jar'}]).length,0);
  assert.equal(catalog.rankCatalogCandidates('Milk',[{...rows[0],category:'Food & Drink > Confectionery & Snacks > Chocolate & Chocolate Bars',name:'MALTESERS Milk Reindeers',price:1.45,packQuantity:59,packUnit:'g'}]).length,0);
  assert.equal(catalog.rankCatalogCandidates('Chicken breast',[{...rows[2],name:'Birchwood Lean Turkey Breast Mince 2% Fat'}]).length,0);
});
test('corrupted or mismatched generations are not loaded as a healthy catalogue',async()=>{
  await catalog.clearCatalogCache('Lidl');await writeFile(process.env.LIDL_CATALOGUE_PATH,JSON.stringify(rows.slice(1)));
  assert.equal((await catalog.catalogueStatus('Lidl')).healthy,false);await assert.rejects(catalog.recommendCatalogItems('Lidl',[{key:'milk',name:'Milk',dimension:'volume',quantity:1000}]),/same validated refresh/);
});
