import test from 'node:test';
import assert from 'node:assert/strict';
import {readRecipeLibrary,readRecipeNutrition} from './recipe-fixtures.js';
import '../public/budget-core.js';
import '../public/pantry-core.js';
import '../public/plan-history-core.js';
import '../public/recipe-experience.js';
import '../public/equipment-core.js';
import '../public/meal-extras-core.js';
const core=MealExtrasCore,library=await readRecipeLibrary(),nutrition=await readRecipeNutrition(),main=library.find(r=>r.id==='creator-eliya-chicken-funghi'),sauce=library.find(r=>r.id==='extra-pairing-garlic-yoghurt'),side=library.find(r=>r.id==='extra-pairing-rice');
const options={recipes:library,nutrition},picks=[{recipeId:sauce.id,servings:1},{recipeId:side.id,servings:.5}];
const seed=()=>({profile:{people:1,equipment:KitchenEquipment.names,calories:2000,protein:150,budget:80,portionMode:'fixed',mealPortions:{Breakfast:2,Lunch:1,Dinner:1}},week:[{day:'Monday',meals:['everyday-fuel10k-chocolate-flakes-milk','tuna',main.id]},{day:'Tuesday',meals:['everyday-fuel10k-chocolate-flakes-milk','tuna',main.id]}],mealServings:{'Monday::0':2,'Monday::1':1,'Monday::2':1,'Tuesday::0':2,'Tuesday::1':1,'Tuesday::2':1},locked:{'Monday::2':true},customRecipes:[],pantry:[{id:'oats',name:'Oats',qty:500,unit:'g'}],leftovers:[],foodLog:[{id:'existing-log',name:'Lunch',nutrition:{kcal:400,p:30}}],purchases:[{id:'receipt'}],shopping:{milk:true},favorites:[],recipeFeedback:[],planCost:40});

test('calorie-limited additions show a combined measured meal and never resize its base ingredients',()=>{
 const next=core.preview(main,picks,{...options,calorieLimit:100});assert.equal(next.withinLimit,true);assert.ok(next.extraNutrition.kcal<=100);
 assert.equal(next.recipe.ings.find(ing=>ing[0]==='Chicken breast')[1],180);assert.equal(next.recipe.ings.find(ing=>ing[0]==='Rice')[1],17.5);assert.equal(next.recipe.cat,'Dinner');assert.equal(next.recipe.servings,1);assert.equal(next.recipe.custom,true);
 assert.ok(Math.abs(next.nutrition.kcal-nutrition(main).kcal-nutrition(sauce).kcal-nutrition(side).kcal*.5)<=1);
 assert.equal(core.preview(main,picks,{...options,calorieLimit:10}).withinLimit,false);
 for(const calorieLimit of ['',null,true,-1,Infinity,1001])assert.throws(()=>core.preview(main,picks,{...options,calorieLimit}),/limit/);
});

test('only one chosen meal changes; 2/1/1 portions, other days, locks, diary, pantry and purchases are preserved',()=>{
 const state=seed(),before=structuredClone(state),result=core.apply(state,{day:'Monday',index:2,picks,calorieLimit:100,id:'custom_test_extras'},library,{nutrition});
 assert.deepEqual(state,before);assert.equal(result.state.week[0].meals[0],before.week[0].meals[0]);assert.equal(result.state.week[0].meals[1],'tuna');assert.equal(result.state.week[1].meals[2],main.id);
 for(const key of ['profile','mealServings','locked','foodLog','pantry','leftovers','purchases','shopping'])assert.deepEqual(result.state[key],before[key],key);
 assert.equal(result.state.planCost,null);assert.equal(result.state.planSource,'manual');assert.equal(result.state.planRevisions[0].week[0].meals[2],main.id);
 const rows=[...library,result.recipe],shopping=MealBudgetCore.buildShopping({recipes:rows,week:[result.state.week[0]],mealServings:result.state.mealServings});assert.equal(shopping.rice.groups.mass.need,17.5);assert.ok(shopping['0% greek yoghurt'].groups.mass.need>=45);
});

