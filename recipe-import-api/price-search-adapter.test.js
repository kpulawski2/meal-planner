import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRICE_LOOKUP_STORES,
  buildPriceSearchPrompt,
  isOfficialRetailerUrl,
  parsePriceSearchResponse,
  priceEvidenceContainsAmount,
  priceEvidenceContainsPack,
  splitBatches
} from './price-search-adapter.js';

test('retailer URL allow-list accepts the five official stores and rejects unsupported stores', () => {
  assert.deepEqual(Object.keys(PRICE_LOOKUP_STORES), ['Lidl', 'Asda', 'Aldi', 'Waitrose', 'Morrisons']);
  assert.equal(isOfficialRetailerUrl('Lidl', 'https://www.lidl.co.uk/c/h10095593'), true);
  assert.equal(isOfficialRetailerUrl('Asda', 'https://groceries.asda.com/product/123'), true);
  assert.equal(isOfficialRetailerUrl('Aldi', 'https://www.aldi.co.uk/product'), true);
  assert.equal(isOfficialRetailerUrl('Waitrose', 'https://www.waitrose.com/ecom/products/123'), true);
  assert.equal(isOfficialRetailerUrl('Morrisons', 'https://groceries.morrisons.com/product/123'), true);
  assert.equal(isOfficialRetailerUrl('Lidl', 'https://example.com/lidl-product'), false);
  assert.equal(isOfficialRetailerUrl('Lidl', 'http://lidl.co.uk/product'), false);
  assert.equal(isOfficialRetailerUrl('Asda', 'https://www.lidl.co.uk/product'), false);
  assert.equal(isOfficialRetailerUrl('Tesco', 'https://www.tesco.com/groceries/en-GB/products/123'), false);
  assert.equal(isOfficialRetailerUrl('Co-op', 'https://shop.coop.co.uk/product'), false);
});

test('price evidence must explicitly include the returned price and pack size', () => {
  assert.equal(priceEvidenceContainsAmount('Tesco chicken breast 500g £3.25', 3.25), true);
  assert.equal(priceEvidenceContainsAmount('Tesco chicken breast 500g £3.25', 3.20), false);
  assert.equal(priceEvidenceContainsPack('Tesco chicken breast 500g £3.25', 500, 'g'), true);
  assert.equal(priceEvidenceContainsPack('Tesco chicken breast 500g £3.25', 1, 'kg'), false);
  assert.equal(priceEvidenceContainsPack('6 free range eggs £1.65', 6, 'pieces'), true);
});

test('response parser rejects non-official URLs, wrong prices and missing pack evidence', () => {
  const items = [{ key: 'chicken', name: 'chicken breast', groups: [{ dim: 'mass', remaining: 450, label: 'g' }] }];
  const json = JSON.stringify({ items: [{ key: 'chicken', products: [
    { productName: 'Chicken breast 500g', price: 3.25, currency: 'GBP', packSize: 500, packUnit: 'g', productUrl: 'https://groceries.asda.com/product/123', sourceUrl: 'https://groceries.asda.com/product/123', priceEvidence: 'Chicken breast 500g £3.25', confidence: 0.9 },
    { productName: 'Wrong site chicken 500g', price: 3.25, currency: 'GBP', packSize: 500, packUnit: 'g', productUrl: 'https://example.com/item', sourceUrl: 'https://example.com/item', priceEvidence: 'Chicken breast 500g £3.25', confidence: 0.99 },
    { productName: 'Wrong price chicken 500g', price: 3.20, currency: 'GBP', packSize: 500, packUnit: 'g', productUrl: 'https://groceries.asda.com/product', sourceUrl: 'https://groceries.asda.com/product', priceEvidence: 'Chicken breast 500g £3.25', confidence: 0.99 },
    { productName: 'Missing pack evidence chicken', price: 3.25, currency: 'GBP', packSize: 500, packUnit: 'g', productUrl: 'https://groceries.asda.com/product', sourceUrl: 'https://groceries.asda.com/product', priceEvidence: 'Chicken breast £3.25', confidence: 0.99 }
  ] }] });
  const parsed = parsePriceSearchResponse(json, 'Asda', items);
  assert.equal(parsed.recordsScanned, 4);
  assert.equal(parsed.rejected, 3);
  assert.equal(parsed.items.get('chicken').length, 1);
  assert.equal(parsed.items.get('chicken')[0].price, 3.25);
});

test('price prompts target one of the five stores and demand evidence for an actual current price', () => {
  const prompt = buildPriceSearchPrompt('Lidl', [{ key: 'x', name: 'rolled oats', groups: [] }], '2026-10-06');
  assert.match(prompt.system, /Only use official product pages/i);
  assert.match(prompt.system, /Never invent or estimate a price/i);
  assert.match(prompt.userText, /Lidl/);
  assert.match(prompt.userText, /2026-10-06/);
  assert.deepEqual(PRICE_LOOKUP_STORES.Lidl.domains, ['lidl.co.uk']);
});

test('batching keeps ingredient sets within the requested maximum', () => {
  assert.deepEqual(splitBatches([1, 2, 3, 4, 5, 6], 4), [[1, 2, 3, 4], [5, 6]]);
});
