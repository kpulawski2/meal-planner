"""Every product published in Lidl GB's official recursive sitemap.

Website coverage is measurable. Store inventory coverage is not: Lidl deliberately
publishes 'See in store for price' on many pages. Those prices remain null.
"""
from __future__ import annotations
import gzip, hashlib, html, json, logging, math, os, re, tempfile, threading, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from xml.etree import ElementTree as ET
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from lidl_discovery import discover_supplement, confirm_unpublished
from lidl_categories import discover_categories, member_offers

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.lidl.co.uk'
SITEMAP = ORIGIN + '/static/sitemap.xml'
PRODUCT = re.compile(r'^https://www\.lidl\.co\.uk/p/[^?#]+/p\d+$')
LOG = logging.getLogger(__name__)
LOCAL = threading.local()

class LidlRefreshError(RuntimeError):
    pass

class ProductUnavailable(LidlRefreshError):
    """An official product page explicitly returned 404 or 410."""
    def __init__(self, url, status):
        super().__init__(f'Lidl product page returned HTTP {status}: {url}')
        self.url, self.status = url, status

class ProductDataUnavailable(LidlRefreshError):
    """No product entity in either of the official page's data sources."""
    pass

def product_id(url):
    if not isinstance(url, str) or not PRODUCT.fullmatch(url):
        raise LidlRefreshError('Invalid official Lidl product URL.')
    return url.rsplit('/p', 1)[-1]

def session():
    if not hasattr(LOCAL, 'session'):
        retry = Retry(total=4, backoff_factor=.7, status_forcelist=(429,500,502,503,504), allowed_methods={'GET'}, respect_retry_after_header=True)
        s = requests.Session()
        s.mount('https://', HTTPAdapter(max_retries=retry))
        s.headers.update({'User-Agent':'MealPlannerCatalogue/6.0 (+https://github.com/kpulawski2/meal-planner)', 'Accept':'text/html,application/xml,*/*'})
        LOCAL.session = s
    return LOCAL.session

def fetch(url):
    if urlsplit(url).hostname != 'www.lidl.co.uk' or urlsplit(url).scheme != 'https':
        raise LidlRefreshError('A sitemap linked outside Lidl GB.')
    response = session().get(url, timeout=(10,40))
    if urlsplit(response.url).hostname != 'www.lidl.co.uk' or urlsplit(response.url).scheme != 'https':
        raise LidlRefreshError('Lidl redirected outside the official GB site.')
    if response.status_code in (404, 410) and PRODUCT.fullmatch(url):
        raise ProductUnavailable(url, response.status_code)
    response.raise_for_status()
    body = response.content
    if body[:2] == b'\x1f\x8b': body = gzip.decompress(body)
    if len(body) > 20_000_000: raise LidlRefreshError('Lidl response exceeds the safety size bound.')
    return body.decode('utf-8')

def discover(get=fetch):
    """Follow sitemap indexes, including gzip, by XML root type rather than suffix."""
    robots = get(ORIGIN + '/robots.txt')
    roots = re.findall(r'^Sitemap:\s*(\S+)', robots, re.M | re.I)
    if SITEMAP not in roots: raise LidlRefreshError('Official Lidl sitemap is missing from robots.txt.')
    queue, visited, products = list(roots), set(), set()
    while queue:
        url = queue.pop(0)
        if url in visited: continue
        visited.add(url)
        document = ET.fromstring(get(url))
        kind = document.tag.rsplit('}',1)[-1]
        locs = [node.text.strip() for node in document.iter() if node.tag.rsplit('}',1)[-1] == 'loc' and node.text]
        if not locs: raise LidlRefreshError(f'Empty official sitemap: {url}')
        if kind == 'sitemapindex': queue.extend(locs)
        elif kind == 'urlset': products.update(url for url in locs if PRODUCT.fullmatch(url))
        else: raise LidlRefreshError('Unexpected sitemap format.')
        if len(visited) > 10000: raise LidlRefreshError('Sitemap graph exceeds safety bound; no truncated publication.')
    if not products: raise LidlRefreshError('No Lidl product URLs were discovered.')
    return sorted(products), sorted(visited)

