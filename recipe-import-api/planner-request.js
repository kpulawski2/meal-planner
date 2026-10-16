// Bound browser input before transferring it to the catalogue worker. Recipe
// methods, source URLs and any unrelated saved device data are never needed.
import '../public/equipment-core.js';
import '../public/macro-goals-core.js';
import '../public/meal-intent-core.js';
import { normalizePersonalPriceOptions } from './personal-prices.js';
const text = (value, length = 120) => typeof value === 'string' ? value.trim().slice(0, length) : '';
const fail = message => { throw new TypeError(message); };
function number(value, fallback, min, max, label, integer = false) {
  const n = value === undefined || value === null || value === '' ? fallback : Number(value);
  if (!Number.isFinite(n) || n < min || n > max || integer && !Number.isInteger(n)) fail(`${label} is outside the supported range.`);
  return n;
}

export function normalizePlannerRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Send planner settings and a recipe library.');
  const input = body.profile || {};
  if (input.supermarket != null && !['Asda','Lidl'].includes(input.supermarket)) fail('Choose Asda or Lidl as your supermarket.');
  if (input.lidlReferencePrices !== undefined && typeof input.lidlReferencePrices !== 'boolean') fail('Lidl reference prices must be on or off.');
  const profile = {
    supermarket: input.supermarket || 'Asda',
    lidlReferencePrices: input.lidlReferencePrices === true,
    calories: number(input.calories, 2000, 400, 10000, 'Daily calories'),
    protein: number(input.protein, 200, 0, 1000, 'Daily protein'),
    budget: number(input.budget, 45, 0, 10000, 'Weekly household budget'),
    days: number(parseInt(input.days ?? 7, 10), 7, 1, 14, 'Plan length', true),
    meals: number(input.meals, 4, 2, 4, 'Meals per day', true),
    people: number(input.people, 1, 1, 50, 'People', true),
    diet: ['No restrictions', 'Vegetarian', 'Vegan'].includes(input.diet) ? input.diet : 'No restrictions',
    priority: ['Balanced', 'Cheapest', 'Protein value', 'Variety'].includes(input.priority) ? input.priority : 'Balanced',
    varietyMode: ['Balanced', 'More variety', 'Budget focus', 'Repeat favourites', 'Tailored'].includes(input.varietyMode) ? input.varietyMode : 'Balanced',
    nutritionTargets: globalThis.MacroGoalsCore.normalise(input.nutritionTargets, true),
    tailoredMeals: input.varietyMode==='Tailored'?globalThis.MealIntentCore.rules(input.tailoredMeals, true):{},
    scheduledMeals: [],
    repeatMeals: Object.fromEntries(['Breakfast','Lunch','Dinner','Snack'].map(category => [category, text(input.repeatMeals?.[category], 120)]).filter(([, id]) => id)),
    goal: (Array.isArray(input.goal) ? input.goal : Array.isArray(input.goals) ? input.goals : ['Eat healthy', 'Save money', 'Make cooking easier']).filter((goal, index, values) => ['Lose weight', 'Gain muscle', 'Eat healthy', 'Save money', 'Make cooking easier'].includes(goal) && values.indexOf(goal) === index).slice(0, 5),
    dislikes: text(input.dislikes, 1000), likes: text(input.likes, 1000), custom: text(input.custom, 2000),
    batch: input.batch !== false, mealPrep: Boolean(input.mealPrep), avoidRepeat: input.avoidRepeat !== false,
    minWaste: input.minWaste !== false, leftovers: input.leftovers !== false,
    cookTime: number(input.cookTime, 45, 1, 1440, 'Cooking time'),
    equipment: globalThis.KitchenEquipment.normalize(input.equipment),
  };
  profile.scheduledMeals=profile.varietyMode==='Tailored'?globalThis.MealIntentCore.scheduled(input.scheduledMeals,profile.days,true):[];
  if (!Array.isArray(body.recipes) || !body.recipes.length || body.recipes.length > 250) fail('Send between 1 and 250 recipes.');
  const ids = new Set();
  const recipes = body.recipes.map(row => {
    const id = text(row?.id, 120), name = text(row?.name);
    if (!id || !name || ids.has(id)) fail('Recipes must have unique IDs and names.');
    ids.add(id);
    if (!Array.isArray(row.ings) || !row.ings.length || row.ings.length > 40) fail('Each recipe needs between 1 and 40 ingredients.');
    const ings = row.ings.map(ing => {
      if (!Array.isArray(ing) || !text(ing[0])) fail('Each ingredient needs a name.');
      return [text(ing[0]), number(ing[1], 0, 0, 100000, 'Ingredient quantity'), text(ing[2], 40)];
    });
    const source = row.nutrition || {};
    const nutrient = key => source[key] === undefined || source[key] === null ? null : number(source[key], null, 0, 100000, `Recipe ${key}`);
    const requiredEquipment = Array.isArray(row.equipment) ? [...new Set(row.equipment.map(value => text(value, 60)).filter(Boolean))] : [];
    if (requiredEquipment.length > globalThis.KitchenEquipment.names.length) fail('A recipe may require at most 21 appliances.');
    return { id, name, cat: text(row.cat, 40), servings: number(row.servings, 1, 1, 1000, 'Recipe yield'),
      ings, nutrition: { kcal: nutrient('kcal'), p: nutrient('p'), c: nutrient('c'), f: nutrient('f'), complete: source.complete === true, source: text(source.source, 40) },
      cookTime: row.cookTime === undefined || row.cookTime === null || row.cookTime === '' ? null : number(row.cookTime, null, 0, 1440, 'Recipe cooking time'),
      equipment: requiredEquipment,
      fixedBatch: row.fixedBatch === true, batchStorage: row.batchStorage === 'recipe' ? 'recipe' : null, freezeMinutes: row.freezeMinutes == null ? null : number(row.freezeMinutes, null, 0, 10080, 'Recipe freeze time'),
      passiveMinutes: row.passiveMinutes == null ? null : number(row.passiveMinutes, null, 0, 10080, 'Recipe waiting time'),
      preferenceScore: number(row.preferenceScore, 0, -40, 40, 'Recipe taste score'),
      useUpScore: number(row.useUpScore, 0, 0, 10, 'Recipe use-up score'),
      excludedByFeedback: row.excludedByFeedback === true,
      dishFamily: text(row.dishFamily, 80),
      tags: Array.isArray(row.tags) ? row.tags.slice(0, 20).map(value => text(value, 60)) : [] };
  });
  for(const row of profile.scheduledMeals)if(!(profile.meals===2?['Lunch','Dinner']:profile.meals===3?['Breakfast','Lunch','Dinner']:globalThis.MealIntentCore.categories).includes(row.category))fail('A scheduled meal must belong to an active meal type.');
  for (const [category, rule] of [...Object.entries(profile.tailoredMeals),...profile.scheduledMeals.map(row=>[row.category,row])]) for (const id of rule.recipeIds) {
    const recipe = recipes.find(row => row.id === id);
    if (!recipe || !(recipe.cat === category || category === 'Snack' && recipe.cat === 'Fruit')) fail('A tailored meal choice is missing or belongs to another meal.');
  }
  if (body.pantry !== undefined && (!Array.isArray(body.pantry) || body.pantry.length > 300)) fail('Inventory must contain at most 300 entries.');
  const pantry = (body.pantry || []).map(row => ({ name: text(row?.name), qty: number(row?.qty, 0, 0, 10000000, 'Inventory quantity'), unit: text(row?.unit, 40) })).filter(row => row.name);
  if (body.week !== undefined && (!Array.isArray(body.week) || body.week.length > 14)) fail('Current plan may contain at most 14 days.');
  const week = (body.week || []).map(row => {
    if (!Array.isArray(row?.meals) || row.meals.length > 8) fail('A plan day may contain at most 8 meals.');
    return { day: text(row.day, 60), meals: row.meals.map(id => text(id, 120)) };
  });
  const mealServings = Object.fromEntries(Object.entries(body.mealServings || {}).slice(0, 112).map(([key, value]) => [text(key, 100), number(value, 1, .25, 100, 'Meal portions')]));
  const locked = Object.fromEntries(Object.entries(body.locked || {}).slice(0, 112).map(([key, value]) => [text(key, 100), Boolean(value)]));
  const favorites = Array.isArray(body.favorites) ? body.favorites.slice(0, 250).map(id => text(id, 120)).filter(id => ids.has(id)) : [];
  if(body.excludedRecipeIds!==undefined&&(!Array.isArray(body.excludedRecipeIds)||body.excludedRecipeIds.length>5000))fail('Recipe preferences must contain at most 5000 excluded recipe IDs.');
  const excludedRecipeIds=[...new Set((body.excludedRecipeIds||[]).map(id=>text(id,120)).filter(Boolean))];
  if (body.cookedMeals !== undefined && (!body.cookedMeals || typeof body.cookedMeals !== 'object' || Array.isArray(body.cookedMeals) || Object.keys(body.cookedMeals).length > 112)) fail('Cooking records must describe at most 112 planned meals.');
  const cookedMeals = {};
  for (const [key, row] of Object.entries(body.cookedMeals || {})) {
    const cleanKey = text(key, 100), recipeId = text(row?.recipeId, 120);
    const day = week.find(day => day.meals.some((id, index) => `${day.day}::${index}` === cleanKey && id === recipeId));
    if (!day || !ids.has(recipeId)) fail('A cooking record no longer agrees with the current plan.');
    const servings = number(row?.servings, 0, .000001, 100, 'Cooked portions');
    const planned = mealServings[cleanKey] || profile.people;
    if (servings > planned + .000001) fail('Cooked portions exceed this planned meal.');
    cookedMeals[cleanKey] = { recipeId, servings }; locked[cleanKey] = true;
  }
  if (body.leftovers !== undefined && (!Array.isArray(body.leftovers) || body.leftovers.length > 300)) fail('Leftovers must contain at most 300 entries.');
  const leftoverIds = new Set();
  const leftovers = (body.leftovers || []).map(row => {
    const id = text(row?.id, 180), recipeId = text(row?.recipeId, 120);
    if (!id || leftoverIds.has(id) || !ids.has(recipeId)) fail('Each leftover needs a unique identity and a known recipe.');
    leftoverIds.add(id);
    return { id, recipeId, servings: number(row?.servings, 0, .000001, 1000, 'Leftover portions') };
  });
  return { profile, recipes, pantry, week, mealServings, locked, favorites, excludedRecipeIds, cookedMeals, leftovers,
    ...normalizePersonalPriceOptions(body, profile.supermarket) };
}
