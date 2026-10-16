import gzip
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from email.utils import formatdate
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import audit_lidl_price_sources as audit


class SourceAuditTests(unittest.TestCase):
    def fake_pacer(self):
        class Clock:
            now=0
            sleeps=[]
            def monotonic(self):return self.now
            def sleep(self,seconds):
                self.sleeps.append(seconds)
                self.now+=seconds
        clock=Clock()
        return clock,audit.RequestPacer(clock=clock.monotonic,sleeper=clock.sleep,wall_clock=lambda:1760000000)

    def fixture(self):
        product=audit.ORIGIN+'/p/oats/p10000000'
        content=audit.ORIGIN+'/c/everyday-essentials/s123456'
        store=audit.ORIGIN+'/s/en-GB/store-finder/sheffield/alison-crescent/'
        child=audit.ORIGIN+'/nested.xml.gz'
        viewer=audit.ORIGIN+'/l/en/online-leaflets/15-10-21-10-lidl-weekly/ar/0'
        docs={audit.ORIGIN+'/robots.txt':'Sitemap: '+audit.SITEMAP,
            audit.SITEMAP:f'<sitemapindex><sitemap><loc>{child}</loc></sitemap></sitemapindex>',
            child:f'<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>{product}</loc><image:image><image:loc>https://external.example/product.jpg</image:loc></image:image></url><url><loc>{content}</loc></url><url><loc>{store}</loc></url></urlset>',
            content:'<h1>Oats</h1><p>500g £0.79 until Sunday. With Lidl Plus.</p><a href="/static/leaflet.pdf">Leaflet</a><a href="https://external.example/no.pdf">External PDF</a><script type="application/ld+json">'+json.dumps({'@type':'Product','name':'Oats','sku':'10000000','offers':{'price':.79,'priceCurrency':'GBP','validForMemberTier':'Lidl Plus'}})+'</script>',
            audit.LEAFLETS:'<a href="'+viewer+'">Current leaflet</a>',
            viewer:'<script type="application/json">{"viewer":"public data"}</script><p>Current leaflet</p>'}
        return docs,product,content,store,viewer

    def test_every_sitemap_url_is_accounted_for_and_candidates_cannot_publish_prices(self):
        docs,product,content,store,viewer=self.fixture()
        original=docs[content]
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory);catalogue=target/'catalogue.json'
            catalogue.write_text(json.dumps([{'id':'10000000','price':None,'checkedAt':'2026-10-15T10:00:00Z'}]))
            before=catalogue.read_bytes()
            report=audit.audit(target,docs.__getitem__,catalogue_path=catalogue)
            rows={row['url']:row for row in report['urls']}
            self.assertEqual(report['status'],'complete');self.assertFalse(report['pricesPublished'])
            self.assertEqual(report['summary']['sitemapUrls'],3)
            self.assertEqual(report['summary']['urlsAccountedFor'],5)
            self.assertEqual(rows[product]['status'],'delegated_product_refresh')
            self.assertIsNone(rows[product]['savedProductEvidence']['price'])
            self.assertEqual(rows[store]['status'],'excluded')
            self.assertEqual(rows[viewer]['status'],'checked')
            self.assertEqual(rows[viewer]['discoverySource'],'official_leaflet_hub_or_viewer_link')
            self.assertEqual(rows[content]['priceContexts'][0]['amountText'],'£0.79')
            self.assertTrue(rows[content]['priceContexts'][0]['stapleMention'])
            self.assertEqual(rows[content]['structuredCandidates'][0]['offer']['validForMemberTier'],'Lidl Plus')
            manifest={row['url']:row for row in json.loads((target/'source-manifest.json').read_text())}
            capture=manifest[content]
            self.assertEqual(capture['sha256'],hashlib.sha256(original.encode()).hexdigest())
            self.assertEqual(gzip.decompress((target/capture['file']).read_bytes()).decode(),original)
            candidates=json.loads((target/'price-candidates.json').read_text())
            self.assertEqual(candidates[0]['sourceSha256'],capture['sha256'])
            self.assertEqual(catalogue.read_bytes(),before)
            self.assertNotIn('https://external.example/product.jpg',rows)

    def test_failed_content_records_incomplete_audit_and_retains_other_evidence(self):
        docs,_,content,_,_=self.fixture()
        def get(url):
            if url==content: raise RuntimeError('HTTP 503')
            return docs[url]
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)
            with self.assertRaisesRegex(audit.LidlRefreshError,'incomplete'): audit.audit(target,get,catalogue_path=target/'missing.json')
            report=json.loads((target/'price-source-audit.json').read_text())
            row=next(row for row in report['urls'] if row['url']==content)
            self.assertEqual(row['status'],'failed');self.assertEqual(report['status'],'incomplete')
            self.assertEqual(row['error'],'HTTP 503')
            self.assertTrue((target/'source-manifest.json').exists())

    def test_sitemap_limit_fails_explicitly_without_a_complete_claim(self):
        docs,_,_,_,_=self.fixture()
        with tempfile.TemporaryDirectory() as directory, patch.object(audit,'MAX_URLS',1):
            target=Path(directory)
            with self.assertRaises(audit.LidlRefreshError):audit.audit(target,docs.__getitem__,catalogue_path=target/'missing.json')
            report=json.loads((target/'price-source-audit.json').read_text())
            self.assertEqual(report['status'],'incomplete');self.assertEqual(len(report['urls']),3)
            self.assertTrue(all(row['status']=='not_checked' for row in report['urls']))

    def test_price_contexts_skip_scripts_and_keep_pdf_hosts_separate(self):
        result=audit.evidence('<script>const guessed="£9.99"</script><style>.x{width:99px}</style><p>Chicken breast 1kg £6.49</p><a href="/x.pdf">PDF</a><a href="https://other.example/x.pdf">PDF</a>',audit.ORIGIN+'/c/food/s1')
        self.assertEqual([p['amountText'] for p in result['priceContexts']],['£6.49'])
        self.assertEqual({p['officialGbHost'] for p in result['pdfLinks']},{True,False})
        self.assertEqual(result['structuredCandidates'],[])

    def test_embedded_official_leaflet_link_is_discovered_without_running_scripts(self):
        url=audit.ORIGIN+'/l/en/online-leaflets/weekly/ar/0'
        source='<script type="application/json">{"url":"'+url.replace('/','\\/')+'"}</script>'
        self.assertEqual(audit.evidence(source,audit.LEAFLETS)['leafletViewerLinks'],[url])

    def test_outside_redirect_is_rejected_and_cannot_be_fetched(self):
        _,pacer=self.fake_pacer()
        with patch.object(audit,'PACER',pacer),patch.object(audit.LOCAL,'session',create=True) as session:
            response=session.get.return_value
            response.__enter__.return_value=response
            response.is_redirect=True;response.status_code=302
            response.headers={'Location':'https://other.example/private'}
            with self.assertRaisesRegex(audit.LidlRefreshError,'redirects outside'):audit.fetch_source(audit.LEAFLETS)
            session.get.assert_called_once()
        for url in ('http://www.lidl.co.uk/x','https://lidl.co.uk/x','https://www.lidl.co.uk:444/x','https://name@www.lidl.co.uk/x'):
            self.assertFalse(audit.official(url))

    def test_shared_gate_spaces_all_requests_and_cooldown_applies_to_other_workers(self):
        clock,pacer=self.fake_pacer()
        starts=[]
        def request(url,**kwargs):
            starts.append(clock.now)
            response=audit.requests.Response();response.url=url
            response.status_code=429 if len(starts)==1 else 200
            response.headers={'Retry-After':'8'} if len(starts)==1 else {}
            response._content=b'<p>source</p>'
            response._content_consumed=True
            return response
        with patch.object(audit,'PACER',pacer),patch.object(audit.LOCAL,'session',create=True) as session:
            session.get.side_effect=request
            audit.fetch_source(audit.LEAFLETS)
            # A different content request shares the same gate, rather than
            # starting a new per-thread/per-URL retry schedule.
            audit.fetch_source(audit.ORIGIN+'/c/oats/s123')
            audit.fetch_source(audit.ORIGIN+'/c/chicken/s124')
        self.assertEqual(starts,[0,8,9,10])
        self.assertTrue(all(0<delay<=1 for delay in clock.sleeps))

    def test_http_date_retry_after_and_later_rate_limit_extend_shared_cooldown(self):
        clock,pacer=self.fake_pacer()
        pacer.acquire()
        pacer.defer(formatdate(1760000012,usegmt=True),0)
        pacer.acquire();self.assertEqual(clock.now,12)
        pacer.defer('invalid header',1)
        pacer.acquire();self.assertEqual(clock.now,22)
        pacer.defer('0',0)
        pacer.acquire();self.assertEqual(clock.now,23)

    def test_long_retry_after_stops_without_early_retry_and_deadline_is_explicit(self):
        _,pacer=self.fake_pacer()
        with self.assertRaisesRegex(audit.LidlRefreshError,'without an early retry'):pacer.defer('120',0)
        with self.assertRaisesRegex(audit.LidlRefreshError,'without an early retry'):pacer.acquire()
        pacer.begin(5)
        pacer.defer('6',0)
        with self.assertRaisesRegex(audit.LidlRefreshError,'time bound'):pacer.acquire()

    def test_persistent_rate_limit_is_bounded_and_does_not_become_a_success(self):
        clock,pacer=self.fake_pacer()
        starts=[]
        def request(url,**kwargs):
            starts.append(clock.now)
            response=audit.requests.Response();response.url=url;response.status_code=429
            response.headers={'Retry-After':'2'};response._content=b'';response._content_consumed=True
            return response
        with patch.object(audit,'PACER',pacer),patch.object(audit.LOCAL,'session',create=True) as session:
            session.get.side_effect=request
            with self.assertRaises(audit.requests.HTTPError):audit.fetch_source(audit.LEAFLETS)
        self.assertEqual(starts,[0,2,4]);self.assertEqual(pacer.cooldown_until,6)
        self.assertEqual(audit.exclusion(audit.ORIGIN+'/s/'),'store_directory_hours_and_addresses_not_a_published_shelf_price_feed')


if __name__=='__main__':unittest.main()
