import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
import '../public/recipe-experience.js';
import '../public/recipe-library-core.js';
import { readRecipeLibrary } from './recipe-fixtures.js';
import { recommendCatalogItems } from './catalog-service.js';

const experience = globalThis.RecipeExperience;
const library = globalThis.RecipeLibraryCore;
const now = Date.parse('2026-10-11T12:00:00Z');
const at = '2026-10-11T12:00:00Z';
const ago = days => new Date(now - days * 86400000).toISOString();
const recipe = (id = 'measured-one', patch = {}) => ({
  id, name: 'Measured oat bowl', cat: 'Breakfast', servings: 1,
  ings: [['Oats', 40, 'g'], ['Milk', 150, 'ml']], method: ['Simmer until tender.'],
  cookTime: 10, nutrition: { complete: true, kcal: 230, p: 10, c: 36, f: 5 },
  ...patch,
});

test('feedback normalizes duplicates and malformed backups while retaining the latest valid choice', () => {
  const state = { recipeFeedback: [
    { recipeId: 'one', value: 'skip', updatedAt: ago(2) },
    { recipeId: 'one', value: 'again', updatedAt: ago(1) },
    { recipeId: 'two', value: 'skip', updatedAt: at },
    { recipeId: 'invalid', value: 'love', updatedAt: at },
    { recipeId: 'bad-time', value: 'skip', updatedAt: 'yesterday' },
    null, {},
  ], recentMeals: [] };
  experience.normalizeState(state, { now });
  assert.deepEqual(state.recipeFeedback.map(row => [row.recipeId, row.value]), [['two', 'skip'], ['one', 'again']]);
  assert.equal(experience.allowedFeedback(recipe('two'), state), false);
  assert.equal(experience.allowedFeedback(recipe('one'), state), true);
  assert.equal(experience.feedbackValue(recipe('unknown'), state), null);
});

test('taste choices toggle, clear and remain inside app state for backup and restore', () => {
  const state = { customRecipes: [], pantry: [{ name: 'Rice', qty: 100, unit: 'g' }] };
  experience.setFeedback(state, recipe(), 'again', { at });
  assert.equal(experience.feedbackValue(recipe(), state), 'again');
  experience.setFeedback(state, recipe(), 'skip', { at: ago(-1 / 24) });
  assert.equal(state.recipeFeedback.length, 1);
  assert.equal(experience.feedbackValue(recipe(), state), 'skip');
  experience.recordCook(state, recipe(), { transactionId: 'cook-1', cookedAt: at, portions: 2, now });
  const restored = JSON.parse(JSON.stringify(state));
  experience.normalizeState(restored, { now });
  assert.deepEqual(restored.recipeFeedback, state.recipeFeedback);
  assert.deepEqual(restored.recentMeals, state.recentMeals);
  assert.deepEqual(restored.pantry, state.pantry);
  experience.setFeedback(restored, recipe(), null, { at });
  assert.equal(experience.feedbackValue(recipe(), restored), null);
  assert.equal(restored.recentMeals.length, 1, 'Clearing taste must not clear cooking history');
  assert.throws(() => experience.setFeedback(state, recipe(), 'bad'), /Choose/);
  assert.throws(() => experience.setFeedback(state, recipe(), 'again', { at: 'invalid' }), /date/);
});

test('feedback storage has a firm bound without dropping the newly selected preference', () => {
  const state = { recipeFeedback: Array.from({ length: 5000 }, (_, index) => ({ recipeId: 'stored-' + index, value: 'again', updatedAt: ago(1) })) };
  experience.setFeedback(state, recipe('latest'), 'skip', { at });
  assert.equal(state.recipeFeedback.length, 5000);
  assert.equal(state.recipeFeedback[0].recipeId, 'latest');
});

test('taste indexes refresh when helper writes or backup normalization change the saved arrays', () => {
  const state={recipeFeedback:[{recipeId:'one',value:'again',updatedAt:at}],recentMeals:[]};
  assert.equal(experience.feedbackValue('one',state),'again');
  state.recipeFeedback=[{recipeId:'one',value:'skip',updatedAt:at}];
  assert.equal(experience.feedbackValue('one',state),'skip');
  state.recipeFeedback[0].value='again';
  experience.normalizeState(state,{now});
  assert.equal(experience.feedbackValue('one',state),'again');
  experience.setFeedback(state,'one','skip',{at});
  assert.equal(experience.feedbackValue('one',state),'skip');
});

