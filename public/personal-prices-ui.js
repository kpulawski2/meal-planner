/* Small local price notebook; inclusion in planning is a separate choice. */
(function (root) {
  'use strict';
  let api, editing = null;
  const core = () => root.PersonalPricesCore;
  const html = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const element = id => document.getElementById(id);
  function notify(result, message) {
    if (!result.ok) { status(result.error); return false; }
    api.onChange?.(result.snapshot); api.toast?.(message); return true;
  }
  function status(message) { const target = element('personalPriceStatus'); if (target) { target.textContent = message; target.focus(); } }
  function rowView(row) {
    const days = core().ageDays(row), age = days > 90 ? ' · More than 90 days old: excluded from planning. Recheck and update its date.' : days > 30 ? ' · Older price (' + days + ' days ago); check again before shopping.' : '';
    return '<article class="catalogue-product"><div><b>' + html(row.ingredient) + '</b><small>' + html(row.productName + ' · ' + row.packQuantity + ' ' + row.packUnit) + '</small></div><strong>£' + row.priceGBP.toFixed(2) + '</strong><p class="sub">Your ' + html(row.source === 'receipt' ? 'receipt' : 'shelf label') + ' price · ' + html(row.checkedAt) + (row.branch ? ' · ' + html(row.branch) : '') + html(age) + '</p><div class="actions"><button type="button" class="btn secondary small" onclick="PersonalPricesUI.edit(decodeURIComponent(\'' + arg(row.id) + '\'))" aria-label="Edit ' + html(row.productName) + '">Edit</button><button type="button" class="btn secondary small" onclick="PersonalPricesUI.remove(decodeURIComponent(\'' + arg(row.id) + '\'))" aria-label="Remove ' + html(row.productName) + '">Remove</button></div></article>';
  }
  function drawRows() {
    const result = core().read();
    if (!result.ok) { status(result.error); return; }
    element('personalPriceRows').innerHTML = result.snapshot.prices.length ? result.snapshot.prices.map(rowView).join('') : '<p class="sub">No personal prices saved. Add a pack you have checked in store or on your receipt.</p>';
    element('personalPriceIncluded').checked = result.snapshot.includeInPlanning;
  }
  function open(query = '') {
    if (!api) return;
    editing = null;
    const names = typeof api.ingredientNames === 'function' ? api.ingredientNames() : [];
    const suggestions = [...new Set((Array.isArray(names) ? names : []).filter(value => typeof value === 'string'))].slice(0, 500);
    api.open('<button class="close" aria-label="Close personal Lidl prices" onclick="PersonalPricesUI.close()">×</button><h2>Your Lidl pack prices</h2><p class="sub">Save the actual price of a pack you checked on a receipt or shelf label. These prices stay on this device. They are your observations, not verified website prices or live stock.</p><label><input id="personalPriceIncluded" type="checkbox" onchange="PersonalPricesUI.include(this.checked)"> Use my saved prices when planning and costing Lidl meals</label><p class="sub">When enabled, pack names, prices, dates and store notes are sent with your Lidl plan requests. Prices older than 30 days are labelled; those older than 90 days are excluded until you recheck them.</p><p id="personalPriceStatus" role="status" aria-live="polite" tabindex="-1"></p><div id="personalPriceRows"></div><h3 id="personalPriceFormHeading">Add a checked pack</h3><form id="personalPriceForm" onsubmit="event.preventDefault();PersonalPricesUI.save()"><div class="field"><label for="personalPriceIngredient">Recipe ingredient</label><input id="personalPriceIngredient" maxlength="160" required list="personalPriceIngredients" value="' + html(String(query).slice(0, 160)) + '" placeholder="For example: rolled oats"><datalist id="personalPriceIngredients">' + suggestions.map(name => '<option value="' + html(name) + '"></option>').join('') + '</datalist><small>Choose the exact ingredient you want this pack to cover.</small></div><div class="field"><label for="personalPriceProduct">Product name on the pack</label><input id="personalPriceProduct" maxlength="200" required placeholder="Enter the name from your pack"></div><div class="grid"><div class="field"><label for="personalPriceQuantity">Usable amount in one pack</label><input id="personalPriceQuantity" type="number" min="0.000001" max="1000000" step="any" required aria-describedby="personalPricePackHelp"></div><div class="field"><label for="personalPriceUnit">Pack unit</label><select id="personalPriceUnit"><option value="g">Grams (g)</option><option value="kg">Kilograms (kg)</option><option value="ml">Millilitres (ml)</option><option value="l">Litres (l)</option><option value="pieces">Pieces</option></select></div><div class="field"><label for="personalPriceAmount">Price for one pack (£)</label><input id="personalPriceAmount" type="number" min="0.01" max="10000" step="0.01" required aria-describedby="personalPricePackHelp"></div></div><p id="personalPricePackHelp" class="sub">Use a standard price for one pack. For tinned tuna or beans, enter the drained weight if the recipe uses drained food. Exclude member-only and multi-buy deals.</p><div class="grid"><div class="field"><label for="personalPriceDate">Date checked</label><input id="personalPriceDate" type="date" min="2000-01-01" max="' + core().today() + '" value="' + core().today() + '" required></div><div class="field"><label for="personalPriceSource">Price source</label><select id="personalPriceSource"><option value="receipt">My receipt</option><option value="shelf">Shelf label</option></select></div></div><div class="field"><label for="personalPriceBranch">Store location · optional</label><input id="personalPriceBranch" maxlength="160" placeholder="Alison Crescent, Sheffield S2 1AS"></div><div class="actions"><button class="btn" type="submit" id="personalPriceSave">Save pack price</button><button class="btn secondary" type="button" onclick="PersonalPricesUI.reset()">Clear form</button></div></form>');
    drawRows();
  }
  function reset() { editing = null; element('personalPriceForm').reset(); element('personalPriceFormHeading').textContent = 'Add a checked pack'; element('personalPriceSave').textContent = 'Save pack price'; }
  function save() {
    const raw = { store: 'Lidl', ingredient: element('personalPriceIngredient').value, productName: element('personalPriceProduct').value, packQuantity: element('personalPriceQuantity').value, packUnit: element('personalPriceUnit').value, priceGBP: element('personalPriceAmount').value, checkedAt: element('personalPriceDate').value, source: element('personalPriceSource').value, branch: element('personalPriceBranch').value };
    // Save once so storage quota or validation errors leave the existing row intact.
    const current = core().read(); if (!current.ok) { status(current.error); return; }
    try {
      const row = core().normalize(raw), next = current.snapshot;
      next.prices = next.prices.filter(value => value.id !== editing && value.id !== row.id);
      if (next.prices.length >= core().MAX_PRICES) throw new Error('Your saved-price list is full. Remove an old pack first.');
      next.prices.push(row);
      const result = core().write(next);
      if (notify(result, 'Personal pack price saved')) { reset(); drawRows(); status('Pack saved. ' + (result.snapshot.includeInPlanning ? 'It can be used for your next Lidl price check.' : 'Enable “Use my saved prices” when you want it included.')); }
    } catch (error) { status(error.message); }
  }
  function edit(id) {
    const result = core().read(); if (!result.ok) { status(result.error); return; }
    const row = result.snapshot.prices.find(value => value.id === id); if (!row) { status('This pack is no longer saved.'); return; }
    editing = id;
    for (const [key, field] of Object.entries({ ingredient: 'Ingredient', productName: 'Product', packQuantity: 'Quantity', packUnit: 'Unit', priceGBP: 'Amount', checkedAt: 'Date', source: 'Source', branch: 'Branch' })) element('personalPrice' + field).value = row[key];
    element('personalPriceFormHeading').textContent = 'Edit checked pack'; element('personalPriceSave').textContent = 'Update pack price'; element('personalPriceIngredient').focus();
  }
  root.PersonalPricesUI = Object.freeze({ configure(value) { api = value; }, open, close() { api?.close(); }, save, edit, reset,
    remove(id) { if (notify(core().remove(id), 'Personal pack price removed')) { if (editing === id) reset(); drawRows(); status('Pack removed.'); } },
    include(value) { if (notify(core().setIncluded(value), value ? 'Personal Lidl prices enabled' : 'Personal Lidl prices excluded')) { drawRows(); status(value ? 'Eligible saved pack prices will be used for your next Lidl plan and shopping check.' : 'Your saved pack prices are excluded from planning and shopping checks.'); } else { const current = core().read(); element('personalPriceIncluded').checked = current.ok && current.snapshot.includeInPlanning; } }
  });
})(typeof window !== 'undefined' ? window : globalThis);
