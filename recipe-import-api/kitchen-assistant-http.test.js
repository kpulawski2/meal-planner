import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

test('kitchen interpretation works without a provider key and shares protected same-origin admission', async t => {
  process.env.PORT = '0'; process.env.GROQ_API_KEY = '';
  const { httpServer } = await import('./server.js');
  t.after(async () => { httpServer.closeAllConnections(); await new Promise(resolve => httpServer.close(resolve)); });
  if (!httpServer.listening) await once(httpServer, 'listening');
  const base = 'http://127.0.0.1:' + httpServer.address().port;
  const send = (body, origin = base) => fetch(base + '/api/kitchen/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
  assert.equal((await send({ text: '1kg chicken curry' }, null)).status, 401);
  assert.equal((await send({ text: '1kg chicken curry' }, 'https://another.example')).status, 403);
  const response = await send({ text: 'How should I prep 1kg chicken curry for the next week?' });
  assert.equal(response.status, 200); const data = await response.json();
  assert.equal(data.source, 'local'); assert.equal(data.brief.grams, 1000); assert.equal(data.brief.days, 7); assert.equal(data.brief.query, 'curry');
  assert.equal(data.recipes, undefined); assert.equal(data.nutrition, undefined);
  assert.equal((await send({ text: 'x'.repeat(2001) })).status, 400);
  assert.equal((await send({ text: 'chicken curry', defaults: { days: 99 } })).status, 400);
  assert.equal((await send({ text: '0kg chicken curry' })).status, 400);
  assert.equal((await send({ text: '500g cooked chicken breast curry' })).status, 200);
  assert.equal((await send({ text: 'chicken curry' })).status, 200);
  const limited = await send({ text: 'chicken curry' });
  assert.equal(limited.status, 429); assert.ok(limited.headers.get('retry-after'));
  assert.equal((await fetch(base + '/health')).status, 200);
});
