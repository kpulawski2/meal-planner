"""Read-only source evidence for Lidl's Food & Drink menu audit.

The scheduled catalogue publisher remains separate: an audit never overwrites
the healthy product snapshot. Source captures let reviewers check the exact
navigation and product-list schema used by this public-site integration.
"""
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from lidl_catalogue import fetch, decode_nuxt

ROOT = 'https://www.lidl.co.uk/c/food-drink/s10068374'
STORE = 'https://www.lidl.co.uk/s/en-GB/store-finder/sheffield/alison-crescent/'
SOURCES = [ROOT, ROOT + '?offset=180',
    'https://www.lidl.co.uk/h/fruit-vegetables/h10071012',
    'https://www.lidl.co.uk/h/fresh-meat-poultry/h10095752',
    'https://www.lidl.co.uk/h/cheese-dairy-eggs/h10095761', STORE]


def capture_sources(directory=Path('work/lidl-category-audit')):
    directory.mkdir(parents=True, exist_ok=True)
    records = []
    for index, url in enumerate(SOURCES):
        source = fetch(url)
        stem = f'source-{index:02d}'
        (directory / (stem + '.html')).write_text(source, encoding='utf-8')
        match = re.search(r'<script\b[^>]*id=["\']__NUXT_DATA__["\'][^>]*>(.*?)</script>', source, re.S | re.I)
        if match:
            document = decode_nuxt(json.loads(match[1]))
            (directory / (stem + '.json')).write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding='utf-8')
        records.append({'url': url, 'file': stem, 'bytes': len(source.encode()), 'sha256': hashlib.sha256(source.encode()).hexdigest(), 'nuxt': bool(match)})
        print(json.dumps(records[-1]), flush=True)
    (directory / 'source-manifest.json').write_text(json.dumps({'checkedAt': datetime.now(timezone.utc).isoformat(), 'sources': records}, indent=2), encoding='utf-8')


if __name__ == '__main__':
    capture_sources()
