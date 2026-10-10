import * as cheerio from 'cheerio';

// Source facts only: this parser never asks a model to fill missing quantities,
// servings or nutrition. The app can estimate nutrition separately, with labels.
const FRACTIONS = { '¼': '1/4', '½': '1/2', '¾': '3/4', '⅐': '1/7', '⅑': '1/9', '⅒': '1/10', '⅓': '1/3', '⅔': '2/3', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
const NUMBER = '(?:\\d+(?:[.,]\\d+)?(?:\\s+\\d+\\s*[/⁄]\\s*\\d+)?|\\d+\\s*[/⁄]\\s*\\d+)';
const UNITS = '(?:kilograms?|kgs?|grams?|g|millilit(?:re|er)s?|mls?|lit(?:re|er)s?|liters?|l|tablespoons?|tbsp|tbs|teaspoons?|tsp|fluid\\s+ounces?|fl\\s*oz|ounces?|oz|pounds?|lbs?|cups?|pieces?|each|slices?|cloves?|tins?|cans?|packets?|packs?|pinches?)';

export function cleanRecipeText(value, max = 18000) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return cheerio.load(`<div>${String(value).slice(0, max * 2)}</div>`, null, false)('div').text().replace(/\u00a0/g, ' ').trim().slice(0, max);
}
function fractionText(text) {
  return text.replace(/(\d)([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, '$1 $2').replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, char => FRACTIONS[char]).replace(/⁄/g, '/');
}
export function sourceNumber(value, maximum = 100000) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 && value <= maximum ? value : null;
  const text = fractionText(String(value || '')).trim().replace(',', '.');
  if (/^\d+(?:\.\d+)?$/.test(text)) return sourceNumber(Number(text), maximum);
  const mixed = text.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (!mixed || Number(mixed[3]) === 0) return null;
  return sourceNumber(Number(mixed[1] || 0) + Number(mixed[2]) / Number(mixed[3]), maximum);
}
function unitDetails(raw) {
  const unit = raw.toLowerCase().replace(/\s+/g, ' ');
  if (/^(kg|kgs|kilogram)/.test(unit)) return { unit: 'g', factor: 1000 };
  if (/^(g|grams?)$/.test(unit)) return { unit: 'g', factor: 1 };
  if (/^(mls?|millilit)/.test(unit)) return { unit: 'ml', factor: 1 };
  if (/^(l|litre|liter)/.test(unit)) return { unit: 'ml', factor: 1000 };
  if (/^(tbsp|tbs|tablespoon)/.test(unit)) return { unit: 'tbsp', factor: 1 };
  if (/^(tsp|teaspoon)/.test(unit)) return { unit: 'tsp', factor: 1 };
  if (/^(oz|ounce)/.test(unit)) return { unit: 'g', factor: 28.349523125 };
  if (/^(lb|pound)/.test(unit)) return { unit: 'g', factor: 453.59237 };
  // A cup/tin has no universal weight. Preserve the publisher's unit until the
  // user or a labelled ingredient-specific cooking conversion supplies one.
  if (/^cup/.test(unit)) return { unit: 'cups', factor: 1 };
  if (/^slice/.test(unit)) return { unit: 'slices', factor: 1 };
  if (/^clove/.test(unit)) return { unit: 'cloves', factor: 1 };
  if (/^(each|piece)/.test(unit)) return { unit: 'pieces', factor: 1 };
  if (/^(tin|can)/.test(unit)) return { unit: 'tins', factor: 1 };
  if (/^pack/.test(unit)) return { unit: 'packs', factor: 1 };
  if (/^pinch/.test(unit)) return { unit: 'pinches', factor: 1 };
  return { unit, factor: 1 };
}
export function parseIngredientLine(raw) {
  const original = cleanRecipeText(raw, 500).replace(/^\s*[-•*]\s*/, '');
  let text = fractionText(original);
  // Publishers often give equivalent metric/imperial amounts. Use the first
  // declared amount, rather than treating the second measure as an ingredient.
  text = text.replace(new RegExp(`^(${NUMBER}\\s*${UNITS})\\s*\\/\\s*${NUMBER}\\s*${UNITS}\\s+`, 'i'), '$1 ');
  let name = original, quantity = null, unit = 'unknown', notes = '';
  // Retain ambiguous ranges verbatim instead of undercounting the shopping list.
  if (new RegExp(`^${NUMBER}\\s*(?:[-–]|to)\\s*${NUMBER}`, 'i').test(text)) {
    const match = text.match(new RegExp(`^${NUMBER}\\s*(?:[-–]|to)\\s*${NUMBER}\\s*(${UNITS})?\\s*(.*)$`, 'i'));
    name = match?.[2] || original; notes = `Quantity range in source: ${original}`;
  } else {
    text = text.replace(new RegExp(`^(${NUMBER})\\s*\\((${NUMBER})\\s*(${UNITS})\\)\\s*(?:tins?|cans?|packs?|packets?)\\s*(?:of\\s+)?(.+)$`, 'i'), '$1 x $2 $3 $4');
    const multipack = text.match(new RegExp(`^(${NUMBER})\\s*[x×]\\s*(${NUMBER})\\s*(${UNITS})\\s+(?:tins?|cans?|packs?|packets?)?\\s*(?:of\\s+)?(.+)$`, 'i'));
    const measured = text.match(new RegExp(`^(${NUMBER})\\s*(${UNITS})\\b\\s*(?:of\\s+)?(.+)$`, 'i'));
    const counted = text.match(new RegExp(`^(${NUMBER})\\s+(.+)$`, 'i'));
    if (multipack) {
      const detail = unitDetails(multipack[3]);
      const count = sourceNumber(multipack[1]), size = sourceNumber(multipack[2]);
      quantity = count === null || size === null ? null : count * size * detail.factor;
      unit = detail.unit; name = multipack[4]; notes = original;
    } else if (measured) {
      const detail = unitDetails(measured[2]);
      quantity = sourceNumber(measured[1]);
      if (quantity !== null) quantity *= detail.factor;
      unit = detail.unit; name = measured[3];
      if (detail.factor !== 1) notes = `Source amount: ${original}`;
    } else if (counted) {
      quantity = sourceNumber(counted[1]); unit = 'pieces'; name = counted[2];
    } else if (/^(?:a\s+)?(?:handful|splash|drizzle|pinch|some)\b/i.test(text)) {
      name = text.replace(/^(?:a\s+)?(?:handful|splash|drizzle|pinch|some)\s*(?:of\s+)?/i, '') || original;
      notes = `Unspecified amount in source: ${original}`;
    } else notes = `Source: ${original}`;
  }
  const parentheses = [...name.matchAll(/\([^)]*\)/g)].map(match => match[0].slice(1, -1));
  if (parentheses.length) { notes = [notes, ...parentheses].filter(Boolean).join('; '); name = name.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim(); }
  const preparation = name.match(/,\s*(.+)$/);
  if (preparation) { notes = [notes, preparation[1]].filter(Boolean).join('; '); name = name.slice(0, preparation.index); }
  const size = name.match(/^(small|medium|large)\s+(.+)/i);
  if (size) { notes = [notes, size[1]].filter(Boolean).join('; '); name = size[2]; }
  const trailingPrep = name.match(/\s+(?:washed|peeled|finely|coarsely|roughly|grated|chopped|diced|sliced|crushed|minced|rinsed|drained|beaten|boneless|skinless|to\s+serve|for\s+serving)\b.*$/i);
  if (trailingPrep) { notes = [notes, trailingPrep[0].trim()].filter(Boolean).join('; '); name = name.slice(0, trailingPrep.index); }
  const temperature = name.match(/^(hot|warm|cold|cooled)\s+(.+)/i);
  if (temperature) { notes = [notes, temperature[1]].filter(Boolean).join('; '); name = temperature[2]; }
  if (/\bplus\s+(?:extra|more)|\band\s+extra\b/i.test(`${name} ${notes}`)) {
    notes = `Declared amount plus unspecified extra: ${original}`;
    quantity = null;
  }
  name = name.replace(/^(?:tins?|cans?|packets?|packs?)\s+(?:of\s+)?/i, '').replace(/\s+/g, ' ').trim();
  if (!name) name = original;
  quantity = sourceNumber(quantity);
  return { name: name.slice(0, 140), quantity, unit, notes: notes.slice(0, 300) };
}

