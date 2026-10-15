"""Complete, read-only traversal of Lidl GB's published Food & Drink menu.

Use the actual sidebar URLs and descendant category links. Fetch every declared
product batch; offset pages contain placeholders for earlier batches, so never
count those as products. Product pages are still validated by the publisher.
"""
from __future__ import annotations
import hashlib
import html
import json
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, parse_qs

ORIGIN = 'https://www.lidl.co.uk'
MENU_ROOT = ORIGIN + '/c/food-drink/s10068374'
CATEGORY = re.compile(r'^/(?:h/[^/?#]+/h\d+|c/[^/?#]+/s\d+)$')
PRODUCT = re.compile(r'^https://www\.lidl\.co\.uk/p/[^/?#]+/p(\d+)$')
MAX_CATEGORIES, MAX_PRODUCTS = 400, 20_000

class CategoryError(RuntimeError):
    pass


def category_url(value):
    url = urlsplit(urljoin(ORIGIN, value))
    if url.scheme != 'https' or url.netloc != 'www.lidl.co.uk' or url.query or url.fragment or not CATEGORY.fullmatch(url.path):
        raise CategoryError('Invalid official Lidl category URL.')
    return ORIGIN + url.path


class MenuParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lists, self.stack, self.anchor = [], [], None
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'ol':
            rows = [] if 'n-header__main-navigation--sub' in attrs.get('class', '').split() else None
            self.stack.append(rows)
            if rows is not None: self.lists.append(rows)
        if tag == 'a' and self.stack and self.stack[-1] is not None:
            self.anchor = [attrs.get('href', ''), []]
    def handle_data(self, value):
        if self.anchor is not None: self.anchor[1].append(value)
    def handle_endtag(self, tag):
        if tag == 'a' and self.anchor is not None:
            if self.stack and self.stack[-1] is not None:
                self.stack[-1].append({'url': self.anchor[0], 'name': ' '.join(''.join(self.anchor[1]).split())})
            self.anchor = None
        if tag == 'ol' and self.stack: self.stack.pop()


def parse_menu(source):
    parser = MenuParser(); parser.feed(source)
    groups = [rows for rows in parser.lists if rows and urljoin(ORIGIN, rows[0]['url']) == MENU_ROOT]
    if len(groups) != 1 or not 2 <= len(groups[0]) <= 60:
        raise CategoryError('Missing or ambiguous Lidl Food & Drink sidebar.')
    result = []
    for row in groups[0][1:]:
        url = category_url(row['url'])
        if not row['name'] or any(item['url'] == url for item in result):
            raise CategoryError('Invalid or duplicate Lidl menu category.')
        result.append({'url': url, 'name': row['name'], 'parent': MENU_ROOT})
    return result


