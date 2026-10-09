import '../public/budget-core.js';
import { catalogPurchaseOffers, calculatePackPurchase } from './catalog-adapter.js';
import { setImmediate as yieldToWorker } from 'node:timers/promises';

const Core = globalThis.MealBudgetCore;
const EPS = .000001;
const clamp = (value, min, max, fallback) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
const pennies = value => Math.round(Number(value) * 100);
const round = (value, digits = 2) => Number(value.toFixed(digits));
const bookKey = (name, dimension) => `${Core.canonicalIngredientName(name)}::${dimension}`;

function allowedRecipe(recipe, profile) {
  const ingredients = (recipe.ings || []).map(row => String(row[0]).toLowerCase()), hay = `${recipe.name} ${ingredients.join(' ')}`.toLowerCase();
  const dislikes = String(profile.dislikes || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
  if (dislikes.some(value => hay.includes(value))) return false;
  if (Number(recipe.cookTime) > 0 && Number(profile.cookTime) > 0 && Number(recipe.cookTime) > Number(profile.cookTime)) return false;
  const meat = /\b(?:chicken|beef|pork|turkey|lamb|ham|bacon|tuna|salmon|cod|fish|prawns?|shrimp|anchov\w*)\b/;
  if (/vegetarian|vegan/i.test(profile.diet || '') && ingredients.some(value => meat.test(value) && !/plant|vegan|vegetarian|meat.free/.test(value))) return false;
  if (/vegan/i.test(profile.diet || '') && ingredients.some(value => /\b(?:eggs?|cheese|butter|quark|skyr|yoghurt|milk|whey|honey)\b/.test(value) && !/plant|vegan|dairy.free|oat milk|almond milk|coconut milk|soya milk|soy milk|peanut butter|almond butter|cashew butter/.test(value))) return false;
  if (/no fish/i.test(profile.custom || '') && /\b(?:tuna|salmon|cod|fish|prawns?|shrimp|anchov\w*)\b/.test(hay)) return false;
  return true;
}

// The table is an unbounded knapsack in integer pence: each entry records the
// maximum quantity purchasable for that exact spend. Binary lookup finds the
// cheapest spend covering a quantity, including mixed packs and pack leftovers.
function priceBook(row, maximumCents) {
  const sorted = row.offers.slice().sort((a, b) => a.cents - b.cents || b.capacity - a.capacity), offers = [];
  let capacity = 0;
  for (const offer of sorted) if (offer.capacity > capacity + EPS) { offers.push(offer); capacity = offer.capacity; }
  if (!offers.length) return { row, unitCost: Infinity, cost: quantity => quantity <= EPS ? 0 : Infinity };
  let divisor = offers[0].cents;
  for (const offer of offers) { let a = divisor, b = offer.cents; while (b) [a, b] = [b, a % b]; divisor = a; }
  const limit = Math.floor(maximumCents / divisor), quantities = new Float64Array(limit + 1); quantities.fill(-Infinity); quantities[0] = 0;
  const amounts = [0], costs = [0]; let best = 0;
  for (let cost = 1; cost <= limit; cost++) {
    let quantity = -Infinity;
    for (const offer of offers) {
      const previous = cost - offer.cents / divisor;
      if (previous >= 0) quantity = Math.max(quantity, quantities[previous] + offer.capacity);
    }
    quantities[cost] = quantity;
    if (quantity > best + EPS) { best = quantity; amounts.push(quantity); costs.push(cost * divisor); }
  }
  const fallback = new Map();
  return { row, unitCost: Math.min(...offers.map(offer => offer.cents / offer.capacity)), cost(quantity) {
    if (quantity <= EPS) return 0;
    let low = 0, high = amounts.length - 1;
    if (amounts[high] + EPS < quantity) {
      const key = round(quantity, 5);
      if (!fallback.has(key)) fallback.set(key, calculatePackPurchase(row.candidates, quantity, row.dimension));
      return fallback.get(key) ? pennies(fallback.get(key).totalCostGBP) : Infinity;
    }
    while (low < high) { const middle = (low + high) >>> 1; if (amounts[middle] + EPS >= quantity) high = middle; else low = middle + 1; }
    return costs[low];
  } };
}

function nutritionOf(recipe) {
  const n = recipe.nutrition || {};
  return { kcal: Number(n.kcal), p: Number(n.p), complete: n.complete === true && Number.isFinite(Number(n.kcal)) && Number(n.kcal) > 0 && Number.isFinite(Number(n.p)) && Number(n.p) >= 0 };
}

function prepareRecipe(recipe) {
  const amounts = new Map(), yieldCount = Math.max(1, Number(recipe.servings) || 1);
  let known = Array.isArray(recipe.ings) && recipe.ings.length > 0;
  for (const [name, rawQuantity, unit] of recipe.ings || []) {
    const quantity = Number(rawQuantity), meta = Core.unitMeta(unit, name), key = bookKey(name, meta.dim);
    if (!(quantity > 0) || !Number.isFinite(quantity) || !String(name).trim()) { known = false; continue; }
    amounts.set(key, (amounts.get(key) || 0) + quantity * meta.factor / yieldCount);
  }
  return { ...recipe, n: nutritionOf(recipe), amounts, known };
}

function nutritionValid(rows, factors, targets) {
  const kcal = rows.reduce((sum, recipe, index) => sum + recipe.n.kcal * factors[index], 0), p = rows.reduce((sum, recipe, index) => sum + recipe.n.p * factors[index], 0);
  return kcal + EPS >= targets.min && kcal <= targets.max + EPS && p + EPS >= targets.protein;
}

// At a linear programme vertex, at most two portions are between their bounds.
// Enumerating those small vertices is deterministic and avoids an external solver.
function portionChoices(rows, targets, fixed = []) {
  const count = rows.length, result = [], seen = new Set(), bounds = rows.map((_, index) => fixed[index] != null ? [fixed[index], fixed[index]] : [.5, 2]);
  const add = factors => {
    if (factors.some((value, index) => !Number.isFinite(value) || value < bounds[index][0] - EPS || value > bounds[index][1] + EPS)) return;
    if (!nutritionValid(rows, factors, targets)) return;
    const key = factors.map(value => round(value, 6)).join(','); if (seen.has(key)) return; seen.add(key);
    result.push({ factors, linear: rows.reduce((sum, row, index) => sum + row.linear * factors[index], 0) });
  };
  const totalK = rows.reduce((sum, row) => sum + row.n.kcal, 0), totalP = rows.reduce((sum, row) => sum + row.n.p, 0);
  const needed = Math.max(.5, targets.min / totalK, targets.protein / Math.max(EPS, totalP));
  for (const factor of [needed, 1, 1.25, 1.5, 1.75, 2]) add(rows.map((_, index) => fixed[index] != null ? fixed[index] : factor));
  function otherBounds(skip, visit) {
    const factors = new Array(count);
    const step = index => { if (index === count) { visit(factors); return; } if (skip.includes(index)) { step(index + 1); return; }
      factors[index] = bounds[index][0]; step(index + 1); if (bounds[index][1] !== bounds[index][0]) { factors[index] = bounds[index][1]; step(index + 1); } };
    step(0);
  }
  for (let i = 0; i < count; i++) {
    otherBounds([i], factors => {
      const knownK = rows.reduce((sum, row, index) => index === i ? sum : sum + row.n.kcal * factors[index], 0), knownP = rows.reduce((sum, row, index) => index === i ? sum : sum + row.n.p * factors[index], 0);
      for (const calories of [targets.min, targets.max]) { const next = factors.slice(); next[i] = (calories - knownK) / rows[i].n.kcal; add(next); }
      if (rows[i].n.p > 0) { const next = factors.slice(); next[i] = (targets.protein - knownP) / rows[i].n.p; add(next); }
    });
    for (let j = i + 1; j < count; j++) otherBounds([i, j], factors => {
      const knownK = rows.reduce((sum, row, index) => index === i || index === j ? sum : sum + row.n.kcal * factors[index], 0), knownP = rows.reduce((sum, row, index) => index === i || index === j ? sum : sum + row.n.p * factors[index], 0);
      const determinant = rows[i].n.kcal * rows[j].n.p - rows[j].n.kcal * rows[i].n.p;
      if (Math.abs(determinant) < EPS) return;
      for (const calories of [targets.min, targets.max]) {
        const next = factors.slice(), k = calories - knownK, p = targets.protein - knownP;
        next[i] = (k * rows[j].n.p - rows[j].n.kcal * p) / determinant;
        next[j] = (rows[i].n.kcal * p - k * rows[i].n.p) / determinant; add(next);
      }
    });
  }
  return result.sort((a, b) => a.linear - b.linear).slice(0, 3);
}

function stockAmounts(pantry) {
  const stock = new Map();
  for (const item of pantry) { const meta = Core.unitMeta(item.unit, item.name), key = bookKey(item.name, meta.dim); stock.set(key, (stock.get(key) || 0) + Math.max(0, Number(item.qty) || 0) * meta.factor); }
  return stock;
}

function requirementAmounts(days, people) {
  const amounts = new Map();
  for (const day of days) for (let index = 0; index < day.rows.length; index++) for (const [key, quantity] of day.rows[index].amounts) amounts.set(key, (amounts.get(key) || 0) + quantity * day.factors[index] * people);
  return amounts;
}

function basketCost(days, people, stock, books) {
  let cost = 0;
  for (const [key, quantity] of requirementAmounts(days, people)) { const value = books.get(key)?.cost(Math.max(0, quantity - (stock.get(key) || 0))) ?? Infinity; if (!Number.isFinite(value)) return Infinity; cost += value; }
  return cost;
}

function safePools(rows, slots, stock, people, days, books, profile, favorites) {
  const likes = String(profile.likes || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
  for (const row of rows) {
    row.linear = [...row.amounts].reduce((sum, [key, quantity]) => sum + quantity * (books.get(key)?.unitCost || 0), 0);
    row.preference = favorites.includes(row.id) ? 2 : 0;
    if (likes.some(value => `${row.name} ${row.ings.map(item => item[0]).join(' ')}`.toLowerCase().includes(value))) row.preference++;
    row.priceable = row.known && [...row.amounts].every(([key, quantity]) => Number.isFinite(books.get(key)?.unitCost) || (stock.get(key) || 0) + EPS >= quantity * people * days * 2);
  }
  return slots.map(slot => {
    const eligible = rows.filter(row => row.n.complete && row.priceable && (row.cat === slot || slot === 'Snack' && row.cat === 'Fruit'));
    const value = eligible.slice().sort((a, b) => a.linear / Math.max(1, a.n.kcal + a.n.p * 10) - b.linear / Math.max(1, b.n.kcal + b.n.p * 10) || a.id.localeCompare(b.id));
    const protein = eligible.slice().sort((a, b) => a.linear / Math.max(.1, a.n.p) - b.linear / Math.max(.1, b.n.p) || a.id.localeCompare(b.id));
    const favoritesSorted = eligible.filter(row => row.preference).sort((a, b) => b.preference - a.preference || a.linear - b.linear);
    return [...new Map([...value.slice(0, 11), ...protein.slice(0, 4), ...favoritesSorted.slice(0, 1)].map(row => [row.id, row])).values()].slice(0, 16);
  });
}

function planFromDays(days, names, people) {
  const mealServings = {}, week = days.map((day, index) => ({ day: names[index], meals: day.rows.map(row => row.id) }));
  for (const [index, day] of days.entries()) for (const [slot, factor] of day.factors.entries()) mealServings[`${names[index]}::${slot}`] = factor * people;
  return { week, mealServings };
}

function currentDay(request, name, rowsById, slots, people) {
  const day = (request.week || []).find(day => day.day === name);
  if (!day || day.meals?.length !== slots.length) return null;
  const rows = day.meals.map(id => rowsById.get(id)); if (rows.some((row, slot) => !row || !(row.cat === slots[slot] || slots[slot] === 'Snack' && row.cat === 'Fruit'))) return null;
  const factors = rows.map((_, slot) => Number(request.mealServings?.[`${name}::${slot}`]) / people || 1);
  return { rows, factors };
}

function withLocks(template, name, request, rowsById, targets, people, slots) {
  const locked = slots.map((_, slot) => Boolean(request.locked?.[`${name}::${slot}`]));
  if (!locked.some(Boolean)) return template;
  const current = currentDay(request, name, rowsById, slots, people); if (!current) return null;
  const rows = template.rows.map((row, slot) => locked[slot] ? current.rows[slot] : row), fixed = locked.map((value, slot) => value ? current.factors[slot] : null);
  if (rows.some(row => !row.n.complete)) return null;
  const choices = portionChoices(rows, targets, fixed); return choices[0] ? { rows, factors: choices[0].factors } : null;
}

export async function optimizeMealPlan(request, { signal } = {}) {
  const started = Date.now(), profile = request.profile || {}, daysCount = Math.round(clamp(profile.days, 1, 14, 7)), people = clamp(profile.people, 1, 50, 1);
  const slots = Core.mealSlots(clamp(profile.meals, 2, 4, 4)), names = Core.dayNames(daysCount), weeklyBudgetGBP = clamp(profile.budget, 0, 10000, 45), budgetGBP = weeklyBudgetGBP * daysCount / 7;
  const targets = { min: clamp(profile.calories, 200, 10000, 2000) * .9, max: clamp(profile.calories, 200, 10000, 2000) * 1.1, protein: clamp(profile.protein, 0, 1000, 200) };
  const budgetCents = pennies(budgetGBP), pantry = Array.isArray(request.pantry) ? request.pantry : [], favorites = Array.isArray(request.favorites) ? request.favorites : [];
  const recipes = (Array.isArray(request.recipes) ? request.recipes : []).filter(recipe => recipe && Array.isArray(recipe.ings) && allowedRecipe(recipe, profile)).map(prepareRecipe);
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe])), items = new Map();
  for (const recipe of recipes) for (const [name, , unit] of recipe.ings) { const meta = Core.unitMeta(unit, name), key = bookKey(name, meta.dim); if (!items.has(key)) items.set(key, { key, name, dimension: meta.dim }); }
  const unavailable = reason => ({ status: 'unavailable', week: request.week || [], mealServings: request.mealServings || {}, basket: { complete: false, totalCostGBP: null, recommendations: [] }, budget: { weeklyGBP: round(weeklyBudgetGBP), planGBP: round(budgetGBP) }, warnings: [reason], diagnostics: { elapsedMs: Date.now() - started } });
  if (!recipes.length) return unavailable('No allowed recipes are available. Add recipes with complete ingredient quantities and nutrition.');
  if (items.size > 400) return unavailable('This recipe selection contains more than 400 different ingredient requirements. Select a smaller recipe library to calculate the budget safely.');
  signal?.throwIfAborted();
  let catalogue;
  try { catalogue = await catalogPurchaseOffers([...items.values()], { signal }); }
  catch (error) { if (signal?.aborted) throw error; return unavailable(error.message); }
  const books = new Map(), stock = stockAmounts(pantry);
  for (const [index, row] of catalogue.rows.entries()) {
    books.set(row.key, priceBook(row, Math.min(20000, Math.max(10000, budgetCents * 2))));
    if (index % 8 === 7) { signal?.throwIfAborted(); await yieldToWorker(); }
  }
  const pools = safePools(recipes, slots, stock, people, daysCount, books, profile, favorites), warnings = [], templates = [];
  if (pools.some(pool => !pool.length)) return unavailable('At least one meal category has no allowed recipe with complete nutrition and automatic ingredient pricing. Add suitable recipes or check the exclusions.');
  let examined = 0, combinations = 0, best = null;
  const chosen = new Array(slots.length), hasLocks = names.some(name => slots.some((_, index) => request.locked?.[`${name}::${index}`]));
  const consider = template => {
    const days = hasLocks ? names.map(name => withLocks(template, name, request, byId, targets, people, slots)) : names.map(() => template);
    if (days.some(day => !day)) return;
    const cost = basketCost(days, people, stock, books); if (!Number.isFinite(cost)) return;
    const preference = template.rows.reduce((sum, row) => sum + row.preference, 0);
    const entry = { ...template, cost, preference }; templates.push(entry); templates.sort((a, b) => a.cost - b.cost || b.preference - a.preference); if (templates.length > 50) templates.pop();
    if (!best || cost < best.cost || cost === best.cost && preference > best.preference) best = { days, cost, preference };
  };
  const enumerate = async slot => {
    if (slot === slots.length) {
      combinations++;
      const maxProtein = chosen.reduce((sum, row) => sum + row.n.p * 2, 0); if (maxProtein + EPS < targets.protein) return;
      for (const choice of portionChoices(chosen, targets)) { examined++; consider({ rows: chosen.slice(), factors: choice.factors }); }
      if (combinations % 256 === 0) { signal?.throwIfAborted(); await yieldToWorker(); }
      return;
    }
    for (const recipe of pools[slot]) { chosen[slot] = recipe; await enumerate(slot + 1); }
  };
  await enumerate(0);
  // A valid existing plan is another starting point; it never overrides locks.
  const existing = names.map(name => currentDay(request, name, byId, slots, people));
  if (existing.every(day => day && day.rows.every(row => row.n.complete) && nutritionValid(day.rows, day.factors, targets))) {
    const cost = basketCost(existing, people, stock, books); if (Number.isFinite(cost) && (!best || cost < best.cost)) best = { days: existing, cost, preference: 0 };
  }
  if (!best) return unavailable('The search could not find complete daily meals within the nutrition range. No meals or dietary needs have been reduced; add more suitable recipes or review the targets.');
  // Share ingredients across the week, then add variation only while the full
  // purchased basket stays in budget. Nutrition and locked meals remain hard rules.
  if (best.cost <= budgetCents && profile.avoidRepeat !== false && !profile.mealPrep) {
    let chosenDays = best.days.slice();
    const signatures = day => day.rows.map(row => row.id).join('|');
    for (let index = 1; index < names.length; index++) {
      const used = new Set(chosenDays.slice(0, index).map(signatures));
      for (const template of templates.slice(0, 30).sort((a, b) => b.preference - a.preference || a.cost - b.cost)) {
        const replacement = withLocks(template, names[index], request, byId, targets, people, slots);
        if (!replacement || used.has(signatures(replacement))) continue;
        const trial = chosenDays.slice(); trial[index] = replacement;
        const cost = basketCost(trial, people, stock, books);
        if (cost <= budgetCents) { chosenDays = trial; best.cost = cost; break; }
      }
    }
    best.days = chosenDays;
  }
  const plan = planFromDays(best.days, names, people), shopping = Core.buildShopping({ ...plan, recipes, people, pantry }), recommendations = [], basketItems = [];
  let complete = true, totalCents = 0;
  for (const [key, item] of Object.entries(shopping)) {
    if (item.unknown) complete = false;
    for (const [dimension, group] of Object.entries(item.groups)) {
      if (group.remaining <= EPS) continue;
      const row = books.get(`${key}::${dimension}`)?.row, purchase = row ? calculatePackPurchase(row.candidates, group.remaining, dimension) : null;
      const entry = { key: `${key}::${dimension}`, name: item.name, dimension, quantity: group.remaining }; basketItems.push(entry);
      if (!purchase) complete = false; else totalCents += pennies(purchase.totalCostGBP);
      recommendations.push({ key: entry.key, query: item.name, dimension, plan: purchase, match: purchase?.products[0] || null, confidence: purchase ? 'high' : row?.confidence || 'none', candidateCount: row?.candidates.length || 0 });
      await yieldToWorker(); signal?.throwIfAborted();
    }
  }
  const nutritionDays = best.days.map((day, index) => {
    const kcal = day.rows.reduce((sum, row, slot) => sum + row.n.kcal * day.factors[slot], 0), p = day.rows.reduce((sum, row, slot) => sum + row.n.p * day.factors[slot], 0);
    return { day: names[index], kcal: round(kcal), p: round(p), complete: day.rows.every(row => row.n.complete), meetsTargets: nutritionValid(day.rows, day.factors, targets) };
  });
  const feasible = complete && totalCents <= budgetCents && nutritionDays.every(day => day.complete && day.meetsTargets);
  if (!feasible) warnings.push(complete ? 'No plan inside this budget was found. This is the lowest-cost complete proposal found by the bounded search, not proof that a cheaper plan is impossible.' : 'Some ingredients could not be priced. Unpriced ingredients are not counted as free, so this proposal cannot be accepted as within budget.');
  const uniqueMeals = new Set(plan.week.flatMap(day => day.meals)).size;
  if (uniqueMeals < daysCount * slots.length / 2) warnings.push('Meals repeat to share ingredients and reduce full-pack purchases. Variety and preferences were relaxed to protect the budget and nutrition targets.');
  if (Object.values(shopping).some(item => item.quantityNotes?.length)) warnings.push('Shopping quantities include labelled typical weights and cooking conversions. Actual weights and local prices can vary.');
  return { status: feasible ? 'feasible' : 'no_feasible_plan', ...plan,
    basket: { totalCostGBP: round(totalCents / 100), complete, items: basketItems, recommendations, indexSize: catalogue.indexSize, refreshedAt: catalogue.refreshedAt },
    nutrition: { days: nutritionDays, calorieMin: targets.min, calorieMax: targets.max, proteinTarget: targets.protein, perPerson: true, source: 'recipe nutrition estimates' },
    budget: { weeklyGBP: round(weeklyBudgetGBP), planGBP: round(budgetGBP), overGBP: round(Math.max(0, totalCents - budgetCents) / 100), household: true },
    warnings, diagnostics: { elapsedMs: Date.now() - started, combinations, evaluatedPortions: examined, recipeCount: recipes.length, ingredientCount: books.size, uniqueMeals, search: 'bounded deterministic recipes, nutrition-constrained portions, shared full-pack basket, budget-safe variety' } };
}
