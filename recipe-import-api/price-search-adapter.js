import { load } from 'cheerio';

// Retailer allow-list: search results are used transiently to discover links only.
// Prices and pack sizes are extracted directly from the official retailer page;
// Brave API response bodies/snippets are never cached or saved by this module.
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

const BRAVE_SEARCH_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';
const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 4;
const MAX_PRODUCT_PAGES_PER_ITEM = 3;
const KNOWN_PRODUCT_URL_MATCH_THRESHOLD = 0.40;
const SEARCH_RESULTS_COUNT = 5;

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
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    return config.domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function normalizeProductText(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function productTokens(value) {
  const aliases = normalizeProductText(value)
    .replace(/\b(yogurt|yoghurts)\b/g, 'yoghurt')
    .replace(/\beggs\b/g, 'egg').replace(/\bberries\b/g, 'berry')
    .replace(/\btomatoes\b/g, 'tomato').replace(/\bpotatoes\b/g, 'potato')
    .replace(/\bvegetables\b/g, 'vegetable').replace(/\bwraps\b/g, 'wrap')
    .replace(/\bnoodles\b/g, 'noodle').replace(/\bbeans\b/g, 'bean')
    .replace(/\bapples\b/g, 'apple').replace(/\bbananas\b/g, 'banana')
    .replace(/\bpeppers\b/g, 'pepper').replace(/\bcarrots\b/g, 'carrot')
    .replace(/\bonions\b/g, 'onion').replace(/\bmushrooms\b/g, 'mushroom');
  const stop = new Set(['and','the','of','with','fresh','british','farm','foods','food','brand','pack','packaging','product','size','each','per','approx','approximate','g','kg','ml','l','cl','x','light','low','fat','lean','skinless','boneless','raw','cooked','sliced','diced','chopped','plain','price','uk','online','shop']);
  return [...new Set(aliases.split(' ').filter(w => w && !stop.has(w) && !/^\d+$/.test(w) && w.length > 1))];
}

function productMatchScore(ingredient, productName) {
  const target = productTokens(ingredient);
  const product = productTokens(productName);
  if (!target.length || !product.length) return 0;
  const overlap = target.filter(token => product.includes(token));
  const recall = overlap.length / target.length;
  const precision = overlap.length / Math.max(1, Math.min(product.length, target.length + 2));
  const phrase = normalizeProductText(productName).includes(normalizeProductText(ingredient)) ? 0.12 : 0;
  const blockers = ['crisps','crisp','soup','sauce','ketchup','juice','drink','flavour','flavor','powder','cereal','cake','cakes','pudding','ready meal','wedge','wedges'];
  const normProduct = ` ${normalizeProductText(productName)} `;
  if (target.length <= 2 && blockers.some(blocker => normProduct.includes(` ${blocker} `) && !target.includes(blocker))) return 0;
  return Math.max(0, Math.min(1, recall * 0.78 + precision * 0.22 + phrase));
}

function asArray(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
function collectObjects(value, out = [], depth = 0) {
  if (depth > 12 || value == null) return out;
  if (Array.isArray(value)) {
    for (const child of value) collectObjects(child, out, depth + 1);
  } else if (typeof value === 'object') {
    out.push(value);
    for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'hasPart', 'itemListElement']) {
      if (value[key] && typeof value[key] === 'object') collectObjects(value[key], out, depth + 1);
    }
  }
  return out;
}

function isProductSchema(node) {
  const types = asArray(node?.['@type']).map(x => String(x).toLowerCase());
  return types.some(type => type === 'product' || type === 'individualproduct' || type === 'productmodel' || type.endsWith('/product') || type.endsWith('#product'));
}

function schemaText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return String(value.name || value.value || value.description || '');
  return '';
}

function unitFromSchema(weight) {
  if (weight && typeof weight === 'object') {
    const value = Number(weight.value ?? weight.amount);
    const code = String(weight.unitCode || weight.unitText || weight.unit || '').toLowerCase();
    if (value > 0 && Number.isFinite(value)) {
      if (['grm','g','gram','grams'].includes(code)) return { size: value, unit: 'g' };
      if (['kgm','kg','kilogram','kilograms'].includes(code)) return { size: value, unit: 'kg' };
      if (['mlt','ml','millilitre','millilitres','milliliter','milliliters'].includes(code)) return { size: value, unit: 'ml' };
      if (['ltr','l','litre','litres','liter','liters'].includes(code)) return { size: value, unit: 'l' };
    }
  }
  return null;
}

