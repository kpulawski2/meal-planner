import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import '../public/budget-core.js';
import { recipeQuality } from './planner-quality.js';

const core = globalThis.MealBudgetCore;

test('shopping cost inputs combine a shared ingredient across recipes, scaled yields and people', () => {
  const recipes = [
    { id: 'one', servings: 2, ings: [['Rice', 400, 'g']] },
    { id: 'two', servings: 1, ings: [['rice', .1, 'kg']] },
  ];
  const map = core.buildShopping({ recipes, week: [{ day: 'Monday', meals: ['one', 'two'] }], people: 2 });
  assert.equal(Object.keys(map).length, 1);
  assert.equal(map.rice.groups.mass.need, 600);
  assert.equal(map.rice.groups.mass.remaining, 600);
});

test('pantry deductions use the same mixed-unit conversion as recipe quantities', () => {
  const recipes = [{ id: 'one', servings: 1, ings: [['Cinnamon', 1, 'tsp'], ['Cinnamon', 5, 'g'], ['Rice', 750, 'g']] }];
  const map = core.buildShopping({ recipes, week: [{ day: 'Monday', meals: ['one'] }],
    pantry: [{ name: 'cinnamon', qty: 2, unit: 'g' }, { name: 'RICE', qty: .5, unit: 'kg' }] });
  assert.equal(Object.keys(map.cinnamon.groups).length, 1);
  assert.ok(Math.abs(map.cinnamon.groups.mass.need - 7.6) < 1e-6);
  assert.ok(Math.abs(map.cinnamon.groups.mass.remaining - 5.6) < 1e-6);
  assert.equal(map.rice.groups.mass.remaining, 250);
  assert.ok(map.cinnamon.quantityNotes.length);
});

test('a produce item and a mass portion share one purchase requirement, without counting inventory twice', () => {
  const recipes = [{ id: 'one', ings: [['Cucumber', 1, ''], ['Cucumber', 100, 'g']] }];
  const map = core.buildShopping({ recipes, week: [{ day: 'Monday', meals: ['one'] }],
    pantry: [{ name: 'Cucumber', qty: 1, unit: 'pieces' }] });
  assert.equal(Object.keys(map.cucumber.groups).length, 1);
  assert.equal(map.cucumber.groups.mass.need, 400);
  assert.equal(map.cucumber.groups.mass.pantryUsed, 300);
  assert.equal(map.cucumber.groups.mass.remaining, 100);
});

test('explicit fractional meal portions scale shopping quantities without rounding to whole people', () => {
  const map = core.buildShopping({ recipes: [{ id: 'one', servings: 2, ings: [['Chicken breast', 400, 'g']] }],
    week: [{ day: 'Monday', meals: ['one'] }], people: 3, mealServings: { 'Monday::0': 1.25 } });
  assert.equal(map['chicken breast'].groups.mass.remaining, 250);
});

test('missing quantities and unknown recipes remain explicit unpriced requirements', () => {
  const map = core.buildShopping({ recipes: [{ id: 'one', ings: [['Mystery sauce', 0, 'quantity to confirm']] }],
    week: [{ day: 'Monday', meals: ['one', 'missing'] }] });
  assert.equal(map['mystery sauce'].unknown, true);
  assert.equal(map['unknown recipe missing'].unknown, true);
});

test('ingredient names that resemble object properties remain normal shopping entries', () => {
  const map = core.buildShopping({ recipes: [{ id: 'one', ings: [['__proto__', 50, 'g'], ['constructor', 10, 'g']] }],
    week: [{ day: 'Monday', meals: ['one'] }] });
  assert.equal(map.__proto__.groups.mass.remaining, 50);
  assert.equal(map.constructor.groups.mass.remaining, 10);
});

test('cooking tap water is not a shop requirement, but bottled water remains a product', () => {
  const map = core.buildShopping({ recipes: [{ id: 'water', ings: [['Rice', 100, 'g'], ['Tap water', 500, 'ml'], ['Water', 100, 'ml'], ['Bottled water', 300, 'ml']] }], week: [{ day: 'Monday', meals: ['water'] }] });
  assert.equal(map['tap water'], undefined);
  assert.equal(map.water, undefined);
  assert.equal(map['bottled water'].groups.volume.need, 300);
});