test('replacing or removing extras restores the base without stacking a previous sauce or deleting unrelated meals',()=>{
 const first=core.apply(seed(),{day:'Monday',index:2,picks,calorieLimit:100,id:'custom_first'},library,{nutrition}),rows=[...library,first.recipe];
 const second=core.apply(first.state,{day:'Monday',index:2,picks:[{recipeId:sauce.id,servings:2}],calorieLimit:100,id:'custom_second'},rows,{nutrition});
 assert.equal(second.recipe.ings.some(row=>row[0]==='Rice'),false);assert.equal(second.recipe.ings.find(row=>row[0]==='0% Greek yoghurt')[1],90);
 const removed=core.apply(second.state,{day:'Monday',index:2,picks:[],calorieLimit:0,id:'custom_remove'},[...rows,second.recipe],{nutrition});assert.equal(removed.state.week[0].meals[2],main.id);assert.deepEqual(removed.state.mealServings,first.state.mealServings);
 assert.deepEqual(first.recipe,rows.at(-1));
});

test('an edited combined recipe becomes its own base rather than losing the user’s changes',()=>{
 const first=core.preview(main,picks,{...options,calorieLimit:100}),edited=structuredClone(first.recipe);edited.ings.find(row=>row[0]==='Chicken breast')[1]=210;
 const next=core.preview(edited,[],{...options,calorieLimit:0});assert.equal(next.recipe.ings.find(row=>row[0]==='Chicken breast')[1],210);assert.equal(next.base.mealExtras,undefined);
});

test('caps, food preferences, equipment and complete ingredient data are checked again at save',()=>{
 const state=seed();assert.throws(()=>core.apply(state,{day:'Monday',index:2,picks,calorieLimit:10},library,{nutrition}),/exceed/);
 assert.throws(()=>core.preview(main,[{recipeId:sauce.id,servings:1},{recipeId:sauce.id,servings:1}],options),/suitable/);
 for(const servings of [0,.1,4.1,NaN,true,''])assert.throws(()=>core.preview(main,[{recipeId:sauce.id,servings}],options),/amount/);
 assert.throws(()=>core.preview(main,[{recipeId:sauce.id,servings:1}],{...options,allowed:r=>r.id!==sauce.id}),/suitable/);
 assert.throws(()=>core.preview(main,[{recipeId:'missing',servings:1}],options),/suitable/);
 assert.throws(()=>core.preview(main,[{recipeId:sauce.id,servings:1}],{...options,nutrition:r=>r.id===sauce.id?{...nutrition(r),complete:false}:nutrition(r)}),/suitable/);
});

test('stale previews, changed settings and partially cooked meals cannot overwrite live state',()=>{
 const state=seed(),fingerprint=core.fingerprint(state,'Monday',2,library),next=structuredClone(state);next.profile.budget=70;
 assert.throws(()=>core.apply(next,{day:'Monday',index:2,picks,calorieLimit:100,expectedFingerprint:fingerprint},library,{nutrition}),/changed/);
 assert.throws(()=>core.apply(state,{day:'Monday',index:2,picks,calorieLimit:100},library,{nutrition,cooked:()=>true}),/Cooked portions/);
 PantryCore.initialise(state);state.pantryLedger.cooked[PantryCore.slotKey(state,'Monday',2)]={recipeId:main.id,recipeSignature:PantryCore.recipeSignature(main),servings:.25};
 assert.throws(()=>core.apply(state,{day:'Monday',index:2,picks,calorieLimit:100},library,{nutrition,cooked:PantryCore.isCooked}),/Cooked portions/);
});

test('household portions scale sauce and side once, and all original batch extras share whole prepared batches',()=>{
 const combined=core.preview(main,picks,{...options,calorieLimit:100}).recipe,shopping=MealBudgetCore.buildShopping({recipes:[combined],week:[{day:'Monday',meals:[combined.id]}],mealServings:{'Monday::0':2}});assert.equal(shopping.rice.groups.mass.need,35);assert.equal(shopping['chicken breast'].groups.mass.need,360);
 const batch=library.find(r=>r.id==='viral-chipotle-chicken-burritos')||library.find(r=>r.fixedBatch&&r.cat==='Dinner');
 const fixed=core.preview(batch,[{recipeId:sauce.id,servings:1}],{...options,calorieLimit:100,id:'combined_batch'}).recipe;assert.equal(fixed.fixedBatch,true);assert.equal(fixed.servings,batch.servings);
 const cart=MealBudgetCore.buildShopping({recipes:[fixed],week:[{day:'Monday',meals:[fixed.id]},{day:'Tuesday',meals:[fixed.id]}],mealServings:{'Monday::0':1,'Tuesday::0':1}});
 const expected=fixed.ings.find(row=>row[0]==='0% Greek yoghurt')[1];assert.equal(cart['0% greek yoghurt'].groups.mass.need,expected);
});

