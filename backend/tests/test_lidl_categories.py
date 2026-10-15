import copy
import json
import sys
import unittest
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import lidl_categories as categories

ROOT=categories.MENU_ROOT
FRUIT=categories.ORIGIN+'/h/fruit/h10071012'
PANTRY=categories.ORIGIN+'/h/pantry/h10096095'
APPLES=categories.ORIGIN+'/h/apples/h10095592'
BEANS=categories.ORIGIN+'/h/beans/h10095593'


def nuxt(document):
    table=[]
    def add(value):
        index=len(table);table.append(None)
        if isinstance(value,dict):table[index]={k:add(v) for k,v in value.items()}
        elif isinstance(value,list):table[index]=[add(v) for v in value]
        else:table[index]=value
        return index
    add(document)
    return '<script type="application/json" id="__NUXT_DATA__">'+json.dumps(table)+'</script>'


def product(code):
    code=str(code);path=f'/p/product-{code}/p{code}'
    return {'code':code,'gridBox':{'country':'GB','gridBoxData':{'erpNumber':code,'canonicalPath':path,'canonicalUrl':path,'fullTitle':'Product '+code,'keyfacts':{'supplementalDescription':'500g'},'price':{'currencyCode':'GBP','price':1.25},'lidlPlus':[]}}}


