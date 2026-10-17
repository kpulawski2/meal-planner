import { readFile } from 'node:fs/promises';

const sourcePath = new URL('../data/lidl-price-references.json', import.meta.url);
const trustedRows = new WeakSet(), trustedProducts = new WeakSet();
let pending;
export function validatePriceReferences(document) {
  if (document?.schemaVersion !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(document.reviewedAt || '') || !Array.isArray(document.sources) || !Array.isArray(document.references) || document.references.length > 2000) throw new Error('Invalid Lidl price references.');
  const sources = new Map();
  for (const source of document.sources) {
    const url = new URL(source.url);
    const allowed = ['https://www.lidl.co.uk','https://www.lidl-ni.co.uk'].includes(url.origin) && /^\/static\/assets\/[^/]+\.pdf$/.test(url.pathname) || url.origin === 'https://corporate.lidl.co.uk' && /^\/media-centre\/pressreleases\/\d{4}\/[\w!-]+$/.test(url.pathname);
    if (!allowed || url.username || url.password || url.search || url.hash || !source.id || sources.has(source.id) || !source.label || !source.period || source.date !== null && !/^\d{4}-\d{2}(?:-\d{2})?$/.test(source.date || '')) throw new Error('Invalid Lidl price reference source.');
    sources.set(source.id, source);
  }
  const ids = new Set();
  return document.references.map(row => {
    const source = sources.get(row.sourceId);
    if (!source || !/^[\w-]+$/.test(row.id || '') || ids.has(row.id) || !row.name || !row.category || !row.packSize || !Number.isFinite(row.priceGBP) || row.priceGBP <= 0 || row.priceGBP > 10000 || !Array.isArray(row.regions) || row.regions.some(region => !['England', 'Wales', 'Scotland', 'Northern Ireland'].includes(region)) || row.storeSku !== null && !/^\d+$/.test(row.storeSku || '') || (row.packQuantity === null ? row.packUnit !== null : !(Number.isFinite(row.packQuantity) && row.packQuantity > 0 && ['g','ml','pieces','pint'].includes(row.packUnit)))) throw new Error('Invalid Lidl price reference product.');
    // NI and GB item numbers are separate namespaces. A Northern Ireland
    // reference retains its region and cannot attach to an unrelated GB SKU.
    if (new URL(source.url).hostname === 'www.lidl-ni.co.uk' && (row.storeSku !== null || row.regions.length !== 1 || row.regions[0] !== 'Northern Ireland')) throw new Error('Invalid Northern Ireland price reference identity.');
    ids.add(row.id);
    const ref = { ...row, sourceUrl: source.url, sourceLabel: source.label, sourcePeriod: source.period, sourceDate: source.date, reviewedAt: document.reviewedAt };
    trustedRows.add(ref);
    return ref;
  });
}
export function loadPriceReferences() {
  if (!pending) pending = readFile(sourcePath, 'utf8').then(JSON.parse).then(validatePriceReferences).catch(error => { pending = null; throw error; });
  return pending;
}
export function referenceProduct(ref, product = null) {
  if (!trustedRows.has(ref)) throw new Error('Unvalidated Lidl price reference.');
  const food = !['Household','Health & Beauty','Pet','Plants & Flowers'].includes(ref.category);
  const row = { ...product, id: product?.id || 'lidl-reference-' + ref.id, store: 'Lidl', name: product?.name || ref.name,
    url: product?.url || ref.sourceUrl + '#lidl-reference-' + ref.id, category: product?.category || (food ? 'Food & Drink > ' : '') + ref.category,
    packSize: ref.packSize, packQuantity: ref.packQuantity, packUnit: ref.packUnit, price: ref.priceGBP,
    priceBasis: 'reference', estimatedPrice: true, referenceId: ref.id, referenceOnly: !product,
    priceSource: ref.sourceLabel, priceSourceUrl: ref.sourceUrl, sourcePeriod: ref.sourcePeriod, sourceDate: ref.sourceDate,
    priceCheckedAt: null, referenceReviewedAt: ref.reviewedAt, referenceRegions: ref.regions,
    regionRestricted: ref.regions.length > 0, available: product?.available ?? null, availability: product?.availability || 'check_in_store',
    validFrom: null, validThrough: null, offer: null, priceMemberOnly: false, priceMissingReason: null,
    pricePerUnit: null, pricePerUnitLabel: null, pricePerBaseUnit: null };
  trustedProducts.add(row);
  return row;
}
export const isTrustedReferencePrice = product => trustedProducts.has(product);
