import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setImmediate as yieldToServer } from 'node:timers/promises';

const CATALOG_STORES = {
  Asda: {
    name: 'Asda',
    catalogue: 'https://www.asda.com/groceries/search',
    allowedProduct: (url) => /^https:\/\/www\.asda\.com\/groceries\/product\//i.test(url),
  },
  Aldi: {
    name: 'Aldi',
    sitemap: 'https://www.aldi.co.uk/sitemap_products.xml',
    allowedProduct: (url) => /^https:\/\/www\.aldi\.co\.uk\/product\//i.test(url),
  },
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12000;
const PRODUCE_TERMS = new Set(['apple', 'avocado', 'banana', 'berry', 'blueberry', 'broccoli', 'carrot', 'cucumber', 'garlic', 'grape', 'lemon', 'lettuce', 'mango', 'mushroom', 'onion', 'orange', 'potato', 'spinach', 'strawberry', 'tomato', 'courgette', 'salad']);
const SPICE_TERMS = new Set(['basil', 'chilli', 'chili', 'cinnamon', 'clove', 'coriander', 'cumin', 'herb', 'nutmeg', 'oregano', 'paprika', 'pepper', 'seasoning', 'spice', 'thyme', 'turmeric']);
const catalogCache = new Map();
const catalogLoads = new Map();
let catalogGeneration = 0;
let catalogueStatusCache = null;
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ASDA_CATALOGUE_PATH = process.env.ASDA_CATALOGUE_PATH || path.resolve(MODULE_DIR, '../data/products.json');
const ASDA_METADATA_PATH = process.env.ASDA_CATALOGUE_META_PATH || path.resolve(MODULE_DIR, '../data/catalogue-meta.json');

async function snapshotSignature() {
  const [products, metadata] = await Promise.all([stat(ASDA_CATALOGUE_PATH), stat(ASDA_METADATA_PATH)]);
  return `${products.mtimeMs}:${products.size}:${metadata.mtimeMs}:${metadata.size}`;
}

async function readAsdaSnapshot() {
  const signature = await snapshotSignature();
  const metadata = JSON.parse(await readFile(ASDA_METADATA_PATH, 'utf8'));
  // Keep the large source string out of the index-building scope so it can be collected.
  const products = JSON.parse(await readFile(ASDA_CATALOGUE_PATH, 'utf8'));
  if (signature !== await snapshotSignature()) throw new Error('The ASDA snapshot changed while loading. Please retry.');
  return { products, metadata, signature };
}

async function buildNameIndex(products) {
  const postings = new Map();
  for (let index = 0; index < products.length; index++) {
    for (const token of new Set(productTokens(products[index]?.name))) {
      let matches = postings.get(token);
      if (!matches) postings.set(token, matches = []);
      matches.push(index);
    }
    if (index % 256 === 255) await yieldToServer();
  }
  return postings;
}

function clean(value, max = 300) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function unescapeXml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'MealPlanner/2.1 (+official-retailer-catalogue-check)',
        accept: 'application/xml,text/xml,text/html;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractLocs(xml) {
  return [...String(xml || '').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => unescapeXml(m[1].trim())).filter(Boolean);
}

