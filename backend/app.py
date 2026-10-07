import os, re, json, time, logging, gzip
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

ASDA = "https://www.asda.com"
OUT = os.environ.get("PRODUCT_OUT", "../data/products.json")
HEADERS = {
    "User-Agent": os.environ.get(
        "ASDA_USER_AGENT",
        "Mozilla/5.0 (compatible; MealPlannerCatalogue/3.0; +https://github.com/)"
    ),
    "Accept-Language": "en-GB,en;q=0.9",
}
TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "30"))
WORKERS = int(os.environ.get("CATALOGUE_WORKERS", "8"))

# ASDA's robots.txt officially publishes this sitemap index.
SITEMAP_INDEX = f"{ASDA}/sitemap-index.xml"
START = [
    f"{ASDA}/groceries",
    f"{ASDA}/groceries/fresh-fruit-vegetables-flowers",
    f"{ASDA}/groceries/meat-poultry-fish",
    f"{ASDA}/groceries/bakery",
    f"{ASDA}/groceries/chilled-food",
    f"{ASDA}/groceries/frozen-food",
    f"{ASDA}/groceries/food-cupboard",
    f"{ASDA}/groceries/sweets-treats-snacks",
    f"{ASDA}/groceries/dietary-lifestyle",
    f"{ASDA}/groceries/drinks",
    f"{ASDA}/groceries/beer-wine-spirits",
    f"{ASDA}/groceries/toiletries-beauty",
    f"{ASDA}/groceries/laundry-household",
    f"{ASDA}/groceries/baby-toddler-kids",
    f"{ASDA}/groceries/pet-food-accessories",
    f"{ASDA}/groceries/health-wellness",
    f"{ASDA}/groceries/home-entertainment",
    f"{ASDA}/groceries/world-food",
]

session = requests.Session()
session.headers.update(HEADERS)


def get(url):
    r = session.get(url, timeout=TIMEOUT)
    r.raise_for_status()
    return r.content


def xml_locs(content):
    if content[:2] == b"\x1f\x8b":
        content = gzip.decompress(content)
    # Sitemap XML is simple enough to parse with ElementTree, while stripping namespaces.
    import xml.etree.ElementTree as ET
    root = ET.fromstring(content)
    out = []
    for el in root.iter():
        if el.tag.rsplit('}', 1)[-1] == 'loc' and el.text:
            out.append(el.text.strip())
    return out


def discover_product_urls():
    """Use ASDA's official sitemap index first; fall back to category crawling if unavailable."""
    sitemaps = []
    try:
        sitemaps = xml_locs(get(SITEMAP_INDEX))
        logging.info("Sitemap index returned %d sitemap URLs", len(sitemaps))
    except Exception as e:
        logging.warning("Could not read sitemap index: %s", e)

    product_urls = set()
    visited_sitemaps = set()
    queue = list(sitemaps)

    # Some sitemap indexes contain nested sitemap indexes.
    while queue:
        sm = queue.pop(0)
        if sm in visited_sitemaps:
            continue
        visited_sitemaps.add(sm)
        try:
            locs = xml_locs(get(sm))
        except Exception as e:
            logging.warning("Skipping sitemap %s: %s", sm, e)
            continue
        for loc in locs:
            path = urlparse(loc).path.lower()
            if path.endswith('.xml') or path.endswith('.xml.gz'):
                if loc not in visited_sitemaps:
                    queue.append(loc)
            elif '/groceries/product/' in path:
                product_urls.add(loc.split('#')[0])

    if product_urls:
        logging.info("Discovered %d grocery product URLs from sitemap(s)", len(product_urls))
        return sorted(product_urls)

    # Fallback for future ASDA sitemap changes: breadth-first category crawl.
    logging.warning("No product URLs found in sitemaps; falling back to category crawl")
    return sorted(category_crawl())


