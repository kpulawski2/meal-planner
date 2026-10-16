/* Prices the shopper actually saw. Never official catalogue evidence. */
(function (root) {
  'use strict';
  const STORAGE_KEY = 'mealPlanner.personalLidlPrices.v1', MAX_PRICES = 300, MAX_BYTES = 250000;
  const copy = value => JSON.parse(JSON.stringify(value));
  const empty = () => ({ schemaVersion: 1, includeInPlanning: false, prices: [] });
  function text(value, field, maximum, optional = false) {
    if (optional && (value == null || value === '')) return '';
    if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) throw new Error('Enter a valid ' + field + '.');
    return value.trim().replace(/\s+/g, ' ');
  }
  function positive(value, field, maximum) {
    if (!['number', 'string'].includes(typeof value) || typeof value === 'string' && !/^\d+(?:\.\d{1,6})?$/.test(value.trim()) || !Number.isFinite(Number(value)) || !(Number(value) > 0) || Number(value) > maximum) throw new Error('Enter a positive ' + field + ' within the allowed limit.');
    return Number(value);
  }
  function today(now = new Date()) {
    const value = new Date(now);
    if (!Number.isFinite(value.getTime())) throw new Error('The current date is unavailable.');
    return value.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const instant = Date.parse(value + 'T12:00:00Z');
    return Number.isFinite(instant) && new Date(instant).toISOString().slice(0, 10) === value;
  }
  function hash(value, seed) {
    let number = seed;
    for (let index = 0; index < value.length; index++) { number ^= value.charCodeAt(index); number = Math.imul(number, 16777619); }
    return (number >>> 0).toString(16).padStart(8, '0');
  }
  function normalize(raw, { now = new Date() } = {}) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.store != null && raw.store !== 'Lidl') throw new Error('Saved prices are for Lidl only.');
    const ingredient = text(raw.ingredient, 'recipe ingredient', 160), productName = text(raw.productName, 'product name', 200), branch = text(raw.branch, 'store location', 160, true);
    const units = { g: ['g', 1], kg: ['g', 1000], ml: ['ml', 1], l: ['ml', 1000], pieces: ['pieces', 1] }, meta = Object.hasOwn(units, raw.packUnit) && units[raw.packUnit];
    if (!meta) throw new Error('Choose grams, kilograms, millilitres, litres or pieces for the pack.');
    const packQuantity = Number((positive(raw.packQuantity, 'pack quantity', 1000000) * meta[1]).toFixed(6)), packUnit = meta[0];
    if (!(packQuantity > 0) || packQuantity > 1000000 || packUnit === 'pieces' && !Number.isInteger(packQuantity)) throw new Error('Enter a valid pack quantity; pieces must be whole numbers.');
    const priceGBP = positive(raw.priceGBP, 'pack price', 10000);
    if (Math.abs(priceGBP * 100 - Math.round(priceGBP * 100)) > 1e-7) throw new Error('Enter the pack price in pounds and pence.');
    if (!validDate(raw.checkedAt) || raw.checkedAt < '2000-01-01' || raw.checkedAt > today(now)) throw new Error('Choose the date you checked the price, up to today.');
    if (!['receipt', 'shelf'].includes(raw.source)) throw new Error('Choose receipt or shelf label as the price source.');
    const identity = JSON.stringify([ingredient.toLowerCase(), productName.toLowerCase(), packQuantity, packUnit, branch.toLowerCase()]);
    const id = 'personal-lidl-' + hash(identity, 2166136261) + hash(identity, 3339675911);
    if (raw.id != null && raw.id !== id) throw new Error('This saved price identifier does not match its pack.');
    return { id, store: 'Lidl', ingredient, productName, packQuantity, packUnit, priceGBP: Math.round(priceGBP * 100) / 100, checkedAt: raw.checkedAt, source: raw.source, branch };
  }
  function ageDays(raw, { now = new Date() } = {}) {
    const row = normalize(raw, { now });
    return Math.round((Date.parse(today(now) + 'T12:00:00Z') - Date.parse(row.checkedAt + 'T12:00:00Z')) / 86400000);
  }
  const isOld = (raw, options) => ageDays(raw, options) > 30;
  const eligible = (raw, options) => ageDays(raw, options) <= 90;
  function compatible(raw, dimension, options) {
    const row = normalize(raw, options);
    return ({ g: 'mass', ml: 'volume', pieces: 'each' })[row.packUnit] === (dimension === 'count' ? 'each' : dimension);
  }
  function purchaseQuantity(raw, dimension, options) {
    const row = normalize(raw, options), wanted = dimension === 'each' ? 'count' : dimension;
    const native = { g: 'mass', ml: 'volume', pieces: 'count' }[row.packUnit];
    if (native === wanted) return { capacity: row.packQuantity, estimatedQuantity: false, quantityBasis: null };
    if (!['mass', 'volume'].includes(wanted) || !['mass', 'volume'].includes(native)) return null;
    const ingredient = row.ingredient.toLowerCase();
    const oil = /\boil\b/.test(ingredient), honey = /\bhoney\b/.test(ingredient);
    const liquid = /\b(?:milk|juice|sauce|dressing|stock|mayonnaise)\b/.test(ingredient) && !/powder|cube|concentrat/.test(ingredient);
    const density = oil ? .92 : honey ? 1.42 : liquid ? 1 : null;
    if (!density) return null;
    const capacity = native === 'volume' ? row.packQuantity * density : row.packQuantity / density;
    return { capacity, estimatedQuantity: true, quantityBasis: 'Estimated density ' + density + ' g/ml for your saved ' + (oil ? 'cooking oil' : honey ? 'honey' : 'sauce or liquid') + ' pack; actual density varies.' };
  }
  function normalizeSnapshot(raw, options) {
    if (!raw || typeof raw !== 'object' || raw.schemaVersion !== 1 || typeof raw.includeInPlanning !== 'boolean' || !Array.isArray(raw.prices) || raw.prices.length > MAX_PRICES) throw new Error('The saved-price data is invalid. Existing data has not been changed.');
    const ids = new Set(), prices = raw.prices.map(value => {
      const row = normalize(value, options);
      if (ids.has(row.id)) throw new Error('The saved-price data contains duplicate packs. Existing data has not been changed.');
      ids.add(row.id); return row;
    });
    return { schemaVersion: 1, includeInPlanning: raw.includeInPlanning, prices };
  }
  // Pass a Storage-compatible object explicitly for tests or alternate storage.
  // Omitting it uses localStorage; failures are returned and never silently reset it.
  function browserStorage(storage) { return storage || root.localStorage; }
  function read(storage, options) {
    try {
      const value = browserStorage(storage).getItem(STORAGE_KEY);
      if (value == null) return { ok: true, snapshot: empty() };
      if (typeof value !== 'string' || value.length > MAX_BYTES) throw new Error('The saved-price data is too large.');
      return { ok: true, snapshot: normalizeSnapshot(JSON.parse(value), options) };
    } catch (error) { return { ok: false, error: 'Could not read your saved prices. ' + (error instanceof SyntaxError ? 'Stored data is damaged.' : error.message), snapshot: empty() }; }
  }
  function write(snapshot, storage, options) {
    try {
      const next = normalizeSnapshot(snapshot, options), encoded = JSON.stringify(next);
      if (encoded.length > MAX_BYTES) throw new Error('Your saved-price list is full.');
      browserStorage(storage).setItem(STORAGE_KEY, encoded);
      return { ok: true, snapshot: copy(next) };
    } catch (error) { return { ok: false, error: 'Could not save your prices. ' + error.message }; }
  }
  function change(storage, options, update) {
    const current = read(storage, options);
    if (!current.ok) return current;
    try { return write(update(current.snapshot), storage, options); }
    catch (error) { return { ok: false, error: error.message, snapshot: current.snapshot }; }
  }
  function upsert(raw, storage, options) {
    return change(storage, options, current => {
      const row = normalize(raw, options), index = current.prices.findIndex(value => value.id === row.id);
      if (index < 0 && current.prices.length >= MAX_PRICES) throw new Error('Your saved-price list is full. Remove an old pack first.');
      current.prices = index < 0 ? [...current.prices, row] : current.prices.map(value => value.id === row.id ? row : value);
      return current;
    });
  }
  function remove(id, storage, options) { return change(storage, options, current => ({ ...current, prices: current.prices.filter(row => row.id !== id) })); }
  function setIncluded(include, storage, options) {
    return change(storage, options, current => {
      if (typeof include !== 'boolean') throw new Error('Choose whether to include your saved prices.');
      return { ...current, includeInPlanning: include };
    });
  }
  function requestPayload(snapshot, { store, now = new Date() } = {}) {
    if (store !== 'Lidl') return {};
    const current = normalizeSnapshot(snapshot, { now });
    const prices = current.prices.filter(row => eligible(row, { now }));
    return current.includeInPlanning && prices.length ? { allowPersonalPrices: true, personalPrices: copy(prices) } : {};
  }
  // A private locator identifies a local observation. It must never be rendered
  // as a product link or accepted solely because a response claims it is personal.
  function productMatches(product, { store, dimension, ingredient, prices, now = new Date() } = {}) {
    try {
      if (store !== 'Lidl' || !product || product.priceBasis !== 'personal' || product.estimatedPrice !== true || product.store != null && product.store !== 'Lidl' || product.available === false || product.priceMemberOnly === true || product.priceSourceUrl != null) return false;
      let records = prices;
      if (records === undefined) {
        const saved = read(undefined, { now });
        if (!saved.ok || !saved.snapshot.includeInPlanning) return false;
        records = saved.snapshot.prices;
      }
      if (!Array.isArray(records) || records.length > MAX_PRICES) return false;
      const rows = records.map(raw => normalize(raw, { now }));
      if (new Set(rows.map(row => row.id)).size !== rows.length) return false;
      const row = rows.find(value => value.id === product.personalPriceId);
      if (!row || !eligible(row, { now }) || product.url !== 'personal:lidl/' + row.id || product.id != null && product.id !== row.id) return false;
      const canonical = value => root.MealBudgetCore?.canonicalIngredientName ? root.MealBudgetCore.canonicalIngredientName(value) : String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
      if (ingredient != null && (!String(ingredient).trim() || canonical(ingredient) !== canonical(row.ingredient)) || dimension != null && !purchaseQuantity(row, dimension, { now })) return false;
      if (!(product.personalIngredient === row.ingredient && product.productName === row.productName && product.personalSource === row.source && product.personalBranch === row.branch && product.personalCheckedAt === row.checkedAt && product.checkedAt === row.checkedAt && product.packQuantity === row.packQuantity && product.packUnit === row.packUnit && product.priceGBP === row.priceGBP && product.priceSource === (row.source === 'receipt' ? 'Your Lidl receipt price' : 'Your Lidl shelf-label price'))) return false;
      if (Object.hasOwn(product, 'packs') && dimension != null) {
        const meta = purchaseQuantity(row, dimension, { now });
        if (!meta || !Number.isSafeInteger(product.packs) || product.packs <= 0 || !Number.isFinite(product.totalQuantity) || Math.abs(product.totalQuantity - product.packs * meta.capacity) > .00001 || !Number.isFinite(product.costGBP) || product.costGBP <= 0 || Math.abs(product.costGBP * 100 - product.packs * Math.round(row.priceGBP * 100)) > .00001) return false;
        if (product.estimatedQuantity != null && typeof product.estimatedQuantity !== 'boolean' || (product.estimatedQuantity === true) !== meta.estimatedQuantity || (product.quantityBasis || null) !== meta.quantityBasis) return false;
      }
      return true;
    } catch { return false; }
  }
  function productCapacity(product, context = {}) {
    if (!productMatches(product, context)) return null;
    try {
      return purchaseQuantity({ id: product.personalPriceId, store: 'Lidl', ingredient: product.personalIngredient, productName: product.productName,
        packQuantity: product.packQuantity, packUnit: product.packUnit, priceGBP: product.priceGBP, checkedAt: product.personalCheckedAt,
        source: product.personalSource, branch: product.personalBranch }, context.dimension, { now: context.now || new Date() });
    } catch { return null; }
  }
  root.PersonalPricesCore = Object.freeze({ STORAGE_KEY, MAX_PRICES, normalize, normalizeSnapshot, empty, today, validDate, ageDays, isOld, eligible, compatible, purchaseQuantity, read, write, upsert, remove, setIncluded, requestPayload, productMatches, productCapacity });
})(typeof window !== 'undefined' ? window : globalThis);