test('backup round-trip retains exact combined quantities, source credits and removable extras',()=>{
 const change=core.apply(seed(),{day:'Monday',index:2,picks,calorieLimit:100,id:'custom_backup'},library,{nutrition}),restored=JSON.parse(JSON.stringify(change.state)),recipe=restored.customRecipes.at(-1);
 assert.deepEqual(nutrition(recipe),nutrition(change.recipe));assert.equal(core.baseOf(recipe).id,main.id);assert.equal(recipe.mealExtras.items.length,2);assert.equal(recipe.source,main.source);
 const removed=core.apply(restored,{day:'Monday',index:2,picks:[],calorieLimit:0},[...library,...restored.customRecipes],{nutrition});assert.equal(removed.state.week[0].meals[2],main.id);
});

test('recipe and cooking ingredient groups keep each component’s oil and seasoning allocation separate',()=>{
 const oilySide=library.find(r=>r.id==='extra-pairing-potato-wedges'),result=core.preview(main,[{recipeId:oilySide.id,servings:1}],{...options,calorieLimit:200});
 const groups=core.componentGroups(result.recipe,2);assert.equal(groups.length,2);
 assert.equal(groups[0].ings.find(row=>row[0]==='Olive oil')[1],10);assert.equal(groups[1].ings.find(row=>row[0]==='Olive oil')[1],6);
 assert.equal(result.recipe.ings.find(row=>row[0]==='Olive oil')[1],8);
 const source=structuredClone(result.recipe);source.ings[0][1]+=1;assert.deepEqual(core.componentGroups(source,1),[]);
 const cereal={...library.find(r=>r.id==='everyday-fuel10k-chocolate-flakes-milk'),personalCereal:true};
 const withSauce=core.preview(cereal,[{recipeId:sauce.id,servings:1}],{...options,calorieLimit:100}).recipe;assert.equal(withSauce.personalCereal,undefined);assert.equal(withSauce.mealExtras.base.personalCereal,true);
});

test('a selected extra edited after preview cannot be silently substituted at save',()=>{
 const state=seed(),fingerprint=core.fingerprint(state,'Monday',2,library),edited=library.map(row=>row.id===sauce.id?{...row,ings:row.ings.map(ing=>[ing[0],ing[1]*1.1,ing[2]])}:row);
 assert.throws(()=>core.apply(state,{day:'Monday',index:2,picks,calorieLimit:100,expectedFingerprint:fingerprint},edited,{nutrition}),/changed/);
});

test('identical extras on separate days share a prepared batch while keeping individual calorie allowances',()=>{
 const batch=library.find(row=>row.fixedBatch&&row.cat==='Dinner'),state=seed();state.week[0].meals[2]=batch.id;state.week[1].meals[2]=batch.id;
 const choice=[{recipeId:sauce.id,servings:1}],first=core.apply(state,{day:'Monday',index:2,picks:choice,calorieLimit:100,id:'custom_monday'},library,{nutrition}),rows=[...library,first.recipe];
 const second=core.apply(first.state,{day:'Tuesday',index:2,picks:choice,calorieLimit:150,id:'custom_tuesday'},rows,{nutrition});
 assert.equal(second.recipe.id,first.recipe.id);assert.equal(second.state.customRecipes.length,1);assert.equal(second.state.mealExtraCaps['Monday::2'].calorieLimit,100);assert.equal(second.state.mealExtraCaps['Tuesday::2'].calorieLimit,150);
 const week=second.state.week.map(day=>({day:day.day,meals:[day.meals[2]]})),mealServings=Object.fromEntries(week.map(day=>[day.day+'::0',1]));
 const cart=MealBudgetCore.buildShopping({recipes:rows,week,mealServings});assert.equal(cart['0% greek yoghurt'].groups.mass.need,second.recipe.ings.find(row=>row[0]==='0% Greek yoghurt')[1]);
 const restored=JSON.parse(JSON.stringify(second.state));assert.deepEqual(restored.mealExtraCaps,second.state.mealExtraCaps);
});
