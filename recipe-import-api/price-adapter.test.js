import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptApifyProduct, matchesApifyStoreRow, splitSearchBatches } from './price-adapter.js';

const stamp = '2026-10-06T08:00:00.000Z';

test('normalises Aldi UK product from the combined grocery scraper', () => {
  const row = {
    retailer: 'aldi', name: 'Chicken Breast Fillets', brand: 'EVERYDAY ESSENTIALS',
    packSize: '1kg', price: 4.25, currency: 'GBP', scrapedAt: stamp,
    url: 'https://www.aldi.co.uk/product/everyday-essentials-chicken-breast-fillets-0000000000365448',
    ean: [],
  };
  const result = adaptApifyProduct(row, 'Aldi');
  assert.ok(result);
  assert.equal(result.product_name, 'Chicken Breast Fillets');
  assert.equal(result.price, 4.25);
  assert.equal(result.currency, 'GBP');
  assert.equal(result.product.product_quantity, 1);
  assert.equal(result.product.product_quantity_unit, 'kg');
  assert.equal(result.retailer, 'Aldi');
  assert.equal(result.productUrl, row.url);
});

test('normalises ASDA product and preserves shelf price / promotion metadata', () => {
  const row = {
    retailer: 'asda', name: 'Chicken Breast Fillets', brand: 'Butcher’s Selection',
    packSize: '650g', price: 4.69, currency: 'GBP', wasPrice: 5.25,
    promotionText: 'Rollback', loyaltyPrice: null, scrapedAt: stamp,
    url: 'https://groceries.asda.com/product/chicken-breast/000000000000000',
  };
  const result = adaptApifyProduct(row, 'Asda');
  assert.ok(result);
  assert.equal(result.product.product_quantity, 650);
  assert.equal(result.product.product_quantity_unit, 'g');
  assert.equal(result.promotionText, 'Rollback');
});

test('normalises GB Lidl product and rejects non-UK Lidl records', () => {
  const gb = {
    countryCode: 'GB', title: 'British Chicken Breast Fillets 650g', brand: 'Birchwood',
    price: 4.69, currency: 'GBP', productId: '123',
    url: 'https://www.lidl.co.uk/p/british-chicken-breast-fillets/p100123', scrapedAt: stamp,
  };
  const result = adaptApifyProduct(gb, 'Lidl');
  assert.ok(result);
  assert.equal(result.product.product_quantity, 650);
  assert.equal(result.product.product_quantity_unit, 'g');
  assert.equal(result.currency, 'GBP');

  const nl = { ...gb, countryCode: 'NL', currency: 'EUR', url: 'https://www.lidl.nl/p/chicken/p100123' };
  assert.equal(matchesApifyStoreRow(nl, 'Lidl'), false);
  assert.equal(adaptApifyProduct(nl, 'Lidl'), null);
});

test('accepts a pound symbol as currency and a string price', () => {
  const row = {
    retailer: 'aldi', name: 'Free Range Eggs 12 Pack', packSize: '12 pack',
    price: '£2.35', currencySymbol: '£', url: 'https://www.aldi.co.uk/product/free-range-eggs', scrapedAt: stamp,
  };
  const result = adaptApifyProduct(row, 'Aldi');
  assert.ok(result);
  assert.equal(result.price, 2.35);
  assert.equal(result.product.product_quantity, 12);
  assert.equal(result.product.product_quantity_unit, 'pieces');
});

test('rejects wrong retailer, non-GBP, missing timestamp and invalid price', () => {
  const common = { name: 'Chicken Breast 650g', packSize: '650g', price: 4.69, currency: 'GBP', scrapedAt: stamp, url: 'https://groceries.asda.com/product/chicken' };
  assert.equal(adaptApifyProduct({ ...common, retailer: 'aldi' }, 'Asda'), null);
  assert.equal(adaptApifyProduct({ ...common, retailer: 'asda', currency: 'EUR' }, 'Asda'), null);
  assert.equal(adaptApifyProduct({ ...common, retailer: 'asda', scrapedAt: '' }, 'Asda'), null);
  assert.equal(adaptApifyProduct({ ...common, retailer: 'asda', price: 0 }, 'Asda'), null);
});

test('splits a 52-item search into <=20 unique terms without losing terms', () => {
  const terms = Array.from({ length: 52 }, (_, i) => `ingredient ${i + 1}`);
  terms.push('ingredient 1');
  const batches = splitSearchBatches(terms, 20);
  assert.deepEqual(batches.map(batch => batch.length), [20, 20, 12]);
  assert.equal(new Set(batches.flat()).size, 52);
  assert.deepEqual(batches.flat(), terms.slice(0, 52));
});
