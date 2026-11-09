import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Use the shipped calculator for composite-meal and quantity integration checks.
export async function readRecipeNutrition() {
  const paths=['../public/index.html','../public/budget-core.js','../public/regional-recipes.js','../public/creator-nutrition.js'];
  const [html,core,regional,creator]=await Promise.all(paths.map(path=>readFile(new URL(path,import.meta.url),'utf8')));
  const source=html.slice(html.indexOf('const NUTRITION_PROFILES='),html.indexOf('function nutritionSourceLabel'));
  const context={};vm.runInNewContext(`${core}\n${regional}\n${creator}\nfunction canonicalIngredientName(name){return MealBudgetCore.canonicalIngredientName(name)};${source};globalThis.calculate=recipeNutrition;`,context,{timeout:5000});
  return recipe=>JSON.parse(JSON.stringify(context.calculate(recipe)));
}

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
  const [lighter,everyday,social,tailored,regional,fakeaway]=await Promise.all([readFile(new URL('../public/lighter-recipes.js',import.meta.url),'utf8'),readFile(new URL('../public/everyday-recipes.js',import.meta.url),'utf8'),includeCollections?readFile(new URL('../public/social-recipes.js',import.meta.url),'utf8'):'',includeCollections?readFile(new URL('../public/tailored-recipes.js',import.meta.url),'utf8'):'',includeCollections?readFile(new URL('../public/regional-recipes.js',import.meta.url),'utf8'):'',includeCollections?readFile(new URL('../public/fakeaway-recipes.js',import.meta.url),'utf8'):'']);
  const viral=includeCollections?await readFile(new URL('../public/viral-recipes.js',import.meta.url),'utf8'):'';
  const creator=includeCollections?await readFile(new URL('../public/creator-recipes.js',import.meta.url),'utf8'):'';
  const creatorNutrition=includeCollections?await readFile(new URL('../public/creator-nutrition.js',import.meta.url),'utf8'):'';
  const methodDetails=await readFile(new URL('../public/recipe-method-details.js',import.meta.url),'utf8');
  const context = { sourceRows: web ? JSON.parse(web).recipes : [] };
  vm.runInNewContext(`${methodDetails}\n${core}\n${affordable}\n${creami}\n${world}\n${lighter}\n${everyday}\n${social}\n${tailored}\n${regional}\n${fakeaway}\n${viral}\n${creator}\n${creatorNutrition}\nfunction canonicalIngredientName(name){return MealBudgetCore.canonicalIngredientName(name)};const library=${match[1]}.concat(AFFORDABLE_RECIPES,globalThis.CREAMI_RECIPES||[],globalThis.WORLD_RECIPES||[],globalThis.LIGHTER_RECIPES||[],globalThis.EVERYDAY_RECIPES||[],globalThis.SOCIAL_RECIPES||[],globalThis.TAILORED_RECIPES||[],globalThis.REGIONAL_RECIPES||[],globalThis.FAKEAWAY_RECIPES||[],globalThis.VIRAL_RECIPES||[],globalThis.CREATOR_RECIPES||[],globalThis.MEAL_EXTRAS_RECIPES||[],sourceRows);${nutrition};globalThis.rows=library.map(recipe=>({...recipe,method:RecipeMethodDetails.steps(recipe)??recipe.method,servings:recipe.servings===undefined?1:recipe.servings,nutrition:recipeNutrition(recipe)}));`, context, { timeout: 5000 });
  return JSON.parse(JSON.stringify(context.rows));
}
