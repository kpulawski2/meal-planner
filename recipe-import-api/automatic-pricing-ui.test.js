import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const personalCore=await readFile(new URL('../public/personal-prices-core.js',import.meta.url),'utf8');
const retailerSources=await readFile(new URL('../public/retailer-price-sources.js',import.meta.url),'utf8');
function sourceBlock(start,end){
  const from=html.indexOf(start),to=html.indexOf(end,from+start.length);
  assert.ok(from>=0&&to>from,'Pricing source exists: '+start);
  return html.slice(from,to);
}
const source=[
  sourceBlock('function migrateAutomaticPricing()','function save()'),
  sourceBlock('function canonicalIngredientName(','function buildShopping()'),
  sourceBlock('let automaticCatalogState=','// Manual product-reference catalogue'),
  sourceBlock('function exportPriceReferenceCsv()','function renderShop()'),
  sourceBlock('function shoppingListText()','function copyShoppingFallback('),
].join('\n');
const item=(name,quantity,dimension='mass')=>[name.toLowerCase(),{name,c:'Dairy',groups:{[dimension]:{remaining:quantity,label:dimension==='volume'?'ml':dimension==='each'?'pieces':'g'}},pantryNotes:[]}];
function recommendation(row,price=1.65,packQuantity=2000,packUnit='ml'){
  const packs=Math.ceil(row.quantity/packQuantity);
  const product={productName:'ASDA Semi Skimmed Milk',url:'https://www.asda.com/groceries/product/milk/asda-semi-skimmed-milk/1',packs,packQuantity,packUnit,packSize:packQuantity+' '+packUnit,priceGBP:price,costGBP:packs*price};
  return {key:row.key,confidence:'high',match:{...product,checkedAt:'2026-10-09',priceRegion:'Great Britain'},plan:{requestedQuantity:row.quantity,totalQuantity:packs*packQuantity,leftoverQuantity:packs*packQuantity-row.quantity,totalCostGBP:packs*price,products:[product]}};
}
function harness(entries=[item('Milk',1500,'volume')],options={}){
  let now=Date.now(),requests=0,exportedBlob=null;const requestBodies=[];
  const rendered=[],views=[];
  const state={shoppingStore:'Asda',profile:{supermarkets:['Asda'],supermarket:'Asda',budget:45},week:[{day:'Monday',meals:[]}],shopping:{},packQuotes:{Asda:{milk:{volume:{price:999,size:1,unit:'ml'}}}},...options.state};
  const context={
    hadSavedProfile:true,state,SUPPORTED_STORES:['Asda','Lidl','Aldi'],RETAILER_NAMES:['Asda','Lidl','Aldi'],AbortController,DOMException,console,Blob,setTimeout:options.fastTimers?((fn,ms)=>setTimeout(fn,ms>=45000?250:0)):setTimeout,clearTimeout,
    Date:class extends Date {static now(){return now}},
    fetch:async(url,request)=>{
      requests++;
      if(options.responseStatus)return {ok:false,status:options.responseStatus,text:async()=>''};
      requestBodies.push(JSON.parse(request.body));const rows=JSON.parse(request.body).items;
      const recommendations=options.respond?options.respond(rows):rows.map(row=>recommendation(row));
      return {ok:true,status:200,text:async()=>JSON.stringify({store:JSON.parse(request.body).store,recommendations})};
    },
    window:{addEventListener(){}},
    document:{hidden:false,addEventListener(){},querySelector(){return {id:options.activeView||'shop'}},body:{appendChild(){}},createElement(){return {click(){},remove(){}}}},
    URL:class extends URL {static createObjectURL(blob){exportedBlob=blob;return 'blob:export'}static revokeObjectURL(){}},
    buildShopping:()=>Object.fromEntries(entries),planCashSpent:()=>0,planCashKnown:()=>true,save(){},toast(){},
    fmt:value=>Math.round(Number(value)*10)/10,
    escape:value=>String(value).replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char])),
    shoppingQtyLabel:row=>Object.values(row.groups).map(group=>group.remaining+' '+group.label).join(', '),
    renderShop:()=>rendered.push(context.readPlanner()),
    renderHome:()=>views.push({view:'home',status:context.readState().status,text:context.readRecipeCostText(options.viewRecipe||{id:'test',ings:[['Milk',100,'ml']]})}),
    renderWeek:()=>views.push({view:'week',status:context.readState().status}),
    renderRecipes:()=>views.push({view:'recipes',status:context.readState().status}),
  };
  vm.runInNewContext(retailerSources,context);context.RetailerPriceSources=context.window.RetailerPriceSources;
  if(options.personal){const data=new Map();context.window.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};vm.runInNewContext(personalCore+';globalThis.PersonalPricesCore=window.PersonalPricesCore',context);context.PersonalPricesCore.write(options.personal,context.window.localStorage);}
  vm.runInNewContext(source+'\nglobalThis.requestMatches=requestAutomaticCatalogMatches;globalThis.readState=()=>automaticCatalogState;globalThis.readBasket=()=>automaticCatalogBasket(Object.entries(buildShopping()),selectedShoppingStore());globalThis.readPlanner=()=>renderPackPlanner(Object.entries(buildShopping()));globalThis.readItem=key=>automaticCatalogMarkup(key,buildShopping()[key],selectedShoppingStore());globalThis.readSummary=()=>automaticCatalogSummary(Object.entries(buildShopping()),selectedShoppingStore());globalThis.copyText=shoppingListText;globalThis.exportCsv=exportPriceReferenceCsv;globalThis.recipeCost=automaticRecipeCost;globalThis.readRecipeCostText=recipeCostText;',context);
  return {...context,rendered,views,requestBodies,get requests(){return requests},advanceTime(ms){now+=ms},async csv(){context.exportCsv();return exportedBlob.text()},async load(){await context.requestMatches(entries,context.state.shoppingStore)}};
}