test('goal preferences use ingredient quality, protein density and known cooking times', () => {
  const plain = { servings: 1, ings: [['Rice', 100, 'g']], nutrition: { kcal: 500, p: 10 }, cookTime: 40 };
  const healthy = { ...plain, ings: [['Wholegrain rice', 100, 'g'], ['Red lentils', 100, 'g'], ['Carrot', 100, 'g']] };
  assert.ok(recipeQuality(healthy, { goal: ['Eat healthy'] }).penalty < recipeQuality(plain, { goal: ['Eat healthy'] }).penalty);
  assert.ok(recipeQuality({ ...plain, nutrition: { kcal: 500, p: 50 } }, { goal: ['Gain muscle'] }).penalty < recipeQuality(plain, { goal: ['Gain muscle'] }).penalty);
  assert.ok(recipeQuality({ ...plain, cookTime: 5 }, { goal: ['Make cooking easier'] }).penalty < recipeQuality(plain, { goal: ['Make cooking easier'] }).penalty);
  assert.ok(recipeQuality({ ...plain, cookTime: null }, { goal: ['Make cooking easier'], cookTime: 45 }).penalty > recipeQuality({ ...plain, cookTime: 5 }, { goal: ['Make cooking easier'] }).penalty);
});

const directory = await mkdtemp(path.join(os.tmpdir(), 'meal-budget-test-'));
process.env.ASDA_CATALOGUE_PATH = path.join(directory, 'products.json');
process.env.ASDA_CATALOGUE_META_PATH = path.join(directory, 'catalogue-meta.json');
const products = Array.from({ length: 110 }, (_, index) => ({ id: `asda-${8000000 + index}`,
  sku: String(8000000 + index), name: `ASDA Fixture Grocery ${index}`, category: 'Food cupboard',
  packQuantity: 500, packUnit: 'g', packSize: '500g', price: 2, availability: 'in_stock', available: true,
  url: `https://www.asda.com/groceries/product/fixture/${8000000 + index}` }));
Object.assign(products[0], { name: 'ASDA Porridge Oats 500g', category: 'Food cupboard > Breakfast cereal > Porridge', price: 1 });
Object.assign(products[1], { name: 'ASDA Chicken Breast Fillets 500g', category: 'Meat & Poultry > Chicken breasts', price: 3 });
Object.assign(products[2], { name: 'ASDA Long Grain Rice 1kg', category: 'Food cupboard > Rice', packQuantity: 1000, packSize: '1kg', price: 1 });
Object.assign(products[3], { name: 'ASDA Semi Skimmed Milk 1L', category: 'Chilled Food > Milk', packQuantity: 1000, packUnit: 'ml', packSize: '1L', price: 1 });
Object.assign(products[4], { name: 'ASDA Ground Cinnamon 100g', category: 'Food cupboard > Herbs & Spices > Cinnamon', packQuantity: 100, packSize: '100g', price: 1 });
Object.assign(products[5], { name: 'ASDA Chicken Breast Fillets 300g', category: 'Meat & Poultry > Chicken breasts', packQuantity: 300, packSize: '300g', price: 1.5 });
Object.assign(products[6], { name: 'ASDA Red Split Lentils 500g', category: 'Food cupboard > Lentils', price: 1 });
Object.assign(products[7], { name: 'ASDA Kidney Beans 500g', category: 'Food cupboard > Tinned Beans', price: 1 });
await Promise.all([
  writeFile(process.env.ASDA_CATALOGUE_PATH, JSON.stringify(products)),
  writeFile(process.env.ASDA_CATALOGUE_META_PATH, JSON.stringify({ status: 'complete', products_saved: products.length,
    products_expected: products.length, coverage: 1, refreshed_at: '2026-10-09T00:00:00Z' })),
]);
const recipe = (id, cat, ingredient, quantity = 100, unit = 'g') => ({ id, name: id, cat, servings: 2,
  ings: [[ingredient, quantity * 2, unit]], nutrition: { kcal: 500, p: 50, complete: true, source: 'verified' } });
