import test from 'node:test';
import assert from 'node:assert/strict';
import {readRecipeLibrary} from './recipe-fixtures.js';
import {normalizePlannerRequest} from './planner-request.js';
import '../public/budget-core.js';
import '../public/equipment-core.js';
import '../public/meal-rotation-core.js';
const recipes=(await readRecipeLibrary()).filter(r=>r.collection==='fakeaway');
test('thirty-four fakeaways include ten freezer burrito batches with complete calculated nutrition',()=>{
 assert.equal(recipes.length,34);assert.equal(new Set(recipes.map(r=>r.id)).size,34);
 const burritos=recipes.filter(r=>r.tags.includes('freezer-burrito'));assert.equal(burritos.length,10);
 assert.ok(burritos.some(r=>r.cat==='Breakfast'));assert.equal(burritos.filter(r=>r.cat==='Dinner').length,4);
 assert.ok(new Set(recipes.map(r=>r.flavourProfile)).size>=12);
 for(const r of recipes){
  assert.equal(r.nutrition.complete,true,r.name+': '+JSON.stringify(r.nutrition.missing));
  assert.equal(r.nutrition.source,'ingredients');assert.ok(r.nutrition.kcal>=400&&r.nutrition.kcal<850,r.name);
  assert.ok(r.nutrition.p>=30,r.name);assert.ok(r.nutrition.c>0&&r.nutrition.f>0);
  assert.equal(r.cost,null);assert.equal(r.kcal,null);assert.equal(r.testedInKitchen,false);
  assert.ok(r.ings.every(row=>row[1]>0&&['g','ml','piece'].includes(row[2])));
  assert.ok(r.method.length>=3);assert.ok(r.equipment.every(e=>globalThis.KitchenEquipment.names.includes(e)));
  assert.ok(r.tags.includes('fakeaway'));assert.ok(globalThis.MealRotationCore.flavour(r));
 }
 for(const r of burritos){assert.equal(r.servings,4);assert.equal(r.fixedBatch,true);assert.equal(r.batchStorage,'recipe');assert.match(r.method.join(' '),/four burritos/);assert.match(r.method.join(' '),/Freeze promptly/);assert.match(r.method.join(' '),/Defrost in the fridge/);}
});
test('creator idea references are distinguished from exact creator recipes and macro claims',()=>{
 const credited=recipes.filter(r=>r.creator);assert.equal(credited.length,6);
 for(const r of credited){assert.equal(r.creator,'@jalalsamfit');assert.equal(r.source,'https://jalalsamfit.jupiter.shop/');assert.equal(r.sourceType,'creator-idea');assert.match(r.modifications,/not the creator’s exact recipe/);}
 assert.ok(recipes.every(r=>!r.method.some(step=>/\d+\s*(?:calories|kcal|g protein)/i.test(step))));
});
test('a burrito batch buys every tortilla, filling, cheese and sauce once and supports remaining portions',()=>{
 const recipe=recipes.find(r=>r.id==='fakeaway-buffalo-prep-burritos'),core=globalThis.MealBudgetCore;
 const shopping=portions=>core.buildShopping({recipes:[recipe],week:portions.map((_,i)=>({day:String(i),meals:[recipe.id]})),mealServings:Object.fromEntries(portions.map((p,i)=>[i+'::0',p]))});
 for(const portions of [[1],[1,1,1,1]]){
  const basket=shopping(portions);assert.equal(basket['wholemeal wrap'].groups.mass.need,248);assert.equal(basket['chicken breast'].groups.mass.need,700);assert.equal(basket.cheddar.groups.mass.need,60);assert.equal(basket['hot sauce'].groups.volume.need,70);
 }
 assert.equal(shopping([1,1,1,1,1])['wholemeal wrap'].groups.mass.need,496);
 const normalized=normalizePlannerRequest({profile:{equipment:['Hob']},recipes});
 assert.equal(normalized.recipes.filter(r=>r.fixedBatch).length,10);assert.equal(normalized.recipes[0].flavourProfile,'sweet-chilli');
});