test('a large saved taste history remains practical for the complete recipe library', {timeout:5000}, () => {
  const state={profile:{},recipeFeedback:Array.from({length:5000},(_,index)=>({recipeId:'web-'+index,value:index%10===0?'skip':'again',updatedAt:at})),recentMeals:[]};
  const rows=Array.from({length:4000},(_,index)=>recipe('web-'+index,{cat:['Breakfast','Lunch','Dinner','Snack'][index%4]}));
  const selected=library.selectPlannerRecipes(rows,state);
  assert.equal(selected.length,250);
  assert.ok(selected.every(row=>Number(row.id.slice(4))%10!==0));
});

test('cooking history is transaction-idempotent, bounded and rejects future or malformed entries', () => {
  const state = {};
  assert.equal(experience.recordCook(state, recipe(), { transactionId: 'cook-1', cookedAt: at, portions: 2, now }), true);
  assert.equal(experience.recordCook(state, recipe('different'), { transactionId: 'cook-1', cookedAt: at, now }), false);
  assert.equal(state.recentMeals.length, 1);
  assert.equal(state.recentMeals[0].recipeId, recipe().id);
  assert.equal(state.recentMeals[0].portions, 2);
  assert.throws(() => experience.recordCook(state, recipe(), { transactionId: '', cookedAt: at, now }), /transaction/);
  assert.throws(() => experience.recordCook(state, recipe(), { transactionId: 'future', cookedAt: ago(-1), now }), /valid date/);
  state.recentMeals.push({ recipeId: 'future', cookedAt: ago(-1) }, { recipeId: 'bad', cookedAt: 'invalid' }, null);
  for (let index = 0; index < 130; index++) state.recentMeals.push({ recipeId: 'older-' + index, transactionId: 'old-' + index, cookedAt: ago(1 + index), portions: 1000 });
  experience.normalizeState(state, { now });
  assert.equal(state.recentMeals.length, 120);
  assert.equal(state.recentMeals[0].recipeId, recipe().id);
  assert.ok(state.recentMeals.every(row => row.portions === 2 || row.portions === 100));
  assert.ok(!state.recentMeals.some(row => ['future', 'bad'].includes(row.recipeId)));
});

test('recent meals reduce repetition while would-eat-again still ranks unrecent favourites', () => {
  const a = recipe('favourite'), b = recipe('ordinary'), c = recipe('skipped');
  const state = {};
  experience.setFeedback(state, a, 'again', { at });
  experience.setFeedback(state, c, 'skip', { at });
  assert.deepEqual(experience.rank([b, c, a], state, { now }).map(row => row.id), ['favourite', 'ordinary']);
  experience.recordCook(state, a, { transactionId: 'cook-1', cookedAt: ago(1), now });
  assert.ok(experience.feedbackScore(a, state, { now }) < experience.feedbackScore(b, state, { now }));
  assert.deepEqual(experience.rank([a, b, c], state, { now }).map(row => row.id), ['ordinary', 'favourite']);
  assert.equal(experience.feedbackScore(a, state, { now: now + 22 * 86400000 }), 24, 'Old history stops penalizing a favourite');
  const familyState = { recentMeals: [{ recipeId: 'old-id', dishFamily: 'egg-lentil', cookedAt: ago(1), transactionId: 'old' }] };
  assert.equal(experience.feedbackScore(recipe('new-id', { dishFamily: 'egg-lentil' }), familyState, { now }), -14);
});

test('planner pool removes skipped recipes, retains favourites and selects the new collection', () => {
  const rows = Array.from({ length: 360 }, (_, index) => recipe('web-' + index, { cat: index % 2 ? 'Breakfast' : 'Dinner' }));
  rows.push(recipe('everyday-lunch', { cat: 'Lunch' }), recipe('everyday-snack', { cat: 'Snack' }));
  const state = { profile: {}, recipeFeedback: [{ recipeId: 'web-359', value: 'again', updatedAt: at }, { recipeId: 'web-358', value: 'skip', updatedAt: at }], week: [{ meals: ['web-358'] }] };
  const selected = library.selectPlannerRecipes(rows, state);
  assert.equal(selected.length, 250);
  assert.ok(selected.some(row => row.id === 'web-359'));
  assert.ok(!selected.some(row => row.id === 'web-358'));
  assert.ok(selected.some(row => row.id === 'everyday-lunch'));
  assert.ok(selected.some(row => row.id === 'everyday-snack'));
});

