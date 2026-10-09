import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

test('catalogue worker shares its snapshot, handles cancellation, and recovers after a failed load', { timeout: 20_000 }, async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'meal-catalogue-worker-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  process.env.ASDA_CATALOGUE_PATH = path.join(directory, 'products.json');
  process.env.ASDA_CATALOGUE_META_PATH = path.join(directory, 'meta.json');
  const products = Array.from({ length: 120 }, (_, index) => ({
    name: index === 0 ? 'ASDA Cucumber' : index === 1 ? 'ASDA Chicken Breast Fillets' : `ASDA Grocery ${index}`,
    brand: 'ASDA',
    category: index === 0 ? 'Fresh Vegetables > Cucumbers' : index === 1 ? 'Meat, Poultry & Fish > Chicken Breasts' : 'Food Cupboard',
    url: `https://www.asda.com/groceries/product/grocery/${index}`,
    packQuantity: index === 0 ? 1 : 2000, packUnit: index === 0 ? 'pieces' : 'g',
    price: index === 0 ? 0.99 : 13.25,
  }));
  const saved = JSON.stringify(products);
  await writeFile(process.env.ASDA_CATALOGUE_PATH, saved);
  await writeFile(process.env.ASDA_CATALOGUE_META_PATH, JSON.stringify({ status: 'complete', products_saved: 120, products_expected: 120, coverage: 1, refreshed_at: '2000-01-01T00:00:00Z' }));
  const service = await import('./catalog-service.js');
  assert.equal(service.cachedCatalogueStatus().status, 'not_loaded');
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(service.recommendCatalogItems('Asda', [], { signal: cancelled.signal }), { name: 'AbortError' });
  const [batch, status] = await Promise.all([
    service.recommendCatalogItems('Asda', [{ key: 'chicken', name: 'Chicken breast', dimension: 'mass', quantity: 1500 }]),
    service.catalogueStatus(),
  ]);
  assert.equal(status.healthy, true);
  assert.equal(batch.indexSize, 120);
  assert.equal(batch.recommendations[0].plan.totalQuantity, 2000);
  const controller = new AbortController();
  const interrupted = service.recommendCatalogItems('Asda', Array.from({ length: 200 }, (_, key) => ({ key: String(key), name: 'Chicken breast', dimension: 'mass', quantity: 1500 })), { signal: controller.signal });
  controller.abort();
  await assert.rejects(interrupted, { name: 'AbortError' });
  assert.equal((await service.searchCatalog('Asda', 'cucumber')).results[0].productName, 'ASDA Cucumber');
  assert.equal(service.cachedCatalogueStatus().healthy, true);
  await service.clearCatalogCache('Asda');
  await writeFile(process.env.ASDA_CATALOGUE_PATH, 'invalid json');
  await assert.rejects(service.searchCatalog('Asda', 'cucumber'), /complete ASDA catalogue/);
  await writeFile(process.env.ASDA_CATALOGUE_PATH, saved);
  assert.equal((await service.searchCatalog('Asda', 'cucumber')).indexSize, 120);
  assert.equal(service.cachedCatalogueStatus().healthy, true);
});
