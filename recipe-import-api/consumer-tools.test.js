import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/consumer-tools.js';
import '../public/budget-core.js';
const core = globalThis.ConsumerTools;
const plan = () => ({ requestedQuantity: 150, totalQuantity: 200, totalCostGBP: 2, products: [{ packs: 1, costGBP: 2, url: 'https://groceries.asda.com/product/1' }] });
const catalogue = () => ({ store: 'Asda', status: 'ready', fingerprint: 'basket-one', loadedAt: 1000, items: [{ key: 'oats::mass', quantity: 150 }], results: { 'oats::mass': { key: 'oats::mass', plan: plan(), match: { productName: 'Oats' } } } });
test('saved basket retains verified whole packs and a checked date', () => {
  const saved = core.snapshot(catalogue());
  assert.equal(saved.version, 1); assert.equal(saved.loadedAt, 1000);
  const restored = core.restore(saved, 'Asda', 'basket-one', 2000);
  assert.equal(restored.offline, true); assert.equal(restored.results['oats::mass'].plan.totalCostGBP, 2);
  saved.results['oats::mass'].plan.products[0].packs = 99;
  assert.equal(restored.results['oats::mass'].plan.products[0].packs, 1);
});
test('saved basket cannot be reused for a changed plan, retailer, or future check', () => {
  const saved = core.snapshot(catalogue());
  assert.equal(core.restore(saved, 'Lidl', 'basket-one', 2000), null);
  assert.equal(core.restore(saved, 'Asda', 'changed', 2000), null);
  assert.equal(core.restore({ ...saved, loadedAt: 100000 }, 'Asda', 'basket-one', 2000), null);
});
test('incomplete or tampered saved prices never become a verified basket', () => {
  for (const mutate of [row => row.status = 'loading', row => row.results = {}, row => row.results['oats::mass'].plan.totalCostGBP = null, row => row.results['oats::mass'].plan.products[0].packs = 0, row => row.results['oats::mass'].plan.products[0].url = 'javascript:alert(1)']) {
    const row = catalogue(); mutate(row); assert.equal(core.snapshot(row), null);
  }
  const row = catalogue(); row.results['oats::mass'].plan = null;
  assert.ok(core.snapshot(row), 'an explicit unpriced ingredient is preserved as unpriced');
});
test('cash spent stays counted when purchases reduce the remaining basket', () => {
  const before = core.budgetSummary({ remaining: 39, complete: true, budget: 45 });
  const after = core.budgetSummary({ remaining: 19, complete: true, spent: 20, budget: 45 });
  assert.equal(before.projected, after.projected); assert.equal(after.left, 6);
  assert.equal(core.budgetSummary({ remaining: 0, complete: false, spent: 20, budget: 45 }).projected, null);
  assert.equal(core.budgetSummary({ remaining: 4, complete: true, spent: 44, budget: 45 }).over, true);
});
test('cooking timers use elapsed wall time after backgrounding', () => {
  assert.equal(core.timerRemaining(121000, 1000), 120);
  assert.equal(core.timerRemaining(121000, 90500), 31);
  assert.equal(core.timerRemaining(121000, 122000), 0);
  assert.equal(core.timerRemaining(null, 1000), 0);
});
test('recorded ingredient values use the original usable pack quantity after stock consumption', () => {
  const state = { pantryLedger: { transactions: [{ type: 'purchase', changes: [{ collection: 'pantry', after: { name: 'Tuna', qty: 204, unit: 'g', product: { costGBP: 1.18 } } }] }] }, pantry: [{ name: 'Tuna', qty: 23.25, unit: 'g' }] };
  assert.equal(core.pantryUnitCost(state, 'Tuna', 'mass'), 1.18 / 204);
  assert.equal(core.pantryUnitCost(state, 'Tuna', 'volume'), null);
  state.pantryLedger.transactions[0].undoneAt = '2026-10-11T12:00:00Z';
  assert.equal(core.pantryUnitCost(state, 'Tuna', 'mass'), null);
});
