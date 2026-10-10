import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {readRecipeLibrary} from './recipe-fixtures.js';
const recipes=await readRecipeLibrary();
const lighter=recipes.filter(r=>r.id.startsWith('lighter-'));
test('twelve measured lighter dishes contain complete ingredient nutrition and suitable meal categories',()=>{
  assert.equal(lighter.length,12);
  assert.ok(lighter.every(r=>r.nutrition.complete&&r.nutrition.kcal>100&&r.nutrition.kcal<520&&r.ings.every(i=>i[1]>0)));
  assert.equal(lighter.filter(r=>r.cat==='Lunch').length,4);
  assert.equal(lighter.filter(r=>r.cat==='Dinner').length,4);
  const wrap=lighter.find(r=>r.id==='lighter-tuna-egg-wrap');
  assert.ok(Math.abs(wrap.nutrition.kcal-394)<2);
  assert.ok(wrap.nutrition.p>=36&&wrap.nutrition.p<39);
  assert.ok(wrap.ings.some(row=>row[0]==='Lighter than light mayonnaise'&&row[1]===15));
  assert.ok(wrap.method.join(' ').includes('No cooking oil'));
});
test('same dish with different IDs cannot occupy two meal slots',async()=>{
  const core=await readFile(new URL('../public/budget-core.js',import.meta.url),'utf8');const context={};vm.runInNewContext(core,context);
  const a={id:'breakfast-egg',name:'Tomato Lentils and Poached Egg',cat:'Breakfast',ings:[['Eggs',2,'piece'],['Red lentils',40,'g'],['Chopped tomatoes',120,'g']]};
  const b={...a,id:'dinner-egg',name:'Eggs in Tomato Lentils',cat:'Dinner'};
  assert.equal(context.MealBudgetCore.distinctDishes([a,b]),false);
  assert.ok(context.MealBudgetCore.inspectVariety([{day:'Monday',meals:[a.id,b.id]}],[a,b],{meals:2}).violations.some(s=>s.includes('same dish')));
  assert.ok(context.MealBudgetCore.inspectVariety([{day:'Monday',meals:[a.id,b.id]}],[a,b],{meals:2}).violations.some(s=>s.includes('Lunch slot')));
});
test('the formerly duplicated dinner is now a rice, vegetable and tofu curry',()=>{
  const dinner=recipes.find(r=>r.id==='afford-egg-lentil-skillet');assert.equal(dinner.cat,'Dinner');assert.match(dinner.name,/Curry/);
  assert.ok(dinner.ings.some(r=>r[0]==='Rice'));assert.ok(!dinner.ings.some(r=>r[0]==='Eggs'));
});
