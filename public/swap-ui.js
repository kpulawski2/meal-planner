/* On-demand whole-basket swap previews. Quotes never change saved meals. */
(function (root) {
  'use strict';
  let hooks = null, pending = null, sequence = 0, controller = null;
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const money = value => `£${Number(value).toFixed(2)}`;
  const node = id => root.document?.getElementById(id);
  const core = () => root.MealSwapCore;
  const recipes = () => hooks.getRecipes();
  const state = () => hooks.getState();
  const store = () => hooks.selectedStore();
  const stamp = () => hooks.catalogueStamp?.(store()) ?? null;
  const tell = message => hooks.toast?.(message);
  function signature(id = '') { return core().fingerprint(state(), recipes(), store(), stamp(), id ? [id] : []); }
  function allowed(recipe) { return hooks.allowed(recipe) && (!root.RecipeExperience?.allowedFeedback || root.RecipeExperience.allowedFeedback(recipe, state())); }
  function makeNext(id) {
    if (pending.prospective?.has(id)) return pending.prospective.get(id);
    const result = core().prospective({ state: state(), recipes: recipes(), day: pending.day, index: pending.index, replacementId: id,
      nutritionOf: hooks.nutritionOf, allowed, isCooked: root.PantryCore?.isCooked || (() => false) });
    pending.prospective?.set(id, result); return result;
  }
  function cancel() {
    ++sequence; controller?.abort(); controller = null; pending = null;
    hooks?.closeModal?.();
  }
  function score(recipe, current) {
    if (hooks.score) return hooks.score(recipe, current);
    const n = hooks.nutritionOf(recipe), before = hooks.nutritionOf(current);
    return (state().favorites || []).includes(recipe.id) * 4 + (root.RecipeExperience?.feedbackScore?.(recipe, state()) || 0) -
      Math.abs(Number(n.kcal || 0) - Number(before.kcal || 0)) * .002 - Math.abs(Number(n.p || 0) - Number(before.p || 0)) * .018;
  }
  function open(day, index) {
    if (!hooks || !core()) return;
    if (state().locked?.[`${day}::${index}`]) { tell('Unlock this meal before swapping it.'); return; }
    if (root.PantryCore?.isCooked?.(state(), day, index, recipes())) { tell('This meal has already been cooked. Choose another meal to swap.'); return; }
    const row = state().week.find(item => item.day === day), current = recipes().find(recipe => recipe.id === row?.meals?.[index]);
    if (!current) return;
    cancel();
    pending = { day, index, currentId: current.id, candidates: [], previews: new Map(), prospective: new Map(), baseline: null, displayed: 18,
      filters: { query: '', maxKcal: '', minProtein: '', dayTargets: true, safeOnly: false } };
    pending.candidates = recipes().filter(recipe => recipe.id !== current.id && allowed(recipe) && core().category(recipe) === core().category(current))
      .filter(recipe => hooks.nutritionOf(recipe)?.complete === true)
      .filter(recipe => { try { makeNext(recipe.id); return true; } catch { return false; } })
      .sort((a, b) => score(b, current) - score(a, current) || a.name.localeCompare(b.name));
    if (!pending.candidates.length) { pending = null; tell('No suitable alternatives available. Try adding a recipe or adjusting your preferences.'); return; }
    pending.baseSignature = signature(); render();
  }
  function currentSession() {
    if (!pending) return false;
    if (pending.baseSignature !== signature()) {
      controller?.abort(); ++sequence; controller = null; pending.previews.clear(); pending.prospective.clear(); pending.baseline = null;
      pending.baseSignature = signature(); pending.message = 'Your plan, pantry or settings changed. Check a swap again before choosing it.';
      return false;
    }
    return true;
  }
  function filtered() {
    if (!pending) return [];
    return pending.candidates.filter(recipe => {
      const f = pending.filters, hay = `${recipe.name} ${(recipe.ings || []).map(row => row[0]).join(' ')}`.toLowerCase();
      if (f.query && !hay.includes(f.query.toLowerCase())) return false;
      let next; try { next = makeNext(recipe.id); } catch { return false; }
      const people = Math.max(1, Number(state().profile.people) || 1), n = hooks.nutritionOf(recipe), factor = next.servings / people;
      if (f.maxKcal !== '' && (n.kcal === null || n.kcal === undefined || Number(n.kcal) * factor > Number(f.maxKcal))) return false;
      if (f.minProtein !== '' && (n.p === null || n.p === undefined || Number(n.p) * factor < Number(f.minProtein))) return false;
      if (f.dayTargets && !next.day.met) return false;
      if (f.safeOnly && !pending.previews.get(recipe.id)?.evaluation?.safe) return false;
      return true;
    });
  }
  function nutritionLine(day) {
    return day.complete ? `${Math.round(day.kcal)} kcal · ${Number(day.p.toFixed(1))}g protein / person` : 'Daily nutrition is incomplete';
  }
  function previewMarkup(recipe, preview) {
    if (preview?.status === 'loading') return '<div class="notice" role="status">Checking the full supermarket basket…</div>';
    if (preview?.status === 'error') return `<div class="notice" role="status">${html(preview.error)}</div>`;
    if (!preview?.evaluation) return '<p class="sub">Check the full basket before choosing. Household portions are kept.</p>';
    const e = preview.evaluation, day = preview.next.day;
    const delta = e.delta === null ? 'Change unavailable' : e.delta === 0 ? 'No change to checkout' : `${e.delta > 0 ? '+' : '−'}${money(Math.abs(e.delta))} vs current plan`;
    const cost = e.complete ? `${money(e.total)} plan total · ${html(delta)}` : `${money(e.subtotal)} priced subtotal · complete total unavailable`;
    const detail = e.spent ? `${money(e.spent)} already purchased + ${e.remaining === null ? 'unpriced' : money(e.remaining)} remaining shopping` : 'All remaining supermarket packs after pantry deductions';
    const reasons = [...(!e.budgetMet && e.complete ? [`${money(e.total - e.budget)} over the ${money(e.budget)} budget`] : []),
      ...(!e.nutritionMet ? ['Some days miss nutrition targets'] : []), ...(!e.slotsMet ? ['Some meals no longer suit your settings or meal slots'] : []),
      ...(!e.varietyMet ? ['Weekly variety targets not met'] : [])];
    const unknown = e.missing.length ? `Unpriced: ${e.missing.slice(0, 4).join(', ')}${e.missing.length > 4 ? '…' : ''}` : !e.complete ? 'Your purchase history has an unknown cost.' : '';
    const variety = e.variety && !e.variety.met ? '<details class="planner-help"><summary>Variety changes</summary><p>' + html(e.variety.violations.join(' ')) + '</p></details>' : '';
    const changes = [...(!e.budgetMet ? ['exceeds the budget'] : []), ...(!e.nutritionMet ? ['misses daily nutrition targets'] : []), ...(!e.varietyMet ? ['misses weekly variety targets'] : [])];
    return `<div class="notice swap-preview ${e.safe ? 'swap-safe' : e.complete && !e.budgetMet ? 'over' : ''}" aria-live="polite"><b>${html(cost)}</b><p class="sub">${html(detail)}</p><div>${html(nutritionLine(day))} · ${day.met ? 'Targets met' : 'Check targets'}</div><p class="sub">Before: ${html(nutritionLine(preview.next.beforeDay))}</p>${unknown ? `<p>${html(unknown)}</p>` : ''}${reasons.length ? `<p>${html(reasons.join(' · '))}</p>` : ''}${variety}</div>${e.complete && e.slotsMet && !e.safe ? `<label class="sub"><input type="checkbox" id="swapAccept-${arg(recipe.id)}" ${preview.acknowledged ? 'checked' : ''} onchange="MealSwapUI.acknowledge(decodeURIComponent('${arg(recipe.id)}'),this.checked)"> I understand this change ${html(changes.join(' and '))}.</label>` : ''}`;
  }
  function cards(list) {
    return list.map(recipe => {
      const preview = pending.previews.get(recipe.id), n = hooks.nutritionOf(recipe), people = Math.max(1, Number(state().profile.people) || 1);
      const portions = Number(state().mealServings?.[`${pending.day}::${pending.index}`] ?? people), factor = portions / people;
      const checked = Boolean(preview?.evaluation), apply = checked && preview.evaluation.complete && preview.evaluation.slotsMet && (preview.evaluation.safe || preview.acknowledged), portionLabel = Number(portions.toFixed(2));
      const busy = Boolean(controller), token = arg(recipe.id);
      return `<div class="swap-option"><div class="swap-option-top"><div class="swap-option-icon">${html(recipe.icon || '🍽️')}</div><div class="swap-option-main"><div class="swap-option-name">${html(recipe.name)}</div><div class="swap-option-meta">${html(recipe.cat)} · ${portionLabel} household portions<br>${n.kcal === null || n.kcal === undefined ? 'Calories unavailable' : `~${Math.round(n.kcal * factor)} kcal / person`} · ${n.p === null || n.p === undefined ? 'Protein unavailable' : `~${Number((n.p * factor).toFixed(1))}g protein / person`}</div></div></div><div class="swap-option-ings">${html(recipe.ings.slice(0, 4).map(row => row[0]).join(' · '))}</div>${previewMarkup(recipe, preview)}<div class="swap-option-actions"><button class="choose" ${busy ? 'disabled' : ''} onclick="MealSwapUI.check(decodeURIComponent('${token}'))">${checked ? 'Recheck basket' : 'Check swap'}</button>${checked ? `<button class="choose" ${!apply || busy ? 'disabled' : ''} onclick="MealSwapUI.choose(decodeURIComponent('${token}'))">${preview.evaluation.safe ? 'Choose this' : 'Choose with changes'}</button>` : ''}<button class="view" onclick="MealSwapUI.view(decodeURIComponent('${token}'))">View recipe</button></div></div>`;
    }).join('') || '<div class="swap-empty">No options pass these filters. Clear a filter or check some alternatives first.</div>';
  }
  function renderList() {
    if (!pending || !node('swapOptionList')) return;
    const list = filtered(), count = Math.min(pending.displayed, list.length);
    node('swapOptionList').innerHTML = cards(list.slice(0, count)) + (list.length > count ? '<button class="btn secondary small" onclick="MealSwapUI.more()">Show more recipes</button>' : '');
    if (node('swapResultCount')) node('swapResultCount').textContent = `${list.length} suitable alternatives · ${pending.previews.size} checked`;
    if (node('swapNotice')) node('swapNotice').textContent = pending.message || '';
  }
  function render() {
    if (!pending || !node('sheet')) return;
    currentSession();
    const current = recipes().find(recipe => recipe.id === pending.currentId), f = pending.filters;
    node('sheet').innerHTML = `<button class="close" aria-label="Close swaps" onclick="MealSwapUI.cancel()">×</button><h2>Swap ${html((current?.cat || 'meal').toLowerCase())}</h2><p class="sub">Replace ${html(current?.name || 'this meal')}. Compare your whole plan’s shopping bill before choosing.</p><div id="swapNotice" role="status"></div><div class="swap-search"><input id="swapSearch" type="search" value="${html(f.query)}" placeholder="Search recipes or ingredients…" oninput="MealSwapUI.filter()"></div><div class="swap-filters"><div class="swap-filter"><label for="swapMaxKcal">Meal kcal / person</label><input id="swapMaxKcal" type="number" min="0" value="${html(f.maxKcal)}" placeholder="Maximum" oninput="MealSwapUI.filter()"></div><div class="swap-filter"><label for="swapMinProtein">Meal protein / person</label><input id="swapMinProtein" type="number" min="0" value="${html(f.minProtein)}" placeholder="Minimum g" oninput="MealSwapUI.filter()"></div></div><div class="checkrow"><label><input id="swapDayTargets" type="checkbox" ${f.dayTargets ? 'checked' : ''} onchange="MealSwapUI.filter()"> Keep daily targets</label><label><input id="swapSafeOnly" type="checkbox" ${f.safeOnly ? 'checked' : ''} onchange="MealSwapUI.filter()"> Checked swaps within budget & targets</label></div><div class="swap-filter-tools"><span id="swapResultCount" aria-live="polite"></span><button type="button" onclick="MealSwapUI.reset()">Clear filters</button></div><div id="swapOptionList" class="swap-list"></div><div class="actions"><button class="btn secondary" onclick="MealSwapUI.cancel()">Cancel</button></div>`;
    node('modal').style.display = 'flex'; node('sheet').scrollTop = 0; renderList();
  }
  function filter() {
    if (!pending) return; currentSession();
    pending.filters = { query: node('swapSearch')?.value || '', maxKcal: node('swapMaxKcal')?.value || '', minProtein: node('swapMinProtein')?.value || '',
      dayTargets: Boolean(node('swapDayTargets')?.checked), safeOnly: Boolean(node('swapSafeOnly')?.checked) };
    pending.displayed = 18; renderList();
  }
  async function quote(items, signal) {
    if (!items.length) return core().basket(null, [], store());
    if (items.length > 200) throw new Error('This plan has too many ingredient quantities for one price check.');
    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { response = await hooks.fetchRecommendations(store(), items, signal); break; }
      catch (error) {
        if (signal.aborted || !error.retryable || attempt) throw error;
        if (hooks.delay) await hooks.delay(Math.max(1500, error.retryAfterMs || 0), signal); else throw error;
      }
    }
    return core().basket(response, items, store());
  }
  async function check(id) {
    if (!pending || controller || !currentSession()) { if (pending) renderList(); return; }
    const session = pending, start = signature(id), request = ++sequence;
    let next; try { next = makeNext(id); } catch (error) { tell(error.message); return; }
    const abort = new AbortController(); controller = abort;
    pending.message = ''; pending.previews.set(id, { status: 'loading' }); renderList();
    try {
      const beforeItems = core().shoppingItems(state(), recipes()), afterItems = core().shoppingItems(next.state, recipes());
      const before = session.baseline || await quote(beforeItems, abort.signal);
      if (abort.signal.aborted || pending !== session || request !== sequence) return;
      const after = await quote(afterItems, abort.signal);
      if (abort.signal.aborted || pending !== session || request !== sequence) return;
      if (start !== signature(id)) { currentSession(); session.previews.delete(id); session.message = 'Your plan, pantry or settings changed. Check again.'; return; }
      if (before.generation && after.generation && Date.parse(before.generation) !== Date.parse(after.generation)) { session.baseline = null; throw new Error('Supermarket prices changed during this check. Check the swap again.'); }
      const evaluation = core().evaluate({ state: state(), prospectiveState: next.state, before, after, day: next.day, recipes: recipes(), nutritionOf: hooks.nutritionOf, allowed });
      session.baseline = before;
      session.previews.set(id, { status: 'ready', next, evaluation, before, after, afterItems, fingerprint: start, checkedAt: Date.now(), acknowledged: false });
    } catch (error) {
      if (!abort.signal.aborted && pending === session && request === sequence) session.previews.set(id, { status: 'error', error: error?.message || 'The price check could not finish. Your meal is unchanged.' });
    } finally { if (controller === abort) controller = null; if (pending === session) renderList(); }
  }
  async function choose(id) {
    if (!pending || controller || !currentSession()) { if (pending) renderList(); return; }
    const session = pending, preview = session.previews.get(id);
    if (!preview?.evaluation?.complete || !preview.evaluation.slotsMet || !(preview.evaluation.safe || preview.acknowledged)) { tell('Check the full shopping bill before choosing this swap.'); return; }
    if (preview.fingerprint !== signature(id)) { session.previews.delete(id); session.message = 'Your recipe or plan changed. Check the swap again.'; renderList(); return; }
    let next; try { next = makeNext(id); } catch (error) { tell(error.message); return; }
    const abort = new AbortController(), request = ++sequence; controller = abort; session.message = 'Confirming current supermarket packs…'; renderList();
    try {
      const afterItems = core().shoppingItems(next.state, recipes()), after = await quote(afterItems, abort.signal);
      if (abort.signal.aborted || pending !== session || request !== sequence) return;
      if (preview.fingerprint !== signature(id)) { currentSession(); session.message = 'Your plan, pantry or settings changed. Check again.'; return; }
      if (!after.complete || Date.parse(after.generation || 0) !== Date.parse(preview.after.generation || 0) || Math.abs(Number(after.total) - Number(preview.after.total)) > .005) {
        session.baseline = null; session.previews.delete(id); session.message = 'Prices or pack availability changed. Check this swap again before choosing.'; return;
      }
      // Rebuild immediately before applying so a newly cooked slot cannot change.
      makeNext(id);
      const evaluation = core().evaluate({ state: state(), prospectiveState: next.state, before: preview.before, after, day: next.day, recipes: recipes(), nutritionOf: hooks.nutritionOf, allowed });
      if (!evaluation.complete || !evaluation.slotsMet || evaluation.safe !== preview.evaluation.safe) { session.previews.delete(id); session.message = 'Your plan checks changed. Check this swap again.'; return; }
      hooks.apply(next.state, { day: session.day, index: session.index, recipeId: id, evaluation, recommendations: after.recommendations,
        items: afterItems, generation: after.generation, wholePlanSafe: evaluation.safe });
      cancel(); hooks.renderAll?.(); tell(`${next.replacement.name} added to ${session.day}`);
    } catch (error) {
      if (!abort.signal.aborted && pending === session) session.message = error?.message || 'Could not confirm current prices. Your meal is unchanged.';
    } finally { if (controller === abort) controller = null; if (pending === session) renderList(); }
  }
  function acknowledge(id, checked) { const preview = pending?.previews.get(id); if (preview) { preview.acknowledged = Boolean(checked); renderList(); } }
  function view(id) {
    if (!pending) return; hooks.showRecipe(id);
    const actions = root.document?.querySelector('#sheet .actions');
    if (actions) { const back = root.document.createElement('button'); back.className = 'btn secondary'; back.textContent = 'Back to swaps'; back.onclick = render; actions.appendChild(back); }
  }
  root.MealSwapUI = Object.freeze({ configure(value) { hooks = value; }, open, render, filter, check, choose, cancel, acknowledge, view,
    more() { if (pending) { pending.displayed += 18; renderList(); } }, reset() { if (pending) { pending.filters = { query: '', maxKcal: '', minProtein: '', dayTargets: false, safeOnly: false }; render(); } },
    invalidate() { if (pending) { currentSession(); renderList(); } }, inspect() { return pending; } });
})(globalThis);
