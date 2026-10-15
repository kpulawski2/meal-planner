"""Read-only audit of all Lidl GB sitemap URLs and non-product price sources.

Product URLs belong to the separately validated full catalogue refresh. This
audit checks every other public content URL and saves price *candidates* for
review. Body text, unit prices and old advertising never become basket prices.
"""
from __future__ import annotations
import argparse
import gzip
import hashlib
import html
import json
import re
import threading
import time
from collections import Counter
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
from xml.etree import ElementTree as ET

import requests
from lidl_catalogue import ORIGIN, PRODUCT, ROOT, SITEMAP, LidlRefreshError

MAX_SITEMAPS = 10000
MAX_URLS = 50000
MAX_BYTES = 20000000
GBP = re.compile(r'(?:£\s*\d+(?:[.,]\d{1,2})?|\b\d+\.\d{2}\s*(?:GBP|pounds?)\b)', re.I)
STAPLE = re.compile(r'\b(?:oats?|skyr|berries|tuna|wraps?|mayonnaise|chicken|broccoli|oil|milk|eggs?|rice|pasta|flour|yogh?urt|lentils?|beans?|potatoes?|beef|steak)\b', re.I)
LEAFLETS = ORIGIN+'/c/online-leaflets/s10023175'
VIEWER = re.compile(r'^https://www\.lidl\.co\.uk/l/en/online-leaflets/[^?#]+/ar/\d+$')
LOCAL = threading.local()


class RequestPacer:
    """One shared request-start rate and server cooldown for all workers."""
    def __init__(self, clock=None, sleeper=None, wall_clock=None):
        self.clock=clock or time.monotonic
        self.sleep=sleeper or time.sleep
        self.wall_clock=wall_clock or time.time
        self.lock=threading.Lock()
        self.next_request=0
        self.cooldown_until=0
        self.deadline=None
        self.blocked=None

    def begin(self, deadline):
        with self.lock:
            self.next_request=0
            self.cooldown_until=0
            self.deadline=deadline
            self.blocked=None

    def acquire(self):
        while True:
            with self.lock:
                if self.blocked: raise LidlRefreshError(self.blocked)
                now=self.clock()
                ready=max(self.next_request,self.cooldown_until)
                if self.deadline is not None and max(now,ready)>=self.deadline:
                    raise LidlRefreshError('Audit time bound reached before another request; no truncated success.')
                delay=ready-now
                if delay<=0:
                    self.next_request=now+1
                    return
            # Do not hold the lock while waiting: another worker's HTTP429
            # must be able to extend the shared cooldown immediately.
            self.sleep(min(delay,1))

    def defer(self, retry_after, attempt):
        delay=None
        if retry_after is not None:
            value=str(retry_after).strip()
            if re.fullmatch(r'\d+',value): delay=float(value)
            else:
                try:
                    date=parsedate_to_datetime(value)
                    if date.tzinfo is not None: delay=max(0,date.timestamp()-self.wall_clock())
                except (ValueError,TypeError,OverflowError): pass
        if delay is None: delay=min(30,5*(attempt+1))
        with self.lock:
            if delay>60:
                # Never shorten a server's instruction to fit our retry
                # budget. Stop this run, retaining its incomplete report.
                self.blocked='Lidl Retry-After exceeds the 60-second retry bound; stopped without an early retry.'
                raise LidlRefreshError(self.blocked)
            self.cooldown_until=max(self.cooldown_until,self.clock()+delay)


PACER=RequestPacer()


@dataclass
class Source:
    text: str
    status: int = 200
    final_url: str = ''
    content_type: str = 'text/html'


def official(url):
    parts = urlsplit(url)
    return parts.scheme == 'https' and parts.hostname == 'www.lidl.co.uk' and not parts.username and not parts.password and parts.port in (None,443)


def canonical(url):
    parts = urlsplit(html.unescape(url.strip()))
    return urlunsplit((parts.scheme, parts.netloc, parts.path or '/', parts.query, ''))


