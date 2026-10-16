import gzip
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import audit_lidl_leaflets as audit


class LeafletAuditTests(unittest.TestCase):
    def fixture(self):
        slug = '15-10-21-10-lidl-weekly'
        viewer = 'https://www.lidl.co.uk/l/en/online-leaflets/'+slug+'/ar/0'
        data = {'locale': 'en-GB', 'pages': [{'altText': 'Oats 1kg £1.25 with membership', 'imageUrl': 'https://assets.leaflets.schwarz/images/page.jpg'}],
                'pdfUrl': 'https://outside.example/leaflet.pdf'}
        docs = {audit.HUB: '<a href="'+viewer+'">Leaflet</a>', audit.MODULE: '/* public module, never evaluated */',
                viewer: '<div id="root"></div>', audit.OVERVIEW: json.dumps({'success': True, 'locale': 'en-GB', 'categories': [{'subcategories': [{'flyers': [self.overview_entry(slug, viewer)]}]}]}),
                audit.flyer_url(slug): json.dumps(data)}
        return docs, slug, viewer

    def overview_entry(self, slug, viewer):
        code = viewer.rsplit('/', 1)[-1]
        return {'regionAliasAbsoluteUrl': viewer, 'flyerJson': audit.flyer_url(slug),
                'regions': [{'type': 'national' if code == '0' else 'offer_region', 'code': code}],
                'offerStartDate': '2026-10-15', 'offerEndDate': '2026-10-21'}

    def test_regional_overview_identity_is_captured_even_when_absent_from_hub(self):
        docs, _, _ = self.fixture()
        regional_slug = '15-10-21-10-lidl-weekly-ee8c68'
        regional = 'https://www.lidl.co.uk/l/en/online-leaflets/'+regional_slug+'/ar/1'
        overview = json.loads(docs[audit.OVERVIEW])
        overview['categories'][0]['subcategories'][0]['flyers'].append(self.overview_entry(regional_slug, regional))
        docs[audit.OVERVIEW] = json.dumps(overview)
        docs[regional] = '<div id="root"></div>'
        docs[audit.flyer_url(regional_slug)] = json.dumps({'locale': 'en-GB', 'pages': [{'altText': 'Regional Lidl leaflet'}]})
        calls = []
        def get(url):
            calls.append(url)
            return docs[url]
        with tempfile.TemporaryDirectory() as directory:
            report = audit.audit(Path(directory), get)
            self.assertEqual(report['status'], 'complete_metadata_capture')
            self.assertEqual(report['summary']['weeklyViewerIdentities'], 2)
            self.assertEqual(report['summary']['metadataResponsesCaptured'], 3)
            self.assertIn(regional, calls)
            self.assertIn(audit.flyer_url(regional_slug), calls)
            regional_row = next(row for row in report['overviewFlyers'] if row['viewerUrl'] == regional)
            self.assertEqual(regional_row['regions'], [{'type': 'offer_region', 'code': '1'}])
            self.assertEqual(regional_row['offerStartDate'], '2026-10-15')

    def test_overview_route_region_and_country_identity_cannot_be_substituted(self):
        for changed in ({'flyerJson': audit.OVERVIEW},
                        {'regionAliasAbsoluteUrl': 'https://evil.example/l/en/online-leaflets/15-10-21-10-lidl-weekly/ar/0'},
                        {'regions': [{'type': 'national', 'code': '11'}]}):
            docs, _, _ = self.fixture()
            overview = json.loads(docs[audit.OVERVIEW])
            overview['categories'][0]['subcategories'][0]['flyers'][0].update(changed)
            docs[audit.OVERVIEW] = json.dumps(overview)
            with tempfile.TemporaryDirectory() as directory:
                with self.assertRaisesRegex(audit.LeafletAuditError, 'incomplete'):
                    audit.audit(Path(directory), docs.__getitem__)
                report = json.loads((Path(directory)/'leaflet-audit.json').read_text())
                self.assertEqual(report['status'], 'incomplete')
                self.assertEqual(report['summary']['capturedSources'], 2)

    def test_exact_identified_sources_retained_without_fetching_asset_links_or_pricing(self):
        docs, slug, viewer = self.fixture()
        calls = []
        def get(url):
            calls.append(url)
            return docs[url]
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            report = audit.audit(target, get)
            self.assertEqual(report['status'], 'complete_metadata_capture')
            self.assertFalse(report['pricesPublished'])
            self.assertEqual(report['viewerUrls'], [viewer])
            self.assertEqual(set(calls), set(docs))
            row = next(row for row in report['sourceRequests'] if row['url'] == audit.flyer_url(slug))
            self.assertEqual(row['inspection']['observedTextFields'][0]['value'], 'Oats 1kg £1.25 with membership')
            self.assertTrue(all(not link['fetched'] for link in row['inspection']['links']))
            self.assertEqual(gzip.decompress((target/row['file']).read_bytes()).decode(), docs[row['url']])
            self.assertEqual(row['sha256'], hashlib.sha256(docs[row['url']].encode()).hexdigest())

    def test_http_error_or_wrong_locale_is_retained_as_incomplete_without_guessing(self):
        for response in (audit.Source('{"error":"unknown route"}', 400), '{"error":"unknown route"}', json.dumps({'countryCode': 'RO', 'price': 3})):
            docs, slug, _ = self.fixture()
            docs[audit.flyer_url(slug)] = response
            with tempfile.TemporaryDirectory() as directory:
                with self.assertRaisesRegex(audit.LeafletAuditError, 'incomplete'):
                    audit.audit(Path(directory), docs.__getitem__)
                report = json.loads((Path(directory)/'leaflet-audit.json').read_text())
                self.assertEqual(report['status'], 'incomplete')
                row = next(row for row in report['sourceRequests'] if row['url'] == audit.flyer_url(slug))
                self.assertEqual(row['status'], 'unverified')
                self.assertTrue(row['sha256'])

    def test_arbitrary_host_path_locale_flyer_or_redirect_cannot_be_read(self):
        _, slug, _ = self.fixture()
        for url in ('https://evil.example/v4/overview', 'https://name@endpoints.leaflets.schwarz/v4/overview',
                    'https://endpoints.leaflets.schwarz/v4/overview?client_locale=lidl/ro-RO',
                    'https://endpoints.leaflets.schwarz/private', audit.flyer_url('22-10-28-10-lidl-weekly')):
            self.assertFalse(audit.metadata_url(url, [slug]))
        reader = audit.Reader(10**20)
        response = audit.requests.Response()
        response.status_code = 302
        response.headers['Location'] = 'https://endpoints.leaflets.schwarz/private'
        response._content = b''
        response._content_consumed = True
        with patch.object(reader.pacer, 'acquire'), patch.object(reader.session, 'get', return_value=response) as get:
            with self.assertRaisesRegex(audit.LeafletAuditError, 'outside'):
                reader.get(audit.OVERVIEW, {audit.OVERVIEW})
            get.assert_called_once()

    def test_bounds_and_nonweekly_links_fail_explicitly(self):
        docs, _, viewer = self.fixture()
        docs[audit.HUB] += '<a href="https://evil.example/l/en/online-leaflets/22-10-28-10-lidl-weekly/ar/0">No</a>'
        # An external URL must not be rediscovered as a relative official link.
        self.assertEqual(audit.viewer_links(docs[audit.HUB]), [viewer])
        with tempfile.TemporaryDirectory() as directory, patch.object(audit, 'MAX_FLYERS', 0):
            with self.assertRaisesRegex(audit.LeafletAuditError, 'incomplete'):
                audit.audit(Path(directory), docs.__getitem__)
        with patch.object(audit, 'MAX_NODES', 1):
            with self.assertRaisesRegex(audit.LeafletAuditError, 'bound'):
                audit.inspect_metadata({'pages': [1, 2]})


if __name__ == '__main__':
    unittest.main()
