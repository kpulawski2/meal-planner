import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import '../public/swap-core.js';

// Synthetic pack prices and recipe nutrition isolate checkout-budget behaviour.
const directory = await mkdtemp(path.join(os.tmpdir(), 'meal-one-off-'));
process.env.ASDA_CATALOGUE_PATH = path.join(directory, 'products.json');
process.env.ASDA_CATALOGUE_META_PATH = path.join(directory, 'metadata.json');
const products = Array.from({length:110},(_,index)=>({ name:'Fixture Grocery '+index,category:'Food Cupboard',
  url:'https://www.asda.com/groceries/product/fixture/'+index,packQuantity:1000,packUnit:'g',packSize:'1 kg',price:2,available:true }));
Object.assign(products[0],{name:'ASDA Chicken Breast Fillets',category:'Meat, Poultry & Fish > Chicken Breasts',packQuantity:500,packSize:'500 g',price:4});
Object.assign(products[1],{name:'ASDA Long Grain Rice',category:'Food Cupboard > Rice',price:2});
Object.assign(products[2],{name:'ASDA Chopped Tomatoes',category:'Food Cupboard > Tinned Tomatoes',packQuantity:400,packSize:'400 g',price:.5});
await writeFile(process.env.ASDA_CATALOGUE_PATH,JSON.stringify(products));
await writeFile(process.env.ASDA_CATALOGUE_META_PATH,JSON.stringify({status:'complete',products_saved:110,products_expected:110,coverage:1,refreshed_at:'2026-10-17T00:00:00Z'}));
const {normalizeOneOffRequest,findOneOffMeals}=await import('./one-off-meal.js');
const worker=await import('./catalog-service.js');
const Core=globalThis.OneOffMealCore;
const recipe=(id,ings,extra={})=>({id,name:id,cat:'Dinner',servings:1,ings,nutrition:{kcal:500,p:40,c:40,f:10,complete:true},cookTime:15,...extra});
const chicken=recipe('Measured chicken',[['Chicken breast',200,'g']]);
const body=(extra={})=>({store:'Asda',budget:10,people:1,category:'Dinner',recipes:[chicken],pantry:[],...extra});
test.after(()=>rm(directory,{recursive:true,force:true}));

