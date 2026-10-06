import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptApifyProduct, adaptMatrixProduct, chooseBestPackCandidate, matchesApifyStoreRow, splitSearchBatches, summarizePriceBenchmark } from './price-adapter.js';

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



test('normalises public daily staple snapshot rows and keeps retailer boundaries', () => {
  const row = {
    retailer: 'aldi', retailerProductId: 'aldi-chicken-1', ean: [],
    matchKey: 'aldi everyday essentials chicken breast fillets 1kg',
    name: 'Everyday Essentials Chicken Breast Fillets 1kg', brand: 'Everyday Essentials',
    packSize: '1kg', price: 4.25, currency: 'GBP',
    url: 'https://www.aldi.co.uk/everyday-essentials-chicken-breast-fillets/p/000000000000123456',
    scrapedAt: stamp, countryCode: 'GB'
  };
  const result = adaptApifyProduct(row, 'Aldi', 'daily-snapshot');
  assert.ok(result);
  assert.equal(result.sourceType, 'daily-snapshot');
  assert.equal(result.retailer, 'Aldi');
  assert.equal(result.price, 4.25);
  assert.equal(result.product.product_quantity, 1);
  assert.equal(result.product.product_quantity_unit, 'kg');
  assert.equal(adaptApifyProduct({ ...row, retailer: 'asda' }, 'Aldi', 'daily-snapshot'), null);
});

test('normalises the UK Grocery Price Matrix Lidl row and prefers a lower promotional price', () => {
  const retrievedAt = '2026-10-06T10:00:00.000Z';
  const row = {
    retailer: 'lidl', productName: 'British Chicken Breast Fillets 650g', brand: 'Birchwood',
    packSize: '650g', price: 4.69, promoPrice: 4.25, currency: 'GBP',
    url: 'https://www.lidl.co.uk/p/british-chicken-breast-fillets/p100123',
    imageUrl: 'https://www.lidl.co.uk/product.jpg'
  };
  const result = adaptMatrixProduct(row, 'Lidl', retrievedAt);
  assert.ok(result);
  assert.equal(result.retailer, 'Lidl');
  assert.equal(result.price, 4.25);
  assert.equal(result.currency, 'GBP');
  assert.equal(result.product.product_quantity, 650);
  assert.equal(result.product.product_quantity_unit, 'g');
  assert.equal(result.date, '2026-10-06');
  assert.match(result.sourceUrl, /studio-amba/);
});

test('matrix adapter rejects another retailer and Dutch Lidl URLs', () => {
  const base = { retailer: 'lidl', productName: 'Chicken Breast 650g', packSize: '650g', price: 4.69, currency: 'GBP', url: 'https://www.lidl.co.uk/p/chicken/p100123' };
  assert.equal(adaptMatrixProduct({ ...base, retailer: 'aldi' }, 'Lidl', stamp), null);
  assert.equal(adaptMatrixProduct({ ...base, currency: 'EUR', url: 'https://www.lidl.nl/p/chicken/p100123' }, 'Lidl', stamp), null);
});

test('chooses one best whole-pack purchase by checkout cost among close ingredient matches', () => {
  const candidates = [
    { productName: 'Chicken breast 650g', score: 0.90, canApply: true, fresh: true, packsNeeded: 2, checkoutCost: 9.38, leftoverBase: 100, neededBase: 1200 },
    { productName: 'Chicken breast 1kg', score: 0.88, canApply: true, fresh: true, packsNeeded: 2, checkoutCost: 8.50, leftoverBase: 800, neededBase: 1200 },
    { productName: 'Chicken breast 2kg', score: 0.89, canApply: true, fresh: true, packsNeeded: 1, checkoutCost: 12.29, leftoverBase: 800, neededBase: 1200 },
    { productName: 'Chicken noodles 400g', score: 0.55, canApply: true, fresh: true, packsNeeded: 1, checkoutCost: 1.50, leftoverBase: 0, neededBase: 1200 }
  ];
  assert.equal(chooseBestPackCandidate(candidates)?.productName, 'Chicken breast 1kg');
});

test('does not automatically choose a stale, incompatible, or weak product candidate', () => {
  assert.equal(chooseBestPackCandidate([{ score: 0.95, canApply: false, fresh: true, checkoutCost: 2, packsNeeded: 1 }]), null);
  assert.equal(chooseBestPackCandidate([{ score: 0.40, canApply: true, fresh: true, checkoutCost: 2, packsNeeded: 1 }]), null);
  assert.equal(chooseBestPackCandidate([{ score: 0.95, canApply: true, fresh: false, checkoutCost: 2, packsNeeded: 1 }]), null);
});


test('calculates a median unit-price benchmark separately from whole-pack checkout cost', () => {
  const result = summarizePriceBenchmark([
    { productCode: 'a', productName: 'Chicken breast 500g', score: 0.91, ageDays: 1, packPrice: 3, packBase: 500, dimension: 'mass', date: '2026-10-05' },
    { productCode: 'b', productName: 'Chicken breast 1kg', score: 0.88, ageDays: 2, packPrice: 5, packBase: 1000, dimension: 'mass', date: '2026-10-04' },
    { productCode: 'c', productName: 'Chicken breast 650g', score: 0.90, ageDays: 1, packPrice: 3.9, packBase: 650, dimension: 'mass', date: '2026-10-05' },
    { productCode: 'weak', productName: 'Chicken flavoured noodles', score: 0.50, ageDays: 1, packPrice: 1, packBase: 400, dimension: 'mass', date: '2026-10-05' },
    { productCode: 'stale', productName: 'Chicken breast 1kg old', score: 0.90, ageDays: 90, packPrice: 1, packBase: 1000, dimension: 'mass', date: '2026-07-01' },
  ]);
  assert.equal(result.sampleSize, 3);
  assert.equal(result.unitLabel, 'kg');
  assert.equal(result.medianUnitPrice, 6);
  assert.equal(result.minUnitPrice, 5);
  assert.equal(result.maxUnitPrice, 6);
  assert.equal(result.newestDate, '2026-10-05');
});

test('does not mix mass and volume candidates into one benchmark', () => {
  const result = summarizePriceBenchmark([
    { productCode: 'a', productName: 'Oats 1kg', score: 0.9, ageDays: 1, packPrice: 2, packBase: 1000, dimension: 'mass', date: '2026-10-05' },
    { productCode: 'b', productName: 'Oats 500g', score: 0.9, ageDays: 1, packPrice: 1.2, packBase: 500, dimension: 'mass', date: '2026-10-05' },
    { productCode: 'c', productName: 'Drink 1L', score: 0.9, ageDays: 1, packPrice: 1, packBase: 1000, dimension: 'volume', date: '2026-10-05' },
  ]);
  assert.equal(result.dimension, 'mass');
  assert.equal(result.sampleSize, 2);
  assert.equal(result.medianUnitPrice, 2.2);
});

test('returns no benchmark when there are no recent confident pack matches', () => {
  assert.equal(summarizePriceBenchmark([{ score: 0.95, ageDays: 100, packPrice: 2, packBase: 1000, dimension: 'mass' }]), null);
});
