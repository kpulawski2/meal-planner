import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import '../public/personal-prices-core.js';

const core = globalThis.PersonalPricesCore;
const options = { now: new Date('2026-10-15T17:00:00Z') };
const pack = (patch = {}) => ({ store: 'Lidl', ingredient: 'Rolled oats', productName: 'Crownfield Porridge Oats', packQuantity: '1', packUnit: 'kg', priceGBP: '1.09', checkedAt: '2026-10-15', source: 'receipt', branch: 'Alison Crescent, Sheffield S2 1AS', ...patch });
function storage(initial) {
  let value = initial ?? null;
  return { getItem() { return value; }, setItem(key, next) { value = next; }, value() { return value; } };
}

test('a checked pack stays personal, preserves its real date and normalises explicit units without inventing conversions', () => {
  const row = core.normalize(pack({ url: 'https://example.test/fake-official-product', official: true, estimatedPrice: false }), options);
  assert.equal(row.packQuantity, 1000); assert.equal(row.packUnit, 'g'); assert.equal(row.priceGBP, 1.09);
  assert.equal(row.checkedAt, '2026-10-15'); assert.equal(row.source, 'receipt'); assert.match(row.id, /^personal-lidl-[a-f0-9]{16}$/);
  assert.equal(row.url, undefined); assert.equal(row.official, undefined); assert.equal(row.estimatedPrice, undefined);
  assert.equal(core.compatible(row, 'mass', options), true); assert.equal(core.compatible(row, 'volume', options), false);
  const milk = core.normalize(pack({ packQuantity: 1.5, packUnit: 'l' }), options);
  assert.equal(milk.packQuantity, 1500); assert.equal(milk.packUnit, 'ml'); assert.equal(core.compatible(milk, 'volume', options), true);
  const eggs = core.normalize(pack({ packQuantity: 6, packUnit: 'pieces' }), options);
  assert.equal(core.compatible(eggs, 'each', options), true); assert.equal(core.compatible(eggs, 'mass', options), false);
  assert.equal(core.normalize({ ...row }, options).id, row.id, 'the same normalised pack remains stable after backup restore');
});

test('invalid or ambiguous prices, pack sizes, sources and stores cannot become a usable pack', () => {
  for (const priceGBP of [0, -1, null, '', ' ', false, NaN, Infinity, 'Infinity', '1e3', '1,09', '£1.09', '1.001', 10000.01]) assert.throws(() => core.normalize(pack({ priceGBP }), options));
  for (const packQuantity of [0, -1, null, '', false, NaN, Infinity, 1000001, 'two']) assert.throws(() => core.normalize(pack({ packQuantity, packUnit: 'g' }), options));
  for (const packUnit of ['pint', 'tbsp', 'tsp', 'portion', 'toString', '__proto__', '', null]) assert.throws(() => core.normalize(pack({ packUnit }), options));
  assert.throws(() => core.normalize(pack({ packQuantity: 1.5, packUnit: 'pieces' }), options));
  assert.throws(() => core.normalize(pack({ packQuantity: 1001, packUnit: 'kg' }), options));
  assert.throws(() => core.normalize(pack({ source: 'website' }), options));
  assert.throws(() => core.normalize(pack({ store: 'Asda' }), options));
  assert.throws(() => core.normalize(pack({ id: 'real-lidl-product-123' }), options));
  assert.throws(() => core.normalize(pack({ ingredient: 'Rice\nChicken' }), options));
});

test('calendar validation uses the London day, rejects future checks and excludes stale prices only from planning', () => {
  assert.equal(core.validDate('2024-02-29'), true); assert.equal(core.validDate('2026-02-29'), false);
  assert.equal(core.today(new Date('2026-10-15T23:30:00Z')), '2026-10-16', 'BST midnight is respected');
  for (const checkedAt of ['2026-10-16', '2026-02-30', '15/10/2026', '1999-12-31', '']) assert.throws(() => core.normalize(pack({ checkedAt }), options));
  const recent = core.normalize(pack({ checkedAt: '2026-10-01' }), options), ageing = core.normalize(pack({ productName: 'Another oat pack', checkedAt: '2026-09-01' }), options), stale = core.normalize(pack({ productName: 'Old oat pack', checkedAt: '2026-01-01' }), options);
  assert.equal(core.isOld(recent, options), false); assert.equal(core.isOld(ageing, options), true); assert.equal(core.eligible(ageing, options), true); assert.equal(core.eligible(stale, options), false);
  const snapshot = { schemaVersion: 1, includeInPlanning: true, prices: [recent, ageing, stale] };
  assert.equal(core.normalizeSnapshot(snapshot, options).prices.length, 3, 'older observations remain available for review');
  assert.equal(core.requestPayload(snapshot, { store: 'Lidl', ...options }).personalPrices.length, 2);
});