const fixtureRecipes = [recipe('breakfast', 'Breakfast', 'Oats'), recipe('lunch', 'Lunch', 'Chicken breast'),
  recipe('dinner', 'Dinner', 'Rice'), recipe('snack', 'Snack', 'Milk', 100, 'ml'),
  ...[2, 3].flatMap(index => [recipe(`breakfast-${index}`, 'Breakfast', 'Oats'), recipe(`snack-${index}`, 'Snack', 'Milk', 100, 'ml')]),
  ...[2, 3, 4, 5].flatMap(index => [recipe(`lunch-${index}`, 'Lunch', 'Chicken breast'), recipe(`dinner-${index}`, 'Dinner', 'Rice')]),
  recipe('lentil-lunch', 'Lunch', 'Red lentils'), recipe('bean-lunch', 'Lunch', 'Kidney beans'),
  recipe('lentil-dinner', 'Dinner', 'Red lentils'), recipe('bean-dinner', 'Dinner', 'Kidney beans')];
const profile = { calories: 2000, protein: 200, budget: 45, days: 7, meals: 4, people: 1, cookTime: 45 };
let optimizeMealPlan;
async function optimize(request) {
  if (!optimizeMealPlan) ({ optimizeMealPlan } = await import('./budget-planner.js'));
  return optimizeMealPlan({ profile, recipes: fixtureRecipes, pantry: [], ...request });
}
test.after(() => rm(directory, { recursive: true, force: true }));

function assertCompleteBudget(result, recipes = fixtureRecipes) {
  assert.equal(result.status, 'feasible', JSON.stringify(result.diagnostics));
  assert.equal(result.basket.complete, true);
  assert.equal(result.variety.met, true, JSON.stringify(result.variety));
  assert.equal(core.inspectVariety(result.week, recipes, { ...profile, days: result.week.length }).met, true);
  assert.ok(result.basket.totalCostGBP <= result.budget.planGBP + .001);
  assert.ok(result.nutrition.days.length > 0);
  for (const day of result.nutrition.days) {
    assert.equal(day.complete, true);
    assert.equal(day.meetsTargets, true, JSON.stringify(day));
    assert.ok(day.kcal >= result.nutrition.calorieMin - .01);
    assert.ok(day.kcal <= result.nutrition.calorieMax + .01);
    assert.ok(day.p >= result.nutrition.proteinTarget - .01);
  }
  const recommendations = result.basket.recommendations || [];
  const sum = recommendations.reduce((total, row) => total + (row.plan?.totalCostGBP || 0), 0);
  assert.ok(Math.abs(sum - result.basket.totalCostGBP) < .01);
  for (const row of recommendations) {
    assert.ok(row.plan, JSON.stringify(row));
    assert.ok(row.plan.totalQuantity + 1e-6 >= row.plan.requestedQuantity);
    for (const product of row.plan.products) assert.ok(Number.isInteger(product.packs) && product.packs >= 1);
  }
}

test('optimizer prices whole packs from catalogue and checks every day against unchanged nutrition targets', async () => {
  const result = await optimize({});
  assertCompleteBudget(result);
  assert.equal(result.week.length, 7);
  assert.ok(result.week.every(day => day.meals.length === 4));
  assert.equal(result.budget.weeklyGBP, 45);
  assert.equal(result.budget.planGBP, 45);
  assert.equal(result.budget.overGBP, 0);
  assert.ok(result.variety.distinctRecipes.Lunch >= 3 && result.variety.distinctRecipes.Dinner >= 3);
  assert.ok(result.variety.distinctRecipes.Breakfast >= 2 && result.variety.distinctRecipes.Snack >= 2);
  assert.ok(result.variety.proteinFamilies.length >= 3);
  assert.ok(result.variety.dominantFamilyCount <= 7);
});

