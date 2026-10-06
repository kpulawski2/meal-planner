// Normalise the two retailer-specific Apify schemas into the internal price-candidate schema.
// Keep this module dependency-free so its edge cases can be tested with Node's built-in runner.

const clean = (value, max = 800) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export function normalizePriceText(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function retailerSlug(value) {
  const norm = normalizePriceText(value);
  if (norm.includes('lidl')) return 'lidl';
  if (norm.includes('aldi')) return 'aldi';
  if (norm.includes('asda')) return 'asda';
  return norm.replace(/\s+/g, '');
}

function parsePack(packText, name, ingredientName) {
  const target = `${String(packText || '').replace(/,/g, '.')} ${String(name || '').replace(/,/g, '.')}`.trim();
  let m = target.match(/\b(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|grams?|ml|millilit(?:re|er)s?|l|lit(?:re|er)s?)\b/i);
  let amount, unit;
  if (m) { amount = Number(m[1]) * Number(m[2]); unit = m[3]; }
  if (!(amount > 0)) {
    m = target.match(/(?:^|\b)(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|grams?|ml|millilit(?:re|er)s?|l|lit(?:re|er)s?)\b/i);
    if (m) { amount = Number(m[1]); unit = m[2]; }
  }
  if (amount > 0 && Number.isFinite(amount)) {
    const u = normalizePriceText(unit);
    if (['kg', 'kilogram', 'kilograms', 'kilo'].includes(u)) return { size: amount, unit: 'kg', dim: 'mass' };
    if (['g', 'gram', 'grams'].includes(u)) return { size: amount, unit: 'g', dim: 'mass' };
    if (['l', 'litre', 'litres', 'liter', 'liters'].includes(u)) return { size: amount, unit: 'l', dim: 'volume' };
    if (['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'].includes(u)) return { size: amount, unit: 'ml', dim: 'volume' };
  }
  const ingredient = normalizePriceText(ingredientName);
  if (/\beggs?\b/.test(ingredient) || /\beggs?\b/.test(normalizePriceText(target))) {
    m = target.match(/\b(\d+)\s*(?:large\s+|medium\s+|free range\s+)?eggs?\b/i)
      || target.match(/\b(\d+)\s*(?:pack|packs|ct|count)\b/i);
    if (m) return { size: Number(m[1]), unit: 'pieces', dim: 'each' };
  }
  const itemWord = ingredient.match(/\b(apple|banana|wrap|pitta|bagel|lemon|lime|cucumber|avocado)\b/)?.[1];
  if (itemWord) {
    m = target.match(new RegExp(`\\b(\\d+)\\s*(?:pack|packs|pieces|piece|count|ct|${itemWord}s?)\\b`, 'i'));
    if (m) return { size: Number(m[1]), unit: 'pieces', dim: 'each' };
  }
  if (/\bbread\b/.test(ingredient) && /\bslice/.test(normalizePriceText(target))) {
    m = target.match(/\b(\d+)\s*slices?\b/i);
    if (m) return { size: Number(m[1]), unit: 'slices', dim: 'slice' };
  }
  return null;
}

export function matchesApifyStoreRow(raw, selectedStore) {
  if (!raw || typeof raw !== 'object') return false;
  if (selectedStore === 'Lidl') {
    const country = normalizePriceText(raw.countryCode || raw.country || '');
    if (country && !['gb', 'uk', 'united kingdom', 'great britain'].includes(country)) return false;
    const link = clean(raw.url || raw.productUrl || raw.product_url, 1000);
    if (link) {
      try {
        const hostname = new URL(link).hostname.toLowerCase();
        if (!(hostname === 'lidl.co.uk' || hostname.endsWith('.lidl.co.uk'))) return false;
      } catch { return false; }
    }
    // Never accept a foreign price into the UK Lidl basket. The actor should return GB metadata or a UK product URL.
    return Boolean(country === 'gb' || country === 'uk' || country === 'united kingdom' || country === 'great britain' || link);
  }
  const expected = retailerSlug(selectedStore);
  const observed = retailerSlug(raw.retailer || raw.retailerName || raw.store || '');
  return Boolean(observed && observed === expected);
}

export function adaptApifyProduct(raw, selectedStore, sourceType = 'live-retailer') {
  if (!matchesApifyStoreRow(raw, selectedStore)) return null;
  const currencyRaw = clean(raw.currency || raw.currencyCode || raw.currencySymbol || 'GBP', 30);
  const currency = currencyRaw === '£' ? 'gbp' : normalizePriceText(currencyRaw);
  if (!['gbp', 'gb', 'pound sterling', 'pounds sterling'].includes(currency)) return null;
  const baseName = clean(raw.name || raw.productName || raw.product_name || raw.fullTitle || raw.title || raw.productTitle, 180);
  const fullName = clean(raw.fullTitle || raw.productName || raw.product_name || raw.name || raw.title || raw.productTitle, 180);
  const productName = selectedStore === 'Lidl' ? (fullName || baseName) : (baseName || fullName);
  if (!productName) return null;
  const packText = clean(raw.packSize || raw.packaging || raw.quantity || raw.product_quantity || raw.fullTitle || raw.title || '', 120);
  const parsedPack = parsePack(`${packText} ${raw.fullTitle || ''} ${raw.title || ''}`, productName, productName);
  const priceRaw = raw.price ?? raw.currentPrice ?? raw.priceValue;
  const price = typeof priceRaw === 'number' ? priceRaw : Number(String(priceRaw ?? '').replace(/[£\s,]/g, ''));
  if (!Number.isFinite(price) || price <= 0) return null;
  const stamp = clean(raw.scrapedAt || raw.scraped_at || raw.observedAt || raw.date || raw.updatedAt || '', 80);
  const timestamp = Date.parse(stamp);
  if (!stamp || !Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp).toISOString().slice(0, 10);
  const brand = clean(raw.brand || raw.brands, 120);
  const productCode = Array.isArray(raw.ean) ? raw.ean[0] : Array.isArray(raw.eans) ? raw.eans[0] : raw.ean || raw.productId || raw.retailerProductId || raw.productCode || '';
  const product = {
    product_name: productName,
    brands: brand,
    product_quantity: parsedPack?.size,
    product_quantity_unit: parsedPack?.unit,
    code: clean(String(productCode || ''), 80)
  };
  const wasPrice = Number(raw.wasPrice ?? raw.priceBeforeOffer);
  const promotionText = clean(raw.promotionText || (Number.isFinite(wasPrice) && wasPrice > price ? `Was £${wasPrice.toFixed(2)}` : ''), 180);
  const sourceUrl = selectedStore === 'Lidl'
    ? 'https://apify.com/datascrapers/lidl-scraper'
    : 'https://apify.com/yappman/uk-supermarket-price-scraper';
  const productUrl = clean(raw.url || raw.productUrl || raw.product_url, 1000);
  return {
    id: clean(String(raw.id || raw.productId || raw.retailerProductId || ''), 100),
    product_code: product.code,
    product_name: productName,
    product,
    price: Math.round(price * 100) / 100,
    price_per: 'UNIT',
    currency: 'GBP',
    type: 'PRODUCT',
    date,
    location: { osm_name: selectedStore, osm_display_name: `${selectedStore} UK online listing`, osm_address_country_code: 'gb' },
    sourceType,
    sourceName: `${selectedStore} product catalogue via Apify`,
    sourceUrl,
    productUrl,
    packText,
    retailer: selectedStore,
    promotionText,
    loyaltyPrice: Number.isFinite(Number(raw.loyaltyPrice)) && Number(raw.loyaltyPrice) > 0 ? Number(raw.loyaltyPrice) : null,
    imageUrl: clean(raw.imageUrl || raw.image || '', 1000),
    rawProduct: raw
  };
}

export function splitSearchBatches(queries, size = 20) {
  if (!Number.isInteger(size) || size < 1) throw new Error('Batch size must be a positive integer.');
  const unique = [...new Set((queries || []).map(x => clean(String(x), 180)).filter(Boolean))];
  const batches = [];
  for (let i = 0; i < unique.length; i += size) batches.push(unique.slice(i, i + size));
  return batches;
}