def decode_nuxt(table):
    """Decode Nuxt's public devalue table, never evaluate executable page scripts."""
    seen = {}
    def get(i):
        if not isinstance(i,int): raise LidlRefreshError('Invalid public product table reference.')
        if i < 0: return None
        if i >= len(table): raise LidlRefreshError('Invalid public product table index.')
        if i in seen: return seen[i]
        v = table[i]
        if isinstance(v,dict):
            seen[i] = {}
            seen[i].update({k:get(n) for k,n in v.items()})
        elif isinstance(v,list):
            if v and isinstance(v[0],str):
                if v[0] not in ('Reactive','ShallowReactive','Ref','ShallowRef','EmptyRef','EmptyShallowRef','Date','Set','Map','null'):
                    raise LidlRefreshError('Unsupported public table type: '+v[0])
                seen[i] = get(v[1]) if len(v)>1 else None
            else:
                seen[i] = []
                seen[i].extend(get(n) for n in v)
        else: seen[i]=v
        return seen[i]
    return get(0)

def text(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', ' ', str(value or '')))).strip()

def pack(value):
    value = text(value)
    # A range or choice of sizes is not a fixed purchasable pack. Do not choose
    # one number from "70/85g", "175g, 125g", or "1.2kg - 1.6kg".
    if re.search(r'\d\s*(?:kg|g|ml|cl|l)?\s*[/,–-]\s*\d', value, re.I): return None,None
    multi = re.search(r'\b(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b',value,re.I)
    single = re.search(r'\b(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l|pints?|pieces?|each|pack)\b',value,re.I)
    if multi: qty, unit = int(multi[1])*float(multi[2]), multi[3].lower()
    elif single: qty, unit = float(single[1]), single[2].lower()
    elif re.fullmatch(r'(?:per\s+)?(?:each|piece)',value,re.I): qty,unit=1,'pieces'
    else: return None,None
    if unit == 'cl': qty,unit=qty*10,'ml'
    if unit in ('pint','pints'): qty,unit=qty*568.26125,'ml'
    if unit in ('piece','each','pack'): unit='pieces'
    return (qty,unit) if qty>0 else (None,None)

def positive(value):
    try: number=float(value)
    except (TypeError, ValueError): return None
    return number if math.isfinite(number) and number>0 else None

def regular_price(item):
    """Read only the explicit public regular-price label next to a member offer.

    The numeric Lidl Plus price, oldPrice and unit-price text are never promoted
    into the public catalogue price. Conflicting regular labels stay unpriced.
    """
    labels={}
    for member in item.get('lidlPlus') or []:
        info=member.get('price') or {}
        if info.get('currencyCode',(item.get('price') or {}).get('currencyCode'))!='GBP': continue
        label=text((info.get('packaging') or {}).get('text'))
        match=re.fullmatch(r'Regular price\s+£\s*(\d+(?:\.\d{1,2})?)',label,re.I)
        price=positive(match[1]) if match else None
        if price is not None: labels[price]=label
    return next(iter(labels.items())) if len(labels)==1 else (None,None)

def restricted_region(item, facts):
    if item.get('regionsPrices') or item.get('regions'): return True
    wording=' '.join(text(facts.get(k)) for k in ('supplementalDescription','description'))
    country=r'(?:Scotland|England|Wales|Northern Ireland)'
    area=country+r'(?:\s*(?:and|&)\s*'+country+r'){0,2}'
    return bool(re.search(r'(?:only\s+(?:available\s+)?in\s+'+area+r'|(?:available\s+)?in\s+'+area+r'\s+only|not\s+available\s+in\s+'+area+r')',wording,re.I))

def parse_product(url, source, checked):
    scripts = re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',source,re.S|re.I)
    entities=[]
    for script in scripts:
        doc=json.loads(script)
        entities.extend(doc if isinstance(doc,list) else doc.get('@graph',[doc]))
    product=next((x for x in entities if x.get('@type') == 'Product'),None)
    match=re.search(r'<script\b[^>]*id=["\']__NUXT_DATA__["\'][^>]*>(.*?)</script>',source,re.S|re.I)
    if not product and not match: raise ProductDataUnavailable('No published product data on '+url)
    if not match: raise LidlRefreshError('No validated Lidl product table on '+url)
    data=decode_nuxt(json.loads(match[1]))
    item=next((row for row in data.get('data',{}).values() if isinstance(row,dict) and 'erpNumber' in row),None)
    if not product and not item: raise ProductDataUnavailable('No published product data on '+url)
    if not product or not item: raise LidlRefreshError('Incomplete Lidl product data on '+url)
    if not item or str(item['erpNumber']) != url.rsplit('/p',1)[-1] or str(product.get('sku')) != str(item['erpNumber']):
        raise LidlRefreshError('Product identity mismatch: '+url)
    canonical = urljoin(ORIGIN,item.get('canonicalUrl',''))
    if product_id(canonical) != product_id(url): raise LidlRefreshError('Unexpected canonical product URL: '+url)
    url = canonical
    facts=item.get('keyfacts',{})
    name=text(facts.get('fullTitle') or product.get('name'))
    if not name: raise LidlRefreshError('Missing product name: '+url)
    breadcrumbs=item.get('wonCategoryBreadcrumbs') or []
    categories=[text(row.get('name')) for row in (breadcrumbs[0] if breadcrumbs else []) if row.get('name')]
    if not categories: categories=[text(item.get('category'))] if item.get('category') else []
    offers=product.get('offers') or []
    if isinstance(offers,dict): offers=[offers]
    # Only an explicit public GBP Offer price is usable; no gallery/body price
    # regex, Lidl Plus offers, struck-through price, percentage or unit-price guess.
    public=[offer for offer in offers if offer.get('priceCurrency')=='GBP' and positive(offer.get('price')) and not offer.get('validForMemberTier')]
    offer=public[0] if public else {}
    price=positive(offer.get('price'))
    evidence=None
    if price is None: price,evidence=regular_price(item)
    price_info=item.get('price') or {}
    stock=item.get('stockAvailability') or {}
    windows=stock.get('badgeInfoV2') or []
    dated=next((window for window in windows if window.get('validFrom') or window.get('validUntil')), {})
    def iso(value):
        return datetime.fromtimestamp(value,timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z') if isinstance(value,(int,float)) else value
    valid_from=iso(offer.get('validFrom') or price_info.get('validFrom') or dated.get('validFrom') or item.get('storeFacts',{}).get('storeStartDate'))
    valid_until=iso(offer.get('validThrough') or offer.get('priceValidUntil') or price_info.get('validUntil') or dated.get('validUntil'))
    def boundary(value, end=False):
        if not value: return None
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}',value): value+= 'T23:59:59Z' if end else 'T00:00:00Z'
        return datetime.fromisoformat(value.replace('Z','+00:00'))
    now=datetime.fromisoformat(checked.replace('Z','+00:00'))
    active=(not valid_from or boundary(valid_from)<=now) and (not valid_until or boundary(valid_until,True)>=now)
    pack_size=text(facts.get('supplementalDescription')) or None
    qty,unit=pack(pack_size)
    badge= ' '.join(text(row.get('text')) for row in (item.get('stockAvailability',{}).get('badgeInfo',{}).get('badges') or []))
    explicit_unavailable=all(re.search('OutOfStock|SoldOut|Discontinued',str(row.get('availability','')),re.I) for row in offers) if offers else False
    available=False if item.get('preventSelling') or not active or explicit_unavailable or re.search(r'sold out|out of stock',badge,re.I) else None
    # InStoreOnly denotes a sales channel, never verified local stock.
    availability='unavailable' if available is False else 'in_store_only'
    brand=(product.get('brand') or {}).get('name') if isinstance(product.get('brand'),dict) else product.get('brand')
    nutrition=product.get('nutrition') or None
    gtins=item.get('eans') or []
    gtin=product.get('gtin13') or product.get('gtin') or (gtins[0] if gtins else None)
    images=product.get('image') or []
    if isinstance(images,str): images=[images]
    return {'id':str(item['erpNumber']),'sku':str(item['erpNumber']),'gtin':gtin,'storeSku':item.get('storeStockId'),
        'name':name,'url':url,'store':'Lidl','price':price,'currency':'GBP','priceRegion':'GB',
        'packSize':pack_size,'packQuantity':qty,'packUnit':unit,'brand':brand,'category':' > '.join(categories),
        'categoryPath':categories,'availability':availability,'available':available,'image':images[0] if images else None,
        'nutrition':nutrition,'nutritionClaims':[],'checkedAt':checked,'source':'Lidl GB official product page',
        'validFrom':valid_from,'validThrough':valid_until,'priceMissingReason':None if price else 'not_published',
        'offer':{'validFrom':valid_from,'validThrough':valid_until} if valid_from or valid_until else None,
        'memberOffersAvailable':bool(item.get('lidlPlus')),'memberOffers':[{**row,'validFrom':valid_from,'validThrough':valid_until} for row in member_offers(item)],'regions':item.get('regions') or [],
        'regionRestricted':restricted_region(item,facts),
        'priceSource':'Lidl GB official product page' if price is not None else None,
        'priceSourceUrl':url if price is not None else None,'priceCheckedAt':checked if price is not None else None,
        'priceBasis':('labelled_regular_price' if evidence else 'public_offer') if price is not None else None,
        'priceEvidence':evidence,
        'description':text(facts.get('description'))}

def validate(records, expected, previous=None):
    if len(records)<100: raise LidlRefreshError('Too few Lidl website products; no partial snapshot was published.')
    expected_ids = {product_id(url) for url in expected}
    if len(records)!=len(expected_ids) or {p['id'] for p in records}!=expected_ids: raise LidlRefreshError('Incomplete Lidl scrape; previous catalogue kept.')
    if len({p['id'] for p in records})!=len(records): raise LidlRefreshError('Duplicate Lidl product IDs.')
    for p in records:
        if not PRODUCT.fullmatch(p.get('url','')) or product_id(p['url'])!=p.get('id') or not p.get('name') or p.get('currency')!='GBP': raise LidlRefreshError('Invalid Lidl product.')
        if p.get('price') is not None and positive(p['price']) is None: raise LidlRefreshError('Invalid Lidl price.')
    if previous and len(records)<len(previous)*.95: raise LidlRefreshError('Lidl website catalogue shrank by more than 5%; previous snapshot kept.')
    if previous:
        before=sum(p.get('price') is not None for p in previous)
        after=sum(p.get('price') is not None for p in records)
        if before>=20 and after<before*.8: raise LidlRefreshError('Lidl priced coverage dropped by more than 20%; previous snapshot kept.')

def atomic(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,name=tempfile.mkstemp(dir=path.parent,suffix='.tmp')
    try:
        with os.fdopen(fd,'w',encoding='utf-8',newline='\n') as f:
            json.dump(data,f,ensure_ascii=False,indent=2,allow_nan=False); f.write('\n'); f.flush(); os.fsync(f.fileno())
        os.replace(name,path)
    finally:
        if os.path.exists(name): os.unlink(name)

def previous_snapshot(products_path, metadata_path):
    """Only a matching, validated generation can be used as an additive base."""
    if not products_path.exists() and not metadata_path.exists(): return []
    if not products_path.exists() or not metadata_path.exists(): raise LidlRefreshError('Previous Lidl catalogue generation is incomplete; files kept.')
    raw=products_path.read_text(encoding='utf-8').replace('\r\n','\n')
    meta=json.loads(metadata_path.read_text(encoding='utf-8'))
    previous=json.loads(raw)
    if (meta.get('status')!='complete' or not isinstance(previous,list) or
        len(previous)!=meta.get('products_saved') or len(previous)!=meta.get('products_expected') or
        hashlib.sha256(raw.encode()).hexdigest()!=meta.get('products_file_sha256')):
        raise LidlRefreshError('Previous Lidl catalogue integrity check failed; files kept.')
    validate(previous,[p['url'] for p in previous])
    return previous

def refresh(products_path=None, metadata_path=None, get=fetch):
    start=time.monotonic()
    products_path=Path(products_path or ROOT/'data/lidl-products.json')
    metadata_path=Path(metadata_path or ROOT/'data/lidl-catalogue-meta.json')
    previous=previous_snapshot(products_path,metadata_path)
    sitemap_urls,maps=discover(get)
    menu_urls,menu_meta=discover_categories(get)
    menu_products={p['id']:p for p in menu_meta.pop('menu_products',[])}
    known=set(sitemap_urls)|{p['url'] for p in previous}
    search_urls,search_meta=discover_supplement(get,known)
    # Search publishes current canonical paths; a stale sitemap can retain the
    # old slug for that same ID. Fetch each identity once, preferring search.
    by_id={product_id(url):url for url in sitemap_urls}
    by_id.update({product_id(url):url for url in sorted(menu_urls)})
    by_id.update({product_id(url):url for url in sorted(search_urls)})
    urls=sorted(by_id.values())
    sitemap_ids={product_id(url) for url in sitemap_urls}
    search_ids={product_id(url) for url in search_urls}
    menu_ids={product_id(url) for url in menu_urls}
    LOG.info('Discovered %d Lidl identities: %d sitemap URLs, %d additional search identities',len(urls),len(sitemap_urls),len(search_ids-sitemap_ids))
    checked=datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    records,failures,missing=[],[],{}
    def load(url):
        if get is fetch: time.sleep(.12)
        return parse_product(url,get(url),checked)
    with ThreadPoolExecutor(max_workers=max(1,min(6,int(os.getenv('LIDL_WORKERS','4'))))) as pool:
        futures={pool.submit(load,url):url for url in urls}
        for count,future in enumerate(as_completed(futures),1):
            try: records.append(future.result())
            except ProductUnavailable as exc: missing[futures[future]]=exc.status
            except ProductDataUnavailable: missing[futures[future]]=200
            except Exception as exc: failures.append((futures[future],str(exc)))
            if count%100==0 or count==len(urls): LOG.info('Checked %d/%d pages; failures %d',count,len(urls),len(failures))
    if failures: raise LidlRefreshError(f'{len(failures)} Lidl pages failed; previous snapshot kept. First failures: {failures[:5]}')
    # Confirm removals independently. Transport errors, access denial, invalid
    # markup and identity mismatches must still preserve the healthy snapshot.
    confirmed,needs_confirmation={},set()
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(load,url):url for url in missing}
        for future in as_completed(futures):
            url=futures[future]
            try: records.append(future.result())
            except ProductUnavailable as exc:
                confirmed[url]=exc.status
                if missing[url]==200: needs_confirmation.add(url)
            except ProductDataUnavailable:
                confirmed[url]=200;needs_confirmation.add(url)
            except Exception as exc: raise LidlRefreshError(f'Could not confirm removed product {url}; previous snapshot kept.') from exc
    if len(confirmed)>len(urls)*.2:
        raise LidlRefreshError('More than 20% of Lidl product pages are unavailable; previous snapshot kept.')
    confirmation_sources={}
    ordered=sorted(needs_confirmation)
    for offset in range(0,len(ordered),48):
        batch=ordered[offset:offset+48]
        source_url=confirm_unpublished(get,[product_id(url) for url in batch])
        confirmation_sources.update({url:source_url for url in batch})
    LOG.info('Confirmed %d removed pages; %d published product records',len(confirmed),len(records))
    final_urls,final_maps=discover(get)
    if final_urls!=sitemap_urls or final_maps!=maps: raise LidlRefreshError('Lidl sitemap changed during refresh; previous snapshot kept.')
    final_search_urls,final_search_meta=discover_supplement(get,known)
    if final_search_urls!=search_urls or final_search_meta.get('search_ids_sha256')!=search_meta.get('search_ids_sha256'):
        raise LidlRefreshError('Lidl search changed during refresh; previous snapshot kept.')
    final_menu_urls,final_menu_meta=discover_categories(get)
    if final_menu_urls!=menu_urls or final_menu_meta.get('menu_ids_sha256')!=menu_meta.get('menu_ids_sha256') or final_menu_meta.get('menu_content_sha256')!=menu_meta.get('menu_content_sha256'):
        raise LidlRefreshError('Lidl food menu changed during refresh; previous snapshot kept.')
    fresh_ids={p['id'] for p in records}
    validate(records,[url for url in urls if url not in confirmed],[p for p in previous if p['id'] in fresh_ids and p.get('discoveryStatus')!='not_listed'])
    removed_ids={product_id(url) for url in confirmed}
    previous_by_id={p['id']:p for p in previous}
    newly_priced=sum(p['price'] is not None and p['id'] in previous_by_id and previous_by_id[p['id']]['price'] is None for p in records)
    for p in records:
        p['discoveryStatus']='listed'
        p['discoverySources']=(['official_sitemap'] if p['id'] in sitemap_ids else [])+(['official_search'] if p['id'] in search_ids else [])+(['official_food_menu'] if p['id'] in menu_ids else [])
        p['menuCategoryIds']=menu_products.get(p['id'],{}).get('categoryIds',[])
    # Preserve prior identities if the publisher removes a page from discovery.
    # A retained entry cannot enter a new basket without fresh publication.
    retained=[{**p,'discoveryStatus':'not_listed','available':False,'availability':'not_listed',
        'price':None,'priceMissingReason':'product_page_removed' if p['id'] in removed_ids else 'no_longer_listed',
        'lastPublishedPrice':p.get('lastPublishedPrice') or ({'price':p['price'],'checkedAt':p.get('priceCheckedAt') or p.get('checkedAt')} if p['price'] is not None else None)}
        for p in previous if p['id'] not in fresh_ids]
    records.extend(retained)
    records.sort(key=lambda p:(p['name'].casefold(),p['id']))
    meta={'schema_version':2,'store':'Lidl','status':'complete','coverage':1,'coverage_scope':'official_sitemap_and_search_products',
        'entire_store_inventory':False,'source':'Lidl GB official recursive sitemap, public search, Food & Drink menu and product pages','source_url':SITEMAP,
        'products_expected':len(records),'products_saved':len(records),'sitemaps':maps,'failed_pages':0,
        'sitemap_products_expected':len(sitemap_urls),'sitemap_products_checked':len(sitemap_urls),
        'current_products_checked':len(urls),'current_products_published':len(fresh_ids),
        'additional_search_products':len(search_ids-sitemap_ids),'additional_search_urls':len(search_urls-set(sitemap_urls)),
        'discovery_products_expected':len(urls),'discovery_products_accounted_for':len(fresh_ids)+len(confirmed),
        'confirmed_unpublished_count':len(confirmed),
        'confirmed_unpublished_products':[{'id':product_id(url),'url':url,'httpStatus':status,'checkedAt':checked,
            'confirmationSourceUrl':confirmation_sources.get(url),'evidence':'repeated_page_and_explicit_unpublished_gridbox' if url in confirmation_sources else 'repeated_http_status'} for url,status in sorted(confirmed.items())],
        'retained_not_listed':len(retained),'new_products_added':len(fresh_ids-previous_by_id.keys()),'new_prices_added':newly_priced,
        'refreshed_at':checked,'last_successful_at':checked,'duration_seconds':round(time.monotonic()-start,2),
        'category_count':len({p['category'] for p in records}),'category_counts':dict(Counter(p['category'] for p in records)),
        'price_note':'Public GBP product offers and explicitly labelled regular prices only. Many Lidl pages say See in store for price; these remain unpriced. Lidl Plus discounts are excluded.',
        'availability_note':'In-store sales channel; no claim of stock at your local branch.',
        'coverage_note':'Every Lidl GB sitemap product and public search identity was checked. Previous product identities are retained; no longer listed entries cannot enter a basket. Lidl does not publish its complete priced in-store inventory.',
        'sitemap_sha256':hashlib.sha256('\n'.join(sitemap_urls).encode()).hexdigest(),**search_meta,**menu_meta}
    for key,field in [('price','price'),('pack_size','packSize'),('sku','sku'),('gtin','gtin'),('brand','brand'),('category','category'),('image','image'),('nutrition','nutrition')]:
        meta['with_'+key]=sum(p.get(field) is not None and p.get(field)!='' for p in records)
    meta['price_coverage']=meta['with_price']/len(records)
    meta['grocery_products']=sum(p['category'].startswith('Food & Drink') for p in records)
    meta['grocery_with_price']=sum(p['category'].startswith('Food & Drink') and p['price'] is not None for p in records)
    meta['with_regular_price_labels']=sum(p.get('priceBasis')=='labelled_regular_price' and p['price'] is not None for p in records)
    meta['with_priced_pack_size']=sum(p['price'] is not None and p['packQuantity'] is not None for p in records)
    meta['with_usable_price_at_refresh']=sum(p['price'] is not None and p['packQuantity'] is not None and p['available'] is not False and not p.get('regionRestricted') for p in records)
    # Both are validated before replacement; consumers verify matching count + hash.
    meta['products_sha256']=hashlib.sha256(json.dumps(records,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    meta['products_file_sha256']=hashlib.sha256((json.dumps(records,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode()).hexdigest()
    atomic(products_path,records); atomic(metadata_path,meta)
    return meta
