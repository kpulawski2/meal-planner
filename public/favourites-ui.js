(function (root) {
  'use strict';
  let api, query = '', category = 'All', limit = 60;
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function render() {
    if (!api) return;
    const ids = new Set(api.state().favorites || []), saved = api.recipes().filter(recipe => ids.has(recipe.id));
    const unavailable = ids.size - saved.length;
    document.getElementById('favourites').innerHTML = '<div class="section-title">Your favourites</div><p class="sub">' + saved.length + ' saved recipes. Keep the meals you love close at hand.</p><div class="recipe-toolbar"><div class="field"><label for="favouritesSearch">Search your favourites</label><input id="favouritesSearch" value="' + html(query) + '" placeholder="Meal or ingredient…" oninput="FavouritesUI.search(this.value)"></div><div class="collection-filters" role="group" aria-label="Favourite meal categories">' + ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fruit'].map(value => '<button type="button" class="chip ' + (value === category ? 'on' : '') + '" aria-pressed="' + (value === category) + '" onclick="FavouritesUI.category(\'' + value + '\')">' + (value === 'Snack' ? 'Snacks' : value) + '</button>').join('') + '</div></div>' + (unavailable ? '<p class="sub" role="status">' + unavailable + ' saved recipe' + (unavailable === 1 ? ' is' : 's are') + ' currently unavailable. Saved links are kept for when the collection loads.</p>' : '') + '<p id="favouritesCount" class="sub" aria-live="polite"></p><div id="favouritesResults"></div>';
    results();
  }
  function results() {
    const ids = new Set(api.state().favorites || []), q = query.trim().toLowerCase();
    const saved = api.recipes().filter(recipe => ids.has(recipe.id));
    const found = saved.filter(recipe => (category === 'All' || api.category(recipe) === category) && (recipe.name + ' ' + (recipe.ings || []).map(ingredient => ingredient[0]).join(' ')).toLowerCase().includes(q));
    document.getElementById('favouritesCount').textContent = 'Showing ' + Math.min(limit, found.length) + ' of ' + found.length + ' favourites';
    document.getElementById('favouritesResults').innerHTML = found.slice(0, limit).map(api.card).join('') + (found.length > limit ? '<div class="actions library-more"><button class="btn secondary" onclick="FavouritesUI.more()">Show 60 more</button></div>' : '') || '<div class="empty">' + (saved.length ? 'No favourites match this search or category.' : 'Tap the heart on a recipe to save it here.') + '<div class="actions"><button class="btn secondary" onclick="showTab(\'recipes\')">Browse recipes</button>' + (saved.length ? '<button class="btn secondary" onclick="FavouritesUI.reset()">Clear filters</button>' : '') + '</div></div>';
  }
  root.FavouritesUI = { configure(value) { api = value; }, render, search(value) { query = String(value); limit = 60; results(); }, category(value) { category = value; limit = 60; render(); }, more() { limit += 60; results(); }, reset() { query = ''; category = 'All'; limit = 60; render(); } };
})(typeof window !== 'undefined' ? window : globalThis);
