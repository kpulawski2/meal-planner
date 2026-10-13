import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

test('configured kitchen AI uses the text model, bounded data and shared allowance, with local fallback', async t => {
  process.env.PORT = '0'; process.env.GROQ_API_KEY = 'test-only'; process.env.IMPORT_API_TOKEN = '';
  const nativeFetch = globalThis.fetch, calls = []; let clock = Date.now(), malformed = false;
  mock.method(Date, 'now', () => clock);
  mock.method(globalThis, 'fetch', async (url, options) => {
    if (!String(url).includes('api.groq.com')) return nativeFetch(url, options);
    const body = JSON.parse(options.body); calls.push(body);
    const output = malformed ? 'invalid JSON' : JSON.stringify({ ingredient: 'Tofu', grams: 9999, basis: 'cooked', days: 1, people: 8, query: 'soup', unsafeStorageDays: 99 });
    return new Response(JSON.stringify({ choices: [{ message: { content: output } }] }), { status: 200 });
  });
  const { httpServer } = await import('./server.js'); if (!httpServer.listening) await once(httpServer, 'listening');
  t.after(async () => { httpServer.closeAllConnections(); await new Promise(resolve => httpServer.close(resolve)); mock.restoreAll(); });
  const base = 'http://127.0.0.1:' + httpServer.address().port;
  const post = async (body, path = '/api/kitchen/interpret') => {
    const response = await nativeFetch(base + path, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, 200); return response.json();
  };
  const first = await post({ text: '1kg raw chicken breast curry for 5 days for 2 people' });
  assert.equal(first.source, 'ai'); assert.deepEqual(first.brief, { ingredient: 'Chicken breast', grams: 1000, basis: 'raw', days: 5, people: 2, query: 'curry' });
  assert.equal(first.unsafeStorageDays, undefined); assert.equal(calls.length, 1);
  assert.equal(calls[0].model, 'openai/gpt-oss-20b'); assert.equal(calls[0].max_completion_tokens ?? calls[0].max_tokens, 400);
  const content = calls[0].messages[1].content;
  assert.ok(Array.isArray(content) && content.every(part => part.type === 'text'));
  const user = content.map(part => part.text).join('\n'); assert.match(user, /1kg raw chicken/); assert.doesNotMatch(user, /pantry|foodLog|nutritionTargets|personalNotes/);
  // A planner request immediately afterward shares the same budget and uses local parsing.
  const planner = await post({ text: 'chicken for dinner' }, '/api/planner/interpret'); assert.equal(planner.source, 'local'); assert.equal(calls.length, 1);
  const again = await post({ text: '500g chicken breast curry for 3 days' }); assert.equal(again.source, 'local'); assert.equal(again.brief.grams, 500); assert.equal(calls.length, 1);
  clock += 61000; malformed = true;
  const fallback = await post({ text: '750g chicken breast curry for 4 days' }); assert.equal(fallback.source, 'local'); assert.equal(fallback.brief.grams, 750); assert.equal(calls.length, 2);
  clock += 61000; malformed = false;
  assert.equal((await post({ text: '1kg chicken breast curry for 5 days' })).source, 'ai'); assert.equal(calls.length, 3, 'The failed interpretation releases the shared busy slot.');
});