test('weekly search shares a fixed prepared batch across days and deducts pantry once', async () => {
  const tub = { ...recipe('tub', 'Snack', 'Milk', 1000, 'ml'), equipment: ['Ninja CREAMi'], fixedBatch: true, freezeMinutes: 1440 };
  const recipes = [...fixtureRecipes, tub];
  const week = [
    { day: 'Monday', meals: ['breakfast', 'lunch', 'dinner', 'tub'] },
    { day: 'Tuesday', meals: ['breakfast-2', 'lentil-lunch', 'dinner-2', 'snack'] },
    { day: 'Wednesday', meals: ['breakfast', 'bean-lunch', 'dinner-3', 'tub'] },
  ];
  const locked = Object.fromEntries(week.flatMap(day => day.meals.map((_, i) => [day.day + '::' + i, true])));
  const mealServings = Object.fromEntries(Object.keys(locked).map(key => [key, 1]));
  const request = { profile: { ...profile, days: 3, budget: 100, equipment: ['Ninja CREAMi'] }, recipes, week, locked, mealServings, pantry: [{ name: 'Milk', qty: 500, unit: 'ml' }] };
  const result = await optimize(request);
  assert.equal(result.status, 'feasible', JSON.stringify(result.warnings));
  assert.deepEqual(result.week, week);
  assert.equal(result.basket.items.find(item => item.key === 'milk::volume').quantity, 1600);
  assert.equal(result.basket.recommendations.find(item => item.key === 'milk::volume').plan.totalCostGBP, 2);
  assert.equal(result.diagnostics.searchCostGBP, result.basket.totalCostGBP, 'Beam search and final full-pack basket must use the same tub rounding');
  assert.ok(result.nutrition.days.every(day => day.kcal === 2000 && day.p === 200));
  const disabled = await optimize({ ...request, profile: { ...request.profile, equipment: [] } });
  assert.notEqual(disabled.status, 'feasible', 'A locked appliance recipe cannot bypass equipment opt-in');
});

test('more variety has higher explicit minimums and cannot silently relax them to fit a budget', async () => {
  const result = await optimize({ profile: { ...profile, varietyMode: 'More variety' } });
  assertCompleteBudget(result);
  assert.equal(result.variety.mode, 'More variety');
  assert.ok(result.variety.distinctRecipes.Lunch >= 4 && result.variety.distinctRecipes.Dinner >= 4);
  assert.ok(result.variety.distinctRecipes.Breakfast >= 3 && result.variety.distinctRecipes.Snack >= 3);
  assert.equal(result.variety.repeatLimitByCategory.Lunch, 2);
});

test('a repetitive or single-protein library cannot produce a false successful budget plan', async () => {
  const repetitive = await optimize({ recipes: fixtureRecipes.slice(0, 4) });
  assert.equal(repetitive.status, 'no_feasible_plan');
  assert.equal(repetitive.variety.met, false);
  assert.ok(repetitive.variety.violations.length);
  const porkOnly = fixtureRecipes.map(row => ['Lunch', 'Dinner'].includes(row.cat) ? { ...row, ings: [['Chicken breast', 200, 'g']] } : row);
  const result = await optimize({ recipes: porkOnly });
  assert.equal(result.status, 'no_feasible_plan');
  assert.equal(result.variety.met, false);
  assert.match(result.variety.violations.join(' '), /protein family|half/i);
});

test('locking the same main recipe all week is an explicit variety conflict', async () => {
  const week = core.dayNames(7).map(day => ({ day, meals: fixtureRecipes.slice(0, 4).map(row => row.id) }));
  const locked = Object.fromEntries(week.map(day => [`${day.day}::1`, true]));
  const result = await optimize({ week, locked });
  assert.notEqual(result.status, 'feasible');
  assert.ok(result.week.every(day => day.meals[1] === 'lunch'));
  assert.equal(result.variety.met, false);
});

test('the easier-cooking goal changes selections toward known short recipes', async () => {
  const recipes = fixtureRecipes.map(row => ({ ...row, cookTime: 40 })).concat(fixtureRecipes.map(row => ({ ...row, id: 'quick-' + row.id, name: 'Quick ' + row.name, cookTime: 5 })));
  const result = await optimize({ recipes, profile: { ...profile, goal: ['Make cooking easier'] } });
  assertCompleteBudget(result, recipes);
  assert.ok(result.week.flatMap(day => day.meals).filter(id => id.startsWith('quick-')).length >= 20);
  assert.deepEqual(result.goals.active, ['Make cooking easier']);
  assert.ok(result.goals.estimatedBatchCookingMinutes > 0);
});