async function buildUrlIndex(storeName) {
  const config = CATALOG_STORES[storeName];
  if (!config) throw new Error(`Unsupported catalog store: ${storeName}`);

  if (storeName === 'Asda') {
    let products;
    let metadata;
    let signature;
    try {
      ({ products, metadata, signature } = await readAsdaSnapshot());
    } catch (error) {
      if (error?.code === 'ENOENT' || error instanceof SyntaxError) {
        throw new Error('No complete ASDA catalogue snapshot is available yet.');
      }
      throw error;
    }

    if (Array.isArray(products) && metadata && typeof metadata === 'object') {
      const productCount = Array.isArray(products) ? products.length : 0;
      const complete = metadata.status === 'complete' && productCount >= 100 &&
        productCount === Number(metadata.products_saved) &&
        productCount === Number(metadata.products_expected) && Number(metadata.coverage) === 1;
      if (complete && products.every(product => product && config.allowedProduct(product.url))) {
        const createdAt = Date.parse(metadata.refreshed_at) || Date.now();
        const index = {
          createdAt,
          urls: products.map(product => product.url),
          products,
          categoryCount: Number(metadata.category_count) || 0,
          snapshotStatus: 'complete',
          source: 'validated ASDA catalogue snapshot',
          loadedAt: Date.now(),
          signature,
          metadata,
          nameIndex: await buildNameIndex(products),
          candidateCache: new Map(),
        };
        return index;
      }
    }

    throw new Error('The ASDA catalogue snapshot is incomplete; it was not used for product matching.');
  }

  const seen = new Set();
  const visitedSitemaps = new Set();
  const queue = [config.sitemap];
  let sitemapCount = 0;

  while (queue.length) {
    const sitemapUrl = queue.shift();
    if (visitedSitemaps.has(sitemapUrl)) continue;
    visitedSitemaps.add(sitemapUrl);
    sitemapCount += 1;
    const xml = await fetchText(sitemapUrl);
    for (const loc of extractLocs(xml)) {
      if (loc.endsWith('.xml') || /sitemap/i.test(loc)) {
        if (!visitedSitemaps.has(loc) && !queue.includes(loc)) queue.push(loc);
      } else if (config.allowedProduct(loc)) {
        seen.add(loc);
      }
    }
  }

  const urls = [...seen];
  if (!urls.length) throw new Error(`No ${storeName} product URLs were found in the retailer sitemap.`);
  return { createdAt: Date.now(), loadedAt: Date.now(), urls, sitemapCount };
}

async function getIndex(storeName) {
  const cached = catalogCache.get(storeName);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached;
  if (catalogLoads.has(storeName)) return catalogLoads.get(storeName);
  const generation = catalogGeneration;
  const loading = (async () => {
    if (storeName === 'Asda' && cached && cached.signature === await snapshotSignature()) {
      cached.loadedAt = Date.now();
      return cached;
    }
    const index = await buildUrlIndex(storeName);
    if (generation === catalogGeneration) {
      catalogCache.set(storeName, index);
      if (storeName === 'Asda') catalogueStatusCache = { ...index.metadata, healthy: true, products_saved: index.products.length };
    }
    return index;
  })();
  catalogLoads.set(storeName, loading);
  try { return await loading; }
  finally { if (catalogLoads.get(storeName) === loading) catalogLoads.delete(storeName); }
}

function slugText(url) {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path
      .replace(/\/product\//, ' ')
      .replace(/[-_\/]+/g, ' ')
      .replace(/\b\d{2,}\b/g, ' ')
      .replace(/\b(?:g|kg|ml|l|each|pack|pk)\b/g, ' ');
  } catch {
    return url.toLowerCase();
  }
}

function tokens(value) {
  return clean(value, 200).toLowerCase().split(/[^a-z0-9%]+/).filter((x) => x.length >= 2);
}

function productTokens(value) {
  return tokens(String(value || '').replace(/&nbsp;|&amp;/gi, ' ')).map((token) => {
    if (token === 'yogurt' || token === 'yogurts') return 'yoghurt';
    if (token === 'chili') return 'chilli';
    if (token.length > 4 && token.endsWith('ies')) return token.slice(0, -3) + 'y';
    if (token.length > 4 && token.endsWith('oes')) return token.slice(0, -2);
    if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
    return token;
  });
}

function productDimension(unit) {
  const normalized = clean(unit, 20).toLowerCase();
  if (['g', 'kg', 'gram', 'grams', 'mass'].includes(normalized)) return 'mass';
  if (['ml', 'l', 'litre', 'litres', 'liter', 'liters', 'volume'].includes(normalized)) return 'volume';
  if (['each', 'ea', 'piece', 'pieces', 'count'].includes(normalized)) return 'count';
  return '';
}

