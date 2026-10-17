import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { rankCatalogCandidates, recommendCatalogItems, catalogPurchaseOffers, calculatePackPurchase } from './catalog-adapter.js';
import { normalizeOneOffRequest, findOneOffMeals } from './one-off-meal.js';
import { normalizePlannerRequest } from './planner-request.js';
import { optimizeMealPlan, allowedRecipe } from './budget-planner.js';
import '../public/swap-core.js';
import '../public/consumer-tools.js';

const recipes = await readRecipeLibrary(), frozen = recipes.filter(row => row.id.startsWith('frozen-'));
const item = (name, quantity) => ({key:name, name, quantity, dimension:'mass'});

test('frozen dinners use measured frozen weights, separate oven cooking and conservative pack-based nutrition', () => {
  assert.equal(frozen.length, 5);
  for (const recipe of frozen) {
    assert.equal(recipe.servings,1); assert.equal(recipe.fixedBatch,undefined);
    assert.equal(recipe.ings[0][0],'Frozen chicken breast'); assert.equal(recipe.ings[0][1],250);
    assert.equal(recipe.nutritionStatus,'estimated'); assert.equal(recipe.nutrition.complete,true);
    assert.ok(recipe.nutrition.p >= 42 && recipe.nutrition.p < 65, recipe.name);
    assert.ok(recipe.nutrition.assumptions.some(note=>/125 g frozen pack portion/.test(note)));
    assert.equal(recipe.passiveMinutes,45); assert.deepEqual(recipe.equipment,['Oven','Hob']);
    assert.match(recipe.method[0],/40–45 minutes/); assert.match(recipe.method[0],/75°C for 30 seconds/);
    assert.match(recipe.method.at(-1),/immediately/); assert.match(recipe.modifications,/do not reheat/);
    assert.equal(allowedRecipe(recipe,{equipment:['Hob'],cookTime:30}),false);
    assert.equal(allowedRecipe(recipe,{equipment:['Hob','Oven'],cookTime:30}),true);
    assert.equal(allowedRecipe(recipe,{equipment:['Hob','Oven'],diet:'Vegetarian'}),false);
  }
  // 250 g frozen chicken is TWO labelled 125 g raw-pack portions. The cooked
  // 100 g table (141 kcal / 26 g protein) must not be applied to frozen grams.
  const main = frozen.find(row=>row.id==='frozen-teriyaki-rice');
  assert.equal(main.nutrition.p,52.3); assert.equal(main.nutrition.kcal,563);
  assert.equal(globalThis.RecipeDiscoveryCore.matches(main,'frozen chicken'),true);
  assert.equal(globalThis.RecipeDiscoveryCore.matches(recipes.find(row=>row.id==='extra28'),'frozen chicken'),false);
});

test('frozen breast matches require whole plain fillets and never change an explicit fresh ingredient', () => {
  const product={store:'Asda',name:'ASDA Chicken Breast Fillets 1kg',category:'Frozen Food > Frozen Chicken & Meat',price:4,packQuantity:1000,packUnit:'g',url:'https://www.asda.com/groceries/product/fixture/1'};
  assert.equal(rankCatalogCandidates('Frozen chicken breast',[product],'mass').length,1);
  assert.equal(rankCatalogCandidates('Fresh chicken breast',[product],'mass').length,0);
  assert.equal(rankCatalogCandidates('Chicken breast',[product],'mass').length,0,'fresh methods remain separate');
  assert.equal(rankCatalogCandidates('Frozen chicken breast',[{...product,category:'Exceptional By Asda > Exceptional Fresh & Frozen Food > Exceptional Meat, Fish & Poultry > Exceptional Chicken & Duck'}],'mass').length,0);
  for(const name of ['ASDA Chicken Breast Strips','ASDA Cooked Chicken Breast Fillets','Breaded Chicken Breast Fillets','BBQ Chicken Breast Fillets','Chicken Breast Fillet Burgers']) {
    assert.equal(rankCatalogCandidates('Frozen chicken breast',[{...product,name}],'mass').length,0,name);
  }
});

test('Aldi whole-pack quotes keep frozen and fresh prices separate and expose full-pack leftovers', async () => {
  const items=[item('Frozen chicken breast',1001),item('Chicken breast',2000)];
  const data=await recommendCatalogItems('Aldi',items);
  const [ice,fresh]=data.recommendations.map(row=>row.plan);
  assert.equal(ice.totalCostGBP,8.5); assert.equal(ice.totalQuantity,2000); assert.equal(ice.leftoverQuantity,999);
  assert.equal(ice.products[0].storage,'Freezer'); assert.match(ice.products[0].preparationNote,/no-reheat/);
  assert.equal(ice.products[0].sourceDate,'2026-10-17');
  assert.equal(fresh.totalCostGBP,12.29); assert.equal(fresh.products[0].packQuantity,2000);
  assert.equal(fresh.products[0].storage,null);
  const offers=await catalogPurchaseOffers(items,{store:'Aldi'});
  assert.equal(calculatePackPurchase(offers.rows[0].candidates,1001,'mass').totalCostGBP,8.5);
  const snapshot=globalThis.ConsumerTools.snapshot({store:'Aldi',status:'ready',fingerprint:'frozen-test',loadedAt:Date.now(),items,results:Object.fromEntries(data.recommendations.map(row=>[row.key,row]))});
  const restored=globalThis.ConsumerTools.restore(snapshot,'Aldi','frozen-test');
  assert.equal(restored.results['Frozen chicken breast'].plan.products[0].storage,'Freezer');
});

