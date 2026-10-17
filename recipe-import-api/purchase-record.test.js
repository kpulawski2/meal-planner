import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/personal-prices-core.js';
import '../public/purchase-record-core.js';
import '../public/lidl-receipt-notes.js';
const Core=globalThis.PurchaseRecordCore,Pantry=globalThis.PantryCore,Prices=globalThis.PersonalPricesCore,Receipt=globalThis.LidlReceiptNotes;
const now=new Date('2026-10-17T19:15:00Z');
function fixture(){
 const state={profile:{people:1},shoppingStore:'Lidl',shopping:{skyr:true,tuna:true},week:[{day:'Monday',meals:['bowl']}],pantry:[],mealServings:{}};
 Pantry.initialise(state,now);
 const entries=[['skyr',{name:'Skyr',groups:{mass:{remaining:302.2,label:'g'}}}],['tuna',{name:'Tuna',groups:{mass:{remaining:2099.9,label:'g'}}}]];
 const personalPrices=[Prices.normalize({ingredient:'Skyr',productName:'Natural Skyr',packQuantity:450,packUnit:'g',priceGBP:1.49,checkedAt:'2026-10-17',source:'receipt',branch:'Sheffield'},{now})];
 const draft=Core.draft({state,entries,store:'Lidl',basket:{status:'error'},personalPrices},now);
 const lines=draft.lines.map(row=>({...row}));Object.assign(lines[1],{productName:'Tuna Chunks in Brine',packs:24,packQuantity:100,packUnit:'g',paidGBP:14.16,place:'Pantry'});
 return {state,entries,draft,lines};
}
test('offline and failed matching do not block confirmed receipt packs, paid amounts or undo',()=>{
 const {state,draft,lines}=fixture();assert.equal(draft.ok,true);assert.equal(lines[0].packQuantity,450);assert.equal(lines[0].paidGBP,1.49);
 const result=Core.commit(state,draft,lines,'2026-10-17',now);assert.equal(result.ok,true,result.error);
 assert.equal(state.pantry[0].qty,450);assert.equal(state.pantry[0].place,'Fridge');assert.equal(state.pantry[1].qty,2400);
 assert.equal(Pantry.spentTotal(state),15.65);assert.equal(state.pantry[1].product.packs,24);assert.deepEqual(state.shopping,{});
 assert.equal(Core.commit(state,draft,lines,'2026-10-17',now).ok,false);assert.equal(state.pantry.length,2);
 assert.equal(Pantry.undo(state,result.transaction.id,now).ok,true);assert.equal(state.pantry.length,0);assert.equal(Pantry.spentTotal(state),0);
});
test('missing paid amounts allow stock without inventing a zero or estimated spend',()=>{
 const {state,draft,lines}=fixture();lines[1].paidGBP='';
 const result=Core.commit(state,draft,lines,'2026-10-17',now);assert.equal(result.ok,true,result.error);
 assert.equal(result.transaction.totalCostGBP,null);assert.equal(result.transaction.knownSubtotalGBP,1.49);
 assert.equal(Pantry.spentSummary(state).known,false);assert.equal(state.pantry[1].product.costGBP,null);
});
test('bad input in any included receipt line leaves all stock and spending untouched',()=>{
 for(const bad of [{packs:0},{packs:1.5},{packQuantity:''},{packQuantity:-1},{packUnit:'cans'},{paidGBP:'NaN'},{paidGBP:1.005},{place:'Unknown'},{expiry:'2026-02-30'},{name:'\u0000bad'}]){
  const {state,draft,lines}=fixture();Object.assign(lines[1],bad);const before=JSON.stringify(state);
  assert.equal(Core.commit(state,draft,lines,'2026-10-17',now).ok,false,JSON.stringify(bad));assert.equal(JSON.stringify(state),before);
 }
});
test('changed stock, selected items, dates and row identity cannot commit an old review',()=>{
 for(const mutate of [f=>f.state.shopping.tuna=false,f=>f.state.pantry.push({name:'Rice',qty:20,unit:'g'}),f=>f.lines[0].id='other']){
  const f=fixture();mutate(f);const before=JSON.stringify(f.state);assert.equal(Core.commit(f.state,f.draft,f.lines,'2026-10-17',now).ok,false);assert.equal(JSON.stringify(f.state),before);
 }
 const f=fixture();assert.equal(Core.commit(f.state,f.draft,f.lines,'2026-10-18',now).ok,false);
});
test('unchecked items stay out of stock and out of recorded spend',()=>{
 const {state,draft,lines}=fixture();lines[1].include=false;lines[1].packQuantity='';
 const result=Core.commit(state,draft,lines,'2026-10-17',now);assert.equal(result.ok,true,result.error);assert.equal(state.pantry.length,1);assert.equal(Pantry.spentTotal(state),1.49);assert.equal(state.shopping.tuna,true);
});
test('receipt variants remain explicit and frozen chicken stays separate from fresh chicken',()=>{
 const {state,draft,lines}=fixture();Object.assign(lines[1],{name:'Frozen chicken breast',productName:'Chicken Breast (frozen)',packs:1,packQuantity:1000,paidGBP:4.25,place:'Freezer'});
 assert.equal(Core.commit(state,draft,lines,'2026-10-17',now).ok,true);
 assert.equal(state.pantry[1].name,'Frozen chicken breast');assert.equal(state.pantry[1].place,'Freezer');
 assert.notEqual(MealBudgetCore.canonicalIngredientName(state.pantry[1].name),MealBudgetCore.canonicalIngredientName('Chicken breast'));
});
test('the receipt observations preserve discounts, exact confirmed packs, uncertainties and source distinctions',()=>{
 assert.equal(Receipt.lines.length,21);assert.equal(Math.round(Receipt.lines.reduce((sum,row)=>sum+row.paidGBP,0)*100),4823);
 assert.equal(Receipt.receiptTotalGBP,48.33);assert.equal(Receipt.unreconciledGBP,.10);
 const get=name=>Receipt.lines.find(row=>row.ingredient===name);
 assert.equal(get('Skyr').packQuantity,450);assert.equal(get('Frozen chicken breast').packQuantity,1000);assert.equal(get('Tuna').packQuantity,100);assert.equal(get('Tuna').quantityKind,'drained');
 assert.equal(get('Eggs').productName,'Free-range mixed eggs (6)');assert.equal(get('Eggs').packs,2);assert.equal(get('Eggs').unitPriceGBP,.99);
 assert.equal(get('Sesame oil').unitPriceGBP,1.15);assert.equal(get('Rice vinegar').discountGBP,.84);
 assert.equal(get('Lighter mayonnaise').confirmedPack,undefined);assert.equal(get('Mayonnaise'),undefined);
});

