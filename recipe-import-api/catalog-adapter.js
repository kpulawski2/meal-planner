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
const PRODUCE_TERMS = new Set(['apple', 'avocado', 'banana', 'berry', 'blueberry', 'broccoli', 'carrot', 'celery', 'cucumber', 'garlic', 'grape', 'kiwi', 'lemon', 'lime', 'lettuce', 'mandarin', 'mango', 'melon', 'mushroom', 'onion', 'orange', 'pea', 'pear', 'potato', 'spinach', 'strawberry', 'tomato', 'vegetable', 'courgette', 'salad']);
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
  // Apply the same food vocabulary to the index, search and confidence checks.
  // Retailers call cream cheese "soft cheese" and use both light and lighter.
  const text = String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&nbsp;|&amp;/gi, ' ')
    .replace(/\b(?:soft\s+)?cream\s+cheese\b|\bsoft\s+cheese\b/gi, 'creamcheese')
    .replace(/\b(?:parmigiano(?:\s+reggiano)?|parmesan)\b/gi, 'parmesan')
    .replace(/\b(?:easy\s+peelers?|clementines?|satsumas?)\b/gi, 'mandarin')
    .replace(/\b(?:summer|forest)\s+fruits?\b/gi, 'berry')
    .replace(/\bcooking\s+oil\b/gi, 'oil')
    .replace(/\bcocoa\s+powder\b/gi, 'cocoa')
    .replace(/\b(tikka)\s+(?:curry\s+powder|spice\s+mix)\b/gi, '$1 seasoning')
    .replace(/\bhigh[-\s]+protein\b/gi, 'highprotein')
    .replace(/\b(?:reduced|low)[-\s]+fat\b/gi, 'light')
    .replace(/\blactose[-\s]*free\b|\blactofree\b/gi, 'lactosefree')
    .replace(/\bdairy[-\s]*free\b/gi, 'dairyfree');
  return tokens(text).map((token) => {
    if (token === 'yogurt' || token === 'yogurts') return 'yoghurt';
    if (token === 'chili') return 'chilli';
    if (token === 'lighter' || token === 'lite') return 'light';
    if (token === 'natural') return 'plain';
    if (token.length > 4 && token.endsWith('ies')) return token.slice(0, -3) + 'y';
    if (token.length > 4 && token.endsWith('oes')) return token.slice(0, -2);
    if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
    return token;
  });
}

const OPTIONAL_INGREDIENT_WORDS = new Set(['fresh', 'frozen', 'dried', 'raw', 'lean', 'regular']);
const DAIRY_FLAVOURS = new Set(['banana', 'strawberry', 'raspberry', 'blueberry', 'berry', 'superberry', 'peach', 'passionfruit', 'passion', 'mango', 'papaya', 'coconut', 'lemon', 'apple', 'vanilla', 'chocolate', 'cocoa', 'caramel', 'toffee', 'coffee', 'honey', 'cherry', 'flavour', 'flavored', 'flavoured', 'shake', 'milkshake', 'cheesecake']);
const PLANT_DAIRY_WORDS = new Set(['vegan', 'plant', 'dairyfree', 'almond', 'oat', 'soya', 'soy', 'coconut', 'cashew', 'hemp']);
const COMPOSITE_FOODS = new Set(['soup', 'sandwich', 'wrap', 'pizza', 'medley', 'dinner', 'meal', 'risotto', 'stirfry', 'skewer', 'kebab', 'casserole', 'bake', 'burger', 'nugget', 'croquette', 'pie', 'dip', 'spread', 'cocktail']);

function ingredientWords(query) {
  const words = [...new Set(productTokens(query))].filter(word => !OPTIONAL_INGREDIENT_WORDS.has(word));
  return words.filter(word => word !== 'cheese' || !words.some(item => ['feta', 'cheddar', 'halloumi', 'parmesan', 'quark'].includes(item)));
}

