import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import dns from 'node:dns/promises';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

test('browser import works without a token or Groq key, handles source failures as JSON, and protects free limits', { timeout: 30000 }, async t => {
  process.env.PORT = '0'; process.env.GROQ_API_KEY = ''; process.env.IMPORT_API_TOKEN = '';
  const { httpServer } = await import('./server.js');
  if (!httpServer.listening) await once(httpServer, 'listening');
  const base = `http://127.0.0.1:${httpServer.address().port}`;
  const realLookup = dns.lookup, realRequest = https.request;
  const sourceCalls = [];
  dns.lookup = async host => [{ address: host === 'private.example' ? '127.0.0.1' : '1.1.1.1', family: 4 }];
  https.request = (url, options, callback) => {
    const target = String(url);
    sourceCalls.push(target);
    assert.match(target, /^https:\/\/recipes\.example\//);
    const schema = { '@type': 'Recipe', name: 'Rice and beans', recipeYield: '2 servings', totalTime: 'PT20M', recipeIngredient: ['100g rice', '400g kidney beans', '1 tbsp olive oil'], recipeInstructions: [{ text: 'Cook the rice.' }, { text: 'Heat the beans and oil.' }] };
    const outgoing = new EventEmitter();
    outgoing.end = () => {
      const incoming = Readable.from([`<html><title>Rice and beans</title><script type="application/ld+json">${JSON.stringify(schema)}</script></html>`]);
      incoming.statusCode = target.endsWith('/blocked') ? 403 : 200; incoming.headers = { 'content-type': 'text/html' };
      callback(incoming);
    };
    return outgoing;
  };
  t.after(async () => {
    dns.lookup = realLookup; https.request = realRequest;
    httpServer.closeAllConnections(); await new Promise(resolve => httpServer.close(resolve));
  });
  let client = 1;
  async function post(body, headers = {}, ip = `203.0.113.${client++}`) {
    const response = await fetch(`${base}/api/import-recipe`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, 'X-Forwarded-For': ip, ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    assert.match(response.headers.get('Content-Type'), /json/);
    return { response, data: await response.json() };
  }
  const pastedText = 'Egg rice\nServes 2\nIngredients\n100g rice\n2 eggs\n1 tbsp olive oil\nMethod\n1. Cook the rice.\n2. Fry the eggs in oil.';
  const pasted = await post({ pastedText });
  assert.equal(pasted.response.status, 200);
  assert.equal(pasted.data.extraction.method, 'pasted-text');
  assert.equal(pasted.data.recipe.servings, 2);
  assert.equal(pasted.data.recipe.ingredients[2].name, 'olive oil');
  assert.equal(pasted.data.recipe.caloriesPerServing, null);
  const page = await post({ url: 'https://recipes.example/rice' });
  assert.equal(page.response.status, 200);
  assert.equal(page.data.extraction.method, 'structured-data');
  assert.equal(page.data.recipe.totalMinutes, 20);
  assert.equal(page.data.recipe.ingredients.length, 3);
  assert.deepEqual(sourceCalls, ['https://recipes.example/rice']);

  const captionFallback = await post({ url: 'https://recipes.example/blocked', pastedText });
  assert.equal(captionFallback.response.status, 200);
  assert.equal(captionFallback.data.extraction.method, 'pasted-text');
  assert.equal(sourceCalls.length, 1, 'A structured pasted recipe bypasses blocked sites and video downloads');
  const blocked = await post({ url: 'https://recipes.example/blocked' });
  assert.equal(blocked.response.status, 422); assert.match(blocked.data.error, /HTTP 403.+Paste/);
  const privateSource = await post({ url: 'https://private.example/rice' });
  assert.equal(privateSource.response.status, 422); assert.match(privateSource.data.error, /non-public address/);
  const invalid = await post({ url: 'http://recipes.example/rice' });
  assert.equal(invalid.response.status, 400); assert.match(invalid.data.error, /HTTPS/);
  const unstructured = await post({ pastedText: 'I made something with rice, but cannot remember the amounts.' });
  assert.equal(unstructured.response.status, 422); assert.match(unstructured.data.error, /Ingredients section/);
  const foreign = await post({ pastedText }, { Origin: 'https://untrusted.example' });
  assert.equal(foreign.response.status, 403);
  const noOrigin = await fetch(`${base}/api/import-recipe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pastedText }) });
  assert.equal(noOrigin.status, 401); assert.match((await noOrigin.json()).error, /No access token is needed/);
  const malformed = await fetch(`${base}/api/import-recipe`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: '{bad-json' });
  assert.equal(malformed.status, 400); assert.equal(typeof (await malformed.json()).error, 'string');

  const emptyVideo = await fetch(`${base}/api/import-video`, { method: 'POST', headers: { Origin: base, 'X-Forwarded-For': '203.0.113.80' }, body: new FormData() });
  assert.equal(emptyVideo.status, 400); assert.match((await emptyVideo.json()).error, /Choose a video/);
  const videoBody = new FormData(); videoBody.append('video', new Blob(['test-video'], { type: 'video/mp4' }), 'recipe.mp4');
  const video = await fetch(`${base}/api/import-video`, { method: 'POST', headers: { Origin: base, 'X-Forwarded-For': '203.0.113.81' }, body: videoBody });
  assert.equal(video.status, 503); assert.match((await video.json()).error, /Paste the ingredient list/);
  for (let i = 0; i < 6; i++) assert.equal((await post({ pastedText }, {}, '203.0.113.99')).response.status, 200);
  const limited = await post({ pastedText }, {}, '203.0.113.99');
  assert.equal(limited.response.status, 429); assert.ok(Number(limited.response.headers.get('Retry-After')) > 0); assert.match(limited.data.error, /wait a few minutes/);
  const health = await fetch(`${base}/health`); assert.equal(health.status, 200); assert.equal((await health.json()).ok, true);
});
