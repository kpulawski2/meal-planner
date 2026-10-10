import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { fetchPublicRecipePage, isPublicRecipeAddress } from './public-recipe-fetch.js';

function requestMock(handler, inspect = () => {}) {
  return (url, options, callback) => {
    inspect(url, options);
    const request = new EventEmitter();
    request.end = () => {
      const result = handler(String(url));
      const response = Readable.from((result.body || ['<html>Recipe</html>']).map(chunk => Buffer.from(chunk)));
      response.statusCode = result.status || 200;
      response.headers = { 'content-type': 'text/html', ...(result.headers || {}) };
      callback(response);
    };
    return request;
  };
}
const publicDns = async () => [{ address: '1.1.1.1', family: 4 }];
test('anonymous page connections pin the checked public DNS answer while retaining HTTPS hostname', async () => {
  let lookups = 0;
  const result = await fetchPublicRecipePage('https://recipes.example/rice', {
    resolveImpl: async () => { lookups++; return lookups === 1 ? [{ address: '1.1.1.1', family: 4 }] : [{ address: '127.0.0.1', family: 4 }]; },
    requestImpl: requestMock(() => ({}), (url, options) => {
      assert.equal(url.hostname, 'recipes.example'); assert.equal(options.agent, false);
      options.lookup(url.hostname, {}, (_error, address, family) => { assert.equal(address, '1.1.1.1'); assert.equal(family, 4); });
      options.lookup(url.hostname, { all: true }, (_error, answers) => assert.deepEqual(answers, [{ address: '1.1.1.1', family: 4 }]));
    })
  });
  assert.equal(lookups, 1); assert.equal(result.html, '<html>Recipe</html>');
});
test('redirects revalidate destinations, reject private DNS and limit loops', async () => {
  const redirected = await fetchPublicRecipePage('https://recipes.example/first', { resolveImpl: publicDns, requestImpl: requestMock(url => url.endsWith('/first') ? { status: 302, headers: { location: '/recipe' } } : {}) });
  assert.equal(redirected.finalUrl, 'https://recipes.example/recipe');
  await assert.rejects(fetchPublicRecipePage('https://recipes.example/first', { resolveImpl: async host => [{ address: host === 'private.example' ? '127.0.0.1' : '1.1.1.1', family: 4 }], requestImpl: requestMock(() => ({ status: 302, headers: { location: 'https://private.example/recipe' } })) }), /non-public address/);
  let count = 0;
  await assert.rejects(fetchPublicRecipePage('https://recipes.example/loop', { resolveImpl: publicDns, requestImpl: requestMock(() => { count++; return { status: 302, headers: { location: '/loop' } }; }) }), /Too many redirects/);
  assert.equal(count, 5);
});
test('private hosts, custom ports, mixed DNS answers and non-HTTPS links never start a page request', async () => {
  for (const url of ['http://recipes.example/', 'https://127.0.0.1/', 'https://localhost/', 'https://recipe.local/', 'https://recipe.internal/', 'https://recipes.example:9000/', 'https://user:password@recipes.example/']) {
    await assert.rejects(fetchPublicRecipePage(url, { resolveImpl: publicDns, requestImpl: () => assert.fail('Unsafe source was fetched') }));
  }
  await assert.rejects(fetchPublicRecipePage('https://recipes.example/', { resolveImpl: async () => [{ address: '1.1.1.1', family: 4 }, { address: '192.168.1.2', family: 4 }], requestImpl: () => assert.fail('Mixed DNS source was fetched') }), /non-public/);
  for (const address of ['127.0.0.1', '10.1.2.3', '192.168.1.2', '172.16.1.2', '169.254.1.2', '100.64.1.2', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', 'ff02::1']) assert.equal(isPublicRecipeAddress(address), false, address);
  assert.equal(isPublicRecipeAddress('1.1.1.1'), true);
});
test('page size, content type, source HTTP failures and DNS timeout are bounded, usable errors', async () => {
  for (const [result, pattern] of [[{ body: ['123456789', '123456789'] }, /too large/], [{ headers: { 'content-length': '500' } }, /too large/], [{ headers: { 'content-type': 'application/octet-stream' } }, /recipe webpage/], [{ status: 403 }, /HTTP 403/]]) {
    await assert.rejects(fetchPublicRecipePage('https://recipes.example/', { resolveImpl: publicDns, requestImpl: requestMock(() => result), maxBytes: 10 }), pattern);
  }
  await assert.rejects(fetchPublicRecipePage('https://recipes.example/', { resolveImpl: () => new Promise(() => {}), requestImpl: () => assert.fail('DNS timeout source was fetched'), timeoutMs: 10 }), /could not be resolved/);
});
