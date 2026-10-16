import '../public/personal-prices-core.js';

const Core = globalThis.PersonalPricesCore;
const trusted = new WeakMap();
export const personalIngredientKey = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/\byogurt\b/g, 'yoghurt');

// Personal prices belong to one request/device. They never mutate a retailer
// snapshot, enter its counts, or acquire official-source credentials.
export function normalizePersonalPriceOptions(input = {}, store = 'Lidl', { now = new Date() } = {}) {
  if (input.allowPersonalPrices !== undefined && typeof input.allowPersonalPrices !== 'boolean') throw new TypeError('Saved personal prices must be on or off.');
  if (input.personalPrices !== undefined && (!Array.isArray(input.personalPrices) || input.personalPrices.length > Core.MAX_PRICES)) throw new TypeError(`Send no more than ${Core.MAX_PRICES} saved personal prices.`);
  if (store !== 'Lidl' && (input.allowPersonalPrices === true || input.personalPrices?.length)) throw new TypeError('Saved personal prices are for Lidl only.');
  try {
    const snapshot = Core.normalizeSnapshot({ schemaVersion: 1, includeInPlanning: input.allowPersonalPrices === true, prices: input.personalPrices || [] }, { now });
    return { allowPersonalPrices: snapshot.includeInPlanning, personalPrices: snapshot.prices.filter(row => Core.eligible(row, { now })) };
  } catch (error) { throw new TypeError(error.message); }
}

export function personalProduct(row, { now = new Date() } = {}) {
  const record = Core.normalize(row, { now });
  if (!Core.eligible(record, { now })) throw new TypeError('Recheck a saved price after 90 days before using it in a plan.');
  const product = Object.freeze({ id: record.id, store: 'Lidl', name: record.ingredient, personalProductName: record.productName,
    url: 'personal:lidl/' + record.id, category: 'Food & Drink > Your saved prices',
    packSize: `${record.packQuantity} ${record.packUnit}`, packQuantity: record.packQuantity, packUnit: record.packUnit, price: record.priceGBP,
    priceBasis: 'personal', estimatedPrice: true, personalPriceId: record.id, personalIngredient: record.ingredient,
    personalSource: record.source, personalBranch: record.branch, personalCheckedAt: record.checkedAt,
    priceSource: record.source === 'receipt' ? 'Your Lidl receipt price' : 'Your Lidl shelf-label price', priceSourceUrl: null,
    sourcePeriod: record.checkedAt, sourceDate: record.checkedAt, priceCheckedAt: record.checkedAt,
    checkedAt: record.checkedAt, available: null, availability: 'check_in_store', validFrom: null, validThrough: null,
    regionRestricted: false, priceMemberOnly: false });
  trusted.set(product, record);
  return product;
}

export function withPersonalPriceIndex(index, options, store) {
  const validated = normalizePersonalPriceOptions(options, store);
  if (!validated.allowPersonalPrices || !validated.personalPrices.length) return index;
  const personalByIngredient = new Map();
  for (const row of validated.personalPrices) {
    const key = personalIngredientKey(row.ingredient);
    if (!personalByIngredient.has(key)) personalByIngredient.set(key, []);
    personalByIngredient.get(key).push(personalProduct(row));
  }
  return { ...index, personalByIngredient };
}

export function isTrustedPersonalPrice(product, now = new Date()) {
  const record = trusted.get(product);
  return Boolean(record && Core.eligible(record, { now }));
}

export function personalPurchaseMeta(product, dimension) {
  const record = trusted.get(product);
  if (!record) return null;
  const purchase = Core.purchaseQuantity(record, dimension);
  return purchase ? { ...purchase, dimension, quantity: record.packQuantity, unit: record.packUnit } : null;
}

export function personalPriceEvidence(product) {
  return { personalPriceId: product.personalPriceId || null, personalIngredient: product.personalIngredient || null,
    personalSource: product.personalSource || null, personalBranch: product.personalBranch || null, personalCheckedAt: product.personalCheckedAt || null };
}