function scoreCandidate(query, url) {
  const q = tokens(query);
  const text = slugText(url);
  if (!q.length) return 0;
  let score = 0;
  for (const token of q) {
    if (text.includes(token)) score += token.length >= 5 ? 2 : 1;
  }
  if (text.includes(q.join(' '))) score += 3;
  return score;
}

function scoreProduct(query, product, dimension = '', preparedQuery = null) {
  const queryTokens = preparedQuery || productTokens(query);
  const nameTokens = productTokens(product?.name);
  if (!queryTokens.length || !nameTokens.length) return 0;

  const name = new Set(nameTokens);
  const brand = new Set(productTokens(product.brand));
  const categoryText = [product.category, ...(product.categoryPath || [])].filter(Boolean).join(' ');
  const category = new Set(productTokens(categoryText));
  const nameHits = queryTokens.filter(token => name.has(token)).length;
  if (!nameHits) return 0;

  let score = 0;
  for (const token of queryTokens) {
    if (name.has(token)) score += token.length >= 5 ? 4 : 3;
    else if (brand.has(token)) score += 0.5;
    else score -= 1;
  }

  const title = nameTokens.join(' ');
  const phrase = queryTokens.join(' ');
  if ((' ' + title + ' ').includes(' ' + phrase + ' ')) score += 4;
  if (nameHits === queryTokens.length) score += 3;
  score += queryTokens.filter(token => category.has(token)).length * 2;
  score -= Math.min(Math.max(0, nameTokens.length - nameHits) * 0.1, 1.5);
  if (nameHits === queryTokens.length) score += 2;
  if (queryTokens.length === 1 && nameHits === 1) {
    const query = new Set(queryTokens);
    const extras = nameTokens.filter(token => !query.has(token) && !brand.has(token));
    if (extras.length === 0) score += 5;
  }
  if (queryTokens.length === 1 && queryTokens[0] === 'milk') {
    if (/\b(?:fresh milk|semi skimmed milk|skimmed milk|whole milk|milk, butter, cream & eggs)\b/i.test(categoryText)) score += 5;
    if (/\b(?:coconut|almond|oat|soy|soya|condensed|evaporated) milk\b|\bmilk chocolate\b/i.test(product.name)) score -= 4;
  }
  if (queryTokens.some(token => ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'salmon', 'cod', 'fish'].includes(token))) {
    if (/meat, poultry & fish/i.test(categoryText)) score += 4;
    if (/frozen food/i.test(categoryText)) score -= 1;
    if (/chicken breasts|chicken breast/i.test(categoryText) && queryTokens.includes('chicken')) score += 2;
    for (const token of ['breaded', 'cooked', 'sliced', 'slice', 'skewer', 'kebab', 'marinated', 'flavoured', 'flavour', 'flavor', 'seasoned', 'seasoning', 'sizzle', 'steak', 'thai', 'tikka', 'peri', 'spicy', 'hot', 'garlic', 'lemon', 'honey', 'smoky', 'sweet', 'pepper', 'sticky', 'teriyaki', 'chargrill', 'chargrilled', 'bbq', 'barbecue', 'sandwich', 'wrap', 'crispy']) {
      if (name.has(token) && !queryTokens.includes(token)) score -= ['sandwich', 'wrap'].includes(token) ? 16 : 9;
    }
    if (/prepared|marinated|flavoured|flavored|seasoned|sizzle|ready to cook/i.test(categoryText) && !queryTokens.some(token => ['marinated', 'flavoured', 'flavor', 'seasoned'].includes(token))) score -= 7;
  }
  if (queryTokens.some(token => PRODUCE_TERMS.has(token)) || (queryTokens.includes('pepper') && queryTokens.some(token => ['bell', 'sweet'].includes(token)))) {
    if (/fresh fruit|fresh salad|vegetables & flowers|fresh vegetables/i.test(categoryText)) score += 6;
    if (/dried fruit|raw nuts|tinned|ketchup|sauce|sweets|snacks|desserts/i.test(categoryText)) score -= 6;
    for (const token of ['mini', 'portion', 'pickled', 'pickle', 'sour', 'brine', 'smoothie', 'juice', 'dip', 'seed', 'seeds', 'wipes', 'mask', 'fragrance']) {
      if (name.has(token) && !queryTokens.includes(token)) score -= ['wipes', 'mask', 'fragrance'].includes(token) ? 20 : ['pickled', 'pickle', 'sour', 'brine', 'smoothie', 'juice', 'dip', 'seed', 'seeds'].includes(token) ? 12 : 7;
    }
  }
  if (queryTokens.some(token => SPICE_TERMS.has(token))) {
    if (/herbs? & spices|spices|seasonings/i.test(categoryText)) score += 6;
    if (/sweets|chocolates|desserts|bakery|toys|household/i.test(categoryText)) score -= 4;
  }
  const wantedDimension = productDimension(dimension);
  const offeredDimension = productDimension(product.packUnit);
  if (wantedDimension && offeredDimension) score += wantedDimension === offeredDimension ? 1 : -2;
  if (/\b(?:food|fruit|vegetable|meat|fish|dairy|bakery|frozen|chilled|drink|cupboard|snack|sweets|world)\b/i.test(categoryText)) score += 0.5;
  if (/\b(?:home & entertainment|toys?|pets?|laundry|household|toiletries|beauty|wellness|garden|furniture|electrical|stationery|craft)\b/i.test(categoryText)) score -= 6;
  return score > 0 ? score : 0;
}

