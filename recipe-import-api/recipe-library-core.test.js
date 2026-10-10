import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/recipe-library-core.js';
const core=globalThis.RecipeLibraryCore;
const row=(id,cat='Dinner',ingredient='Kidney beans')=>({id,name:id,cat,servings:2,ings:[[ingredient,200,'g']],nutrition:{kcal:400,p:25,complete:true}});
test('appliance recipes need explicit equipment opt-in',()=>{
 const recipe={...row('creami-ice'),equipment:['Ninja CREAMi']};
 assert.equal(core.equipmentAllowed(recipe,{}),false);
 assert.equal(core.equipmentAllowed(recipe,{equipment:['Ninja CREAMi']}),true);
 assert.equal(core.equipmentAllowed(row('ordinary'),{}),true);
});
test('incomplete amounts, yields and nutrition never qualify as ready',()=>{
 assert.equal(core.planReady(row('good')),true);
 for(const patch of [{servings:null},{needsReview:true},{ings:[['Oil',null,'g']]},{nutrition:{kcal:400,p:25,complete:false}}])assert.equal(core.planReady({...row('bad'),...patch}),false);
});
test('thousands of appended web recipes get a diverse bounded planner pool',()=>{
 const recipes=[];
 for(const cat of ['Breakfast','Lunch','Dinner','Snack'])for(let i=0;i<700;i++)recipes.push(row(`web-${cat}-${i}`,cat,i%2?'Chicken breast':'Red lentils'));
 for(const cat of ['Breakfast','Lunch','Dinner','Snack'])for(let i=0;i<20;i++)recipes.unshift(row(`ordinary-${cat}-${i}`,cat));
 recipes.push({...row('creami-ice','Snack'),equipment:['Ninja CREAMi']});
 const state={profile:{equipment:['Ninja CREAMi']},week:[{day:'Monday',meals:['web-Dinner-699']}],favorites:['web-Lunch-699']};
 const selected=core.selectPlannerRecipes(recipes,state);
 assert.equal(selected.length,250);assert.equal(new Set(selected.map(r=>r.id)).size,250);
 for(const id of ['web-Dinner-699','web-Lunch-699','creami-ice'])assert.ok(selected.some(r=>r.id===id));
 for(const cat of ['Breakfast','Lunch','Dinner','Snack'])assert.ok(selected.filter(r=>r.cat===cat).length>=20);
 assert.ok(selected.some(r=>r.id.startsWith('ordinary-')));
 assert.ok(selected.filter(r=>r.id.startsWith('web-')).length>100);
 assert.deepEqual(core.selectPlannerRecipes(recipes,state).map(r=>r.id),selected.map(r=>r.id));
});
test('current saved IDs are retained for validation even when quantities need review',()=>{
 const incomplete={...row('web-saved'),servings:null};
 assert.ok(core.selectPlannerRecipes([incomplete,row('ordinary')],{week:[{meals:['web-saved']}]}).some(r=>r.id==='web-saved'));
});
test('a partial or malformed downloaded library cannot replace the saved collection',()=>{
 const recipe={...row('web-one'),method:['Cook.'],source:'https://en.wikibooks.org/wiki/Cookbook:Beans',license:'CC BY-SA 4.0'};
 const data={schemaVersion:1,status:'complete',recipes:[recipe]};assert.equal(core.validLibrary(data),true);
 for(const patch of [{status:'partial'},{recipes:[]},{recipes:[recipe,recipe]},{recipes:[{...recipe,source:'javascript:alert(1)'}]}])assert.equal(core.validLibrary({...data,...patch}),false);
});
