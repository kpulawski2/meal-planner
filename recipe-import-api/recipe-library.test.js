import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { RECIPE_LIBRARY_SOURCE, classifyRecipe, normalizeLibraryIngredient, normalizeLibraryRecipe, validateRecipeLibrary } from './recipe-library.js';
import { refreshRecipeLibrary, retryDelay } from './refresh-recipe-library.js';

function sourceRecipe(slug = 'test-bean-soup', overrides = {}) {
  return {
    slug, title: 'Bean Soup', source_name: 'wikibooks',
    source_url: `https://en.wikibooks.org/wiki/Cookbook:${slug}`,
    authors_url: `https://en.wikibooks.org/w/index.php?title=Cookbook:${slug}&action=history`,
    source_ref: '1234', license: 'CC BY-SA 4.0', license_url: RECIPE_LIBRARY_SOURCE.licenseUrl,
    ingredients_raw: ['300 g beans', '1 tbsp olive oil', '250 ml water'],
    steps: ['Warm the oil, add the beans and water, and simmer until hot.'],
    servings: 2, total_time_minutes: 15, categories: ['Soup recipes', 'Vegan recipes'],
    ...overrides,
  };
}
function library(rows) {
  return { schemaVersion: 1, status: 'complete', coverage: { discovered: rows.length }, recipes: rows };
}

test('licensed recipe keeps source batch quantities, yield, authors and revision', () => {
  const row = normalizeLibraryRecipe(sourceRecipe(), '2026-10-10T00:00:00.000Z');
  assert.deepEqual(row.ings, [['beans', 300, 'g'], ['olive oil', 1, 'tbsp'], ['water', 250, 'ml']]);
  assert.equal(row.servings, 2);
  assert.equal(row.cookTime, 15);
  assert.equal(row.cat, 'Lunch');
  assert.equal(row.needsReview, false);
  assert.equal(row.sourceRevision, '1234');
  assert.equal(row.sourceRetrievedAt, '2026-10-10T00:00:00.000Z');
  assert.ok(row.authorsUrl.includes('action=history'));
  assert.ok(row.attribution.includes('Wikibooks contributors'));
  assert.equal(row.kcal, null);
  assert.equal(row.p, null);
  assert.equal(row.cost, null);
  assert.equal(row.sourceNutrition, null);
});

test('missing yield, measures and cooking fat remain review requirements, never guessed', () => {
  const row = normalizeLibraryRecipe(sourceRecipe('unknown-soup', {
    servings: null, total_time_minutes: null,
    ingredients_raw: ['1 cup rice', 'some beans'],
    steps: ['Fry the beans in olive oil, then add the rice.'],
  }));
  assert.equal(row.servings, null);
  assert.equal(row.cookTime, null);
  assert.deepEqual(row.ings[0], ['rice', 1, 'cups']);
  assert.equal(row.ings[1][1], null);
  assert.ok(row.ings.some(ing => ing[0] === 'olive oil' && ing[1] === null));
  assert.ok(row.reviewReasons.some(reason => /yield/.test(reason)));
  assert.ok(row.reviewReasons.some(reason => /conversions/.test(reason)));
  assert.equal(row.needsReview, true);
});

test('explicit numeric source yield strings are accepted but ranges and labels stay unknown', () => {
  assert.equal(normalizeLibraryRecipe(sourceRecipe('four', { servings: '4' })).servings, 4);
  assert.equal(normalizeLibraryRecipe(sourceRecipe('range', { servings: '8–10' })).servings, null);
  assert.equal(normalizeLibraryRecipe(sourceRecipe('labelled', { servings: 'one loaf' })).servings, null);
  assert.equal(normalizeLibraryRecipe(sourceRecipe('range', { servings: '8–10' })).servingsText, '8–10');
  assert.equal(normalizeLibraryRecipe(sourceRecipe('no-cook', { total_time_minutes: 0 })).cookTime, 0);
});

