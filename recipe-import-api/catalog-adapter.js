import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const REQUEST_TIMEOUT_MS = 12000;
const catalogCache = new Map();
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ASDA_CATALOGUE_PATH = process.env.ASDA_CATALOGUE_PATH || path.resolve(MODULE_DIR, '../data/products.json');
const ASDA_METADATA_PATH = process.env.ASDA_CATALOGUE_META_PATH || path.resolve(MODULE_DIR, '../data/catalogue-meta.json');

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
    try {
      const [catalogueText, metadataText] = await Promise.all([
        readFile(ASDA_CATALOGUE_PATH, 'utf8'),
        readFile(ASDA_METADATA_PATH, 'utf8'),
      ]);
      const products = JSON.parse(catalogueText);
      const metadata = JSON.parse(metadataText);
      const productCount = Array.isArray(products) ? products.length : 0;
      const complete = metadata.status === 'complete' && productCount >= 100;
      const seed = metadata.status === 'seed' || (!metadata.status && productCount > 0);
      if ((complete || seed) && Array.isArray(products) &&
          products.length === Number(metadata.products_saved) &&
          products.every(product => product && /^https:\/\/www\.asda\.com\/groceries\/product\//i.test(product.url))) {
        const createdAt = Date.parse(metadata.refreshed_at) || Date.now();
        const index = {
          createdAt,
          urls: products.map(product => product.url),
          products,
          sitemapCount: Number(metadata.discovered_sitemaps) || 0,
          snapshotStatus: complete ? 'complete' : 'seed',
          source: complete ? 'validated ASDA catalogue snapshot' : 'ASDA seed snapshot',
        };
        catalogCache.set(storeName, index);
        return index;
      }
    } catch (error) {
      if (error?.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
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

function productSearchText(product) {
  return [
    product.name, product.ingredient, product.brand, product.category,
    product.packSize, product.sku, product.gtin,
  ].filter(Boolean).join(' ');
}

export async function searchCatalog(storeName, query, limit = 8) {
  const index = await getIndex(storeName);
  const q = clean(query, 120);
  const maxRows = Math.max(1, Math.min(Number(limit) || 8, 12));
  const rows = (index.products || index.urls.map(url => ({ url })))
    .map(product => ({
      product,
      url: product.url,
      score: scoreCandidate(q, index.products ? productSearchText(product) : product.url),
    }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))
    .slice(0, maxRows);
  return {
    store: storeName,
    query: q,
    indexSize: index.urls.length,
    sitemapCount: index.sitemapCount,
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
      sku: product.sku || null,
      gtin: product.gtin || null,
      availability: product.availability || 'unknown',
      available: product.available ?? null,
      image: product.image || null,
      category: product.category || null,
      nutrition: product.nutrition || null,
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
      sku: saved.sku || null,
      gtin: saved.gtin || null,
      brand: saved.brand || null,
      category: saved.category || null,
      availability: saved.availability || 'unknown',
      available: saved.available ?? null,
      image: saved.image || null,
      nutrition: saved.nutrition || null,
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
  if (storeName) catalogCache.delete(storeName);
  else catalogCache.clear();
}

export function catalogStoreInfo() {
  return Object.values(CATALOG_STORES).map((x) => ({ name: x.name, sitemap: x.sitemap }));
}

export async function catalogueStatus() {
  try {
    const [catalogueText, metadataText] = await Promise.all([
      readFile(ASDA_CATALOGUE_PATH, 'utf8'),
      readFile(ASDA_METADATA_PATH, 'utf8'),
    ]);
    const products = JSON.parse(catalogueText);
    const metadata = JSON.parse(metadataText);
    const catalogueCount = Array.isArray(products) ? products.length : 0;
    return {
      ...metadata,
      status: metadata.status || (catalogueCount ? 'seed' : 'unavailable'),
      products_saved: catalogueCount,
      healthy: metadata.status === 'complete' && catalogueCount >= 100 && catalogueCount === Number(metadata.products_saved),
    };
  } catch {
    return { status: 'unavailable', healthy: false, products_saved: 0, source: 'ASDA official sitemap' };
  }
}
