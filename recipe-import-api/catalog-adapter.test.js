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
    priceRegion: 'EN',
    pricesByRegion: { EN: { price: chicken ? 7.25 : 1.25 }, SC: { price: chicken ? 7.1 : 1.2 } },
    nutritionClaims: chicken ? ['High protein'] : [],
    availability: 'in_stock',
    available: true,
    image: chicken ? 'https://images.asda.com/chicken.jpg' : null,
    nutrition: chicken ? { protein: '23g' } : null,
    url: `https://www.asda.com/groceries/product/chicken/${sku}`,
    checkedAt: '2026-10-07T06:00:00Z',
  };
});

sampleProducts[2].name = 'ASDA Semi Skimmed Milk 2L';
sampleProducts[2].category = 'Chilled Food > Milk';
sampleProducts[2].packSize = '2 L';
sampleProducts[2].packQuantity = 2000;
sampleProducts[2].price = 1.65;
sampleProducts[2].pricesByRegion.EN.price = 1.65;
sampleProducts[2].pricesByRegion.SC.price = 1.6;
sampleProducts[2].nutritionClaims = [];
sampleProducts[3].name = 'ASDA Milk Chocolate Bar 100g';
sampleProducts[3].category = 'Sweets, Treats & Snacks';
sampleProducts[4].name = 'ASDA Frozen Chicken Breast Fillets 1kg';
sampleProducts[4].category = 'Frozen Food > Frozen Chicken & Meat > Chicken Breast';
sampleProducts[1].nutritionClaims = ['NoMilk'];
Object.assign(sampleProducts[5], {
  name: 'ASDA Baby Plum Tomatoes 300g',
  category: 'Fresh Fruit, Vegetables & Flowers > Fresh Salad & Stir Fry > Tomatoes',
  packSize: '300g', packQuantity: 300, packUnit: 'g', price: 1,
});
Object.assign(sampleProducts[6], {
  name: 'ASDA Classic Tomato Ketchup 550g',
  category: 'Food Cupboard > Condiments & Cooking Ingredients > Sauces & Condiments > Tomato Ketchup',
  packSize: '550g', packQuantity: 550, packUnit: 'g', price: 0.95,
});
Object.assign(sampleProducts[7], {
  name: 'COOK by ASDA Ground Cinnamon 34g',
  category: 'Food Cupboard > Condiments & Cooking Ingredients > Spices',
  packSize: '34g', packQuantity: 34, packUnit: 'g', price: 0.95,
});
Object.assign(sampleProducts[8], {
  name: 'Millions Cinnamon Sweets',
  category: 'Food Cupboard > Chocolates & Sweets > Sweets > Boiled Sweets',
  packSize: '90g', packQuantity: 90, packUnit: 'g', price: 1,
});

await writeFile(process.env.ASDA_CATALOGUE_PATH, JSON.stringify(sampleProducts));
await writeFile(process.env.ASDA_CATALOGUE_META_PATH, JSON.stringify({
  status: 'complete',
  products_saved: sampleProducts.length,
  products_expected: sampleProducts.length,
  coverage: 1,
  category_count: 10,
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
  assert.equal(result.results[0].priceRegion, 'EN');
  assert.equal(result.results[0].pricesByRegion.SC.price, 7.1);
  assert.deepEqual(result.results[0].nutritionClaims, ['High protein']);
  assert.equal(result.results[0].nutrition.protein, '23g');

  const milkResult = await searchCatalog('Asda', 'milk', 8);
  assert.equal(milkResult.results[0].productName, 'ASDA Semi Skimmed Milk 2L');
  assert.ok(milkResult.results.every(row => row.productName.toLowerCase().includes('milk')));

  const chickenResult = await searchCatalog('Asda', 'chicken breast', 8);
  assert.equal(chickenResult.results[0].productName, 'ASDA British Chicken Breast Fillets 1kg');

  const tomatoResult = await searchCatalog('Asda', 'tomato', 8, 'mass');
  assert.equal(tomatoResult.results[0].productName, 'ASDA Baby Plum Tomatoes 300g');
  const cinnamonResult = await searchCatalog('Asda', 'cinnamon', 8, 'mass');
  assert.equal(cinnamonResult.results[0].productName, 'COOK by ASDA Ground Cinnamon 34g');

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
