import test from 'node:test';
import assert from 'node:assert/strict';
import {readRecipeLibrary} from './recipe-fixtures.js';
import {recommendCatalogItems} from './catalog-adapter.js';
import '../public/budget-core.js';
import '../public/equipment-core.js';
import '../public/meal-preferences-core.js';
import '../public/recipe-discovery-core.js';
import '../public/recipe-library-core.js';
const library=await readRecipeLibrary(),recipes=library.filter(r=>r.id.startsWith('viral-'));

test('sixty new TikTok-style recipes span meals, proteins and flavours with complete measured nutrition',()=>{
 assert.equal(recipes.length,60);assert.equal(new Set(library.map(r=>r.id)).size,library.length);
 assert.deepEqual(Object.fromEntries(['Breakfast','Lunch','Dinner','Snack'].map(cat=>[cat,recipes.filter(r=>r.cat===cat).length])),{Breakfast:10,Lunch:14,Dinner:26,Snack:10});
 assert.ok(new Set(recipes.map(r=>r.flavourProfile)).size>=15);
 assert.ok(recipes.some(r=>r.proteinFamily==='fish'));assert.ok(recipes.some(r=>r.proteinFamily==='tofu'));assert.ok(recipes.some(r=>r.proteinFamily==='legume'));
 for(const r of recipes){
  assert.equal(r.nutrition.complete,true,r.name+': '+r.nutrition.missing);assert.equal(r.nutrition.source,'ingredients');
  assert.ok(r.nutrition.kcal>80&&r.nutrition.kcal<850,r.name);if(['Lunch','Dinner'].includes(r.cat))assert.ok(r.nutrition.p>=25,r.name);
  assert.ok(r.ings.every(x=>x[1]>0&&['g','ml','piece'].includes(x[2])),r.name);assert.ok(r.method.length>=3,r.name);
  assert.ok(r.equipment.every(e=>KitchenEquipment.names.includes(e)),r.name);assert.equal(r.testedInKitchen,false);assert.equal(r.kcal,null);assert.equal(r.cost,null);
  assert.equal(r.collection,'social');assert.equal(r.sourceType,'original');assert.equal(r.source,'');assert.equal(r.creator,undefined);assert.match(r.modifications,/not a copied creator recipe/);
 }
});

test('every used seasoning has a method stage and poultry, eggs and cold sauces have explicit handling',()=>{
 const spices=['Garlic','Paprika','Ground cumin','Chilli flakes','Dried mixed herbs','Taco seasoning','Cinnamon','Black pepper'];
 for(const r of recipes){
  const method=r.method.join(' ');
  for(const name of spices)if(r.ings.some(x=>x[0]===name)){const term=name.replace('Ground ','').replace('Dried mixed ','').toLowerCase();assert.ok(method.toLowerCase().includes(term),r.id+' missing '+name);}
  if(r.ings.some(x=>x[0]==='Chicken breast'||x[0]==='Turkey mince'||x[0]==='5% beef mince'))assert.match(method,/75°C for 30 seconds/,r.id);
  if(r.equipment.includes('Slow cooker')){assert.match(method,/thawed/i,r.id);assert.equal(r.passiveMinutes,240);assert.equal(r.fixedBatch,true);}
 }
 assert.match(recipes.find(r=>r.id==='viral-greek-chicken-flatbread').method.join(' '),/clean finishing sauce/);
 assert.match(recipes.find(r=>r.id==='viral-banana-bread-baked-oats').method.join(' '),/fully set.*no liquid egg/);
});

test('all new ingredients have full-pack price matches rather than unpriced additions',async()=>{
 const liquids=new Set(['Milk','Skimmed milk','Light coconut milk','Chicken stock','Soy sauce','Hot sauce','Lemon juice']);
 const names=[...new Set(recipes.flatMap(r=>r.ings.map(x=>x[0])))];
 const result=await recommendCatalogItems('Asda',names.map((name,i)=>({key:String(i),name,quantity:100,dimension:liquids.has(name)?'volume':'mass'})));
 for(const row of result.recommendations){assert.ok(row.plan,row.query);assert.ok(row.plan.products.length,row.query);for(const p of row.plan.products)assert.ok(p.priceGBP>0&&p.costGBP>0&&p.totalQuantity>0&&p.packs>0,row.query);}
});

test('eight freezer burrito batches buy every wrap and filling for one requested portion without multiplying the batch twice',()=>{
 const burritos=recipes.filter(r=>r.tags.includes('freezer-burrito'));assert.equal(burritos.length,8);
 for(const r of burritos){
  assert.equal(r.servings,4);assert.equal(r.fixedBatch,true);const method=r.method.join(' ');assert.match(method,/cool.*before assembling/i);assert.match(method,/Freeze promptly/);assert.match(method,/Defrost in the fridge/);assert.match(method,/reheat only once/);
  for(const portions of [[1],[1,1,1,1]]){const week=portions.map((_,i)=>({day:String(i),meals:[r.id]})),mealServings=Object.fromEntries(portions.map((p,i)=>[i+'::0',p]));
   const shopping=MealBudgetCore.buildShopping({recipes:[r],week,mealServings});assert.equal(shopping['wholemeal wrap'].groups.mass.need,248,r.id);
   const first=r.ings[0];const key=MealBudgetCore.canonicalIngredientName(first[0]);assert.equal(shopping[key].groups.mass.need,first[1],r.id);
  }
 }
});

test('new meals are searchable and available to planning while equipment and explicit preferences still constrain choices',()=>{
 const bang=recipes.find(r=>r.id==='viral-bang-bang-crunch');assert.equal(RecipeDiscoveryCore.matches(bang,'bang bang chicken'),true);
 const burrito=recipes.find(r=>r.id==='viral-smoky-turkey-lime-burritos');assert.equal(MealPreferencesCore.matches(burrito,'burritos'),true);
 const ready=RecipeLibraryCore.selectPlannerRecipes(recipes,{profile:{equipment:KitchenEquipment.names}},250);assert.equal(ready.length,60);
 const slow=recipes.find(r=>r.id==='viral-slow-creamy-cajun');assert.equal(RecipeLibraryCore.equipmentAllowed(slow,{equipment:['Hob']}),false);
 assert.equal(RecipeLibraryCore.equipmentAllowed(slow,{equipment:['Slow cooker','Hob']}),true);
});