test('the £10 one-person Lidl dinner can use a clearly labelled Aldi frozen estimate and independently verified basket', async () => {
  const result=await findOneOffMeals(normalizeOneOffRequest({store:'Lidl',budget:10,people:1,category:'Dinner',query:'chicken',profile:{equipment:['Oven','Hob'],cookTime:30},recipes:[...frozen,recipes.find(row=>row.id==='extra28')]}));
  const dinner=result.options.find(row=>row.recipeId==='frozen-teriyaki-rice'); assert.ok(dinner);
  assert.equal(dinner.totalCostGBP,7.15); assert.equal(dinner.estimatedPrice,true);
  const chicken=dinner.recommendations.find(row=>row.query==='Frozen chicken breast').plan.products[0];
  assert.equal(chicken.sourceStore,'Aldi'); assert.equal(chicken.priceBasis,'aldi_estimate'); assert.equal(chicken.storage,'Freezer');
  assert.equal(globalThis.OneOffMealCore.validateOption(dinner,frozen.find(row=>row.id===dinner.recipeId),result.brief,[]),true);
  assert.equal(result.options.find(row=>row.recipeId==='extra28').totalCostGBP,9.34);
  const justBelow=await findOneOffMeals(normalizeOneOffRequest({store:'Lidl',budget:7.14,people:1,category:'Dinner',profile:{equipment:['Oven','Hob']},recipes:[frozen.find(row=>row.id==='frozen-teriyaki-rice')]}));
  assert.equal(justBelow.options.length,0); assert.equal(justBelow.cheapestOverBudgetGBP,7.15);
});

test('a weekly repeated frozen dinner shares the 1 kg bags and retains the preparation warning', async () => {
  // Fixed synthetic nutrition isolates full-plan pack sharing from macro search.
  const pool=[{id:'fixture-oats',name:'Fixture oats',cat:'Breakfast',ings:[['Oats',50,'g'],['Skimmed milk',150,'ml']]},
    {id:'fixture-wrap',name:'Fixture wrap',cat:'Lunch',ings:[['Wholemeal wrap',1,'pieces'],['Cottage cheese',150,'g']]},frozen[0]]
    .map(recipe=>({...recipe,servings:1,nutrition:{kcal:500,p:50,c:30,f:8,complete:true}}));
  const week=globalThis.MealBudgetCore.dayNames(7).map(day=>({day,meals:pool.map(recipe=>recipe.id)})), locked=Object.fromEntries(week.flatMap(day=>day.meals.map((_,index)=>[day.day+'::'+index,true])));
  const request=normalizePlannerRequest({week,locked,profile:{supermarket:'Lidl',lidlReferencePrices:true,days:7,meals:3,budget:35,calories:1500,protein:100,equipment:['Hob','Oven'],varietyMode:'Repeat favourites',repeatMeals:{Breakfast:pool[0].id,Lunch:pool[1].id,Dinner:pool[2].id}},recipes:pool});
  const result=await optimizeMealPlan(request); assert.equal(result.status,'feasible',JSON.stringify(result.warnings));
  const chicken=result.basket.recommendations.find(row=>row.query==='Frozen chicken breast').plan;
  assert.equal(chicken.requestedQuantity,1750); assert.equal(chicken.totalCostGBP,8.5); assert.equal(chicken.leftoverQuantity,250);
  assert.ok(result.warnings.some(warning=>/Frozen chicken/.test(warning)));
});

test('price chart and CSV exports distinguish frozen Aldi £4.25 from fresh £6.69', async () => {
  const chart=JSON.parse(await readFile(new URL('../public/price-reference-catalog.json',import.meta.url)));
  const frozenRow=chart.ingredients.find(row=>row.ingredient==='Frozen chicken breast').retailers.find(row=>row.retailer==='Aldi');
  const fresh=chart.ingredients.find(row=>row.ingredient==='Chicken breast').retailers.find(row=>row.retailer==='Aldi');
  assert.equal(frozenRow.priceGBP,4.25); assert.equal(fresh.priceGBP,6.69); assert.notEqual(fresh.productUrl,frozenRow.productUrl);
  assert.equal(frozenRow.priceCheckedDate,'2026-10-17'); assert.match(frozenRow.notes,/cook from frozen/);
  for(const file of ['price-reference-catalog.csv','price-reference-snapshots.csv']) {
    const csv=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
    assert.match(csv,/Frozen chicken breast,Aldi,[^\n]+4\.25/); assert.match(csv,/Chicken breast,Aldi,[^\n]+6\.69/);
  }
});
