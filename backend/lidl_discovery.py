"""Additional product URLs from Lidl GB's official public search endpoint.

``discover_supplement(get, known_urls)`` returns ``(set_of_urls, metadata)``.
``get`` receives HTTPS URLs and returns public JSON text; retry/timeout policy
belongs to that injected fetcher. Only canonical URLs are discovered here: the
caller must fetch and validate their product pages before publishing records.

The search schema has numeric ``numFound``, ``offset`` and ``fetchsize``, plus
``locale=en_GB``, ``assortment=GB`` and product ``items``. ``idsOnly=true``
pages contain every product code; corresponding ``idsOnly=false`` pages expose
``gridbox.country=GB`` and ``gridbox.data.erpNumber/canonicalPath``. Some IDs
have no rendered gridbox. Their explicit IDs are checked against the official
``/q/api/gridboxes/GB/en?ids=...`` endpoint. Its exact-length positional result
contains GB gridboxes or null for unpublished IDs. Nulls are reported as missing
published data, without inventing URLs or discarding the existing catalogue.

Metadata keys are prefixed ``search_`` so they can be merged into the catalogue
metadata without replacing sitemap coverage or the full snapshot counts.
"""
from __future__ import annotations

import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode, urljoin

ORIGIN = 'https://www.lidl.co.uk'
ENDPOINT = ORIGIN + '/q/api/search'
GRIDBOX_ENDPOINT = ORIGIN + '/q/api/gridboxes/GB/en'
PAGE_SIZE = 48
MAX_PRODUCTS = 20_000
WORKERS = 4
PRODUCT = re.compile(r'^https://www\.lidl\.co\.uk/p/[^/?#]+/p(\d+)$')


class DiscoveryError(RuntimeError):
    """Incomplete, unstable or invalid public product discovery."""


def _url(offset, ids_only):
    return ENDPOINT + '?' + urlencode({
        'assortment': 'GB', 'locale': 'en_GB', 'version': '2.1.0',
        'fetchsize': PAGE_SIZE, 'productsOnly': 'true',
        'idsOnly': 'true' if ids_only else 'false', 'offset': offset,
    })


