// Product matching helpers used by the supermarket catalogue integration.
export function normalizePriceText(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }

export function chooseBestPackCandidate(candidates, { minimumScore = 0.54, relevanceBand = 0.15 } = {}) {
  const viable = (Array.isArray(candidates) ? candidates : []).filter(c => c && c.canApply &&
    Number(c.score) >= minimumScore && Number.isFinite(Number(c.checkoutCost)) &&
    Number(c.checkoutCost) > 0 && Number(c.packsNeeded) >= 1 && c.fresh !== false);
  if (!viable.length) return null;
  const maxScore = Math.max(...viable.map(c => Number(c.score)));
  const shortlist = viable.filter(c => Number(c.score) >= maxScore - relevanceBand);
  shortlist.sort((a, b) => {
    const costDelta = Number(a.checkoutCost) - Number(b.checkoutCost);
    if (Math.abs(costDelta) >= 0.01) return costDelta;
    const wasteA = Number(a.leftoverBase ?? Infinity) / Math.max(1, Number(a.neededBase ?? 1));
    const wasteB = Number(b.leftoverBase ?? Infinity) / Math.max(1, Number(b.neededBase ?? 1));
    if (Math.abs(wasteA - wasteB) > 0.001) return wasteA - wasteB;
    return Number(b.score) - Number(a.score);
  });
  return shortlist[0];
}


/**
 * Estimate a supermarket-specific ingredient benchmark from distinct, reasonably
 * matched product packs. Pack checkout prices remain separate from this unit-rate
 * statistic: the median is a planning estimate, not a price the shopper can buy.
 * packBase is expressed in grams/ml/items by buildPriceCandidate.
 */
export function summarizePriceBenchmark(candidates, { minimumScore = 0.54, relevanceBand = 0.15, maxAgeDays = 45 } = {}) {
  const rows = (Array.isArray(candidates) ? candidates : []).filter(c =>
    c && Number(c.score) >= minimumScore && Number(c.ageDays) >= 0 &&
    Number(c.ageDays) <= maxAgeDays && Number(c.packPrice) > 0 &&
    Number(c.packBase) > 0 && ['mass', 'volume', 'each', 'slice'].includes(c.dimension)
  );
  if (!rows.length) return null;

  const maxScore = Math.max(...rows.map(c => Number(c.score)));
  const shortlist = rows.filter(c => Number(c.score) >= maxScore - relevanceBand);
  const byProduct = new Map();
  for (const c of shortlist) {
    const key = `${c.productCode || normalizePriceText(c.productName)}|${c.packBase}|${c.dimension}`;
    const previous = byProduct.get(key);
    if (!previous || Number(c.score) > Number(previous.score) || String(c.date) > String(previous.date)) byProduct.set(key, c);
  }

  const dimensions = new Map();
  for (const c of byProduct.values()) {
    const unitLabel = c.dimension === 'mass' ? 'kg' : c.dimension === 'volume' ? 'L' : c.dimension === 'slice' ? 'slice' : 'item';
    const normalizer = ['mass', 'volume'].includes(c.dimension) ? 1000 : 1;
    const unitPrice = Number(c.packPrice) * normalizer / Number(c.packBase);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) continue;
    const key = `${c.dimension}:${unitLabel}`;
    if (!dimensions.has(key)) dimensions.set(key, { dimension: c.dimension, unitLabel, values: [] });
    dimensions.get(key).values.push({ unitPrice, candidate: c });
  }
  if (!dimensions.size) return null;

  // Prefer the dimension with the most usable products; don't mix kg, litres and items.
  const group = [...dimensions.values()].sort((a, b) => b.values.length - a.values.length)[0];
  const sorted = group.values.map(x => x.unitPrice).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const dates = group.values.map(x => String(x.candidate.date || '')).filter(Boolean).sort();
  const ages = group.values.map(x => Number(x.candidate.ageDays)).filter(Number.isFinite);
  return {
    medianUnitPrice: Math.round(median * 100) / 100,
    minUnitPrice: Math.round(sorted[0] * 100) / 100,
    maxUnitPrice: Math.round(sorted[sorted.length - 1] * 100) / 100,
    unitLabel: group.unitLabel,
    dimension: group.dimension,
    sampleSize: sorted.length,
    newestDate: dates.at(-1) || null,
    oldestAgeDays: ages.length ? Math.max(...ages) : null,
    method: 'median of distinct, close-match product packs; recent records only'
  };
}
