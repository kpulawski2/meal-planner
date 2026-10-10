import '../public/budget-core.js';
import '../public/recipe-library-core.js';
import { catalogPurchaseOffers, calculatePackPurchase } from './catalog-adapter.js';
import { setImmediate as yieldToWorker } from 'node:timers/promises';
import { activeGoals, recipeQuality, dailyQuality, goalReport } from './planner-quality.js';

const Core = globalThis.MealBudgetCore;
const EPS = .000001;
const clamp = (value, min, max, fallback) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
const pennies = value => Math.round(Number(value) * 100);
const round = (value, digits = 2) => Number(value.toFixed(digits));
const bookKey = (name, dimension) => `${Core.canonicalIngredientName(name)}::${dimension}`;

function allowedRecipe(recipe, profile) {
  if (!globalThis.RecipeLibraryCore.equipmentAllowed(recipe, profile)) return false;
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
    if (Core.isCookingWater(name)) continue;
    const quantity = Number(rawQuantity), meta = Core.unitMeta(unit, name), key = bookKey(name, meta.dim);
    if (!(quantity > 0) || !Number.isFinite(quantity) || !String(name).trim()) { known = false; continue; }
    amounts.set(key, (amounts.get(key) || 0) + quantity * meta.factor / yieldCount);
  }
  return { ...recipe, servings: yieldCount, n: nutritionOf(recipe), amounts, known };
}

function nutritionValid(rows, factors, targets) {
  const kcal = rows.reduce((sum, recipe, index) => sum + recipe.n.kcal * factors[index], 0), p = rows.reduce((sum, recipe, index) => sum + recipe.n.p * factors[index], 0);
  return kcal + EPS >= targets.min && kcal <= targets.max + EPS && p + EPS >= targets.protein;
}