test('personal pack capacity permits explicit native units and only labelled, bounded cooking densities', () => {
  assert.deepEqual(core.purchaseQuantity(pack(), 'mass', options), { capacity: 1000, estimatedQuantity: false, quantityBasis: null });
  for (const dimension of ['each', 'count']) assert.equal(core.purchaseQuantity(pack({ packQuantity: 6, packUnit: 'pieces' }), dimension, options).capacity, 6);
  for (const [ingredient, density] of [['Olive oil', .92], ['Honey', 1.42], ['Mayonnaise', 1], ['Skimmed milk', 1]]) {
    const volume = core.purchaseQuantity(pack({ ingredient, packQuantity: 500, packUnit: 'ml' }), 'mass', options);
    assert.equal(volume.capacity, 500 * density); assert.equal(volume.estimatedQuantity, true); assert.match(volume.quantityBasis, /Estimated density/);
    const mass = core.purchaseQuantity(pack({ ingredient, packQuantity: 500 * density, packUnit: 'g' }), 'volume', options);
    assert.ok(Math.abs(mass.capacity - 500) < .000001);
  }
  for (const ingredient of ['Rolled oats', 'Chicken breast', 'Milk powder', 'Stock cubes', 'Sauce concentrate', 'Oily seasoning', 'Mayonnaisewood']) assert.equal(core.purchaseQuantity(pack({ ingredient, packQuantity: 500, packUnit: 'g' }), 'volume', options), null, ingredient);
  assert.equal(core.purchaseQuantity(pack({ ingredient: 'Cucumber', packQuantity: 1, packUnit: 'pieces' }), 'mass', options), null, 'an observed item count does not establish its edible mass');
  assert.deepEqual(core.purchaseQuantity(pack({ ingredient: 'Sauerkraut', packQuantity: 300, packUnit: 'g' }), 'mass', options), { capacity: 300, estimatedQuantity: false, quantityBasis: null }, 'a shopper can explicitly record drained edible weight');
});

test('saving, correcting and removing a pack survives reload without enabling planning implicitly', () => {
  const saved = storage();
  assert.deepEqual(core.read(saved, options).snapshot, core.empty());
  assert.equal(core.upsert(pack(), saved, options).ok, true);
  let result = core.read(saved, options);
  assert.equal(result.snapshot.includeInPlanning, false); assert.equal(result.snapshot.prices.length, 1);
  assert.deepEqual(core.requestPayload(result.snapshot, { store: 'Lidl', ...options }), {});
  assert.equal(core.upsert(pack({ priceGBP: '1.19', checkedAt: '2026-10-14' }), saved, options).ok, true);
  result = core.read(saved, options);
  assert.equal(result.snapshot.prices.length, 1); assert.equal(result.snapshot.prices[0].priceGBP, 1.19);
  assert.equal(core.setIncluded(true, saved, options).ok, true);
  result = core.read(saved, options);
  const payload = core.requestPayload(result.snapshot, { store: 'Lidl', ...options });
  assert.equal(payload.allowPersonalPrices, true); assert.equal(payload.personalPrices.length, 1);
  assert.deepEqual(core.requestPayload(result.snapshot, { store: 'Asda', ...options }), {}, 'Lidl prices cannot leak into another store');
  payload.personalPrices[0].priceGBP = 0;
  assert.equal(core.read(saved, options).snapshot.prices[0].priceGBP, 1.19, 'request callers cannot mutate persisted prices');
  assert.equal(core.remove(result.snapshot.prices[0].id, saved, options).ok, true);
  assert.equal(core.read(saved, options).snapshot.prices.length, 0);
});

test('damaged, duplicate or inaccessible storage is reported without destroying existing observations', () => {
  const damaged = storage('{broken'), before = damaged.value();
  assert.equal(core.read(damaged, options).ok, false);
  assert.equal(core.upsert(pack(), damaged, options).ok, false);
  assert.equal(damaged.value(), before);
  const row = core.normalize(pack(), options), duplicate = storage(JSON.stringify({ schemaVersion: 1, includeInPlanning: true, prices: [row, row] }));
  const original = duplicate.value();
  assert.equal(core.remove(row.id, duplicate, options).ok, false); assert.equal(duplicate.value(), original);
  const existing = storage(JSON.stringify({ schemaVersion: 1, includeInPlanning: true, prices: [row] }));
  const failing = { getItem: existing.getItem, setItem() { throw new Error('Storage quota exceeded'); } };
  assert.equal(core.upsert(pack({ priceGBP: 2 }), failing, options).ok, false);
  assert.equal(core.read(existing, options).snapshot.prices[0].priceGBP, 1.09);
  const blocked = { getItem() { throw new Error('Access denied'); } };
  assert.equal(core.read(blocked, options).ok, false);
  assert.equal(core.setIncluded(true, blocked, options).ok, false);
});

