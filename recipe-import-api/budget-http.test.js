import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { setTimeout as pause } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';

test('the phone budget request checks a real whole-catalogue plan while health remains responsive', { timeout: 120000 }, async t => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const library = html.match(/const builtInRecipes\s*=\s*(\[[\s\S]*?\n\]);/)[1];
  const nutrition = html.slice(html.indexOf('const NUTRITION_PROFILES='), html.indexOf('function nutritionSourceLabel'));
  const ctx = {};
  vm.runInNewContext(`function canonicalIngredientName(name){return String(name||'').trim().toLowerCase().replace(/\\byogurt\\b/g,'yoghurt')};const library=${library};${nutrition};globalThis.rows=library.map(recipe=>({id:recipe.id,name:recipe.name,cat:recipe.cat,ings:recipe.ings,servings:recipe.servings||1,cookTime:null,nutrition:recipeNutrition(recipe)}));`, ctx, { timeout: 2000 });
  const payload = { profile: { days: 7, meals: 4, people: 1, calories: 2000, protein: 200, budget: 45, avoidRepeat: true }, recipes: ctx.rows, pantry: [], week: [], mealServings: {}, locked: {}, favorites: [] };
  process.env.PORT = '0';
  const { httpServer } = await import('./server.js');
  t.after(async () => { httpServer.closeAllConnections(); await new Promise(resolve => httpServer.close(resolve)); });
  if (!httpServer.listening) await once(httpServer, 'listening');
  const base = `http://127.0.0.1:${httpServer.address().port}`;
  let done = false;
  const started = performance.now();
  const request = fetch(`${base}/api/planner/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(110000) })
    .then(async response => { assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /json/); return response.json(); }).finally(() => { done = true; });
  request.catch(() => {});
  const latencies = [];
  while (!done) {
    const at = performance.now();
    const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);
    latencies.push(performance.now() - at);
    assert.ok(latencies.at(-1) < 1000, 'Planning must leave Render health checks responsive');
    await pause(20);
  }
  const result = await request;
  // A catalogue price change can make £45 impossible. It must still produce an
  // honest, fully priced proposal rather than weakening the target or counting
  // missing products as free. Fixture tests exercise successful acceptance.
  assert.ok(['feasible', 'no_feasible_plan'].includes(result.status), JSON.stringify(result.warnings));
  assert.equal(result.basket.complete, true);
  assert.ok(result.basket.indexSize >= 10000);
  assert.equal(result.week.length, 7);
  assert.ok(result.week.every(day => day.meals.length === 4));
  assert.ok(result.nutrition.days.every(day => day.complete && day.kcal >= 1800 - .05 && day.kcal <= 2200 + .05 && day.p >= 200 - .05));
  const sum = result.basket.recommendations.reduce((total, row) => { assert.ok(row.plan); assert.ok(row.plan.totalQuantity + .00001 >= row.plan.requestedQuantity); return total + row.plan.totalCostGBP; }, 0);
  assert.ok(Math.abs(sum - result.basket.totalCostGBP) < .001);
  if (result.status === 'feasible') assert.ok(result.basket.totalCostGBP <= 45);
  else assert.ok(result.basket.totalCostGBP > 45);
  assert.ok(latencies.length >= 2);
  t.diagnostic(`HTTP planner returned ${result.status}: £${result.basket.totalCostGBP.toFixed(2)} in ${Math.round(performance.now() - started)} ms; ${latencies.length} health checks, maximum ${Math.round(Math.max(...latencies))} ms`);
  for (const bad of [{ ...payload, profile: { ...payload.profile, people: 0 } }, { ...payload, recipes: [] }]) {
    const response = await fetch(`${base}/api/planner/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bad) });
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, 'string');
  }
});