def iso(value):
    if value is None: return None
    if not isinstance(value, (int, float)) or isinstance(value, bool): raise CategoryError('Invalid Lidl category offer timestamp.')
    try: return datetime.fromtimestamp(value, timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    except (OverflowError, ValueError) as exc: raise CategoryError('Invalid Lidl category offer date.') from exc


def card_product(row, source_url):
    from lidl_catalogue import text, positive, regular_price, pack, restricted_region
    code = row.get('code'); box = row.get('gridBox'); data = box.get('gridBoxData') if isinstance(box, dict) else None
    if not isinstance(code, str) or not re.fullmatch(r'\d+', code) or not isinstance(data, dict) or box.get('country') != 'GB' or data.get('erpNumber') != code:
        raise CategoryError('Missing or mismatched Lidl category product identity.')
    url = urljoin(ORIGIN, data.get('canonicalPath', '')); match = PRODUCT.fullmatch(url)
    if not match or match[1] != code or urljoin(ORIGIN, data.get('canonicalUrl', '')) != url:
        raise CategoryError('Invalid Lidl category product link.')
    name = text(data.get('fullTitle'))
    if not name: raise CategoryError('Lidl category product name is missing.')
    info = data.get('price') or {}; facts = data.get('keyfacts') or {}
    public = positive(info.get('price')) if info.get('currencyCode') == 'GBP' else None
    # A "from" figure or different-price variant cannot price a fixed pack.
    ambiguous = info.get('variantsHaveDifferentPrices') is True or (info.get('discount') or {}).get('showFrom') is True
    regular, label = regular_price(data)
    if public is None and not ambiguous: public = regular
    if ambiguous: public = None
    member = []
    for offer in data.get('lidlPlus') or []:
        price = offer.get('price') or {}
        value = positive(price.get('price'))
        if value is not None and price.get('currencyCode', info.get('currencyCode')) == 'GBP':
            member.append({'priceGBP': value, 'label': text(offer.get('lidlPlusText')) or 'With Lidl Plus', 'regularPriceLabel': text((price.get('packaging') or {}).get('text')) or None})
    pack_size = text(facts.get('supplementalDescription') or (info.get('packaging') or {}).get('text')) or None
    quantity, unit = pack(pack_size)
    start, end = iso(data.get('storeStartDate')), iso(data.get('storeEndDate'))
    return {'id': code, 'url': url, 'name': name, 'publicPriceGBP': public, 'regularPriceGBP': regular, 'regularPriceLabel': label,
        'memberOffers': member, 'packSize': pack_size, 'packQuantity': quantity, 'packUnit': unit,
        'validFrom': start, 'validThrough': end, 'regionRestricted': restricted_region(data, facts),
        'sourceUrl': source_url, 'priceAmbiguous': ambiguous}


def parse_category(url, source, offset=0, expected=None, expected_size=None):
    from lidl_catalogue import decode_nuxt
    url = category_url(url)
    match = re.search(r'<script\b[^>]*id=["\']__NUXT_DATA__["\'][^>]*>(.*?)</script>', source, re.S | re.I)
    if not match: raise CategoryError('Lidl category page has no public product table.')
    try: data = decode_nuxt(json.loads(match[1])); pinia = data['pinia']
    except (ValueError, KeyError, TypeError) as exc: raise CategoryError('Invalid Lidl category page data.') from exc
    if pinia.get('useLocaleStore', {}).get('locale') != 'en_GB': raise CategoryError('Lidl category page is not GB English.')
    product_store = pinia.get('useProductStore', {}); total = product_store.get('numFound')
    size = pinia.get('useStorefrontConfigurationStore', {}).get('config', {}).get('fetchSize')
    valid_integer = lambda value: isinstance(value, int) and not isinstance(value, bool)
    if not valid_integer(total) or not 0 <= total <= MAX_PRODUCTS or not valid_integer(size) or not 1 <= size <= 100:
        raise CategoryError('Invalid Lidl category count or page size.')
    if expected is not None and total != expected or expected_size is not None and size != expected_size:
        raise CategoryError('Lidl category count or page size changed during pagination.')
    route = pinia.get('useRouteStore', {}); query = route.get('routeQuery') or {}; globals_ = pinia.get('useGlobalStore') or {}
    if str(query.get('offset', '0')) != str(offset): raise CategoryError('Lidl category returned the wrong offset.')
    identity = url.rsplit('/', 1)[-1][1:]
    if url == MENU_ROOT:
        if globals_.get('wonCategory') != identity: raise CategoryError('Lidl root menu returned another product list.')
    elif route.get('routePath') != urlsplit(url).path or globals_.get('categoryId') != identity:
        raise CategoryError('Lidl category returned a different category identity.')
    batches = product_store.get('products'); batch = batches.get(str(offset // size), []) if isinstance(batches, dict) else None
    if not isinstance(batch, list) or len(batch) != min(size, max(0, total - offset)):
        raise CategoryError('Incomplete Lidl category product batch.')
    source_url = url + (f'?offset={offset}' if offset else '')
    products = [card_product(row, source_url) for row in batch]
    if len({p['id'] for p in products}) != len(products): raise CategoryError('Duplicate Lidl product identities in a category batch.')
    breadcrumb = globals_.get('breadcrumbPageId') or identity
    children = {}
    def visit(node):
        link = node.get('link') or {}; path = link.get('categoryPath'); page = link.get('pageId')
        if path and isinstance(page, str) and page.startswith(breadcrumb + '/'):
            child = category_url(path)
            children[child] = {'url': child, 'name': html.unescape(node.get('label') or ''), 'parent': url}
        for item in node.get('children') or []: visit(item)
    for facet in pinia.get('useFacetStore', {}).get('rawFacets', []):
        if facet.get('code') == 'category':
            for node in facet.get('values') or []: visit(node)
    return {'url': url, 'id': identity, 'total': total, 'pageSize': size, 'products': products, 'children': list(children.values())}


def discover_categories(get):
    """Return verified canonical product URLs plus a complete menu audit.

    No product is imported here and the response is not a local stock assertion.
    Recheck each category head after pagination; the publisher compares a second
    full traversal before replacing the healthy snapshot.
    """
    root_source = get(MENU_ROOT); menu = parse_menu(root_source)
    queue = [{'url': MENU_ROOT, 'name': 'Food & Drink offers', 'parent': None}, *menu]
    visited, categories, all_products, source_urls = set(), [], {}, set()
    def load_category(entry):
        url = entry['url']; source = root_source if url == MENU_ROOT else get(url)
        first = parse_category(url, source); products = list(first['products']); sources = [url]
        for offset in range(first['pageSize'], first['total'], first['pageSize']):
            source_url = url + f'?offset={offset}'; sources.append(source_url)
            page = parse_category(url, get(source_url), offset, first['total'], first['pageSize']); products.extend(page['products'])
        if len(products) != first['total'] or len({p['id'] for p in products}) != first['total']:
            raise CategoryError('Lidl category identities are duplicated or incomplete across pages.')
        again_source = get(url); again = parse_category(url, again_source, expected=first['total'], expected_size=first['pageSize'])
        if [p['id'] for p in again['products']] != [p['id'] for p in first['products']] or again['children'] != first['children']:
            raise CategoryError('Lidl category head changed during discovery.')
        if url == MENU_ROOT and parse_menu(again_source) != menu: raise CategoryError('Lidl sidebar changed during discovery.')
        return {**entry, 'id': first['id'], 'productsExpected': first['total'], 'productsChecked': len(products),
            'pages': len(sources), 'productIds': sorted(p['id'] for p in products), 'sourceUrls': sources}, products, first['children']
    while queue:
        batch = [row for row in queue if row['url'] not in visited]; queue = []
        for row in batch: visited.add(row['url'])
        if len(visited) > MAX_CATEGORIES: raise CategoryError('Lidl category graph exceeds the audit bound; no truncated publication.')
        with ThreadPoolExecutor(max_workers=4) as pool:
            for summary, products, children in pool.map(load_category, batch):
                categories.append(summary); source_urls.update(summary['sourceUrls']); queue.extend(children)
                for product in products:
                    previous = all_products.get(product['id'])
                    if previous and any(previous[key] != product[key] for key in ['url','publicPriceGBP','regularPriceGBP','memberOffers','packSize','validFrom','validThrough','regionRestricted']):
                        raise CategoryError('Lidl category pages disagree about a product or price.')
                    if previous: previous['categoryIds'].add(summary['id'])
                    else: all_products[product['id']] = {**product, 'categoryIds': {summary['id']}}
        # The same subcategory may appear through more than one parent branch.
        queue = list({row['url']: row for row in queue if row['url'] not in visited}.values())
    categories.sort(key=lambda row: row['url'])
    products = [{**row, 'categoryIds': sorted(row['categoryIds'])} for _, row in sorted(all_products.items())]
    identity = [{'url': row['url'], 'products': row['productIds']} for row in categories]
    metadata = {'menu_status': 'complete', 'menu_root': MENU_ROOT, 'menu_departments': menu, 'menu_categories': categories,
        'menu_categories_checked': len(categories), 'menu_pages_checked': len(source_urls), 'menu_products_identified': len(products),
        'menu_with_public_price': sum(row['publicPriceGBP'] is not None for row in products),
        'menu_with_member_price': sum(bool(row['memberOffers']) for row in products),
        'menu_source_urls': sorted(source_urls), 'menu_ids_sha256': hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest(),
        'menu_products': products}
    return {row['url'] for row in products}, metadata
