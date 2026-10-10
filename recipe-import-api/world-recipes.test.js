import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { recommendCatalogItems } from './catalog-service.js';
import '../public/budget-core.js';
import '../public/recipe-library-core.js';
const rows=(await readRecipeLibrary()).filter(row=>row.id.startsWith('world-'));

test('41 distinct sourced meal adaptations have complete measured nutrition and recipe credits',()=>{
 assert.equal(rows.length,41);
 assert.equal(new Set(rows.map(row=>row.name)).size,41);
 const counts={};
 for(const row of rows){
  counts[row.cat]=(counts[row.cat]||0)+1;
  assert.ok([2,4].includes(row.servings));assert.ok(row.cookTime>0&&row.cookTime<=45);
  assert.ok(row.ings.every(([name,qty])=>name&&Number.isFinite(qty)&&qty>0));
  assert.equal(row.nutrition.complete,true,`${row.name}: ${row.nutrition.missing}`);
  assert.equal(globalThis.RecipeLibraryCore.planReady(row),true);
  assert.ok(row.nutrition.kcal>0);assert.equal(row.cost,null);
  assert.equal(row.license,'CC BY-SA 4.0');assert.match(row.source,/^https:\/\/en.wikibooks.org\/wiki\/Cookbook/);
  assert.match(row.authorsUrl,/action=history/);assert.match(row.sourceRevision,/^\d+$/);
  assert.match(row.attribution,/Wikibooks contributors/);assert.ok(row.modifications);
  assert.equal(row.testedInKitchen,false);assert.ok(row.method.length>=2);
 }
 assert.deepEqual(counts,{Breakfast:4,Lunch:12,Dinner:21,Snack:4});
 assert.ok(new Set(rows.flatMap(row=>row.tags)).size>=15);
});

test('every measured world recipe has safe automatic ASDA ingredient and full-pack prices',{timeout:60000},async()=>{
 const core=globalThis.MealBudgetCore,items=new Map();
 for(const row of rows)for(const [name,qty,unit]of row.ings){
  if(core.isCookingWater(name))continue;
  const meta=core.unitMeta(unit,name),key=core.canonicalIngredientName(name)+'::'+meta.dim;
  if(!items.has(key))items.set(key,{key,name,dimension:meta.dim,quantity:qty*meta.factor});
 }
 const result=await recommendCatalogItems('Asda',[...items.values()]);
 assert.ok(result.indexSize>=10000);
 for(const row of result.recommendations){assert.equal(row.confidence,'high',row.query);assert.ok(row.plan?.products.length,row.query);}
});
