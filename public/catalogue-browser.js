(function (root) {
  'use strict';
  let api, request = null, generation = 0, data = null, busy = false, store = 'Lidl';
  const defaults = () => ({ q: '', category: '', price: 'all', source: 'all', scope: 'food', references: '1' });
  let filters = defaults();
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function sourceUrl(value) { try { const url = new URL(value); return (root.RetailerPriceSources?.aldiSource(value) || ['https://www.lidl.co.uk','https://www.lidl-ni.co.uk','https://corporate.lidl.co.uk'].includes(url.origin)) && !url.username && !url.password ? html(url.href) : ''; } catch { return ''; } }
  function offerDate(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric'}) : String(value); }
  function entry(row) {
    const reference = row.estimatedPrice || row.kind === 'range_reference', url = sourceUrl(row.url), evidence = sourceUrl(row.priceSourceUrl);
    const price = row.priceGBP == null ? 'Price unknown' : (row.estimatedPrice ? '~' : '') + '£' + Number(row.priceGBP).toFixed(2);
    const note = row.estimatedPrice ? 'Saved ' + (row.sourceStore === 'Aldi' ? 'Aldi' : 'Lidl') + ' price · ' + (row.sourcePeriod || 'Undated') + (row.referenceRegions?.length ? ' · ' + row.referenceRegions.join(' / ') : '') + '. Check today’s price, pack and stock in store.' : row.kind === 'range_reference' ? 'Published range · ' + row.sourcePeriod + (row.publishedPack ? ' · published pack: ' + row.publishedPack : '') + '. Price unknown.' : row.availability === 'unavailable' ? 'Currently unavailable; excluded from the budget.' : 'Saved website listing. Check local stock and prices in store.';
    const offer = row.priceGBP == null && row.advertisedPriceGBP > 0 ? '<p class="sub">Advertised offer £' + Number(row.advertisedPriceGBP).toFixed(2) + (row.validFrom ? ' · from ' + html(offerDate(row.validFrom)) : '') + (row.validThrough ? ' · until ' + html(offerDate(row.validThrough)) : '') + '. Offer conditions apply; excluded from automatic budgets.</p>' : '';
    const members = (row.memberOffers || []).map(offer => '<p class="sub">Lidl Plus £' + Number(offer.priceGBP).toFixed(2) + (offer.promotion?' · '+html(offer.promotion):'') + (offer.unitPriceLabel?' · '+html(offer.unitPriceLabel):'') + ' · membership required' + (offer.validFrom ? ' · from ' + html(offerDate(offer.validFrom)) : '') + (offer.validThrough ? ' · until ' + html(offerDate(offer.validThrough)) : '') + '. Check offer terms in store. The budget uses the public price.</p>').join('');
    return '<article class="catalogue-product"><div><b>' + html(row.productName) + '</b><small>' + html(row.category) + (row.packSize ? ' · ' + html(row.packSize) : '') + '</small></div><strong>' + price + '</strong><p class="sub">' + html(note) + '</p><small>' + html(row.sourceLabel || '') + '</small>' + offer + members + (url ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + (reference && row.kind !== 'product' ? 'View ' + html(store) + ' source' : 'View ' + html(store) + ' product') + ' ↗</a>' : '') + (row.estimatedPrice && evidence && evidence !== url ? ' · <a href="' + evidence + '" target="_blank" rel="noopener noreferrer">Price source ↗</a>' : '') + '</article>';
  }
  function draw() {
    if (!document.getElementById('lidlBrowseResults')) return;
    const menu = data?.websiteMenu || [], byUrl = new Map(menu.map(row=>[row.url,row]));
    const path = row => { const names=[row.name]; let parent=byUrl.get(row.parent), depth=0; while(parent?.parent&&depth++<10){names.unshift(parent.name);parent=byUrl.get(parent.parent);}return names.join(' › '); };
    const option = (value,label) => '<option value="'+html(value)+'" '+(filters.category===value?'selected':'')+'>'+html(label)+'</option>';
    document.getElementById('lidlBrowseCategory').innerHTML = '<option value="">All categories</option>' + (menu.length?'<optgroup label="Lidl website menu">'+menu.map(row=>option('menu:'+row.id,path(row)+' ('+(row.productsPublished??row.productsChecked)+')')).join('')+'</optgroup>':'') + '<optgroup label="Saved catalogue">'+(data?.categories||[]).map(category=>option(category,category)).join('')+'</optgroup>';

    document.getElementById('lidlBrowseCount').textContent = data ? data.total + ' listings · ' + data.priced + ' with a price. Showing ' + data.results.length + ' of ' + data.matched + ' matches.' : 'Loading the ' + store + ' catalogue…';
    document.getElementById('lidlBrowseResults').innerHTML = data?.results.length ? data.results.map(entry).join('') : data ? '<div class="empty">No entries match. Try another name or clear the filters.</div>' : '';
    document.getElementById('lidlBrowseMore').hidden = data?.nextOffset == null;
    document.getElementById('lidlBrowseMore').disabled = busy;
    document.getElementById('lidlBrowseStatus').textContent = busy ? 'Loading…' : '';
  }
  async function load(more = false) {
    if (!api) return;
    const offset = more ? data?.nextOffset : 0; if (more && offset == null) return;
    request?.abort(); request = new AbortController(); const token = ++generation;
    busy = true; draw();
    try {
      const params = new URLSearchParams({ store, ...filters, offset: String(offset), limit: '40' });if(filters.category.startsWith('menu:')){params.set('menu',filters.category.slice(5));params.set('category','');}
      const response = await fetch('/api/catalog/browse?' + params, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]) });
      if (!response.ok) throw new Error('Catalogue unavailable');
      const next = await response.json();
      if (!next.ok || next.store && next.store !== store || !Array.isArray(next.results) || !Array.isArray(next.categories)) throw new Error('Invalid catalogue response');
      if (token !== generation) return;
      data = { ...next, results: more ? [...data.results, ...next.results] : next.results }; busy = false; draw();
    } catch (error) {
      if (token !== generation || error.name === 'AbortError') return;
      busy = false;
      if (!document.getElementById('lidlBrowseStatus')) return;
      document.getElementById('lidlBrowseStatus').innerHTML = 'The catalogue is unavailable. Your shopping list is safe. <button class="btn secondary small" onclick="CatalogueBrowser.retry()">Retry</button>';
      document.getElementById('lidlBrowseMore').disabled = false;
    }
  }
  function open(query = '') {
    store = api.store?.() === 'Aldi' ? 'Aldi' : 'Lidl';
    filters = { ...defaults(), q: String(query) }; data = null;
    let markup = '<button class="close" aria-label="Close Lidl catalogue" onclick="CatalogueBrowser.close()">×</button><h2>Lidl catalogue</h2><p class="sub">One price list from Lidl’s website and published shopping lists. Saved prices keep their source dates; ~ marks older or undated prices. Check local stock in store.</p><form onsubmit="event.preventDefault();CatalogueBrowser.search()"><div class="field"><label for="lidlBrowseQuery">Ingredient or product</label><input id="lidlBrowseQuery" value="' + html(filters.q) + '" placeholder="Tuna, oats, mayonnaise…"></div><div class="grid"><div class="field"><label for="lidlBrowseScope">Department</label><select id="lidlBrowseScope" onchange="CatalogueBrowser.search(true)"><option value="food">Food & drink</option><option value="all">All products, including household</option></select></div><div class="field"><label for="lidlBrowseCategory">Category</label><select id="lidlBrowseCategory" onchange="CatalogueBrowser.search()"><option value="">All categories</option></select></div><div class="field"><label for="lidlBrowsePrice">Price</label><select id="lidlBrowsePrice" onchange="CatalogueBrowser.search()"><option value="all">All entries</option><option value="priced">With a price</option><option value="member">Lidl Plus offers</option><option value="unpriced">Price unknown</option></select></div></div><details class="planner-help"><summary>Price sources</summary><p class="sub">Original source dates stay visible. Missing prices are never treated as free. Saved prices may come from any UK Lidl region, shown beside the source date. Packs with unknown usable quantities stay out of automatic budgets.</p></details><div class="actions"><button class="btn" type="submit">Search</button><button class="btn secondary" type="button" onclick="CatalogueBrowser.open()">Clear filters</button></div></form><p id="lidlBrowseCount" class="sub"></p><p id="lidlBrowseStatus" class="sub" role="status"></p><div id="lidlBrowseResults"></div><div class="actions"><button id="lidlBrowseMore" class="btn secondary" onclick="CatalogueBrowser.more()" hidden>Show 40 more</button></div>';
    if (store === 'Aldi') markup = markup.replaceAll('Lidl catalogue','Aldi catalogue').replace('One price list from Lidl’s website and published shopping lists. Saved prices keep their source dates; ~ marks older or undated prices. Check local stock in store.','Dated UK Aldi pack prices for recipe ingredients. This is a curated selection, with source links and original price dates. ~ marks budget estimates.').replace('<option value="member">Lidl Plus offers</option>','').replace('Saved prices may come from any UK Lidl region, shown beside the source date.','Prices come from Aldi product pages and a published UK Aldi price comparison.');
    api.open(markup);
    void load();
  }
  root.CatalogueBrowser = { configure(value) { api = value; }, open, close() { request?.abort(); generation++; api.close(); }, search(clearCategory = false) { filters = { q: document.getElementById('lidlBrowseQuery').value, category: clearCategory ? '' : document.getElementById('lidlBrowseCategory').value, price: document.getElementById('lidlBrowsePrice').value, source: 'all', references: '1', scope: document.getElementById('lidlBrowseScope').value };if(filters.category.startsWith('menu:')){filters.scope='all';document.getElementById('lidlBrowseScope').value='all';} data = null; void load(); }, more() { if (!busy) void load(true); }, retry() { void load(); } };
})(typeof window !== 'undefined' ? window : globalThis);
