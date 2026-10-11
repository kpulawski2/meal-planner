(function (root) {
  'use strict';
  let api, request = null, generation = 0, data = null, filters = { q: '', category: '', price: 'all', source: 'products' }, busy = false;
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function sourceUrl(value) { try { const url = new URL(value); return url.origin === 'https://www.lidl.co.uk' && !url.username && !url.password ? html(url.href) : ''; } catch { return ''; } }
  function entry(row) {
    const reference = row.kind === 'range_reference', url = sourceUrl(row.url);
    return '<article class="catalogue-product"><div><b>' + html(row.productName) + '</b><small>' + html(row.category) + (row.packSize ? ' · ' + html(row.packSize) : '') + '</small></div><strong>' + (row.priceGBP == null ? 'Price unknown' : '£' + Number(row.priceGBP).toFixed(2)) + '</strong><p class="sub">' + (reference ? 'Range reference · ' + html(row.sourcePeriod) + (row.publishedPack ? ' · published pack: ' + html(row.publishedPack) : '') + '. Check today’s pack, price and stock in store.' : row.availability === 'unavailable' ? 'Currently unavailable; excluded from the budget.' : 'Check local stock in store. Prices are from the saved website catalogue.') + '</p>' + (url ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + (reference ? 'View Lidl source' : 'View Lidl product') + ' ↗</a>' : '') + '</article>';
  }
  function draw() {
    if (!document.getElementById('lidlBrowseResults')) return;
    const select = document.getElementById('lidlBrowseCategory');
    select.innerHTML = '<option value="">All food categories</option>' + (data?.categories || []).map(category => '<option value="' + html(category) + '" ' + (filters.category === category ? 'selected' : '') + '>' + html(category) + '</option>').join('');
    document.getElementById('lidlBrowseCount').textContent = data ? data.verifiedProducts + ' verified food products · ' + (filters.source === 'all' ? data.rangeReferences + ' historical range references included · ' : '') + data.priced + ' with usable website prices. Showing ' + data.results.length + ' of ' + data.matched + ' matches.' : 'Loading the Lidl ingredient catalogue…';
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
      const params = new URLSearchParams({ store: 'Lidl', ...filters, offset: String(offset), limit: '40' });
      const response = await fetch('/api/catalog/browse?' + params, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]) });
      if (!response.ok) throw new Error('Catalogue unavailable');
      const next = await response.json();
      if (!next.ok || !Array.isArray(next.results) || !Array.isArray(next.categories)) throw new Error('Invalid catalogue response');
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
    filters = { q: String(query), category: '', price: 'all', source: 'products' }; data = null;
    api.open('<button class="close" aria-label="Close ingredient catalogue" onclick="CatalogueBrowser.close()">×</button><h2>Lidl ingredients</h2><p class="sub">Browse verified Lidl food products. Historical range references are available if you choose to include them. Lidl does not publish a complete in-store inventory. Unknown prices stay outside your budget.</p><form onsubmit="event.preventDefault();CatalogueBrowser.search()"><div class="field"><label for="lidlBrowseQuery">Ingredient or product</label><input id="lidlBrowseQuery" value="' + html(filters.q) + '" placeholder="Tuna, oats, mayonnaise…"></div><div class="grid"><div class="field"><label for="lidlBrowseCategory">Category</label><select id="lidlBrowseCategory" onchange="CatalogueBrowser.search()"><option value="">All food categories</option></select></div><div class="field"><label for="lidlBrowsePrice">Price</label><select id="lidlBrowsePrice" onchange="CatalogueBrowser.search()"><option value="all">All entries</option><option value="priced">Usable website price</option><option value="unpriced">Price unknown</option></select></div></div><div class="field"><label for="lidlBrowseSource">Listings</label><select id="lidlBrowseSource" onchange="CatalogueBrowser.search()"><option value="products">Verified product listings only</option><option value="all">Also include historical range references</option></select></div><div class="actions"><button class="btn" type="submit">Search</button><button class="btn secondary" type="button" onclick="CatalogueBrowser.open()">Clear filters</button></div></form><p id="lidlBrowseCount" class="sub"></p><p id="lidlBrowseStatus" class="sub" role="status"></p><div id="lidlBrowseResults"></div><div class="actions"><button id="lidlBrowseMore" class="btn secondary" onclick="CatalogueBrowser.more()" hidden>Show 40 more</button></div>');
    void load();
  }
  root.CatalogueBrowser = { configure(value) { api = value; }, open, close() { request?.abort(); generation++; api.close(); }, search() { filters = { q: document.getElementById('lidlBrowseQuery').value, category: document.getElementById('lidlBrowseCategory').value, price: document.getElementById('lidlBrowsePrice').value, source: document.getElementById('lidlBrowseSource').value }; data = null; void load(); }, more() { if (!busy) void load(true); }, retry() { void load(); } };
})(typeof window !== 'undefined' ? window : globalThis);
