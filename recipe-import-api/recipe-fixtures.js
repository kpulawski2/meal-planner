import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the shipped recipe library and its own ingredient nutrition engine.
// The bounded VM contains pure calculation source, without the browser or API.
export async function readRecipeLibrary() {
  const [html, core, affordable] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/budget-core.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/affordable-recipes.js', import.meta.url), 'utf8'),
  ]);
  const match = html.match(/const builtInRecipes\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!match) throw new Error('The shipped built-in recipe library could not be read.');
  const nutrition = html.slice(html.indexOf('const NUTRITION_PROFILES='), html.indexOf('function nutritionSourceLabel'));
  const context = {};
  vm.runInNewContext(`${core}\n${affordable}\nfunction canonicalIngredientName(name){return MealBudgetCore.canonicalIngredientName(name)};const library=${match[1]}.concat(AFFORDABLE_RECIPES);${nutrition};globalThis.rows=library.map(recipe=>({...recipe,nutrition:recipeNutrition(recipe)}));`, context, { timeout: 2000 });
  return JSON.parse(JSON.stringify(context.rows));
}