function ingredientCompatible(query, product, preparedWords = ingredientWords(query)) {
  if (product?.available === false || /out[ _-]*of[ _-]*stock|sold[ _-]*out|unavailable|discontinued|not[ _-]*available/i.test(String(product?.availability || ''))) return false;
  const words = new Set(preparedWords);
  const fullWords = new Set(productTokens(query));
  const name = new Set(productTokens(product?.name));
  const title = String(product?.name || '');
  const category = [product?.category, ...(product?.categoryPath || [])].filter(Boolean).join(' ');
  const asked = word => words.has(word);
  const unrequested = set => [...set].some(word => name.has(word) && !asked(word));
  // A token hit in candles, pet food or cosmetics is never an ingredient match.
  if (/\b(?:home & entertainment|toys?|pets?|pet food|laundry|household|toiletries|beauty|garden|furniture|electrical|stationery|craft|baby|toddler)\b/i.test(category)) return false;
  const frozenRequested = fullWords.has('frozen');
  const driedRequested = fullWords.has('dried');
  if (frozenRequested && !/frozen/i.test(category) && !/\bfrozen\b/i.test(title)) return false;
  if (driedRequested && !/dried|dry herbs|herbs & spices|spices/i.test(category) && !/\bdried\b/i.test(title)) return false;

  if (asked('milk')) {
    if (!name.has('milk')) return false;
    const plantRequested = [...PLANT_DAIRY_WORDS].some(asked);
    if (!plantRequested && (unrequested(PLANT_DAIRY_WORDS) || /dairy free|oat & nut/i.test(category))) return false;
    if (!asked('lactosefree') && (name.has('lactosefree') || /lactose free milk/i.test(category))) return false;
    if (unrequested(DAIRY_FLAVOURS)) return false;
    for (const word of ['condensed', 'evaporated', 'powder', 'powdered', 'formula', 'infant', 'toddler', 'protein']) if (name.has(word) && !asked(word)) return false;
    if (/flavoured milk|milkshakes|chocolates|biscuits|desserts|ice lollies/i.test(category) && ![...DAIRY_FLAVOURS].some(asked)) return false;
    if (asked('whole') && !name.has('whole')) return false;
    if (asked('semi') && !name.has('semi')) return false;
    if (asked('skimmed') && !asked('semi') && (name.has('semi') || name.has('whole'))) return false;
  }

  if (asked('yoghurt') || asked('skyr')) {
    if (!(name.has('yoghurt') || name.has('skyr'))) return false;
    if (asked('skyr') && !name.has('skyr')) return false;
    if (unrequested(DAIRY_FLAVOURS) || unrequested(PLANT_DAIRY_WORDS)) return false;
    if (/yogurt drinks|(?:^|>)\s*desserts\s*>|ice cream/i.test(category)) return false;
    // Greek-style thickened yoghurt can have much less protein than strained
    // Greek yoghurt. Recipe nutrition for Greek yoghurt assumes the latter.
    if (asked('greek') && !asked('style') && name.has('style')) return false;
  }

  const cheese = ['creamcheese', 'cottage', 'cheddar', 'feta', 'halloumi', 'parmesan', 'quark'].find(asked);
  if (cheese) {
    if (!name.has(cheese)) return false;
    if (cheese !== 'quark' && !/\bcheeses?\b/i.test(category)) return false;
    if (unrequested(PLANT_DAIRY_WORDS) || /vegan|dairy free|alternative/i.test(category)) return false;
    if (/ready meals|prepared vegetables|pizza|pasta|potatoes/i.test(category)) return false;
    if (unrequested(COMPOSITE_FOODS)) return false;
    if (cheese === 'creamcheese') {
      if (asked('light') && !name.has('light')) return false;
      for (const word of ['garlic', 'herb', 'chive', 'chilli', 'salmon', 'sweet']) if (name.has(word) && !asked(word)) return false;
    }
  }

  const produce = preparedWords.some(word => PRODUCE_TERMS.has(word)) || (asked('pepper') && (asked('bell') || asked('sweet') || frozenRequested));
  // Regular and sweet potatoes have different flavour, texture and nutrition.
  // Their shared name token cannot make either a substitute for the other.
  if (asked('potato') && asked('sweet') !== name.has('sweet')) return false;
  const preparedProduce = ['juice', 'sauce', 'paste', 'powder', 'chopped', 'tinned', 'dried', 'canned', 'stock'].some(word => fullWords.has(word));
  if (produce && !preparedProduce) {
    if (!(frozenRequested ? /frozen.*(?:vegetable|fruit|pea|bean)/i.test(category) : /fresh (?:fruit|salad|vegetable)|vegetables & flowers/i.test(category))) return false;
    if (unrequested(COMPOSITE_FOODS)) return false;
    for (const word of ['mini', 'portion', 'pickled', 'pickle', 'mushy', 'mashed', 'smoothie', 'juice', 'dip', 'sauce', 'seasoned']) if (name.has(word) && !asked(word)) return false;
    if (!asked('mixed') && !asked('salad') && !asked('berry') && [...PRODUCE_TERMS].some(word => name.has(word) && !asked(word))) return false;
  }

  const meat = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'salmon', 'cod', 'fish', 'prawn', 'tuna'].find(asked);
  if (meat && !['stock', 'sauce', 'paste', 'soup'].some(asked)) {
    if (!['vegan', 'plant', 'vegetarian', 'alternative'].some(asked) && /plant[ -]*based|vegan|vegetarian|meat[ -]*free|fish[ -]*free|alternative/i.test(title + ' ' + category)) return false;
    if (!/meat|poultry|fish|seafood|prawn|chicken|turkey|beef|pork|lamb|cod|salmon|tuna/i.test(category)) return false;
    for (const word of ['breaded', 'breadcrumb', 'crumb', 'battered', 'cooked', 'marinated', 'flavour', 'flavoured', 'seasoned', 'sizzle', 'tikka', 'thai', 'peri', 'spicy', 'garlic', 'lemon', 'honey', 'sweet', 'pepper', 'teriyaki', 'chargrill', 'chargrilled', 'bbq', 'barbecue', 'crispy', 'smoked', 'sausage', 'chipotle']) if (name.has(word) && !asked(word)) return false;
    if (unrequested(COMPOSITE_FOODS)) return false;
    if (/prepared|ready meals|marinated|ready to cook/i.test(category)) return false;
    if (['chicken', 'beef', 'pork', 'lamb', 'turkey'].includes(meat) && /tinned|pies|party food|cooked meat|continental meat|charcuterie/i.test(category)) return false;
    if (!frozenRequested && /frozen/i.test(category) && ['chicken', 'beef', 'pork', 'lamb', 'turkey'].includes(meat)) return false;
    if (fullWords.has('lean') && ['belly', 'rib'].some(word => name.has(word))) return false;
    if (fullWords.has('lean') && meat === 'pork' && !['lean', 'loin', 'fillet', 'medallion'].some(word => name.has(word))) return false;
    if (fullWords.has('lean') && meat === 'pork' && !asked('mince') && name.has('mince')) return false;
    if (['crunch', 'scratchings', 'crisp', 'snack'].some(word => name.has(word) && !asked(word))) return false;
  }

  if (['pasta', 'rice', 'noodle', 'couscou', 'orzo', 'lentil', 'bean', 'chickpea'].some(asked) && !['sauce', 'paste', 'soup'].some(asked)) {
    if (unrequested(COMPOSITE_FOODS) || /ready meals|soups|cooking sauces|pasta sauces|pot noodles/i.test(category)) return false;
    for (const word of ['sauce', 'curry', 'flavour', 'flavor', 'flavoured', 'flavored', 'seasoned', 'salad']) if (name.has(word) && !asked(word)) return false;
    if (['pasta', 'rice', 'noodle', 'couscou', 'orzo'].some(asked) && /\bmicro\b|microwav|straight to wok|wok[ -]*ready|ready[ -]*(?:to[ -]*)?wok|instant|ready.*noodles|filled pasta|fresh pasta|\bcooked\b/i.test(category + ' ' + title)) return false;
    if (['pasta', 'rice', 'noodle', 'couscou', 'orzo'].some(asked) && /dessert|pudding|cake|biscuit|snack|cereal|baby/i.test(category + ' ' + title)) return false;
    if (['pasta', 'rice', 'noodle', 'couscou', 'orzo'].some(asked) && /fresh fruit|chilled food|fresh noodle/i.test(category)) return false;
    // Udon and 7Moon packs are hydrated ready noodles; dry recipe weights are
    // not interchangeable with their pack weights. Explicit queries retain them.
    if (asked('noodle') && !asked('udon') && name.has('udon')) return false;
    if (asked('noodle') && !asked('7moon') && name.has('7moon')) return false;
    if (asked('noodle') && !asked('goreng') && /mi[ -]*goreng|indo[ -]*mie/i.test(title)) return false;
    if (asked('couscou') && !asked('pearl') && !asked('israeli') && (name.has('pearl') || name.has('israeli'))) return false;
    if (asked('black') && asked('bean') && !asked('eye') && name.has('eye')) return false;
    if (asked('edamame') && /broccoli|mixed|medley|stir[ -]*fry|salad/i.test(title) && !/broccoli|mixed|medley|stir[ -]*fry|salad/i.test(query)) return false;
  }
  if (preparedWords.some(word => SPICE_TERMS.has(word)) || asked('dill')) {
    if (!/spice|seasoning|dry herbs|herbs|condiment/i.test(category) && !(asked('seasoning') && name.has('seasoning') && /food cupboard/i.test(category))) return false;
    if (!asked('seasoning') && !asked('curry') && /recipe mix|seasoning|sauce|chicken|fish|marinade|rub/i.test(title)) return false;
    if (asked('cinnamon') && !asked('stick') && name.has('stick')) return false;
  }
  if (asked('cocoa') && (asked('powder') || preparedWords.length === 1)) {
    if (!name.has('cocoa') || /hot (?:chocolate|cocoa)|drinking chocolate|instant|mix|sachet/i.test(title)) return false;
    if (/bakery|bread|croissant|pastr|dessert|chocolate bars|biscuits|cakes|cereal|spreads|snacks/i.test(category + ' ' + title)) return false;
    if (!/(?:^|>)\s*cocoa\s*(?:>|$)|baking aids & cocoa|baking ingredients/i.test(category)) return false;
  }
  if (asked('dark') && asked('chocolate') && /biscuits|cookies|cakes|cereal|fruit & nuts/i.test(category)) return false;
  if (asked('dark') && asked('chocolate') && /biscuit|digestive|cookie|cake|rice cake|wafer|nut bar/i.test(title)) return false;
  if (asked('honey') && !asked('roast')) {
    if (!/honey|jam|preserve|spread/i.test(category) || /whisky|whiskey|gin|rum|bourbon|wine|cider|beer/i.test(title)) return false;
  }
  if (asked('oil')) {
    if (!/oil & vinegar|olive oil|cooking oil|food cupboard.*condiment/i.test(category)) return false;
    if (/spray|dressing|infused|spread|alternative|tuna|anchov|mackerel|crouton|sardine/i.test(title + ' ' + category)) return false;
    if (asked('olive') && /blend|with olive|pomace/i.test(title)) return false;
  }
  if (asked('walnut')) {
    for (const word of ['cashew', 'almond', 'peanut', 'hazelnut', 'pistachio', 'pecan', 'mixed']) if (name.has(word) && !asked(word)) return false;
  }
  if (asked('stock') && !/pot|cube|powder|concentrat/i.test(query) && /stock pots?|cubes?|powder|concentrat/i.test(title)) return false;
  if (asked('light') && (asked('sauce') || asked('dressing')) && !name.has('light')) return false;
  if (['sauce', 'dressing', 'seasoning', 'paste'].some(asked) && !preparedWords.every(word => name.has(word))) return false;
  if (asked('whey') && asked('protein') && !asked('clear')) {
    if (name.has('clear')) return false;
    if (!['vanilla', 'plain', 'unflavoured', 'unflavored'].some(asked) && /strawberry|raspberry|banoffee|cookie|chocolate|coconut/i.test(title)) return false;
  }
  if (asked('butter') && !['peanut', 'almond', 'cashew', 'coconut', 'cocoa'].some(asked)) {
    if (!/butter|spreads/i.test(category) || /bean|peanut|almond|cashew|garlic|herb|sauce|biscuit|chocolate|cake/i.test(title)) return false;
    if (unrequested(PLANT_DAIRY_WORDS) || /dairy free|vegan|alternative/i.test(category)) return false;
    if (/alternative|margarine/i.test(title) && !asked('alternative')) return false;
  }
  if (asked('sugar')) {
    if (!/sugar|sweetener|home baking/i.test(category) || /no added|free|reduced|syrup|biscuit|bar|cereal|cake/i.test(title)) return false;
  }
  if (asked('salt') && !asked('sauce')) {
    if (!/salt|pepper|spice|seasoning/i.test(category) || /crisp|snack|nut|sauce|stock|chocolate|biscuit/i.test(title)) return false;
  }
  if (asked('flour') && !asked('tortilla')) {
    if (!/flour|home baking|cooking ingredient/i.test(category) || /bread|wrap|tortilla|cake|biscuit/i.test(title)) return false;
  }
  if (asked('oat') && !['biscuit', 'milk', 'drink', 'bar'].some(asked)) {
    if (!/porridge|oats|cereal/i.test(category) || /biscuit|bar|muesli|granola|flapjack|yoghurt|overnight/i.test(title)) return false;
  }
  if (asked('egg')) {
    if (!/eggs?|egg whites?/i.test(category) || /custard|tart|scotch|salad|sandwich|fried|omelette|mayonnaise|cake|biscuit/i.test(title)) return false;
    if (/party food|pork pies|scotch eggs|tapas|prepared/i.test(category)) return false;
  }
  if (asked('peanut') && asked('butter')) {
    if (!/peanut butter|nut butter|jams?|spreads/i.test(category) || /chocolate|snicker|wafer|biscuit|cookie|cake|bar/i.test(title)) return false;
  }
  if (asked('ham')) {
    if (!/cooked meat|continental meat|charcuterie|hams?\b/i.test(category) || /soup|sandwich|pie|pizza|salad|sauce|pasta/i.test(title)) return false;
    if (fullWords.has('lean') && /continental meat|charcuterie/i.test(category)) return false;
    if (/snack/i.test(title)) return false;
  }
  return true;
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
  const queryTokens = preparedQuery || ingredientWords(query);
  const nameTokens = productTokens(product?.name);
  if (!queryTokens.length || !nameTokens.length) return 0;
  if (!ingredientCompatible(query, product, queryTokens)) return 0;

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
    if (/fresh milk/i.test(categoryText)) score += 3;
    if (name.has('semi') && name.has('skimmed')) score += 2;
  }
  if (queryTokens.includes('yoghurt') || queryTokens.includes('skyr')) {
    if (name.has('plain')) score += 4;
    if (/natural|greek|skyr|high in protein/i.test(categoryText)) score += 2;
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
  const explicit = clean(product?.packUnit, 30).toLowerCase().replace(/^(?:pk|packs?)$/, 'pieces');
  const sizeText = clean(product?.packSize, 50).toLowerCase();
  let quantity = Number(product?.packQuantity);
  let unit = explicit;
  if (!(quantity > 0) || !Number.isFinite(quantity) || !unit) {
    const multiple = sizeText.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
    const match = sizeText.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pieces?|pcs|each|ea|pk|packs?)\b/i);
    if (multiple) {
      quantity = Number(multiple[1]) * Number(multiple[2]);
      unit = multiple[3].toLowerCase();
    } else if (match) {
      quantity = Number(match[1]);
      unit = match[2].toLowerCase().replace(/^(?:pk|packs?)$/, 'pieces');
    } else if (/^(?:each|ea|1\s*ea)$/.test(sizeText)) {
      quantity = 1;
      unit = 'each';
    } else if (/^(?:large|medium|small)$/.test(sizeText) && /fresh.*(?:fruit|vegetable|salad)|vegetables & flowers/i.test(product?.category || '')) {
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

// Recipe quantities and retailer packs are often different units. These are
// explicitly labelled cooking assumptions; they do not change the saved ASDA pack.
const PRODUCE_ITEM_GRAMS = { cucumber: 300, banana: 120, apple: 180, pear: 170, lemon: 60, lime: 45, onion: 150, avocado: 150, orange: 150, mandarin: 80, carrot: 80, potato: 175, kiwi: 75, garlic: 50, lettuce: 250, melon: 700 };
const SPICE_GRAMS_PER_TSP = { cinnamon: 2.6, paprika: 2.3, cumin: 2.1, chilli: 1.8, curry: 2, herb: 1, dill: 1, seasoning: 2.5, cocoa: 2.5 };

function purchasePackMeta(product, wantedDimension) {
  let meta = packUnitMeta(product);
  if (!meta) return null;
  const words = new Set(productTokens(product?.name));
  const category = [product?.category, ...(product?.categoryPath || [])].filter(Boolean).join(' ');
  const title = String(product?.name || '');
  // Tin net weight includes water/brine that is not eaten. ASDA's displayed
  // per-kg price for these drained foods uses the edible weight. Infer it only
  // for those families, with a consistent near-whole-gram result; leave tomato
  // sauces, baked beans, frozen vegetables and other full-content packs alone.
  const drainedFood = /tinned|canned/i.test(category) &&
    ((words.has('tuna') && /brine|spring water|in water|sunflower oil|olive oil/i.test(title)) || words.has('sweetcorn') ||
      ((words.has('bean') || words.has('chickpea') || words.has('lentil')) && !/baked|sauce|salad|soup/i.test(title)));
  const unitPrice = Number(product.pricePerUnit), unitLabel = String(product.pricePerUnitLabel || '');
  const inferredDrained = /\/\s*(?:kg|kilogram)\b/i.test(unitLabel) && unitPrice > 0 ? Number(product.price) * 1000 / unitPrice : 0;
  if (meta.dimension === 'mass' && drainedFood && inferredDrained > meta.capacity * .25 && inferredDrained < meta.capacity * .98 && Math.abs(inferredDrained - Math.round(inferredDrained)) < .02) {
    const grams = Math.round(inferredDrained);
    meta = { ...meta, capacity: grams, estimatedQuantity: true, quantityBasis: `Using ${grams} g drained edible contents inferred from ASDA's per-kg unit price; the ${product.packSize} label includes liquid.` };
  }
  if (meta.dimension === wantedDimension) return meta;
  const declaredAmount = title.match(/\b(\d+(?:\.\d+)?)\s*(ml|kg|g|litres?|liters?|l)\b/i);
  if (declaredAmount && meta.dimension !== wantedDimension) {
    const declaredMeta = packUnitMeta({ packQuantity: Number(declaredAmount[1]), packUnit: declaredAmount[2] });
    if (declaredMeta?.dimension === wantedDimension) return { ...declaredMeta, estimatedQuantity: true, quantityBasis: `Using ${declaredAmount[1]} ${declaredAmount[2]} stated in the product name; the catalogue pack label uses ${product.packSize}.` };
  }
  const estimated = (capacity, note) => ({ ...meta, dimension: wantedDimension, capacity, estimatedQuantity: true, quantityBasis: note });
  const declaredCount = title.match(/\b(\d+)\s+(?:(?:\w+[ -]){0,5})(?:wraps?|pittas?|sausages?|bagels?|slices?|eggs?)\b/i);
  if (wantedDimension === 'count' && declaredCount && meta.dimension === 'mass') {
    return { ...meta, dimension: 'count', capacity: Number(declaredCount[1]), quantityBasis: `${declaredCount[1]} items declared in the product name.` };
  }
  if (/fresh (?:fruit|salad|vegetable)|vegetables & flowers/i.test(category)) {
    const ingredient = Object.keys(PRODUCE_ITEM_GRAMS).find(word => words.has(word));
    if (ingredient) {
      const grams = PRODUCE_ITEM_GRAMS[ingredient];
      if (wantedDimension === 'mass' && meta.dimension === 'count') return estimated(meta.capacity * grams, `${ingredient[0].toUpperCase() + ingredient.slice(1)} sold by each: estimated ${grams} g per item; actual weight varies.`);
      if (wantedDimension === 'count' && meta.dimension === 'mass') return estimated(meta.capacity / grams, `${ingredient[0].toUpperCase() + ingredient.slice(1)}: estimated ${grams} g per item; actual weight varies.`);
    }
  }
  const oil = words.has('oil') && /oil|food cupboard/i.test(category);
  const honey = words.has('honey') && /honey|preserve|spread/i.test(category);
  const dressing = /sauce|dressing|stock|milk|juice/i.test(title) && !/powder|cube|concentrat/i.test(title);
  const density = oil ? 0.92 : honey ? 1.42 : dressing ? 1 : null;
  if (density && wantedDimension === 'mass' && meta.dimension === 'volume') return estimated(meta.capacity * density, `Estimated density ${density} g/ml for ${oil ? 'cooking oil' : honey ? 'honey' : 'sauce or liquid'}; actual density varies.`);
  if (density && wantedDimension === 'volume' && meta.dimension === 'mass') return estimated(meta.capacity / density, `Estimated density ${density} g/ml for ${oil ? 'cooking oil' : honey ? 'honey' : 'sauce or liquid'}; actual density varies.`);
  if (wantedDimension === 'slice' && meta.dimension === 'mass' && words.has('bread')) return estimated(meta.capacity / 36, 'Bread slices estimated at 36 g each; slice weights vary by loaf.');
  if (['tsp', 'tbsp'].includes(wantedDimension)) {
    const ml = wantedDimension === 'tbsp' ? 15 : 5;
    if (meta.dimension === 'volume') return estimated(meta.capacity / ml, `Recipe ${wantedDimension} estimated as ${ml} ml.`);
    if (meta.dimension === 'mass') {
      const spice = Object.keys(SPICE_GRAMS_PER_TSP).find(word => words.has(word));
      const grams = spice ? SPICE_GRAMS_PER_TSP[spice] * (wantedDimension === 'tbsp' ? 3 : 1) : density ? density * ml : null;
      if (grams) return estimated(meta.capacity / grams, `Recipe ${wantedDimension} estimated as ${Number(grams.toFixed(2))} g for this ingredient; spoon weights vary.`);
    }
  }
  if (wantedDimension === 'portion' && meta.dimension === 'mass') {
    if (words.has('sweetener') && words.has('tablet')) {
      const tablets = title.match(/\b(\d+)\s+(?:[a-z-]+\s+){0,5}(?:sweeteners?\s+)?tablets?\b/i);
      if (tablets) return estimated(Number(tablets[1]), 'Recipe portion estimated as one sweetener tablet; adjust for the desired sweetness.');
    }
    const grams = words.has('seasoning') || (words.has('curry') && words.has('powder')) ? 5 : words.has('sweetener') ? 1 : null;
    if (grams) return estimated(meta.capacity / grams, `Recipe portion estimated as ${grams} g for ${words.has('sweetener') ? 'sweetener' : 'seasoning'}; adjust recipe quantities if needed.`);
  }
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
  const queryTokens = ingredientWords(query);
  const rows = (Array.isArray(products) ? products : [])
    .map(product => ({ product, score: scoreProduct(query, product, dimension, queryTokens), nameTokens: productTokens(product?.name) }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || String(a.product.url || '').localeCompare(String(b.product.url || '')));
  const strict = rows.filter(row => queryTokens.every(token => row.nameTokens.includes(token)));
  const ranked = strict.length ? strict : rows;
  if (!ranked.length) return [];
  const floor = ranked[0].score - 5;
  return (strict.length ? ranked : ranked.filter(row => row.score >= floor)).slice(0, limit === Infinity ? ranked.length : Math.max(1, Math.min(Number(limit) || 36, 60)));
}

function indexedProducts(index, query, strict = false) {
  const words = ingredientWords(query);
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
  const cacheKey = JSON.stringify([productTokens(query), canonicalDimension(dimension)]);
  if (index.candidateCache.has(cacheKey)) return index.candidateCache.get(cacheKey);
  // The scorer requires a name-token hit. Full-name matches have priority, so only
  // score their intersection; use the union when no suitable strict match exists.
  let ranked = rankCatalogCandidates(query, indexedProducts(index, query, true), dimension, Infinity);
  if (!ranked.length) ranked = rankCatalogCandidates(query, indexedProducts(index, query), dimension, Infinity);
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
    const meta = purchasePackMeta(product, wantedDimension);
    const price = Number(product.price);
    if (!meta || !Number.isFinite(meta.capacity) || meta.capacity <= 0 || meta.dimension !== wantedDimension || !Number.isFinite(price) || Math.round(price * 100) < 1 || product.available === false || /out[ _-]*of[ _-]*stock|sold[ _-]*out|unavailable|discontinued|not[ _-]*available/i.test(String(product.availability || ''))) return null;
    return { product, score: Number(candidate.score) || 0, meta, priceCents: Math.round(price * 100) };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.priceCents - b.priceCents);
  if (!offers.length) return null;

  // UK pint packs and kitchen conversions have fractional capacities. Optimise
  // these by integer pence instead of rounding an almost-full pint up to two packs.
  if (!Number.isInteger(requested) || offers.some(offer => !Number.isInteger(offer.meta.capacity))) {
    return fractionalPackPurchase(offers, requested);
  }

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

function fractionalPackPurchase(offers, requested) {
  const singles = offers.map((offer, index) => ({ offer, index, packs: Math.ceil((requested - 1e-8) / offer.meta.capacity) }))
    .map(row => ({ ...row, cents: row.packs * row.offer.priceCents, over: row.packs * row.offer.meta.capacity - requested }))
    .sort((a, b) => a.cents - b.cents || a.over - b.over || b.offer.score - a.offer.score);
  const costQuantum = offers.map(offer => offer.priceCents).reduce(greatestCommonDivisor);
  const upperBound = singles[0].cents / costQuantum;
  if (upperBound > 250000) {
    const counts = new Array(offers.length).fill(0);
    counts[singles[0].index] = singles[0].packs;
    return makePurchasePlan(counts, offers, requested);
  }
  const capacities = new Float64Array(upperBound + 1);
  capacities.fill(-Infinity);
  capacities[0] = 0;
  const previousOffer = new Int16Array(upperBound + 1);
  previousOffer.fill(-1);
  for (let cost = 1; cost <= upperBound; cost++) {
    for (let index = 0; index < offers.length; index++) {
      const earlier = cost - offers[index].priceCents / costQuantum;
      if (earlier < 0 || !Number.isFinite(capacities[earlier])) continue;
      const capacity = capacities[earlier] + offers[index].meta.capacity;
      if (capacity > capacities[cost]) {
        capacities[cost] = capacity;
        previousOffer[cost] = index;
      }
    }
    if (capacities[cost] + 1e-8 < requested) continue;
    const counts = new Array(offers.length).fill(0);
    for (let cursor = cost; cursor > 0;) {
      const index = previousOffer[cursor];
      if (index < 0) return null;
      counts[index]++;
      cursor -= offers[index].priceCents / costQuantum;
    }
    return makePurchasePlan(counts, offers, requested);
  }
  return null;
}

function makePurchasePlan(counts, offers, requested) {
  const products = offers.flatMap((offer, index) => {
    const packs = counts[index];
    if (!packs) return [];
    return [{
      ...productSummary(offer.product, offer.score),
      packs,
      estimatedQuantity: !!offer.meta.estimatedQuantity,
      quantityBasis: offer.meta.quantityBasis || null,
      totalQuantity: Number((packs * offer.meta.capacity).toFixed(6)),
      costGBP: Number((packs * offer.priceCents / 100).toFixed(2)),
    }];
  });
  if (!products.length) return null;
  const totalQuantity = Number(products.reduce((sum, row) => sum + row.totalQuantity, 0).toFixed(6));
  const totalCostGBP = Number(products.reduce((sum, row) => sum + row.costGBP, 0).toFixed(2));
  if (!Number.isFinite(totalQuantity) || !Number.isFinite(totalCostGBP) || totalQuantity + 1e-6 < requested) return null;
  return { requestedQuantity: requested, totalQuantity, leftoverQuantity: Number(Math.max(0, totalQuantity - requested).toFixed(6)), totalCostGBP, estimatedQuantity: products.some(product => product.estimatedQuantity), estimateNotes: [...new Set(products.filter(product => product.estimatedQuantity).map(product => product.quantityBasis))], products };
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
      const relevant = candidates;
      const quantity = Number(item?.quantity);
      const queryTokens = ingredientWords(query);
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

// Reuse the same safety filters and quantity assumptions when evaluating many
// meal plans. The worker builds compact price tables without reloading products.
export async function catalogPurchaseOffers(items, { signal } = {}) {
  const index = await getIndex('Asda');
  if (index.snapshotStatus !== 'complete') throw new Error('A complete ASDA catalogue is required to calculate a meal budget.');
  const rows = [];
  for (const item of items) {
    signal?.throwIfAborted();
    const query = clean(item.name, 120), dimension = canonicalDimension(item.dimension);
    const candidates = indexedCandidates(index, query, dimension), best = candidates[0];
    const high = best && best.score >= 9 && ingredientWords(query).every(token => productTokens(best.product.name).includes(token));
    const offers = high ? candidates.map(candidate => {
      const meta = purchasePackMeta(candidate.product, dimension), cents = Math.round(Number(candidate.product.price) * 100);
      return meta && meta.capacity > 0 && Number.isFinite(cents) && cents >= 1 ? { capacity: meta.capacity, cents } : null;
    }).filter(Boolean) : [];
    rows.push({ ...item, offers, candidates: high ? candidates : [], confidence: high ? 'high' : candidates.length ? 'review' : 'none' });
    await yieldToServer();
  }
  return { rows, indexSize: index.urls.length, refreshedAt: new Date(index.createdAt).toISOString() };
}

export async function searchCatalog(storeName, query, limit = 8, dimension = '') {
  const index = await getIndex(storeName);
  const q = clean(query, 120);
  const maxRows = Math.max(1, Math.min(Number(limit) || 8, 12));
  const queryTokens = ingredientWords(q);
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