test('already-cooked skipped meals stay available as history but never enter the future candidate pool', () => {
  const cooked=recipe('cooked-skip',{cookedOnly:true,equipment:['Ninja CREAMi']}),notScheduled=recipe('cooked-unscheduled',{cookedOnly:true});
  const state={profile:{equipment:[]},week:[{meals:[cooked.id]}],recipeFeedback:[{recipeId:cooked.id,value:'skip',updatedAt:at}]};
  const selected=library.selectPlannerRecipes([cooked,notScheduled,recipe('future')],state);
  assert.ok(selected.some(row=>row.id===cooked.id));
  assert.ok(!selected.some(row=>row.id===notScheduled.id),'An orphan cooked-only row is not a future recipe');
  assert.ok(selected.some(row=>row.id==='future'));
});

test('readiness reports actionable corrections rather than silently accepting invented yields or amounts', () => {
  assert.equal(experience.readiness(recipe()).ready, true);
  for (const [patch, expected] of [
    [{ unavailable: true }, 'unavailable'], [{ servings: null }, 'yield'], [{ servings: Infinity }, 'yield'],
    [{ ings: [] }, 'ingredients'], [{ ings: [['Oats', null, 'g']] }, 'quantity'],
    [{ ings: [['Oats', Infinity, 'g']] }, 'quantity'], [{ ings: ['x2g'] }, 'quantity'],
    [{ ings: [['', 1, 'g']] }, 'ingredient_name'], [{ method: [] }, 'method'],
    [{ nutrition: { complete: true, kcal: Infinity, p: 10 } }, 'nutrition'],
    [{ nutrition: { complete: true, kcal: 200, p: -1 } }, 'nutrition'],
    [{ needsReview: true, reviewReasons: ['Confirm the source quantities.'] }, 'source_review'],
  ]) {
    const result = experience.readiness(recipe('bad', patch));
    assert.equal(result.ready, false, expected);
    assert.equal(result.correctionNeeded, true, expected);
    assert.ok(result.reasons.some(reason => reason.code === expected), expected);
  }
  assert.equal(experience.readiness(recipe('old-count', { ings: [['Eggs', 1, '']] })).ready, true, 'Known legacy item counts can have complete nutrition');
  assert.ok(experience.readiness(recipe('unit', { ings: [['Oats', 1, '']], nutrition: { complete: false, missing: ['Oats unit'] } })).reasons.some(reason => reason.code === 'unit'));
  assert.ok(experience.readiness(recipe('large', { ings: Array.from({ length: 41 }, () => ['Oats', 1, 'g']) })).reasons.some(reason => reason.code === 'ingredients_limit'));
});

test('catalogue price gaps, feedback and appliance settings are separate from recipe corrections', () => {
  const base = recipe();
  const unpriced = experience.readiness(base, { pricing: { checked: true, complete: false, store: 'Lidl', missing: ['Milk'] } });
  assert.equal(unpriced.ready, false);
  assert.equal(unpriced.correctionNeeded, false);
  assert.equal(unpriced.pricingChecked, true);
  assert.equal(unpriced.reasons[0].ingredient, 'Milk');
  assert.match(unpriced.reasons[0].label, /Lidl.*Milk/);
  assert.equal(experience.readiness(base, { pricing: { checked: false, complete: false } }).ready, true);
  assert.equal(experience.readiness(base, { pricing: { checked: true, complete: true } }).ready, true);
  const appliance = recipe('creami', { equipment: ['Ninja CREAMi'] });
  assert.equal(experience.readiness(appliance).correctionNeeded, false);
  assert.equal(experience.readiness(appliance, { profile: { equipment: ['Ninja CREAMi'] } }).ready, true);
  const state = { recipeFeedback: [{ recipeId: base.id, value: 'skip', updatedAt: at }] };
  const skipped = experience.readiness(base, { state });
  assert.equal(skipped.ready, false);
  assert.equal(skipped.correctionNeeded, false);
  assert.equal(skipped.reasons[0].code, 'feedback');
});

