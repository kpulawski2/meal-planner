import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the shipped recipe library and its own ingredient nutrition engine.
// The bounded VM contains pure calculation source, without the browser or API.
export async function readRecipeLibrary({ includeWeb = false, includeCollections = true } = {}) {
  const [html, core, affordable, creami, world, web] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/budget-core.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/affordable-recipes.js', import.meta.url), 'utf8'),
    includeCollections ? readFile(new URL('../public/creami-recipes.js', import.meta.url), 'utf8') : '',
    includeCollections ? readFile(new URL('../public/world-recipes.js', import.meta.url), 'utf8') : '',
    includeWeb ? readFile(new URL('../data/recipe-library.json', import.meta.url), 'utf8') : null,
  ]);
  const match = html.match(/const builtInRecipes\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!match) throw new Error('The shipped built-in recipe library could not be read.');
  const nutrition = html.slice(html.indexOf('const NUTRITION_PROFILES='), html.indexOf('function nutritionSourceLabel'));
  const context = { sourceRows: web ? JSON.parse(web).recipes : [] };
  vm.runInNewContext(`${core}\n${affordable}\n${creami}\n${world}\nfunction canonicalIngredientName(name){return MealBudgetCore.canonicalIngredientName(name)};const library=${match[1]}.concat(AFFORDABLE_RECIPES,globalThis.CREAMI_RECIPES||[],globalThis.WORLD_RECIPES||[],sourceRows);${nutrition};globalThis.rows=library.map(recipe=>({...recipe,servings:recipe.servings===undefined?1:recipe.servings,nutrition:recipeNutrition(recipe)}));`, context, { timeout: 5000 });
  return JSON.parse(JSON.stringify(context.rows));
}
