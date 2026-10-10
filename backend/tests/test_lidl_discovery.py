import json
import sys
import threading
import time
import unittest
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import lidl_discovery as discovery


def product_url(index):
    return f'https://www.lidl.co.uk/p/product-{index}/p{10000000 + index}'


class SearchFixture:
    def __init__(self, total=101, hidden=(), change=None, delay=0, recovered=(), gridbox_change=None):
        self.total, self.hidden, self.change, self.delay = total, set(hidden), change, delay
        self.recovered, self.gridbox_change = set(recovered), gridbox_change
        self.calls, self.active, self.max_active = Counter(), 0, 0
        self.lock = threading.Lock()

    def get(self, url):
        parsed = urlsplit(url)
        assert parsed.scheme == 'https' and parsed.hostname == 'www.lidl.co.uk'
        query = parse_qs(parsed.query)
        if parsed.path == '/q/api/gridboxes/GB/en':
            codes = tuple(query['ids'][0].split(','))
            assert 0 < len(codes) <= 48
            with self.lock:
                self.calls[codes, 'gridboxes'] += 1
                call = self.calls[codes, 'gridboxes']
            rows = [self.gridbox(int(code) - 10000000) if int(code) - 10000000 in self.recovered else None for code in codes]
            if self.gridbox_change:
                self.gridbox_change(rows, codes, call)
            return json.dumps(rows)
        assert parsed.path == '/q/api/search'
        assert query['assortment'] == ['GB'] and query['locale'] == ['en_GB']
        assert query['fetchsize'] == ['48'] and query['productsOnly'] == ['true']
        assert query['version'] == ['2.1.0']
        offset, ids_only = int(query['offset'][0]), query['idsOnly'] == ['true']
        with self.lock:
            self.calls[offset, ids_only] += 1
            call = self.calls[offset, ids_only]
            self.active += 1
            self.max_active = max(self.max_active, self.active)
        try:
            if self.delay:
                time.sleep(self.delay)
            items = []
            for index in range(offset, min(offset + 48, self.total)):
                if not ids_only and index in self.hidden:
                    continue
                code = str(10000000 + index)
                item = {'resultClass': 'product', 'type': 'product', 'code': code}
                if not ids_only:
                    item['gridbox'] = self.gridbox(index)
                items.append(item)
            document = {'locale': 'en_GB', 'assortment': 'GB', 'numFound': self.total, 'offset': offset, 'fetchsize': 48, 'items': items}
            if self.change:
                self.change(document, offset, ids_only, call)
            return json.dumps(document)
        finally:
            with self.lock:
                self.active -= 1

    @staticmethod
    def gridbox(index):
        code, path = str(10000000 + index), urlsplit(product_url(index)).path
        return {'country': 'GB', 'id': code, 'productId': int(code), 'data': {'erpNumber': code, 'canonicalPath': path, 'canonicalUrl': path}}