test('ranged ingredient counts preserve the name instead of consuming the l in large as litres', () => {
  const ingredient = normalizeLibraryIngredient('2–3 large onions');
  assert.equal(ingredient.name, 'onions');
  assert.equal(ingredient.quantity, null);
  assert.match(ingredient.notes, /Quantity range/);
  assert.equal(normalizeLibraryIngredient('1–2 grams garlic').name, 'garlic');
});

test('publisher metric equivalents are retained without inventing generic cup weights', () => {
  assert.deepEqual(normalizeLibraryIngredient('2 cups (450 g / 16 oz) white granulated sugar').quantity, 450);
  const milk = normalizeLibraryIngredient('1 cup (240 ml / 8.1 oz) milk');
  assert.equal(milk.quantity, 240);
  assert.equal(milk.unit, 'ml');
  assert.equal(milk.name, 'milk');
  assert.ok(milk.notes.includes('Metric equivalent stated in source'));
  const ambiguous = normalizeLibraryIngredient('1 cup plain flour');
  assert.equal(ambiguous.quantity, 1);
  assert.equal(ambiguous.unit, 'cups');
  assert.equal(normalizeLibraryIngredient('1–2 cups (450 g) sugar').quantity, null);
});

test('preparation prefixes do not remove the actual ingredient or invent package weights', () => {
  assert.equal(normalizeLibraryIngredient('3 tbsp finely chopped onion').name, 'onion');
  assert.equal(normalizeLibraryIngredient('4 ea., duck breasts').name, 'duck breasts');
  assert.equal(normalizeLibraryIngredient('1 stick butter').quantity, null);
  assert.equal(normalizeLibraryIngredient('1 bag M&Ms').quantity, null);
  assert.equal(normalizeLibraryIngredient('1 pinch of salt').quantity, null);
  assert.equal(normalizeLibraryIngredient('250 g cooked rice').name, 'cooked rice');
});

test('unsupported licences, nonprimary provenance, bad slugs and empty recipes are rejected', () => {
  for (const overrides of [
    { source_name: 'gutenberg' }, { license: 'all rights reserved' },
    { source_url: 'https://example.com/a' }, { authors_url: 'https://example.com/a' },
    { slug: '../private' }, { ingredients_raw: [] }, { steps: [] },
  ]) assert.throws(() => normalizeLibraryRecipe(sourceRecipe('test', overrides)));
});

test('source categories distinguish meals, breakfast and dessert', () => {
  assert.equal(classifyRecipe(['Breakfast recipes'], 'Oats'), 'Breakfast');
  assert.equal(classifyRecipe(['Dessert recipes'], 'Rice pudding'), 'Snack');
  assert.equal(classifyRecipe(['Salad recipes'], 'Tomato salad'), 'Lunch');
  assert.equal(classifyRecipe(['Main dishes'], 'Bean stew'), 'Dinner');
  assert.equal(classifyRecipe(['Main dishes', 'Recipes using sweet potato'], 'Sweet potato curry'), 'Dinner');
});

test('coverage, duplicate identifiers and unhealthy shrinkage cannot replace a library', () => {
  const row = normalizeLibraryRecipe(sourceRecipe());
  assert.equal(validateRecipeLibrary(library([row])).valid, true);
  assert.equal(validateRecipeLibrary({ ...library([row]), status: 'partial' }).valid, false);
  assert.equal(validateRecipeLibrary({ ...library([row]), coverage: { discovered: 100 } }).valid, false);
  assert.equal(validateRecipeLibrary(library([row, row])).valid, false);
  assert.equal(validateRecipeLibrary(library([row]), library(Array.from({ length: 100 }, (_, i) => ({ ...row, id: `old-${i}` })))).valid, false);
});