function canonicalDimension(value) {
  const normalized = clean(value, 30).toLowerCase();
  if (['mass', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms'].includes(normalized)) return 'mass';
  if (['volume', 'ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters', 'l', 'litre', 'litres', 'liter', 'liters'].includes(normalized)) return 'volume';
  if (['each', 'count', 'piece', 'pieces', 'pcs', 'pc', 'ea', 'unit', 'units'].includes(normalized)) return 'count';
  return normalized;
}

function packUnitMeta(product) {
  const explicit = clean(product?.packUnit, 30).toLowerCase();
  const sizeText = clean(product?.packSize, 50).toLowerCase();
  let quantity = Number(product?.packQuantity);
  let unit = explicit;
  if (!(quantity > 0) || !Number.isFinite(quantity) || !unit) {
    const match = sizeText.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pieces?|pcs|each|ea)\b/i);
    if (match) {
      quantity = Number(match[1]);
      unit = match[2].toLowerCase();
    } else if (/^(?:each|ea|1\s*ea)$/.test(sizeText)) {
      quantity = 1;
      unit = 'each';
    }
  }
  if (!(quantity > 0) || !Number.isFinite(quantity)) return null;
  if (['kg', 'kilogram', 'kilograms'].includes(unit)) return { dimension: 'mass', capacity: quantity * 1000, quantity, unit: 'kg' };
  if (['g', 'gram', 'grams'].includes(unit)) return { dimension: 'mass', capacity: quantity, quantity, unit: 'g' };
  if (['l', 'litre', 'litres', 'liter', 'liters'].includes(unit)) return { dimension: 'volume', capacity: quantity * 1000, quantity, unit: 'l' };
  if (['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'].includes(unit)) return { dimension: 'volume', capacity: quantity, quantity, unit: 'ml' };
  if (['piece', 'pieces', 'pcs', 'pc', 'each', 'ea', 'unit', 'units'].includes(unit)) return { dimension: 'count', capacity: quantity, quantity, unit: 'pieces' };
  return null;
}

