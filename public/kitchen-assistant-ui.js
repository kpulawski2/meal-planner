(function (root) {
  'use strict';
  let api, brief = null, choices = [], selected = '', shown = null, opened = false, controller = null, generation = 0;
  const Core = () => root.KitchenAssistantCore;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const number = value => Number(Number(value).toFixed(2)).toLocaleString('en-GB');
  const field = (id, label, value, attrs = '') => '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" value="' + esc(value ?? '') + '" ' + attrs + ' onchange="KitchenAssistantUI.edit()"></div>';
  const select = (id, label, options, value) => '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '" onchange="KitchenAssistantUI.edit()">' + options.map(([id, name]) => '<option value="' + esc(id) + '" ' + (String(value) === String(id) ? 'selected' : '') + '>' + esc(name) + '</option>').join('') + '</select></div>';
  function panel() {
    return '<section class="card assistant-entry"><span class="eyebrow">A helping hand in the kitchen</span><h3>Kitchen assistant</h3><p class="sub">Got an ingredient and an idea? Turn it into a measured batch, with steps and a plan for later portions.</p><button class="btn secondary" onclick="KitchenAssistantUI.open()">Ask my kitchen assistant</button></section>';
  }
  function draft() {
    if (!api || !opened) return;
    api.state().kitchenAssistantDraft = { text: (document.getElementById('kitchenQuestion')?.value || '').slice(0, 2000), brief, selected };
    api.save();
  }
  async function open() {
    cancel(); root.ConsumerUI?.cleanup();
    const current = ++generation;
    await api.loadRecipes(); if (generation !== current) return;
    const state = api.state(), saved = state.kitchenAssistantDraft || {};
    try { brief = Core().normalise(saved.brief || {}, { people: Math.min(8, Math.max(1, Number(state.profile.people) || 1)) }); }
    catch { brief = Core().normalise(); }
    selected = typeof saved.selected === 'string' ? saved.selected : ''; opened = true;
    api.openSheet('<section class="kitchen-assistant"><span class="eyebrow">Your ingredients. Your next few meals.</span><h2>Kitchen assistant</h2><p>Tell me what you have and what you fancy. I’ll find measured recipes and help you prep a batch.</p><div class="field"><label for="kitchenQuestion">What would you like help with?</label><textarea id="kitchenQuestion" maxlength="2000" rows="4" oninput="KitchenAssistantUI.questionChanged()" placeholder="How should I prep my 1 kg of chicken for the next few days? I’m thinking curry.">' + esc(typeof saved.text === 'string' ? saved.text.slice(0, 2000) : '') + '</textarea></div><div class="assistant-examples" role="group" aria-label="Kitchen question examples"><button class="chip" onclick="KitchenAssistantUI.example(0)">1 kg chicken curry</button><button class="chip" onclick="KitchenAssistantUI.example(1)">Tofu stir fry</button><button class="chip" onclick="KitchenAssistantUI.example(2)">Turkey chilli</button></div><div class="actions"><button id="kitchenAsk" class="btn" onclick="KitchenAssistantUI.ask()">Help me prep</button></div><p class="sub">AI can interpret your question when available. Only this question and the prep fields are sent; your food diary and personal recipe notes stay on this device. You can edit the details below or use them offline.</p><p id="kitchenStatus" role="status" aria-live="polite"></p><div id="kitchenReview"></div></section>');
    renderReview();
  }
  function stopRequest() { controller?.abort(); controller = null; generation++; const button = document.getElementById('kitchenAsk'); if (button) button.disabled = false; }
  function cancel() { if (opened) draft(); opened = false; stopRequest(); shown = null; }
  function questionChanged() { stopRequest(); const status = document.getElementById('kitchenStatus'); if (status) status.textContent = 'Question saved. Choose Help me prep to update the suggestions.'; draft(); }
  function example(index) {
    const text = ['How should I prep 1 kg of raw chicken breast for the next 5 days? I’m thinking curry.', 'I have 800 g tofu. Can I make a stir fry for 4 days?', 'How do I prep 1 kg turkey mince as chilli for 5 days?'][index];
    if (!text) return; document.getElementById('kitchenQuestion').value = text; questionChanged(); void ask();
  }
  async function ask() {
    if (!opened || controller) return;
    const text = document.getElementById('kitchenQuestion').value.trim(), status = document.getElementById('kitchenStatus');
    let local; try { local = Core().parse(text, brief); } catch (error) { status.textContent = error.message; return; }
    const current = ++generation, questionController = new AbortController(); controller = questionController;
    const timeout = root.setTimeout(() => questionController.abort(), 22000);
    document.getElementById('kitchenAsk').disabled = true; status.textContent = 'Finding a practical prep idea…'; draft();
    let source = 'local';
    try {
      const response = await fetch('/api/kitchen/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, defaults: brief }), signal: questionController.signal });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json(); local = Core().normalise(data.brief); source = data.source === 'ai' ? 'ai' : 'local';
    } catch { /* Editable measured proposals also work offline or without AI. */ }
    finally { root.clearTimeout(timeout); if (controller === questionController) controller = null; }
    if (!opened || current !== generation || !document.getElementById('kitchenReview')) return;
    brief = local; selected = ''; status.textContent = (source === 'ai' ? 'Question interpreted with AI.' : 'Prep details gathered from your question.') + ' Review the weight, portions and ingredients below.';
    document.getElementById('kitchenAsk').disabled = false; renderReview(); draft();
  }
  function read() {
    const value = id => document.getElementById(id)?.value;
    return Core().normalise({ ingredient: value('kitchenIngredient'), grams: value('kitchenGrams'), basis: value('kitchenBasis'),
      days: value('kitchenDays'), people: value('kitchenPeople'), query: value('kitchenStyle') });
  }
  function edit() {
    if (!opened) return; stopRequest();
    try { brief = read(); selected = document.getElementById('kitchenRecipe')?.value || selected; renderReview(); draft(); }
    catch (error) { shown = null; document.getElementById('kitchenStatus').textContent = error.message; const result = document.getElementById('kitchenProposal'); if (result) result.innerHTML = '<p class="collection-notice">Correct the prep details to rebuild this batch.</p>'; }
  }
  function ready(recipe) {
    const n = api.nutrition({ ...recipe, nutritionStatus: 'estimated', kcal: null, p: null, c: null, f: null });
    return api.allowed(recipe) && n.complete && ['kcal', 'p', 'c', 'f'].every(key => Number.isFinite(n[key])) && api.steps(recipe).length > 0;
  }
  function build(recipe) { return Core().proposal(recipe, brief, api.steps(recipe)); }
  function renderReview() {
    choices = Core().candidates(api.recipes(), brief, ready).sort((a, b) => {
      const fat = recipe => { try { return Number(api.nutrition(build(recipe).recipe).f) || 0; } catch { return Infinity; } };
      return fat(a) - fat(b) || a.name.localeCompare(b.name);
    }).filter(recipe => { try { build(recipe); return true; } catch { return !brief.grams; } }).slice(0, 30);
    if (!choices.some(recipe => recipe.id === selected)) selected = choices[0]?.id || '';
    const node = document.getElementById('kitchenReview');
    node.innerHTML = '<h3>Review your prep details</h3><p class="sub">One equal meal portion per person each day. This is a batch idea; daily macro targets and your shopping budget are checked when fitting a full plan.</p><div class="grid">'
      + select('kitchenIngredient', 'Main ingredient', Core().ingredients.map(([name]) => [name, name]), brief.ingredient)
      + field('kitchenGrams', 'Weight available (g)', brief.grams, 'type="number" min="10" max="10000" step="any" placeholder="e.g. 1000"')
      + select('kitchenBasis', 'How was it weighed?', [['raw', 'Raw weight'], ['cooked', 'Cooked weight'], ['dry', 'Dry weight'], ['drained', 'Drained weight']], brief.basis)
      + field('kitchenDays', 'Days to cover', brief.days, 'type="number" min="1" max="14" step="1"')
      + field('kitchenPeople', 'People eating this batch', brief.people, 'type="number" min="1" max="8" step="1"')
      + field('kitchenStyle', 'Dish or flavour', brief.query, 'maxlength="120" placeholder="Curry, soup, pasta…"') + '</div>'
      + (choices.length ? select('kitchenRecipe', 'Recipe to use · lowest fat first', choices.map(recipe => [recipe.id, recipe.name]), selected)
        : '<div class="collection-notice">No measured, scalable recipe matches these details and your current food, equipment and cooking-time settings. Try a broader dish search, review your equipment in Settings, or import a recipe. Raw and cooked weights cannot be swapped; fixed appliance batches keep their original capacity in Recipes.</div>')
      + '<div id="kitchenProposal"></div>';
    renderProposal();
  }
  function renderProposal() {
    const result = document.getElementById('kitchenProposal'); shown = null;
    if (!brief.grams) { result.innerHTML = '<p class="collection-notice">Add the weighed ingredient amount to get a full batch guide.</p>'; return; }
    const source = choices.find(recipe => recipe.id === selected); if (!source) { result.innerHTML = ''; return; }
    try { shown = build(source); } catch (error) { result.textContent = error.message; return; }
    const batch = shown, n = api.nutrition(batch.recipe), storage = batch.storage;
    result.innerHTML = '<article class="assistant-proposal card"><span class="eyebrow">Your batch prep guide</span><h3>' + esc(source.name) + '</h3><p><strong>' + number(brief.grams) + ' g ' + esc(brief.basis + ' ' + brief.ingredient.toLowerCase()) + '</strong> → <strong>' + batch.portions + ' equal portions</strong></p><p class="sub">' + number(brief.grams / batch.portions) + ' g of the weighed ingredient per portion, before any cooking-weight change.</p><div class="assistant-macros" aria-label="Estimated nutrition per equal portion">'
      + [['kcal', 'kcal'], ['p', 'g protein'], ['c', 'g carbs'], ['f', 'g fat']].map(([key, label]) => '<span><b>' + (n.complete && Number.isFinite(n[key]) ? number(n[key]) : '—') + '</b> ' + label + '</span>').join('') + '</div><p class="sub">Estimates from the measured ingredients; actual products may differ. All sides listed below are included. Divide the whole batch equally.</p><h4>Ingredients for the entire batch</h4>'
      + batch.recipe.ings.map(row => '<div class="recipe-ing"><span>' + esc(row[0]) + '</span><b>' + esc(api.quantity(row)) + '</b></div>').join('')
      + '<h4>Prep & cook</h4><ol class="assistant-steps">' + [batch.recipe.changeNotice, ...api.steps(source)].map(step => '<li>' + esc(step) + '</li>').join('') + '</ol><section class="assistant-storage"><h4>Keep the next few days covered</h4><div class="assistant-storage-counts"><span><b>' + storage.chilled + '</b> portions in the fridge<br><small>Eat within ' + storage.fridgeHours + ' hours of cooking</small></span><span><b>' + storage.frozen + '</b> later portions to freeze<br><small>Freeze promptly after cooling</small></span></div><ol class="assistant-steps">' + storage.steps.map(step => '<li>' + esc(step) + '</li>').join('') + '</ol><p class="sub">Shorter recipe or packaging storage instructions take priority. If freezing is unsuitable or unavailable, prepare fewer days at once.</p><details><summary>Food Standards Agency guidance</summary>' + storage.sources.map(([name, url]) => '<p><a target="_blank" rel="noopener noreferrer" href="' + url + '">' + name + '</a></p>').join('') + '</details></section><div class="actions"><button class="btn" onclick="KitchenAssistantUI.viewSaved()">Save & view recipe</button><button class="btn secondary" onclick="KitchenAssistantUI.cook()">Save & start cooking</button><button class="btn secondary" onclick="KitchenAssistantUI.exportGuide()">Download prep guide</button></div><p class="sub">Saving creates a local recipe you can edit, favourite or add to your plan. Stock and food eaten are recorded separately.</p></article>';
  }
  function current() {
    if (!opened || !shown) throw new Error('Review a batch guide first.');
    const reviewed = read(), source = api.recipes().find(recipe => recipe.id === shown.sourceId);
    if (!source || !ready(source) || JSON.stringify(reviewed) !== JSON.stringify(brief)) throw new Error('Your prep details or settings changed. Refresh the guide first.');
    const next = Core().proposal(source, reviewed, api.steps(source));
    if (JSON.stringify(next) !== JSON.stringify(shown)) throw new Error('The source recipe changed. Refresh the guide first.');
    return next;
  }
  function saveBatch() {
    try {
      const batch = current(), signature = JSON.stringify([batch.sourceId, batch.brief, batch.recipe.ings, batch.recipe.method]);
      const existing = api.state().customRecipes.find(recipe => !recipe.needsReview && !recipe.unavailable && !recipe.fixedBatch && recipe.kitchenBatch?.signature === signature && JSON.stringify(recipe.ings) === JSON.stringify(batch.recipe.ings) && recipe.servings === batch.portions && JSON.stringify(recipe.method) === JSON.stringify(batch.recipe.method));
      if (existing) { api.toast('This batch recipe is already saved.'); return existing.id; }
      const recipe = { ...batch.recipe, id: 'user_prep_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        kitchenBatch: { signature, sourceId: batch.sourceId, brief: { ...brief } },
        copiedFrom: { recipeId: batch.sourceId, name: api.recipes().find(row => row.id === batch.sourceId).name, copiedAt: new Date().toISOString() } };
      api.addRecipe(recipe); api.save(); api.renderAll(); api.toast('Batch recipe saved. Open it from Recipes to edit or add to your plan.'); return recipe.id;
    } catch (error) { api.toast(error.message); return null; }
  }
  function viewSaved() { const id = saveBatch(); if (id) { cancel(); api.showRecipe(id); } }
  function cook() { const id = saveBatch(); if (id) { const portions = shown.portions; cancel(); root.ConsumerUI.start(id, null, null, portions); } }
  function exportGuide() {
    try {
      const batch = current(), storage = batch.storage;
      const lines = ['Meal Planner · kitchen assistant', batch.recipe.name, batch.portions + ' equal portions · ' + brief.days + ' days · ' + brief.people + ' people', '',
        'INGREDIENTS · ENTIRE BATCH', ...batch.recipe.ings.map(row => row[0] + ': ' + api.quantity(row)), '',
        'PREP & COOK', ...batch.recipe.method.map((step, index) => (index + 1) + '. ' + step), '',
        'STORAGE', storage.chilled + ' portions refrigerated, use within ' + storage.fridgeHours + ' hours; ' + storage.frozen + ' later portions to freeze promptly.',
        'Follow shorter recipe or pack instructions. If freezing is unsuitable or unavailable, prepare fewer days.', ...storage.sources.map(([label, url]) => label + ': ' + url)];
      api.download('kitchen-prep-guide.txt', lines.join('\n'), 'text/plain'); api.toast('Prep guide downloaded');
    } catch (error) { api.toast(error.message); }
  }
  root.KitchenAssistantUI = { configure: value => { api = value; }, panel, open, ask, example, edit, questionChanged, cancel, saveBatch, viewSaved, cook, exportGuide };
})(globalThis);