test('one-off budget validates total pounds/pence and isolates weekly calorie, variety and spending settings',()=>{
  const request=normalizeOneOffRequest(body({profile:{calories:1600,protein:150,budget:35,days:14,varietyMode:'Tailored'}}));
  assert.equal(request.brief.budget,10);assert.equal(request.profile.protein,0);assert.equal(request.profile.varietyMode,'Balanced');
  assert.deepEqual(request.week,[]);assert.equal(request.profile.people,1);
  for(const change of [{budget:''},{budget:-1},{budget:1.001},{budget:501},{people:0},{people:1.5},{people:9},{store:'Tesco'},{category:'All'},{recipes:[]},{recipes:Array(251).fill(chicken)}])assert.throws(()=>normalizeOneOffRequest(body(change)),TypeError);
  assert.equal(Core.normalise(body({budget:0})).budget,0);
});
test('a cheap consumed portion cannot hide a full pack that exceeds this dinner budget',async()=>{
  const request=normalizeOneOffRequest(body({budget:2})),before=JSON.stringify(request),result=await findOneOffMeals(request);
  assert.equal(result.options.length,0);assert.equal(result.cheapestOverBudgetGBP,4);assert.equal(result.unpriced,0);
  assert.equal(JSON.stringify(request),before,'search must not consume stock, record spending or change the request');
});
test('one-off packs scale to people and recipe yields, and fit the exact penny limit',async()=>{
  const recipeForTwo=recipe('Two person chicken',[['Chicken breast',600,'g']],{servings:2});
  const one=await findOneOffMeals(normalizeOneOffRequest(body({recipes:[recipeForTwo],budget:4})));
  assert.equal(one.options[0].totalCostGBP,4);assert.equal(one.options[0].recommendations[0].plan.products[0].packs,1);
  const two=await findOneOffMeals(normalizeOneOffRequest(body({recipes:[recipeForTwo],people:2,budget:7.99})));
  assert.equal(two.options.length,0);assert.equal(two.cheapestOverBudgetGBP,8);
  const exact=await findOneOffMeals(normalizeOneOffRequest(body({recipes:[recipeForTwo],people:2,budget:8})));
  assert.equal(exact.options[0].totalCostGBP,8);
});
test('pantry deductions are optional and a fully covered measured meal needs zero new spending',async()=>{
  const pantry=[{name:'Chicken breast',qty:200,unit:'g'}];
  const covered=await findOneOffMeals(normalizeOneOffRequest(body({budget:0,pantry})));
  assert.equal(covered.options[0].totalCostGBP,0);assert.deepEqual(covered.options[0].items,[]);
  assert.equal(Core.validateOption(covered.options[0],chicken,covered.brief,pantry),true);
  const ignored=await findOneOffMeals(normalizeOneOffRequest(body({budget:0,pantry,usePantry:false})));
  assert.equal(ignored.options.length,0);assert.equal(ignored.cheapestOverBudgetGBP,4);
  const partial=await findOneOffMeals(normalizeOneOffRequest(body({pantry:[{name:'Chicken breast',qty:100,unit:'g'}]})));
  assert.equal(partial.options[0].items[0].quantity,100);assert.equal(partial.options[0].totalCostGBP,4);
});
test('fixed batches buy their full ingredients and unknown prices or amounts never satisfy a budget',async()=>{
  const batch=recipe('Whole batch',[['Chicken breast',800,'g']],{servings:4,fixedBatch:true,batchStorage:'recipe'});
  const result=await findOneOffMeals(normalizeOneOffRequest(body({recipes:[batch]})));
  assert.equal(result.options[0].totalCostGBP,8);assert.equal(result.options[0].preparedPortions,4);
  const unknown=await findOneOffMeals(normalizeOneOffRequest(body({recipes:[recipe('No price',[['Unlisted spice',10,'g']]),recipe('No amount',[['Chicken breast',0,'g']])]})));
  assert.equal(unknown.options.length,0);assert.equal(unknown.unpriced,2);assert.equal(unknown.cheapestOverBudgetGBP,null);
});
test('meal type, ingredient search, diet, equipment and cooking time are checked independently of full-plan targets',async()=>{
  const recipes=[chicken,recipe('Breakfast chicken',chicken.ings,{cat:'Breakfast'}),recipe('Slow chicken',chicken.ings,{cookTime:200}),recipe('Fryer chicken',chicken.ings,{equipment:['Air fryer']}),recipe('Rice bowl',[['Rice',100,'g']])];
  const result=await findOneOffMeals(normalizeOneOffRequest(body({recipes,query:'chicken',profile:{cookTime:30,equipment:['Hob']}})));
  assert.deepEqual(result.options.map(row=>row.recipeId),[chicken.id]);
  const vegan=await findOneOffMeals(normalizeOneOffRequest(body({recipes,profile:{diet:'Vegan',cookTime:30}})));
  assert.deepEqual(vegan.options.map(row=>row.recipeId),['Rice bowl']);
});
test('browser verification rejects changed totals, pantry amounts, product sources and another store',async()=>{
  const request=normalizeOneOffRequest(body()),result=await findOneOffMeals(request),option=result.options[0];
  assert.equal(Core.validateOption(option,chicken,result.brief,[]),true);
  assert.equal(Core.validateOption({...option,totalCostGBP:1},chicken,result.brief,[]),false);
  assert.equal(Core.validateOption(option,chicken,{...result.brief,budget:3},[]),false);
  assert.equal(Core.validateOption(option,chicken,result.brief,[{name:'Chicken breast',qty:100,unit:'g'}]),false);
  assert.equal(Core.validateOption(option,chicken,{...result.brief,store:'Aldi'},[]),false);
  const bad=structuredClone(option);bad.recommendations[0].plan.products[0].url='https://evil.example/product';
  assert.equal(Core.validateOption(bad,chicken,result.brief,[]),false);
});
test('the worker shares its price catalogue, retains Aldi/Lidl estimate sources and honours cancellation',async()=>{
  const controller=new AbortController();controller.abort();await assert.rejects(worker.findOneOffMeals(normalizeOneOffRequest(body()),{signal:controller.signal}),{name:'AbortError'});
  const result=await worker.findOneOffMeals(normalizeOneOffRequest(body()));assert.equal(result.options[0].totalCostGBP,4);
  for(const store of ['Aldi','Lidl']){
    const next=await worker.findOneOffMeals(normalizeOneOffRequest(body({store,recipes:[recipe('Wholemeal dinner wrap',[['Wholemeal wrap',1,'pieces']])]})));
    assert.equal(next.options[0].totalCostGBP,.99);assert.equal(next.options[0].estimatedPrice,true);
    assert.equal(next.options[0].recommendations[0].plan.products[0].priceBasis,store==='Lidl'?'aldi_estimate':'aldi_reference');
  }
});
