/* Actual purchases are confirmed by the shopper, independently of online quotes. */
(function(root){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const canonical=value=>root.MealBudgetCore.canonicalIngredientName(value);
 const numeric=value=>typeof value==='number'||typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value.trim())?Number(value):NaN;
 const amount=value=>Number(value.toFixed(6));
 const storageFor=name=>/frozen/i.test(name)?'Freezer':/skyr|yoghurt|yogurt|milk|cheese|chicken|beef|pork|fish|salmon/i.test(name)&&!/uht|tinned|canned/i.test(name)?'Fridge':'Pantry';
 const newId=()=>root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 function draft({state,entries=[],basket={},store,personalPrices=[]},now=new Date()){
  root.PantryCore.initialise(state,now);
  if(!['Asda','Lidl','Aldi'].includes(store))return {ok:false,error:'Choose a supported supermarket.'};
  const selected=entries.filter(([key,item])=>state.shopping?.[key]||state.shopping?.[item.name]);
  if(!selected.length)return {ok:false,error:'Tick the items you bought first.'};
  const lines=[];
  for(const [key,item] of selected){
   const groups=Object.entries(item.groups||{}).filter(([,g])=>Number(g.remaining)>0);
   for(const [dimension,group] of groups.length?groups:[['',{}]]){
    const at=basket.items?.findIndex(row=>row.key===key+'::'+dimension&&Math.abs(row.quantity-group.remaining)<1e-6),result=at>=0?basket.results?.[at]:null;
    const saved=store==='Lidl'?personalPrices.filter(p=>canonical(p.ingredient)===canonical(item.name)).sort((a,b)=>b.checkedAt.localeCompare(a.checkedAt)).find(p=>root.PersonalPricesCore?.purchaseQuantity(p,dimension)):null;
    const products=saved?[{productName:saved.productName,packQuantity:saved.packQuantity,packUnit:saved.packUnit,packs:Math.max(1,Math.ceil((group.remaining||0)/root.PersonalPricesCore.purchaseQuantity(saved,dimension).capacity)),personal:saved}]:result?.plan?.products?.filter(p=>!['aldi_estimate','other_store'].includes(p.priceBasis)&&numeric(p.packQuantity)>0&&Number.isSafeInteger(p.packs)&&p.packs>0)||[];
    for(const product of products.length?products:[{}]){
     let size=product.packQuantity||'',unit=product.packUnit|| (dimension==='volume'?'ml':dimension==='each'?'pieces':'g'),estimated=false;
     if(['each','piece','pcs','pc','count'].includes(unit))unit='pieces';
     if(!['g','kg','ml','l','pieces'].includes(unit)){unit=dimension==='volume'?'ml':dimension==='each'?'pieces':'g';size='';}
     if(size&&numeric(product.totalQuantity)>0&&product.quantityBasis){
      const native=root.MealBudgetCore.unitMeta(unit,item.name);
      if(native.dim!==dimension||Math.abs(native.factor*size*product.packs-product.totalQuantity)>.001){
       size=amount(product.totalQuantity/product.packs);unit=dimension==='each'?'pieces':dimension==='volume'?'ml':'g';estimated=product.estimatedQuantity===true;
      }
     }
     lines.push({id:String(lines.length),key,name:item.name,dimension,productName:product.productName||item.name,packs:product.packs||1,
      packQuantity:size,packUnit:unit,estimated,quantityNote:estimated?product.quantityBasis:'',
      paidGBP:product.personal?amount(product.packs*product.personal.priceGBP):'',suggestedPriceGBP:product.personal?null:product.costGBP??null,
      place:product.storage==='Freezer'?'Freezer':storageFor(item.name+' '+(product.productName||'')),expiry:'',include:true});
    }
   }
  }
  return {ok:true,id:newId(),context:root.PantryCore.revision(state),store,lines,createdAt:new Date(now).toISOString()};
 }
 function validate(draft,lines,purchasedOn,now=new Date()){
  if(!draft?.ok||!Array.isArray(lines)||lines.length!==draft.lines.length||lines.length>300)return {ok:false,error:'Open the shopping confirmation again.'};
  if(!root.PersonalPricesCore.validDate(purchasedOn)||purchasedOn>root.PantryCore.today(now))return {ok:false,error:'Enter the actual purchase date, up to today.'};
  const lots=[],keys=new Set();let cents=0,known=true;
  for(let i=0;i<lines.length;i++){
   const row=lines[i],original=draft.lines[i];if(row.id!==original.id)return {ok:false,error:'The purchase rows changed. Open the confirmation again.'};
   if(row.include===false)continue;
   const quantity=numeric(row.packQuantity),packs=numeric(row.packs),paid=row.paidGBP===''||row.paidGBP==null?null:numeric(row.paidGBP);
   if(!Number.isSafeInteger(packs)||packs<1||packs>10000||!(quantity>0)||quantity>1000000||quantity*packs>10000000)return {ok:false,error:original.name+': enter the packs bought and usable amount in each pack.'};
   if(!['g','kg','ml','l','pieces'].includes(row.packUnit)||row.packUnit==='pieces'&&!Number.isSafeInteger(quantity))return {ok:false,error:original.name+': choose a valid unit; pieces must be whole numbers.'};
   if(paid!==null&&(!Number.isFinite(paid)||paid<0||paid>100000||Math.abs(paid*100-Math.round(paid*100))>1e-6))return {ok:false,error:original.name+': enter the total paid for this line in pounds and pence, or leave it blank.'};
   if(!['Pantry','Fridge','Freezer'].includes(row.place)||row.expiry&&!root.PersonalPricesCore.validDate(row.expiry))return {ok:false,error:original.name+': check the storage location or expiry date.'};
   const name=String(row.name||original.name).trim(),productName=String(row.productName||'').trim();if(!name||name.length>160||!productName||productName.length>200||/[\u0000-\u001f\u007f]/.test(name+productName))return {ok:false,error:original.name+': enter an ingredient and product name.'};
   if(paid===null)known=false;else cents+=Math.round(paid*100);
   keys.add(original.key);
   const estimated=original.estimated===true&&quantity===Number(original.packQuantity)&&row.packUnit===original.packUnit;
   lots.push({name,qty:amount(quantity*packs),unit:row.packUnit,place:row.place,expiry:row.expiry||'',store:draft.store,estimated,quantityBasis:estimated?original.quantityNote:null,
    purchaseSource:'shopper_confirmed',purchaseDate:purchasedOn,product:{name:productName,url:null,packs,packQuantity:quantity,packUnit:row.packUnit,
     packSize:quantity+' '+row.packUnit,priceGBP:paid===null?null:paid/packs,costGBP:paid,checkedAt:purchasedOn,source:'receipt_or_shopper_confirmation'}});
  }
  if(!lots.length)return {ok:false,error:'Include at least one item you bought.'};
  return {ok:true,lots,rows:[...keys],knownSubtotalGBP:cents/100,totalCostGBP:known?cents/100:null,purchasedOn,store:draft.store};
 }
 function commit(state,draft,lines,purchasedOn,now=new Date()){
  if(!draft?.ok||!state.pantryLedger||draft.context!==root.PantryCore.revision(state))return {ok:false,error:'Your shopping list or stock changed. Reopen the purchase confirmation; nothing was added.'};
  const data=validate(draft,lines,purchasedOn,now);if(!data.ok)return data;
  const key='confirmed-purchase:'+draft.id,ledger=state.pantryLedger;
  if(ledger.purchaseKeys.includes(key))return {ok:false,error:'This purchase has already been added.'};
  const nextId=kind=>kind+':'+new Date(now).getTime()+':'+(++ledger.sequence);
  const transaction={id:nextId('purchase'),type:'purchase',source:'shopper_confirmed',planId:ledger.planId,createdAt:new Date(now).toISOString(),purchaseDate:purchasedOn,
   store:draft.store,totalCostGBP:data.totalCostGBP,knownSubtotalGBP:data.knownSubtotalGBP,purchaseKey:key,changes:[]};
  for(const raw of data.lots){const lot={...clone(raw),id:nextId('lot'),purchasedAt:transaction.createdAt,transactionId:transaction.id};state.pantry.push(lot);transaction.changes.push({collection:'pantry',id:lot.id,before:null,after:clone(lot)});}
  ledger.purchaseKeys.push(key);ledger.transactions.push(transaction);
  for(const rowKey of data.rows){delete state.shopping[rowKey];for(const lot of data.lots)if(canonical(lot.name)===rowKey)delete state.shopping[lot.name];}
  return {ok:true,transaction,lots:data.lots};
 }
 root.PurchaseRecordCore=Object.freeze({draft,validate,commit});
})(globalThis);
