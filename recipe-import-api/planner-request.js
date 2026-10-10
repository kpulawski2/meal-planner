// Bound browser input before transferring it to the catalogue worker. Recipe
// methods, source URLs and any unrelated saved device data are never needed.
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
  const profile = {
    supermarket: input.supermarket || 'Asda',
    calories: number(input.calories, 2000, 400, 10000, 'Daily calories'),
    protein: number(input.protein, 200, 0, 1000, 'Daily protein'),
    budget: number(input.budget, 45, 0, 10000, 'Weekly household budget'),
    days: number(parseInt(input.days ?? 7, 10), 7, 1, 14, 'Plan length', true),
    meals: number(input.meals, 4, 2, 4, 'Meals per day', true),
    people: number(input.people, 1, 1, 50, 'People', true),
    diet: ['No restrictions', 'Vegetarian', 'Vegan'].includes(input.diet) ? input.diet : 'No restrictions',
    priority: ['Balanced', 'Cheapest', 'Protein value', 'Variety'].includes(input.priority) ? input.priority : 'Balanced',
    varietyMode: ['Balanced', 'More variety', 'Budget focus'].includes(input.varietyMode) ? input.varietyMode : 'Balanced',
    goal: (Array.isArray(input.goal) ? input.goal : Array.isArray(input.goals) ? input.goals : ['Eat healthy', 'Save money', 'Make cooking easier']).filter((goal, index, values) => ['Lose weight', 'Gain muscle', 'Eat healthy', 'Save money', 'Make cooking easier'].includes(goal) && values.indexOf(goal) === index).slice(0, 5),
    dislikes: text(input.dislikes, 1000), likes: text(input.likes, 1000), custom: text(input.custom, 2000),
    batch: input.batch !== false, mealPrep: Boolean(input.mealPrep), avoidRepeat: input.avoidRepeat !== false,
    minWaste: input.minWaste !== false, leftovers: input.leftovers !== false,
    cookTime: number(input.cookTime, 45, 1, 1440, 'Cooking time'),
    equipment: Array.isArray(input.equipment) ? input.equipment.filter(value => value === 'Ninja CREAMi').slice(0, 1) : [],
  };
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
    return { id, name, cat: text(row.cat, 40), servings: number(row.servings, 1, 1, 1000, 'Recipe yield'),
      ings, nutrition: { kcal: nutrient('kcal'), p: nutrient('p'), complete: source.complete === true, source: text(source.source, 40) },
      cookTime: row.cookTime === undefined || row.cookTime === null || row.cookTime === '' ? null : number(row.cookTime, null, 0, 1440, 'Recipe cooking time'),
      equipment: Array.isArray(row.equipment) ? [...new Set(row.equipment.map(value => text(value, 60)).filter(Boolean))].slice(0, 4) : [],
      fixedBatch: row.fixedBatch === true, freezeMinutes: row.freezeMinutes == null ? null : number(row.freezeMinutes, null, 0, 10080, 'Recipe freeze time'),
      dishFamily: text(row.dishFamily, 80),
      tags: Array.isArray(row.tags) ? row.tags.slice(0, 20).map(value => text(value, 60)) : [] };
  });
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
  return { profile, recipes, pantry, week, mealServings, locked, favorites };
}
