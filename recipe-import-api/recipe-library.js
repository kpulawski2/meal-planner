import { cleanRecipeText, parseIngredientLine, includeMissingCookingIngredients } from './recipe-parser.js';

export const RECIPE_LIBRARY_SOURCE = Object.freeze({
  id: 'wikibooks-rcp', name: 'Wikibooks Cookbook',
  indexUrl: 'https://recipecontextprotocol.com/recipes?source=wikibooks&per_page=100&page=1',
  providerUrl: 'https://recipecontextprotocol.com/about',
  originalLicenseEvidence: 'https://en.wikibooks.org/wiki/Wikibooks:Copyrights',
  license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
});

const text = (value, max = 1000) => cleanRecipeText(value, max);
const number = (value, maximum, allowZero = false) => {
  const parsed = typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value.trim()) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && (allowZero ? parsed >= 0 : parsed > 0) && parsed <= maximum ? parsed : null;
};
const cookingUnits = new Set(['g', 'ml', 'pieces', 'tsp', 'tbsp', 'slices', 'cloves']);

export function normalizeLibraryIngredient(raw) {
  const original = text(raw, 1000);
  // Keep preparation notes without allowing the general importer's trailing
  // preparation matcher to erase an ingredient after "finely chopped ...".
  const forParsing = original
    .replace(/\b(?:finely|coarsely|roughly|freshly)\s+(?:chopped|diced|minced|grated|sliced|shredded|crushed|ground)\s+/gi, '')
    .replace(/\b(?:chopped|diced|minced|grated|sliced|shredded|cubed|crushed|peeled)\s+(?=[a-z])/gi, '')
    .replace(/^([0-9¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞./ ]+)\s*ea\.?,?\s*/i, '$1 pieces ');
  // Select only a metric equivalent explicitly supplied by the publisher.
  // A generic cup-to-grams conversion would depend on the food and is unsafe.
  const equivalent = forParsing.match(/^([0-9¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞./ ]+)\s*cups?\s*\(\s*([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|ml|l|grams?|millilitres?|milliliters?)\b)[^)]*\)\s*(.+)$/i);
  if (equivalent && parseIngredientLine(`${equivalent[1]} cups ingredient`).quantity !== null) {
    const metric = parseIngredientLine(`${equivalent[2]} ${equivalent[3]}`);
    return { ...metric, notes: [metric.notes, `Metric equivalent stated in source: ${original}`].filter(Boolean).join('; ') };
  }
  const parsed = parseIngredientLine(forParsing);
  if (forParsing !== original) parsed.notes = [parsed.notes, `Preparation stated in source: ${original}`].filter(Boolean).join('; ');
  // A measured package or handful is not one edible "piece". Keep the
  // publisher amount in the original text until its actual size is supplied.
  if (parsed.unit === 'pieces' && /^(?:sticks?|bags?|packages?|packets?|packs?|bunch(?:es)?|handfuls?|pinch(?:es)?|dessert\s+spoons?|heaped\s+(?:tea|table)spoons?|US\s+pints?)\b/i.test(parsed.name)) {
    parsed.quantity = null;
    parsed.unit = 'unknown';
    parsed.notes = [parsed.notes, `Ingredient-specific measure needs review: ${original}`].filter(Boolean).join('; ');
  }
  return parsed;
}

export function classifyRecipe(categories = [], title = '') {
  const categoryText = categories.filter(category => !/^recipes using\b/i.test(category)).join(' ').toLowerCase();
  const name = title.toLowerCase();
  if (/breakfast|brunch/.test(categoryText) || /\b(?:porridge|overnight oats|breakfast)\b/.test(name)) return 'Breakfast';
  if (/dessert|snack|pudding|\bcakes?\b|cookie|biscuit|ice cream|sorbet|confection|cand(?:y|ies)|beverage|drink/.test(categoryText)) return 'Snack';
  if (/lunch|sandwich|salad|soup/.test(categoryText)) return 'Lunch';
  return 'Dinner';
}

