import { readFile } from 'node:fs/promises';
import '../public/retailer-price-sources.js';

const trustedRows = new WeakSet(), trustedProducts = new WeakSet();
export function validateAldiPrices(document) {
  if (document?.schemaVersion !== 1 || document.currency !== 'GBP' || document.coverageScope !== 'curated_recipe_ingredients' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(document.reviewedAt || '') || !Array.isArray(document.products) || !document.products.length || document.products.length > 2000) throw new Error('Invalid Aldi price catalogue.');
  const ids = new Set();
  return document.products.map(row => {
    if (!/^[\w-]+$/.test(row.id || '') || ids.has(row.id) || !row.name || !row.category || !row.packSize ||
      !Number.isFinite(row.packQuantity) || row.packQuantity <= 0 || !['g','ml','pieces','pint'].includes(row.packUnit) ||
      !Number.isFinite(row.priceGBP) || row.priceGBP < .01 || row.priceGBP > 10000 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.sourceDate || '') || !Number.isFinite(Date.parse(row.sourceDate + 'T00:00:00Z')) || row.sourceDate > document.reviewedAt ||
      !row.sourceLabel || !globalThis.RetailerPriceSources.aldiSource(row.sourceUrl) || !['net','drained'].includes(row.quantityKind)) throw new Error('Invalid Aldi pack price or source.');
    ids.add(row.id);
    const validated = Object.freeze({ ...row, reviewedAt: document.reviewedAt });
    trustedRows.add(validated);
    return validated;
  });
}
export async function loadAldiPrices() {
  return validateAldiPrices(JSON.parse(await readFile(new URL('../data/aldi-prices.json', import.meta.url), 'utf8')));
}
export function aldiProduct(row, { fallback = false } = {}) {
  if (!trustedRows.has(row)) throw new Error('Unvalidated Aldi price.');
  const product = Object.freeze({ id: row.id, store: 'Aldi', sourceStore: 'Aldi', name: row.name, category: row.category,
    url: row.sourceUrl, packSize: row.packSize, packQuantity: row.packQuantity, packUnit: row.packUnit, price: row.priceGBP,
    priceBasis: fallback ? 'aldi_estimate' : 'aldi_reference', estimatedPrice: true, referenceOnly: true,
    priceSource: row.sourceLabel, priceSourceUrl: row.sourceUrl, sourceDate: row.sourceDate, sourcePeriod: row.sourceDate,
    referenceReviewedAt: row.reviewedAt, priceCheckedAt: row.sourceDate, checkedAt: row.sourceDate,
    quantityKind: row.quantityKind, available: null, availability: 'check_in_store', priceMemberOnly: false });
  trustedProducts.add(product);
  return product;
}
export const isTrustedAldiPrice = product => trustedProducts.has(product);
