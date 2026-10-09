import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const appHtml = await readFile(path.join(ROOT, 'public', 'index.html'), 'utf8');
const start = html.indexOf('const productMatchCache = new Map();');
const end = html.indexOf('function mealCard(', start);
assert.ok(start >= 0 && end > start, 'the Pages catalogue matcher is present');

test('phone shopping app includes automatic catalogue recommendations and valid inline scripts', () => {
  assert.match(appHtml, /requestAutomaticCatalogMatches\(entries,store\)/);
  assert.match(appHtml, /\/api\/catalog\/recommend/);
  const scripts = [...appHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/i.test(match[1]) && !/application\/ld\+json/i.test(match[1]))
    .map(match => match[2])
    .filter(source => source.trim());
  assert.ok(scripts.length, 'the phone app has inline JavaScript');
  for (const source of scripts) assert.doesNotThrow(() => new vm.Script(source));
});

function automaticMatchingHarness(fetch) {
  const sourceStart = appHtml.indexOf('let automaticCatalogState=');
  const sourceEnd = appHtml.indexOf('// Manual product-reference catalogue', sourceStart);
  assert.ok(sourceStart >= 0 && sourceEnd > sourceStart);
  let now = Math.floor(Date.now() / 1000) * 1000;
  const renders = [];
  const timerDelays = [];
  const context = {
    fetch, AbortController, DOMException, console,
    Date: { now: () => now, parse: Date.parse },
    // Shorten delays while keeping request timeouts separate from retry backoff.
    setTimeout: (fn, ms) => { timerDelays.push(ms); return setTimeout(fn, ms >= 45000 ? 25 : 0); }, clearTimeout,
    window: { addEventListener() {} },
    document: { hidden: false, addEventListener() {} },
    renderShop: () => renders.push(context.readState()),
  };
  vm.runInNewContext(appHtml.slice(sourceStart, sourceEnd) + '\nglobalThis.requestMatches=requestAutomaticCatalogMatches;globalThis.readState=()=>automaticCatalogState;globalThis.readSummary=automaticCatalogSummary;', context);
  return { ...context, renders, timerDelays, currentTime: () => now, advanceTime: ms => { now += ms; } };
}

const shoppingEntries = quantity => [['chicken breast', { name: 'Chicken breast', groups: { mass: { remaining: quantity } } }]];
const recommendationResponse = items => ({ ok: true, status: 200, text: async () => JSON.stringify({ recommendations: items.map(item => ({ key: item.key, match: { productName: 'ASDA Chicken Breast Fillets' }, plan: { requestedQuantity: item.quantity } })) }) });

test('automatic phone matching recovers from empty and invalid gateway responses', async () => {
  let requests = 0;
  const app = automaticMatchingHarness(async (url, options) => {
    requests++;
    if (requests === 1) return { ok: true, status: 200, text: async () => '' };
    if (requests === 2) return { ok: false, status: 502, text: async () => '<html>Bad gateway</html>' };
    return recommendationResponse(JSON.parse(options.body).items);
  });
  await app.requestMatches(shoppingEntries(1500), 'Asda');
  assert.equal(requests, 3);
  assert.equal(app.readState().status, 'ready');
  assert.equal(app.readState().results['chicken breast::mass'].plan.requestedQuantity, 1500);
  assert.ok(app.renders.some(state => state.status === 'loading' && state.attempt > 1));
});

test('automatic phone matching caps retries and can recover on a later visit', async () => {
  let requests = 0;
  const app = automaticMatchingHarness(async (url, options) => {
    requests++;
    if (requests <= 3) return { ok: false, status: 503, text: async () => '' };
    return recommendationResponse(JSON.parse(options.body).items);
  });
  await app.requestMatches(shoppingEntries(1500), 'Asda');
  assert.equal(requests, 3);
  assert.equal(app.readState().status, 'error');
  assert.doesNotMatch(app.readState().error, /json|HTTP|SyntaxError/);
  await app.requestMatches(shoppingEntries(1500), 'Asda');
  assert.equal(requests, 3, 'rendering an error must not cause a retry loop');
  app.advanceTime(31000);
  await app.requestMatches(shoppingEntries(1500), 'Asda');
  assert.equal(requests, 4);
  assert.equal(app.readState().status, 'ready');
});

test('automatic phone matching honors numeric and HTTP-date Retry-After without changing request deadlines', async () => {
  let requests = 0;
  const app = automaticMatchingHarness(async (url, options) => {
    requests++;
    if (requests <= 2) return {
      ok: false, status: requests === 1 ? 503 : 429, text: async () => '',
      headers: { get: () => requests === 1 ? '2' : new Date(app.currentTime() + 10000).toUTCString() },
    };
    return recommendationResponse(JSON.parse(options.body).items);
  });
  await app.requestMatches(shoppingEntries(1500), 'Asda');
  assert.equal(app.readState().status, 'ready');
  assert.deepEqual(app.timerDelays, [45000, 2000, 45000, 10000, 45000]);
});

test('automatic phone matching caps server retry delays at one minute', async () => {
  let requests = 0;
  const app = automaticMatchingHarness(async (url, options) => {
    requests++;
    if (requests === 1) return { ok: false, status: 429, text: async () => '', headers: { get: () => '120' } };
    return recommendationResponse(JSON.parse(options.body).items);
  });
  await app.requestMatches(shoppingEntries(1500), 'Asda');
  assert.equal(app.readState().status, 'ready');
  assert.deepEqual(app.timerDelays, [45000, 60000, 45000]);
});

