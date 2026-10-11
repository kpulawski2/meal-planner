import { readFile } from 'node:fs/promises';

const sourcePath = new URL('../data/lidl-range-references.json', import.meta.url);
let pending;
export function validateRangeReferences(document) {
  if (document?.schemaVersion !== 1 || !Array.isArray(document.sources) || !Array.isArray(document.references) || document.references.length > 1000) throw new Error('Invalid Lidl range reference directory.');
  const sources = new Map(document.sources.map(source => {
    const url = new URL(source.url);
    if (url.origin !== 'https://www.lidl.co.uk' || url.username || url.password || !/^\/(?:c\/|static\/assets\/)/.test(url.pathname) || !source.id || !source.label || !source.publishedPeriod) throw new Error('Invalid Lidl range reference source.');
    return [source.id, source];
  }));
  const ids = new Set();
  return document.references.map(row => {
    const source = sources.get(row.sourceId);
    if (!source || !row.id || ids.has(row.id) || !row.name || !row.category || row.price !== null) throw new Error('Invalid or priced Lidl range reference.');
    ids.add(row.id);
    return { id: row.id, name: row.name, category: row.category, publishedPack: row.publishedPack || null, sourceUrl: source.url, sourceLabel: source.label, sourcePeriod: source.publishedPeriod, reviewedAt: document.reviewedAt };
  });
}
export function loadRangeReferences() {
  if (!pending) pending = readFile(sourcePath, 'utf8').then(JSON.parse).then(validateRangeReferences).catch(error => { pending = null; throw error; });
  return pending;
}
