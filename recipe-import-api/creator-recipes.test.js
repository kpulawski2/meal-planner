import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readRecipeLibrary} from './recipe-fixtures.js';
import {recommendCatalogItems} from './catalog-adapter.js';
import '../public/budget-core.js';
import '../public/equipment-core.js';
import '../public/recipe-library-core.js';
import '../public/recipe-discovery-core.js';
import '../public/recipe-experience.js';
import '../public/meal-extras-core.js';
const library=await readRecipeLibrary(),rows=library.filter(row=>row.id.startsWith('creator-eliya-')),audit=JSON.parse(await readFile(new URL('../data/creator-source-audit.json',import.meta.url)));

test('the audited public creator archive is covered without duplicated roundups or unsupported attribution',()=>{
 assert.equal(rows.length,157);assert.equal(audit.sourceCount,150);assert.equal(audit.recipeCount,rows.length);
 assert.equal(new Set(library.map(row=>row.id)).size,library.length);
 const ids=new Set(rows.map(row=>row.id));
 for(const source of audit.sources){assert.match(source.url,/^https:\/\/eliyaeats\.com\/[a-z0-9-]+\/$/);assert.ok(source.recipeIds.length);for(const id of source.recipeIds)assert.ok(ids.has(id),source.title);}
 const multi=audit.sources.filter(source=>source.type==='roundup');assert.equal(multi.length,3);assert.ok(multi.some(source=>source.recipeIds.length===5));
 for(const row of rows){assert.equal(row.creator,'@eliyaeats');assert.equal(row.sourceType,'creator-adaptation');assert.equal(row.license,undefined);assert.match(row.modifications,/independent metric quantities/);assert.ok(audit.sources.some(source=>source.url===row.source&&source.recipeIds.includes(row.id)));assert.equal(row.sourceCheckedAt,audit.sources.find(source=>source.url===row.source).checkedAt);assert.equal(row.image,undefined);assert.equal(row.kcal,null);assert.equal(row.cost,null);}
 assert.match(audit.scope,/not a claim to cover every TikTok post or paid ebook/);
});

test('every adaptation has complete ingredient-derived nutrition, measured seasonings and explicit usable methods',()=>{
 assert.deepEqual(Object.fromEntries(['Breakfast','Lunch','Dinner','Snack'].map(cat=>[cat,rows.filter(r=>r.cat===cat).length])),{Breakfast:34,Lunch:17,Dinner:27,Snack:79});
 for(const row of rows){
  assert.equal(row.nutrition.complete,true,row.name+': '+row.nutrition.missing);assert.equal(row.nutrition.source,'ingredients');assert.ok(row.nutrition.kcal>0&&row.nutrition.kcal<850,row.name);
  if(['Lunch','Dinner'].includes(row.cat))assert.ok(row.nutrition.p>=25,row.name);
  assert.ok(row.ings.every(ing=>ing[1]>0&&['g','ml','piece'].includes(ing[2])),row.name);assert.ok(row.method.length>=5,row.name);assert.ok(row.equipment.every(name=>KitchenEquipment.names.includes(name)),row.name);assert.equal(row.testedInKitchen,false);
  if(row.ings.some(ing=>ing[0]==='Chicken breast'))assert.match(row.method.join(' '),/75°C for 30 seconds/,row.id);
  if(row.ings.some(ing=>ing[0]==='Rice'))assert.match(row.method.join(' '),/within one hour.*24 hours/,row.id);
  if(row.fixedBatch)assert.equal(row.batchStorage,'recipe');
 }
});

test('new creator meals respect one chosen portion and batch treats retain real preparation quantities',()=>{
 const dinner=rows.find(r=>r.id==='creator-eliya-chicken-funghi');assert.equal(dinner.servings,1);assert.equal(dinner.fixedBatch,undefined);
 const shopping=MealBudgetCore.buildShopping({recipes:[dinner],week:[{day:'Monday',meals:[dinner.id]}],mealServings:{'Monday::0':1}});
 assert.equal(shopping['chicken breast'].groups.mass.need,180);assert.equal(shopping.potato.groups.mass.need,220);assert.equal(shopping['olive oil'].groups.volume.need,5/.92);
 const truffles=rows.find(r=>r.id==='creator-eliya-tiramisu-truffles'),batch=MealBudgetCore.buildShopping({recipes:[truffles],week:[{day:'Monday',meals:[truffles.id]}],mealServings:{'Monday::0':1}});
 assert.equal(truffles.servingLabel,'2 truffles');assert.equal(batch.dates.groups.mass.need,160);assert.equal(batch['white chocolate'].groups.mass.need,50);
});

