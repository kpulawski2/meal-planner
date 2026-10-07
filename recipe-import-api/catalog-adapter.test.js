import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const directory = await mkdtemp(path.join(os.tmpdir(), 'meal-planner-asda-catalogue-'));
process.env.ASDA_CATALOGUE_PATH = path.join(directory, 'products.json');
process.env.ASDA_CATALOGUE_META_PATH = path.join(directory, 'catalogue-meta.json');

const sampleProducts = Array.from({ length: 120 }, (_, index) => {
  const sku = String(7000000 + index);
  const chicken = index === 0;
  return {
    id: `asda-${sku}`,
    name: chicken ? 'ASDA British Chicken Breast Fillets 1kg' : `ASDA Grocery Product ${sku}`,
    ingredient: chicken ? 'chicken breast' : `grocery product ${sku}`,
    brand: 'ASDA',
    category: chicken ? 'Chicken breasts' : 'Food cupboard',
    packSize: chicken ? '1 kg' : '500 g',
    packQuantity: chicken ? 1000 : 500,
    packUnit: 'g',
    price: chicken ? 7.25 : 1.25,
    sku,
    gtin: null,
    availability: 'in_stock',
    available: true,
    image: chicken ? 'https://images.asda.com/chicken.jpg' : null,
    nutrition: chicken ? { protein: '23g' } : null,
    url: `https://www.asda.com/groceries/product/chicken/${sku}`,
    checkedAt: '2026-10-07T06:00:00Z',
  };
});

await writeFile(process.env.ASDA_CATALOGUE_PATH, JSON.stringify(sampleProducts));
await writeFile(process.env.ASDA_CATALOGUE_META_PATH, JSON.stringify({
  status: 'complete',
  products_saved: sampleProducts.length,
  discovered_sitemaps: 4,
  refreshed_at: '2026-10-07T06:00:00Z',
}));

const { searchCatalog, fetchProductPage, catalogueStatus } = await import(`./catalog-adapter.js?catalogue-test=${Date.now()}`);

test('ASDA matching uses the validated full catalogue and returns saved product details', async () => {
  const result = await searchCatalog('Asda', 'chicken breast', 8);
  assert.equal(result.source, 'validated ASDA catalogue snapshot');
  assert.equal(result.indexSize, 120);
  assert.equal(result.results[0].productName, 'ASDA British Chicken Breast Fillets 1kg');
  assert.equal(result.results[0].priceGBP, 7.25);
  assert.equal(result.results[0].packSize, '1 kg');
  assert.equal(result.results[0].gtin, null);
  assert.equal(result.results[0].nutrition.protein, '23g');

  const product = await fetchProductPage('Asda', result.results[0].url);
  assert.equal(product.priceGBP, 7.25);
  assert.equal(product.verified, true);
  assert.equal(product.brand, 'ASDA');
  assert.equal(product.image, 'https://images.asda.com/chicken.jpg');

  const status = await catalogueStatus();
  assert.equal(status.healthy, true);
  assert.equal(status.products_saved, 120);
});

test.after(async () => {
  await rm(directory, { recursive: true, force: true });
});
