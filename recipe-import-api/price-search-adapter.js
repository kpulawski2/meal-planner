export const PRICE_LOOKUP_STORES = Object.freeze({
  'Tesco': { domains: ['tesco.com'], searchHint: 'Tesco UK grocery product listings; prefer tesco.com/groceries' },
  "Sainsbury's": { domains: ['sainsburys.co.uk'], searchHint: "Sainsbury's UK grocery product listings" },
  'Asda': { domains: ['asda.com'], searchHint: 'ASDA UK grocery product listings; prefer groceries.asda.com' },
  'Morrisons': { domains: ['morrisons.com'], searchHint: 'Morrisons UK grocery product listings; prefer groceries.morrisons.com' },
  'Waitrose': { domains: ['waitrose.com'], searchHint: 'Waitrose UK grocery product listings' },
  'Ocado': { domains: ['ocado.com'], searchHint: 'Ocado UK grocery product listings' },
  'Aldi': { domains: ['aldi.co.uk'], searchHint: 'ALDI UK product pages and published price/offer listings; only return prices actually visible on the page' },
  'M&S': { domains: ['marksandspencer.com'], searchHint: 'Marks & Spencer Food UK product pages; only return prices actually visible on the official page' }
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

function canStartJsonValue(char) {
  return char === '{' || char === '[' || char === '"' || char === '-' ||
    (char >= '0' && char <= '9') || char === 't' || char === 'f' || char === 'n';
}

// Browser-search models occasionally omit a comma between two objects in an
// array, or emit a trailing comma. Repair only those unambiguous punctuation
// mistakes outside strings; never rewrite product names, prices, URLs or text.
function repairCommonJsonPunctuation(source) {
  let output = '';
  const stack = [];
  let inString = false;
  let escaped = false;

  const nextSignificantChar = (from) => {
    let index = from;
    while (index < source.length && /\s/.test(source[index])) index++;
    return source[index] || '';
  };
  const needsArrayComma = (from) => stack[stack.length - 1] === '[' && canStartJsonValue(nextSignificantChar(from));

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') {
        inString = false;
        // A string can itself be an array element. If another value starts
        // immediately after it, the model likely omitted the separating comma.
        if (needsArrayComma(i + 1)) output += ',';
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ',') {
      const next = nextSignificantChar(i + 1);
      if (next === ']' || next === '}') continue; // trailing comma
      output += char;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char);
      output += char;
      continue;
    }

    if (char === '}' || char === ']') {
      const expectedOpen = char === '}' ? '{' : '[';
      if (stack[stack.length - 1] === expectedOpen) stack.pop();
      output += char;
      // After an array element closes, a following value start needs a comma.
      // Do not insert commas between object properties or after the root object.
      if (needsArrayComma(i + 1)) output += ',';
      continue;
    }

    output += char;
  }
  return output;
}

function extractFirstJsonObject(text) {
  const source = String(text || '').replace(/^\uFEFF/, '').replace(/```(?:json)?/gi, '');
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
      if (depth === 0) {
        const raw = source.slice(start, i + 1);
        try {
          return JSON.parse(raw);
        } catch (originalError) {
          const repaired = repairCommonJsonPunctuation(raw);
          if (repaired !== raw) {
            try { return JSON.parse(repaired); } catch { /* report the original parser error below */ }
          }
          // Don't surface arbitrary model output or price text in an error.
          throw new Error(`Groq price search returned malformed JSON (${String(originalError?.message || 'invalid structure').slice(0, 120)}). Please retry the lookup.`);
        }
      }
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
      'To conserve free-tier tokens, return at most ONE best verified product per ingredient. Prefer an exact ingredient/product match and a sensible pack size. Do not keep searching for alternatives after finding a credible match. Never return substitutes that fundamentally differ (e.g. tomato sauce for fresh tomatoes).',
      'Keep priceEvidence short (one exact source phrase, ideally under 120 characters) while including both the GBP pack price and the total pack size/unit.',
      'Each product must include a product-page HTTPS URL on an official retailer domain, a sourceUrl on that domain, a short verbatim evidence snippet showing the listed £ pack price, the total pack size and unit, and a confidence number 0 to 1. If the price is not visible in the indexed/browsed page, return no product rather than guessing.',
      'Output ONLY a valid JSON object, no markdown fences, citations outside JSON, explanation, or extra prose. Shape: {"items":[{"key":"input-key","products":[{"productName":"...","price":1.23,"currency":"GBP","packSize":500,"packUnit":"g","brand":"...","productUrl":"https://official-retailer-product-page","sourceUrl":"https://official-retailer-source-page","priceEvidence":"short exact source text including £1.23 and 500g","confidence":0.9,"promotionText":"","productId":""}]}]}. Include an items entry with products:[] for every supplied key that has no verified match.'
    ].join('\n'),
    userText: `Date of lookup: ${today}. Country: United Kingdom. Retailer: ${store}. Retailer listing hint: ${config.searchHint}. Allowed official product domains: ${domains}. Search each ingredient and verify current visible price and pack size. Inputs:\n${JSON.stringify(shoppingItems)}`
  };
}