test('fourteen days double the weekly household budget and scale real required quantities', async () => {
  const one = await optimize({});
  const two = await optimize({ profile: { ...profile, days: 14, people: 2 } });
  assertCompleteBudget(two);
  assert.equal(two.week.length, 14);
  assert.equal(two.budget.planGBP, 90);
  assert.equal(two.budget.weeklyGBP, 45);
  assert.ok(two.basket.totalCostGBP > one.basket.totalCostGBP * 2);
});

test('fully stocked pantry reduces the new shop cost without reducing food quantities or nutrition', async () => {
  const result = await optimize({ profile: { ...profile, budget: .01 }, pantry: [
    { name: 'Oats', qty: 20, unit: 'kg' }, { name: 'Chicken breast', qty: 20, unit: 'kg' },
    { name: 'Rice', qty: 20, unit: 'kg' }, { name: 'Milk', qty: 20, unit: 'l' },
    { name: 'Red lentils', qty: 20, unit: 'kg' }, { name: 'Kidney beans', qty: 20, unit: 'kg' },
  ] });
  assertCompleteBudget(result);
  assert.equal(result.basket.totalCostGBP, 0);
  assert.ok(result.week.length === 7);
});

test('an infeasible penny budget cannot be reported as successful or silently lower the user protein target', async () => {
  const result = await optimize({ profile: { ...profile, budget: .01 } });
  assert.equal(result.status, 'no_feasible_plan');
  assert.equal(result.nutrition.proteinTarget, 200);
  assert.equal(result.budget.weeklyGBP, .01);
  if (result.basket.complete) assert.ok(result.basket.totalCostGBP > result.budget.planGBP);
});

test('missing ingredient prices prevent a false feasible status', async () => {
  const recipes = fixtureRecipes.map(row => row.cat === 'Dinner' ? { ...row, ings: [['Uncatalogued ingredient zzz', 100, 'g']] } : row);
  const result = await optimize({ recipes });
  assert.notEqual(result.status, 'feasible');
});

test('locked slots preserve recipe and exact portions while the other slots are optimized', async () => {
  const week = core.dayNames(7).map(day => ({ day, meals: fixtureRecipes.slice(0, 4).map(r => r.id) }));
  const result = await optimize({ week, mealServings: { 'Monday::0': 1.5 }, locked: { 'Monday::0': true } });
  assertCompleteBudget(result);
  assert.equal(result.week[0].meals[0], 'breakfast');
  assert.equal(result.mealServings['Monday::0'], 1.5);
});

test('diet and dislikes remain hard constraints, even if they leave an empty meal category', async () => {
  for (const patch of [{ diet: 'Vegetarian' }, { diet: 'Vegan' }, { dislikes: 'chicken' }]) {
    const result = await optimize({ profile: { ...profile, ...patch } });
    assert.notEqual(result.status, 'feasible');
    assert.ok(!result.week?.some(day => day.meals?.includes('lunch')));
  }
});

test('incomplete recipe nutrition cannot be used to claim the daily targets are met', async () => {
  const recipes = fixtureRecipes.map(row => row.cat === 'Breakfast' ? { ...row, nutrition: { ...row.nutrition, complete: false } } : row);
  const result = await optimize({ recipes });
  assert.notEqual(result.status, 'feasible');
});

test('a supplied cooking time is a hard limit when all recipes for a category exceed it', async () => {
  const recipes = fixtureRecipes.map(row => row.cat === 'Breakfast' ? { ...row, cookTime: 90 } : row);
  const result = await optimize({ recipes, profile: { ...profile, cookTime: 15 } });
  assert.notEqual(result.status, 'feasible');
});

test('diet changes that conflict with a locked meal cannot silently approve the old meal', async () => {
  const week = core.dayNames(7).map(day => ({ day, meals: fixtureRecipes.slice(0, 4).map(r => r.id) }));
  const result = await optimize({ profile: { ...profile, diet: 'Vegetarian' }, week,
    locked: { 'Monday::1': true }, mealServings: { 'Monday::1': 1.5 } });
  assert.notEqual(result.status, 'feasible');
});

