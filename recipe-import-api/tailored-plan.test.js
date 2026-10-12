import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { normalizePlannerRequest } from './planner-request.js';
import { interpretMealRequest } from './meal-intent.js';
import { macroPortionVertices } from './macro-portions.js';
import { optimizeMealPlan } from './budget-planner.js';
import '../public/swap-core.js';
const Intent=globalThis.MealIntentCore,Macros=globalThis.MacroGoalsCore,Core=globalThis.MealBudgetCore;
const recipes=await readRecipeLibrary();
const example='For the next 7 days I want a variety of overnight oats for breakfast, tuna pickles eggs and mayo salad with a wrap for lunch and a chicken dish for dinner, making it be 1800 calories a day or under with 180g protein, 90g carbs and as little or no fats at all';
const labelledExample='For the next 14 days i want to have the following meals:\n\nbreakfast: overnight oats variety\nlunch: tuna based dish, salad boxes or wrap\ndinner: anything chicken, 1 day where i can have a steak maybe at the end of the 2 weeks\n\nplease keep the fats as low as possible, my ideal macros are as follows:\ncalories: 1600 or less\nProtein: 150g\ncarbs: 90g\nfats: 20g';
const brief=Intent.parse(example);
const profile={...brief,people:1,budget:70,cookTime:45,equipment:['Hob'],varietyMode:'Tailored',tailoredMeals:{Breakfast:{mode:'vary',query:'overnight oats',recipeIds:['tailored-berry-oats','tailored-apple-oats','tailored-banana-oats']},Lunch:{mode:'repeat',query:'tuna pickles eggs mayo wrap',recipeIds:['tailored-tuna-wrap']},Dinner:{mode:'vary',query:'chicken dish',recipeIds:['tailored-lemon-chicken','tailored-paprika-chicken']}}};
const request=()=>({profile:structuredClone(profile),recipes:recipes.filter(r=>Object.values(profile.tailoredMeals).some(row=>row.recipeIds.includes(r.id))),pantry:[],week:[],mealServings:{},locked:{}});
test('the example preserves all requested foods and interprets maximum calories, minimum protein and optional macros',()=>{
 assert.equal(brief.days,7);assert.equal(brief.meals,3);assert.equal(brief.calories,1800);assert.equal(brief.protein,180);
 assert.deepEqual(brief.nutritionTargets,{calorieMode:'max',carbs:90,carbMode:'target',fatMax:null,minimiseFat:true});
 assert.equal(brief.requests.Breakfast.mode,'vary');assert.equal(brief.requests.Lunch.mode,'repeat');assert.equal(brief.requests.Dinner.mode,'vary');
 assert.match(brief.requests.Lunch.query,/tuna pickles eggs and mayo/);
 for(const text of ['For the next month, overnight oats for breakfast','For 3 weeks, chicken for dinner'])assert.throws(()=>Intent.normaliseBrief(Intent.parse(text)),/days/);
 assert.equal(Intent.parse('For two weeks, breakfast: overnight oats; lunch: tuna wrap; dinner: chicken').days,14);
 assert.equal(Intent.parse('1800 calories or under and under 90g carbs and 0g fat').nutritionTargets.fatMax,0);
 assert.equal(Intent.parse('1800 calories or under and under 90g carbs').nutritionTargets.carbMode,'max');
});
test('recipe matching requires every named food and actual chicken meat, with familiar pickle/mayo aliases',()=>{
 const wrap=recipes.find(r=>r.id==='tailored-tuna-wrap');assert.equal(Intent.matches(wrap,brief.requests.Lunch.query),true);
 for(const word of ['Tuna','Pickled gherkins','Eggs','Mayonnaise','Wholemeal wrap'])assert.equal(Intent.matches({...wrap,ings:wrap.ings.filter(row=>row[0]!==word)},brief.requests.Lunch.query),false,word);
 assert.equal(Intent.matches({name:'Beef stew',ings:[['Beef',200,'g'],['Chicken stock',100,'ml']]},'chicken dish'),false);
 assert.equal(Intent.matches(recipes.find(r=>r.id==='tailored-berry-oats'),'overnight oats'),true);
 assert.equal(Intent.matches(recipes.find(r=>r.id==='tailored-berry-oats'),'high-protein overnight oats'),true);
 assert.equal(Intent.matches(recipes.find(r=>r.id==='tailored-lemon-chicken'),'overnight oats'),false);
});
test('labelled macros never consume the previous line and alternatives retain their required tuna',()=>{
 const b=Intent.parse(labelledExample);assert.equal(b.days,14);assert.equal(b.meals,3);assert.equal(b.calories,1600);assert.equal(b.protein,150);assert.deepEqual(b.nutritionTargets,{calorieMode:'max',carbs:90,carbMode:'target',fatMax:20,minimiseFat:true});assert.equal(b.requests.Lunch.mode,'vary');assert.equal(b.requests.Dinner.query,'anything chicken');assert.equal(b.requests.Dinner.mode,'vary');assert.deepEqual(b.scheduledMeals,[{day:14,category:'Dinner',query:'steak'}]);
 for(const name of ['social-tuna-pasta-prep','tailored-tuna-wrap','lighter-tuna-egg-salad'])assert.equal(Intent.matches(recipes.find(r=>r.id===name),b.requests.Lunch.query),true,name);
 assert.equal(Intent.matches({name:'Chicken wrap',ings:[['Chicken breast',200,'g'],['Wholemeal wrap',62,'g']]},b.requests.Lunch.query),false);
 assert.equal(Intent.matches({name:'Tuna potato',ings:[['Tuna',150,'g'],['Potato',200,'g']]},b.requests.Lunch.query),false);
 assert.equal(Intent.matches({name:'Tuna wrap',ings:[['Tuna',150,'g'],['Wholemeal wrap',62,'g']]},'tuna salad or wrap'),true);
 assert.equal(Intent.matches({name:'Chicken',ings:[['Chicken breast',200,'g']]},'chicken or tuna'),true);
 assert.equal(Intent.parse('Protein: 150g\ncarbs: 90g\nfats: 20g').nutritionTargets.fatMax,20);
 assert.equal(Intent.parse('150g protein\n90g carbs\n20g fats').protein,150);
});
test('AI cannot overwrite labelled macro values or absorb the steak into every chicken dinner',async()=>{
 const result=await interpretMealRequest(labelledExample,{},async()=>JSON.stringify({...brief,days:7,calories:2000,protein:200,scheduledMeals:[],requests:{Dinner:{query:'chicken steak',mode:'repeat'}}}));assert.equal(result.source,'ai');assert.equal(result.calories,1600);assert.equal(result.protein,150);assert.equal(result.nutritionTargets.carbs,90);assert.equal(result.nutritionTargets.fatMax,20);assert.equal(result.nutritionTargets.calorieMode,'max');assert.deepEqual(result.scheduledMeals,[{day:14,category:'Dinner',query:'steak'}]);assert.equal(result.requests.Dinner.query,'anything chicken');
});
test('scheduled meals are validated and cannot escape their requested day or substitute for ordinary variety',()=>{
 const p={...profile,days:14,scheduledMeals:[{day:14,category:'Dinner',query:'steak',recipeIds:['tailored-medallion-steak']}]},steak=recipes.find(r=>r.id==='tailored-medallion-steak'),chicken=recipes.find(r=>r.id==='tailored-lemon-chicken');assert.equal(Intent.allowed(steak,p),true);assert.equal(Intent.allowed(steak,p,0),false);assert.equal(Intent.allowed(steak,p,13),true);assert.equal(Intent.allowed(chicken,p,13),false);
 for(const scheduledMeals of [[{...p.scheduledMeals[0],day:15}],[p.scheduledMeals[0],p.scheduledMeals[0]],[{...p.scheduledMeals[0],recipeIds:['missing']}],[{...p.scheduledMeals[0],category:'Breakfast'}]])assert.throws(()=>normalizePlannerRequest({...request(),profile:{...p,scheduledMeals},recipes:[...request().recipes,steak]}));
 const week=Array.from({length:14},(_,i)=>({day:Core.dayNames(14)[i],meals:[i%2?'tailored-apple-oats':'tailored-berry-oats','tailored-tuna-wrap',i===13?steak.id:i%2?'tailored-lemon-chicken':'tailored-paprika-chicken']}));assert.equal(Core.inspectVariety(week,recipes,p).met,true);const wrong=structuredClone(week);wrong[0].meals[2]=steak.id;assert.equal(Core.inspectVariety(wrong,recipes,p).met,false);const oneChicken=week.map((row,i)=>({...row,meals:[...row.meals.slice(0,2),i===13?steak.id:chicken.id]}));assert.equal(Core.inspectVariety(oneChicken,recipes,p).met,false,'A one-off steak does not satisfy the requested chicken variety');
 const sampled=globalThis.RecipeLibraryCore.selectPlannerRecipes(recipes,{profile:p},250);assert.ok(sampled.some(row=>row.id===steak.id));
});
test('the full-library labelled fourteen-day request checks £35 per week and one final steak dinner',async t=>{
 const b=Intent.parse(labelledExample),library=await readRecipeLibrary({includeWeb:true}),p={...b,people:1,budget:35,cookTime:45,equipment:['Hob'],supermarket:'Asda',varietyMode:'Tailored',goal:['Eat healthy','Save money','Make cooking easier'],tailoredMeals:{},scheduledMeals:[]};
 const find=(category,query)=>library.filter(r=>r.cat===category&&Intent.matches(r,query)&&globalThis.RecipeLibraryCore.equipmentAllowed(r,p)&&Macros.complete(r.nutrition,p)&&(r.cookTime??r.time??0)<=45).sort((a,b)=>(a.nutrition.f*5-a.nutrition.p)-(b.nutrition.f*5-b.nutrition.p)||a.name.localeCompare(b.name)).slice(0,30);
 for(const [category,row] of Object.entries(b.requests))p.tailoredMeals[category]={...row,recipeIds:find(category,row.query).map(r=>r.id)};
 p.scheduledMeals=b.scheduledMeals.map(row=>({...row,recipeIds:[find(row.category,row.query)[0].id]}));
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(library,{profile:p}),input=normalizePlannerRequest({profile:p,recipes:selected,pantry:[],week:[]}),before=structuredClone(input),result=await optimizeMealPlan(input);assert.deepEqual(input,before);assert.ok(['feasible','no_feasible_plan'].includes(result.status),JSON.stringify(result.warnings));if(result.status==='feasible')assert.ok(result.basket.totalCostGBP<=70);else assert.ok(result.basket.totalCostGBP>70&&result.budget.overGBP>0,'A changed live catalogue must report the actual budget gap, never weaken nutrition');assert.equal(result.week.length,14);assert.equal(result.variety.met,true);assert.equal(result.basket.complete,true);
 for(const [index,day] of result.week.entries()){assert.equal(day.meals.length,3);assert.ok(day.meals.every(id=>Intent.allowed(library.find(r=>r.id===id),p,index)));const n=Macros.total(day.meals.map(id=>library.find(r=>r.id===id).nutrition),day.meals.map((_,slot)=>result.mealServings[day.day+'::'+slot]));assert.equal(Macros.meets(n,p),true);assert.ok(n.kcal<=1600+.000001&&n.p>=150-.000001&&n.c>=81-.000001&&n.c<=99+.000001&&n.f<=20+.000001);}
 assert.equal(result.week.at(-1).meals[2],'tailored-medallion-steak');assert.equal(result.week.filter(day=>day.meals[2]==='tailored-medallion-steak').length,1);assert.ok(new Set(result.week.slice(0,13).map(day=>day.meals[2])).size>=2);assert.ok(result.diagnostics.elapsedMs<30000);t.diagnostic('Exact request: £'+result.basket.totalCostGBP+' for 14 days, steak only on day 14, with all per-day macros checked from portions.');
 const failInput={...input,profile:{...input.profile,budget:1}},unchanged=structuredClone(failInput),failed=await optimizeMealPlan(failInput);assert.notEqual(failed.status,'feasible');assert.deepEqual(failInput,unchanged);assert.equal(failed.diagnostics.budgetRecovery.attempted,true,'A failed preference search also checks cost without relaxing any caps');
});
test('AI interpretation cannot relax explicit numeric caps or erase recognised ingredients; unavailable AI still gives an editable brief',async()=>{
 const fake={...brief,calories:2200,protein:80,nutritionTargets:{calorieMode:'range',carbs:200,fatMax:50},requests:{Lunch:{query:'tuna',mode:'vary'}}};
 const result=await interpretMealRequest(example,{},async()=>JSON.stringify(fake));assert.equal(result.source,'ai');assert.equal(result.calories,1800);assert.equal(result.protein,180);assert.equal(result.nutritionTargets.carbs,90);assert.equal(result.nutritionTargets.calorieMode,'max');assert.equal(result.requests.Lunch.query,brief.requests.Lunch.query);
 const unavailable=await interpretMealRequest(example,{},async()=>{throw new Error('offline');});assert.equal(unavailable.source,'local');assert.deepEqual(unavailable.requests,brief.requests);
 assert.equal((await interpretMealRequest('For a month, oats for breakfast',{},async()=>{throw new Error('should not run');})).days,30);
 assert.throws(()=>normalizePlannerRequest({...request(),profile:{...profile,tailoredMeals:{Lunch:{mode:'repeat',recipeIds:['missing']}}}}),/missing/);
 assert.throws(()=>normalizePlannerRequest({...request(),profile:{...profile,nutritionTargets:{fatMax:-1}}}),/fatMax/);
 assert.throws(()=>normalizePlannerRequest({...request(),profile:{...profile,tailoredMeals:{Lunch:{mode:'repeat',recipeIds:['tailored-tuna-wrap','tailored-lemon-chicken']}}}}),/meal choices/);
});
test('unknown carbs or fat never satisfy limits and zero-fat caps remain strict',()=>{
 const n={kcal:1500,p:180,c:90,f:15,complete:true};assert.equal(Macros.meets(n,profile),true);assert.equal(Macros.meets({...n,kcal:1800.01},profile),false);
 for(const key of ['c','f']){assert.equal(Macros.complete({...n,[key]:null},profile),false);assert.equal(Macros.meets({...n,[key]:null},profile),false);}
 assert.equal(Macros.meets(n,{...profile,nutritionTargets:{...profile.nutritionTargets,fatMax:0}}),false);
 assert.equal(normalizePlannerRequest(request()).recipes.find(r=>r.id==='tailored-tuna-wrap').nutrition.c,recipes.find(r=>r.id==='tailored-tuna-wrap').nutrition.c);
 assert.equal(Macros.normalise({fatMax:0},true).fatMax,0);
});
test('portion search can satisfy four independent nutrient boundaries and locked portions',()=>{
 const rows=[{kcal:100,p:0,c:0,f:0},{kcal:100,p:10,c:0,f:0},{kcal:100,p:0,c:10,f:0},{kcal:100,p:0,c:0,f:10}].map(n=>({n:{...n,complete:true}}));
 const settings={calories:440,protein:12,nutritionTargets:{calorieMode:'max',carbs:11,carbMode:'max',fatMax:9}};
 const values=macroPortionVertices(rows,settings);assert.ok(values.length>0);assert.ok(values.every(f=>Macros.meets(Macros.total(rows,f),settings)));
 assert.ok(values.some(f=>Math.abs(f[0]-1.2)<1e-6&&Math.abs(f[1]-1.2)<1e-6&&Math.abs(f[2]-1.1)<1e-6&&Math.abs(f[3]-.9)<1e-6));
 const locked=macroPortionVertices(rows,settings,[1,null,null,null]);assert.ok(locked.length>0);assert.ok(locked.every(f=>f[0]===1));
});
test('the real measured example fits a priced seven-day plan with varied oats, an exact wrap and varied chicken dinners',async t=>{
 const input=normalizePlannerRequest(request()),before=structuredClone(input),result=await optimizeMealPlan(input);assert.deepEqual(input,before);
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.week.length,7);assert.equal(result.basket.complete,true);assert.ok(result.basket.totalCostGBP<=profile.budget);assert.equal(result.variety.met,true);
 assert.ok(result.variety.distinctRecipes.Breakfast>=2);assert.equal(result.variety.distinctRecipes.Lunch,1);assert.equal(result.variety.distinctRecipes.Dinner,2);
 for(const day of result.week){assert.equal(day.meals.length,3);assert.equal(day.meals[1],'tailored-tuna-wrap');const totals=Macros.total(day.meals.map(id=>recipes.find(r=>r.id===id).nutrition),day.meals.map((_,i)=>result.mealServings[day.day+'::'+i]));assert.equal(Macros.meets(totals,profile),true,JSON.stringify(totals));assert.ok(totals.f>0);}
 assert.ok(result.nutrition.days.every(day=>day.c!==null&&day.f!==null&&day.meetsTargets));t.diagnostic('Example basket £'+result.basket.totalCostGBP+'; estimated fat '+result.nutrition.days.map(d=>d.f).join(', ')+'g/day');
 const saved={...input,week:result.week,mealServings:result.mealServings,profile:{...input.profile,nutritionTargets:{...input.profile.nutritionTargets,fatMax:0}}},unchanged=structuredClone(saved),failed=await optimizeMealPlan(saved);assert.notEqual(failed.status,'feasible');assert.deepEqual(saved,unchanged);assert.deepEqual(failed.week,saved.week);
});
test('tailored rules also reject unrelated meals during variety and swap checks',()=>{
 const week=[{day:'Monday',meals:['tailored-berry-oats','tailored-tuna-wrap','tailored-lemon-chicken']},{day:'Tuesday',meals:['tailored-apple-oats','tailored-tuna-wrap','tailored-paprika-chicken']}],p={...profile,days:2};assert.equal(Core.inspectVariety(week,recipes,p).met,true);
 const altered=structuredClone(week);altered[0].meals[1]='everyday-tuna-pickle-egg-mayo-wrap';assert.equal(Core.inspectVariety(altered,recipes,p).met,false);
 const state={week,profile:p,mealServings:{}};const day=globalThis.MealSwapCore.dayNutrition(state,recipes,'Monday',r=>r.nutrition);assert.ok(day.c>0&&day.f>0);
 const capped={...state,profile:{...p,nutritionTargets:{...p.nutritionTargets,fatMax:0}}};assert.equal(globalThis.MealSwapCore.dayNutrition(capped,recipes,'Monday',r=>r.nutrition).met,false);
});
test('gathering from the full library retains macro-friendly recipes alongside cheaper higher-carb options',async t=>{
 const library=await readRecipeLibrary({includeWeb:true}),p={...profile,goal:[],tailoredMeals:{}};
 for(const [category,row] of Object.entries(brief.requests)){
  const choices=library.filter(r=>r.cat===category&&Intent.matches(r,row.query)&&globalThis.RecipeLibraryCore.equipmentAllowed(r,p)&&Macros.complete(r.nutrition,p)).sort((a,b)=>(a.nutrition.f*5-a.nutrition.p)-(b.nutrition.f*5-b.nutrition.p)||a.name.localeCompare(b.name)).slice(0,30);
  p.tailoredMeals[category]={...row,recipeIds:row.mode==='repeat'?[choices[0].id]:choices.map(r=>r.id)};
 }
 const selected=globalThis.RecipeLibraryCore.selectPlannerRecipes(library.filter(r=>Intent.allowed(r,p)),{profile:p});
 const result=await optimizeMealPlan(normalizePlannerRequest({profile:p,recipes:selected,pantry:[],week:[]}));
 assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.ok(result.nutrition.days.every(day=>day.meetsTargets));assert.ok(result.week.every(day=>day.meals[1]==='tailored-tuna-wrap'));assert.ok(result.diagnostics.elapsedMs<30000);t.diagnostic('Full-library example £'+result.basket.totalCostGBP+' in '+result.diagnostics.elapsedMs+' ms');
});
test('cooked historical meals and their quantities are preserved; an uncooked conflicting lock prevents applying a new request',async()=>{
 const input=request(),old=recipes.find(r=>r.id==='everyday-tuna-pickle-egg-mayo-wrap');input.recipes.push(old);
 input.week=[{day:'Monday',meals:['tailored-berry-oats',old.id,'tailored-lemon-chicken']}];input.mealServings={'Monday::0':1,'Monday::1':1,'Monday::2':1};input.cookedMeals={'Monday::1':{recipeId:old.id,servings:1}};
 const checked=normalizePlannerRequest(input),before=structuredClone(checked),result=await optimizeMealPlan(checked);assert.deepEqual(checked,before);assert.equal(result.status,'feasible',JSON.stringify(result.warnings));assert.equal(result.week[0].meals[1],old.id);assert.equal(result.mealServings['Monday::1'],1);assert.ok(result.week.slice(1).every(day=>day.meals[1]==='tailored-tuna-wrap'));
 const locked={...input,cookedMeals:{},locked:{'Monday::1':true}},failed=await optimizeMealPlan(normalizePlannerRequest(locked));assert.notEqual(failed.status,'feasible');assert.deepEqual(failed.week,locked.week);
});