test('legacy manual retailer choice migrates once to ASDA while preserving meal preferences and saved data',()=>{
  const app=harness();
  assert.equal(app.state.shoppingStore,'Asda');
  assert.deepEqual(Array.from(app.state.profile.supermarkets),['Asda']);
  assert.equal(app.state.packQuotes.Asda.milk.volume.price,999);
  assert.equal(app.state.automaticPricingVersion,2);
  const explicit=harness(undefined,{state:{shoppingStore:'Lidl',profile:{supermarket:'Lidl',supermarkets:['Lidl']},automaticPricingVersion:2}});
  assert.equal(explicit.state.shoppingStore,'Lidl');
  const aldi=harness(undefined,{state:{shoppingStore:'Aldi',profile:{supermarket:'Aldi',supermarkets:['Aldi']},automaticPricingVersion:2}});
  assert.equal(aldi.state.shoppingStore,'Aldi');assert.equal(aldi.state.profile.supermarket,'Aldi');
});

test('Aldi store and Lidl fallback prices retain source labels and dates in shopping, copied lists and CSV',async()=>{
  const url='https://digitalcontent.api.tesco.com/v2/media/ghs-mktg/bb2fb14a-260a-418b-b2ac-7e7ce4f63dd5/APM%2BExpress%2Band%2BAPM%2BLarge%2BStore%2BOnline%2BVerification%2BForm%2B09052026.pdf#page=6';
  for(const store of ['Aldi','Lidl']){
    const app=harness([item('Wholemeal wrap',9,'each')],{state:{shoppingStore:store,profile:{supermarket:store,supermarkets:[store],budget:35}},respond:rows=>rows.map(row=>{
      const result=recommendation(row,.99,8,'pieces');const evidence={productName:'Village Bakery Wholemeal Tortilla Wraps',sourceStore:'Aldi',estimatedPrice:true,priceBasis:store==='Lidl'?'aldi_estimate':'aldi_reference',url,priceSourceUrl:url,sourceDate:'2026-05-07',priceCheckedAt:'2026-05-07'};
      result.plan.estimatedPrice=true;Object.assign(result.plan.products[0],evidence);Object.assign(result.match,evidence);return result;
    })});
    await app.load();assert.equal(app.readBasket().complete,true);assert.equal(app.readBasket().total,1.98);
    const label=store==='Lidl'?'Aldi estimate for Lidl':'Saved Aldi price estimate';
    assert.ok(app.readItem('wholemeal wrap').includes(label));assert.match(app.readItem('wholemeal wrap'),/View Aldi price source/);
    assert.doesNotMatch(app.readItem('wholemeal wrap'),/Saved Lidl price/);
    assert.ok(app.copyText().includes(label));assert.ok((await app.csv()).includes(label));assert.match(await app.csv(),/2026-05-07/);
    assert.equal(app.requestBodies[0].store,store);
  }
});