test('exact integer-pence basket sum includes mixed offers and pack rounding', async () => {
  const recipes = fixtureRecipes.map(row => row.id === 'lunch' ? recipe('lunch', 'Lunch', 'Chicken breast', 700) : row);
  const week = core.dayNames(1).map(day => ({ day, meals: fixtureRecipes.slice(0, 4).map(r => r.id) }));
  const locked = Object.fromEntries(week.map(day => [`${day.day}::1`, true]));
  const mealServings = Object.fromEntries(week.map(day => [`${day.day}::1`, 1]));
  const result = await optimize({ recipes, profile: { ...profile, days: 1, budget: 60 }, week, locked, mealServings });
  assertCompleteBudget(result);
  const totalPence = result.basket.recommendations.reduce((sum, row) => sum + row.plan.products.reduce((part, product) => part + Math.round(product.priceGBP * 100) * product.packs, 0), 0);
  assert.equal(totalPence, Math.round(result.basket.totalCostGBP * 100));
  const chicken = result.basket.recommendations.find(row => row.query === 'Chicken breast');
  assert.equal(chicken.plan.requestedQuantity, 700);
  assert.equal(chicken.plan.totalQuantity, 800);
  assert.equal(chicken.plan.products.length, 2);
  assert.equal(chicken.plan.totalCostGBP, 4.5);
});

test('drained tinned capacity comes from official unit prices while frozen and whole tomatoes retain net weight', async () => {
  const { calculatePackPurchase } = await import('./catalog-adapter.js');
  const product = (name, quantity, price, unitPrice, category) => ({ name, price, packQuantity: quantity, packUnit: 'g',
    packSize: `${quantity}g`, pricePerUnit: unitPrice, pricePerUnitLabel: `£${unitPrice}/KG`, category,
    url: 'https://www.asda.com/groceries/product/fixture/8000555' });
  const tuna = calculatePackPurchase([product('ASDA Tuna Chunks in Brine 145g', 145, .59, 5.78431, 'Food cupboard > Tinned Fish > Tuna')], 145, 'mass');
  assert.equal(tuna.products[0].packs, 2);
  assert.equal(tuna.totalQuantity, 204);
  assert.equal(tuna.totalCostGBP, 1.18);
  assert.equal(tuna.products[0].packSize, '145g');
  assert.ok(tuna.estimatedQuantity);
  assert.match(tuna.estimateNotes.join(' '), /drain/i);
  const sweetcorn = calculatePackPurchase([product('ASDA Sweetcorn 326g', 326, .5, 1.92308, 'Food cupboard > Tinned Vegetables')], 300, 'mass');
  assert.equal(sweetcorn.totalQuantity, 520);
  const tomatoes = calculatePackPurchase([product('ASDA Chopped Tomatoes 400g', 400, .4, 1, 'Food cupboard > Tinned Tomatoes')], 400, 'mass');
  assert.equal(tomatoes.totalQuantity, 400);
  const frozen = calculatePackPurchase([product('ASDA Frozen Sweetcorn 1000g', 1000, 1, 2, 'Frozen Food > Vegetables')], 1000, 'mass');
  assert.equal(frozen.totalQuantity, 1000);
});

test('nutrition-specific ingredient matching excludes low-protein style yoghurt and prepared alternatives', async () => {
  const { rankCatalogCandidates } = await import('./catalog-adapter.js');
  const candidate = (name, category) => ({ name, category, price: 1, packQuantity: 500, packUnit: 'g', packSize: '500g',
    url: `https://www.asda.com/groceries/product/fixture/8000666` });
  for (const [query, name, category] of [
    ['0% Greek yoghurt', 'Arla Greek Style 0% Fat Free Natural Yogurt 450g', 'Chilled Food > Yogurts'],
    ['Salmon fillet', 'Vivera Plant-Based Salmon Fillet 200g', 'Chilled Food > Vegetarian'],
    ['Edamame beans', 'ASDA Edamame Bean & Broccoli 320g', 'Frozen Food > Vegetables'],
    ['Noodles', 'IndoMie Mi Goreng Instant Noodles 80g', 'Food cupboard > Instant Noodles'],
  ]) assert.equal(rankCatalogCandidates(query, [candidate(name, category)], 'mass').length, 0, `${query}: ${name}`);
});
