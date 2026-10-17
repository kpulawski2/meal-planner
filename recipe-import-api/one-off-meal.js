import '../public/one-off-meal-core.js';
import '../public/recipe-discovery-core.js';
import { normalizePlannerRequest } from './planner-request.js';
import { allowedRecipe } from './budget-planner.js';
import { catalogPurchaseOffers, calculatePackPurchase } from './catalog-adapter.js';
import { setImmediate as yieldToServer } from 'node:timers/promises';

const Core = globalThis.OneOffMealCore;
export function normalizeOneOffRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new TypeError('Send your meal budget and recipe choices.');
  const brief = Core.normalise(body);
  const request = normalizePlannerRequest({ recipes: body.recipes, pantry: brief.usePantry ? body.pantry : [],
    allowPersonalPrices: body.allowPersonalPrices, personalPrices: body.personalPrices,
    profile: { diet: body.profile?.diet, dislikes: body.profile?.dislikes, custom: body.profile?.custom,
      equipment: body.profile?.equipment, cookTime: body.profile?.cookTime, supermarket: brief.store,
      days: 1, meals: 2, people: brief.people, protein: 0, budget: brief.budget,
      lidlReferencePrices: brief.store === 'Lidl', varietyMode: 'Balanced' } });
  return { ...request, brief };
}
export async function findOneOffMeals(request, { signal } = {}) {
  const { brief, profile, pantry } = request;
  const recipes = request.recipes.filter(recipe => (recipe.cat === brief.category || brief.category === 'Snack' && recipe.cat === 'Fruit') &&
    !recipe.excludedByFeedback && allowedRecipe(recipe, profile) && globalThis.RecipeDiscoveryCore.matches(recipe, brief.query) &&
    recipe.nutrition?.complete === true && Number(recipe.nutrition.kcal) > 0 && Number.isFinite(Number(recipe.nutrition.p)));
  const prepared = recipes.map(recipe => ({ recipe, shopping: Core.shopping(recipe, brief, pantry) })), ingredients = new Map();
  for (const row of prepared) for (const item of row.shopping.items) if (!ingredients.has(item.key)) ingredients.set(item.key, item);
  if (ingredients.size > 1000) throw new TypeError('Refine the meal search to price fewer than 1,000 different ingredients.');
  const catalogue = ingredients.size ? await catalogPurchaseOffers([...ingredients.values()], { store: brief.store, allowReferencePrices: brief.store === 'Lidl',
    allowPersonalPrices: request.allowPersonalPrices, personalPrices: request.personalPrices, signal }) : null;
  const books = new Map((catalogue?.rows || []).map(row => [row.key, row])), options = [], overBudget = [];
  let unpriced = 0;
  for (const { recipe, shopping } of prepared) {
    signal?.throwIfAborted();
    const recommendations = []; let costCents = 0, complete = !shopping.unknown.length;
    for (const item of shopping.items) {
      const priced = books.get(item.key), purchase = priced ? calculatePackPurchase(priced.candidates, item.quantity, item.dimension) : null;
      if (!purchase) { complete = false; break; }
      costCents += Math.round(purchase.totalCostGBP * 100);
      recommendations.push({ key: item.key, query: item.name, dimension: item.dimension, confidence: 'high', match: purchase.products[0], plan: purchase });
    }
    if (!complete) unpriced++;
    else {
      const option = { recipeId: recipe.id, people: brief.people, totalCostGBP: costCents / 100,
        perPersonGBP: Math.round(costCents / brief.people) / 100, estimatedPrice: recommendations.some(row => row.plan.estimatedPrice),
        items: shopping.items, recommendations, refreshedAt: catalogue?.refreshedAt || new Date().toISOString(),
        fixedBatch: recipe.fixedBatch === true,
        preparedPortions: recipe.fixedBatch ? Math.ceil(brief.people / recipe.servings) * recipe.servings : brief.people };
      (costCents <= Math.round(brief.budget * 100) ? options : overBudget).push(option);
    }
    await yieldToServer();
  }
  const order = (a,b) => a.totalCostGBP - b.totalCostGBP || a.recipeId.localeCompare(b.recipeId);
  options.sort(order); overBudget.sort(order);
  return { store: brief.store, brief, options: options.slice(0, 12), affordable: options.length, considered: recipes.length, unpriced,
    cheapestOverBudgetGBP: overBudget[0]?.totalCostGBP ?? null,
    checkedAt: new Date().toISOString(), coverageScope: 'provided_suitable_recipes' };
}
