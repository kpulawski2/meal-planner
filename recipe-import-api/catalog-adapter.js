import * as cheerio from 'cheerio';

const CATALOG_STORES = {
  Asda: {
    name: 'Asda',
    sitemap: 'https://www.asda.com/sitemap-index.xml',
    allowedProduct: (url) => /^https:\/\/www\.asda\.com\/groceries\/product\//i.test(url),
  },
  Aldi: {
    name: 'Aldi',
    sitemap: 'https://www.aldi.co.uk/sitemap_products.xml',
    allowedProduct: (url) => /^https:\/\/www\.aldi\.co\.uk\/product\//i.test(url),
  },
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_SITEMAPS = 250;
const MAX_PRODUCT_URLS = 100000;
const REQUEST_TIMEOUT_MS = 12000;
const catalogCache = new Map();

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
  const seen = new Set();
  const queue = [config.sitemap];
  let sitemapCount = 0;

  while (queue.length && sitemapCount < MAX_SITEMAPS && seen.size < MAX_PRODUCT_URLS) {
    const sitemapUrl = queue.shift();
    sitemapCount += 1;
    const xml = await fetchText(sitemapUrl);
    for (const loc of extractLocs(xml)) {
      if (loc.endsWith('.xml') || /sitemap/i.test(loc)) {
        if (!queue.includes(loc) && sitemapCount + queue.length < MAX_SITEMAPS) queue.push(loc);
      } else if (config.allowedProduct(loc)) {
        seen.add(loc);
        if (seen.size >= MAX_PRODUCT_URLS) break;
      }
    }
  }

  const urls = [...seen];
  if (!urls.length) throw new Error(`No ${storeName} product URLs were found in the retailer sitemap.`);
  catalogCache.set(storeName, { createdAt: Date.now(), urls, sitemapCount });
  return catalogCache.get(storeName);
}

async function getIndex(storeName) {
  const cached = catalogCache.get(storeName);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached;
  return buildUrlIndex(storeName);
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

export async function searchCatalog(storeName, query, limit = 8) {
  const index = await getIndex(storeName);
  const q = clean(query, 120);
  const rows = index.urls
    .map((url) => ({ url, score: scoreCandidate(q, url) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))
    .slice(0, Math.max(1, Math.min(Number(limit) || 8, 12)));
  return {
    store: storeName,
    query: q,
    indexSize: index.urls.length,
    sitemapCount: index.sitemapCount,
    refreshedAt: new Date(index.createdAt).toISOString(),
    results: rows.map((r) => ({ url: r.url, score: r.score })),
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
  const html = await fetchText(url);
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
  if (storeName) catalogCache.delete(storeName);
  else catalogCache.clear();
}

export function catalogStoreInfo() {
  return Object.values(CATALOG_STORES).map((x) => ({ name: x.name, sitemap: x.sitemap }));
}