function parsePackSize(texts, schemaWeight = null) {
  const fromWeight = unitFromSchema(schemaWeight);
  if (fromWeight) return fromWeight;
  const target = (Array.isArray(texts) ? texts : [texts]).filter(Boolean).join(' ').replace(/,/g, '.').slice(0, 8000);
  let match = target.match(/\b(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|grams?|ml|millilit(?:re|er)s?|l|lit(?:re|er)s?)\b/i);
  let amount, rawUnit;
  if (match) {
    amount = Number(match[1]) * Number(match[2]);
    rawUnit = match[3];
  } else {
    match = target.match(/(?:^|\b)(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|grams?|ml|millilit(?:re|er)s?|l|lit(?:re|er)s?)\b/i);
    if (match) { amount = Number(match[1]); rawUnit = match[2]; }
  }
  if (Number.isFinite(amount) && amount > 0) {
    const u = String(rawUnit).toLowerCase();
    if (/^kg|^kilogram/.test(u)) return { size: amount, unit: 'kg' };
    if (/^g|^gram/.test(u)) return { size: amount, unit: 'g' };
    if (/^ml|^millilit/.test(u)) return { size: amount, unit: 'ml' };
    if (/^l$|^lit/.test(u)) return { size: amount, unit: 'l' };
  }
  const low = normalizeProductText(target);
  const eggs = low.match(/\b(\d+)\s*(?:large\s+|medium\s+|free range\s+|free range )?eggs?\b/);
  if (eggs) return { size: Number(eggs[1]), unit: 'pieces' };
  const count = low.match(/\b(\d+)\s*(?:pack|packs|pieces|piece|items|item|units|unit|count|ct|pcs)\b/);
  if (count) return { size: Number(count[1]), unit: 'pieces' };
  const item = low.match(/\b(\d+)\s*(?:apples?|bananas?|wraps?|pittas?|bagels?|lemons?|limes?|cucumbers?|avocados?|sausages?|burgers?|cans?|tins?)\b/);
  if (item) return { size: Number(item[1]), unit: 'pieces' };
  return null;
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 && value <= 500 ? Math.round(value * 100) / 100 : null;
  const text = String(value ?? '').trim();
  const match = text.match(/(?:£\s*)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)(?:\s*GBP)?/i);
  if (!match) return null;
  const num = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(num) && num > 0 && num <= 500 ? Math.round(num * 100) / 100 : null;
}

function offerIsUnavailable(offer) {
  const availability = String(offer?.availability || '').toLowerCase();
  return availability.includes('outofstock') || availability.includes('soldout') || availability.includes('discontinued');
}

function pagePriceSources($) {
  const sources = [];
  const nodes = [];
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    const raw = $(script).contents().text().trim();
    if (!raw) continue;
    try { nodes.push(...collectObjects(JSON.parse(raw))); } catch { /* malformed unrelated JSON-LD: skip */ }
  }

  for (const product of nodes.filter(isProductSchema)) {
    const offers = asArray(product.offers).flatMap(offer => {
      if (offer && typeof offer === 'object' && Array.isArray(offer.offers)) return offer.offers;
      return [offer];
    });
    for (const offer of offers) {
      if (!offer || typeof offer !== 'object' || offerIsUnavailable(offer)) continue;
      const currency = String(offer.priceCurrency || offer.priceSpecification?.priceCurrency || '').toUpperCase();
      const priceRaw = offer.price ?? offer.lowPrice ?? offer.priceSpecification?.price;
      if (currency && currency !== 'GBP') continue;
      const price = parseMoney(priceRaw);
      if (!price) continue;
      // A range of aggregate prices is not a reliably identified pack price.
      if (offer.lowPrice != null && offer.highPrice != null && Number(offer.lowPrice) !== Number(offer.highPrice)) continue;
      sources.push({
        price,
        currency: currency || 'GBP',
        confidence: 0.96,
        structured: true,
        productName: schemaText(product.name),
        brand: schemaText(product.brand),
        description: schemaText(product.description),
        size: schemaText(product.size),
        weight: product.weight || product.netWeight || null,
        productId: String(product.sku || product.productID || product.gtin13 || product.gtin || ''),
        availability: offer.availability || '',
        promotionText: String(offer.priceValidUntil ? `Offer valid until ${offer.priceValidUntil}` : '')
      });
    }
  }

  const metaPrice = $('meta[property="product:price:amount"], meta[property="og:price:amount"], meta[itemprop="price"], [itemprop="price"][content], meta[name="price"]').toArray();
  for (const node of metaPrice) {
    const $node = $(node);
    const raw = $node.attr('content') || $node.attr('value') || '';
    const currency = String($('meta[property="product:price:currency"]').attr('content') || $('meta[property="og:price:currency"]').attr('content') || $('meta[itemprop="priceCurrency"]').attr('content') || '').toUpperCase();
    if (currency && currency !== 'GBP') continue;
    const price = parseMoney(raw);
    if (price) sources.push({ price, currency: currency || 'GBP', confidence: 0.9, structured: false, productName: '', brand: '', description: '', size: '', weight: null, productId: '', availability: '', promotionText: '' });
  }
  return { nodes, products: nodes.filter(isProductSchema), sources };
}