test('a returned personal price must match the opted-in pack and requested ingredient and dimension', () => {
  const row = core.normalize(pack(), options), product = { url: 'personal:lidl/' + row.id, personalPriceId: row.id, productName: row.productName, personalIngredient: row.ingredient, personalSource: row.source, personalBranch: row.branch, personalCheckedAt: row.checkedAt, checkedAt: row.checkedAt, priceGBP: row.priceGBP, packQuantity: row.packQuantity, packUnit: row.packUnit, estimatedPrice: true, priceBasis: 'personal', priceSource: 'Your Lidl receipt price', priceSourceUrl: null };
  const context = { store: 'Lidl', dimension: 'mass', ingredient: 'Rolled oats', prices: [row], ...options };
  assert.equal(core.productMatches(product, context), true);
  assert.deepEqual(core.productCapacity(product, context), { capacity: 1000, estimatedQuantity: false, quantityBasis: null });
  const purchase = { ...product, packs: 2, totalQuantity: 2000, costGBP: 2.18, estimatedQuantity: false, quantityBasis: null };
  assert.equal(core.productMatches(purchase, context), true);
  for (const patch of [{ totalQuantity: 3000 }, { costGBP: .01 }, { packs: 1.5 }, { estimatedQuantity: true }, { quantityBasis: 'An unsupported conversion' }]) assert.equal(core.productMatches({ ...purchase, ...patch }, context), false);
  for (const patch of [{ url: 'https://www.lidl.co.uk/p/oats/p123' }, { personalPriceId: 'personal-lidl-forged' }, { priceGBP: 0.01 }, { packQuantity: 2000 }, { personalIngredient: 'Chicken breast' }, { personalSource: 'website' }, { personalBranch: 'Another store' }, { checkedAt: '2026-10-14' }, { estimatedPrice: false }, { priceBasis: 'website' }, { priceSourceUrl: 'https://evil.test' }]) assert.equal(core.productMatches({ ...product, ...patch }, context), false);
  assert.equal(core.productMatches(product, { ...context, store: 'Asda' }), false);
  assert.equal(core.productMatches(product, { ...context, dimension: 'volume' }), false);
  assert.equal(core.productMatches(product, { ...context, ingredient: 'Chicken breast' }), false);
  assert.equal(core.productMatches(product, { ...context, prices: [] }), false);
  assert.equal(core.productCapacity(product, { ...context, prices: [] }), null);
  const stale = core.normalize(pack({ checkedAt: '2026-01-01' }), options);
  assert.equal(core.productMatches({ ...product, checkedAt: stale.checkedAt, personalCheckedAt: stale.checkedAt }, { ...context, prices: [stale] }), false);
  const oil = core.normalize(pack({ ingredient: 'Olive oil', packQuantity: 500, packUnit: 'ml' }), options);
  const meta = core.purchaseQuantity(oil, 'mass', options);
  const oilProduct = { ...product, personalPriceId: oil.id, url: 'personal:lidl/' + oil.id, personalIngredient: oil.ingredient, packQuantity: oil.packQuantity, packUnit: oil.packUnit, packs: 2, totalQuantity: 920, costGBP: 2.18, estimatedQuantity: true, quantityBasis: meta.quantityBasis };
  const oilContext = { ...context, ingredient: 'Olive oil', prices: [oil] };
  assert.equal(core.productMatches(oilProduct, oilContext), true);
  assert.equal(core.productMatches({ ...oilProduct, estimatedQuantity: false }, oilContext), false);
  assert.equal(core.productMatches({ ...oilProduct, quantityBasis: '' }, oilContext), false);
  assert.equal(core.productMatches({ ...oilProduct, totalQuantity: 1000 }, oilContext), false);
});

test('the notebook escapes product, ingredient and store text and labels observations as personal', async () => {
  const script = await readFile(new URL('../public/personal-prices-ui.js', import.meta.url), 'utf8');
  const elements = new Map();
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', checked: false, focus() {} }); return elements.get(id); } };
  let opened = '';
  const row = core.normalize(pack({ productName: '<img src=x onerror=alert(1)>', ingredient: '"><script>alert(2)</script>', branch: 'Shop <b>address</b>' }), options);
  const context = vm.createContext({ document, PersonalPricesCore: { today: () => '2026-10-15', ageDays: () => 200, read: () => ({ ok: true, snapshot: { includeInPlanning: false, prices: [row] } }) } });
  vm.runInContext(script, context);
  context.PersonalPricesUI.configure({ open(value) { opened = value; }, close() {}, ingredientNames() { return ['"><img src=x>']; } });
  context.PersonalPricesUI.open('"><svg onload=alert(3)>');
  assert.ok(opened.includes('&quot;&gt;&lt;svg')); assert.ok(!opened.includes('<svg onload'));
  assert.ok(opened.includes('not verified website prices'));
  const rows = elements.get('personalPriceRows').innerHTML;
  assert.ok(rows.includes('&lt;img')); assert.ok(!rows.includes('<img')); assert.ok(!rows.includes('<script>'));
  assert.ok(rows.includes('Your receipt price')); assert.ok(rows.includes('excluded from planning'));
});
