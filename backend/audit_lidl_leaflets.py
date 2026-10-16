"""Read-only, bounded capture of the official Lidl GB leaflet metadata.

This project audit retains evidence for human review. It never imports prices,
fetches linked images/PDFs, authenticates, or accepts an arbitrary target URL.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import html
import json
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlsplit

import requests
from audit_lidl_price_sources import RequestPacer

HUB = 'https://www.lidl.co.uk/c/online-leaflets/s10023175'
OVERVIEW = 'https://endpoints.leaflets.schwarz/v4/overview?client_locale=lidl/en-GB'
MODULE = 'https://lidl.leaflets.schwarz/assets/index-f42dafaf.js'
HOSTS = {'www.lidl.co.uk', 'endpoints.leaflets.schwarz', 'lidl.leaflets.schwarz', 'assets.leaflets.schwarz'}
SLUG = r'\d{2}-\d{2}-\d{2}-\d{2}-lidl-weekly(?:-[a-f0-9]{6})?'
VIEWER = re.compile(r'^https://www\.lidl\.co\.uk/l/en/online-leaflets/('+SLUG+r')/ar/\d+$')
MAX_BYTES = 4000000
MAX_FLYERS = 8
MAX_NODES = 100000


class LeafletAuditError(RuntimeError):
    pass


@dataclass
class Source:
    text: str
    status: int = 200
    final_url: str = ''
    content_type: str = 'application/json'


def safe_host(url):
    try:
        parsed = urlsplit(url)
        return parsed.scheme == 'https' and parsed.hostname in HOSTS and not parsed.username and not parsed.password and parsed.port in (None, 443) and not parsed.fragment
    except ValueError:
        return False


def metadata_url(url, slugs):
    """Only the fixed GB overview or an identified GB flyer route is readable."""
    if not safe_host(url):
        return False
    parsed = urlsplit(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    if parsed.hostname != 'endpoints.leaflets.schwarz':
        return False
    if parsed.path == '/v4/overview':
        return query == {'client_locale': ['lidl/en-GB']}
    return parsed.path == '/v4/flyer' and set(query) == {'version', 'flyer_identifier', 'client'} and query.get('version') == ['4'] and query.get('client') == ['lidl'] and len(query.get('flyer_identifier', [])) == 1 and query['flyer_identifier'][0] in slugs


def flyer_url(slug):
    if not re.fullmatch(SLUG, slug):
        raise LeafletAuditError('Not an identified weekly Lidl GB flyer.')
    return 'https://endpoints.leaflets.schwarz/v4/flyer?version=4&flyer_identifier='+slug+'&client=lidl'


def viewer_links(source):
    source = html.unescape(source).replace(r'\/', '/')
    candidates = re.findall(r'(?<![\w/:.])(?:https://www\.lidl\.co\.uk)?/l/en/online-leaflets/[^\s<>"\'?#]+/ar/\d+', source)
    return sorted({urljoin(HUB, value) for value in candidates if VIEWER.fullmatch(urljoin(HUB, value))})


def inspect_metadata(value):
    """Describe observed JSON without assuming an undocumented provider schema."""
    links, locale_fields, text_fields = [], [], []
    count = 0

    def walk(row, path='', depth=0):
        nonlocal count
        count += 1
        if count > MAX_NODES or depth > 40:
            raise LeafletAuditError('Metadata graph exceeds bound; not truncated success.')
        if isinstance(row, dict):
            for key, item in row.items():
                name = str(key).lower().replace('_', '').replace('-', '')
                location = path+'.'+str(key)
                if name in ('locale', 'clientlocale', 'country', 'countrycode', 'language', 'languagecode') and isinstance(item, str):
                    locale_fields.append({'path': location, 'value': item})
                    allowed = {'gb', 'uk', 'en', 'eng', 'en-gb', 'en_gb', 'lidl/en-gb', 'great britain', 'united kingdom'}
                    if item.lower() not in allowed:
                        raise LeafletAuditError('Metadata explicitly declares a different country or locale: '+item)
                if name in ('keywords', 'alttext', 'ocrtext', 'title', 'name', 'startdate', 'enddate', 'offerstartdate', 'offerenddate') and isinstance(item, (str, int, float)):
                    text_fields.append({'path': location, 'value': item})
                walk(item, location, depth+1)
        elif isinstance(row, list):
            for index, item in enumerate(row):
                walk(item, path+'['+str(index)+']', depth+1)
        elif isinstance(row, str) and row.startswith('https://'):
            parsed = urlsplit(row)
            links.append({'path': path, 'url': row, 'host': parsed.hostname, 'fetchAllowedHost': safe_host(row), 'fetched': False,
                          'disposition': 'metadata_link_only_not_verified_pack_price'})

    walk(value)
    return {'topLevelType': type(value).__name__, 'topLevelKeys': sorted(value) if isinstance(value, dict) else None,
            'explicitLocaleFields': locale_fields, 'localeAssurance': 'explicit_GB_or_English_fields' if locale_fields else 'GB_request_and_official_GB_hub_identity_only',
            'observedTextFields': text_fields, 'links': links, 'nodesInspected': count}


class Reader:
    def __init__(self, deadline):
        self.deadline = deadline
        self.pacer = RequestPacer()
        self.pacer.begin(deadline)
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'MealPlannerLeafletAudit/1.0 (+https://github.com/kpulawski2/meal-planner)'})

    def get(self, url, allowed):
        for _ in range(4):
            if not safe_host(url) or url not in allowed:
                raise LeafletAuditError('URL or redirect is outside the exact project leaflet sources.')
            for attempt in range(3):
                self.pacer.acquire()
                response = self.session.get(url, timeout=(8, 20), allow_redirects=False, stream=True)
                if response.status_code not in (429, 500, 502, 503, 504):
                    break
                if attempt == 2:
                    break  # Preserve the final HTTP response as unverified evidence.
                try:
                    self.pacer.defer(response.headers.get('Retry-After'), attempt)
                finally:
                    response.close()
            with response:
                if response.is_redirect:
                    url = urljoin(url, response.headers.get('Location', ''))
                    continue  # Validate before another request, including same-host paths.
                body = bytearray()
                for chunk in response.iter_content(65536):
                    body.extend(chunk)
                    if len(body) > MAX_BYTES or time.monotonic() > self.deadline:
                        raise LeafletAuditError('Source size or elapsed-time bound exceeded.')
                return Source(bytes(body).decode('utf-8'), response.status_code, url, response.headers.get('Content-Type', ''))
        raise LeafletAuditError('Too many leaflet redirects.')


def audit(directory=Path('work/lidl-leaflet-audit'), get=None, *, seconds=180):
    directory.mkdir(parents=True, exist_ok=True)
    (directory/'sources').mkdir(exist_ok=True)
    deadline = time.monotonic()+seconds
    reader = Reader(deadline) if get is None else None
    manifest, failures, rows = [], [], []
    allowed = {HUB, OVERVIEW, MODULE}
    report = {'schemaVersion': 1, 'checkedAt': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
              'status': 'incomplete', 'pricesPublished': False, 'scope': 'Metadata for weekly leaflet identities actually linked from the official Lidl GB hub; at most eight flyers.',
              'notVerified': 'Images, PDF contents, exact pack prices, Sheffield applicability, store stock and unlisted leaflets are not verified. Metadata dates and OCR require review before use.',
              'sourceRequests': rows, 'failures': failures, 'viewerUrls': []}

    def read(url, kind):
        row = {'url': url, 'kind': kind, 'status': 'unverified'}
        rows.append(row)
        try:
            if time.monotonic() > deadline or not safe_host(url) or url not in allowed:
                raise LeafletAuditError('Source is outside the bound or exact leaflet allowlist.')
            result = get(url) if get else reader.get(url, allowed)
            result = result if isinstance(result, Source) else Source(result, final_url=url)
            if result.final_url and (not safe_host(result.final_url) or result.final_url not in allowed):
                raise LeafletAuditError('Unexpected leaflet source redirect.')
            body = result.text.encode('utf-8')
            if len(body) > MAX_BYTES:
                raise LeafletAuditError('Leaflet source exceeds byte bound.')
            filename = hashlib.sha256(url.encode()).hexdigest()+'.txt.gz'
            (directory/'sources'/filename).write_bytes(gzip.compress(body, mtime=0))
            capture = {'url': url, 'finalUrl': result.final_url or url, 'httpStatus': result.status, 'contentType': result.content_type,
                       'sha256': hashlib.sha256(body).hexdigest(), 'bytes': len(body), 'file': 'sources/'+filename}
            manifest.append(capture)
            row.update(capture)
            if result.status != 200:
                raise LeafletAuditError('HTTP '+str(result.status)+'; response retained without verified metadata.')
            row['status'] = 'captured'
            return result.text, row
        except Exception as error:
            row.update({'status': 'unverified', 'error': str(error)})
            failures.append({'url': url, 'error': str(error)})
            return None, row

    try:
        hub, _ = read(HUB, 'official_GB_leaflet_hub')
        if hub is None:
            raise LeafletAuditError('Cannot establish official GB weekly flyer identities.')
        viewers = viewer_links(hub)
        report['viewerUrls'] = viewers
        slugs = sorted({VIEWER.fullmatch(url)[1] for url in viewers})
        if not slugs or len(slugs) > MAX_FLYERS:
            raise LeafletAuditError('No identified weekly flyers or flyer count exceeds bound; not truncated.')
        allowed.update(viewers)
        allowed.update(flyer_url(slug) for slug in slugs)
        # The fixed public application module is useful evidence if an endpoint
        # shape changed. It is captured as text and never evaluated.
        read(MODULE, 'official_public_leaflet_module')
        for viewer in viewers:
            read(viewer, 'official_GB_weekly_viewer')
        for url in [OVERVIEW]+[flyer_url(slug) for slug in slugs]:
            if not metadata_url(url, slugs):
                raise LeafletAuditError('Unexpected metadata request.')
            source, row = read(url, 'GB_overview' if url == OVERVIEW else 'identified_GB_flyer_metadata')
            if source is None:
                continue
            try:
                value = json.loads(source)
                if not isinstance(value, (dict, list)) or not value:
                    raise LeafletAuditError('Metadata response is empty or not an object/list.')
                if isinstance(value, dict) and (value.get('error') or value.get('errors') or isinstance(value.get('statusCode'), int) and value['statusCode'] >= 400):
                    raise LeafletAuditError('Provider returned an error document; retained without verified metadata.')
                row['inspection'] = inspect_metadata(value)
                row['status'] = 'metadata_captured_for_review'
            except Exception as error:
                row.update({'status': 'unverified', 'error': str(error)})
                failures.append({'url': url, 'error': str(error)})
        if not failures:
            report['status'] = 'complete_metadata_capture'
    except Exception as error:
        failures.append({'error': str(error)})
    finally:
        report['summary'] = {'weeklyViewerIdentities': len(report['viewerUrls']), 'capturedSources': len(manifest),
                             'metadataResponsesCaptured': sum(row['status'] == 'metadata_captured_for_review' for row in rows),
                             'failures': len(failures)}
        (directory/'source-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        (directory/'leaflet-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        print(json.dumps({'status': report['status'], **report['summary']}), flush=True)
    if failures:
        raise LeafletAuditError('Leaflet source capture incomplete; retained responses require review.')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('work/lidl-leaflet-audit'))
    args = parser.parse_args()
    audit(args.output)