function extractNearbyRenderedPrice($, productName) {
  const h1 = $('main h1').first().length ? $('main h1').first() : $('h1').first();
  if (!h1.length) return null;
  let current = h1;
  for (let depth = 0; depth < 5 && current.length; depth++, current = current.parent()) {
    const text = String(current.text() || '').replace(/\s+/g, ' ').trim();
    if (text.length > 6000) continue;
    const regex = /£\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)/g;
    for (const match of text.matchAll(regex)) {
      const after = text.slice(match.index + match[0].length, match.index + match[0].length + 18).toLowerCase();
      const before = text.slice(Math.max(0, match.index - 15), match.index).toLowerCase();
      if (/\s*\/\s*(?:kg|g|l|ml|100g|100ml)\b/.test(after) || /per\s*$/.test(before)) continue;
      const price = parseMoney(match[1]);
      if (price) return { price, confidence: 0.78, structured: false, evidence: text.slice(Math.max(0, match.index - 45), Math.min(text.length, match.index + match[0].length + 65)), productName };
    }
  }
  return null;
}

function canonicalOfficialPage($, store, finalUrl, productNode = null) {
  // Only persist a URL explicitly supplied by the official retailer page itself.
  // Brave result URLs are transient discovery inputs and must not be saved as app data.
  const candidates = [
    $('link[rel="canonical"]').attr('href'),
    $('meta[property="og:url"]').attr('content'),
    typeof productNode?.url === 'string' ? productNode.url : productNode?.url?.url,
    productNode?.url?.['@id']
  ].filter(value => typeof value === 'string' && value.trim());
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate, finalUrl);
      url.hash = '';
      if (isOfficialRetailerUrl(store, url.href)) return url.href;
    } catch { /* skip malformed page-supplied URLs */ }
  }
  // Don't return the original URL supplied by Brave when the retailer page has no
  // self-declared canonical/product URL; that would retain API response data.
  return null;
}

