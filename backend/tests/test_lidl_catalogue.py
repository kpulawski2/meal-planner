import hashlib, json, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import lidl_catalogue as lidl

def page(index, priced=True, future=False):
    url=f'https://www.lidl.co.uk/p/milk/p{10000000+index}'
    offer={'priceCurrency':'GBP','availability':'InStoreOnly'}
    if priced: offer['price']=1.25
    item={'erpNumber':str(10000000+index),'canonicalUrl':url,'keyfacts':{'fullTitle':'Milbona Milk','supplementalDescription':'1L'},'category':'Food','wonCategoryBreadcrumbs':[[{'name':'Food & Drink'},{'name':'Milk & Cream'}]],'stockAvailability':{'badgeInfoV2':[{'validFrom':4102444800,'validUntil':4102531200}]} if future else {}}
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
        with tempfile.TemporaryDirectory() as directory, patch.object(lidl,'discover',return_value=(urls,[lidl.SITEMAP])):
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

if __name__=='__main__': unittest.main()