def fetch_source(url):
    """Bounded reads; validate each redirect before making another request."""
    if not official(url):
        raise LidlRefreshError('Source is not the official Lidl GB website.')
    if not hasattr(LOCAL, 'session'):
        LOCAL.session = requests.Session()
        LOCAL.session.headers.update({'User-Agent':'MealPlannerPriceAudit/1.0 (+https://github.com/kpulawski2/meal-planner)'})
    for redirect in range(4):
        for attempt in range(3):
            PACER.acquire()
            began = time.monotonic()
            response = LOCAL.session.get(url, timeout=(8,20), allow_redirects=False, stream=True)
            if response.status_code not in (429,500,502,503,504):
                break
            try: PACER.defer(response.headers.get('Retry-After'),attempt)
            finally: response.close()
            if attempt==2: response.raise_for_status()
        with response:
            if response.is_redirect:
                next_url = canonical(urljoin(url,response.headers.get('Location','')))
                if not official(next_url):
                    raise LidlRefreshError('Source redirects outside the official Lidl GB website.')
                url = next_url
                continue
            if response.status_code in (404,410):
                return Source('', response.status_code, url, response.headers.get('Content-Type',''))
            response.raise_for_status()
            body = bytearray()
            for chunk in response.iter_content(65536):
                body.extend(chunk)
                if len(body)>MAX_BYTES or time.monotonic()-began>90:
                    raise LidlRefreshError('Source exceeds the bounded size or read time; not truncated.')
            if body[:2] == b'\x1f\x8b':
                body = gzip.decompress(body)
                if len(body)>MAX_BYTES:
                    raise LidlRefreshError('Expanded sitemap exceeds the size bound; not truncated.')
            return Source(bytes(body).decode('utf-8'), response.status_code, url, response.headers.get('Content-Type',''))
    raise LidlRefreshError('Too many redirects.')


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.words, self.links, self.scripts = [], [], []
        self.hidden = []
        self.script = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script','style','noscript'):
            self.hidden.append(tag)
        if tag == 'script' and attrs.get('type','').lower() == 'application/ld+json':
            self.script = []
        if attrs.get('href'):
            self.links.append(attrs['href'])

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(''.join(self.script)); self.script = None
        if self.hidden and self.hidden[-1] == tag:
            self.hidden.pop()

    def handle_data(self, data):
        if self.script is not None:
            self.script.append(data)
        if not self.hidden:
            self.words.append(data)


def evidence(source, url):
    page = Page(); page.feed(source)
    visible = re.sub(r'\s+',' ',' '.join(page.words)).strip()
    contexts = [{'amountText':m[0], 'context':visible[max(0,m.start()-220):m.end()+220],
                 'stapleMention':bool(STAPLE.search(visible[max(0,m.start()-220):m.end()+220]))}
                for m in GBP.finditer(visible)]
    structured = []
    errors = []
    def walk(value):
        if isinstance(value,list):
            for row in value: walk(row)
        elif isinstance(value,dict):
            kind = value.get('@type')
            if kind == 'Product' or isinstance(kind,list) and 'Product' in kind:
                offers=value.get('offers') or []
                if isinstance(offers,dict): offers=[offers]
                for offer in offers:
                    if not isinstance(offer,dict) or offer.get('priceCurrency')!='GBP' or offer.get('price') is None: continue
                    structured.append({'name':value.get('name'), 'sku':value.get('sku'),
                        'productUrl':value.get('url'), 'offer':offer,
                        'disposition':'candidate_requires_identity_pack_date_region_review'})
            for row in value.values():
                if isinstance(row,(dict,list)): walk(row)
    for script in page.scripts:
        try: walk(json.loads(script))
        except (ValueError,TypeError,RecursionError) as error: errors.append(type(error).__name__)
    pdfs=sorted({canonical(urljoin(url,link)) for link in page.links if re.search(r'\.pdf(?:[?#]|$)',link,re.I)})
    public_json=html.unescape(source).replace(r'\/','/')
    embedded=re.findall(r'(?:https://www\.lidl\.co\.uk)?/l/en/online-leaflets/[^\s<>"\'?#]+/ar/\d+',public_json)
    leaflet_links=sorted({canonical(urljoin(url,link)) for link in page.links+embedded if VIEWER.fullmatch(canonical(urljoin(url,link)))})
    return {'priceContexts':contexts, 'structuredCandidates':structured,
            'pdfLinks':[{'url':link,'officialGbHost':official(link),'disposition':'linked_pdf_not_read_or_used_as_price'} for link in pdfs],
            'leafletViewerLinks':leaflet_links,
            'structuredParseErrors':errors}


def exclusion(url):
    if not official(url): return 'outside_official_www_lidl_co_uk'
    path=urlsplit(url).path.lower()
    if PRODUCT.fullmatch(url): return 'canonical_product_checked_by_separate_full_catalogue_refresh'
    if path in ('/s','/s/') or '/store-finder/' in path or path.startswith('/s/en-gb/'): return 'store_directory_hours_and_addresses_not_a_published_shelf_price_feed'
    if re.search(r'\.(?:pdf|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|mp4|css|js|xml|gz)$',path): return 'non_html_asset_link_retained_not_read_as_pack_price'
    if re.search(r'/(?:login|logout|register|account|privacy|data-protection|imprint|terms-and-conditions|accessibility)(?:/|$)',path): return 'account_or_legal_page_not_a_product_price_source'
    return None