class LidlDiscoveryTests(unittest.TestCase):
    def test_complete_search_adds_new_urls_and_accounts_for_known_hidden_ids(self):
        source = SearchFixture(hidden=range(6), delay=.001)
        urls, metadata = discovery.discover_supplement(source.get, [product_url(i) for i in range(100)])
        self.assertEqual(urls, {product_url(i) for i in range(6, 101)})
        self.assertEqual(metadata['search_products_expected'], 101)
        self.assertEqual(metadata['search_products_identified'], 101)
        self.assertEqual(metadata['search_products_rendered'], 95)
        self.assertEqual(metadata['search_products_unrendered'], 6)
        self.assertEqual(metadata['search_unrendered_ids'], [str(10000000 + i) for i in range(6)])
        self.assertEqual(metadata['search_products_new'], 1)
        self.assertEqual(metadata['search_pages'], 3)
        self.assertEqual(metadata['search_products_unpublished'], 6)
        self.assertEqual(metadata['search_status'], 'complete_with_unpublished_ids')
        self.assertEqual(metadata['search_card_coverage'], 95 / 101)
        self.assertEqual(metadata['search_url_coverage'], 95 / 101)
        self.assertEqual(len(metadata['search_source_urls']), 7)
        self.assertEqual(len(metadata['search_ids_sha256']), 64)
        self.assertEqual(source.calls[0, True], 2)
        self.assertEqual(source.calls[0, False], 2)
        self.assertLessEqual(source.max_active, 4)

    def test_explicitly_unpublished_identity_is_reported_without_inventing_a_url(self):
        source = SearchFixture(hidden={100})
        urls, metadata = discovery.discover_supplement(source.get, [product_url(i) for i in range(100)])
        self.assertEqual(urls, {product_url(i) for i in range(100)})
        self.assertEqual(metadata['search_unpublished_ids'], ['10000100'])
        self.assertEqual(metadata['search_products_unpublished'], 1)
        self.assertEqual(metadata['search_products_new'], 0)
        self.assertLess(metadata['search_card_coverage'], 1)
        self.assertLess(metadata['search_url_coverage'], 1)

    def test_hidden_product_canonical_url_is_recovered_from_its_explicit_gridbox(self):
        source = SearchFixture(hidden={100}, recovered={100})
        urls, metadata = discovery.discover_supplement(source.get, [product_url(i) for i in range(100)])
        self.assertEqual(urls, {product_url(i) for i in range(101)})
        self.assertEqual(metadata['search_products_rendered'], 100)
        self.assertEqual(metadata['search_products_recovered'], 1)
        self.assertEqual(metadata['search_products_discovered'], 101)
        self.assertEqual(metadata['search_products_new'], 1)
        self.assertEqual(metadata['search_products_unpublished'], 0)
        self.assertLess(metadata['search_card_coverage'], 1)
        self.assertEqual(metadata['search_url_coverage'], 1)

    def test_gridbox_omissions_schema_identity_and_transport_failures_are_rejected(self):
        changes = [
            lambda rows: rows.pop(),
            lambda rows: rows.__setitem__(0, {}),
            lambda rows: rows[0].update(id='99999999'),
            lambda rows: rows[0].update(productId=99999999),
            lambda rows: rows[0]['data'].update(erpNumber='99999999'),
            lambda rows: rows[0]['data'].update(canonicalPath='/p/other/p99999999'),
            lambda rows: rows[0].update(country='US'),
        ]
        for mutate in changes:
            def change(rows, codes, call):
                mutate(rows)
            with self.subTest(mutate=mutate), self.assertRaises(discovery.DiscoveryError):
                discovery.discover_supplement(SearchFixture(hidden={100}, recovered={100}, gridbox_change=change).get, [])
        source = SearchFixture(hidden={100})
        def failed_gridbox(url):
            if '/gridboxes/' in url:
                raise OSError('gridbox request failed')
            return source.get(url)
        with self.assertRaisesRegex(discovery.DiscoveryError, '10000100'):
            discovery.discover_supplement(failed_gridbox, [])

    def test_explicit_gridbox_publication_changes_are_rejected(self):
        def change(rows, codes, call):
            if call == 2:
                rows[0] = SearchFixture.gridbox(100)
        with self.assertRaisesRegex(discovery.DiscoveryError, 'gridbox head changed'):
            discovery.discover_supplement(SearchFixture(hidden={100}, gridbox_change=change).get, [])

    def test_explicit_gridbox_recovery_uses_bounded_batches(self):
        source = SearchFixture(hidden=range(49), recovered={48})
        urls, metadata = discovery.discover_supplement(source.get, [])
        self.assertEqual(len(urls), 53)
        self.assertEqual(metadata['search_products_recovered'], 1)
        self.assertEqual(metadata['search_products_unpublished'], 48)
        self.assertEqual(len(metadata['search_gridbox_source_urls']), 2)

    def test_duplicate_and_short_identity_pages_are_rejected(self):
        def duplicate(document, offset, ids_only, call):
            if offset == 48 and ids_only:
                document['items'][0]['code'] = '10000000'
        def short(document, offset, ids_only, call):
            if offset == 48 and ids_only:
                document['items'].pop()
        for change in (duplicate, short):
            with self.subTest(change=change.__name__), self.assertRaises(discovery.DiscoveryError):
                discovery.discover_supplement(SearchFixture(change=change).get, [])

    def test_wrong_count_offset_size_locale_and_item_schema_are_rejected(self):
        cases = [('numFound', 102), ('offset', 0), ('fetchsize', 60), ('locale', 'de_DE'), ('assortment', 'DE'), ('numFound', True), ('items', {})]
        for field, value in cases:
            def change(document, offset, ids_only, call):
                if offset == 48 and ids_only:
                    document[field] = value
            with self.subTest(field=field, value=value), self.assertRaises(discovery.DiscoveryError):
                discovery.discover_supplement(SearchFixture(change=change).get, [])

    def test_rendered_identity_country_and_canonical_path_are_verified(self):
        changes = [
            lambda item: item['gridbox']['data'].update(erpNumber='99999999'),
            lambda item: item['gridbox'].update(country='US'),
            lambda item: item['gridbox']['data'].update(canonicalPath='/p/another/p99999999'),
            lambda item: item['gridbox']['data'].update(canonicalPath='https://example.com/p/a/p10000000'),
            lambda item: item['gridbox']['data'].update(canonicalUrl='https://example.com/p/a/p10000000'),
            lambda item: item.update(code='99999999'),
            lambda item: item.update(type='category'),
            lambda item: item.update(code=True),
        ]
        for mutate in changes:
            def change(document, offset, ids_only, call):
                if not ids_only and offset == 0:
                    mutate(document['items'][0])
            with self.subTest(mutate=mutate), self.assertRaises(discovery.DiscoveryError):
                discovery.discover_supplement(SearchFixture(change=change).get, [])

    def test_changed_identity_or_rendered_head_is_rejected(self):
        def identity(document, offset, ids_only, call):
            if ids_only and offset == 0 and call == 2:
                document['items'][0]['code'] = '99999999'
        def canonical(document, offset, ids_only, call):
            if not ids_only and offset == 0 and call == 2:
                data = document['items'][0]['gridbox']['data']
                data['canonicalPath'] = data['canonicalUrl'] = '/p/renamed/p10000000'
        def count(document, offset, ids_only, call):
            if ids_only and offset == 0 and call == 2:
                document['numFound'] += 1
        for change in (identity, canonical, count):
            with self.subTest(change=change.__name__), self.assertRaises(discovery.DiscoveryError):
                discovery.discover_supplement(SearchFixture(change=change).get, [])

    def test_failed_request_invalid_json_empty_count_and_invalid_base_are_rejected(self):
        def failure(url):
            raise OSError('network failure')
        for get in (failure, lambda url: '{invalid', SearchFixture(total=0).get):
            with self.subTest(get=get), self.assertRaises(discovery.DiscoveryError):
                discovery.discover_supplement(get, [])
        with self.assertRaisesRegex(discovery.DiscoveryError, 'base catalogue'):
            discovery.discover_supplement(SearchFixture().get, ['https://example.com/p/milk/p10000000'])

    def test_renamed_known_product_url_does_not_count_as_a_new_identity(self):
        urls, metadata = discovery.discover_supplement(SearchFixture(total=1).get, ['https://www.lidl.co.uk/p/older-name/p10000000'])
        self.assertEqual(urls, {product_url(0)})
        self.assertEqual(metadata['search_products_new'], 0)


if __name__ == '__main__':
    unittest.main()