def _integer(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _page(get, offset, ids_only, expected=None):
    source_url = _url(offset, ids_only)
    try:
        document = json.loads(get(source_url))
    except Exception as exc:
        raise DiscoveryError(f'Official Lidl search page failed: {source_url}') from exc
    if not isinstance(document, dict):
        raise DiscoveryError('Official Lidl search response is not an object.')
    total = document.get('numFound')
    if not _integer(total) or not 0 < total <= MAX_PRODUCTS:
        raise DiscoveryError('Invalid or empty official Lidl search product count.')
    if expected is not None and total != expected:
        raise DiscoveryError('Official Lidl search product count changed during discovery.')
    if document.get('locale') != 'en_GB' or document.get('assortment') != 'GB':
        raise DiscoveryError('Official Lidl search returned a different country or locale.')
    if not _integer(document.get('offset')) or document['offset'] != offset:
        raise DiscoveryError('Official Lidl search returned the wrong page offset.')
    if not _integer(document.get('fetchsize')) or document['fetchsize'] != PAGE_SIZE:
        raise DiscoveryError('Official Lidl search changed the requested page size.')
    items = document.get('items')
    if not isinstance(items, list) or len(items) > min(PAGE_SIZE, total - offset):
        raise DiscoveryError('Invalid official Lidl search items page.')
    codes = []
    for item in items:
        if not isinstance(item, dict) or item.get('type') != 'product' or item.get('resultClass') != 'product':
            raise DiscoveryError('Official Lidl product search returned a non-product item.')
        code = item.get('code')
        if not isinstance(code, str) or not re.fullmatch(r'\d+', code):
            raise DiscoveryError('Official Lidl search returned an invalid product identity.')
        codes.append(code)
    if len(set(codes)) != len(codes):
        raise DiscoveryError('Duplicate product identities in an official Lidl search page.')
    if ids_only and len(codes) != min(PAGE_SIZE, total - offset):
        raise DiscoveryError('Incomplete official Lidl search identity page.')
    return document, tuple(codes), source_url


def _canonical_products(document):
    products = {}
    for item in document['items']:
        code = item['code']
        gridbox = item.get('gridbox')
        if not isinstance(gridbox, dict) or gridbox.get('country') != 'GB':
            raise DiscoveryError('Official Lidl gridbox is missing its GB country identity.')
        data = gridbox.get('data')
        if not isinstance(data, dict) or data.get('erpNumber') != code:
            raise DiscoveryError('Official Lidl search gridbox product identity mismatch.')
        path = data.get('canonicalPath')
        if not isinstance(path, str) or not path.startswith('/p/'):
            raise DiscoveryError('Official Lidl search is missing a canonical product path.')
        canonical_url = urljoin(ORIGIN, path)
        match = PRODUCT.fullmatch(canonical_url)
        if not match or match[1] != code:
            raise DiscoveryError('Official Lidl search canonical URL product identity mismatch.')
        alias = data.get('canonicalUrl')
        if alias and (not isinstance(alias, str) or urljoin(ORIGIN, alias) != canonical_url):
            raise DiscoveryError('Official Lidl search canonical URL differs from its path.')
        products[code] = canonical_url
    return products


def _gridboxes(get, codes):
    source_url = GRIDBOX_ENDPOINT + '?' + urlencode({'ids': ','.join(codes)})
    try:
        rows = json.loads(get(source_url))
    except Exception as exc:
        raise DiscoveryError(f'Official Lidl gridboxes failed for product identities {list(codes)}.') from exc
    if not isinstance(rows, list) or len(rows) != len(codes):
        raise DiscoveryError(f'Incomplete official Lidl gridbox response for product identities {list(codes)}.')
    products, unpublished = {}, set()
    for code, row in zip(codes, rows):
        if row is None:
            unpublished.add(code)
            continue
        if not isinstance(row, dict):
            raise DiscoveryError('Invalid official Lidl explicit product gridbox.')
        if row.get('id') is not None and row['id'] != code:
            raise DiscoveryError('Official Lidl explicit gridbox ID does not match its requested identity.')
        if row.get('productId') is not None and str(row['productId']) != code:
            raise DiscoveryError('Official Lidl explicit gridbox product ID does not match its requested identity.')
        products.update(_canonical_products({'items': [{'code': code, 'gridbox': row}]}))
    return products, unpublished, source_url

def confirm_unpublished(get, codes):
    """Require two explicit null responses for already known product IDs."""
    codes=tuple(codes)
    if not codes or len(codes)>PAGE_SIZE or len(set(codes))!=len(codes) or any(not isinstance(code,str) or not re.fullmatch(r'\d+',code) for code in codes):
        raise DiscoveryError('Invalid product identities for publication confirmation.')
    source_url=None
    for _ in range(2):
        products,unpublished,source_url=_gridboxes(get,codes)
        if products or unpublished!=set(codes):
            raise DiscoveryError('A page without validated data still has published official product data; files kept.')
    return source_url


def discover_supplement(get, known_urls):
    """Discover a complete, stable search URL supplement or raise DiscoveryError.

    The returned set contains all rendered search product URLs, including those
    already known. ``search_products_new`` counts new IDs, not renamed slugs.
    Hidden IDs are counted in ``search_products_unrendered`` and individually
    listed in ``search_unrendered_ids``. Explicit null gridboxes are reported in
    ``search_unpublished_ids``; ``search_card_coverage``/``search_url_coverage``
    describe the available public evidence. ``search_source_urls`` lists the
    exact search and explicit gridbox JSON requests used for discovery.
    """
    known_ids = set()
    for url in known_urls:
        match = PRODUCT.fullmatch(url) if isinstance(url, str) else None
        if not match:
            raise DiscoveryError('The base catalogue has an invalid official Lidl product URL.')
        known_ids.add(match[1])

    head, head_ids, head_url = _page(get, 0, True)
    total = head['numFound']
    offsets = list(range(0, total, PAGE_SIZE))
    identity_pages = {0: (head, head_ids, head_url)}
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        # Finish the complete ID pass before comparing its rendered pages.
        pending = {offset: pool.submit(_page, get, offset, True, total) for offset in offsets[1:]}
        for offset, future in pending.items():
            identity_pages[offset] = future.result()
        ordered_ids = [code for offset in offsets for code in identity_pages[offset][1]]
        all_ids = set(ordered_ids)
        if len(ordered_ids) != total or len(all_ids) != total:
            raise DiscoveryError('Official Lidl search identities are duplicated or incomplete across pages.')

        pending = {offset: pool.submit(_page, get, offset, False, total) for offset in offsets}
        rendered_pages = {}
        products = {}
        for offset, future in pending.items():
            document, codes, source_url = future.result()
            if not set(codes).issubset(identity_pages[offset][1]):
                raise DiscoveryError('Official Lidl rendered search page differs from its identity page.')
            page_products = _canonical_products(document)
            if products.keys() & page_products.keys():
                raise DiscoveryError('Official Lidl rendered search repeats product identities across pages.')
            products.update(page_products)
            rendered_pages[offset] = (page_products, source_url)

    rendered_count = len(products)
    unrendered = all_ids - products.keys()
    gridbox_batches = [tuple(sorted(unrendered)[start:start + PAGE_SIZE]) for start in range(0, len(unrendered), PAGE_SIZE)]
    gridbox_pages = {}
    recovered, unpublished = {}, set()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        pending = {codes: pool.submit(_gridboxes, get, codes) for codes in gridbox_batches}
        for codes, future in pending.items():
            page_products, page_unpublished, source_url = future.result()
            recovered.update(page_products)
            unpublished.update(page_unpublished)
            gridbox_pages[codes] = (page_products, page_unpublished, source_url)
    products.update(recovered)

    _, final_head_ids, _ = _page(get, 0, True, total)
    final_rendered, final_rendered_ids, _ = _page(get, 0, False, total)
    if head_ids != final_head_ids or not set(final_rendered_ids).issubset(head_ids):
        raise DiscoveryError('Official Lidl search identity head changed during discovery.')
    if rendered_pages[0][0] != _canonical_products(final_rendered):
        raise DiscoveryError('Official Lidl rendered search head changed during discovery.')
    if gridbox_batches:
        codes = gridbox_batches[0]
        final_products, final_unpublished, _ = _gridboxes(get, codes)
        if (final_products, final_unpublished) != gridbox_pages[codes][:2]:
            raise DiscoveryError('Official Lidl explicit gridbox head changed during discovery.')

    source_urls = [identity_pages[offset][2] for offset in offsets]
    source_urls.extend(rendered_pages[offset][1] for offset in offsets)
    gridbox_source_urls = [gridbox_pages[codes][2] for codes in gridbox_batches]
    source_urls.extend(gridbox_source_urls)
    metadata = {
        'search_schema_version': 1, 'search_status': 'complete_with_unpublished_ids' if unpublished else 'complete',
        'search_source': 'Lidl GB official public product search',
        'search_source_url': ENDPOINT, 'search_source_urls': source_urls,
        'search_products_expected': total, 'search_products_identified': len(all_ids),
        'search_products_rendered': rendered_count, 'search_products_unrendered': len(unrendered),
        'search_products_recovered': len(recovered), 'search_products_discovered': len(products),
        'search_products_unpublished': len(unpublished), 'search_unpublished_ids': sorted(unpublished),
        'search_card_coverage': rendered_count / total, 'search_url_coverage': len(products) / total,
        'search_gridbox_source_urls': gridbox_source_urls,
        'search_products_new': len(products.keys() - known_ids),
        'search_unrendered_ids': sorted(unrendered), 'search_pages': len(offsets),
        'search_page_size': PAGE_SIZE,
        'search_ids_sha256': hashlib.sha256('\n'.join(sorted(all_ids)).encode()).hexdigest(),
    }
    return set(products.values()), metadata
