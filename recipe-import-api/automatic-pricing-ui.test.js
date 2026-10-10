import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
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
  let now=Date.now(),requests=0,exportedBlob=null;
  const rendered=[],views=[];
  const state={shoppingStore:'Asda',profile:{supermarkets:['Asda'],supermarket:'Asda',budget:45},week:[{day:'Monday',meals:[]}],shopping:{},packQuotes:{Asda:{milk:{volume:{price:999,size:1,unit:'ml'}}}},...options.state};
  const context={
    hadSavedProfile:true,state,RETAILER_NAMES:['Asda','Lidl'],AbortController,DOMException,console,Blob,setTimeout:options.fastTimers?((fn,ms)=>setTimeout(fn,ms>=45000?250:0)):setTimeout,clearTimeout,
    Date:class extends Date {static now(){return now}},
    fetch:async(url,request)=>{
      requests++;
      if(options.responseStatus)return {ok:false,status:options.responseStatus,text:async()=>''};
      const rows=JSON.parse(request.body).items;
      const recommendations=options.respond?options.respond(rows):rows.map(row=>recommendation(row));
      return {ok:true,status:200,text:async()=>JSON.stringify({store:JSON.parse(request.body).store,recommendations})};
    },
    window:{addEventListener(){}},
    document:{hidden:false,addEventListener(){},querySelector(){return {id:options.activeView||'shop'}},body:{appendChild(){}},createElement(){return {click(){},remove(){}}}},
    URL:{createObjectURL(blob){exportedBlob=blob;return 'blob:export'},revokeObjectURL(){}},
    buildShopping:()=>Object.fromEntries(entries),save(){},toast(){},
    fmt:value=>Math.round(Number(value)*10)/10,
    escape:value=>String(value).replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char])),
    shoppingQtyLabel:row=>Object.values(row.groups).map(group=>group.remaining+' '+group.label).join(', '),
    renderShop:()=>rendered.push(context.readPlanner()),
    renderHome:()=>views.push({view:'home',status:context.readState().status,text:context.readRecipeCostText(options.viewRecipe||{id:'test',ings:[['Milk',100,'ml']]})}),
    renderWeek:()=>views.push({view:'week',status:context.readState().status}),
    renderRecipes:()=>views.push({view:'recipes',status:context.readState().status}),
  };
  vm.runInNewContext(source+'\nglobalThis.requestMatches=requestAutomaticCatalogMatches;globalThis.readState=()=>automaticCatalogState;globalThis.readBasket=()=>automaticCatalogBasket(Object.entries(buildShopping()),selectedShoppingStore());globalThis.readPlanner=()=>renderPackPlanner(Object.entries(buildShopping()));globalThis.readItem=key=>automaticCatalogMarkup(key,buildShopping()[key],selectedShoppingStore());globalThis.readSummary=()=>automaticCatalogSummary(Object.entries(buildShopping()),selectedShoppingStore());globalThis.copyText=shoppingListText;globalThis.exportCsv=exportPriceReferenceCsv;globalThis.recipeCost=automaticRecipeCost;globalThis.readRecipeCostText=recipeCostText;',context);
  return {...context,rendered,views,get requests(){return requests},advanceTime(ms){now+=ms},async csv(){context.exportCsv();return exportedBlob.text()},async load(){await context.requestMatches(entries,context.state.shoppingStore)}};
}

test('legacy manual retailer choice migrates once to ASDA while preserving meal preferences and saved data',()=>{
  const app=harness();
  assert.equal(app.state.shoppingStore,'Asda');
  assert.deepEqual(Array.from(app.state.profile.supermarkets),['Asda']);
  assert.equal(app.state.packQuotes.Asda.milk.volume.price,999);
  assert.equal(app.state.automaticPricingVersion,2);
  const explicit=harness(undefined,{state:{shoppingStore:'Lidl',profile:{supermarket:'Lidl',supermarkets:['Lidl']},automaticPricingVersion:2}});
  assert.equal(explicit.state.shoppingStore,'Lidl');
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
