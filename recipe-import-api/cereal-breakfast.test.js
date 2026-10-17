import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readRecipeLibrary } from './recipe-fixtures.js';

const ingredient = 'FUEL10K Chocolate Multigrain Flakes';
const productUrl = 'https://www.asda.com/groceries/product/family-cereals/fuel-fuel10k-chocolate-multigrain-flakes-high-protein-breakfast-cereal-350g/9184193';

test('the shipped cereal breakfast includes milk nutrition and measured quantities', async () => {
  const recipe = (await readRecipeLibrary()).find(row => row.id === 'everyday-fuel10k-chocolate-flakes-milk');
  assert.ok(recipe);
  assert.equal(recipe.cat, 'Breakfast');
  assert.equal(recipe.servings, 1);
  assert.deepEqual(recipe.ings, [[ingredient, 50, 'g'], ['Skimmed milk', 200, 'ml']]);
  assert.equal(recipe.nutrition.complete, true);
  // 50 g of the exact cereal label plus 200 ml of the shared skimmed milk.
  assert.equal(recipe.nutrition.kcal, 265);
  assert.equal(recipe.nutrition.p, 19.7);
  assert.equal(recipe.nutrition.c, 40);
  assert.equal(recipe.nutrition.f, 2.6);
  assert.equal(recipe.nutrition.matched, 2);
  assert.equal(recipe.nutrition.source, 'ingredients');
  assert.equal(recipe.source, productUrl);
  assert.match(recipe.modifications, /wheat, barley, milk and soya/);
  assert.equal(recipe.method.length, 2);
});

test('the pricing chart retains the exact ASDA pack, date and store across exports', async () => {
  const chart = JSON.parse(await readFile(new URL('../public/price-reference-catalog.json', import.meta.url), 'utf8'));
  const entry = chart.ingredients.find(row => row.ingredient === ingredient);
  const asda = entry.retailers.find(row => row.retailer === 'Asda');
  assert.deepEqual([asda.size, asda.unit, asda.priceGBP, asda.priceCheckedDate], [350, 'g', 2.5, '2026-10-16']);
  assert.equal(asda.productUrl, productUrl);
  assert.equal(entry.retailers.find(row => row.retailer === 'Aldi').priceGBP, null);
  assert.ok(!entry.retailers.some(row => row.retailer === 'Lidl'));
  const snapshot = chart.currentPriceSnapshots.find(row => row.ingredient === ingredient);
  assert.deepEqual([snapshot.store, snapshot.size, snapshot.unit, snapshot.priceGBP, snapshot.checkedAt], ['Asda', 350, 'g', 2.5, '2026-10-16']);
  assert.equal(snapshot.productUrl, productUrl);
  assert.equal(chart.ingredientCount, chart.ingredients.length);
  assert.equal(chart.pricedSnapshotCount, chart.currentPriceSnapshots.length);
  assert.equal(chart.directProductPageCount, chart.ingredients.flatMap(row => row.retailers).filter(row => row.productUrl).length);
  for (const file of ['price-reference-catalog.csv', 'price-reference-snapshots.csv']) {
    const csv = await readFile(new URL('../public/' + file, import.meta.url), 'utf8');
    const row = csv.split(/\r?\n/).find(line => line.startsWith(ingredient + ',Asda,'));
    assert.ok(row);
    assert.ok(row.includes(productUrl));
    assert.match(row, /,350 g,2\.50,/);
    assert.ok(row.includes('2026-10-16'));
  }
});
