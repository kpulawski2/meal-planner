import hashlib, json, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import lidl_catalogue as lidl

def page(index, priced=True, future=False, item_extra=None):
    url=f'https://www.lidl.co.uk/p/milk/p{10000000+index}'
    offer={'priceCurrency':'GBP','availability':'InStoreOnly'}
    if priced: offer['price']=1.25
    item={'erpNumber':str(10000000+index),'canonicalUrl':url,'keyfacts':{'fullTitle':'Milbona Milk','supplementalDescription':'1L'},'category':'Food','wonCategoryBreadcrumbs':[[{'name':'Food & Drink'},{'name':'Milk & Cream'}]],'stockAvailability':{'badgeInfoV2':[{'validFrom':4102444800,'validUntil':4102531200}]} if future else {}}
    item.update(item_extra or {})
    # Flatten a small devalue tree with exactly the same format as Nuxt pages.
    table=[]
    def add(value):
        slot=len(table);table.append(None)
        if isinstance(value,dict): table[slot]={k:add(v) for k,v in value.items()}
        elif isinstance(value,list): table[slot]=[add(v) for v in value]
        else: table[slot]=value
        return slot
    add({'data':{'&erp'+item['erpNumber']:item}})
    product={'@type':'Product','sku':item['erpNumber'],'name':'Milbona Milk','offers':[offer]}
    return url,'<script type="application/ld+json">'+json.dumps(product)+'</script><script id="__NUXT_DATA__" type="application/json">'+json.dumps(table)+'</script>'