test('retry delay respects provider Retry-After and bounded exponential delays', () => {
  assert.equal(retryDelay(new Response(null, { headers: { 'Retry-After': '12' } }), 0), 12000);
  assert.equal(retryDelay(new Response(null, { headers: { 'Retry-After': '9999' } }), 0), 60000);
  assert.equal(retryDelay(null, 2), 4000);
});

async function temporaryFolder(run) {
  const parent = path.resolve(tmpdir()), folder = await mkdtemp(path.join(parent, 'meal-planner-library-test-'));
  try { return await run(folder); }
  finally {
    const resolved = path.resolve(folder);
    assert.ok(resolved.startsWith(`${parent}${path.sep}meal-planner-library-test-`));
    await rm(resolved, { recursive: true, force: true });
  }
}
function fakeResponse(body) { return new Response(JSON.stringify(body), { status: 200, headers: { etag: '"source-v1"' } }); }

test('refresh walks every page and detail, publishes attribution and reuses fresh checkpoints', async () => {
  await temporaryFolder(async folder => {
    const urls = [];
    const fetchFn = async url => {
      urls.push(url);
      if (url === RECIPE_LIBRARY_SOURCE.indexUrl) return fakeResponse({ total: 2, items: [{ slug: 'first', source_name: 'wikibooks' }], next_url: 'https://recipecontextprotocol.com/recipes?source=wikibooks&page=2' });
      if (url.includes('page=2')) return fakeResponse({ total: 2, items: [{ slug: 'second', source_name: 'wikibooks' }], next_url: null });
      return fakeResponse(sourceRecipe(new URL(url).pathname.split('/').pop()));
    };
    const options = { outputDir: path.join(folder, 'out'), cacheDir: path.join(folder, 'cache'), fetchFn, intervalMs: 0, log: () => {} };
    const result = await refreshRecipeLibrary(options);
    assert.equal(result.candidate.recipes.length, 2);
    assert.equal(result.metadata.coverage.pages, 2);
    assert.equal(result.metadata.counts.withSourceYield, 2);
    assert.equal(urls.length, 4);
    const saved = JSON.parse(await readFile(path.join(options.outputDir, 'recipe-library.json'), 'utf8'));
    assert.equal(saved.license, 'CC BY-SA 4.0');
    await refreshRecipeLibrary({ ...options, fetchFn: () => { throw new Error('Fresh checkpoints should prevent another request.'); } });
  });
});

test('partial detail scrape rejects candidate and leaves the healthy library untouched', async () => {
  await temporaryFolder(async folder => {
    const outputDir = path.join(folder, 'out');
    await mkdir(outputDir);
    const healthy = library([normalizeLibraryRecipe(sourceRecipe('healthy'))]);
    const outputPath = path.join(outputDir, 'recipe-library.json');
    await writeFile(outputPath, JSON.stringify(healthy));
    const fetchFn = async url => url === RECIPE_LIBRARY_SOURCE.indexUrl
      ? fakeResponse({ total: 2, items: [{ slug: 'first', source_name: 'wikibooks' }, { slug: 'second', source_name: 'wikibooks' }], next_url: null })
      : fakeResponse(sourceRecipe(new URL(url).pathname.split('/').pop(), url.endsWith('/second') ? { license: 'unknown' } : {}));
    await assert.rejects(refreshRecipeLibrary({ outputDir, cacheDir: path.join(folder, 'cache'), fetchFn, intervalMs: 0, log: () => {} }), /existing library was kept/);
    assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), healthy);
  });
});

test('incomplete index fails before downloading details or altering the current library', async () => {
  await temporaryFolder(async folder => {
    let calls = 0;
    const fetchFn = async () => { calls++; return fakeResponse({ total: 2, items: [{ slug: 'first', source_name: 'wikibooks' }], next_url: null }); };
    await assert.rejects(refreshRecipeLibrary({ outputDir: path.join(folder, 'out'), cacheDir: path.join(folder, 'cache'), fetchFn, intervalMs: 0, log: () => {} }), /index is incomplete/);
    assert.equal(calls, 1);
  });
});
