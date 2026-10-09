import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { setTimeout as pause } from 'node:timers/promises';

const cataloguePath = fileURLToPath(new URL('../data/products.json', import.meta.url));
const metadataPath = fileURLToPath(new URL('../data/catalogue-meta.json', import.meta.url));
const appPath = new URL('../public/index.html', import.meta.url);

async function readJsonResponse(response) {
  const body = await response.text();
  assert.match(response.headers.get('content-type') || '', /application\/json/i,
    `Expected JSON for HTTP ${response.status}: ${body.slice(0, 200)}`);
  assert.ok(body.trim(), `HTTP ${response.status} returned an empty response`);
  try { return JSON.parse(body); }
  catch { assert.fail(`HTTP ${response.status} returned invalid JSON: ${body.slice(0, 200)}`); }
}

test('a cold full-catalogue shopping request keeps health checks responsive and returns structured results', { timeout: 120_000 }, async t => {
  const [html, metadataText] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(metadataPath, 'utf8'),
  ]);
  const metadata = JSON.parse(metadataText);
  assert.equal(metadata.status, 'complete', 'This load regression requires the complete checked-in catalogue');
  assert.ok(metadata.products_saved >= 10_000, 'Exercise the actual large catalogue, rather than a small seed fixture');
  const recipesMatch = html.match(/const builtInRecipes\s*=\s*(\[[\s\S]*?\n\]);/);
  assert.ok(recipesMatch, 'Exercise the ingredients used by the actual built-in recipes');
  const recipes = vm.runInNewContext(recipesMatch[1], {}, { timeout: 1000 });
  const ingredientNames = [...new Set(recipes.flatMap(recipe => recipe.ings.map(([name]) => name)))];
  assert.ok(ingredientNames.length >= 100, 'Exercise a real full shopping list, rather than just one ingredient');
  const items = ingredientNames.map(name => ({
    key: name,
    name,
    dimension: name === 'Milk' ? 'volume' : name === 'Eggs' ? 'count' : 'mass',
    quantity: name === 'Chicken breast' ? 1500 : name === 'Eggs' ? 6 : 500,
  }));

  // An ephemeral local server and checked-in data avoid putting load on Render or ASDA.
  process.env.PORT = '0';
  process.env.ASDA_CATALOGUE_PATH = cataloguePath;
  process.env.ASDA_CATALOGUE_META_PATH = metadataPath;
  const { httpServer } = await import('./server.js');
  t.after(async () => {
    httpServer.closeAllConnections();
    await new Promise((resolve, reject) => httpServer.close(error => error ? reject(error) : resolve()));
  });
  if (!httpServer.listening) await once(httpServer, 'listening');
  const baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
  const loopDelay = monitorEventLoopDelay({ resolution: 20 });
  loopDelay.enable();
  t.after(() => loopDelay.disable());
  const started = performance.now();
  let recommendationFinished = false;
  const recommendationsRequest = fetch(`${baseUrl}/api/catalog/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store: 'Asda', items }),
    signal: AbortSignal.timeout(110_000),
  }).then(async response => ({ status: response.status, data: await readJsonResponse(response) }))
    .finally(() => { recommendationFinished = true; });
  // Keep a failed health assertion from leaving the in-flight recommendation unhandled.
  recommendationsRequest.catch(() => {});
  const statusRequest = fetch(`${baseUrl}/api/catalog/status`).then(readJsonResponse);
  statusRequest.catch(() => {});

  const healthChecks = [];
  while (!recommendationFinished) {
    const healthStarted = performance.now();
    const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
    const health = await readJsonResponse(response);
    const latencyMs = performance.now() - healthStarted;
    healthChecks.push({ latencyMs, overlappedRecommendation: !recommendationFinished });
    assert.equal(response.status, 200);
    assert.equal(health.ok, true);
    assert.ok(latencyMs < 1000, `A health check took ${Math.round(latencyMs)} ms while matching the full shopping list`);
    await pause(10);
  }
  const { status, data } = await recommendationsRequest;
  const elapsedMs = performance.now() - started;
  const memory = process.memoryUsage();
  assert.ok(memory.heapUsed < 100 * 1024 * 1024,
    'The large catalogue must live in the worker, outside the web server heap');
  t.diagnostic(`Matched ${items.length} ingredients against ${metadata.products_saved} products in ${Math.round(elapsedMs)} ms; ${healthChecks.length} health checks, maximum ${Math.round(Math.max(...healthChecks.map(row => row.latencyMs)))} ms; maximum event-loop delay ${Math.round(loopDelay.max / 1e6)} ms; heap ${Math.round(memory.heapUsed / 1024 / 1024)} MiB, RSS ${Math.round(memory.rss / 1024 / 1024)} MiB`);
  assert.ok(healthChecks.filter(row => row.overlappedRecommendation).length >= 2,
    'At least two health checks must finish before the catalogue batch finishes; the batch must yield to other requests');
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  const catalogueStatus = await statusRequest;
  assert.equal(catalogueStatus.catalogue.healthy, true);
  assert.equal(catalogueStatus.catalogue.products_saved, data.indexSize, 'Status and recommendations share the same validated snapshot');
  assert.equal(data.indexSize, metadata.products_saved);
  assert.equal(data.recommendations.length, items.length, 'Every submitted ingredient must receive an explicit result');
  assert.deepEqual(new Set(data.recommendations.map(row => row.key)), new Set(items.map(row => row.key)));
  const cucumber = data.recommendations.find(row => row.key === 'Cucumber');
  assert.equal(cucumber.confidence, 'high');
  assert.match(cucumber.match.productName, /^(?:ASDA\s+)?Cucumber$/i);
  const chicken = data.recommendations.find(row => row.key === 'Chicken breast');
  assert.equal(chicken.confidence, 'high');
  assert.ok(chicken.plan, 'Chicken breast mass quantities should have a pack purchase plan');
  assert.ok(chicken.plan.totalQuantity >= 1500);
  assert.ok(Number.isFinite(chicken.plan.totalCostGBP) && chicken.plan.totalCostGBP > 0);
  assert.ok(chicken.plan.products.every(product => /chicken breast/i.test(product.productName)));
  assert.ok(chicken.plan.products.every(product => !/thai|sizzle|breaded|cooked|marinated|skewer|kebab/i.test(product.productName)),
    'Plain chicken breast quantities must use sensible plain chicken products');

  for (const payload of [
    { store: 'Asda', items: [] },
    { store: 'Asda', items: [{ key: 'missing-name' }] },
    { store: 'Asda', items: null },
    { store: 'Asda', items: [{ key: 'quantity', name: 'Milk', quantity: -1 }] },
    { store: 'Asda', items: [{ key: 'quantity', name: 'Milk', quantity: 'Infinity' }] },
  ]) {
    const response = await fetch(`${baseUrl}/api/catalog/recommend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const error = await readJsonResponse(response);
    assert.equal(response.status, 400);
    assert.equal(typeof error.error, 'string');
    assert.ok(error.error.length > 0);
  }
  const malformedResponse = await fetch(`${baseUrl}/api/catalog/recommend`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"store":',
  });
  const malformedError = await readJsonResponse(malformedResponse);
  assert.equal(malformedResponse.status, 400);
  assert.equal(typeof malformedError.error, 'string');
});
