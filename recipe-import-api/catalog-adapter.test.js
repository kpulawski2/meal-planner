import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
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
sampleProducts[2].packUnit = 'ml';
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
  refreshed_at: '2000-01-01T06:00:00Z',
}));

const { searchCatalog, recommendCatalogItems, calculatePackPurchase, rankCatalogCandidates, clearCatalogCache, fetchProductPage, catalogueStatus } = await import(`./catalog-adapter.js?catalogue-test=${Date.now()}`);

test('plain and sweet potatoes remain separate ingredients even when the wrong type is cheaper', () => {
  const regular = { name: 'ASDA White Potatoes 2kg', category: 'Fresh Vegetables > Potatoes',
    url: 'https://www.asda.com/groceries/product/potatoes/991', packQuantity: 2000, packUnit: 'g', price: 1.2 };
  const sweet = { ...regular, name: 'ASDA Sweet Potatoes 500g', url: 'https://www.asda.com/groceries/product/sweet-potatoes/992', packQuantity: 500, price: .2 };
  assert.equal(rankCatalogCandidates('Potato', [sweet]).length, 0);
  assert.equal(rankCatalogCandidates('Potato', [regular]).length, 1);
  assert.equal(rankCatalogCandidates('Sweet potato', [regular]).length, 0);
  assert.equal(rankCatalogCandidates('Sweet potato', [sweet]).length, 1);
});

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
  assert.equal(cucumber.plan.totalCostGBP, 0.99);
  assert.equal(cucumber.plan.estimatedQuantity, true, 'variable produce weights must be an explicit cooking estimate');
  assert.match(cucumber.plan.estimateNotes[0], /300 g.*actual weight varies/);

  const chicken = results.recommendations.find(row => row.key === 'chicken breast::mass');
  assert.equal(chicken.confidence, 'high');
  assert.equal(chicken.plan.totalCostGBP, 11.77);
  assert.equal(chicken.plan.totalQuantity, 1600);
  assert.deepEqual(new Set(chicken.plan.products.map(product => product.productName)), new Set([
    'ASDA British Chicken Breast Fillets 1kg', 'ASDA British Chicken Breast Fillets 600g',
  ]));
  assert.ok(!chicken.match.productName.includes('Thai'), 'plain chicken breast should not auto-select a flavoured ready-to-cook variant');
});

test('pack optimization combines different sizes and preserves fractional requested amounts', () => {
  const makePack = (size, price, unit = 'g') => ({ name: `Plain pack ${size}`, url: `https://www.asda.com/groceries/product/plain/${size}`, packQuantity: size, packUnit: unit, price });
  const plan = calculatePackPurchase([makePack(1000, 7), makePack(600, 4.3), makePack(900, 7.1)], 1500, 'mass');
  assert.equal(plan.totalCostGBP, 11.3);
  assert.equal(plan.totalQuantity, 1600);
  assert.equal(plan.leftoverQuantity, 100);
  assert.deepEqual(new Set(plan.products.map(row => row.packQuantity)), new Set([600, 1000]));
  const fraction = calculatePackPurchase([makePack(3, 1, 'pieces')], 2.5, 'count');
  assert.equal(fraction.requestedQuantity, 2.5);
  assert.equal(fraction.leftoverQuantity, 0.5);
  const pint = calculatePackPurchase([makePack(568.26125, 0.85, 'ml')], 568.1, 'volume');
  assert.equal(pint.products[0].packs, 1, 'a fractional UK pint capacity must not be rounded down to require two packs');
  assert.equal(pint.totalCostGBP, 0.85);
  assert.ok(pint.totalQuantity >= 568.1);
  const twoPints = calculatePackPurchase([makePack(568.26125, 0.85, 'ml')], 1136.52, 'volume');
  assert.equal(twoPints.products[0].packs, 2);
  const almostFullPint = calculatePackPurchase([makePack(568.26125, 0.85, 'ml')], 568.26125, 'volume');
  assert.equal(almostFullPint.products[0].packs, 1);
});

test('an old publication date does not reload the validated catalogue on every request', async () => {
  await searchCatalog('Asda', 'cucumber');
  const saved = await readFile(process.env.ASDA_CATALOGUE_PATH, 'utf8');
  try {
    await writeFile(process.env.ASDA_CATALOGUE_PATH, 'temporarily unreadable snapshot');
    const result = await searchCatalog('Asda', 'cucumber');
    assert.equal(result.indexSize, 120, 'the in-memory catalogue TTL starts when it was loaded, not when ASDA published it');
    assert.equal(result.results[0].productName, 'ASDA Cucumber');
  } finally {
    await writeFile(process.env.ASDA_CATALOGUE_PATH, saved);
    clearCatalogCache('Asda');
  }
});

test('count pack labels automatically price fractional fruit quantities', () => {
  const apples = { name: 'ASDA Organic 6 Apples', url: 'https://www.asda.com/groceries/product/apples/6-apples/123',
    category: 'Fresh Fruit, Vegetables & Flowers > Fresh Fruit > Apples', packSize: '6PK', packQuantity: null, packUnit: null, price: 1.8 };
  const plan = calculatePackPurchase([apples], 0.5, 'count');
  assert.equal(plan.products[0].packs, 1);
  assert.equal(plan.products[0].packQuantity, 6);
  assert.equal(plan.totalQuantity, 6);
  assert.equal(plan.totalCostGBP, 1.8);
  assert.equal(plan.estimatedQuantity, false, 'the pack itself explicitly declares the item count');
});

test('explicitly unavailable products do not claim an automatic ingredient match', () => {
  const milk = { name: 'ASDA Semi Skimmed Milk 2L', category: 'Chilled Food > Fresh Milk > Semi Skimmed Milk',
    url: 'https://www.asda.com/groceries/product/milk/123', packQuantity: 2000, packUnit: 'ml', price: 1.65 };
  for (const status of [{ available: false }, { availability: 'out_of_stock' }, { availability: 'https://schema.org/OutOfStock' }, { availability: 'unavailable' }]) {
    assert.equal(rankCatalogCandidates('Milk', [{ ...milk, ...status }]).length, 0);
    assert.equal(calculatePackPurchase([{ ...milk, ...status }], 100, 'volume'), null);
  }
  assert.equal(rankCatalogCandidates('Milk', [{ ...milk, availability: 'listed_online' }]).length, 1,
    'online-listed products remain usable when store-specific stock is unknown');
});

test('invalid sub-penny product prices cannot create a zero-cost optimisation step', () => {
  const plan = calculatePackPurchase([{ name: 'Invalid price', packQuantity: 568.26125, packUnit: 'ml', price: 0.001 }], 100, 'volume');
  assert.equal(plan, null);
});

test.after(async () => {
  await rm(directory, { recursive: true, force: true });
});
