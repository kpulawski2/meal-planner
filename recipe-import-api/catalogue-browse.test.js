import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { browseCatalog, recommendCatalogItems } from './catalog-adapter.js';
import { browseCatalog as browseWorker } from './catalog-service.js';
import { validateRangeReferences } from './lidl-range-references.js';

const refs = JSON.parse(await readFile(new URL('../data/lidl-range-references.json', import.meta.url)));
test('Lidl browsing exposes every food entry across stable pages and excludes non-food departments', async () => {
  const first = await browseCatalog('Lidl', { limit: 37 }), rows = [...first.results];
  let page = first;
  while (page.nextOffset !== null) { page = await browseCatalog('Lidl', { offset: page.nextOffset, limit: 37 }); rows.push(...page.results); }
  assert.equal(rows.length, first.total); assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  assert.ok(first.total > 1000); assert.ok(first.rangeReferences > 0);
  assert.ok(rows.every(row => !['Health & Beauty', 'Household', 'Pet', 'Plants & Flowers'].includes(row.category)));
  const snapshot = JSON.parse(await readFile(new URL('../data/lidl-products.json', import.meta.url)));
  const expected = snapshot.filter(row => row.category.startsWith('Food & Drink > ') && !['Health & Beauty', 'Household', 'Pet', 'Plants & Flowers'].includes(row.category.split(' > ')[1]));
  assert.equal(rows.filter(row => row.kind === 'product').length, expected.length);
  assert.equal(first.total, expected.length + first.rangeReferences);
});
test('category, search aliases and price filters include unknown ingredients without inventing a price', async () => {
  const found = await browseCatalog('Lidl', { query: 'mayonnaise', category: 'Oils, Condiments & Sauces', price: 'unpriced' });
  const row = found.results.find(row => row.productName === 'Batts Light Mayonnaise');
  assert.ok(row); assert.equal(row.priceGBP, null); assert.equal(row.kind, 'range_reference'); assert.equal(row.sourcePeriod, '2026-05');
  assert.match(row.url, /Lidl5-for-20-May2026/); assert.equal(row.packSize, null); assert.equal(row.publishedPack, '500ml');
  assert.equal((await browseCatalog('Lidl', { query: 'mayonnaise', price: 'priced' })).matched, 0);
  assert.ok((await browseCatalog('Lidl', { query: 'fat free natural yoghurt' })).results.some(row => row.productName === 'Simply Fat-Free Natural Yogurt'));
  assert.equal((await browseCatalog('Lidl', { query: 'no-such-ingredient-xyz' })).matched, 0);
  const priced = await browseCatalog('Lidl', { price: 'priced', limit: 1000 });
  assert.ok(priced.results.every(row => row.priceGBP > 0 && row.kind === 'product')); assert.ok(priced.results.length <= 100);
});
test('range references cannot enter automatic ingredient pricing or enlarge the validated matching snapshot', async () => {
  const result = await recommendCatalogItems('Lidl', [{ key: 'mayo', name: 'Light mayonnaise', dimension: 'mass', quantity: 15 }]);
  const snapshot = JSON.parse(await readFile(new URL('../data/lidl-products.json', import.meta.url)));
  assert.equal(result.indexSize, snapshot.length); assert.equal(result.recommendations[0].plan, null); assert.equal(result.recommendations[0].match, null);
});
test('range references validate identities and official sources and reject prices', () => {
  assert.equal(validateRangeReferences(refs).length, 61);
  for (const change of [doc => doc.references[0].price = .42, doc => doc.references[0].sourceId = 'missing', doc => doc.references.push(doc.references[0]), doc => doc.sources[0].url = 'https://www.lidl.co.uk.evil.test/file.pdf']) {
    const bad = structuredClone(refs); change(bad); assert.throws(() => validateRangeReferences(bad), /Lidl range reference/);
  }
});
test('the catalogue worker supports paged ingredient browsing with source evidence', async () => {
  const result = await browseWorker('Lidl', { query: 'tortilla wraps' });
  assert.ok(result.results.some(row => row.productName === 'Rowan Hill 8 Both in One Tortilla Wraps' && row.priceGBP === null));
  assert.equal(result.store, 'Lidl'); assert.ok(result.total > 1000);
});
