import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RECIPE_LIBRARY_SOURCE, normalizeLibraryRecipe, validateRecipeLibrary } from './recipe-library.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROVIDER = 'https://recipecontextprotocol.com';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export function retryDelay(response, attempt) {
  const header = response?.headers?.get('retry-after');
  const seconds = header && /^\d+$/.test(header) ? Number(header) : header ? Math.max(0, (Date.parse(header) - Date.now()) / 1000) : null;
  return Math.min(60000, Math.max(1000 * 2 ** attempt, Number.isFinite(seconds) ? seconds * 1000 : 0));
}

export async function refreshRecipeLibrary({ outputDir = path.join(ROOT, 'data'), cacheDir = path.join(tmpdir(), 'meal-planner-recipe-cache'), fetchFn = fetch, log = console.log, intervalMs = 260 } = {}) {
  await mkdir(outputDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });
  let nextRequestAt = 0, serial = Promise.resolve();
  async function rateLimit() {
    const scheduled = serial.then(async () => {
      await pause(Math.max(0, nextRequestAt - Date.now()));
      nextRequestAt = Date.now() + intervalMs;
    });
    serial = scheduled.catch(() => {});
    await scheduled;
  }
  async function getJson(url, cacheName) {
    const checked = new URL(url);
    if (checked.origin !== PROVIDER || !checked.pathname.startsWith('/recipes')) throw new Error('Unexpected recipe provider URL.');
    const cachePath = path.join(cacheDir, `${cacheName}.json`);
    let cached = null;
    try { cached = JSON.parse(await readFile(cachePath, 'utf8')); } catch { /* First refresh or invalidated cache. */ }
    // A recent successful detail remains useful when restarting a long refresh.
    // No cache substitutes for a failed current request after the freshness window.
    if (cached?.fetchedAt && Date.now() - Date.parse(cached.fetchedAt) < 60 * 60 * 1000 && cached.body) return cached.body;
    for (let attempt = 0; attempt < 5; attempt++) {
      await rateLimit();
      let response;
      try {
        response = await fetchFn(checked.href, { headers: { Accept: 'application/json', 'User-Agent': 'meal-planner-open-recipe-refresh/1.0 (+https://github.com/kpulawski2/meal-planner)', ...(cached?.etag ? { 'If-None-Match': cached.etag } : {}) }, signal: AbortSignal.timeout(30000), redirect: 'error' });
        if (response.status === 304 && cached?.body) {
          cached.fetchedAt = new Date().toISOString();
          await writeFile(cachePath, JSON.stringify(cached));
          return cached.body;
        }
        if (!response.ok) {
          if (![408, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt === 4) throw new Error(`Recipe provider returned HTTP ${response.status}.`);
          await pause(retryDelay(response, attempt));
          continue;
        }
        const bodyText = await response.text();
        if (bodyText.length > 4000000) throw new Error('Recipe provider response exceeds the resource limit.');
        const body = JSON.parse(bodyText);
        await writeFile(cachePath, JSON.stringify({ etag: response.headers.get('etag'), fetchedAt: new Date().toISOString(), body }));
        return body;
      } catch (error) {
        if (attempt === 4 || /HTTP 4(?:00|01|03|04)|resource limit|Unexpected/.test(error.message)) throw error;
        await pause(retryDelay(response, attempt));
      }
    }
    throw new Error('Recipe request exhausted its retries.');
  }
  const fetchedAt = new Date().toISOString(), slugs = new Map(), pageUrls = new Set();
  let nextUrl = RECIPE_LIBRARY_SOURCE.indexUrl, expectedTotal = null;
  while (nextUrl) {
    if (pageUrls.has(nextUrl) || pageUrls.size > 1000) throw new Error('Recipe index pagination loop detected.');
    pageUrls.add(nextUrl);
    const data = await getJson(nextUrl, `index-${pageUrls.size}`);
    if (!Number.isInteger(data.total) || data.total <= 0 || !Array.isArray(data.items)) throw new Error('Recipe index returned an invalid catalogue.');
    if (expectedTotal !== null && expectedTotal !== data.total) throw new Error('Recipe source changed size during pagination. Retry with a stable index.');
    expectedTotal = data.total;
    for (const item of data.items) {
      if (!item || item.source_name !== 'wikibooks' || typeof item.slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,220}$/.test(item.slug)) throw new Error('Recipe index returned an invalid source entry.');
      slugs.set(item.slug, item);
    }
    nextUrl = data.next_url || null;
  }
  if (slugs.size !== expectedTotal) throw new Error(`Recipe index is incomplete: ${slugs.size} of ${expectedTotal} source entries.`);
  log(`Discovered ${slugs.size} Wikibooks recipes across ${pageUrls.size} pages.`);
  const entries = [...slugs.keys()], recipes = [], failures = [];
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const slug = entries[cursor++];
      try {
        const raw = await getJson(`${PROVIDER}/recipes/${slug}`, `detail-${slug}`);
        recipes.push(normalizeLibraryRecipe(raw, fetchedAt));
      } catch (error) { failures.push({ slug, reason: error.message }); }
      const completed = recipes.length + failures.length;
      if (completed % 100 === 0 || completed === entries.length) log(`Read ${completed}/${entries.length}; ${recipes.length} validated, ${failures.length} rejected.`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  recipes.sort((a, b) => a.id.localeCompare(b.id));
  const candidate = {
    schemaVersion: 1, status: 'complete', generatedAt: new Date().toISOString(),
    source: RECIPE_LIBRARY_SOURCE,
    license: 'CC BY-SA 4.0', licenseUrl: RECIPE_LIBRARY_SOURCE.licenseUrl,
    attribution: 'Wikibooks contributors; compiled through Recipe Context Protocol. Individual source pages and author histories accompany every recipe.',
    coverage: { discovered: expectedTotal, indexed: slugs.size, validated: recipes.length, rejected: failures.length, pages: pageUrls.size, failures },
    recipes,
  };
  const outputPath = path.join(outputDir, 'recipe-library.json');
  let previous = null;
  try { previous = JSON.parse(await readFile(outputPath, 'utf8')); } catch { /* Initial population. */ }
  const validation = validateRecipeLibrary(candidate, previous);
  if (!validation.valid) throw new Error(`Recipe refresh rejected; the existing library was kept. ${validation.reasons.join(' ')}`);
  const metadata = {
    ...candidate, recipes: undefined,
    counts: { total: recipes.length, withSourceYield: recipes.filter(row => row.servings !== null).length, withSourceTime: recipes.filter(row => row.cookTime !== null).length, fullyQuantified: recipes.filter(row => row.ings.every(ing => ing[1] !== null && ing[1] > 0)).length, needingReview: recipes.filter(row => row.needsReview).length },
    nutrition: 'No publisher nutrition is supplied by this source. Ingredient nutrition calculated by the app must be labelled as estimated, and unknown amounts or yields must be resolved first.',
    refreshPolicy: 'All provider pages and details; 260ms minimum request spacing, four concurrent workers, five attempts with Retry-After, cache validators, exact index coverage, at least98% validated and no more than5% shrinkage from a healthy snapshot. Rejected refreshes never overwrite it.',
  };
  await writeFile(`${outputPath}.tmp`, `${JSON.stringify(candidate)}\n`);
  await rename(`${outputPath}.tmp`, outputPath);
  await writeFile(path.join(outputDir, 'recipe-library-meta.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  log(`Published ${recipes.length} recipes. ${metadata.counts.withSourceYield} have source yields; ${metadata.counts.fullyQuantified} have quantified ingredients.`);
  return { candidate, metadata };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const argumentsList = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < argumentsList.length; i++) {
    if (argumentsList[i] === '--cache-dir') options.cacheDir = path.resolve(argumentsList[++i]);
    else if (argumentsList[i] === '--output-dir') options.outputDir = path.resolve(argumentsList[++i]);
    else throw new Error(`Unknown argument ${argumentsList[i]}.`);
  }
  refreshRecipeLibrary(options).catch(error => { console.error(error.message); process.exitCode = 1; });
}