export function findRecipeSchema(html) {
  const $ = cheerio.load(String(html || ''));
  const found = []; let visited = 0;
  function walk(node, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 24 || ++visited > 20000) return;
    if (Array.isArray(node)) { for (const item of node) walk(item, depth + 1); return; }
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    if (types.some(type => /^(?:https?:\/\/schema\.org\/)?recipe$/i.test(String(type || '')))) found.push(node);
    for (const [key, value] of Object.entries(node)) if (!['recipeIngredient', 'recipeInstructions'].includes(key)) walk(value, depth + 1);
  }
  $('script[type="application/ld+json"]').each((_i, node) => {
    try { walk(JSON.parse($(node).text().replace(/^\s*<!--|-->\s*$/g, '').trim())); } catch { /* The page may contain unrelated malformed data. */ }
  });
  return found.find(recipe => Array.isArray(recipe.recipeIngredient) && recipe.recipeIngredient.length) || found[0] || null;
}
function sourceYield(value) {
  for (const entry of (Array.isArray(value) ? value : [value])) {
    if (typeof entry === 'number') { const number = sourceNumber(entry, 1000); if (number > 0) return number; }
    const text = cleanRecipeText(entry, 100);
    if (/\d\s*[-–]\s*\d/.test(text)) continue;
    const match = text.match(/^(?:(?:serves?|makes?|yield:?|servings?:?)\s*)?(\d+(?:\.\d+)?)\b/i);
    if (match) { const number = sourceNumber(match[1], 1000); if (number > 0) return number; }
  }
  return null;
}
export function parseDuration(value) {
  const text = String(value || '');
  const iso = text.match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (iso && iso.slice(1).some(Boolean)) return sourceNumber(Number(iso[1] || 0) * 1440 + Number(iso[2] || 0) * 60 + Number(iso[3] || 0) + Number(iso[4] || 0) / 60, 1440);
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const mins = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/i);
  return hours || mins ? sourceNumber(Number(hours?.[1] || 0) * 60 + Number(mins?.[1] || 0), 1440) : null;
}
function schemaInstructions(value) {
  if (typeof value === 'string') return cleanRecipeText(value, 12000).split(/\n+/).map(line => line.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.flatMap(schemaInstructions);
  if (value && typeof value === 'object') return value.itemListElement ? schemaInstructions(value.itemListElement) : schemaInstructions(value.text || value.name || '');
  return [];
}
function sourceNutrient(value, units, maximum) {
  const text = cleanRecipeText(value, 100).replace(',', '.');
  const match = text.match(new RegExp(`^([0-9]+(?:\\.[0-9]+)?)\\s*(?:${units})?$`, 'i'));
  return match ? sourceNumber(match[1], maximum) : null;
}
export function includeMissingCookingIngredients(recipe) {
  const ingredients = [...(recipe.ingredients || [])], warnings = [...(recipe.warnings || [])];
  const pattern = /\b(?:olive oil|rapeseed oil|sunflower oil|vegetable oil|cooking oil|oil|butter|ghee|cream(?!\s+cheese)|sugar|soy sauce|barbecue sauce|bbq sauce|hoisin sauce|oyster sauce|sweet chilli sauce|sweet chili sauce|mayonnaise)\b/gi;
  for (const step of (recipe.steps || [])) {
    const text = String(step);
    for (const match of text.matchAll(pattern)) {
      const before = text.slice(Math.max(0, match.index - 35), match.index);
      const after = text.slice(match.index + match[0].length, match.index + match[0].length + 15);
      if (match[0].toLowerCase() === 'butter' && (/^\s+beans?\b/i.test(after) || /\b(?:peanut|almond|nut)\s+$/i.test(before))) continue;
      if (/\b(?:no|without|avoid|omit|skip|instead of|do not (?:add|use)|don't (?:add|use))\s+(?:any\s+|added\s+|extra\s+)?$/i.test(before) || /^[- ]free\b/i.test(after)) continue;
      const name = match[0].toLowerCase();
      const family = /oil$/.test(name) ? 'oil' : name;
      const present = ingredients.some(ingredient => {
        const ingredientName = String(ingredient.name || '').toLowerCase();
        if (family === 'butter' && /\b(?:beans?|peanut|nut)\b/.test(ingredientName)) return false;
        if (family === 'cream' && /\bcheese\b/.test(ingredientName)) return false;
        return new RegExp(`\\b${family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(ingredientName);
      });
      if (!present) {
        ingredients.push({ name, quantity: null, unit: 'unknown', notes: 'Mentioned in the cooking instructions, but no ingredient amount was supplied.' });
        warnings.push(`${name[0].toUpperCase() + name.slice(1)} is mentioned in the cooking instructions without an ingredient amount. Complete it before relying on a full nutrition or shopping total.`);
      }
    }
  }
  return { ...recipe, ingredients: ingredients.slice(0, 80), warnings: [...new Set(warnings)].slice(0, 18) };
}
function normalizeRecipe(sourceRecipe) {
  const recipe = includeMissingCookingIngredients(sourceRecipe);
  const warnings = [...(recipe.warnings || [])];
  if (!recipe.servings) warnings.push('Servings were not specified. Confirm the recipe yield before adding it to a plan.');
  if (recipe.ingredients.some(ingredient => ingredient.quantity === null)) warnings.push('Some ingredient amounts were not specified, including any oil or seasoning listed without an amount. Complete them before using a full nutrition or shopping total.');
  if (!recipe.steps.length) warnings.push('Cooking instructions were not present in the source.');
  if (recipe.caloriesPerServing === null || recipe.proteinGramsPerServing === null) warnings.push('Nutrition per serving was not supplied. Any nutrition the app calculates from ingredients is an estimate; unknown amounts must be completed first.');
  if (!recipe.category) { recipe.category = 'Dinner'; warnings.push('Meal category was not supplied; Dinner is selected for review.'); }
  return { ...recipe, warnings: [...new Set(warnings)].slice(0, 18), confidence: recipe.ingredients.every(ingredient => ingredient.quantity !== null) && recipe.steps.length && recipe.servings ? 'high' : 'medium', estimatedCostPerServing: null };
}
export function recipeFromSchema(schema) {
  if (!schema || !Array.isArray(schema.recipeIngredient) || !schema.recipeIngredient.length) return null;
  const ingredients = schema.recipeIngredient.slice(0, 80).map(parseIngredientLine).filter(ingredient => ingredient.name);
  const nutrition = schema.nutrition || {};
  const nutritionSize = cleanRecipeText(nutrition.servingSize, 160);
  const unsupportedBasis = /\b(?:100\s*(?:g|ml)|per\s*100|whole|entire|recipe|total)\b/i.test(nutritionSize);
  const categoryText = (Array.isArray(schema.recipeCategory) ? schema.recipeCategory.join(' ') : String(schema.recipeCategory || ''));
  const category = /breakfast/i.test(categoryText) ? 'Breakfast' : /lunch/i.test(categoryText) ? 'Lunch' : /snack/i.test(categoryText) ? 'Snack' : /dinner|main/i.test(categoryText) ? 'Dinner' : '';
  return normalizeRecipe({
    name: cleanRecipeText(schema.name, 150) || 'Imported recipe', category, servings: sourceYield(schema.recipeYield),
    prepMinutes: parseDuration(schema.prepTime), cookMinutes: parseDuration(schema.cookTime), totalMinutes: parseDuration(schema.totalTime),
    caloriesPerServing: unsupportedBasis ? null : sourceNutrient(nutrition.calories, '(?:kcal|calories?)', 10000),
    proteinGramsPerServing: unsupportedBasis ? null : sourceNutrient(nutrition.proteinContent, '(?:g|grams?)(?:\\s+(?:of\\s+)?protein)?', 1000),
    nutritionBasis: unsupportedBasis ? 'unknown' : 'publisher-per-serving',
    ingredients, steps: schemaInstructions(schema.recipeInstructions).slice(0, 50).map(step => step.slice(0, 1000)),
    warnings: unsupportedBasis ? ['Publisher nutrition was given per 100 g/ml or for the whole recipe, so it was not treated as nutrition per serving.'] : []
  });
}

export function recipeFromPastedText(raw, { title = '' } = {}) {
  const text = cleanRecipeText(raw).replace(/\r/g, '');
  if (!text) return null;
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);
  let name = title, servings = null, prepMinutes = null, cookMinutes = null, totalMinutes = null, category = '', mode = '', sawIngredients = false;
  const ingredientLines = [], steps = [], warnings = [];
  let caloriesPerServing = null, proteinGramsPerServing = null;
  const perServingNutrition = /(?:nutrition|calories|kcal|protein)[^\n]*per\s+serving|per\s+serving[^\n]*(?:nutrition|calories|kcal|protein)/i.test(text);
  const unsafeNutritionBasis = /(?:nutrition|calories|kcal|protein)[^\n]*(?:per\s*100|whole\s+recipe|total\s+recipe)/i.test(text);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    let match;
    if (/^(?:ingredients?|you(?:'ll| will) need)\s*:?\s*$/i.test(line)) { mode = 'ingredients'; sawIngredients = true; continue; }
    if (/^(?:method|instructions?|directions?|steps?|preparation)\s*:?\s*$/i.test(line)) { mode = 'steps'; continue; }
    if (/^(?:nutrition|nutritional information)\b/i.test(line)) { mode = 'nutrition'; }
    if ((match = line.match(/^(?:serves?|servings?|makes?|yield)\s*:?\s*(.+)$/i))) { servings = sourceYield(match[1]); continue; }
    if ((match = line.match(/^(?:prep(?:aration)?(?: time)?)\s*:?\s*(.+)$/i))) { prepMinutes = parseDuration(match[1]); continue; }
    if ((match = line.match(/^(?:cook(?:ing)?(?: time)?)\s*:?\s*(.+)$/i))) { cookMinutes = parseDuration(match[1]); continue; }
    if ((match = line.match(/^(?:total time)\s*:?\s*(.+)$/i))) { totalMinutes = parseDuration(match[1]); continue; }
    if ((match = line.match(/^(?:category|meal)\s*:\s*(breakfast|lunch|dinner|snack)\b/i))) { category = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase(); continue; }
    if (mode === 'nutrition' || /\b(?:kcal|calories|protein)\b/i.test(line) && /^\s*(?:nutrition|per serving|calories|kcal|protein|\d+\s*(?:kcal|calories))\b/i.test(line)) {
      if (perServingNutrition && !unsafeNutritionBasis) {
        const kcal = line.match(/(?:calories\s*:?\s*(\d+(?:\.\d+)?)|\b(\d+(?:\.\d+)?)\s*(?:kcal|calories)\b)/i);
        const protein = line.match(/(?:protein\s*:?\s*(\d+(?:\.\d+)?)\s*g?\b|\b(\d+(?:\.\d+)?)\s*g\s*protein)/i);
        if (kcal) caloriesPerServing = sourceNumber(kcal[1] || kcal[2], 10000);
        if (protein) proteinGramsPerServing = sourceNumber(protein[1] || protein[2], 1000);
      }
      continue;
    }
    if (mode === 'ingredients') { ingredientLines.push(line); continue; }
    if (mode === 'steps') { steps.push(line.replace(/^\s*\d+[.)]\s*/, '')); continue; }
    if (!name && index === 0 && !new RegExp(`^${NUMBER}\\s*${UNITS}\\b`, 'i').test(fractionText(line))) { name = line; continue; }
    // Captions without section headings can still have clear measured ingredients
    // followed by numbered instructions. Ordinary prose is not an ingredient list.
    if (new RegExp(`^${NUMBER}\\s*${UNITS}\\b`, 'i').test(fractionText(line))) ingredientLines.push(line);
    else if (/^\d+[.)]\s+/.test(line)) { mode = 'steps'; steps.push(line.replace(/^\d+[.)]\s*/, '')); }
  }
  if (!ingredientLines.length || !sawIngredients && !steps.length) return null;
  const ingredients = ingredientLines.slice(0, 80).map(parseIngredientLine).filter(ingredient => ingredient.name);
  if (!ingredients.some(ingredient => ingredient.quantity !== null)) return null;
  if (unsafeNutritionBasis) warnings.push('Nutrition not explicitly provided per serving was kept unknown.');
  return normalizeRecipe({ name: name.slice(0, 150) || 'Imported recipe', category, servings, prepMinutes, cookMinutes, totalMinutes, caloriesPerServing, proteinGramsPerServing, nutritionBasis: perServingNutrition && !unsafeNutritionBasis ? 'source-per-serving' : 'unknown', ingredients, steps: steps.slice(0, 50).map(step => step.slice(0, 1000)), warnings });
}
