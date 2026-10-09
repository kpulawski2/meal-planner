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
Object.assign(sampleProducts[9], {
  name: 'ASDA Cucumber',
  category: 'Fresh Fruit, Vegetables & Flowers > Fresh Salad & Stir Fry > Cucumbers',
  packSize: 'EACH', packQuantity: null, packUnit: null, price: 0.99,
  url: 'https://www.asda.com/groceries/product/cucumbers/asda-cucumber/152446',
});
Object.assign(sampleProducts[10], {
  name: 'ASDA Mini Cucumbers 200g',
  category: 'Fresh Fruit, Vegetables & Flowers > Fresh Salad & Stir Fry > Cucumbers',
  packSize: '200g', packQuantity: 200, packUnit: 'g', price: 1.1,
  url: 'https://www.asda.com/groceries/product/cucumbers/asda-mini-cucumbers-200g/7027816',
});
Object.assign(sampleProducts[11], {
  name: 'ASDA Cucumber Portion 190g',
  category: 'Fresh Fruit, Vegetables & Flowers > Fresh Salad & Stir Fry > Cucumbers',
  packSize: 'EACH', packQuantity: null, packUnit: null, price: 0.68,
  url: 'https://www.asda.com/groceries/product/cucumbers/asda-cucumber-portion-190g/150425',
});
Object.assign(sampleProducts[12], {
  name: 'ASDA British Chicken Breast Fillets 600g',
  category: 'Meat, Poultry & Fish > Meat & Poultry > Chicken & Turkey > Chicken Breasts',
  packSize: '600G', packQuantity: 600, packUnit: 'g', price: 4.52,
  url: 'https://www.asda.com/groceries/product/chicken-breasts/asda-british-chicken-breast-fillets-600g/7648521',
});
Object.assign(sampleProducts[13], {
  name: 'ASDA British Chicken Breast Fillets 2kg',
  category: 'Meat, Poultry & Fish > Meat & Poultry > Chicken & Turkey > Chicken Breasts',
  packSize: '2KG', packQuantity: 2000, packUnit: 'g', price: 13.25,
  url: 'https://www.asda.com/groceries/product/chicken-breasts/asda-british-chicken-breast-fillets-2kg/9060292',
});
Object.assign(sampleProducts[14], {
  name: 'ASDA Limited Edition 4 Green Thai Chicken Breast Sizzle Steaks',
  category: 'Meat, Poultry & Fish > Meat & Poultry > Chicken & Turkey > Chicken Breasts',
  packSize: '387G', packQuantity: 387, packUnit: 'g', price: 2,
  url: 'https://www.asda.com/groceries/product/chicken-breasts/thai-chicken-sizzle-steaks/900014',
});
Object.assign(sampleProducts[4], {
  packSize: '500G', packQuantity: 500, packUnit: 'g', price: 4.25,
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

const { searchCatalog, recommendCatalogItems, fetchProductPage, catalogueStatus } = await import(`./catalog-adapter.js?catalogue-test=${Date.now()}`);

test('ASDA matching uses the validated full catalogue and returns saved product details', async () => {
  const result = await searchCatalog('Asda', 'chicken breast', 8);
  const oneKgChicken = result.results.find(row => row.productName === 'ASDA British Chicken Breast Fillets 1kg');
  assert.equal(result.source, 'validated ASDA catalogue snapshot');
  assert.equal(result.indexSize, 120);
  assert.ok(oneKgChicken);
  assert.equal(oneKgChicken.priceGBP, 7.25);
  assert.equal(oneKgChicken.packSize, '1 kg');
  assert.equal(oneKgChicken.gtin, null);
  assert.equal(oneKgChicken.priceRegion, 'EN');
  assert.equal(oneKgChicken.pricesByRegion.SC.price, 7.1);
  assert.deepEqual(oneKgChicken.nutritionClaims, ['High protein']);
  assert.equal(oneKgChicken.nutrition.protein, '23g');

  const milkResult = await searchCatalog('Asda', 'milk', 8);
  assert.equal(milkResult.results[0].productName, 'ASDA Semi Skimmed Milk 2L');
  assert.ok(milkResult.results.every(row => row.productName.toLowerCase().includes('milk')));

  const chickenResult = await searchCatalog('Asda', 'chicken breast', 8);
  assert.ok(chickenResult.results.some(row => row.productName === 'ASDA British Chicken Breast Fillets 1kg'));

  const tomatoResult = await searchCatalog('Asda', 'tomato', 8, 'mass');
  assert.equal(tomatoResult.results[0].productName, 'ASDA Baby Plum Tomatoes 300g');
  const cinnamonResult = await searchCatalog('Asda', 'cinnamon', 8, 'mass');
  assert.equal(cinnamonResult.results[0].productName, 'COOK by ASDA Ground Cinnamon 34g');

  const product = await fetchProductPage('Asda', oneKgChicken.url);
  assert.equal(product.priceGBP, 7.25);
  assert.equal(product.verified, true);
  assert.equal(product.brand, 'ASDA');
  assert.equal(product.image, 'https://images.asda.com/chicken.jpg');

  const status = await catalogueStatus();
  assert.equal(status.healthy, true);
  assert.equal(status.products_saved, 120);
});

test('automatic recommendations select plain cucumber and optimize chicken breast packs', async () => {
  const results = await recommendCatalogItems('Asda', [
    { key: 'cucumber::mass', name: 'Cucumber', dimension: 'mass', quantity: 150 },
    { key: 'chicken breast::mass', name: 'Chicken breast', dimension: 'mass', quantity: 1500 },
  ]);
  const cucumber = results.recommendations.find(row => row.key === 'cucumber::mass');
  assert.equal(cucumber.match.productName, 'ASDA Cucumber');
  assert.equal(cucumber.match.priceGBP, 0.99);
  assert.equal(cucumber.match.packUnit, 'pieces');
  assert.equal(cucumber.plan, null, 'do not convert a variable-weight cucumber sold by each into grams');

  const chicken = results.recommendations.find(row => row.key === 'chicken breast::mass');
  assert.equal(chicken.confidence, 'high');
  assert.equal(chicken.plan.totalCostGBP, 13.25);
  assert.equal(chicken.plan.totalQuantity, 2000);
  assert.deepEqual(chicken.plan.products.map(product => [product.productName, product.packs]), [
    ['ASDA British Chicken Breast Fillets 2kg', 1],
  ]);
  assert.ok(!chicken.match.productName.includes('Thai'), 'plain chicken breast should not auto-select a flavoured ready-to-cook variant');
});

test.after(async () => {
  await rm(directory, { recursive: true, force: true });
});
