import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/food-nutrients-core.js';
import '../public/barcode-core.js';
import '../public/food-log-core.js';
import '../public/recipe-experience.js';
const Nutrients=globalThis.FoodNutrientsCore,Food=globalThis.FoodLogCore,Barcode=globalThis.BarcodeCore,Taste=globalThis.RecipeExperience;
const code='3017620422003';
const raw={product:{code,product_name:'Fixture skyr',brands:'Fixture',serving_size:'1 pot (150 g)',serving_quantity:150,product_quantity:450,product_quantity_unit:'g',nutriments:{'energy-kcal_100g':63,proteins_100g:11,carbohydrates_100g:4,fat_100g:.2,fiber_100g:0,sugars_100g:4,'saturated-fat_100g':.1,salt_100g:.1,sodium_100g:.04}}};
test('barcode portions retain declared serving and pack weights without inventing volume conversions',()=>{
 const product=Barcode.product(raw,code);assert.equal(product.serving.quantity,150);assert.equal(product.pack.quantity,450);assert.equal(product.nutrition.sodium,40);
 const drink=Barcode.product({product:{...raw.product,product_quantity:1,product_quantity_unit:'l',serving_size:'250 ml'}},code);assert.equal(drink.unit,'ml');assert.equal(drink.serving.quantity,250);assert.equal(drink.pack.quantity,1000);
 const unknown=Barcode.product({product:{...raw.product,serving_size:'one bowl',serving_quantity:undefined,product_quantity_unit:'unknown'}},code);assert.equal(unknown.serving,undefined);assert.equal(unknown.pack,undefined);
 assert.equal(Nutrients.portion({quantity:150,unit:'g'},'ml'),null);
});
test('expanded nutrients scale with servings, survive reload, and unknowns remain separate from zero',()=>{
 const product=Barcode.product(raw,code),state={};Food.saveFood(state,product,{id:'skyr'});Food.record(state,{date:'2026-10-21',meal:'Snack',food:product,quantity:75},{id:'first'});
 assert.equal(state.foodLog[0].nutrition.kcal,47.25);assert.equal(state.foodLog[0].nutrition.sugar,3);assert.equal(state.foodLog[0].nutrition.sodium,30);assert.equal(state.foodLog[0].meal,'Snack');
 Food.record(state,{date:'2026-10-21',food:{name:'Other food',quantity:100,unit:'g',nutrition:{kcal:100}},quantity:100},{id:'second'});
 const restored=Food.normalizeState(JSON.parse(JSON.stringify(state))),summary=Food.summary(restored,'2026-10-21');assert.equal(summary.extraTotals.fiber,0);assert.equal(summary.extraMissing.fiber,1);assert.equal(summary.extraTotals.sodium,30);assert.equal(restored.savedFoods[0].serving.quantity,150);
 assert.equal(Barcode.product({product:{...raw.product,no_nutrition_data:'on'}},code).nutrition.sodium,null);assert.equal(Nutrients.off({fiber_100g:false}).fiber,null);
});
test('disliking a repeat removes conflicting future choices without deleting the saved week, pantry or history',()=>{
 const rows=[{id:'oats'},{id:'tuna'},{id:'tuna-copy',copiedFrom:{recipeId:'tuna'}}],state={profile:{varietyMode:'Repeat favourites',repeatMeals:{Breakfast:'oats',Lunch:'tuna'},calories:1600,protein:150},week:[{day:'Monday',meals:['oats','tuna','tuna-copy']}],locked:{'Monday::1':true},foodLog:[{id:'past'}],pantry:[{id:'stock'}],kitchenConversation:{planDraft:{old:true}}};
 const before=JSON.stringify([state.week,state.pantry,state.foodLog]);Taste.setFeedback(state,'tuna','skip');Taste.excludeFutureChoices(state,rows);
 assert.equal(state.profile.repeatMeals.Breakfast,'oats');assert.equal(state.profile.repeatMeals.Lunch,undefined);assert.equal(state.locked['Monday::1'],undefined);assert.equal(state.profile.calories,1600);assert.equal(state.profile.protein,150);assert.equal(state.kitchenConversation.planDraft,null);assert.equal(Taste.allowedFeedback(rows[2],state),false);assert.equal(JSON.stringify([state.week,state.pantry,state.foodLog]),before);
 const restored=JSON.parse(JSON.stringify(state));Taste.normalizeState(restored);assert.equal(Taste.allowedFeedback(rows[1],restored),false);Taste.setFeedback(restored,'tuna',null);assert.equal(Taste.allowedFeedback(rows[1],restored),true);
});
test('clearing an inherited dislike permits a copy while preserving the original choice across reload',()=>{
 const original={id:'original'},copy={id:'copy',copiedFrom:{recipeId:'original'}},state={};Taste.setFeedback(state,original,'skip');assert.equal(Taste.allowedFeedback(copy,state),false);
 Taste.setFeedback(state,copy,null);assert.equal(Taste.feedbackValue(copy,state),null);assert.equal(Taste.allowedFeedback(original,state),false);
 const restored=JSON.parse(JSON.stringify(state));Taste.normalizeState(restored);assert.equal(Taste.allowedFeedback(copy,restored),true);assert.equal(Taste.allowedFeedback(original,restored),false);
 Taste.setFeedback(restored,copy,'skip');assert.equal(Taste.allowedFeedback(copy,restored),false);Taste.setFeedback(restored,copy,null);assert.equal(Taste.allowedFeedback(copy,restored),true);assert.equal(Taste.feedbackScore(copy,restored),0);
});