def category_crawl(limit=None):
    queue = list(START)
    seen = set()
    products = set()
    max_pages = int(limit or os.environ.get("CATEGORY_PAGE_LIMIT", "10000"))
    while queue and len(seen) < max_pages:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        try:
            html = get(url).decode('utf-8', errors='ignore')
        except Exception as e:
            logging.warning("Category fetch failed %s: %s", url, e)
            continue
        soup = BeautifulSoup(html, 'html.parser')
        for a in soup.find_all('a', href=True):
            u = urljoin(ASDA, a['href']).split('#')[0]
            if not u.startswith(ASDA + '/groceries/'):
                continue
            if '/groceries/product/' in u:
                products.add(u)
            elif u not in seen:
                queue.append(u)
    logging.info("Fallback category crawl discovered %d product URLs", len(products))
    return products


def walk_jsonld(value):
    if isinstance(value, dict):
        yield value
        for v in value.values():
            yield from walk_jsonld(v)
    elif isinstance(value, list):
        for v in value:
            yield from walk_jsonld(v)


def first_number(s):
    if s is None:
        return None
    m = re.search(r"\d+(?:[.,]\d+)?", str(s))
    return float(m.group(0).replace(',', '.')) if m else None


def parse_quantity(value):
    if value is None:
        return None, None
    s = str(value).strip().lower().replace(',', '')
    # Common ASDA formats: 500g, 2kg, 1 litre, 6 pieces, 24x25g.
    m = re.search(r"(\d+(?:\.\d+)?)\s*(kg|g|l|litres?|ml|cl)\b", s)
    if m:
        q = float(m.group(1)); u = m.group(2)
        if u == 'kg': return q * 1000, 'g'
        if u in ('l', 'litre', 'litres'): return q * 1000, 'ml'
        if u == 'cl': return q * 10, 'ml'
        return q, u
    m = re.search(r"(\d+)\s*(?:pieces?|pack|pk|count|ct)\b", s)
    if m:
        return float(m.group(1)), 'piece'
    return None, None


def extract_nutrition(obj):
    n = obj.get('nutrition') if isinstance(obj, dict) else None
    if not isinstance(n, dict):
        return None
    out = {}
    aliases = {
        'calories': ('calories', 'energy'),
        'protein': ('proteinContent', 'protein'),
        'fat': ('fatContent', 'fat'),
        'carbohydrate': ('carbohydrateContent', 'carbohydrate'),
        'saturatedFat': ('saturatedFatContent', 'saturatedFat'),
        'sugar': ('sugarContent', 'sugars'),
        'fiber': ('fiberContent', 'fibre'),
        'sodium': ('sodiumContent', 'sodium'),
    }
    for key, names in aliases.items():
        for name in names:
            if n.get(name) is not None:
                out[key] = n[name]
                break
    return out or None


