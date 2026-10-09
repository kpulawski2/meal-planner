import { Worker } from 'node:worker_threads';

const MAX_PENDING_REQUESTS = 64;
const REQUEST_TIMEOUT_MS = 60_000;
const pending = new Map();
let worker = null;
let nextRequestId = 0;
let status = { status: 'not_loaded', healthy: null, products_saved: null };

function settle(id, error, result) {
  const request = pending.get(id);
  if (!request) return;
  pending.delete(id);
  clearTimeout(request.timer);
  request.signal?.removeEventListener('abort', request.onAbort);
  if (!pending.size) worker?.unref();
  if (error) request.reject(error);
  else request.resolve(result);
}

function workerFailed(failedWorker, error) {
  if (worker !== failedWorker) return;
  worker = null;
  status = { status: 'unavailable', healthy: false, products_saved: null };
  for (const id of [...pending.keys()]) settle(id, error);
  // Release the failed worker's catalogue memory while allowing a later retry.
  void failedWorker.terminate().catch(() => {});
}

function getWorker() {
  if (worker) return worker;
  const created = new Worker(new URL('./catalog-worker.js', import.meta.url), {
    execArgv: [],
    resourceLimits: { maxOldGenerationSizeMb: 256 },
  });
  worker = created;
  created.on('message', message => {
    if (worker !== created || !message || typeof message !== 'object') return;
    if (message.status && typeof message.status === 'object') status = message.status;
    if (!message.id) return;
    if (message.ok) settle(message.id, null, message.result);
    else {
      const error = new Error(message.error?.message || 'ASDA catalogue processing failed.');
      error.name = message.error?.name || 'Error';
      if (message.error?.code) error.code = message.error.code;
      settle(message.id, error);
    }
  });
  created.on('error', error => workerFailed(created, new Error(`Catalogue worker failed: ${error.message}`)));
  created.on('exit', code => workerFailed(created, new Error(`Catalogue worker stopped (exit ${code}). Please retry.`)));
  // The web server keeps the process alive. An idle catalogue worker should not
  // keep scripts or test runners alive after their work has finished.
  created.unref();
  return created;
}

function abortError(signal) {
  if (signal?.reason instanceof Error) return signal.reason;
  const error = new Error('Catalogue request was cancelled.');
  error.name = 'AbortError';
  return error;
}

function callWorker(method, args, { signal, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  if (signal?.aborted) return Promise.reject(abortError(signal));
  if (pending.size >= MAX_PENDING_REQUESTS) return Promise.reject(new Error('Catalogue matching is busy. Please retry shortly.'));
  let target;
  try { target = getWorker(); }
  catch (error) {
    status = { status: 'unavailable', healthy: false, products_saved: null };
    return Promise.reject(error);
  }
  const id = ++nextRequestId;
  return new Promise((resolve, reject) => {
    const cancel = error => {
      try { target.postMessage({ type: 'cancel', id }); } catch {}
      settle(id, error);
    };
    const onAbort = () => cancel(abortError(signal));
    const timer = setTimeout(() => cancel(new Error(method === 'optimizeMealPlan' ? 'Budget planning timed out. Your current plan was kept. Please retry.' : 'Catalogue matching timed out. Please retry.')), timeoutMs);
    pending.set(id, { resolve, reject, timer, signal, onAbort });
    signal?.addEventListener('abort', onAbort, { once: true });
    target.ref();
    if ((method === 'catalogueStatus' || method === 'optimizeMealPlan' || args[0] === 'Asda') && status.healthy !== true) {
      status = { status: 'loading', healthy: null, products_saved: null };
    }
    try { target.postMessage({ type: 'request', id, method, args }); }
    catch (error) { settle(id, error); }
  });
}

export function searchCatalog(storeName, query, limit = 8, dimension = '') {
  return callWorker('searchCatalog', [storeName, query, limit, dimension]);
}

export function recommendCatalogItems(storeName, items, { signal } = {}) {
  return callWorker('recommendCatalogItems', [storeName, items], { signal });
}

export function optimizeMealPlan(request, { signal } = {}) {
  return callWorker('optimizeMealPlan', [request], { signal, timeoutMs: 150_000 });
}

export function fetchProductPage(storeName, url) {
  return callWorker('fetchProductPage', [storeName, url]);
}

export function catalogueStatus() {
  return callWorker('catalogueStatus', []);
}

export function clearCatalogCache(storeName = null) {
  return callWorker('clearCatalogCache', [storeName]);
}

export function cachedCatalogueStatus() {
  return { ...status };
}