def audit(directory=Path('work/lidl-price-source-audit'), get=fetch_source, *, seconds=1200, workers=4, catalogue_path=None):
    directory.mkdir(parents=True,exist_ok=True)
    sources = directory/'sources'; sources.mkdir(exist_ok=True)
    checked=datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    deadline=time.monotonic()+seconds
    if get is fetch_source: PACER.begin(deadline)
    manifest, urls, maps, failures = {}, set(), set(), []
    sitemap_urls=set()
    report={'schemaVersion':1,'checkedAt':checked,'status':'incomplete',
        'scope':'Every robots-declared recursive sitemap URL is accounted for. Non-product HTML content pages are read for candidate price evidence. Canonical products are handled by the separate full catalogue refresh.',
        'notVerified':'Complete in-store inventory, Sheffield shelf prices, linked PDF contents, linked sites outside www.lidl.co.uk, unlisted/orphan pages, client-only content and pagination beyond each listed content page are not verified by this audit.',
        'pricesPublished':False,
        'requestPolicy':{'sharedMaximumRequestsPerSecond':1,'workers':max(1,min(4,workers)),
                         'attemptsPerUrlPerRedirect':3,'maximumRetryAfterSeconds':60,
                         'longerRetryAfter':'Stop without retrying early; retain incomplete evidence.'},
        'urls':[],'sitemaps':[],'failures':failures}
    records={}
    catalogue_file=catalogue_path or ROOT/'data/lidl-products.json'
    saved={str(row['id']):row for row in json.loads(catalogue_file.read_text(encoding='utf-8'))} if catalogue_file.exists() else {}

    def read(url):
        if time.monotonic()>deadline: raise LidlRefreshError('Audit time bound reached; no truncated success.')
        raw=get(url)
        result=raw if isinstance(raw,Source) else Source(raw,200,url)
        final_url=result.final_url or url
        if not official(final_url): raise LidlRefreshError('Source redirected outside official Lidl GB.')
        content=result.text.encode('utf-8'); digest=hashlib.sha256(content).hexdigest()
        name=hashlib.sha256(url.encode()).hexdigest()+'.txt.gz'
        (sources/name).write_bytes(gzip.compress(content,mtime=0))
        manifest[url]={'url':url,'finalUrl':final_url,'httpStatus':result.status,'contentType':result.content_type,
                       'sha256':digest,'bytes':len(content),'file':'sources/'+name}
        return result

    def check(url):
        row={'url':url}
        try:
            result=read(url)
            row.update({'status':'removed' if result.status in (404,410) else 'checked',
                        'httpStatus':result.status,'finalUrl':result.final_url or url})
            if row['status']=='checked': row.update(evidence(result.text,result.final_url or url))
        except Exception as error:
            row.update({'status':'failed','error':str(error),'errorType':type(error).__name__})
        return row

    try:
        robots=read(ORIGIN+'/robots.txt')
        roots=re.findall(r'^Sitemap:\s*(\S+)',robots.text,re.M|re.I)
        if SITEMAP not in roots: raise LidlRefreshError('Official Lidl sitemap missing from robots.txt.')
        queue=list(roots)
        while queue:
            url=canonical(queue.pop(0))
            if url in maps: continue
            if not official(url): raise LidlRefreshError('Sitemap index points outside Lidl GB.')
            maps.add(url)
            result=read(url)
            if result.status!=200: raise LidlRefreshError('Sitemap is unavailable: '+url)
            document=ET.fromstring(result.text)
            kind=document.tag.rsplit('}',1)[-1]
            # Only each sitemap/url's direct <loc>, never image:loc or video
            # locations nested within a URL entry.
            locs=[canonical(node.text) for entry in document for node in entry if node.tag.rsplit('}',1)[-1]=='loc' and node.text and node.text.strip()]
            if not locs: raise LidlRefreshError('Empty official sitemap: '+url)
            if kind=='sitemapindex': queue.extend(locs)
            elif kind=='urlset': urls.update(locs)
            else: raise LidlRefreshError('Unknown sitemap format: '+url)
            if len(maps)>MAX_SITEMAPS or len(urls)>MAX_URLS:
                raise LidlRefreshError('Sitemap graph exceeds safety bound; report is incomplete, not truncated success.')
        sitemap_urls=set(urls)
        urls.add(LEAFLETS)
        pending=[]
        for url in sorted(urls):
            reason=exclusion(url)
            if reason:
                row={'url':url,'status':'excluded','reason':reason}
                if PRODUCT.fullmatch(url):
                    row['status']='delegated_product_refresh'
                    product=saved.get(url.rsplit('/p',1)[-1])
                    row['savedProductEvidence']={'id':product.get('id'),'checkedAt':product.get('checkedAt'),'price':product.get('price'),'priceMissingReason':product.get('priceMissingReason'),'discoveryStatus':product.get('discoveryStatus')} if product else None
                records[url]=row
            else: pending.append(url)
        with ThreadPoolExecutor(max_workers=max(1,min(4,workers))) as pool:
            # Keep only four outstanding requests and account explicitly for
            # URLs left unstarted if the elapsed-time bound is reached.
            active={}
            iterator=iter(pending)
            for _ in range(max(1,min(4,workers))):
                url=next(iterator,None)
                if url is not None: active[pool.submit(check,url)]=url
            while active:
                done,_=wait(active,return_when=FIRST_COMPLETED)
                for future in done:
                    url=active.pop(future);records[url]=future.result()
                    next_url=next(iterator,None)
                    if next_url is not None:
                        if time.monotonic()<deadline: active[pool.submit(check,next_url)]=next_url
                        else:
                            records[next_url]={'url':next_url,'status':'not_checked','reason':'audit_time_bound_reached'}
                            for left in iterator: records[left]={'url':left,'status':'not_checked','reason':'audit_time_bound_reached'}
                print(json.dumps({'contentPagesAccountedFor':sum(row['status']!='delegated_product_refresh' and row['status']!='excluded' for row in records.values()),'contentPagesExpected':len(pending),'sitemapUrls':len(urls)}),flush=True)
            # The official leaflet hub links current viewers that may not be
            # in the sitemap. Read these public viewer pages too; external
            # viewer APIs and PDFs remain evidence links, never proxy requests.
            viewers=sorted({link for row in records.values() for link in row.get('leafletViewerLinks',[]) if link not in records})
            if len(viewers)>250: raise LidlRefreshError('Leaflet viewer graph exceeds safety bound; report remains incomplete.')
            urls.update(viewers)
            for start in range(0,len(viewers),4):
                batch=viewers[start:start+4]
                jobs={pool.submit(check,url):url for url in batch}
                for future,url in jobs.items(): records[url]=future.result()
        failures.extend({'url':row['url'],'error':row.get('error') or row.get('reason')} for row in records.values() if row['status'] in ('failed','not_checked'))
        if not failures: report['status']='complete'
    except Exception as error:
        failures.append({'error':str(error),'errorType':type(error).__name__})
    finally:
        for url in sorted(urls-records.keys()):
            records[url]={'url':url,'status':'not_checked','reason':'sitemap_discovery_or_audit_failed'}
        report['urls']=[records[url] for url in sorted(records)]
        for row in report['urls']:
            row['discoverySource']='official_sitemap' if row['url'] in sitemap_urls else 'official_leaflet_hub_or_viewer_link'
        report['sitemaps']=sorted(maps)
        report['summary']={'sitemaps':len(maps),'sitemapUrls':len(sitemap_urls),'urlsDiscovered':len(urls),'urlsAccountedFor':len(records),
            'dispositions':dict(Counter(row['status'] for row in records.values())),
            'contentPagesWithPriceContexts':sum(bool(row.get('priceContexts')) for row in records.values()),
            'structuredPriceCandidates':sum(len(row.get('structuredCandidates',[])) for row in records.values()),
            'linkedPdfs':len({p['url'] for row in records.values() for p in row.get('pdfLinks',[])})}
        (directory/'source-manifest.json').write_text(json.dumps([manifest[url] for url in sorted(manifest)],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        (directory/'price-source-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        candidates=[{'sourceUrl':row['url'],'sourceSha256':manifest[row['url']]['sha256'],
                     'priceContexts':row.get('priceContexts',[]),'structuredCandidates':row.get('structuredCandidates',[]),'pdfLinks':row.get('pdfLinks',[])}
                    for row in report['urls'] if row.get('priceContexts') or row.get('structuredCandidates') or row.get('pdfLinks')]
        (directory/'price-candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'status':report['status'],**report['summary'],'failures':failures},ensure_ascii=False),flush=True)
    if report['status']!='complete': raise LidlRefreshError('Price-source audit incomplete; inspect saved URL report and source evidence.')
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('work/lidl-price-source-audit'))
    parser.add_argument('--seconds',type=int,default=1200)
    args=parser.parse_args()
    audit(args.output,seconds=max(1,min(1200,args.seconds)))