export function parseOfficialProductPage(html, store, finalUrl) {
  if (!isOfficialRetailerUrl(store, finalUrl)) return null;
  const $ = load(String(html || ''));
  const meta = pagePriceSources($);
  const h1 = $('main h1').first().text().trim() || $('h1').first().text().trim();
  // Prefer structured data that matches the visible product heading. Retailer pages
  // often include recommendation cards in JSON-LD; don't borrow their pack or price.
  const namedProducts = meta.products.filter(product => schemaText(product.name));
  let productNode = h1
    ? namedProducts.find(product => normalizeProductText(schemaText(product.name)) === normalizeProductText(h1)) || null
    : null;
  if (!productNode && h1 && namedProducts.length) {
    const ranked = namedProducts.map(product => ({ product, score: productMatchScore(h1, schemaText(product.name)) }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0]?.score >= 0.68) productNode = ranked[0].product;
  }
  if (!h1) productNode = namedProducts[0] || meta.products[0] || null;
  const title = h1 || schemaText(productNode?.name) || $('meta[property="og:title"]').attr('content') || $('title').text().trim();
  if (!title) return null;
  const description = schemaText(productNode?.description) || $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  const brand = schemaText(productNode?.brand) || '';
  const pack = parsePackSize([title, schemaText(productNode?.size), description, $('meta[property="og:title"]').attr('content') || ''], productNode?.weight || productNode?.netWeight || null);
  if (!pack) return null;

  const schemaName = normalizeProductText(schemaText(productNode?.name));
  // Prefer a structured price only when it belongs to the selected product schema.
  // Never silently borrow an offer from another related/recommended item on the page.
  let priceSource = meta.sources.find(source => source.structured && schemaName && normalizeProductText(source.productName) === schemaName)
    || meta.sources.find(source => !source.structured)
    || null;
  if (!priceSource) priceSource = extractNearbyRenderedPrice($, title);
  if (!priceSource?.price) return null;

  // Be conservative with pages that mention loyalty/multibuy offers: require a human to review.
  const bodyText = $('main').text().replace(/\s+/g, ' ').trim().slice(0, 12000) || $('body').text().replace(/\s+/g, ' ').trim().slice(0, 12000);
  const promotionMatch = bodyText.match(/.{0,35}(?:Lidl\s*Plus|Clubcard|Nectar|member price|loyalty price|multibuy|multi-buy|\d+\s+for\s+£).{0,70}/i);
  const productUrl = canonicalOfficialPage($, store, finalUrl, productNode);
  if (!productUrl) return null;
  const packLabel = `${pack.size} ${pack.unit}`;
  const evidence = `Official retailer product page${priceSource.structured ? ' structured offer' : ' price metadata/page'}: £${priceSource.price.toFixed(2)} GBP; pack size ${packLabel}.`;
  const confidence = promotionMatch ? Math.min(0.84, priceSource.confidence) : priceSource.confidence;
  return {
    productName: title.slice(0, 180),
    price: priceSource.price,
    currency: 'GBP',
    packSize: pack.size,
    packUnit: pack.unit,
    brand: brand.slice(0, 100),
    productUrl,
    sourceUrl: productUrl,
    priceEvidence: evidence.slice(0, 500),
    confidence,
    promotionText: promotionMatch ? promotionMatch[0].trim().slice(0, 180) : priceSource.promotionText || '',
    productId: String(priceSource.productId || '').slice(0, 80),
    structuredPrice: Boolean(priceSource.structured),
    pageVerified: true
  };
}

export function buildBraveSearchUrl(store, itemName) {
  const config = PRICE_LOOKUP_STORES[store];
  if (!config) throw new Error('Select one of the supported UK supermarkets.');
  const url = new URL(BRAVE_SEARCH_ENDPOINT);
  url.searchParams.set('q', `site:${config.domains[0]} ${String(itemName || '').trim()} product price pack size UK`);
  url.searchParams.set('country', 'GB');
  url.searchParams.set('search_lang', 'en');
  url.searchParams.set('ui_lang', 'en-GB');
  url.searchParams.set('count', String(SEARCH_RESULTS_COUNT));
  url.searchParams.set('text_decorations', 'false');
  url.searchParams.set('spellcheck', 'true');
  url.searchParams.set('operators', 'true');
  return url;
}

function createBraveError(status, retryAfter = '') {
  const retrySec = Number(retryAfter);
  const error = new Error(
    status === 401 || status === 403 ? 'Brave Search rejected the API key. Check BRAVE_SEARCH_API_KEY in Render.' :
    status === 402 ? 'Brave Search credits are exhausted or the plan is paused. Check the Brave dashboard balance; make sure auto-reload is off to avoid charges.' :
    status === 429 ? 'Brave Search is rate-limiting requests. Wait briefly, then retry the lookup.' :
    status >= 500 ? 'Brave Search is temporarily unavailable. Try again later.' :
    `Brave Search request failed (HTTP ${status}).`
  );
  error.kind = status === 401 || status === 403 ? 'authentication' : status === 402 ? 'credits' : status === 429 ? 'rate_limit' : status >= 500 ? 'temporary' : 'provider';
  error.retryAfterMs = Number.isFinite(retrySec) && retrySec > 0 ? Math.min(120_000, retrySec * 1000) : 0;
  return error;
}