function productSummary(product, score) {
  const inferredPack = packUnitMeta(product);
  return {
    url: product.url,
    productName: product.name,
    score,
    brand: product.brand || null,
    packSize: product.packSize || null,
    packQuantity: product.packQuantity ?? inferredPack?.quantity ?? null,
    packUnit: product.packUnit || inferredPack?.unit || null,
    priceGBP: product.price == null || !Number.isFinite(Number(product.price)) ? null : Number(product.price),
    priceRegion: product.priceRegion || null,
    pricesByRegion: product.pricesByRegion || {},
    category: product.category || null,
    availability: product.availability || 'unknown',
    available: product.available ?? null,
    image: product.image || null,
    checkedAt: product.checkedAt || product.checked || null,
  };
}

export function rankCatalogCandidates(query, products, dimension = '', limit = 36) {
  const queryTokens = productTokens(query);
  const rows = (Array.isArray(products) ? products : [])
    .map(product => ({ product, score: scoreProduct(query, product, dimension, queryTokens), nameTokens: productTokens(product?.name) }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || String(a.product.url || '').localeCompare(String(b.product.url || '')));
  const strict = rows.filter(row => queryTokens.every(token => row.nameTokens.includes(token)));
  const ranked = strict.length ? strict : rows;
  if (!ranked.length) return [];
  const floor = ranked[0].score - (strict.length ? 8 : 5);
  return ranked.filter(row => row.score >= floor).slice(0, Math.max(1, Math.min(Number(limit) || 36, 60)));
}

function indexedProducts(index, query, strict = false) {
  const words = [...new Set(productTokens(query))];
  if (!words.length) return [];
  const lists = words.map(word => index.nameIndex.get(word) || []);
  if (strict) {
    if (lists.some(list => !list.length)) return [];
    lists.sort((a, b) => a.length - b.length);
    const rest = lists.slice(1).map(list => new Set(list));
    return lists[0].filter(id => rest.every(set => set.has(id))).map(id => index.products[id]);
  }
  const ids = new Set();
  for (const list of lists) for (const id of list) ids.add(id);
  return [...ids].map(id => index.products[id]);
}

function indexedCandidates(index, query, dimension) {
  const cacheKey = JSON.stringify([productTokens(query), productDimension(dimension)]);
  if (index.candidateCache.has(cacheKey)) return index.candidateCache.get(cacheKey);
  // The scorer requires a name-token hit. Full-name matches have priority, so only
  // score their intersection; use the union when no suitable strict match exists.
  let ranked = rankCatalogCandidates(query, indexedProducts(index, query, true), dimension, 36);
  if (!ranked.length) ranked = rankCatalogCandidates(query, indexedProducts(index, query), dimension, 36);
  if (index.candidateCache.size >= 300) index.candidateCache.delete(index.candidateCache.keys().next().value);
  index.candidateCache.set(cacheKey, ranked);
  return ranked;
}

function greatestCommonDivisor(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

export function calculatePackPurchase(candidates, requestedQuantity, dimension) {
  const requested = Number(requestedQuantity);
  const wantedDimension = canonicalDimension(dimension);
  if (!(requested > 0) || !Number.isFinite(requested) || !wantedDimension) return null;
  const offers = (Array.isArray(candidates) ? candidates : []).map(candidate => {
    const product = candidate.product || candidate;
    const meta = packUnitMeta(product);
    const price = Number(product.price);
    if (!meta || !Number.isFinite(meta.capacity) || meta.capacity <= 0 || meta.dimension !== wantedDimension || !Number.isFinite(price) || price <= 0 || product.available === false) return null;
    return { product, score: Number(candidate.score) || 0, meta, priceCents: Math.round(price * 100) };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.priceCents - b.priceCents);
  if (!offers.length) return null;

  const target = Math.ceil(requested - 1e-8);
  const capacities = offers.map(offer => Math.max(1, Math.floor(offer.meta.capacity + 1e-8)));
  const quantum = capacities.reduce(greatestCommonDivisor);
  const targetSteps = Math.ceil(target / quantum);
  const stepsByOffer = capacities.map(capacity => capacity / quantum);
  const largestPack = Math.max(...stepsByOffer);
  const maxStep = targetSteps + largestPack - 1;
  if (maxStep > 250000) {
    const single = offers.map((offer, index) => ({ offer, index, packs: Math.ceil(target / offer.meta.capacity) }))
      .map(row => ({ ...row, cents: row.packs * row.offer.priceCents, over: row.packs * row.offer.meta.capacity - target }))
      .sort((a, b) => a.cents - b.cents || a.over - b.over || b.offer.score - a.offer.score)[0];
    const counts = new Array(offers.length).fill(0);
    counts[single.index] = single.packs;
    return makePurchasePlan(counts, offers, requested);
  }

  const bestCost = new Float64Array(maxStep + 1);
  bestCost.fill(Infinity);
  const previousStep = new Int32Array(maxStep + 1);
  previousStep.fill(-1);
  const previousOffer = new Int16Array(maxStep + 1);
  previousOffer.fill(-1);
  bestCost[0] = 0;
  for (let amount = 1; amount <= maxStep; amount++) {
    for (let i = 0; i < offers.length; i++) {
      const packSteps = stepsByOffer[i];
      if (amount < packSteps) continue;
      const previous = amount - packSteps;
      if (!Number.isFinite(bestCost[previous])) continue;
      const cost = bestCost[previous] + offers[i].priceCents;
      if (cost < bestCost[amount]) {
        bestCost[amount] = cost;
        previousStep[amount] = previous;
        previousOffer[amount] = i;
      }
    }
  }

  let chosen = -1;
  for (let amount = targetSteps; amount <= maxStep; amount++) {
    if (!Number.isFinite(bestCost[amount])) continue;
    if (chosen < 0 || bestCost[amount] < bestCost[chosen] || (bestCost[amount] === bestCost[chosen] && amount < chosen)) chosen = amount;
  }
  if (chosen < 0) return null;
  const counts = new Array(offers.length).fill(0);
  for (let cursor = chosen; cursor > 0;) {
    const offerIndex = previousOffer[cursor];
    if (offerIndex < 0) return null;
    counts[offerIndex] += 1;
    cursor = previousStep[cursor];
  }
  return makePurchasePlan(counts, offers, requested);
}

function makePurchasePlan(counts, offers, requested) {
  const products = offers.flatMap((offer, index) => {
    const packs = counts[index];
    if (!packs) return [];
    return [{
      ...productSummary(offer.product, offer.score),
      packs,
      totalQuantity: Number((packs * offer.meta.capacity).toFixed(3)),
      costGBP: Number((packs * offer.priceCents / 100).toFixed(2)),
    }];
  });
  if (!products.length) return null;
  const totalQuantity = Number(products.reduce((sum, row) => sum + row.totalQuantity, 0).toFixed(3));
  const totalCostGBP = Number(products.reduce((sum, row) => sum + row.costGBP, 0).toFixed(2));
  if (!Number.isFinite(totalQuantity) || !Number.isFinite(totalCostGBP) || totalQuantity < requested) return null;
  return { requestedQuantity: requested, totalQuantity, leftoverQuantity: Number(Math.max(0, totalQuantity - requested).toFixed(3)), totalCostGBP, products };
}

export async function recommendCatalogItems(storeName, items, { signal } = {}) {
  if (storeName !== 'Asda') throw new Error('Automatic pack recommendations currently require the complete ASDA catalogue.');
  const index = await getIndex(storeName);
  if (index.snapshotStatus !== 'complete' || !Array.isArray(index.products)) throw new Error('A complete ASDA catalogue snapshot is required for automatic recommendations.');
  const rows = Array.isArray(items) ? items.slice(0, 200) : [];
  const recommendations = [];
  for (const item of rows) {
      signal?.throwIfAborted();
      const query = clean(item?.name, 120);
      const dimension = clean(item?.dimension, 30);
      const candidates = indexedCandidates(index, query, dimension);
      const bestScore = candidates[0]?.score || 0;
      const relevant = candidates.filter(candidate => candidate.score >= bestScore - 4);
      const quantity = Number(item?.quantity);
      const queryTokens = productTokens(query);
      const bestNameTokens = productTokens(candidates[0]?.product?.name);
      const confidence = candidates.length && bestScore >= 9 && queryTokens.every(token => bestNameTokens.includes(token))
        ? 'high'
        : candidates.length ? 'review' : 'none';
      const plan = confidence === 'high' ? calculatePackPurchase(relevant, quantity, dimension) : null;
      const selectedProduct = plan?.products?.[0] || (candidates[0] ? productSummary(candidates[0].product, candidates[0].score) : null);
      recommendations.push({
        key: clean(item?.key, 180),
        dimension,
        query,
        match: selectedProduct,
        plan,
        candidateCount: relevant.length,
        confidence,
      });
      // Let health checks, response writes and disconnected clients run between items.
      await yieldToServer();
  }
  return {
    store: storeName,
    indexSize: index.urls.length,
    refreshedAt: new Date(index.createdAt).toISOString(),
    recommendations,
  };
}

export async function searchCatalog(storeName, query, limit = 8, dimension = '') {
  const index = await getIndex(storeName);
  const q = clean(query, 120);
  const maxRows = Math.max(1, Math.min(Number(limit) || 8, 12));
  const queryTokens = productTokens(q);
  const rows = (index.products ? indexedProducts(index, q) : index.urls.map(url => ({ url })))
    .map(product => ({
      product,
      url: product.url,
      score: index.products ? scoreProduct(q, product, dimension, queryTokens) : scoreCandidate(q, product.url),
    }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))
    .slice(0, maxRows);
  return {
    store: storeName,
    query: q,
    indexSize: index.urls.length,
    categoryCount: index.categoryCount || 0,
    refreshedAt: new Date(index.createdAt).toISOString(),
    source: index.source || 'official retailer sitemap',
    snapshotStatus: index.snapshotStatus || 'live_sitemap',
    results: rows.map(({ product, url, score }) => index.products ? ({
      url,
      score,
      productName: product.name,
      brand: product.brand || null,
      packSize: product.packSize || null,
      packQuantity: product.packQuantity ?? null,
      packUnit: product.packUnit || null,
      priceGBP: product.price ?? null,
      priceRegion: product.priceRegion || null,
      pricesByRegion: product.pricesByRegion || {},
      pricePerUnitGBP: product.pricePerUnit ?? null,
      pricePerUnitLabel: product.pricePerUnitLabel || null,
      offer: product.offer || null,
      sku: product.sku || null,
      gtin: product.gtin || null,
      availability: product.availability || 'unknown',
      available: product.available ?? null,
      image: product.image || null,
      category: product.category || null,
      nutrition: product.nutrition || null,
      nutritionClaims: product.nutritionClaims || [],
      categoryPath: product.categoryPath || [],
      checkedAt: product.checkedAt || product.checked || null,
      verified: index.snapshotStatus === 'complete' && Number(product.price) > 0 && Number(product.packQuantity) > 0,
    }) : ({ url, score })),
  };
}

function firstNumber(text) {
  const match = String(text || '').match(/£\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
  return match ? Number(match[1]) : null;
}

function extractPack(text) {
  const cleaned = clean(text, 1000);
  const patterns = [
    /\b(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i,
    /\b(\d+)\s*(each|pk|pack|pieces)\b/i,
  ];
  for (const re of patterns) {
    const m = cleaned.match(re);
    if (m) return { size: Number(m[1]), unit: m[2].toLowerCase().replace('pack', 'pieces').replace('pk', 'pieces') };
  }
  return null;
}

export async function fetchProductPage(storeName, url) {
  const config = CATALOG_STORES[storeName];
  if (!config || !config.allowedProduct(url)) throw new Error('Product URL is not an allowed official retailer product page.');
  const index = await getIndex(storeName);
  const saved = index.snapshotStatus === 'complete' ? index.products?.find(product => product.url === url) : null;
  if (saved) {
    return {
      store: storeName,
      url: saved.url,
      productName: saved.name,
      priceGBP: saved.price == null || !Number.isFinite(Number(saved.price)) ? null : Number(saved.price),
      size: saved.packQuantity ?? null,
      unit: saved.packUnit || null,
      packSize: saved.packSize || null,
      pricePerBaseUnitGBP: saved.pricePerBaseUnit ?? null,
      sku: saved.sku || null,
      gtin: saved.gtin || null,
      brand: saved.brand || null,
      category: saved.category || null,
      categoryPath: saved.categoryPath || [],
      availability: saved.availability || 'unknown',
      available: saved.available ?? null,
      image: saved.image || null,
      nutrition: saved.nutrition || null,
      nutritionClaims: saved.nutritionClaims || [],
      pricesByRegion: saved.pricesByRegion || {},
      priceRegion: saved.priceRegion || null,
      pricePerUnitGBP: saved.pricePerUnit ?? null,
      pricePerUnitLabel: saved.pricePerUnitLabel || null,
      offer: saved.offer || null,
      checkedAt: saved.checkedAt || saved.checked || null,
      source: 'validated ASDA catalogue snapshot',
      verified: Number(saved.price) > 0 && Number(saved.packQuantity) > 0,
    };
  }
  const html = await fetchText(url);
  const cheerio = await import('cheerio');
  const $ = cheerio.load(html);
  const title = clean($('h1').first().text() || $('title').first().text(), 240);
  const priceMeta = $('meta[property="product:price:amount"], meta[itemprop="price"]').first().attr('content');
  const explicitPrice = firstNumber($('.pdp-main-details__price').first().text() || $('[class*="price"]').first().text());
  const price = Number.isFinite(Number(priceMeta)) ? Number(priceMeta) : explicitPrice;
  const bodyText = clean($('body').text(), 5000);
  const packText = $('.pdp-main-details__weight').first().text() || bodyText.slice(0, 1800);
  const pack = extractPack(packText);
  const unitMatch = bodyText.match(/\(£\s*([0-9]+(?:\.[0-9]{1,2})?)\s*\/\s*([a-z]+|each)\)/i);
  return {
    store: storeName,
    url,
    productName: title,
    priceGBP: Number.isFinite(price) && price > 0 ? price : null,
    size: pack?.size ?? null,
    unit: pack?.unit ?? null,
    unitPriceGBP: unitMatch ? Number(unitMatch[1]) : null,
    unitPriceUnit: unitMatch ? clean(unitMatch[2], 30) : null,
    checkedAt: new Date().toISOString(),
    source: 'official retailer product page',
    verified: Number.isFinite(price) && price > 0,
  };
}

export function clearCatalogCache(storeName = null) {
  catalogGeneration += 1;
  if (storeName) catalogCache.delete(storeName);
  else catalogCache.clear();
  if (!storeName || storeName === 'Asda') catalogueStatusCache = null;
}

export function catalogStoreInfo() {
  return Object.values(CATALOG_STORES).map((x) => ({
    name: x.name,
    source: x.catalogue || x.sitemap,
  }));
}

export async function catalogueStatus() {
  try {
    const cached = catalogCache.get('Asda');
    if (cached && cached.signature !== await snapshotSignature()) clearCatalogCache('Asda');
    const index = await getIndex('Asda');
    return { ...index.metadata, healthy: true, products_saved: index.products.length };
  } catch {
    catalogueStatusCache = null;
    return { status: 'unavailable', healthy: false, products_saved: 0, source: 'ASDA official product search index' };
  }
}

// Liveness must never read or parse the 50 MB catalogue. Detailed validation is
// shared with matching via /api/catalog/status; an unloaded catalogue is explicit.
export function cachedCatalogueStatus() {
  return catalogueStatusCache ? { ...catalogueStatusCache } : {
    status: catalogLoads.has('Asda') ? 'loading' : 'not_loaded',
    healthy: null,
    products_saved: null,
  };
}