test('editable copies keep source credit, independent ingredients and original taste lineage', () => {
  const original = recipe('web-source', {
    source: 'https://en.wikibooks.org/wiki/Cookbook:Porridge', sourceName: 'Wikibooks Cookbook',
    authorsUrl: 'https://en.wikibooks.org/w/index.php?title=Cookbook:Porridge&action=history',
    license: 'CC BY-SA 4.0', attribution: 'Wikibooks contributors', modifications: 'Source adaptation.', cost: 1,
  });
  const snapshot = JSON.stringify(original), copy = experience.editableCopy(original, { id: 'user_copy_1', at });
  assert.equal(copy.custom, true);
  assert.equal(copy.correctionDraft, true);
  assert.equal(copy.cost, null, 'A copy must never carry an asserted shelf price');
  for (const field of ['source', 'authorsUrl', 'license', 'attribution']) assert.equal(copy[field], original[field]);
  assert.match(copy.modifications, /Source adaptation.*Local editable copy/);
  copy.ings[0][1] = 60;
  assert.equal(JSON.stringify(original), snapshot);
  const secondCopy = experience.editableCopy(copy, { id: 'user_copy_2', at });
  assert.equal(secondCopy.copiedFrom.recipeId, original.id);
  const state = { recipeFeedback: [{ recipeId: original.id, value: 'skip', updatedAt: at }] };
  assert.equal(experience.feedbackValue(secondCopy, state), 'skip');
  experience.setFeedback(state, secondCopy, 'again', { at });
  assert.equal(experience.feedbackValue(secondCopy, state), 'again', 'A copy can override the source preference explicitly');
  assert.equal(experience.feedbackValue(original, state), 'skip');
  const generated = Array.from({ length: 20 }, () => experience.editableCopy(original).id);
  assert.equal(new Set(generated).size, generated.length, 'Fast repeated copy actions need distinct IDs');
  assert.throws(() => experience.editableCopy(original, { id: original.id, at }), /own ID/);
  assert.throws(() => experience.editableCopy(null), /Choose a recipe/);
});

test('corrected quantities clear stale nutrition and recipe costs without changing the original', () => {
  const original = recipe('web-original', { kcal: 500, p: 30, nutritionStatus: 'verified', cost: 2, needsReview: true });
  assert.throws(() => experience.applyCorrections(original, { servings: 2 }), /editable copy/);
  const draft = experience.editableCopy(original, { id: 'user_corrected', at });
  const corrected = experience.applyCorrections(draft, { ings: [['Oats', 60, 'g'], ['Milk', 200, 'ml']], servings: 2, method: ['Simmer the measured ingredients until tender.'] });
  assert.equal(original.servings, 1);
  assert.equal(original.ings[0][1], 40);
  assert.equal(draft.ings[0][1], 40);
  for (const field of ['kcal', 'p', 'c', 'f', 'cost']) assert.equal(corrected[field], null);
  assert.equal(corrected.nutrition, undefined);
  assert.equal(corrected.nutritionStatus, 'estimated');
  assert.equal(corrected.needsReview, false);
  assert.equal(corrected.correctionDraft, false);
  assert.equal(experience.readiness(corrected).ready, false, 'The new quantities need a fresh nutrition calculation');
  assert.equal(experience.readiness(corrected, { nutrition: { complete: true, kcal: 180, p: 7 } }).ready, true);
  assert.match(corrected.changeNotice, /Local edited copy/);
  assert.equal(corrected.copiedFrom.recipeId, original.id);
  const methodOnly = experience.applyCorrections(draft, { method: ['Stir continuously until tender.'] });
  assert.deepEqual(methodOnly.nutrition, draft.nutrition, 'Changing instructions alone does not invent new nutrient values');
});

test('planner readiness rejects nonfinite yields, nutrients and malformed ingredient rows', () => {
  assert.equal(library.planReady(recipe()), true);
  for (const patch of [{ servings: Infinity }, { nutrition: { complete: true, kcal: Infinity, p: 10 } }, { nutrition: { complete: true, kcal: 200, p: null } }, { nutrition: { complete: true, kcal: 200, p: -1 } }, { ings: [['Oats', Infinity, 'g']] }, { ings: ['x2g'] }]) {
    assert.equal(library.planReady(recipe('bad', patch)), false);
  }
});

const shipped = await readRecipeLibrary();
const everyday = shipped.filter(row => row.id.startsWith('everyday-'));