test('phone shopping summary does not show matching for an empty or pantry-covered list', () => {
  const app = automaticMatchingHarness(async () => { throw new Error('Empty shopping lists must not request matches'); });
  assert.equal(app.readSummary([], 'Asda'), '');
  assert.equal(app.readSummary(shoppingEntries(0), 'Asda'), '');
});

test('changing quantities cancels obsolete matching and accepts only the latest result', async () => {
  let requests = 0, aborted = false;
  const app = automaticMatchingHarness(async (url, options) => {
    requests++;
    if (requests === 1) return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('Cancelled', 'AbortError')); }, { once: true }));
    return recommendationResponse(JSON.parse(options.body).items);
  });
  const first = app.requestMatches(shoppingEntries(1500), 'Asda');
  await app.requestMatches(shoppingEntries(2000), 'Asda');
  await first;
  assert.equal(aborted, true);
  assert.equal(requests, 2);
  assert.equal(app.readState().status, 'ready');
  assert.equal(app.readState().results['chicken breast::mass'].plan.requestedQuantity, 2000);
});

test('request timeout aborts a stalled connection and retries automatically', async () => {
  let requests = 0, aborted = false;
  const app = automaticMatchingHarness(async (url, options) => {
    requests++;
    if (requests === 1) return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('Timed out', 'AbortError')); }, { once: true }));
    return recommendationResponse(JSON.parse(options.body).items);
  });
  await app.requestMatches(shoppingEntries(1500), 'Asda');
  assert.equal(aborted, true);
  assert.equal(requests, 2);
  assert.equal(app.readState().status, 'ready');
});

test('updating another ingredient retains successful matches through a temporary outage', async () => {
  let requests = 0;
  const app = automaticMatchingHarness(async (url, options) => {
    requests++;
    if (requests === 1) return recommendationResponse(JSON.parse(options.body).items);
    return { ok: false, status: 503, text: async () => '' };
  });
  const entries = [...shoppingEntries(1500), ['cucumber', { name: 'Cucumber', groups: { count: { remaining: 1 } } }]];
  await app.requestMatches(entries, 'Asda');
  entries[1][1].groups.count.remaining = 2;
  await app.requestMatches(entries, 'Asda');
  assert.equal(app.readState().status, 'error');
  assert.ok(app.readState().results['chicken breast::mass']);
  assert.equal(app.readState().results['cucumber::count'], undefined, 'changed quantities must not retain an old purchase plan');
});

const products = [
  { name: 'ASDA Baby Plum Tomatoes 300g', category: 'Fresh Fruit, Vegetables & Flowers > Fresh Salad & Stir Fry > Tomatoes', availability: 'listed_online', packQuantity: 300, packUnit: 'g', price: 1 },
  { name: 'ASDA Classic Tomato Ketchup 550g', category: 'Food Cupboard > Condiments & Cooking Ingredients > Tomato Ketchup', availability: 'listed_online', packQuantity: 550, packUnit: 'g', price: 0.95 },
  { name: 'ASDA Chopped Tomatoes 400g', category: 'Food Cupboard > Tinned Food > Tinned Tomatoes', availability: 'listed_online', packQuantity: 400, packUnit: 'g', price: 0.47 },
  { name: 'COOK by ASDA Ground Cinnamon 34g', category: 'Food Cupboard > Condiments & Cooking Ingredients > Spices', availability: 'listed_online', packQuantity: 34, packUnit: 'g', price: 0.95 },
  { name: 'Millions Cinnamon Sweets', category: 'Food Cupboard > Chocolates & Sweets > Sweets > Boiled Sweets', availability: 'listed_online', packQuantity: 90, packUnit: 'g', price: 1 },
  { name: 'ASDA 6 Bananas', category: 'Fresh Fruit, Vegetables & Flowers > Fresh Fruit > Bananas', availability: 'listed_online', packQuantity: 6, packUnit: 'pieces', price: 0.94 },
  { name: 'ASDA Banana Chips 75g', category: 'Fresh Fruit, Vegetables & Flowers > Raw Nuts, Seeds & Dried Fruit > Dried Fruit', availability: 'listed_online', packQuantity: 75, packUnit: 'g', price: 1.25 },
];
const context = { products };
vm.runInNewContext(html.slice(start, end) + '\nglobalThis.findProduct = findProduct;\nglobalThis.recipeCost = recipeCost;\nglobalThis.packCount = packCount;', context);

test('Pages matching favours fresh produce and cooking spices over unrelated products', () => {
  assert.equal(context.findProduct('tomato', 'g').name, 'ASDA Baby Plum Tomatoes 300g');
  assert.equal(context.findProduct('cinnamon', 'g').name, 'COOK by ASDA Ground Cinnamon 34g');
});

test('Pages costing does not divide grams by a pack sold by piece', () => {
  const banana = context.findProduct('banana', 'g');
  assert.equal(banana.name, 'ASDA 6 Bananas');
  assert.equal(context.recipeCost({ ingredients: [{ ingredient: 'banana', quantity: 120, unit: 'g' }] }), 0.94);
  assert.equal(context.packCount(120, 'g', banana), 1);
});
