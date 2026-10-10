import test from 'node:test';
import assert from 'node:assert/strict';
import { createImportAccess, isSameOriginImport, createAiImportBudget, ImportLimitError } from './import-access.js';

function request(headers = {}) { return { protocol: 'https', ip: 'client-1', get: name => headers[name.toLowerCase()] || (name === 'host' ? 'meal.example' : undefined) }; }
function response() { return { headers: {}, set(name, value) { this.headers[name] = value; return this; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } }; }
test('same-origin consumer imports need no private token; foreign callers cannot claim a browser fallback', () => {
  const access = createImportAccess();
  for (const headers of [{ origin: 'https://meal.example' }, { 'sec-fetch-site': 'same-origin' }, { referer: 'https://meal.example/recipes' }]) {
    let accepted = false; const res = response(); access(request(headers), res, () => accepted = true); assert.equal(accepted, true); assert.equal(res.statusCode, undefined);
  }
  for (const headers of [{}, { origin: 'https://evil.example', 'sec-fetch-site': 'same-origin' }, { referer: 'https://meal.example.evil.test' }]) {
    assert.equal(isSameOriginImport(request(headers)), false);
    const res = response(); access(request(headers), res, () => assert.fail('Foreign import was admitted')); assert.equal(res.statusCode, 401); assert.match(res.body.error, /No access token is needed/);
  }
});
test('optional valid tokens preserve remote integrations without weakening import rate limits', () => {
  let time = 1000; const access = createImportAccess({ token: 'test-secret', now: () => time, limit: 2, windowMs: 10000 });
  const req = request({ 'x-import-token': 'test-secret' });
  let accepted = 0;
  access(req, response(), () => accepted++); access(req, response(), () => accepted++);
  const limited = response(); access(req, limited, () => assert.fail('Too many requests admitted'));
  assert.equal(accepted, 2); assert.equal(limited.statusCode, 429); assert.equal(limited.headers['Retry-After'], '10');
  time += 10001; access(req, response(), () => accepted++); assert.equal(accepted, 3);
});
test('shared free AI budget bounds concurrency, minute requests and daily usage and recovers safely', () => {
  let time = Date.parse('2026-10-10T12:00:00Z');
  const claim = createAiImportBudget({ dailyLimit: 2, minIntervalMs: 60000, now: () => time });
  const release = claim();
  assert.throws(claim, error => error instanceof ImportLimitError && error.status === 503);
  release(); release();
  assert.throws(claim, error => error instanceof ImportLimitError && error.retryAfterSeconds === 60);
  time += 60001; claim()();
  time += 60001; assert.throws(claim, /free daily/);
  time += 86400000; assert.doesNotThrow(() => claim()());
});
