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

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.lidl.co.uk'
SITEMAP = ORIGIN + '/static/sitemap.xml'
PRODUCT = re.compile(r'^https://www\.lidl\.co\.uk/p/[^?#]+/p\d+$')
LOG = logging.getLogger(__name__)
LOCAL = threading.local()

class LidlRefreshError(RuntimeError):
    pass

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
    response.raise_for_status()
    if urlsplit(response.url).hostname != 'www.lidl.co.uk':
        raise LidlRefreshError('Lidl redirected outside the official GB site.')
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
    multi = re.search(r'\b(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b',value,re.I)
    single = re.search(r'\b(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l|pieces?|each|pack)\b',value,re.I)
    if multi: qty, unit = int(multi[1])*float(multi[2]), multi[3].lower()
    elif single: qty, unit = float(single[1]), single[2].lower()
    elif re.fullmatch(r'(?:per\s+)?(?:each|piece)',value,re.I): qty,unit=1,'pieces'
    else: return None,None
    if unit == 'cl': qty,unit=qty*10,'ml'
    if unit in ('piece','each','pack'): unit='pieces'
    return (qty,unit) if qty>0 else (None,None)

def positive(value):
    try: number=float(value)
    except (TypeError, ValueError): return None
    return number if math.isfinite(number) and number>0 else None

def parse_product(url, source, checked):
    scripts = re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',source,re.S|re.I)
    entities=[]
    for script in scripts:
        doc=json.loads(script)
        entities.extend(doc if isinstance(doc,list) else doc.get('@graph',[doc]))
    product=next((x for x in entities if x.get('@type') == 'Product'),None)
    match=re.search(r'<script\b[^>]*id=["\']__NUXT_DATA__["\'][^>]*>(.*?)</script>',source,re.S|re.I)
    if not product or not match: raise LidlRefreshError('No validated Lidl product data on '+url)
    data=decode_nuxt(json.loads(match[1]))
    item=next((row for row in data.get('data',{}).values() if isinstance(row,dict) and 'erpNumber' in row),None)
    if not item or str(item['erpNumber']) != url.rsplit('/p',1)[-1] or str(product.get('sku')) != str(item['erpNumber']):
        raise LidlRefreshError('Product identity mismatch: '+url)
    if urljoin(ORIGIN,item.get('canonicalUrl','')) != url: raise LidlRefreshError('Unexpected canonical product URL: '+url)
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
        'memberOffersAvailable':bool(item.get('lidlPlus')),'regions':item.get('regions') or [],
        'regionRestricted':bool(item.get('regionsPrices')) or bool(item.get('regions')),
        'description':text(facts.get('description'))}

def validate(records, expected, previous=None):
    if len(records)<100: raise LidlRefreshError('Too few Lidl website products; no partial snapshot was published.')
    if len(records)!=len(expected) or {p['url'] for p in records}!=set(expected): raise LidlRefreshError('Incomplete Lidl scrape; previous catalogue kept.')
    if len({p['id'] for p in records})!=len(records): raise LidlRefreshError('Duplicate Lidl product IDs.')
    for p in records:
        if not PRODUCT.fullmatch(p.get('url','')) or not p.get('name') or p.get('currency')!='GBP': raise LidlRefreshError('Invalid Lidl product.')
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

def refresh(products_path=None, metadata_path=None, get=fetch):
    start=time.monotonic()
    products_path=Path(products_path or ROOT/'data/lidl-products.json')
    metadata_path=Path(metadata_path or ROOT/'data/lidl-catalogue-meta.json')
    urls,maps=discover(get)
    LOG.info('Discovered %d Lidl product pages across %d sitemaps',len(urls),len(maps))
    checked=datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    records,failures=[],[]
    def load(url):
        if get is fetch: time.sleep(.12)
        return parse_product(url,get(url),checked)
    with ThreadPoolExecutor(max_workers=max(1,min(6,int(os.getenv('LIDL_WORKERS','4'))))) as pool:
        futures={pool.submit(load,url):url for url in urls}
        for count,future in enumerate(as_completed(futures),1):
            try: records.append(future.result())
            except Exception as exc: failures.append((futures[future],str(exc)))
            if count%100==0 or count==len(urls): LOG.info('Checked %d/%d pages; failures %d',count,len(urls),len(failures))
    if failures: raise LidlRefreshError(f'{len(failures)} Lidl pages failed; previous snapshot kept. First failures: {failures[:5]}')
    final_urls,final_maps=discover(get)
    if final_urls!=urls or final_maps!=maps: raise LidlRefreshError('Lidl sitemap changed during refresh; previous snapshot kept.')
    previous=None
    if products_path.exists() and metadata_path.exists():
        meta=json.loads(metadata_path.read_text(encoding='utf-8'))
        if meta.get('status')=='complete': previous=json.loads(products_path.read_text(encoding='utf-8'))
    validate(records,urls,previous)
    records.sort(key=lambda p:(p['name'].casefold(),p['id']))
    meta={'schema_version':1,'store':'Lidl','status':'complete','coverage':1,'coverage_scope':'official_sitemap_products',
        'entire_store_inventory':False,'source':'Lidl GB official recursive sitemap and product pages','source_url':SITEMAP,
        'products_expected':len(urls),'products_saved':len(records),'sitemaps':maps,'failed_pages':0,
        'refreshed_at':checked,'last_successful_at':checked,'duration_seconds':round(time.monotonic()-start,2),
        'category_count':len({p['category'] for p in records}),'category_counts':dict(Counter(p['category'] for p in records)),
        'price_note':'Public GBP prices only. Many Lidl pages say See in store for price; these remain unpriced. Lidl Plus discounts are excluded.',
        'availability_note':'In-store sales channel; no claim of stock at your local branch.',
        'coverage_note':'Every product in Lidl GB\u2019s official sitemap was checked. Lidl does not publish its complete priced in-store inventory.',
        'sitemap_sha256':hashlib.sha256('\n'.join(urls).encode()).hexdigest()}
    for key,field in [('price','price'),('pack_size','packSize'),('sku','sku'),('gtin','gtin'),('brand','brand'),('category','category'),('image','image'),('nutrition','nutrition')]:
        meta['with_'+key]=sum(p.get(field) is not None and p.get(field)!='' for p in records)
    meta['price_coverage']=meta['with_price']/len(records)
    meta['grocery_products']=sum(p['category'].startswith('Food & Drink') for p in records)
    meta['grocery_with_price']=sum(p['category'].startswith('Food & Drink') and p['price'] is not None for p in records)
    # Both are validated before replacement; consumers verify matching count + hash.
    meta['products_sha256']=hashlib.sha256(json.dumps(records,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    meta['products_file_sha256']=hashlib.sha256((json.dumps(records,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode()).hexdigest()
    atomic(products_path,records); atomic(metadata_path,meta)
    return meta