test('purchase review suggests drained usable weights and declared counts rather than net tin or wrap weights',()=>{
 for(const [name,dimension,product,wanted,unit] of [
  ['Tuna','mass',{packQuantity:145,packUnit:'g',totalQuantity:204,packs:2,quantityBasis:'Estimated 102 g drained per tin',estimatedQuantity:true},102,'g'],
  ['Wholemeal wrap','each',{packQuantity:360,packUnit:'g',totalQuantity:6,packs:1,quantityBasis:'6 items declared in the product name.'},6,'pieces']
 ]){
  const f=fixture();f.state.shopping={[name.toLowerCase()]:true};
  const key=name.toLowerCase(),entry={name,groups:{[dimension]:{remaining:150,label:unit}}};
  const draft=Core.draft({state:f.state,entries:[[key,entry]],store:'Asda',basket:{status:'ready',items:[{key:key+'::'+dimension,quantity:150}],results:[{plan:{products:[product]}}]}},now);
  assert.equal(draft.lines[0].packQuantity,wanted);assert.equal(draft.lines[0].packUnit,unit);
 }
});

test('unchanged quantity estimates stay labelled while confirmed label corrections replace them',()=>{
 const f=fixture();Object.assign(f.draft.lines[1],{packQuantity:102,packUnit:'g',estimated:true,quantityNote:'Estimated drained weight'});Object.assign(f.lines[1],{packQuantity:102});
 assert.equal(Core.validate(f.draft,f.lines,'2026-10-17',now).lots[1].estimated,true);
 f.lines[1].packQuantity=100;assert.equal(Core.validate(f.draft,f.lines,'2026-10-17',now).lots[1].estimated,false);
});
