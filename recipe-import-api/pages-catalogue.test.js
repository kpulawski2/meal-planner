import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const start = html.indexOf('const productMatchCache = new Map();');
const end = html.indexOf('function mealCard(', start);
assert.ok(start >= 0 && end > start, 'the Pages catalogue matcher is present');

const products = [
  { name: 'ASDA Baby Plum Tomatoes 300g', category: 'Fresh Fruit, Vegetables & Flowers > Fresh Salad & Stir Fry > Tomatoes', availability: 'listed_online', packQuantity: 300, packUnit: 'g', price: 1 },
  { name: 'ASDA Classic Tomato Ketchup 550g', category: 'Food Cupboard > Condiments & Cooking Ingredients > Tomato Ketchup', availability: 'listed_online', packQuantity: 550, packUnit: 'g', price: 0.95 },
  { name: 'ASDA Chopped Tomatoes 400g', category: 'Food Cupboard > Tinned Food > Tinned Tomatoes', availability: 'listed_online', packQuantity: 400, packUnit: 'g', price: 0.47 },
  { name: 'COOK by ASDA Ground Cinnamon 34g', category: 'Food Cupboard > Condiments & Cooking Ingredients > Spices', availability: 'listed_online', packQuantity: 34, packUnit: 'g', price: 0.95 },
  { name: 'Millions Cinnamon Sweets', category: 'Food Cupboard > Chocolates & Sweets > Sweets > Boiled Sweets', availability: 'listed_online', packQuantity: 90, packUnit: 'g', price: 1 },
  { name: 'ASDA 6 Bananas', category: 'Fresh Fruit, Vegetables & Flowers > Fresh Fruit > Bananas', availability: 'listed_online', packQuantity: 6, packUnit: 'pieces', price: 0.94 },
  { name: 'ASDA Banana Chips 75g', category: 'Fresh Fruit, Vegetables & Flowers > Raw Nuts, Seeds & Dried Fruit > Dried Fruit', availability: 'listed_online', packQuantity: 75, packUnit: 'g', price: 1.25 },
];
const context = { products };
vm.runInNewContext(html.slice(start, end) + '\nglobalThis.findProduct = findProduct;\nglobalThis.recipeCost = recipeCost;\nglobalThis.packCount = packCount;', context);

test('Pages matching favours fresh produce and cooking spices over unrelated products', () => {
  assert.equal(context.findProduct('tomato', 'g').name, 'ASDA Baby Plum Tomatoes 300g');
  assert.equal(context.findProduct('cinnamon', 'g').name, 'COOK by ASDA Ground Cinnamon 34g');
});

test('Pages costing does not divide grams by a pack sold by piece', () => {
  const banana = context.findProduct('banana', 'g');
  assert.equal(banana.name, 'ASDA 6 Bananas');
  assert.equal(context.recipeCost({ ingredients: [{ ingredient: 'banana', quantity: 120, unit: 'g' }] }), 0.94);
  assert.equal(context.packCount(120, 'g', banana), 1);
});