// At a linear programme vertex, at most two portions are between their bounds.
// Enumerating those small vertices is deterministic and avoids an external solver.
function portionChoices(rows, targets, fixed = [], profile = {}) {
  const count = rows.length, result = [], seen = new Set(), bounds = rows.map((_, index) => fixed[index] != null ? [fixed[index], fixed[index]] : [.5, 2]);
  const add = factors => {
    if (factors.some((value, index) => !Number.isFinite(value) || value < bounds[index][0] - EPS || value > bounds[index][1] + EPS)) return;
    if (!nutritionValid(rows, factors, targets)) return;
    const key = factors.map(value => round(value, 6)).join(','); if (seen.has(key)) return; seen.add(key);
    result.push({ factors, linear: rows.reduce((sum, row, index) => sum + row.linear * factors[index], 0), quality: dailyQuality(rows, factors, profile) });
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
      for (const calories of [targets.min, (targets.min + targets.max) / 2 * (activeGoals(profile).includes('Lose weight') ? .95 : 1), targets.max]) { const next = factors.slice(); next[i] = (calories - knownK) / rows[i].n.kcal; add(next); }
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
  // Keep both goal-aware and cheapest portions for every priority. Otherwise a
  // Cheapest request can paradoxically lose a cheaper whole-pack plan merely
  // because it discarded the portion pattern used by Balanced.
  const sorted = result.sort((a, b) => a.linear + a.quality * .5 - b.linear - b.quality * .5);
  const choices = sorted.slice(0, 2), cheapest = result.slice().sort((a, b) => a.linear - b.linear)[0];
  if (cheapest && !choices.includes(cheapest)) choices.push(cheapest);
  return choices;
}

function stockAmounts(pantry) {
  const stock = new Map();
  for (const item of pantry) { const meta = Core.unitMeta(item.unit, item.name), key = bookKey(item.name, meta.dim); stock.set(key, (stock.get(key) || 0) + Math.max(0, Number(item.qty) || 0) * meta.factor); }
  return stock;
}

function requirementAmounts(days, people) {
  const amounts = new Map(), batches = new Map();
  for (const day of days) for (let index = 0; index < day.rows.length; index++) {
    const row=day.rows[index],portions=day.factors[index]*people;
    if(row.fixedBatch){const use=batches.get(row.id)||{row,portions:0};use.portions+=portions;batches.set(row.id,use);}
    else for (const [key, quantity] of row.amounts) amounts.set(key, (amounts.get(key) || 0) + quantity * portions);
  }
  for(const {row,portions} of batches.values())for(const [key,quantity]of row.amounts)amounts.set(key,(amounts.get(key)||0)+quantity*Math.ceil((portions-EPS)/row.servings)*row.servings);
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
    row.family = Core.proteinFamily(row);
    row.quality = recipeQuality(row, profile);
    row.priceable = row.known && [...row.amounts].every(([key, quantity]) => Number.isFinite(books.get(key)?.unitCost) || (stock.get(key) || 0) + EPS >= quantity * people * days * 2);
  }
  return slots.map(slot => {
    const eligible = rows.filter(row => row.n.complete && row.priceable && (row.cat === slot || slot === 'Snack' && row.cat === 'Fruit'));
    const value = eligible.slice().sort((a, b) => a.linear / Math.max(1, a.n.kcal + a.n.p * 10) - b.linear / Math.max(1, b.n.kcal + b.n.p * 10) || a.id.localeCompare(b.id));
    const protein = eligible.slice().sort((a, b) => a.linear / Math.max(.1, a.n.p) - b.linear / Math.max(.1, b.n.p) || a.id.localeCompare(b.id));
    const favoritesSorted = eligible.filter(row => row.preference).sort((a, b) => b.preference - a.preference || a.linear - b.linear);
    const families = [...new Set(eligible.map(row => row.family))].flatMap(family => value.filter(row => row.family === family).slice(0, 2));
    const goalChoices = eligible.slice().sort((a, b) => a.quality.penalty - b.quality.penalty || a.linear - b.linear);
    return [...new Map([...families, ...value.slice(0, 12), ...protein.slice(0, 6), ...goalChoices.slice(0, 4), ...favoritesSorted.slice(0, 2)].map(row => [row.id, row])).values()].slice(0, 24);
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
  const choices = portionChoices(rows, targets, fixed, request.profile); return choices[0] ? { rows, factors: choices[0].factors } : null;
}

// Main-meal pairs anchor the candidate set. Breakfast/snack combinations are
// ranked cheaply first; only a bounded selection needs the portion solver.
// This keeps low-cost chicken, beans, eggs and fish in the search instead of
// retaining only uniform seven-day pork templates.
async function dailyTemplates(pools, slots, targets, profile, people, stock, books, signal) {
  const mainIndexes = slots.map((slot, index) => ['Lunch', 'Dinner'].includes(slot) ? index : -1).filter(index => index >= 0);
  const sideIndexes = slots.map((_, index) => index).filter(index => !mainIndexes.includes(index));
  const templates = [], signatures = new Set(); let examined = 0, combinations = 0;
  const pairs = [];
  for (const lunch of pools[mainIndexes[0]]) for (const dinner of pools[mainIndexes[1]]) pairs.push([lunch, dinner]);
  for (const pair of pairs) {
    const base = new Array(slots.length); mainIndexes.forEach((index, i) => { base[index] = pair[i]; });
    const candidates = [];
    const sides = index => {
      if (index === sideIndexes.length) {
        combinations++;
        const k = base.reduce((sum, row) => sum + row.n.kcal, 0), p = base.reduce((sum, row) => sum + row.n.p, 0);
        if (p * 2 + EPS < targets.protein || k * 2 + EPS < targets.min || k * .5 > targets.max + EPS) return;
        const factor = Math.max(.5, targets.min / k, targets.protein / Math.max(EPS, p));
        const linear = base.reduce((sum, row) => sum + row.linear, 0) * factor;
        const quality = dailyQuality(base, base.map(() => factor), profile);
        const overshoot = Math.max(0, k * factor - targets.max) * .4;
        candidates.push({ rows: base.slice(), rank: linear + overshoot + quality * .45, linear: linear + overshoot });
        return;
      }
      for (const row of pools[sideIndexes[index]]) { base[sideIndexes[index]] = row; sides(index + 1); }
    };
    sides(0);
    const ordered = candidates.slice().sort((a, b) => a.rank - b.rank), cheapCandidates = candidates.slice().sort((a, b) => a.linear - b.linear);
    const sideAlternatives = [];
    for (const side of sideIndexes) {
      const included = new Set();
      for (const candidate of ordered) { const id = candidate.rows[side].id; if (included.has(id)) continue; included.add(id); sideAlternatives.push(candidate); if (included.size >= 5) break; }
    }
    const sideIds = sideIndexes.map(side => [...new Set(ordered.map(candidate => candidate.rows[side].id))].slice(0, 4));
    const pairedSides = ordered.filter(candidate => sideIndexes.every((side, i) => sideIds[i].includes(candidate.rows[side].id)));
    const choices = [...new Set([...ordered.slice(0, 4), ...cheapCandidates.slice(0, 2), ...sideAlternatives, ...pairedSides])];
    for (const candidate of choices) for (const choice of portionChoices(candidate.rows, targets, [], profile)) {
      examined++;
      const signature = candidate.rows.map(row => row.id).join('|') + '::' + choice.factors.map(value => round(value, 5)).join(',');
      if (signatures.has(signature)) continue; signatures.add(signature);
      const template = { rows: candidate.rows, factors: choice.factors, quality: choice.quality,
        preference: candidate.rows.reduce((sum, row) => sum + row.preference, 0), linear: choice.linear };
      template.amounts = requirementAmounts([template], people);
      template.cost = basketCost([template], people, stock, books);
      template.rank = template.cost + choice.linear * 3 + choice.quality * .6 - template.preference * 35;
      if (Number.isFinite(template.cost)) templates.push(template);
    }
    if (examined % 24 < 12) { signal?.throwIfAborted(); await yieldToWorker(); }
  }
  const sorted = templates.sort((a, b) => a.rank - b.rank || a.linear - b.linear), selected = new Set(sorted.slice(0, 120));
  // Each main recipe and each protein-family pairing keeps its own inexpensive
  // templates. Cheap uniform recipes cannot squeeze all alternatives out.
  const recipeBuckets = new Map(), familyBuckets = new Map(), mainPairBuckets = new Map();
  for (const template of sorted) {
    for (const index of slots.map((_, i) => i)) {
      const id = template.rows[index].id, bucket = recipeBuckets.get(id) || [];
      const sideSignature = sideIndexes.map(side => template.rows[side].id).join('|');
      const key = mainIndexes.includes(index) ? sideSignature : mainIndexes.map(main => template.rows[main].family).join('|');
      const existingKeys = bucket.map(other => mainIndexes.includes(index) ? sideIndexes.map(side => other.rows[side].id).join('|') : mainIndexes.map(main => other.rows[main].family).join('|'));
      if (bucket.length < 8 && !existingKeys.includes(key)) bucket.push(template); recipeBuckets.set(id, bucket);
    }
    const familyKey = mainIndexes.map(index => template.rows[index].family).join('|'), bucket = familyBuckets.get(familyKey) || [];
    if (bucket.length < 3) bucket.push(template); familyBuckets.set(familyKey, bucket);
    const pairKey = mainIndexes.map(index => template.rows[index].id).join('|'), pairBucket = mainPairBuckets.get(pairKey) || [];
    const sideKey = sideIndexes.map(index => template.rows[index].id).join('|');
    if (pairBucket.length < 3 && !pairBucket.some(other => sideIndexes.map(index => other.rows[index].id).join('|') === sideKey)) pairBucket.push(template);
    mainPairBuckets.set(pairKey, pairBucket);
  }
  for (const bucket of [...recipeBuckets.values(), ...familyBuckets.values(), ...mainPairBuckets.values()]) for (const template of bucket) selected.add(template);
  return { templates: [...selected].sort((a, b) => a.rank - b.rank), examined, combinations };
}

function batchUses(template, people) {
  const uses = new Map();
  template.rows.forEach((row, index) => {
    if (!row.fixedBatch) return;
    const use = uses.get(row.id) || { row, portions: 0 };
    use.portions += template.factors[index] * people;
    uses.set(row.id, use);
  });
  return [...uses.values()];
}

function candidateAmounts(state, template) {
  if (!template.batchRecipes?.length) return template.amounts;
  const amounts = new Map(template.amounts);
  for (const { row, portions } of template.batchRecipes) {
    const yieldSize = Math.max(EPS, Number(row.servings) || 1);
    const previous = state.batchPortions.get(row.id) || 0;
    const bought = value => Math.max(0, Math.ceil((value - EPS) / yieldSize)) * yieldSize;
    // A prepared tub can supply several days. Only charge ingredients for
    // additional whole tubs, while nutrition follows the portions consumed.
    const adjustment = bought(previous + portions) - bought(previous) - bought(portions);
    for (const [key, quantity] of row.amounts) amounts.set(key, (amounts.get(key) || 0) + quantity * adjustment);
  }
  return amounts;
}

function candidateCost(state, template, stock, books) {
  let cost = state.cost;
  for (const [key, quantity] of candidateAmounts(state, template)) {
    const previous = state.amounts.get(key) || 0, book = books.get(key), inventory = stock.get(key) || 0;
    const oldCost = book?.cost(Math.max(0, previous - inventory)) ?? (previous <= inventory + EPS ? 0 : Infinity);
    const newCost = book?.cost(Math.max(0, previous + quantity - inventory)) ?? (previous + quantity <= inventory + EPS ? 0 : Infinity);
    if (!Number.isFinite(newCost)) return Infinity;
    cost += newCost - oldCost;
  }
  return cost;
}

async function searchWeek(templates, names, request, byId, slots, targets, people, stock, books, budgetCents, signal) {
  const profile = request.profile || {}, policy = Core.varietyPolicy(profile, names.length), mainIndexes = slots.map((slot, index) => ['Lunch', 'Dinner'].includes(slot) ? index : -1).filter(index => index >= 0);
  const requiredFamilies = Math.min(policy.requiredFamilies, new Set(templates.flatMap(template => mainIndexes.map(index => template.rows[index].family))).size);
  const cheapest = profile.priority === 'Cheapest' || profile.varietyMode === 'Budget focus';
  const saveMoney = activeGoals(profile).includes('Save money'), easy = activeGoals(profile).includes('Make cooking easier');
  const width = names.length > 7 ? 90 : 72;
  const repeatLimits = slots.map(slot => ['Lunch', 'Dinner'].includes(slot) ? policy.repeatLimit : policy.sideRepeatLimit), minimumDistinct = slots.map(slot => ['Lunch', 'Dinner'].includes(slot) ? policy.minimumDistinct : policy.minimumSideDistinct);
  const clean = { days: [], amounts: new Map(), batchPortions: new Map(), cost: 0, quality: 0, batches: new Set(), counts: new Map(), distinct: slots.map(() => new Set()), families: new Map(), rank: 0 };
  const shapeOf = proposal => {
    const familyCounts = new Map(proposal.state.families);
    for (const index of mainIndexes) { const family = proposal.template.rows[index].family; familyCounts.set(family, (familyCounts.get(family) || 0) + 1); }
    return proposal.template.rows.map((row, index) => proposal.state.distinct[index].size + (proposal.state.distinct[index].has(row.id) ? 0 : 1)).join(',') + ':' + [...familyCounts].sort(([a], [b]) => a.localeCompare(b)).map(([family, count]) => `${family}:${count}`).join(',') + ':' + mainIndexes.map(index => proposal.template.rows[index].family).join(',');
  };
  let beam = [clean], expansions = 0; const stages = [];
  for (const [dayIndex, name] of names.entries()) {
    const seenDay = new Set(), options = [];
    for (const raw of templates) {
      const template = withLocks(raw, name, request, byId, targets, people, slots); if (!template) continue;
      const signature = template.rows.map(row => row.id).join('|') + '::' + template.factors.map(value => round(value, 5)).join(',');
      if (seenDay.has(signature)) continue; seenDay.add(signature);
      if (!template.amounts) { template.amounts = requirementAmounts([template], people); template.quality = dailyQuality(template.rows, template.factors, profile); }
      if (!template.batchRecipes) template.batchRecipes = batchUses(template, people);
      options.push(template);
    }
    const proposals = [];
    for (const state of beam) {
      const siblings = [];
      for (const template of options) {
      expansions++;
      const previous = state.days.at(-1), main = mainIndexes.map(index => template.rows[index]);
      if (template.rows.some((row, i) => (state.counts.get(row.id) || 0) >= repeatLimits[i] || mainIndexes.includes(i) && previous?.rows[i].id === row.id)) continue;
      const increments = new Map(); for (const row of main) increments.set(row.family, (increments.get(row.family) || 0) + 1);
      if ([...increments].some(([family, count]) => (state.families.get(family) || 0) + count > policy.dominantFamilyLimit)) continue;
      const remainingDays = names.length - dayIndex - 1;
      if (template.rows.some((row, i) => state.distinct[i].size + (state.distinct[i].has(row.id) ? 0 : 1) + remainingDays < minimumDistinct[i])) continue;
      const familyCount = new Set([...state.families.keys(), ...increments.keys()]).size;
      if (familyCount + remainingDays * 2 < requiredFamilies) continue;
      const cost = candidateCost(state, template, stock, books); if (!Number.isFinite(cost)) continue;
      const novelBatches = template.rows.filter(row => !state.batches.has(row.id)), batchPenalty = easy ? novelBatches.reduce((sum, row) => sum + (row.quality?.cookMinutes || 45) * .7, 0) : 0;
      const quality = state.quality + (template.quality ?? dailyQuality(template.rows, template.factors, profile)) - template.rows.reduce((sum, row) => sum + row.preference * 25, 0) + batchPenalty;
      const novelty = template.rows.reduce((sum, row, i) => sum + (state.distinct[i].has(row.id) ? 0 : 1), 0);
      const unmet = Math.max(0, requiredFamilies - familyCount) + template.rows.reduce((sum, row, i) => sum + Math.max(0, minimumDistinct[i] - state.distinct[i].size - (state.distinct[i].has(row.id) ? 0 : 1)), 0);
      // Cost remains in integer pence. Quality only ranks complete, target-safe
      // candidates; no amount of preference can waive the budget/variety checks.
      const rank = cost + quality * (saveMoney ? .3 : .75) + unmet * 55 - (profile.varietyMode === 'More variety' || profile.priority === 'Variety' ? novelty * 35 : 0);
      siblings.push({ state, template, cost, quality, rank, familyCount });
      }
      // Retain a bounded, structurally diverse set from each parent before the
      // global beam sort. Avoid holding >100,000 weekly proposals at once on
      // the 512 MB free service, while keeping alternative protein/side plans.
      siblings.sort((a, b) => a.rank - b.rank || a.cost - b.cost || a.quality - b.quality);
      const siblingShapes = new Map(); let retained = 0;
      for (const proposal of siblings) {
        const shape = shapeOf(proposal);
        if ((siblingShapes.get(shape) || 0) >= 4) continue;
        siblingShapes.set(shape, (siblingShapes.get(shape) || 0) + 1); proposals.push(proposal);
        if (++retained >= width * 2) break;
      }
    }
    proposals.sort((a, b) => a.rank - b.rank || a.cost - b.cost || a.quality - b.quality);
    const selected = [], signatures = new Set(), shapes = new Map();
    for (const proposal of proposals) {
      const key = [...proposal.state.counts].map(([id, count]) => `${id}:${count}`).sort().join('|') + '>' + proposal.template.rows.map(row => row.id).join('|') + '::' + proposal.cost + '::' + Math.round(proposal.quality / 25) + '::' + [...proposal.state.batchPortions].map(([id, quantity]) => `${id}:${round(quantity, 5)}`).sort().join('|');
      if (signatures.has(key)) continue;
      const shape = shapeOf(proposal);
      if ((shapes.get(shape) || 0) >= 4) continue;
      shapes.set(shape, (shapes.get(shape) || 0) + 1); signatures.add(key); selected.push(proposal); if (selected.length >= width) break;
    }
    beam = selected.map(({ state, template, cost, quality, rank }) => {
      const next = { days: [...state.days, template], amounts: new Map(state.amounts), batchPortions: new Map(state.batchPortions), cost, quality, rank, batches: new Set([...state.batches, ...template.rows.map(row => row.id)]), counts: new Map(state.counts), distinct: state.distinct.map(value => new Set(value)), families: new Map(state.families) };
      for (const [key, quantity] of candidateAmounts(state, template)) next.amounts.set(key, (next.amounts.get(key) || 0) + quantity);
      for (const { row, portions } of template.batchRecipes) next.batchPortions.set(row.id, (next.batchPortions.get(row.id) || 0) + portions);
      template.rows.forEach((row, index) => { next.counts.set(row.id, (next.counts.get(row.id) || 0) + 1); next.distinct[index].add(row.id); if (mainIndexes.includes(index)) next.families.set(row.family, (next.families.get(row.family) || 0) + 1); });
      return next;
    });
    stages.push({ day: dayIndex + 1, candidates: options.length, survivors: beam.length, distinct: beam[0]?.distinct.map(value => value.size) || [] });
    signal?.throwIfAborted(); await yieldToWorker();
    if (!beam.length) break;
  }
  const rawFinalists = beam.filter(state => state.days.length === names.length).map(state => ({ ...state, variety: Core.inspectVariety(planFromDays(state.days, names, people).week, [...byId.values()], profile) }));
  const finalists = rawFinalists.filter(state => state.variety.met);
  const feasible = finalists.filter(state => state.cost <= budgetCents);
  const choices = feasible.length ? feasible : finalists;
  choices.sort((a, b) => cheapest ? a.cost - b.cost || a.quality - b.quality : a.rank - b.rank || a.cost - b.cost);
  return { best: choices[0] || null, expansions, constrained: true, stages, searchVarietyViolations: rawFinalists[0]?.variety.violations || [] };
}

export async function optimizeMealPlan(request, { signal } = {}) {
  const started = Date.now(), profile = request.profile || {}, daysCount = Math.round(clamp(profile.days, 1, 14, 7)), people = clamp(profile.people, 1, 50, 1);
  const slots = Core.mealSlots(clamp(profile.meals, 2, 4, 4)), names = Core.dayNames(daysCount), weeklyBudgetGBP = clamp(profile.budget, 0, 10000, 45), budgetGBP = weeklyBudgetGBP * daysCount / 7;
  const targets = { min: clamp(profile.calories, 200, 10000, 2000) * .9, max: clamp(profile.calories, 200, 10000, 2000) * 1.1, protein: clamp(profile.protein, 0, 1000, 200) };
  const budgetCents = pennies(budgetGBP), pantry = Array.isArray(request.pantry) ? request.pantry : [], favorites = Array.isArray(request.favorites) ? request.favorites : [];
  const recipes = (Array.isArray(request.recipes) ? request.recipes : []).filter(recipe => recipe && Array.isArray(recipe.ings) && allowedRecipe(recipe, profile)).map(prepareRecipe);
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe])), items = new Map();
  for (const recipe of recipes) for (const [name, , unit] of recipe.ings) { if (Core.isCookingWater(name)) continue; const meta = Core.unitMeta(unit, name), key = bookKey(name, meta.dim); if (!items.has(key)) items.set(key, { key, name, dimension: meta.dim }); }
  const unavailable = reason => ({ status: 'unavailable', week: request.week || [], mealServings: request.mealServings || {}, basket: { complete: false, totalCostGBP: null, recommendations: [] }, budget: { weeklyGBP: round(weeklyBudgetGBP), planGBP: round(budgetGBP) }, variety: Core.inspectVariety(request.week || [], recipes, profile), goals: goalReport(profile), warnings: [reason], diagnostics: { elapsedMs: Date.now() - started } });
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
  const pools = safePools(recipes, slots, stock, people, daysCount, books, profile, favorites), warnings = [];
  if (pools.some(pool => !pool.length)) return unavailable('At least one meal category has no allowed recipe with complete nutrition and automatic ingredient pricing. Add suitable recipes or check the exclusions.');
  const generated = await dailyTemplates(pools, slots, targets, profile, people, stock, books, signal), { templates, examined, combinations } = generated;
  if (!templates.length) return unavailable('The search could not find complete daily meals within the nutrition range. No dietary or nutrition needs have been reduced; add suitable recipes or review the targets.');
  const searched = await searchWeek(templates, names, request, byId, slots, targets, people, stock, books, budgetCents, signal);
  let best = searched.best;
  // A valid existing plan is another starting point; it never overrides locks.
  const existing = names.map(name => currentDay(request, name, byId, slots, people));
  if (existing.every(day => day && day.rows.every(row => row.n.complete) && nutritionValid(day.rows, day.factors, targets))) {
    const cost = basketCost(existing, people, stock, books), variety = Core.inspectVariety(planFromDays(existing, names, people).week, recipes, profile);
    if (Number.isFinite(cost) && variety.met && cost <= budgetCents && (!best || best.cost > budgetCents || cost < best.cost && (profile.priority === 'Cheapest' || profile.varietyMode === 'Budget focus'))) best = { days: existing, cost, preference: 0 };
  }
  if (!best) {
    // A clearly rejected, priced proposal explains the constraints. It cannot
    // overwrite the user's plan because its status is never feasible.
    for (const template of templates) {
      const days = names.map(name => withLocks(template, name, request, byId, targets, people, slots));
      if (days.some(day => !day)) continue;
      const cost = basketCost(days, people, stock, books);
      if (Number.isFinite(cost) && (!best || cost < best.cost)) best = { days, cost, rejectedVariety: true };
    }
  }
  if (!best) return unavailable('Locked meals or the nutrition targets prevent a complete plan. Your saved meals have been retained; unlock conflicting meals or add suitable recipes.');
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
  const variety = Core.inspectVariety(plan.week, recipes, profile), goals = goalReport(profile, best.days);
  const feasible = complete && totalCents <= budgetCents && nutritionDays.every(day => day.complete && day.meetsTargets) && variety.met;
  if (!complete) warnings.push('Some ingredients could not be priced. Unpriced ingredients are not counted as free, so this proposal cannot be accepted as within budget.');
  else if (totalCents > budgetCents) warnings.push('No plan inside this budget was found. This is the lowest-cost complete proposal found by the bounded search, not proof that a cheaper plan is impossible.');
  const uniqueMeals = new Set(plan.week.flatMap(day => day.meals)).size;
  if (!variety.met) warnings.push('No plan meeting the required meal variety was found. Repetition and protein-family limits have not been relaxed. Add alternatives, unlock conflicting meals or review the budget and targets.');
  if (Object.values(shopping).some(item => item.quantityNotes?.length)) warnings.push('Shopping quantities include labelled typical weights and cooking conversions. Actual weights and local prices can vary.');
  return { status: feasible ? 'feasible' : 'no_feasible_plan', ...plan,
    basket: { totalCostGBP: round(totalCents / 100), complete, items: basketItems, recommendations, indexSize: catalogue.indexSize, refreshedAt: catalogue.refreshedAt },
    nutrition: { days: nutritionDays, calorieMin: targets.min, calorieMax: targets.max, proteinTarget: targets.protein, perPerson: true, source: 'recipe nutrition estimates' },
    budget: { weeklyGBP: round(weeklyBudgetGBP), planGBP: round(budgetGBP), overGBP: round(Math.max(0, totalCents - budgetCents) / 100), household: true },
    variety, goals, warnings, diagnostics: { elapsedMs: Date.now() - started, searchCostGBP: round(best.cost / 100), combinations, evaluatedPortions: examined, weekExpansions: searched.expansions, stages: searched.stages, searchVarietyViolations: searched.searchVarietyViolations, recipeCount: recipes.length, ingredientCount: books.size, uniqueMeals, search: 'bounded main-meal pairs and weekly beam search, goal-aware portions, shared full-pack basket, hard variety and nutrition limits' } };
}