test('consumer shopping flow has no manual prices, sparse link tables or generic estimates',()=>{
  assert.doesNotMatch(html,/Set shelf price|Set pack & price|Record price I checked|id="newCost"|id="editCost"|DIRECT_RETAILER_PRODUCTS|PACK_CATALOG/);
  const app=harness();
  assert.match(app.readItem('milk'),/Finding the best supermarket packs/);
  assert.doesNotMatch(app.readItem('milk'),/No reliable supermarket match/);
  assert.match(app.readPlanner(),/prices are filled in automatically/);
});

test('catalogue response updates basket totals, packs and product links without user price entry',async()=>{
  const app=harness();
  await app.load();
  const basket=app.readBasket();
  assert.equal(basket.total,1.65);
  assert.equal(basket.packs,1);
  assert.equal(basket.complete,true);
  assert.match(app.readPlanner(),/£1.65/);
  assert.doesNotMatch(app.readPlanner(),/999|generic|Recorded/);
  assert.match(app.readItem('milk'),/ASDA Semi Skimmed Milk/);
  assert.match(app.readItem('milk'),/View at Asda/);
  assert.ok(app.rendered.some(markup=>markup.includes('£1.65')),'automatic response rerenders prices');
  const text=app.copyText();
  assert.match(text,/Basket total: £1.65/);
  assert.match(text,/1 × ASDA Semi Skimmed Milk \(2000 ml\) — £1.65/);
  assert.match(text,/https:\/\/www\.asda\.com\/groceries\/product/);
});

