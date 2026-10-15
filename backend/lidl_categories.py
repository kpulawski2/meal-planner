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
from urllib.parse import urljoin, urlsplit, urlencode

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
        if not row['name'] or url == MENU_ROOT or any(item['url'] == url for item in result):
            raise CategoryError('Invalid or duplicate Lidl menu category.')
        result.append({'url': url, 'name': row['name'], 'parent': MENU_ROOT})
    return result


def iso(value):
    if value is None: return None
    if not isinstance(value, (int, float)) or isinstance(value, bool): raise CategoryError('Invalid Lidl category offer timestamp.')
    try: return datetime.fromtimestamp(value, timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    except (OverflowError, ValueError) as exc: raise CategoryError('Invalid Lidl category offer date.') from exc


def member_offers(data):
    from lidl_catalogue import text, positive
    result=[]; currency=(data.get('price') or {}).get('currencyCode')
    for offer in data.get('lidlPlus') or []:
        price=offer.get('price') or {}; value=positive(price.get('price'))
        if value is not None and not isinstance(price.get('price'),bool) and price.get('currencyCode',currency)=='GBP':
            result.append({'priceGBP':value,'label':text(offer.get('lidlPlusText')) or 'With Lidl Plus',
                'regularPriceLabel':text((price.get('packaging') or {}).get('text')) or None})
    return result


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
    public = positive(info.get('price')) if info.get('currencyCode') == 'GBP' and not isinstance(info.get('price'),bool) else None
    # A "from" figure or different-price variant cannot price a fixed pack.
    ambiguous = info.get('variantsHaveDifferentPrices') is True or (info.get('discount') or {}).get('showFrom') is True
    regular, label = regular_price(data)
    if public is None and not ambiguous: public = regular
    if ambiguous: public = None
    member = member_offers(data)
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
    if not isinstance(batch, list) or len(batch) > min(size, max(0, total - offset)):
        raise CategoryError(f'Incomplete Lidl category product batch: {url}, offset {offset}, size {size}, total {total}, batch sizes {[(k,len(v)) for k,v in (batches or {}).items()]}.')
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
    api = ORIGIN + '/q/api/category' + urlsplit(url).path + '?' + urlencode({'assortment':'GB','locale':'en_GB','version':'v2.0.0','sort':'relevancy','pageId':breadcrumb})
    if url == MENU_ROOT: api = ORIGIN + '/q/api/search?' + urlencode({'assortment':'GB','locale':'en_GB','version':'v2.0.0','category.id':'10068374','sort':'storeStartDate-desc'})
    return {'url': url, 'id': identity, 'total': total, 'pageSize': size, 'products': products, 'children': list(children.values()), 'apiUrl': api}


def api_batch(get, api, offset, total, size):
    url = api + '&' + urlencode({'fetchsize':size,'offset':offset})
    def read(source_url):
        try: data = json.loads(get(source_url))
        except ValueError as exc: raise CategoryError('Lidl menu load-more response is not JSON.') from exc
        if not isinstance(data, dict) or data.get('assortment')!='GB' or data.get('locale')!='en_GB' or data.get('numFound')!=total or data.get('offset')!=offset or data.get('fetchsize')!=size:
            raise CategoryError(f'Lidl menu load-more context or count differs: {source_url}.')
        if not isinstance(data.get('items'),list): raise CategoryError('Invalid Lidl menu load-more items.')
        return data
    data=read(url); items=data['items']; expected=min(size,total-offset)
    if len(items)>expected: raise CategoryError('Too many Lidl menu products in a batch.')
    products=[]; sources=[url]; unpublished=[]
    for item in items:
        box=item.get('gridbox') or {}
        products.append(card_product({'code':item.get('code'),'gridBox':{'country':box.get('country'),'gridBoxData':box.get('data')}},url))
    codes=[row['id'] for row in products]
    if len(set(codes))!=len(codes): raise CategoryError('Repeated Lidl menu load-more identities.')
    if len(items)<expected:
        identities_url=url+'&idsOnly=true'; identities=read(identities_url)['items']; sources.append(identities_url)
        all_codes=[item.get('code') for item in identities]
        if len(all_codes)!=expected or len(set(all_codes))!=expected or any(not isinstance(code,str) or not re.fullmatch(r'\d+',code) for code in all_codes) or not set(codes)<=set(all_codes):
            raise CategoryError('Incomplete or inconsistent Lidl category identity page.')
        missing=[code for code in all_codes if code not in codes]
        grid_url=ORIGIN+'/q/api/gridboxes/GB/en?'+urlencode({'ids':','.join(missing)})
        confirmations=[]
        for _ in range(2):
            grids=json.loads(get(grid_url));sources.append(grid_url)
            if not isinstance(grids,list) or len(grids)!=len(missing): raise CategoryError('Incomplete Lidl category identity confirmation.')
            recovered=[];removed=[]
            for code,box in zip(missing,grids):
                if box is None:removed.append(code)
                elif isinstance(box,dict):recovered.append(card_product({'code':code,'gridBox':{'country':box.get('country'),'gridBoxData':box.get('data')}},grid_url))
                else:raise CategoryError('Invalid Lidl category identity confirmation.')
            confirmations.append((recovered,removed))
        if confirmations[0]!=confirmations[1]: raise CategoryError('Lidl category publication changed during confirmation.')
        products.extend(confirmations[0][0]);unpublished=confirmations[0][1];codes=all_codes
    return products,codes,unpublished,sources


def discover_categories(get):
    """Return verified canonical product URLs plus a complete menu audit.

    No product is imported here and the response is not a local stock assertion.
    Recheck each category head after pagination; the publisher compares a second
    full traversal before replacing the healthy snapshot.
    """
    root_source = get(MENU_ROOT); menu = parse_menu(root_source)
    queue = [{'url': MENU_ROOT, 'name': 'Food & Drink offers', 'parent': None}, *menu]
    visited, categories, all_products, source_urls, all_ids, unpublished_ids = set(), [], {}, set(), set(), set()
    def load_category(entry):
        url = entry['url']; source = root_source if url == MENU_ROOT else get(url)
        first = parse_category(url, source); products = list(first['products']); sources = [url]; codes=[p['id'] for p in products]; unpublished=[]
        if len(products)!=min(first['pageSize'],first['total']):
            recovered, codes, unpublished, api_sources=api_batch(get,first['apiUrl'],0,first['total'],first['pageSize']);sources.extend(api_sources)
            if [p['id'] for p in recovered]!=[p['id'] for p in products]: raise CategoryError('Lidl HTML product batch differs from its publication confirmation.')
            products=recovered
        for offset in range(first['pageSize'], first['total'], first['pageSize']):
            rows,identities,removed,api_sources=api_batch(get,first['apiUrl'],offset,first['total'],first['pageSize'])
            products.extend(rows);codes.extend(identities);unpublished.extend(removed);sources.extend(api_sources)
        if len(codes) != first['total'] or len(set(codes)) != first['total'] or len(products)+len(unpublished)!=first['total']:
            raise CategoryError('Lidl category identities are duplicated or incomplete across pages.')
        again_source = get(url); again = parse_category(url, again_source, expected=first['total'], expected_size=first['pageSize'])
        if again['products'] != first['products'] or again['children'] != first['children']:
            raise CategoryError('Lidl category head changed during discovery.')
        if url == MENU_ROOT and parse_menu(again_source) != menu: raise CategoryError('Lidl sidebar changed during discovery.')
        return {**entry, 'id': first['id'], 'productsExpected': first['total'], 'productsChecked': len(codes),
            'pages': max(1,(first['total']+first['pageSize']-1)//first['pageSize']), 'productsPublished':len(products), 'unpublishedIds':sorted(unpublished), 'productIds': sorted(codes), 'sourceUrls': sources}, products, first['children']
    while queue:
        batch = [row for row in queue if row['url'] not in visited]; queue = []
        for row in batch: visited.add(row['url'])
        if len(visited) > MAX_CATEGORIES: raise CategoryError('Lidl category graph exceeds the audit bound; no truncated publication.')
        with ThreadPoolExecutor(max_workers=4) as pool:
            for summary, products, children in pool.map(load_category, batch):
                categories.append(summary); source_urls.update(summary['sourceUrls']); queue.extend(children); all_ids.update(summary['productIds']); unpublished_ids.update(summary['unpublishedIds'])
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
    identity = [{'url': row['url'], 'name':row['name'], 'parent':row['parent'], 'products': row['productIds']} for row in categories]
    metadata = {'menu_status': 'complete', 'menu_root': MENU_ROOT, 'menu_departments': menu, 'menu_categories': categories,
        'menu_categories_checked': len(categories), 'menu_pages_checked': len(source_urls), 'menu_products_identified': len(all_ids), 'menu_products_published':len(products), 'menu_unpublished_ids':sorted(unpublished_ids),
        'menu_with_public_price': sum(row['publicPriceGBP'] is not None for row in products),
        'menu_with_member_price': sum(bool(row['memberOffers']) for row in products),
        'menu_source_urls': sorted(source_urls), 'menu_ids_sha256': hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest(),
        'menu_content_sha256': hashlib.sha256(json.dumps([{k:v for k,v in p.items() if k!='sourceUrl'} for p in products],sort_keys=True).encode()).hexdigest(),
        'menu_products': products}
    return {row['url'] for row in products}, metadata
