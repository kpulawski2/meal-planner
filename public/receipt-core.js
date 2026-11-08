/* Reviewed receipt observations. Images and payment details are never stored. */
(function(root){
 'use strict';
 const stores=['Lidl','Asda','Aldi'],units=['g','kg','ml','l','pieces'];
 const text=(v,max=200)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ').slice(0,max):'';
 const safeNote=(v,max=200)=>/card|mastercard|visa|\b(?:mid|tid|trns|vat|transaction|loyalty|account)\b/i.test(text(v))?'Check the original receipt for uncertain details.':text(v,max).replace(/\b(?:\d[ -]?){12,19}\b/g,'[removed]');
 const money=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=10000&&Math.abs(Number(v)*100-Math.round(Number(v)*100))<.00001?Math.round(Number(v)*100)/100:null;
 function hash(value){let a=2166136261,b=3339675911;for(const c of String(value)){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b^c.charCodeAt(0),16777619);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
 function line(raw={},index=0){
  const quantity=Number.isInteger(Number(raw.quantity))&&Number(raw.quantity)>0&&Number(raw.quantity)<=1000?Number(raw.quantity):null,total=money(raw.lineTotalGBP),printed=money(raw.unitPriceGBP);let unit=printed;
  if(raw.unitPriceGBP==null&&total!==null&&quantity&&Math.abs(Math.round(total/quantity*100)/100*quantity-total)<.011)unit=Math.round(total/quantity*100)/100;
  return {id:'line-'+index,name:text(raw.name),quantity,unitPriceGBP:unit,lineTotalGBP:total,ingredient:text(raw.ingredient,160),productName:text(raw.productName)||text(raw.name),packQuantity:raw.packQuantity!==null&&raw.packQuantity!==''&&Number.isFinite(Number(raw.packQuantity))&&Number(raw.packQuantity)>0?Number(raw.packQuantity):null,packUnit:units.includes(raw.packUnit)?raw.packUnit:'g',useInPlanning:raw.useInPlanning===true,warnings:(Array.isArray(raw.warnings)?raw.warnings:[]).map(v=>safeNote(v,180)).filter(Boolean).slice(0,4)};
 }
 function extraction(raw={}){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.items)||!raw.items.length||raw.items.length>80)throw new Error('No complete receipt item list was found. Try a clearer photo or paste receipt text.');
  if(raw.currency&&raw.currency!=='GBP')throw new Error('Use a UK receipt in pounds. Overseas prices cannot be saved as UK prices.');
  const financial=/^(?:card|cash|change|total|subtotal|vat|tax|mastercard|visa|mid\b|tid\b|trns\b|transaction|approved|contactless|verification|customer|loyalty)\b/i;
  const items=raw.items.filter(row=>!financial.test(text(row?.name))).map((row,i)=>line({...row,name:text(row?.name).replace(/\b(?:\d[ -]?){12,19}\b/g,'').trim()},i));if(!items.length||items.some(row=>!row.name))throw new Error('No readable grocery items were found. Try a clearer receipt image.');
  return {store:stores.includes(raw.store)?raw.store:'Lidl',currency:raw.currency||null,date:root.FoodLogCore?.validDate(raw.date)?raw.date:/^\d{4}-\d{2}-\d{2}$/.test(raw.date||'')?raw.date:null,totalGBP:money(raw.totalGBP),branch:text(raw.branch,160),items,warnings:(Array.isArray(raw.warnings)?raw.warnings:[]).map(v=>safeNote(v,200)).filter(Boolean).slice(0,10)};
 }
 function parseText(raw,{store='Lidl'}={}){
  if(typeof raw!=='string'||raw.length>18000)throw new Error('Paste up to 18,000 characters of receipt text.');if(/€|\bEUR\b/.test(raw))throw new Error('Use a UK receipt in pounds.');
  const items=[],warnings=[];let date=null,totalGBP=null,pending=null,discountNext=false;
  for(const source of raw.split(/\r?\n/)){
   const value=source.trim();if(!value)continue;const dateMatch=value.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})\b/);if(dateMatch){const y=dateMatch[3].length===2?'20'+dateMatch[3]:dateMatch[3];date=y+'-'+dateMatch[2].padStart(2,'0')+'-'+dateMatch[1].padStart(2,'0');}
   if(/^(?:price cut|discount|saving)\s*$/i.test(value)){discountNext=true;continue;}
   const weight=value.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\s*@/i);if(weight&&pending){pending.packQuantity=Number(weight[1].replace(',','.'));pending.packUnit=weight[2].toLowerCase();continue;}
   const price=value.match(/(?:£\s*)?(-?\d+[.,]\d{2})\s*[A-Z]?\s*$/);if(!price)continue;const amount=Number(price[1].replace(',','.'));
   if(/^(?:total|amount|card|cash|change|vat|tax|subtotal|balance)\b/i.test(value)){if(/^total\b/i.test(value))totalGBP=amount;continue;}
   if(amount<0){if(pending&&(discountNext||/price cut|discount|saving|coupon/i.test(value))){pending.lineTotalGBP=Math.round((pending.lineTotalGBP+amount)*100)/100;pending.unitPriceGBP=Math.round(pending.lineTotalGBP/pending.quantity*100)/100;pending.warnings.push('Includes the adjacent printed discount. Check the final price.');}else warnings.push('A discount could not be linked to an item. Check prices manually.');discountNext=false;continue;}
   const before=value.slice(0,price.index).replace(/\s+£?\s*$/,'').trim(),multi=before.match(/(\d+)\s*[x×]\s*£?\s*(\d+[.,]\d{2})/i),name=before.replace(/\s*\d+\s*[x×].*$/,'').trim();
   if(!name||/date:|time:|\b(?:mastercard|visa|mid:|tid:|trns|approved|contactless|verification)\b/i.test(name))continue;
   discountNext=false;pending={name,quantity:multi?Number(multi[1]):1,unitPriceGBP:multi?Number(multi[2].replace(',','.')):amount,lineTotalGBP:amount,warnings:[]};items.push(pending);
  }
  return extraction({store,currency:'GBP',date,totalGBP,items,warnings});
 }
 function normalizeLedger(raw,options){
  if(!Array.isArray(raw)||raw.length>40)throw new Error('Your receipt history is full or invalid. Export or remove an old receipt first.');
  return raw.map(receipt=>{
   if(!receipt||typeof receipt.id!=='string'||!/^receipt-[a-z0-9-]{8,100}$/i.test(receipt.id)||!stores.includes(receipt.store)||!root.PersonalPricesCore.validDate(receipt.date)||!Array.isArray(receipt.items)||receipt.items.length<1||receipt.items.length>80)throw new Error('A saved receipt needs review.');
   const items=receipt.items.map(line);if(items.some(row=>!row.name||row.unitPriceGBP===null||row.unitPriceGBP<=0))throw new Error('A receipt item needs a positive reviewed price.');
   return {id:receipt.id,store:receipt.store,date:receipt.date,branch:text(receipt.branch,160),currency:'GBP',totalGBP:money(receipt.totalGBP),fingerprint:text(receipt.fingerprint,100),savedAt:typeof receipt.savedAt==='string'&&Number.isFinite(Date.parse(receipt.savedAt))?receipt.savedAt:new Date().toISOString(),items,priceIds:items.filter(row=>row.useInPlanning&&receipt.store==='Lidl').map(row=>root.PersonalPricesCore.normalize({store:'Lidl',ingredient:row.ingredient,productName:row.productName,packQuantity:row.packQuantity,packUnit:row.packUnit,priceGBP:row.unitPriceGBP,checkedAt:receipt.date,source:'receipt',branch:receipt.branch||''},options).id)};
  });
 }
 function reviewed(raw,{now=new Date()}={}){
  if(raw.confirmed!==true)throw new Error('Review the items, quantities and prices before saving.');
  if(!stores.includes(raw.store)||raw.currency!=='GBP')throw new Error('Confirm the UK store and pounds currency.');
  if(!root.PersonalPricesCore.validDate(raw.date)||raw.date>root.PersonalPricesCore.today(now)||raw.date<'2000-01-01')throw new Error('Choose the receipt date, up to today.');
  if(!Array.isArray(raw.items)||!raw.items.length||raw.items.length>80)throw new Error('Review up to 80 receipt items at a time.');
  const items=raw.items.map(line),prices=[];
  for(const [index,row] of items.entries()){if(!row.name||!row.quantity||row.unitPriceGBP===null||row.unitPriceGBP<=0)throw new Error('Check the price for '+(row.name||'each receipt item')+'.');
   if(row.useInPlanning){if(raw.store!=='Lidl')throw new Error('Saved pack-price planning currently supports Lidl receipts. Other UK receipts can be kept for reference.');if(!row.ingredient||!row.packQuantity||!units.includes(raw.items[index]?.packUnit))throw new Error('Add an ingredient and confirmed pack size for '+row.name+', or save it for reference only.');prices.push(root.PersonalPricesCore.normalize({store:'Lidl',ingredient:row.ingredient,productName:row.productName,packQuantity:row.packQuantity,packUnit:row.packUnit,priceGBP:row.unitPriceGBP,checkedAt:raw.date,source:'receipt',branch:raw.branch||''},{now}));}
  }
  const fingerprint=hash(JSON.stringify([raw.store,raw.date,raw.totalGBP,items.map(row=>[row.name.toLowerCase(),row.quantity,row.unitPriceGBP])])),id='receipt-'+fingerprint;
  return {receipt:{id,fingerprint,store:raw.store,date:raw.date,branch:text(raw.branch,160),currency:'GBP',totalGBP:money(raw.totalGBP),savedAt:new Date(now).toISOString(),items},prices};
 }
 function save(raw,storage,options){
  const previous=root.PersonalPricesCore.read(storage,options);if(!previous.ok)throw new Error(previous.error);const {receipt,prices}=reviewed(raw,options),snapshot=structuredClone(previous.snapshot),ledger=snapshot.receipts||[];
  const replaced=raw.replaceId&&ledger.find(row=>row.id===raw.replaceId);if(raw.replaceId&&!replaced)throw new Error('That saved receipt changed. Reopen receipt history.');
  if(ledger.some(row=>row.id!==raw.replaceId&&(row.id===receipt.id||row.fingerprint===receipt.fingerprint)))throw new Error('This receipt is already saved. It has not been added again.');
  const others=ledger.filter(row=>row.id!==raw.replaceId),otherIds=new Set(others.flatMap(row=>row.priceIds||[]));
  const byId=new Map(snapshot.prices.filter(row=>!replaced?.priceIds?.includes(row.id)||otherIds.has(row.id)||row.checkedAt!==replaced.date||row.source!=='receipt').map(row=>[row.id,row]));for(const row of prices){const old=byId.get(row.id);if(!old||old.checkedAt<=row.checkedAt)byId.set(row.id,row);}
  snapshot.prices=[...byId.values()];snapshot.receipts=[{...receipt,id:replaced?.id||receipt.id,priceIds:prices.map(row=>row.id)},...others];if(prices.length)snapshot.includeInPlanning=true;
  const result=root.PersonalPricesCore.write(snapshot,storage,options);if(!result.ok)throw new Error(result.error);return {snapshot:result.snapshot,receipt,pricesSaved:prices.length};
 }
 function remove(id,storage,options){const current=root.PersonalPricesCore.read(storage,options);if(!current.ok)throw new Error(current.error);const snapshot=current.snapshot;if(!snapshot.receipts?.some(row=>row.id===id))throw new Error('That receipt is no longer saved.');snapshot.receipts=snapshot.receipts.filter(row=>row.id!==id);const result=root.PersonalPricesCore.write(snapshot,storage,options);if(!result.ok)throw new Error(result.error);return result.snapshot;}
 root.ReceiptCore=Object.freeze({remove,stores,units,money,hash,line,extraction,parseText,normalizeLedger,reviewed,save});
})(globalThis);