test('unmatched and unknown ingredients are excluded and totals remain visibly partial',async()=>{
  const entries=[item('Milk',1500,'volume'),['unknown ingredient',{name:'Unknown ingredient',c:'Other',unknown:true,groups:{},pantryNotes:[]}]];
  const app=harness(entries,{respond:rows=>rows.map(row=>row.name==='Milk'?recommendation(row):{key:row.key,match:null,plan:null})});
  await app.load();
  assert.equal(app.readBasket().complete,false);
  assert.equal(app.readBasket().required,2);
  assert.equal(app.readBasket().priced,1);
  assert.match(app.readPlanner(),/Priced subtotal/);
  assert.match(app.readPlanner(),/1 ingredient quantities are excluded/);
  assert.doesNotMatch(app.readPlanner(),/Basket is .* under/);
  assert.match(app.readItem('unknown ingredient'),/excluded from the subtotal/);
  assert.match(app.copyText(),/Priced subtotal: £1.65 \(1\/2/);
});

test('fresh produce estimates keep the exact sale pack and clearly label approximate coverage',async()=>{
  const app=harness([item('Cucumber',100)],{respond:rows=>rows.map(row=>{
    const result=recommendation(row,0.89,1,'each');
    result.match.productName=result.plan.products[0].productName='ASDA Cucumber';
    result.plan.products[0].packs=1;result.plan.products[0].costGBP=0.89;
    Object.assign(result.plan,{totalQuantity:300,leftoverQuantity:200,totalCostGBP:0.89,estimatedQuantity:true,estimateNotes:['Cucumber sold by each: estimated 300 g per item; actual weight varies.']});
    return result;
  })});
  await app.load();
  assert.match(app.readItem('cucumber'),/1 × ASDA Cucumber \(1 each\)/);
  assert.match(app.readItem('cucumber'),/about 300 covered/);
  assert.match(app.readItem('cucumber'),/actual weight varies/);
  assert.match(app.readPlanner(),/Estimated weights and their assumptions/);
});

test('Lidl uses its own published prices and never an Asda response',async()=>{
  const profile={supermarket:'Lidl',supermarkets:['Lidl'],budget:45};
  const app=harness(undefined,{state:{shoppingStore:'Lidl',profile},respond:rows=>rows.map(row=>({key:row.key,confidence:'high',match:{productName:'Milbona Milk',url:'https://www.lidl.co.uk/p/milk/p10000029',priceGBP:null,packSize:'1L'},plan:null}))});
  await app.load();assert.equal(app.requests,1);assert.equal(app.readBasket().priced,0);assert.equal(app.readBasket().complete,false);
  assert.match(app.readItem('milk'),/Milbona Milk/);assert.match(app.readItem('milk'),/Price unavailable/);
  assert.doesNotMatch(app.readPlanner(),/£999|£1.65|generic/);
});

test('changing quantity immediately removes obsolete totals until the new automatic request finishes',async()=>{
  const entries=[item('Milk',1500,'volume')],app=harness(entries);
  await app.load();
  entries[0][1].groups.volume.remaining=4500;
  assert.equal(app.readBasket().priced,0);
  assert.match(app.readItem('milk'),/Finding the best supermarket packs/);
  await app.load();
  assert.equal(app.readBasket().packs,3);
  assert.equal(app.readBasket().total,4.949999999999999);
});

test('recipe cost uses only catalogue ingredient values and distinguishes consumed ingredients from pack spend',async()=>{
  const app=harness();
  await app.load();
  assert.ok(Math.abs(app.recipeCost({ings:[['Milk',100,'ml']],servings:1,cost:999})-0.0825)<1e-9);
  assert.equal(app.recipeCost({ings:[['Milk',100,'ml'],['Skyr yoghurt',50,'g']],servings:1,cost:999}),null);
});

test('pricing refreshes automatically after thirty minutes without repeating every render',async()=>{
  const app=harness();
  await app.load();await app.load();
  assert.equal(app.requests,1);
  app.advanceTime(30*60*1000+1);
  await app.load();
  assert.equal(app.requests,2);
});

test('visible meal prices leave the loading state after terminal failures without rerendering hidden views',async()=>{
  const app=harness(undefined,{activeView:'home',responseStatus:503,fastTimers:true,state:{week:[{day:'Monday',meals:['test']}]}});
  await app.load();
  assert.equal(app.requests,3);
  assert.equal(app.readState().status,'error');
  assert.ok(app.views.some(view=>view.text==='Calculating supermarket cost…'));
  assert.equal(app.views.at(-1).text,'Some ingredient prices unavailable');
  assert.ok(app.views.every(view=>view.view==='home'));
});

test('automatic price refresh avoids home generation recursion when the meal plan is empty',async()=>{
  const app=harness(undefined,{activeView:'home',state:{week:[]}});
  await app.load();
  assert.equal(app.views.length,0);
  assert.equal(app.readState().status,'ready');
});

test('regional catalogue provenance expands region abbreviations for consumers',async()=>{
  const app=harness(undefined,{respond:rows=>rows.map(row=>({...recommendation(row),match:{...recommendation(row).match,priceRegion:'EN'}}))});
  await app.load();
  assert.match(app.readItem('milk'),/England supermarket catalogue price/);
  assert.doesNotMatch(app.readItem('milk'),/>EN supermarket catalogue price/);
});

test('CSV export carries automatic products, pack prices and totals and protects spreadsheet formula cells',async()=>{
  const entries=[item('=Milk',1500,'volume')],app=harness(entries);
  await app.load();
  const csv=await app.csv();
  assert.match(csv,/Pack price GBP/);
  assert.match(csv,/"'=Milk"/);
  assert.match(csv,/"ASDA Semi Skimmed Milk","1","2000 ml","1.65","1.65"/);
  assert.match(csv,/Automatically priced/);
});

test('collected Lidl prices are automatic even with an old disabled setting, retaining dates in totals and exports',async()=>{
  const app=harness([item('Cannellini beans',500)],{state:{shoppingStore:'Lidl',automaticPricingVersion:2,profile:{supermarket:'Lidl',supermarkets:['Lidl'],budget:35,lidlReferencePrices:false}},respond:rows=>rows.map(row=>{
    const result=recommendation(row,.45,240,'g');result.plan.estimatedPrice=true;
    for(const product of result.plan.products)Object.assign(product,{productName:'Freshona Cannellini Beans',estimatedPrice:true,priceBasis:'reference',sourcePeriod:'May 2026',priceSourceUrl:'https://www.lidl.co.uk/static/assets/Lidl5-for-20-May2026-2204485.pdf',url:'https://www.lidl.co.uk/static/assets/Lidl5-for-20-May2026-2204485.pdf#lidl-reference-beans'});
    result.match={...result.plan.products[0]};return result;
  })});
  await app.load();assert.equal(app.readBasket().estimatedPrice,true);assert.equal(app.readBasket().estimated,false,'price estimates do not claim produce weight assumptions');
  assert.equal(app.requestBodies[0].allowReferencePrices,true);
  assert.match(app.readSummary(),/Estimated £1.35/);assert.match(app.readPlanner(),/~£1.35/);assert.match(app.readItem('cannellini beans'),/Saved Lidl price · May 2026/);
  assert.match(app.copyText(),/Saved Lidl price estimate; May 2026/);assert.match(await app.csv(),/Saved Lidl price estimate; May 2026/);
  const first=app.requests;app.state.profile.lidlReferencePrices=true;await app.load();assert.equal(app.requests,first,'the retired price-mode flag cannot change or invalidate the unified price list');
});


test('opted-in personal packs retain provenance without links and update requests when edited or excluded',async()=>{
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
 const raw={ingredient:'Oats',productName:'Crownfield oats pack',packQuantity:1000,packUnit:'g',priceGBP:1.25,checkedAt:today,source:'shelf',branch:'Alison Crescent, Sheffield',store:'Lidl'};
 let app;
 const respond=rows=>rows.map(row=>{
  const saved=app.PersonalPricesCore.read().snapshot.prices[0],p={...saved,url:'personal:lidl/'+saved.id,personalPriceId:saved.id,personalIngredient:saved.ingredient,personalSource:saved.source,personalBranch:saved.branch,personalCheckedAt:saved.checkedAt,priceBasis:'personal',estimatedPrice:true,priceSource:'Your Lidl shelf-label price',priceSourceUrl:null};
  const packs=Math.ceil(row.quantity/p.packQuantity);return {key:row.key,dimension:row.dimension,confidence:'high',match:p,plan:{requestedQuantity:row.quantity,totalQuantity:packs*p.packQuantity,totalCostGBP:packs*p.priceGBP,estimatedPrice:true,products:[{...p,packs,totalQuantity:packs*p.packQuantity,costGBP:packs*p.priceGBP}]}};
 });
 app=harness([item('Oats',1100)],{personal:{schemaVersion:1,includeInPlanning:true,prices:[raw]},state:{shoppingStore:'Lidl',automaticPricingVersion:2,profile:{supermarket:'Lidl',supermarkets:['Lidl'],budget:35}},respond});
 await app.load();assert.equal(app.readBasket().total,2.5);assert.equal(app.requestBodies[0].allowPersonalPrices,true);assert.equal(app.requestBodies[0].personalPrices[0].productName,raw.productName);
 const markup=app.readItem('oats');assert.match(markup,/Your shelf label price · checked/);assert.match(markup,/Alison Crescent/);assert.doesNotMatch(markup,/href="personal:|Reference estimate|undefined/);
 assert.match(app.copyText(),/Your shelf label price · checked/);assert.doesNotMatch(app.copyText(),/personal:lidl/);
 const csv=await app.csv();assert.match(csv,/Your shelf label price · checked/);assert.match(csv,/personal estimate/);assert.doesNotMatch(csv,/personal:lidl|undefined/);
 app.PersonalPricesCore.upsert({...raw,priceGBP:1.5});assert.equal(app.readBasket().priced,0);await app.load();assert.equal(app.readBasket().total,3);assert.equal(app.requests,2);
 app.PersonalPricesCore.setIncluded(false);assert.equal(app.readBasket().priced,0);await app.load();assert.equal(app.requestBodies.at(-1).allowPersonalPrices,undefined);assert.equal(app.readBasket().priced,0,'a personal response cannot cost a basket after opt-out');
});

test('missing Lidl product shows an optional checked-pack action while normal pricing keeps working without notebook assets',async()=>{
 const app=harness([item('Oats',100)],{state:{shoppingStore:'Lidl',automaticPricingVersion:2,profile:{supermarket:'Lidl',supermarkets:['Lidl']}},respond:rows=>rows.map(row=>({key:row.key,match:null,plan:null}))});
 await app.load();assert.match(app.readItem('oats'),/excluded from the subtotal/);assert.equal(app.requestBodies[0].personalPrices,undefined);
 assert.match(html,/onclick="openPersonalPrice\(\)"/);assert.match(html,/personal-prices-core\.js/);assert.match(html,/personal-prices-ui\.js/);
});