def parse_product(url, content):
    html = content.decode('utf-8', errors='ignore') if isinstance(content, bytes) else content
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.find('h1')
    name = title.get_text(' ', strip=True) if title else ''
    if not name:
        return None

    objects = []
    for node in soup.select('script[type="application/ld+json"]'):
        raw = node.string or node.get_text()
        try:
            objects.extend(list(walk_jsonld(json.loads(raw))))
        except Exception:
            pass

    product_obj = next((x for x in objects if isinstance(x, dict) and (x.get('@type') == 'Product' or 'offers' in x)), {})
    offers = product_obj.get('offers') if isinstance(product_obj, dict) else None
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    if not isinstance(offers, dict):
        offers = {}

    price = None
    for key in ('price', 'lowPrice'):
        try:
            if offers.get(key) is not None:
                price = float(str(offers[key]).replace(',', ''))
                break
        except Exception:
            pass
    if price is None:
        m = re.search(r"actual price\s*£\s*([0-9]+(?:\.[0-9]{1,2})?)", soup.get_text(' ', strip=True), re.I)
        if m: price = float(m.group(1))
    if price is None:
        m = re.search(r"£\s*([0-9]+(?:\.[0-9]{1,2})?)", soup.get_text(' ', strip=True))
        if m: price = float(m.group(1))

    text = soup.get_text(' ', strip=True)
    pack = ''
    if isinstance(product_obj, dict):
        for key in ('weight', 'size'):
            if product_obj.get(key):
                pack = str(product_obj[key]); break
    if not pack:
        m = re.search(r"(?:Net Content\s*)?(\d+(?:\.\d+)?\s*(?:kg|g|l|litres?|ml|cl))\b", text, re.I)
        if m: pack = m.group(1)
    if not pack:
        # Keep piece/count products instead of silently dropping them.
        m = re.search(r"(\d+(?:x\d+)?\s*(?:pieces?|pack|pk|count|ct))\b", text, re.I)
        if m: pack = m.group(1)

    q, unit = parse_quantity(pack)
    brand = product_obj.get('brand') if isinstance(product_obj, dict) else None
    if isinstance(brand, dict): brand = brand.get('name')
    image = product_obj.get('image') if isinstance(product_obj, dict) else None
    if isinstance(image, list): image = image[0] if image else None
    nutrition = extract_nutrition(product_obj)
    category = urlparse(url).path.split('/product/')[-1].split('/')[0]
    product_id = re.search(r'/([0-9]{5,})/?$', urlparse(url).path)
    sku = product_id.group(1) if product_id else (product_obj.get('sku') if isinstance(product_obj, dict) else None)

    return {
        'id': f"asda-{sku or abs(hash(url))}",
        'ingredient': name.lower(),
        'name': name,
        'brand': brand,
        'packSize': pack or None,
        'packQuantity': q,
        'packUnit': unit,
        'price': price,
        'pricePerBaseUnit': round(price / q, 6) if price is not None and q else None,
        'url': url,
        'image': image,
        'category': category,
        'sku': sku,
        'nutrition': nutrition,
        'retailer': 'ASDA',
        'checked': time.strftime('%Y-%m-%d'),
        'source': 'asda_official_sitemap_product_page',
    }


def fetch_product(url):
    try:
        return parse_product(url, get(url))
    except Exception as e:
        logging.warning('Product fetch failed %s: %s', url, e)
        return None


def crawl():
    urls = discover_product_urls()
    max_products = int(os.environ.get('MAX_PRODUCTS', '0'))
    if max_products > 0:
        urls = urls[:max_products]
    logging.info('Fetching %d ASDA product pages with %d workers', len(urls), WORKERS)

    products = []
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futures = {ex.submit(fetch_product, u): u for u in urls}
        for i, future in enumerate(as_completed(futures), 1):
            p = future.result()
            if p:
                products.append(p)
            if i % 250 == 0:
                logging.info('Processed %d/%d product pages; parsed %d', i, len(urls), len(products))

    # Dedupe by canonical URL/SKU and retain the richest record.
    dedup = {}
    for p in products:
        key = p.get('sku') or p['url'].rstrip('/').lower()
        old = dedup.get(key)
        if not old or sum(v is not None for v in p.values()) > sum(v is not None for v in old.values()):
            dedup[key] = p
    products = sorted(dedup.values(), key=lambda x: x['name'].lower())

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    meta = {
        'checked': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'discovered_urls': len(urls),
        'products_saved': len(products),
        'source': 'ASDA official sitemap + official product pages',
    }
    meta_path = os.path.join(os.path.dirname(OUT), 'catalogue-meta.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)
    logging.info('Saved %d products', len(products))
    return products


@app.get('/health')
def health():
    return jsonify({'ok': True, 'service': 'meal-planner-asda-catalogue', 'source': SITEMAP_INDEX})


@app.post('/refresh')
def refresh():
    data = crawl()
    return jsonify({'ok': True, 'products': len(data), 'checked': time.strftime('%Y-%m-%d')})


@app.get('/products')
def products():
    try:
        with open(OUT, encoding='utf-8') as f:
            return jsonify(json.load(f))
    except Exception:
        return jsonify([])


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '10000')))
