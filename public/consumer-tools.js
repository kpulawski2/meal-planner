/* Consumer features use the same catalogue quantities as the shopping list. */
(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const amount = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  function validPlan(plan, context = {}) {
    return Boolean(plan && Array.isArray(plan.products) && plan.products.length && amount(plan.totalCostGBP)
      && Number.isFinite(Number(plan.requestedQuantity)) && Number(plan.requestedQuantity) > 0
      && Number(plan.totalQuantity) + 1e-6 >= Number(plan.requestedQuantity)
      && (!plan.products.some(product => product.priceBasis === 'personal') || plan.estimatedPrice === true
        && plan.products.every(product => Number.isFinite(Number(product.totalQuantity)) && Number(product.totalQuantity) > 0)
        && Math.abs(plan.products.reduce((total, product) => total + Number(product.totalQuantity), 0) - Number(plan.totalQuantity)) <= 1e-5)
      && plan.products.every(product => Number.isInteger(Number(product.packs)) && Number(product.packs) > 0
        && amount(product.costGBP) && (product.priceBasis === 'personal' || String(product.url || '').startsWith('personal:')
          ? Boolean(context.dimension) && root.PersonalPricesCore?.productMatches?.(product, context) === true
            && Math.abs(Number(product.costGBP) - Number(product.packs) * Number(product.priceGBP)) < .011
          : /^https:\/\//.test(product.url || '')))
      && Math.abs(plan.products.reduce((total, product) => total + Number(product.costGBP), 0) - Number(plan.totalCostGBP)) < .011);
  }
  function snapshot(catalogue) {
    if (!catalogue || catalogue.status !== 'ready' || !['Asda', 'Lidl'].includes(catalogue.store)
      || !Array.isArray(catalogue.items) || catalogue.items.length > 400 || !catalogue.fingerprint
      || !Number.isFinite(catalogue.loadedAt) || catalogue.loadedAt <= 0) return null;
    const results = {};
    for (const item of catalogue.items) {
      const result = catalogue.results?.[item.key];
      if (!item.key || !result || result.key !== item.key) return null;
      if (result.match && (result.match.priceBasis === 'personal' || String(result.match.url || '').startsWith('personal:')) && root.PersonalPricesCore?.productMatches?.(result.match, { store: catalogue.store, dimension: item.dimension, ingredient: item.name }) !== true) return null;
      if (result.plan && !validPlan(result.plan, { store: catalogue.store, dimension: item.dimension, ingredient: item.name })) return null;
      results[item.key] = copy(result);
    }
    return { version: 1, store: catalogue.store, fingerprint: catalogue.fingerprint,
      items: copy(catalogue.items), results, loadedAt: catalogue.loadedAt,
      refreshedAt: catalogue.refreshedAt || null };
  }
  function restore(saved, store, fingerprint, now = Date.now()) {
    const checked = snapshot({ ...saved, status: 'ready' });
    if (!checked || saved.version !== 1 || checked.store !== store || checked.fingerprint !== fingerprint
      || checked.loadedAt > now + 60000) return null;
    return { ...checked, status: 'ready', offline: true, error: '', attempt: 0, retryAt: 0 };
  }
  function budgetSummary({ remaining = null, complete = false, spent = 0, budget = 0 } = {}) {
    const paid = amount(spent) ? Math.round(Number(spent) * 100) / 100 : 0;
    const limit = amount(budget) ? Number(budget) : 0;
    const known = complete && amount(remaining);
    const projected = known ? Math.round((paid + Number(remaining)) * 100) / 100 : null;
    return { spent: paid, remaining: known ? Number(remaining) : null, projected,
      budget: limit, left: projected === null ? null : Math.round((limit - projected) * 100) / 100,
      over: paid > limit + .005 || projected !== null && projected > limit + .005 };
  }
  function timerRemaining(deadline, now = Date.now()) {
    return Number.isFinite(Number(deadline)) && Number(deadline) > 0 ? Math.max(0, Math.ceil((Number(deadline) - now) / 1000)) : 0;
  }
  function pantryUnitCost(state, name, dimension, units = root.MealBudgetCore) {
    if (!units) return null;
    const key = units.canonicalIngredientName(name), rows = [];
    for (const transaction of state.pantryLedger?.transactions || []) {
      if (transaction.type !== 'purchase' || transaction.undoneAt) continue;
      for (const change of transaction.changes || []) {
        const lot = change.after;
        if (change.collection !== 'pantry' || !lot?.product || units.canonicalIngredientName(lot.name) !== key) continue;
        const meta = units.unitMeta(lot.unit, lot.name), quantity = Number(lot.qty) * meta.factor;
        if (meta.dim === dimension && quantity > 0 && amount(lot.product.costGBP)) rows.push({ cost: Number(lot.product.costGBP), quantity });
      }
    }
    return rows.length ? rows.reduce((total, row) => total + row.cost, 0) / rows.reduce((total, row) => total + row.quantity, 0) : null;
  }
  root.ConsumerTools = Object.freeze({ validPlan, snapshot, restore, budgetSummary, timerRemaining, pantryUnitCost });

  let cooking = null, wake = null, timer = null, interval = null;
  const html = value => typeof escape === 'function' ? escape(value) : String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  async function acquireWake() {
    if (!cooking || !root.navigator?.wakeLock || root.document?.hidden) return;
    try { const requested = await root.navigator.wakeLock.request('screen'); if (!cooking || root.document?.hidden) await requested.release(); else wake = requested; }
    catch { /* Cooking still works when the browser cannot keep the screen awake. */ }
  }
  function releaseWake() { if (wake) { wake.release().catch(() => {}); wake = null; } }
  function updateTimer() {
    const remaining = timerRemaining(timer?.deadline), target = root.document?.getElementById('cookTimer');
    if (target) target.textContent = timer ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : 'No timer running';
    if (timer && !remaining) { timer = null; clearInterval(interval); interval = null; if (typeof toast === 'function') toast('Cooking timer finished'); }
  }
  function drawCooking() {
    if (!cooking) return;
    const recipe = getRecipe(cooking.id), steps = recipeMethodSteps(recipe);
    if (!steps.length) return;
    cooking.step = Math.min(cooking.step, steps.length - 1);
    const index = cooking.step, context = cooking.day != null && cooking.index != null;
    const portions = cooking.portions, base = Math.max(1, Number(recipe.servings) || 1);
    const factor = recipe.fixedBatch ? Math.ceil(portions / base) : portions / base;
    const batchNote = recipe.fixedBatch ? '<p class="sub">Whole batches prepare ' + html(portionLabel(factor * base)) + ' portions.'
      + (factor * base > portions ? ' Store ' + html(portionLabel(factor * base - portions)) + ' extra portions following the recipe.' : '') + '</p>' : '';
    const ingredients = (recipe.ings || []).map(row => '<div class="recipe-ing"><span>' + html(row[0]) + '</span><b>' + html(ingredientQuantityLabel(row[1], row[2], factor, row[0])) + '</b></div>').join('');
    document.getElementById('sheet').innerHTML = '<button class="close" aria-label="Close cooking mode" onclick="ConsumerUI.closeCooking()">×</button><div class="cooking-mode"><span class="eyebrow">Cooking mode · ' + html(portionLabel(portions)) + ' household portions</span><h2>' + html(recipe.name) + '</h2>' + batchNote + '<div class="cook-progress" role="progressbar" aria-label="Recipe steps" aria-valuemin="1" aria-valuemax="' + steps.length + '" aria-valuenow="' + (index + 1) + '"><i style="width:' + ((index + 1) / steps.length * 100) + '%"></i></div><p class="cook-step-count">Step ' + (index + 1) + ' of ' + steps.length + '</p><div class="cook-step" aria-live="polite">' + html(steps[index]) + '</div><div class="cook-step-actions"><button class="btn secondary" ' + (!index ? 'disabled' : '') + ' onclick="ConsumerUI.step(-1)">Previous</button><button class="btn" ' + (index === steps.length - 1 ? 'disabled' : '') + ' onclick="ConsumerUI.step(1)">Next step</button></div><details class="cook-ingredients"><summary>Ingredients for ' + html(portionLabel(portions)) + ' portions</summary>' + ingredients + '</details><div class="cook-timer"><b id="cookTimer" role="timer"></b><div class="actions">' + [2, 5, 10].map(minutes => '<button class="chip" onclick="ConsumerUI.setTimer(' + minutes + ')">' + minutes + ' min</button>').join('') + '</div><div class="cook-custom-timer"><label for="cookTimerMinutes">Minutes</label><input id="cookTimerMinutes" type="number" min="0.1" max="720" step="any" value="5"><button class="btn secondary small" onclick="ConsumerUI.customTimer()">Start timer</button><button class="btn secondary small" onclick="ConsumerUI.cancelTimer()">Cancel</button></div><small class="sub">Timer runs while this app is open.</small></div><div class="actions">' + (context ? '<button class="btn" onclick="ConsumerUI.finishCooking()">Meal cooked</button>' : '') + '<button class="btn secondary" onclick="ConsumerUI.closeCooking()">Close cooking mode</button></div></div>';
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('sheet').scrollTop = 0;
    updateTimer();
  }
  root.ConsumerUI = Object.freeze({
    start(id, day = null, index = null, prepPortions = null) {
      if(root.CookingSessionUI)return root.CookingSessionUI.start(id,day,index,prepPortions);
      const recipe = getRecipe(id);
      if (!recipeMethodSteps(recipe).length || recipe.servings === null) { toast('Review the recipe steps and servings first.'); return; }
      const explicitPortions = Number(prepPortions);
      if (prepPortions !== null && (day !== null || index !== null || !Number.isFinite(explicitPortions) || explicitPortions <= 0 || explicitPortions > 1400)) { toast('Check the batch portions first.'); return; }
      cooking = { id, day, index, step: 0, portions: day != null && index != null ? getMealServings(day, index) : prepPortions !== null ? explicitPortions : Math.max(1, Number(state.profile.people) || 1) };
      drawCooking(); void acquireWake();
    },
    step(delta) { if(root.CookingSessionUI)return root.CookingSessionUI.step(delta); if (!cooking) return; const max = recipeMethodSteps(getRecipe(cooking.id)).length - 1; cooking.step = Math.max(0, Math.min(max, cooking.step + delta)); drawCooking(); },
    closeCooking() { if(root.CookingSessionUI)return root.CookingSessionUI.close(); cooking = null; releaseWake(); document.getElementById('modal').style.display = 'none'; },
    cleanup() { if(root.CookingSessionUI)return root.CookingSessionUI.cleanup(); cooking = null; releaseWake(); },
    finishCooking() { if(root.CookingSessionUI)return root.CookingSessionUI.finish(); if (!cooking) return; const { day, index } = cooking; cooking = null; releaseWake(); if (root.PantryUI?.openCook) root.PantryUI.openCook(day, index); },
    setTimer(minutes) { if(root.CookingSessionUI)return root.CookingSessionUI.setTimer(minutes); const value = Number(minutes); if (!Number.isFinite(value) || value < .1 || value > 720) return; timer = { deadline: Date.now() + value * 60000 }; if (!interval) interval = setInterval(updateTimer, 1000); updateTimer(); },
    customTimer() { if(root.CookingSessionUI)return root.CookingSessionUI.customTimer(); this.setTimer(document.getElementById('cookTimerMinutes')?.value); },
    cancelTimer() { if(root.CookingSessionUI)return root.CookingSessionUI.cancelTimer(); timer = null; clearInterval(interval); interval = null; updateTimer(); },
    cookingButton(id, day = null, index = null) { return '<button class="btn secondary small" onclick="ConsumerUI.start(decodeURIComponent(\'' + arg(id) + '\'),' + (day == null ? 'null' : 'decodeURIComponent(\'' + arg(day) + '\')') + ',' + (index == null ? 'null' : Number(index)) + ')">Cooking mode</button>'; },
    offlineNote(catalogue) { return catalogue.offline ? '<div class="offline-basket" role="status">Offline · saved prices checked ' + html(new Date(catalogue.loadedAt).toLocaleString()) + '. Refresh online before confirming a purchase or swap.</div>' : ''; },
  });
  root.document?.addEventListener?.('visibilitychange', () => { if (root.document.hidden) releaseWake(); else { updateTimer(); void acquireWake(); } });
})(globalThis);