class LidlTests(unittest.TestCase):
    def test_retry_policy_is_bounded_and_honours_retry_after(self):
        retry=lidl.session().get_adapter('https://').max_retries
        self.assertEqual(retry.total,4);self.assertIn(429,retry.status_forcelist);self.assertTrue(retry.respect_retry_after_header);self.assertEqual(retry.allowed_methods,{'GET'})
    def test_recursive_sitemaps_and_non_gb_rejection(self):
        url,_=page(0)
        docs={lidl.ORIGIN+'/robots.txt':'Sitemap: '+lidl.SITEMAP,lidl.SITEMAP:'<sitemapindex><sitemap><loc>https://www.lidl.co.uk/nested.xml.gz</loc></sitemap></sitemapindex>','https://www.lidl.co.uk/nested.xml.gz':f'<urlset><url><loc>{url}</loc></url><url><loc>https://www.lidl.com/p/us/p1</loc></url></urlset>'}
        urls,maps=lidl.discover(docs.__getitem__);self.assertEqual(urls,[url]);self.assertEqual(len(maps),2)
        with self.assertRaises(lidl.LidlRefreshError): lidl.fetch('https://www.lidl.com/products')

    def test_unpublished_price_stays_null_and_pack_identity_is_preserved(self):
        url,source=page(0,False);row=lidl.parse_product(url,source,'2026-10-10T12:00:00Z')
        self.assertIsNone(row['price']);self.assertEqual(row['packQuantity'],1);self.assertEqual(row['packUnit'],'l');self.assertIsNone(row['available']);self.assertIsNone(row['gtin'])
        with self.assertRaises(lidl.LidlRefreshError): lidl.parse_product(url.replace('10000000','10000001'),source,'2026-10-10T12:00:00Z')

    def test_future_price_is_preserved_with_dates_and_cannot_be_available_now(self):
        url,source=page(0,True,True);row=lidl.parse_product(url,source,'2026-10-10T12:00:00Z')
        self.assertEqual(row['price'],1.25);self.assertFalse(row['available']);self.assertTrue(row['validFrom'].startswith('2100'))

    def test_member_offer_never_becomes_public_price(self):
        url,source=page(0);source=source.replace('"price": 1.25','"validForMemberTier":"Lidl Plus","price":1.25')
        self.assertIsNone(lidl.parse_product(url,source,'2026-10-10T12:00:00Z')['price'])

    def test_full_refresh_and_failed_page_leave_healthy_files_untouched(self):
        pages=dict(page(i) for i in range(120));urls=sorted(pages)
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls,[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})):
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json'
            status=lidl.refresh(product,meta,pages.__getitem__);self.assertEqual(status['products_saved'],120)
            before=product.read_bytes(),meta.read_bytes();self.assertEqual(status['products_file_sha256'],hashlib.sha256(before[0]).hexdigest())
            del pages[urls[0]]
            with self.assertRaises(lidl.LidlRefreshError): lidl.refresh(product,meta,pages.__getitem__)
            self.assertEqual((product.read_bytes(),meta.read_bytes()),before)

    def test_shrink_price_loss_and_missing_products_are_rejected(self):
        records=[lidl.parse_product(*page(i),'2026-10-10T12:00:00Z') for i in range(120)]
        with self.assertRaises(lidl.LidlRefreshError): lidl.validate(records[:-1],[p['url'] for p in records])
        with self.assertRaises(lidl.LidlRefreshError): lidl.validate(records[:100],[p['url'] for p in records[:100]],records)
        with self.assertRaises(lidl.LidlRefreshError): lidl.validate([{**p,'price':None} for p in records],[p['url'] for p in records],records)
        self.assertEqual(lidl.pack('4 x 125g'),(500,'g'));self.assertEqual(lidl.pack('20cl'),(200,'ml'));self.assertEqual(lidl.pack('each'),(1,'pieces'))

    def test_explicit_regular_price_is_added_without_member_discount(self):
        member={'price':{'price':.79,'packaging':{'text':'Regular price £0.99'}}}
        url,source=page(0,False,item_extra={'price':{'currencyCode':'GBP'},'lidlPlus':[member]})
        row=lidl.parse_product(url,source,'2026-10-10T12:00:00Z')
        self.assertEqual(row['price'],.99);self.assertNotEqual(row['price'],.79)
        self.assertEqual(row['priceBasis'],'labelled_regular_price');self.assertEqual(row['priceEvidence'],'Regular price £0.99')
        self.assertEqual(row['priceSourceUrl'],url);self.assertEqual(row['priceCheckedAt'],row['checkedAt'])
        self.assertTrue(row['memberOffersAvailable'])
        # An already explicit public offer remains the primary source.
        self.assertEqual(lidl.parse_product(*page(0,True,item_extra={'price':{'currencyCode':'GBP'},'lidlPlus':[member]}),'2026-10-10T12:00:00Z')['price'],1.25)

    def test_member_unit_from_old_or_conflicting_prices_are_never_inferred(self):
        for label in ('Regular price £0.99/kg','From £0.99','Regular price 0.99','SAVE £0.99','Regular price £0.99, £1.29','Regular price £nan'):
            with self.subTest(label=label):
                row=lidl.parse_product(*page(0,False,item_extra={'price':{'currencyCode':'GBP'},'lidlPlus':[{'price':{'price':.79,'oldPrice':.99,'packaging':{'text':label}}}]}),'2026-10-10T12:00:00Z')
                self.assertIsNone(row['price'])
        self.assertEqual(lidl.regular_price({'price':{'currencyCode':'EUR'},'lidlPlus':[{'price':{'packaging':{'text':'Regular price £0.99'}}}]}),(None,None))
        self.assertEqual(lidl.regular_price({'price':{'currencyCode':'GBP'},'lidlPlus':[{'price':{'packaging':{'text':'Regular price £0.99'}}},{'price':{'packaging':{'text':'Regular price £1.29'}}}]}),(None,None))

    def test_regular_price_keeps_future_and_textual_regional_restrictions(self):
        extra={'price':{'currencyCode':'GBP'},'lidlPlus':[{'price':{'packaging':{'text':'Regular price £0.99'}}}]}
        future=lidl.parse_product(*page(0,False,True,item_extra=extra),'2026-10-10T12:00:00Z')
        self.assertEqual(future['price'],.99);self.assertFalse(future['available'])
        for description in ('ONLY AVAILABLE IN SCOTLAND','Available in England only','Only in England and Wales','Not available in Scotland'):
            extra['keyfacts']={'fullTitle':'Product','supplementalDescription':description}
            self.assertTrue(lidl.parse_product(*page(0,False,item_extra=extra),'2026-10-10T12:00:00Z')['regionRestricted'])
        self.assertFalse(lidl.restricted_region({}, {'supplementalDescription':'Scottish milk 4pint'}))

    def test_pack_choices_and_weight_ranges_are_not_fixed_packs(self):
        for value in ('70/85g','175g, 125g','1.2kg - 1.6kg','1.2kg–1.6kg','0,5l','per bunch','Loose'):
            self.assertEqual(lidl.pack(value),(None,None),value)
        self.assertEqual(lidl.pack('4pint'),(2273.045,'ml'))
        self.assertEqual(lidl.pack('6 x 110g'),(660,'g'))
        self.assertEqual(lidl.pack('6 Pack'),(6,'pieces'))

    def test_search_additions_are_saved_and_previous_identities_are_retained(self):
        pages=dict(page(i) for i in range(121));base=sorted(pages)[:-1];extra=sorted(pages)[-1]
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(base,[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})) as supplement:
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json'
            lidl.refresh(product,meta,pages.__getitem__)
            supplement.return_value=({extra},{'search_ids_sha256':'same'})
            expanded=lidl.refresh(product,meta,pages.__getitem__)
            self.assertEqual(expanded['products_saved'],121);self.assertEqual(expanded['products_expected'],121)
            self.assertEqual(expanded['additional_search_products'],1);self.assertEqual(expanded['new_products_added'],1)
            supplement.return_value=(set(),{'search_ids_sha256':'updated'})
            retained=lidl.refresh(product,meta,pages.__getitem__)
            self.assertEqual(retained['products_saved'],121);self.assertEqual(retained['retained_not_listed'],1)
            row=next(p for p in json.loads(product.read_text(encoding='utf-8')) if p['url']==extra)
            self.assertEqual(row['discoveryStatus'],'not_listed');self.assertFalse(row['available']);self.assertIsNone(row['price'])
            self.assertEqual(row['lastPublishedPrice']['price'],1.25)

    def test_failed_or_changing_search_preserves_healthy_snapshot(self):
        pages=dict(page(i) for i in range(120));urls=sorted(pages)
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls,[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})) as supplement:
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json'
            lidl.refresh(product,meta,pages.__getitem__);before=product.read_bytes(),meta.read_bytes()
            supplement.side_effect=RuntimeError('Search failed')
            with self.assertRaises(RuntimeError): lidl.refresh(product,meta,pages.__getitem__)
            self.assertEqual((product.read_bytes(),meta.read_bytes()),before)
            supplement.side_effect=[(set(),{'search_ids_sha256':'before'}),(set(),{'search_ids_sha256':'after'})]
            with self.assertRaises(lidl.LidlRefreshError): lidl.refresh(product,meta,pages.__getitem__)
            self.assertEqual((product.read_bytes(),meta.read_bytes()),before)

    def test_previous_snapshot_hash_is_checked_before_any_new_publication(self):
        pages=dict(page(i) for i in range(120));urls=sorted(pages)
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls,[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})):
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json'
            lidl.refresh(product,meta,pages.__getitem__)
            product.write_text(product.read_text(encoding='utf-8')+' ',encoding='utf-8')
            before=product.read_bytes(),meta.read_bytes()
            with self.assertRaisesRegex(lidl.LidlRefreshError,'integrity'): lidl.refresh(product,meta,pages.__getitem__)
            self.assertEqual((product.read_bytes(),meta.read_bytes()),before)

    def test_only_official_product_404_and_410_are_removal_evidence(self):
        url,_=page(0)
        for status in (404,410,403,429,500):
            response=lidl.requests.Response();response.status_code=status;response.url=url;response._content=b''
            with patch.object(lidl,'session') as session:
                session.return_value.get.return_value=response
                with self.assertRaises(lidl.ProductUnavailable if status in (404,410) else lidl.requests.HTTPError): lidl.fetch(url)
        response=lidl.requests.Response();response.status_code=404;response.url=lidl.SITEMAP
        with patch.object(lidl,'session') as session:
            session.return_value.get.return_value=response
            with self.assertRaises(lidl.requests.HTTPError): lidl.fetch(lidl.SITEMAP)
        response.url='https://other.example/p/item/p10000000'
        with patch.object(lidl,'session') as session:
            session.return_value.get.return_value=response
            with self.assertRaisesRegex(lidl.LidlRefreshError,'redirected'): lidl.fetch(url)

    def test_confirmed_removed_pages_allow_verified_additions_without_old_prices(self):
        from collections import Counter
        pages=dict(page(i) for i in range(121));urls=sorted(pages);calls=Counter();removed=set(urls[:10])
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls[:-1],[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})) as supplement:
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json'
            lidl.refresh(product,meta,pages.__getitem__)
            supplement.return_value=({urls[-1]}, {'search_ids_sha256':'stable'})
            def get(url):
                calls[url]+=1
                if url in removed: raise lidl.ProductUnavailable(url,404)
                return pages[url]
            status=lidl.refresh(product,meta,get);records=json.loads(product.read_text())
            self.assertEqual(status['new_products_added'],1);self.assertEqual(status['products_saved'],121)
            self.assertEqual(status['confirmed_unpublished_count'],10);self.assertEqual(status['current_products_published'],111)
            self.assertEqual(status['discovery_products_expected'],status['discovery_products_accounted_for'])
            self.assertEqual(status['failed_pages'],0);self.assertTrue(all(calls[url]==2 for url in removed))
            for row in records:
                if row['url'] in removed:
                    self.assertIsNone(row['price']);self.assertFalse(row['available']);self.assertEqual(row['priceMissingReason'],'product_page_removed');self.assertEqual(row['lastPublishedPrice']['price'],1.25)
            self.assertEqual(status['products_file_sha256'],hashlib.sha256(product.read_bytes()).hexdigest())

    def test_recovered_missing_page_is_published_and_uncertain_recheck_keeps_snapshot(self):
        from collections import Counter
        pages=dict(page(i) for i in range(120));urls=sorted(pages)
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls,[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})):
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json';lidl.refresh(product,meta,pages.__getitem__)
            calls=Counter()
            def recovered(url):
                calls[url]+=1
                if url==urls[0] and calls[url]==1: raise lidl.ProductUnavailable(url,410)
                return pages[url]
            status=lidl.refresh(product,meta,recovered);self.assertEqual(status['confirmed_unpublished_count'],0);self.assertEqual(status['current_products_published'],120)
            before=product.read_bytes(),meta.read_bytes();calls.clear()
            def uncertain(url):
                calls[url]+=1
                if url==urls[0]:
                    if calls[url]==1: raise lidl.ProductUnavailable(url,404)
                    raise OSError('connection lost during confirmation')
                return pages[url]
            with self.assertRaisesRegex(lidl.LidlRefreshError,'confirm'): lidl.refresh(product,meta,uncertain)
            self.assertEqual((product.read_bytes(),meta.read_bytes()),before)

    def test_widespread_missing_pages_cannot_replace_the_healthy_snapshot(self):
        pages=dict(page(i) for i in range(160));urls=sorted(pages)
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls,[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})):
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json';lidl.refresh(product,meta,pages.__getitem__);before=product.read_bytes(),meta.read_bytes()
            def missing(url):
                if url in urls[:40]: raise lidl.ProductUnavailable(url,404)
                return pages[url]
            with self.assertRaisesRegex(lidl.LidlRefreshError,'20%'): lidl.refresh(product,meta,missing)
            self.assertEqual((product.read_bytes(),meta.read_bytes()),before)

    def test_search_canonical_rename_fetches_one_identity_and_rejects_other_ids(self):
        pages=dict(page(i) for i in range(120));urls=sorted(pages);old=urls[0];renamed=old.replace('/p/product-','/p/renamed-')
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls,[lidl.SITEMAP])), patch.object(lidl,'discover_supplement',return_value=(set(),{})) as supplement:
            product=Path(directory)/'products.json';meta=Path(directory)/'meta.json';lidl.refresh(product,meta,pages.__getitem__)
            pages[renamed]=pages.pop(old).replace(old,renamed)
            supplement.return_value=({renamed},{'search_ids_sha256':'same-id'})
            status=lidl.refresh(product,meta,pages.__getitem__)
            self.assertEqual(status['products_saved'],120);self.assertEqual(status['new_products_added'],0)
            row=next(row for row in json.loads(product.read_text()) if row['id']==lidl.product_id(old));self.assertEqual(row['url'],renamed)
            self.assertEqual(row['discoverySources'],['official_sitemap','official_search'])
        self.assertEqual(lidl.parse_product(old,pages[renamed],'2026-10-15T12:00:00Z')['url'],renamed)
        with self.assertRaises(lidl.LidlRefreshError): lidl.parse_product(old,pages[renamed].replace(renamed,'https://other.example/p/renamed/p10000000'),'2026-10-15T12:00:00Z')

if __name__=='__main__': unittest.main()
