import { parentPort } from 'node:worker_threads';
import { optimizeMealPlan } from './budget-planner.js';
import {
  searchCatalog,
  recommendCatalogItems,
  fetchProductPage,
  catalogueStatus,
  clearCatalogCache,
  cachedCatalogueStatus,
} from './catalog-adapter.js';

if (!parentPort) throw new Error('Catalogue worker must run in a worker thread.');

const operations = { searchCatalog, recommendCatalogItems, fetchProductPage, catalogueStatus, clearCatalogCache, optimizeMealPlan };
const controllers = new Map();

parentPort.on('message', async message => {
  if (!message || typeof message !== 'object') return;
  if (message.type === 'cancel') {
    controllers.get(message.id)?.abort();
    return;
  }
  if (message.type !== 'request') return;
  const { id, method } = message;
  const controller = new AbortController();
  controllers.set(id, controller);
  try {
    if (!Object.hasOwn(operations, method)) throw new Error('Unknown catalogue operation.');
    const args = Array.isArray(message.args) ? message.args : [];
    const result = method === 'optimizeMealPlan'
      ? await optimizeMealPlan(args[0], { signal: controller.signal })
      : method === 'recommendCatalogItems'
      ? await recommendCatalogItems(args[0], args[1], { signal: controller.signal })
      : await operations[method](...args);
    parentPort.postMessage({ id, ok: true, result, status: cachedCatalogueStatus() });
  } catch (error) {
    parentPort.postMessage({
      id,
      ok: false,
      error: { name: error?.name || 'Error', message: error?.message || 'Catalogue operation failed.', code: error?.code },
      status: cachedCatalogueStatus(),
    });
  } finally {
    controllers.delete(id);
  }
});