export function normalizeLibraryRecipe(raw, retrievedAt = new Date().toISOString()) {
  if (!raw || raw.source_name !== 'wikibooks' || raw.license !== RECIPE_LIBRARY_SOURCE.license) throw new Error('Recipe has an unsupported source or licence.');
  if (typeof raw.slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,220}$/.test(raw.slug)) throw new Error('Recipe slug is not valid.');
  const originalUrl = new URL(raw.source_url);
  if (originalUrl.protocol !== 'https:' || originalUrl.hostname !== 'en.wikibooks.org' || !originalUrl.pathname.startsWith('/wiki/Cookbook:')) throw new Error('Recipe has no valid original Wikibooks source URL.');
  const authorsUrl = new URL(raw.authors_url);
  if (authorsUrl.protocol !== 'https:' || authorsUrl.hostname !== 'en.wikibooks.org') throw new Error('Recipe has no valid author history URL.');
  if (raw.license_url !== RECIPE_LIBRARY_SOURCE.licenseUrl) throw new Error('Recipe licence URL changed.');
  const name = text(raw.title, 180);
  if (!name || !Array.isArray(raw.ingredients_raw) || !raw.ingredients_raw.length || !Array.isArray(raw.steps) || !raw.steps.length) throw new Error('Recipe is missing a title, ingredients or instructions.');
  const ingredients = raw.ingredients_raw.map(normalizeLibraryIngredient).filter(row => row.name);
  const method = raw.steps.map(step => text(step, 6000)).filter(Boolean);
  if (!method.length || !ingredients.length) throw new Error('Recipe content is empty.');
  const guarded = includeMissingCookingIngredients({ ingredients, steps: method, warnings: [] });
  const servings = number(raw.servings, 1000);
  const cookTime = number(raw.total_time_minutes, 10080, true);
  const categories = Array.isArray(raw.categories) ? raw.categories.map(category => text(category, 180)).filter(Boolean) : [];
  const reviewReasons = [];
  if (servings === null) reviewReasons.push('The source does not state a numeric recipe yield.');
  if (cookTime === null) reviewReasons.push('The source does not state a total preparation and cooking time.');
  if (guarded.ingredients.some(row => row.quantity === null || row.quantity <= 0)) reviewReasons.push('Some ingredient amounts are missing or ambiguous.');
  if (guarded.ingredients.some(row => row.quantity !== null && !cookingUnits.has(row.unit))) reviewReasons.push('Some source measures need ingredient-specific conversions before nutrition or pricing can be calculated.');
  if (/condiment|sauce recipes|spice mixture|spice blend|bread recipes|dough recipes|preserve|jam recipes|homebrewing|ferment|beverage|drink|alcohol/.test(categories.join(' ').toLowerCase())) reviewReasons.push('This may be a component, drink or preserved food rather than a complete meal.');
  if (raw.notice) reviewReasons.push(text(raw.notice, 1200));
  const tags = ['web', 'wikibooks'];
  if (categories.some(category => /^vegan recipes$/i.test(category))) tags.push('vegan');
  else if (categories.some(category => /^vegetarian recipes$/i.test(category))) tags.push('vegetarian');
  if (categories.some(category => /gluten.free recipes/i.test(category))) tags.push('gluten-free');
  const source = originalUrl.href;
  return {
    id: `web-${raw.slug}`, name, cat: classifyRecipe(categories, name), icon: '🍽️',
    ings: guarded.ingredients.map(row => [row.name, row.quantity, row.unit]),
    ingredientNotes: guarded.ingredients.map(row => row.notes || ''),
    method, servings, cookTime, prepMinutes: number(raw.prep_time_minutes, 10080, true), cookMinutes: number(raw.cook_time_minutes, 10080, true),
    kcal: null, p: null, c: null, f: null, cost: null,
    nutritionStatus: 'not-supplied', sourceNutrition: null,
    source, sourceName: RECIPE_LIBRARY_SOURCE.name,
    collectionUrl: `https://recipecontextprotocol.com/recipes/${raw.slug}`,
    attribution: `Adapted from ${name} by Wikibooks contributors, licensed CC BY-SA 4.0.`,
    license: RECIPE_LIBRARY_SOURCE.license, licenseUrl: RECIPE_LIBRARY_SOURCE.licenseUrl,
    authorsUrl: authorsUrl.href, sourceRevision: text(raw.source_ref, 100),
    sourceRetrievedAt: retrievedAt, sourceContentHash: text(raw.content_hash, 100),
    modifications: 'Ingredient amounts parsed into structured fields, selecting metric equivalents only where explicitly supplied by the source; source wording retained. Missing cooking ingredients are flagged without inventing quantities.',
    sourceIngredients: raw.ingredients_raw.map(line => text(line, 1000)),
    yieldText: text(raw.yield_text, 200) || null, servingsText: text(raw.servings, 200) || null,
    description: text(raw.description, 2500) || '', sourceCategories: categories,
    tags, equipment: [], needsReview: reviewReasons.length > 0,
    reviewReasons: [...new Set([...reviewReasons, ...guarded.warnings])],
  };
}

export function validateRecipeLibrary(candidate, previous = null) {
  const reasons = [];
  if (candidate?.schemaVersion !== 1 || candidate?.status !== 'complete') reasons.push('The library schema or completion status is invalid.');
  const rows = candidate?.recipes;
  if (!Array.isArray(rows) || !rows.length) reasons.push('The recipe library is empty.');
  if (Array.isArray(rows)) {
    if (new Set(rows.map(row => row.id)).size !== rows.length) reasons.push('Recipe identifiers are duplicated.');
    if (rows.some(row => !row.source || !row.license || !row.authorsUrl || !row.ings?.length || !row.method?.length)) reasons.push('Some recipes have incomplete content or provenance.');
    const discovered = candidate?.coverage?.discovered;
    if (!Number.isInteger(discovered) || discovered < rows.length || rows.length / discovered < 0.98) reasons.push('Fewer than 98% of discovered source recipes were validated.');
    if (previous?.status === 'complete' && Array.isArray(previous.recipes) && rows.length < previous.recipes.length * 0.95) reasons.push('The refreshed recipe library is substantially smaller than the healthy previous library.');
  }
  return { valid: !reasons.length, reasons };
}
