import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

test('current Lidl browsing and purchase matching exclude retained removed identities',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'lidl-removed-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const rows=Array.from({length:120},(_,index)=>({id:String(10000000+index),sku:String(10000000+index),store:'Lidl',name:'Kitchen accessory '+index,url:'https://www.lidl.co.uk/p/item-'+index+'/p'+(10000000+index),category:'Kitchen & Household > Accessories',price:null,currency:'GBP',packQuantity:1,packUnit:'pieces',discoveryStatus:'listed'}));
 Object.assign(rows[0],{name:'Fresh Porridge Oats',category:'Food & Drink > Food Cupboard > Cereals',price:.85,packQuantity:500,packUnit:'g'});
 Object.assign(rows[1],{name:'Retired Porridge Oats',category:'Food & Drink > Food Cupboard > Cereals',price:.49,packQuantity:500,packUnit:'g',discoveryStatus:'not_listed'});
 Object.assign(rows[2],{name:'Skimmed Milk',category:'Food & Drink > Cheese, Dairy & Eggs',packQuantity:1,packUnit:'l'});
 Object.assign(rows[3],{name:'£25 JustEat Gift Card',category:'Food & Drink > Ready meals > Chilled Ready Meals',price:25});
 const raw=JSON.stringify(rows)+'\n';process.env.LIDL_CATALOGUE_PATH=join(dir,'products.json');process.env.LIDL_CATALOGUE_META_PATH=join(dir,'meta.json');
 await writeFile(process.env.LIDL_CATALOGUE_PATH,raw);await writeFile(process.env.LIDL_CATALOGUE_META_PATH,JSON.stringify({status:'complete',products_saved:120,products_expected:120,coverage:1,refreshed_at:new Date().toISOString(),products_file_sha256:createHash('sha256').update(raw).digest('hex')}));
 const {browseCatalog,searchCatalog,recommendCatalogItems,productPriceUsable}=await import('./catalog-adapter.js');
 assert.equal(productPriceUsable(rows[1]),false);
 const directory=await browseCatalog('Lidl',{source:'products'});assert.equal(directory.verifiedProducts,2);assert.equal(directory.matched,2);assert.ok(directory.results.every(row=>row.id!==rows[1].id));assert.equal(directory.results.find(row=>row.id===rows[2].id).priceGBP,null);
 const found=await searchCatalog('Lidl','Oats');assert.ok(found.results.length);assert.ok(found.results.every(row=>row.productName!=='Retired Porridge Oats'));
 assert.deepEqual((await searchCatalog('Lidl','JustEat')).results,[]);
 const basket=await recommendCatalogItems('Lidl',[{key:'oats',name:'Oats',quantity:1000,dimension:'mass'}]);assert.equal(basket.recommendations[0].plan.totalCostGBP,1.7);assert.equal(basket.recommendations[0].match.productName,'Fresh Porridge Oats');
});
