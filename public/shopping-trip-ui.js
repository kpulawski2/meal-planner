(function (root) {
  'use strict';
  let api, query = '', category = '', filter = 'all', focus = true, filtersOpen = false, pendingFocus = null, entries = [];
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const checked = ([key, item]) => Boolean(api.state().shopping[key] || api.state().shopping[item.name]);
  function beforeRender() {
    const filters = document.getElementById('tripFilters');if (filters) filtersOpen = filters.open;
    const input = document.activeElement;
    if (input?.id === 'tripQuery') pendingFocus = { type: 'search', start: input.selectionStart, end: input.selectionEnd };
    else if (input?.dataset?.tripControl) pendingFocus = { type: 'control', value: input.dataset.tripControl };
  }
  function panel(rows, store) {
    entries = rows;const selected = rows.filter(checked).length, categories = [...new Set(rows.map(([, item]) => item.c))];
    if (category && !categories.includes(category)) category = '';
    if (!rows.length) return '';
    return '<section class="trip-toolbar card" aria-label="Shopping trip"><div class="section-heading"><div><span class="eyebrow">YOUR SHOPPING TRIP</span><h2>' + selected + ' of ' + rows.length + ' picked</h2>' + (store ? '<p class="sub">Shopping at ' + html(store) + '</p>' : '') + '</div><button class="btn secondary small" data-trip-control="focus" aria-pressed="' + focus + '" onclick="ShoppingTripUI.focus()">' + (focus ? 'Products & prices' : 'Simple list') + '</button></div><div class="trip-progress" role="progressbar" aria-label="Shopping items picked" aria-valuemin="0" aria-valuemax="' + rows.length + '" aria-valuenow="' + selected + '"><i style="width:' + (selected / rows.length * 100) + '%"></i></div><details id="tripFilters" class="trip-list-filters" ' + (filtersOpen ? 'open' : '') + '><summary>Search & filter list</summary><div class="field"><label for="tripQuery">Find an ingredient</label><input id="tripQuery" type="search" maxlength="160" value="' + html(query) + '" placeholder="Tuna, oats, milk…" oninput="ShoppingTripUI.search(this.value)"></div><div class="trip-filters" role="group" aria-label="Shopping checklist filter">' + [['all', 'All items'], ['left', 'Left to pick'], ['picked', 'Picked']].map(([value, label]) => '<button class="chip ' + (filter === value ? 'on' : '') + '" data-trip-control="filter-' + value + '" aria-pressed="' + (filter === value) + '" onclick="ShoppingTripUI.filter(\'' + value + '\')">' + label + '</button>').join('') + '</div><div class="trip-categories" role="group" aria-label="Shopping categories"><button class="chip ' + (!category ? 'on' : '') + '" data-trip-control="category-all" aria-pressed="' + !category + '" onclick="ShoppingTripUI.category(\'\')">All aisles</button>' + categories.map(value => '<button class="chip ' + (value === category ? 'on' : '') + '" data-trip-control="category-' + arg(value) + '" aria-pressed="' + (value === category) + '" onclick="ShoppingTripUI.category(decodeURIComponent(\'' + arg(value) + '\'))">' + html(value) + '</button>').join('') + '</div></details><div class="shopping-list-actions"><button class="btn" onclick="copyShoppingList(true)">Copy simple list</button><button class="btn secondary" onclick="window.print()">Print / save</button></div><p id="tripStatus" class="sub" role="status"></p><p class="sub trip-confirm-note">Picking an item does not record a purchase. Review your packs with Shopping done when you have bought them.</p></section><div id="tripEmpty" class="empty" hidden>No items match. <button class="text-button" onclick="ShoppingTripUI.reset()">Reset list filters</button></div>';
  }
  function apply() {
    const screen = document.getElementById('shop');if (!screen) return;
    screen.classList.toggle('shopping-focus', focus);
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);let visible = 0;
    for (const row of screen.querySelectorAll?.('[data-shopping-key]') || []) {
      const entry = entries.find(([key]) => key === row.dataset.shoppingKey);if (!entry) continue;
      const [, item] = entry, picked = checked(entry);
      row.hidden = Boolean(category && item.c !== category || filter === 'left' && picked || filter === 'picked' && !picked || !words.every(word => (item.name + ' ' + item.c).toLowerCase().includes(word)));
      if (!row.hidden) visible++;
    }
    for (const group of screen.querySelectorAll?.('[data-shopping-group]') || []) group.hidden = ![...group.querySelectorAll('[data-shopping-key]')].some(row => !row.hidden);
    const status = document.getElementById('tripStatus');if (status) status.textContent = visible + ' shown · ' + (entries.length - entries.filter(checked).length) + ' left to pick';
    const empty = document.getElementById('tripEmpty');if (empty) empty.hidden = visible > 0 || !entries.length;
    if (pendingFocus?.type === 'search') { const input = document.getElementById('tripQuery');input?.focus({ preventScroll: true });input?.setSelectionRange?.(pendingFocus.start, pendingFocus.end); }
    if (pendingFocus?.type === 'item') {
      const rows = [...(screen.querySelectorAll?.('[data-shopping-key]') || [])], index = rows.findIndex(row => row.dataset.shoppingKey === pendingFocus.key), current = rows[index];
      const target = current && !current.hidden ? current : rows.slice(index + 1).find(row => !row.hidden) || rows.find(row => !row.hidden);
      (target?.querySelector('input') || document.getElementById('tripQuery'))?.focus({ preventScroll: true });
    }
    if (pendingFocus?.type === 'control') screen.querySelector?.('[data-trip-control="' + pendingFocus.value + '"]')?.focus({ preventScroll: true });
    pendingFocus = null;
  }
  function redraw() { api.render(); }
  root.ShoppingTripUI = Object.freeze({ configure: value => { api = value; }, beforeRender, panel, apply,
    rememberFocus: key => { pendingFocus = { type: 'item', key }; }, search: value => { query = String(value).slice(0, 160);apply(); },
    filter: value => { if (['all', 'left', 'picked'].includes(value)) { filter = value;redraw(); } },
    category: value => { category = String(value).slice(0, 100);redraw(); }, focus: () => { focus = !focus;redraw(); },
    reset: () => { query = '';category = '';filter = 'all';redraw();document.getElementById('tripQuery')?.focus({ preventScroll: true }); } });
})(globalThis);
