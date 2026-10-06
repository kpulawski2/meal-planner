export const PRICE_LOOKUP_STORES = Object.freeze({
  'Lidl': { domains: ['lidl.co.uk'], searchHint: 'Lidl GB official food product pages, current price cuts and weekly food offers; distinguish normal prices from Lidl Plus or time-limited offers' },
  'Asda': { domains: ['asda.com'], searchHint: 'ASDA Groceries UK official product listings' },
  'Aldi': { domains: ['aldi.co.uk'], searchHint: 'ALDI UK official product listings and current offers' },
  'Waitrose': { domains: ['waitrose.com'], searchHint: 'Waitrose UK official grocery product listings' },
  'Morrisons': { domains: ['morrisons.com'], searchHint: 'Morrisons UK official grocery product listings' }
});

export function splitBatches(items, size = 5) {
  const source = Array.isArray(items) ? items : [];
  const chunks = [];
  for (let i = 0; i < source.length; i += size) chunks.push(source.slice(i, i + size));
  return chunks;
}

export function isOfficialRetailerUrl(store, value) {
  const config = PRICE_LOOKUP_STORES[store];
  if (!config || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    return config.domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function extractFirstJsonObject(text) {
  const source = String(text || '').replace(/```(?:json)?/gi, '');
  const start = source.indexOf('{');
  if (start < 0) throw new Error('Groq price search did not return JSON. Please retry the lookup.');
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) return JSON.parse(source.slice(start, i + 1));
    }
  }
  throw new Error('Groq price search returned incomplete JSON. Please retry the lookup.');
}

export function priceEvidenceContainsAmount(evidence, price) {
  const target = Math.round(Number(price) * 100);
  if (!String(evidence || '').trim() || !Number.isFinite(target) || target <= 0) return false;
  const matches = [...String(evidence).matchAll(/£\s*([\d,]+(?:\.\d{1,2})?)/g)];
  return matches.some(match => Math.round(Number(match[1].replace(/,/g, '')) * 100) === target);
}

export function priceEvidenceContainsPack(evidence, packSize, packUnit) {
  const text = String(evidence || '').toLowerCase().replace(/,/g, '.');
  const size = Number(packSize);
  const unit = canonicalPackUnit(packUnit);
  if (!text || !(size > 0) || !unit) return false;
  if (unit === 'g' || unit === 'kg' || unit === 'ml' || unit === 'l') {
    const target = size * (unit === 'kg' || unit === 'l' ? 1000 : 1);
    const pattern = /(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|grams?|ml|millilit(?:re|er)s?|l|lit(?:re|er)s?)\b/g;
    for (const match of text.matchAll(pattern)) {
      const amount = Number(match[1]);
      const measure = match[2];
      const base = amount * (/^kg|kilogram/.test(measure) || /^l$|^lit/.test(measure) ? 1000 : 1);
      const matchedDimension = /^(ml|millil)/.test(measure) || /^l$|^lit/.test(measure) ? 'volume' : 'mass';
      const targetDimension = unit === 'ml' || unit === 'l' ? 'volume' : 'mass';
      if (matchedDimension === targetDimension && Math.abs(base - target) <= Math.max(1, target * 0.02)) return true;
    }
    const multi = text.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|grams?|ml|millilit(?:re|er)s?|l|lit(?:re|er)s?)\b/);
    if (multi) {
      const n = Number(multi[1]), amount = Number(multi[2]), measure = multi[3];
      const base = n * amount * (/^kg|kilogram/.test(measure) || /^l$|^lit/.test(measure) ? 1000 : 1);
      const dim = /^(ml|millil)/.test(measure) || /^l$|^lit/.test(measure) ? 'volume' : 'mass';
      const targetDimension = unit === 'ml' || unit === 'l' ? 'volume' : 'mass';
      if (dim === targetDimension && Math.abs(base - target) <= Math.max(1, target * 0.02)) return true;
    }
    return false;
  }
  if (unit === 'slices') return new RegExp(`\\b${size}\\s*(?:slices?|slice)\\b`).test(text);
  if (size === 1 && /\b(?:each|per item|single item)\b/.test(text)) return true;
  return new RegExp(`\\b${size}\\b.{0,28}\\b(?:packs?|pieces?|items?|units?|eggs?|count|ct|wraps?|apples?|bananas?|sausages?|burgers?|cans?|tins?)\\b`).test(text);
}

function canonicalPackUnit(value) {
  const unit = String(value || '').trim().toLowerCase().replace(/\./g, '');
  if (['g', 'gram', 'grams'].includes(unit)) return 'g';
  if (['kg', 'kilogram', 'kilograms', 'kilo'].includes(unit)) return 'kg';
  if (['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'].includes(unit)) return 'ml';
  if (['l', 'litre', 'litres', 'liter', 'liters'].includes(unit)) return 'l';
  if (['piece', 'pieces', 'pc', 'pcs', 'unit', 'units', 'each', 'item', 'items', 'pack', 'packs', 'count', 'ct'].includes(unit)) return 'pieces';
  if (['slice', 'slices'].includes(unit)) return 'slices';
  return '';
}

export function parsePriceSearchResponse(text, store, expectedItems) {
  const parsed = extractFirstJsonObject(text);
  const sourceItems = Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed.results) ? parsed.results : [];
  const expected = new Map((Array.isArray(expectedItems) ? expectedItems : []).map(item => [String(item.key), item]));
  const results = new Map([...expected.keys()].map(key => [key, []]));
  let rejected = 0;
  for (const result of sourceItems) {
    const key = String(result?.key ?? result?.itemKey ?? '');
    if (!expected.has(key)) { rejected++; continue; }
    const products = Array.isArray(result.products) ? result.products : Array.isArray(result.matches) ? result.matches : [];
    for (const raw of products.slice(0, 5)) {
      const productName = String(raw?.productName || raw?.product_name || raw?.name || '').trim().slice(0, 180);
      const price = Number(raw?.price);
      const currency = String(raw?.currency || 'GBP').toUpperCase();
      const packSize = Number(raw?.packSize ?? raw?.pack_size ?? raw?.quantity);
      const packUnit = canonicalPackUnit(raw?.packUnit || raw?.pack_unit || raw?.unit);
      const sourceUrl = String(raw?.sourceUrl || raw?.source_url || raw?.productUrl || raw?.url || '').trim();
      const productUrl = String(raw?.productUrl || raw?.product_url || raw?.url || sourceUrl).trim();
      const priceEvidence = String(raw?.priceEvidence || raw?.price_evidence || raw?.evidence || '').trim().slice(0, 500);
      const confidence = Math.max(0, Math.min(1, Number(raw?.confidence) || 0));
      if (!productName || !Number.isFinite(price) || price <= 0 || price > 500 || currency !== 'GBP' ||
          !(packSize > 0 && Number.isFinite(packSize) && packSize <= 1000000) || !packUnit ||
          !isOfficialRetailerUrl(store, productUrl) || !isOfficialRetailerUrl(store, sourceUrl) ||
          !priceEvidenceContainsAmount(priceEvidence, price) || !priceEvidenceContainsPack(priceEvidence, packSize, packUnit)) {
        rejected++;
        continue;
      }
      results.get(key).push({
        productName,
        price: Math.round(price * 100) / 100,
        currency: 'GBP',
        packSize,
        packUnit,
        brand: String(raw?.brand || raw?.brands || '').trim().slice(0, 100),
        productUrl,
        sourceUrl,
        priceEvidence,
        confidence,
        promotionText: String(raw?.promotionText || raw?.promotion_text || '').trim().slice(0, 180),
        productId: String(raw?.productId || raw?.product_id || '').trim().slice(0, 80)
      });
    }
  }
  return { items: results, recordsScanned: sourceItems.reduce((sum, item) => sum + (Array.isArray(item?.products) ? item.products.length : Array.isArray(item?.matches) ? item.matches.length : 0), 0), rejected };
}

export function buildPriceSearchPrompt(store, items, today) {
  const config = PRICE_LOOKUP_STORES[store];
  const domains = config.domains.join(', ');
  const shoppingItems = items.map(item => ({
    key: item.key,
    ingredient: item.name,
    quantityNeeded: (item.groups || []).map(group => `${group.remaining} ${group.label}`).join('; ') || 'quantity unspecified'
  }));
  return {
    system: [
      'You are a careful UK supermarket product-price researcher. Use the browser_search tool to search current live/indexed retailer product listings, not your training memory.',
      'Accuracy is more important than coverage. Never invent or estimate a price, pack size, product name, product URL, current offer, or source evidence. Return no product for an ingredient if you cannot verify it.',
      `The ONLY retailer for this request is ${store}. Only use official product pages hosted on these retailer domains: ${domains}. Do not use price comparison sites, recipe blogs, forums, other supermarkets, or generic search-result snippets that do not link to an official retailer product page.`,
      'Return pack shelf price in GBP, not £/kg unit price, not delivery fees, and not a total basket estimate. State normal price versus multibuy/loyalty price clearly; do not put a conditional loyalty or multi-buy price into the ordinary price field.',
      'For each ingredient, return up to 3 distinct, current, genuinely relevant products from this SAME retailer to support a median unit-price benchmark. Prefer exact ingredient/product matches and a sensible pack size. Never return substitutes that fundamentally differ (e.g. tomato sauce for fresh tomatoes).',
      'Each product must include a product-page HTTPS URL on an official retailer domain, a sourceUrl on that domain, a short verbatim evidence snippet showing the listed £ pack price, the total pack size and unit, and a confidence number 0 to 1. If the price is not visible in the indexed/browsed page, return no product rather than guessing.',
      'Output ONLY a valid JSON object, no markdown fences, citations outside JSON, explanation, or extra prose. Shape: {"items":[{"key":"input-key","products":[{"productName":"...","price":1.23,"currency":"GBP","packSize":500,"packUnit":"g","brand":"...","productUrl":"https://official-retailer-product-page","sourceUrl":"https://official-retailer-source-page","priceEvidence":"short exact source text including £1.23 and 500g","confidence":0.9,"promotionText":"","productId":""}]}]}. Include an items entry with products:[] for every supplied key that has no verified match.'
    ].join('\n'),
    userText: `Date of lookup: ${today}. Country: United Kingdom. Retailer: ${store}. Retailer listing hint: ${config.searchHint}. Allowed official product domains: ${domains}. Search each ingredient and verify current visible price and pack size. Inputs:\n${JSON.stringify(shoppingItems)}`
  };
}