test('26 measured additions expand breakfasts, quick lunches, vegetarian meals and lighter dinners with complete estimates', () => {
  assert.equal(everyday.length, 26);
  assert.equal(new Set(shipped.map(row => row.id)).size, shipped.length);
  assert.deepEqual(Object.fromEntries(['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(cat => [cat, everyday.filter(row => row.cat === cat).length])), { Breakfast: 5, Lunch: 9, Dinner: 8, Snack: 4 });
  for (const row of everyday) {
    assert.equal(row.servings, 1);
    assert.equal(row.cost, null);
    assert.equal(row.sourceType, 'original');
    assert.equal(row.nutritionStatus, 'estimated');
    assert.equal(row.nutrition.complete, true, `${row.name}: ${row.nutrition.missing}`);
    assert.equal(row.nutrition.source, 'ingredients');
    assert.equal(experience.readiness(row).ready, true, row.name);
    assert.equal(library.planReady(row), true, row.name);
    assert.ok(row.ings.every(([name, quantity, unit]) => name && quantity > 0 && Number.isFinite(quantity) && unit));
    assert.ok(row.method.length && row.cookTime > 0 && row.cookTime <= 30);
    assert.ok(row.nutrition.kcal >= 150 && row.nutrition.kcal <= (row.id === "everyday-tuna-pickle-egg-mayo-wrap" ? 550 : 460));
    if (row.cat === 'Dinner') assert.ok(row.nutrition.p >= 19);
  }
  const lunches = everyday.filter(row => row.cat === 'Lunch');
  assert.ok(lunches.filter(row => row.cookTime <= 15).length >= 5);
  assert.ok(lunches.filter(row => row.tags.includes('vegetarian') || row.tags.includes('plant')).length >= 5);
  assert.ok(new Set(everyday.filter(row => row.cat === 'Dinner').map(row => globalThis.MealBudgetCore.proteinFamily(row))).size >= 6);
  assert.ok(everyday.filter(row => row.cat === 'Dinner').every(row => row.tags.includes('lighter')));
  assert.ok(everyday.filter(row => row.ings.some(([name]) => /oil/i.test(name))).every(row => /measured oil/.test(row.method.join(' '))), 'Oil used in the method must be measured');
});

test('every new measured ingredient has a verified suitable full-pack ASDA purchase plan', { timeout: 60_000 }, async () => {
  const core = globalThis.MealBudgetCore, items = new Map();
  for (const row of everyday) for (const [name, quantity, unit] of row.ings) {
    const meta = core.unitMeta(unit, name), key = `${core.canonicalIngredientName(name)}::${meta.dim}`;
    if (!items.has(key)) items.set(key, { key, name, dimension: meta.dim, quantity: quantity * meta.factor });
  }
  const result = await recommendCatalogItems('Asda', [...items.values()]);
  assert.ok(result.indexSize >= 10_000, 'Exercise the actual complete ASDA snapshot');
  assert.equal(result.recommendations.length, items.size);
  for (const row of result.recommendations) {
    assert.equal(row.confidence, 'high', row.query);
    assert.ok(row.plan?.products.length, `No verified pack for ${row.query}`);
    assert.ok(row.plan.totalCostGBP > 0 && Number.isFinite(row.plan.totalCostGBP), row.query);
    assert.ok(row.plan.totalQuantity >= row.plan.requestedQuantity, row.query);
    for (const product of row.plan.products) {
      assert.match(product.url, /^https:\/\/www\.asda\.com\/groceries\/product\//);
      assert.ok(Number.isInteger(product.packs) && product.packs > 0);
      assert.ok(product.priceGBP > 0 && Number.isFinite(product.priceGBP));
      if (row.query === 'Cod fillet') assert.doesNotMatch(product.productName, /sauce|butter|breaded|battered/i);
      if (row.query === 'Chicken breast') assert.match(product.productName, /chicken.*breast/i);
      if (row.query === 'Turkey mince') assert.match(product.productName, /turkey.*mince/i);
      if (row.query === 'Cucumber') assert.match(product.productName, /^(?:ASDA\s+)?Cucumber$/i);
      if (row.query === '0% Greek yoghurt') assert.doesNotMatch(product.productName, /chocolate|banana|strawberry|vanilla/i);
    }
  }
});