async function braveSearchUrls(apiKey, store, itemName, fetchImpl, timeoutMs) {
  const endpoint = buildBraveSearchUrl(store, itemName);
  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: {
      'X-Subscription-Token': apiKey,
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'User-Agent': 'MealPlannerPersonalPriceLookup/1.0'
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw createBraveError(response.status, response.headers?.get?.('retry-after') || '');
  const body = await response.json();
  // Only retain URLs transiently to visit retailer-owned pages. Brave titles/snippets
  // and the response object are deliberately not copied into app state or cached.
  const results = Array.isArray(body?.web?.results) ? body.web.results : [];
  const seen = new Set();
  return results.map(row => {
    let url;
    try { url = new URL(String(row?.url || '')).href; } catch { return null; }
    if (!isOfficialRetailerUrl(store, url) || seen.has(url)) return null;
    seen.add(url);
    return { url, rank: productMatchScore(itemName, String(row?.title || '')) };
  }).filter(Boolean).sort((a, b) => b.rank - a.rank).slice(0, SEARCH_RESULTS_COUNT);
}

async function fetchOfficialPage(store, initialUrl, fetchImpl, timeoutMs) {
  let current = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isOfficialRetailerUrl(store, current)) return null;
    let response;
    try {
      response = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'Accept': 'text/html,application/xhtml+xml;q=0.9',
          'User-Agent': 'Mozilla/5.0 (compatible; MealPlannerPriceCheck/1.0; +https://www.mealplanner.local)',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch { return null; }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || hop === MAX_REDIRECTS) return null;
      try { current = new URL(location, current).href; } catch { return null; }
      continue;
    }
    if (!response.ok) return null;
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) return null;
    const size = Number(response.headers.get('content-length') || 0);
    if (size > MAX_HTML_BYTES) return null;
    let html;
    try { html = await response.text(); } catch { return null; }
    if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) return null;
    const finalUrl = response.url || current;
    if (!isOfficialRetailerUrl(store, finalUrl)) return null;
    return { html, finalUrl };
  }
  return null;
}

async function productFromOfficialUrl(store, itemName, url, fetchImpl, timeoutMs) {
  if (!isOfficialRetailerUrl(store, url)) return null;
  const fetched = await fetchOfficialPage(store, url, fetchImpl, timeoutMs);
  if (!fetched) return null;
  const candidate = parseOfficialProductPage(fetched.html, store, fetched.finalUrl);
  if (!candidate) return null;
  const matchScore = productMatchScore(itemName, candidate.productName);
  if (matchScore < KNOWN_PRODUCT_URL_MATCH_THRESHOLD) return null;
  return { ...candidate, matchScore };
}

/**
 * Refresh a previously saved, retailer-declared official product URL before searching.
 * If it no longer works or no verified URL is known, use one Brave Search request to
 * discover official retailer pages. Brave result titles/snippets/URLs are transient
 * discovery inputs only; they are not cached or returned to the app.
 */
export async function lookupStoreItem({ apiKey, store, item, fetchImpl = globalThis.fetch, searchTimeoutMs = 12000, pageTimeoutMs = 10000 }) {
  if (!fetchImpl) throw new Error('This Node.js runtime does not support fetch. Use Node.js 22 or newer.');
  if (!PRICE_LOOKUP_STORES[store]) throw new Error('Select one of the supported UK supermarkets.');
  const itemName = String(item?.name || '').trim().slice(0, 140);
  if (!itemName) return { product: null, recordsScanned: 0, rejected: 0, searchRequests: 0, usedKnownUrl: false };

  const knownProductUrl = String(item?.knownProductUrl || '').trim();
  if (knownProductUrl && isOfficialRetailerUrl(store, knownProductUrl)) {
    const refreshed = await productFromOfficialUrl(store, itemName, knownProductUrl, fetchImpl, pageTimeoutMs);
    if (refreshed) {
      delete refreshed.matchScore;
      return { product: refreshed, recordsScanned: 1, rejected: 0, searchRequests: 0, usedKnownUrl: true };
    }
  }

  if (!apiKey) throw new Error('Backend is missing BRAVE_SEARCH_API_KEY. Add a Brave Search API key in Render before using automatic supermarket price lookup.');
  const urlRows = await braveSearchUrls(apiKey, store, itemName, fetchImpl, searchTimeoutMs);
  let recordsScanned = 0;
  let rejected = 0;
  const candidates = [];
  for (const row of urlRows.slice(0, MAX_PRODUCT_PAGES_PER_ITEM)) {
    const candidate = await productFromOfficialUrl(store, itemName, row.url, fetchImpl, pageTimeoutMs);
    if (!candidate) { rejected++; continue; }
    recordsScanned++;
    candidates.push(candidate);
  }
  candidates.sort((a, b) => b.matchScore - a.matchScore || b.confidence - a.confidence);
  const best = candidates[0] || null;
  if (best) delete best.matchScore;
  return { product: best, recordsScanned, rejected, searchRequests: 1, usedKnownUrl: false };
}