class Fixture:
    def __init__(self,change=None,hidden=()):
        self.change=change;self.calls=Counter();self.hidden=set(hidden)
        self.rows={ROOT:[1,2,3,4,5,6],FRUIT:[1,2,3,4],PANTRY:[5,6],APPLES:[1,2],BEANS:[5,6]}
        self.children={ROOT:[],FRUIT:[(APPLES,'Apples')],PANTRY:[(BEANS,'Beans')],APPLES:[],BEANS:[]}
    def get(self,url):
        split=urlsplit(url);base=split.scheme+'://'+split.netloc+split.path;offset=int(parse_qs(split.query).get('offset',['0'])[0]);self.calls[url]+=1
        if split.path=='/q/api/gridboxes/GB/en':
            return json.dumps([None if int(code) in self.hidden else {'country':'GB','data':product(code)['gridBox']['gridBoxData']} for code in parse_qs(split.query)['ids'][0].split(',')])
        if split.path=='/q/api/search' or split.path.startswith('/q/api/category/'):
            q=parse_qs(split.query)
            base=ROOT if split.path=='/q/api/search' else categories.ORIGIN+split.path.removeprefix('/q/api/category')
            if base==ROOT:assert q['category.id']==['10068374']
            self.calls[base+'?offset='+str(offset)]+=1
            rows=[product(code) for code in self.rows[base][offset:offset+2] if code not in self.hidden or q.get('idsOnly')==['true']]
            return json.dumps({'assortment':'GB','locale':'en_GB','numFound':len(self.rows[base]),'fetchsize':2,'offset':offset,'items':[{'code':p['code'],'gridbox':{'country':p['gridBox']['country'],'data':p['gridBox']['gridBoxData']}} for p in rows]})
        ids=self.rows[base];identity=split.path.rsplit('/',1)[-1][1:];size=2
        globals_={'wonCategory':'10068374'} if base==ROOT else {'categoryId':identity,'breadcrumbPageId':'10068374/'+identity}
        children=[{'label':name,'link':{'categoryPath':urlsplit(child).path,'pageId':'10068374/'+identity+'/'+child.rsplit('/',1)[-1][1:]},'children':[]} for child,name in self.children[base]]
        batches={str(i):[{'gridBox':{'gridBoxData':None}}]*size for i in range(offset//size)}
        batches[str(offset//size)]=[product(code) for code in ids[offset:offset+size] if code not in self.hidden]
        document={'pinia':{'useLocaleStore':{'locale':'en_GB'},'useGlobalStore':globals_,'useRouteStore':{'routePath':split.path,'routeQuery':{'offset':str(offset)}},'useProductStore':{'numFound':len(ids),'products':batches},'useFacetStore':{'rawFacets':[{'code':'category','values':[{'children':children}]}]},'useStorefrontConfigurationStore':{'config':{'fetchSize':size}}}}
        if self.change:self.change(document,base,offset,self.calls[url])
        menu='<ol class="n-header__main-navigation--sub"><li><a href="'+ROOT+'">Food &amp; Drink</a></li><li><a href="'+FRUIT+'">Fruit &amp; veg</a></li><li><a href="'+PANTRY+'">Food Cupboard</a></li></ol>'
        return menu+nuxt(document)


class CategoryTests(unittest.TestCase):
    def test_complete_menu_descendants_pagination_and_placeholder_batches(self):
        source=Fixture();urls,meta=categories.discover_categories(source.get)
        self.assertEqual(urls,{f'https://www.lidl.co.uk/p/product-{i}/p{i}' for i in range(1,7)})
        self.assertEqual(meta['menu_status'],'complete');self.assertEqual(meta['menu_categories_checked'],5)
        self.assertEqual(meta['menu_pages_checked'],8);self.assertEqual(meta['menu_products_identified'],6)
        self.assertEqual(len(meta['menu_departments']),2);self.assertEqual(meta['menu_departments'][0]['name'],'Fruit & veg')
        self.assertEqual(source.calls[ROOT+'?offset=4'],1);self.assertEqual(source.calls[APPLES],2)
        self.assertEqual(next(p for p in meta['menu_products'] if p['id']=='1')['categoryIds'],['10068374','10071012','10095592'])
        self.assertEqual(len(meta['menu_content_sha256']),64)
    def test_missing_cards_require_complete_ids_and_repeated_explicit_publication_checks(self):
        source=Fixture(hidden={2});urls,meta=categories.discover_categories(source.get)
        self.assertEqual(meta['menu_products_identified'],6);self.assertEqual(meta['menu_products_published'],5)
        self.assertEqual(meta['menu_unpublished_ids'],['2']);self.assertEqual(len(urls),5)
        self.assertTrue(all(not url.endswith('/p2') for url in urls))
        self.assertTrue(all(row['productsChecked']==row['productsExpected'] for row in meta['menu_categories']))
        self.assertTrue(any(row['productsPublished']<row['productsExpected'] for row in meta['menu_categories']))
        grid=categories.ORIGIN+'/q/api/gridboxes/GB/en?ids=2';self.assertGreaterEqual(source.calls[grid],2)
        get=source.get
        def broken(url):return '[]' if '/q/api/gridboxes/' in url else get(url)
        with self.assertRaises(categories.CategoryError):categories.discover_categories(broken)

    def test_invalid_or_changing_pages_are_not_silently_skipped(self):
        def mutate(field):
            def change(d,base,offset,call):
                p=d['pinia']
                if field=='locale':p['useLocaleStore']['locale']='en_NI'
                elif field=='country':p['useProductStore']['products'][str(offset//2)][0]['gridBox']['country']='IE'
                elif field=='identity':p['useProductStore']['products'][str(offset//2)][0]['code']='999'
                elif field=='short':p['useProductStore']['products'][str(offset//2)].pop()
                elif field=='offset':p['useRouteStore']['routeQuery']['offset']='99'
                elif field=='duplicate':p['useProductStore']['products'][str(offset//2)]=[product(1),product(1)]
                elif field=='count' and base==FRUIT and call==2:p['useProductStore']['numFound']+=1
                elif field=='price' and call==2:p['useProductStore']['products'][str(offset//2)][0]['gridBox']['gridBoxData']['price']['price']=99
                elif field=='foreign':p['useProductStore']['products'][str(offset//2)][0]['gridBox']['gridBoxData']['canonicalPath']='https://evil.test/p/product-1/p1'
            return change
        for field in ['locale','country','identity','short','offset','duplicate','count','price','foreign']:
            with self.subTest(field=field), self.assertRaises(categories.CategoryError):categories.discover_categories(Fixture(mutate(field)).get)
    def test_member_price_and_struck_prices_do_not_become_public_pack_prices(self):
        row=product(1);data=row['gridBox']['gridBoxData'];data['price']={'currencyCode':'GBP','oldPrice':9.99}
        data['lidlPlus']=[{'lidlPlusText':'With Lidl Plus','price':{'price':.89,'packaging':{'text':'Regular price £1.29'}}}]
        result=categories.card_product(row,ROOT)
        self.assertEqual(result['publicPriceGBP'],1.29);self.assertEqual(result['memberOffers'][0]['priceGBP'],.89)
        data['lidlPlus'][0]['price']['packaging']['text']='Save 30%'
        self.assertEqual(categories.card_product(row,ROOT)['publicPriceGBP'],None)
        data['price'].update({'price':1.25,'discount':{'showFrom':True}})
        self.assertIsNone(categories.card_product(row,ROOT)['publicPriceGBP'])
        data['price']={'currencyCode':'EUR','price':.89};self.assertIsNone(categories.card_product(row,ROOT)['publicPriceGBP'])
    def test_invalid_menu_sources_and_external_descendants_are_rejected(self):
        source=Fixture().get(ROOT)
        for old,new in [(FRUIT,'https://www.lidl.co.uk.evil.test/h/fruit/h1'),(FRUIT,FRUIT+'?price=0'),(FRUIT,ROOT)]:
            with self.assertRaises(categories.CategoryError):categories.parse_menu(source.replace(old,new))
        with self.assertRaises(categories.CategoryError):categories.parse_menu('<h1>Access denied</h1>')
        def change(d,base,offset,call):
            if base==FRUIT:d['pinia']['useFacetStore']['rawFacets'][0]['values'][0]['children'][0]['link']['categoryPath']='https://evil.test/h/stuff/h100'
        with self.assertRaises(categories.CategoryError):categories.discover_categories(Fixture(change).get)
    def test_ambiguous_packs_remain_without_purchase_capacity_and_region_restrictions_survive(self):
        row=product(1);data=row['gridBox']['gridBoxData'];data['keyfacts']['supplementalDescription']='70/85g';data['regions']=[1,2]
        result=categories.card_product(row,ROOT)
        self.assertIsNone(result['packQuantity']);self.assertTrue(result['regionRestricted'])


if __name__=='__main__':unittest.main()
