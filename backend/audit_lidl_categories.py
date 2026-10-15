"""Audit every public Lidl Food & Drink menu category without publishing prices."""
import csv
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from lidl_catalogue import fetch, ROOT
from lidl_categories import discover_categories, MENU_ROOT

STORE = 'https://www.lidl.co.uk/s/en-GB/store-finder/sheffield/alison-crescent/'


def audit(directory=Path('work/lidl-category-audit'), get=fetch, checked_at=None):
    directory.mkdir(parents=True, exist_ok=True)
    manifest = []
    # Keep representative raw evidence; every source URL and semantic product
    # identity is retained in the audit even when its HTML is not duplicated.
    def recorded(url):
        source = get(url)
        digest = hashlib.sha256(source.encode()).hexdigest()
        manifest.append({'url': url, 'sha256': digest, 'bytes': len(source.encode())})
        (directory / (hashlib.sha256(url.encode()).hexdigest()[:12]+'.html')).write_text(source, encoding='utf-8')
        return source
    try:
        _, metadata = discover_categories(recorded)
    except Exception:
        (directory/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
        raise
    checked = checked_at or datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    store_source = recorded(STORE)
    entities = [json.loads(raw) for raw in re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',store_source,re.S|re.I)]
    store = next((row for row in entities if isinstance(row,dict) and row.get('@type')=='GroceryStore'),None)
    address = store.get('address', {}) if store else {}
    if address.get('streetAddress')!='Alison Crescent' or address.get('postalCode')!='S2 1AS' or address.get('addressLocality')!='Sheffield':
        raise ValueError('The official store identity or address changed.')
    saved = {p['id']:p for p in json.loads((ROOT/'data/lidl-products.json').read_text(encoding='utf-8'))}
    metadata.update({'checkedAt': checked, 'storeContext': {'name': store['name'], 'address':address, 'url': STORE,
        'verification':'Official store address verified; category prices are not verified branch shelf prices.'},
        'newProductIds': sorted(row['id'] for row in metadata['menu_products'] if row['id'] not in saved),
        'additionalPriceIds': sorted(row['id'] for row in metadata['menu_products'] if row['publicPriceGBP'] is not None and saved.get(row['id'],{}).get('price') is None)})
    (directory/'menu-audit.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (directory/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    categories = {row['id']:row for row in metadata['menu_categories']}
    by_url = {row['url']:row for row in categories.values()}
    def category_path(row):
        parts=[row['name']]; parent=by_url.get(row['parent'])
        while parent and parent['parent']:
            parts.insert(0,parent['name']);parent=by_url.get(parent['parent'])
        return ' > '.join(parts)
    def write_csv(name, headers, rows):
        def cell(value):
            text='' if value is None else str(value)
            return "'"+text if text.startswith(('=','+','-','@','\t','\r')) else text
        with (directory/name).open('w',encoding='utf-8-sig',newline='') as handle:
            writer=csv.writer(handle);writer.writerow(headers)
            writer.writerows([[cell(value) for value in row] for row in rows])
    def uk_time(value):
        return datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(ZoneInfo('Europe/London')).isoformat(timespec='seconds') if value else None
    products = metadata['menu_products']
    write_csv('lidl-food-menu-prices.csv', ['Product ID','Product','Public pack price GBP','Explicit regular price GBP','Lidl Plus prices GBP (membership required)','Member offer conditions','Pack','Offer from (UK time)','Offer until (UK time)','Region restricted','Product URL','Category source URL','Categories','Checked at (UK time)','Previously in catalogue','Saved public price GBP'],
        [[p['id'],p['name'],p['publicPriceGBP'],p['regularPriceGBP'],'; '.join(str(m['priceGBP']) for m in p['memberOffers']),'; '.join(' / '.join(str(m[k]) for k in ['promotion','unitPriceLabel','regularPriceLabel'] if m.get(k)) for m in p['memberOffers']),p['packSize'],uk_time(p['validFrom']),uk_time(p['validThrough']),p['regionRestricted'],p['url'],p['sourceUrl'],'; '.join(category_path(categories[i]) for i in p['categoryIds']),uk_time(checked),p['id'] in saved,saved.get(p['id'],{}).get('price')] for p in products])
    write_csv('lidl-food-menu-categories.csv',['Category','URL','Parent','Products expected','Products checked','Published cards','Confirmed unpublished IDs','Pages checked','Public prices','Member prices','Checked at (UK time)'],
        [[category_path(c),c['url'],c['parent'],c['productsExpected'],c['productsChecked'],c['productsPublished'],'; '.join(c['unpublishedIds']),c['pages'],sum(p['publicPriceGBP'] is not None for p in products if c['id'] in p['categoryIds']),sum(bool(p['memberOffers']) for p in products if c['id'] in p['categoryIds']),uk_time(checked)] for c in categories.values()])
    print(json.dumps({key:value for key,value in metadata.items() if key not in ['menu_products','menu_categories','menu_source_urls']},ensure_ascii=False),flush=True)
    return metadata


if __name__ == '__main__':
    audit()
