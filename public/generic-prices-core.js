/* Planning allowances, never retailer listings or observed shelf prices. */
(function(root){
 'use strict';
 const stores=['Asda','Lidl','Aldi'];
 function pack(ingredient,dimension,store){
  const name=String(ingredient||'').trim().replace(/\s+/g,' '),dim=dimension==='each'?'count':dimension;
  if(!name||!stores.includes(store)||!['mass','volume','count','slice','portion'].includes(dim))return null;
  const text=name.toLowerCase();let quantity=dim==='mass'?500:dim==='volume'?1000:dim==='count'?6:dim==='slice'?20:1;
  let price=dim==='mass'?3:dim==='volume'?3:dim==='count'?3:dim==='slice'?1.5:1;
  if(dim==='mass'){
   if(/chicken|turkey|pork/.test(text))price=4;
   else if(/beef|steak|salmon|prawn|fish|tuna/.test(text))price=6;
   else if(/protein powder|whey|nuts|almond|spice|seasoning|cocoa/.test(text))price=8;
   else if(/banana|carrot|potato|onion/.test(text))price=1;
   else if(/oats|rice|pasta|flour|lentil|beans/.test(text))price=1.25;
   else if(/berry|berries|fruit|vegetable|pepper|broccoli/.test(text))price=2.5;
   else if(/yoghurt|yogurt|skyr|quark/.test(text))price=2;
  }
  if(dim==='volume'&&/milk/.test(text))price=1.5;
  if(dim==='count'&&/egg/.test(text))price=1.5;
  const unit=dim==='mass'?'g':dim==='volume'?'ml':dim==='slice'?'slices':dim==='portion'?'portions':'pieces';
  return {name,store,dimension:dim,packQuantity:quantity,packUnit:unit,priceGBP:price,url:'estimate:'+store.toLowerCase()+'/'+encodeURIComponent(name.toLowerCase())+'/'+dim};
 }
 function productMatches(product,{store,ingredient,dimension}={}){
  const expected=pack(ingredient,dimension,store);
  if(!expected||!product||product.priceBasis!=='generic_estimate'||product.estimatedPrice!==true||product.url!==expected.url||product.priceGBP!==expected.priceGBP||product.packQuantity!==expected.packQuantity||product.packUnit!==expected.packUnit||product.productName!==expected.name+' (planning estimate)'||product.sourceStore!==null||product.priceSourceUrl!==null)return false;
  if(product.packs!==undefined){if(!Number.isSafeInteger(product.packs)||product.packs<=0||!Number.isFinite(product.costGBP)||!Number.isFinite(product.totalQuantity)||Math.abs(product.costGBP-product.packs*expected.priceGBP)>.00001||Math.abs(product.totalQuantity-product.packs*expected.packQuantity)>.00001)return false;}
  return true;
 }
 root.GenericPricesCore=Object.freeze({pack,productMatches});
})(globalThis);