test('creator search and planning include these recipes while dislikes, equipment and component roles remain effective',()=>{
 const chicken=rows.find(r=>r.id==='creator-eliya-chicken-funghi');assert.ok(RecipeDiscoveryCore.matches(chicken,'eliya eats chicken mushrooms'));
 const air=rows.find(r=>r.id==='creator-eliya-chicken-mayo-burger');assert.equal(RecipeLibraryCore.equipmentAllowed(air,{equipment:['Hob']}),false);
 const sauce=rows.find(r=>r.id==='creator-eliya-sweet-sour-sauce');assert.equal(RecipeLibraryCore.planReady(sauce),false);assert.equal(MealExtrasCore.pairable(sauce),true);
 const state={profile:{equipment:KitchenEquipment.names,varietyMode:'Repeat favourites',repeatMeals:{Dinner:chicken.id}},favorites:[sauce.id],recipeFeedback:[]};
 const selected=RecipeLibraryCore.selectPlannerRecipes(library,state);assert.equal(selected.length,250);assert.ok(selected.some(r=>r.id===chicken.id));assert.ok(!selected.some(r=>r.id===sauce.id));
 RecipeExperience.setFeedback(state,chicken,'skip');assert.ok(!RecipeLibraryCore.selectPlannerRecipes(library,state).some(r=>r.id===chicken.id));
});

test('original pairing recipes remain separate from creator credits and cover sauces and vegetable or starchy sides',()=>{
 const extras=library.filter(r=>r.id.startsWith('extra-pairing-'));assert.equal(extras.length,14);assert.equal(extras.filter(r=>r.recipeRole==='Sauce').length,8);
 for(const row of extras){assert.equal(row.creator,undefined);assert.equal(row.sourceType,'original');assert.equal(row.nutrition.complete,true);assert.equal(row.automaticMeal,false);assert.ok(MealExtrasCore.pairable(row));}
 const candidates=MealExtrasCore.candidates(library,{nutrition:r=>r.nutrition,allowed:r=>KitchenEquipment.allowed(r,{equipment:KitchenEquipment.names})});assert.ok(extras.every(row=>candidates.some(candidate=>candidate.id===row.id)));assert.ok(candidates.some(r=>r.id==='extra-pairing-garlic-yoghurt'));assert.ok(candidates.some(r=>r.id==='creator-eliya-carrot-fries'));
});

test('new creator ingredients match the correct real packs, including breakfast cereal and fresh herbs',async()=>{
 const requests=[['Wheat biscuits','mass'],['Worcestershire sauce','volume'],['White miso paste','mass'],['Tomato puree','mass'],['Tomato ketchup','volume'],['Speculoos biscuit spread','mass'],['Speculoos biscuits','mass'],['Crisp rice cereal','mass'],['Fresh ginger','mass'],['Fresh parsley','mass'],['Fresh basil','mass'],['White chocolate','mass'],['Gochujang','mass']];
 const result=await recommendCatalogItems('Asda',requests.map(([name,dimension],i)=>({key:String(i),name,dimension,quantity:100})));
 for(const row of result.recommendations){
  if(['Wheat biscuits','Worcestershire sauce','White miso paste','Tomato puree','Speculoos biscuit spread','Crisp rice cereal','White chocolate','Gochujang'].includes(row.query))assert.ok(row.plan?.products.length,'Expected catalogue pack for '+row.query);
  // Some catalogue snapshots only list chocolate-coated Biscoff biscuits.
  // An explicit gap is correct until a plain product is actually present.
  if(row.query==='Speculoos biscuits'&&row.match)assert.doesNotMatch(row.match.productName,/chocolate|sandwich|ice cream/i);
  for(const product of row.plan?.products||[]){
   assert.ok(product.priceGBP>0);assert.match(product.url,/^https:\/\/www\.asda\.com\/groceries\/product\//);
   if(row.query==='Wheat biscuits'){assert.match(product.category,/cereal/i);assert.match(product.productName,/weetabix|wheat.*(?:biscuit|bisks)/i);assert.doesNotMatch(product.productName,/petit beurre|chocolate|bites|bran|oatibix|protein/i);}
   if(row.query==='Crisp rice cereal'){assert.match(product.category,/cereal/i);assert.match(product.productName,/rice.*(?:krispies|snaps)/i);assert.doesNotMatch(product.productName,/square|chocolate|mallow|bar/i);}
   if(/^Fresh /.test(row.query)){assert.match(product.category,/fresh.*(?:herb|vegetable|salad)/i);assert.doesNotMatch(product.productName,/dried|powder|paste|tea|juice|sauce/i);}
   if(row.query==='White chocolate')assert.doesNotMatch(product.productName,/biscuit|wafer|cookie|protein|dessert/i);
   if(row.query==='Gochujang')assert.doesNotMatch(product.productName,/spam|pork|ham|chicken|meal/i);
   if(row.query==='Speculoos biscuit spread')assert.match(product.productName,/biscoff.*spread/i);
   if(row.query==='Speculoos biscuits')assert.doesNotMatch(product.productName,/chocolate|sandwich|ice cream/i);
  }
 }
});
