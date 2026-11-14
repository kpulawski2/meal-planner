(function (root) {
  'use strict';
  let api, shownSession = null, shownWorkflow=null;
  const html = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const amount = value => Number(Number(value).toFixed(2)).toLocaleString('en-GB');
  const action = (label, method, id, extra = '') => '<button class="btn secondary small" ' + extra
    + ' onclick="MealPrepUI.' + method + '(decodeURIComponent(\'' + arg(id) + '\'))">' + label + '</button>';
  const dayLabel=day=>root.PlanCalendarCore?.label(api.state(),day)||day;
  const model = () => root.MealPrepCore.session(api.state(), api.recipes(), api.state().prepPlan?.scope);
  const open = content => { root.ConsumerUI?.cleanup(); api.openSheet(content); };
  function stats(value) {
    return '<div class="prep-stats"><div><b>' + value.tasks.length + '</b><span>Recipes to prepare</span></div><div><b>'
      + amount(value.remainingPortions) + '</b><span>Portions to prepare</span></div><div><b>' + amount(value.coveredPortions)
      + '</b><span>Cooked or leftovers</span></div></div>';
  }
  function panel() {
    if (!api) return '';
    const value = model();
    return '<div class="card prep-centre"><span class="eyebrow">Less cooking. More ready meals.</span><h3>Your prep centre</h3><p class="sub">'
      + html(value.scope.days.map(day => dayLabel(day.day)).join(' · ')) + '</p>' + stats(value)
      + '<button class="btn" onclick="MealPrepUI.openSession()">Build prep session</button><p class="sub">Group repeated meals, scale ingredients and keep later portions as leftovers.</p></div>';
  }
  function ingredientsHtml(rows) {
    return rows.map(row => '<div class="recipe-ing"><span>' + html(row.name) + '</span><b>' + html(amount(row.qty) + ' ' + row.unit)
      + (row.estimated ? ' <small>(estimate)</small>' : '') + '</b></div>').join('');
  }
  function taskHtml(task) {
    const blocked = task.reason || (!task.recipe || !api.allowed(task.recipe) ? 'Review the recipe and your current food settings.' : '');
    return '<article id="prepTask-' + arg(task.id) + '" class="prep-recipe card ' + (task.checked ? 'prep-organised' : '') + '"><div class="prep-recipe-heading"><span class="meal-icon">'
      + html(task.recipe?.icon || '🍽️') + '</span><div><span class="eyebrow">' + (task.fresh ? 'Make on the day' : task.waiting ? 'Start earlier' : 'Cook & portion')
      + '</span><h3>' + html(task.name) + '</h3></div></div><p class="sub">' + html(task.slots.map(slot => dayLabel(slot.day) + ' · ' + amount(slot.portions) + ' portions').join(' / '))
      + '</p><div class="prep-quantity"><strong>' + (task.preparedServings === null ? 'Amounts need review' : 'Prepare ' + amount(task.preparedServings) + ' portions')
      + '</strong>' + (task.preparedServings > task.portions ? '<small>Includes ' + amount(task.preparedServings - task.portions) + ' extra portions from a whole batch.</small>' : '')
      + '</div><p class="sub">' + html(task.recipe ? api.timeLabel(task.recipe) : '') + (task.recipe?.equipment?.length ? ' · ' + html(task.recipe.equipment.join(', ')) : '')
      + '</p>' + (blocked ? '<p class="prep-review">' + html(blocked) + '</p>' : '')
      + '<details class="planner-help"><summary>Scaled ingredients</summary>' + ingredientsHtml(task.requirements) + '</details><div class="actions">'
      + action('View recipe', 'viewRecipe', task.id, !task.recipe ? 'disabled' : '') + action('Cooking mode', 'cook', task.id, blocked ? 'disabled' : '')
      + (!task.fresh ? action('Record prepared batch', 'record', task.id, blocked ? 'disabled' : '') : '') + '</div><label class="prep-organise-check"><input type="checkbox" '
      + (task.checked ? 'checked' : '') + ' onchange="MealPrepUI.check(decodeURIComponent(\'' + arg(task.id) + '\'),this.checked)">Ingredients organised</label></article>';
  }
  function workflowHtml(value){
    const flow=root.MealPrepCore.workflow(value,api.steps||((r)=>r.method||[]),api.allowed);shownWorkflow=flow.signature;
    const saved=api.state().prepPlan?.guidedSession,checked=saved?.signature===flow.signature?(Array.isArray(saved.checked)?saved.checked.filter(i=>Number.isInteger(i)&&i>=0&&i<flow.steps.length):[]):[];
    return '<details class="card guided-prep" open><summary><b>Guided batch session</b> · '+checked.length+' / '+flow.steps.length+' steps</summary><p class="sub">Allow up to '+flow.containers+' one-portion containers; the size depends on each recipe. '+html(flow.equipment.join(' · '))+'</p>'+(flow.blocked?'<p role="status">'+flow.blocked+' recipes need review before preparation; see their cards below.</p>':'')+'<details class="planner-help"><summary>Shared prep ingredients</summary>'+ingredientsHtml(flow.ingredients)+'</details><ol>'+flow.steps.map((row,index)=>'<li style="margin:14px 0"><label><input type="checkbox" id="guidedStep'+index+'" '+(checked.includes(index)?'checked':'')+' onchange="MealPrepUI.checkStep('+index+',this.checked)"> '+html(row.text)+'</label>'+(row.ingredients?'<details class="planner-help"><summary>Quantities for this recipe batch</summary>'+(row.components?.length?row.components.map(group=>'<h4>'+html(group.name)+'</h4>'+ingredientsHtml(group.ings.map(([name,qty,unit])=>({name,qty,unit})))).join(''):ingredientsHtml(row.ingredients))+'</details>':'')+'</li>').join('')+'</ol><p class="sub">Start waiting recipes first; cook sequentially unless you can supervise separate equipment safely. Checking steps does not record cooking or eating. Use each recipe card to confirm its prepared batch.</p><div class="grid"><div class="field"><label for="prepTimerLabel">Timer name</label><input id="prepTimerLabel" maxlength="80" value="Batch prep"></div><div class="field"><label for="prepTimerMinutes">Minutes</label><input id="prepTimerMinutes" type="number" min="0.1" max="720" step="any" value="10"></div></div><div class="actions"><button class="btn secondary" onclick="MealPrepUI.startTimer()">Start timer</button><button class="btn secondary" onclick="CookingSessionUI.openTimers()">Manage timers</button></div><p class="sub">Timers run while the app is open. Up to three timers can run together.</p></details>';
  }
  function saveGuided(next){if(api.commit)api.commit(next);else{const previous=api.state().prepPlan;api.state().prepPlan=next.prepPlan;try{api.save();}catch(error){api.state().prepPlan=previous;throw error;}}}
  function checkStep(index,checked){try{const value=model(),flow=root.MealPrepCore.workflow(value,api.steps||((r)=>r.method||[]),api.allowed);if(flow.signature!==shownWorkflow||!Number.isInteger(index)||!flow.steps[index])throw new Error('The prep session changed. Reopen it before continuing.');const next=structuredClone(api.state()),old=next.prepPlan?.guidedSession;next.prepPlan=next.prepPlan||{};const ids=new Set(old?.signature===flow.signature&&Array.isArray(old.checked)?old.checked:[]);if(checked)ids.add(index);else ids.delete(index);next.prepPlan.guidedSession={signature:flow.signature,checked:[...ids].sort((a,b)=>a-b)};saveGuided(next);openSession();document.getElementById('guidedStep'+index)?.focus();}catch(error){api.toast(error.message);openSession();}}
  function startTimer(){try{const next=structuredClone(api.state());next.kitchenTimers=root.CookingSessionCore.create(next.kitchenTimers||[],Number(document.getElementById('prepTimerMinutes').value),document.getElementById('prepTimerLabel').value||'Batch prep');if(!api.commit)throw new Error('Reload the app to enable prep timers.');api.commit(next);root.CookingSessionUI.restore();api.renderAll();api.toast('Prep timer started');}catch(error){api.toast(error.message);}}
  function openSession() {
    if (!api) return;
    const value = model(); shownSession = value;
    const allDays = api.state().week || [], availableDays = Math.max(0, allDays.length - Math.max(0, allDays.findIndex(day => day.day === value.scope.startDay)));
    open('<div class="prep-session"><span class="eyebrow">Your week, in batches</span><h2>Build a prep session</h2><div class="grid"><div class="field"><label for="prepStartDay">First plan day</label><select id="prepStartDay" onchange="MealPrepUI.scopeChanged()">'
      + allDays.map(day => '<option value="' + html(day.day) + '" ' + (day.day === value.scope.startDay ? 'selected' : '') + '>' + html(dayLabel(day.day)) + '</option>').join('')
      + '</select></div><div class="field"><label for="prepDayCount">Days to prepare</label><select id="prepDayCount" onchange="MealPrepUI.scopeChanged()">'
      + Array.from({ length: Math.min(14, availableDays) }, (_, index) => index + 1).map(count => '<option value="' + count + '" '
        + (count === Math.min(value.scope.count, availableDays) ? 'selected' : '') + '>' + count + ' day' + (count === 1 ? '' : 's') + '</option>').join('')
      + '</select></div></div>' + stats(value) + '<p class="sub">Already cooked portions and matching leftovers are counted once across the plan. Start chilling or slow-cooking recipes earlier; make cereal and smoothie bowls fresh. Times are for the original recipe; larger batches can take longer. Follow each recipe’s storage instructions.</p>'
      + (value.tasks.length ? workflowHtml(value)+value.tasks.map(taskHtml).join('') : '<div class="empty">These meals are already cooked or covered by leftovers.</div>')
      + (value.ingredients.length ? '<details class="card planner-help"><summary>All ingredients for this session</summary><p class="sub">Amounts include complete batches. '
        + (value.completeIngredients ? 'Compare with your pantry before shopping.' : 'Some recipes need ingredient amounts confirmed; this list is partial.')
        + '</p>' + ingredientsHtml(value.ingredients) + '</details>' : '') + '<div class="actions"><button class="btn secondary" onclick="MealPrepUI.exportSession()">Save checklist</button><button class="btn secondary" onclick="closeModal()">Done</button></div></div>');
  }
  function scopeChanged() {
    const state = api.state(); state.prepPlan = state.prepPlan || {};
    state.prepPlan.scope = { startDay: document.getElementById('prepStartDay').value, count: Number(document.getElementById('prepDayCount').value) };
    api.save(); api.renderAll(); openSession();
  }
  function task(id) {
    const value = model();
    if (!shownSession || shownSession.revision !== value.revision || shownSession.scope.startDay !== value.scope.startDay
      || shownSession.scope.count !== value.scope.count) { api.toast('Your plan or stock changed. Open the prep session again.'); return null; }
    const current = value.tasks.find(row => row.id === id), shown = shownSession.tasks.find(row => row.id === id);
    if (!current || !shown || current.signature !== shown.signature) { api.toast('This batch changed. Open the prep session again.'); return null; }
    return current;
  }
  function viewRecipe(id) { const row = task(id); if (row?.recipe) {api.showRecipe(id);const actions=root.document?.querySelector?.('#sheet .actions');if(actions){const button=document.createElement('button');button.className='btn secondary';button.textContent='Back to prep session';button.onclick=openSession;actions.appendChild(button);}} }
  function cook(id) {
    const row = task(id); if (!row) return;
    if (row.reason || !api.allowed(row.recipe)) { api.toast(row.reason || 'Review your recipe and equipment settings first.'); return; }
    root.ConsumerUI.start(id, null, null, row.fresh ? row.slots[0].portions : row.portions);
  }
  function record(id) {
    const row = task(id); if (!row) return;
    try {
      if (!api.allowed(row.recipe)) throw new Error('Review your recipe and equipment settings first.');
      const request = root.MealPrepCore.batchRequest(row);
      const storage = row.recipe.freezeMinutes > 0 || row.recipe.passiveLabel === 'freeze' ? 'Freezer' : 'Fridge';
      root.PantryUI.openCook(request.day, request.index, request.extraServings, storage, '', request.portions);
    } catch (error) { api.toast(error.message); }
  }
  function check(id, checked) {
    const row = task(id); if (!row) return;
    const state = api.state(); state.prepPlan = state.prepPlan || {};
    const checks = new Map(Object.entries(state.prepPlan.sessionChecks || {}).filter(([, value]) => typeof value === 'string'));
    if (checked) checks.set(id, row.signature); else checks.delete(id);
    state.prepPlan.sessionChecks = Object.fromEntries([...checks].slice(-100)); api.save(); api.renderAll();
    document.getElementById('prepTask-' + arg(id))?.classList.toggle('prep-organised', Boolean(checked));
  }
  function exportSession() {
    const value = model(), lines = ['Meal Planner · prep session', 'Plan days: ' + value.scope.days.map(day => dayLabel(day.day)).join(', '),
      amount(value.remainingPortions) + ' portions to prepare; ' + amount(value.coveredPortions) + ' cooked or covered by leftovers.', '',
      'Start waiting recipes earlier. Timings are recipe estimates and can change with batch size.', 'Follow each recipe’s storage instructions.', ''];
    for (const row of value.tasks) {
      lines.push((row.checked ? '[x] ' : '[ ] ') + row.name, '  ' + (row.fresh ? 'Make fresh on the day.' : 'Prepare ' + amount(row.preparedServings || row.portions) + ' portions.'),
        '  Planned: ' + row.slots.map(slot => dayLabel(slot.day) + ' (' + amount(slot.portions) + ')').join(', '), '  ' + (row.recipe ? api.timeLabel(row.recipe) : ''),
        ...row.requirements.map(ingredient => '  ' + ingredient.name + ': ' + amount(ingredient.qty) + ' ' + ingredient.unit + (ingredient.estimated ? ' (estimate)' : '')),
        ...(row.reason ? ['  REVIEW: ' + row.reason] : []), '');
    }
    api.download('meal-prep-session.txt', lines.join('\n'), 'text/plain'); api.toast('Prep checklist saved');
  }
  function dateLabel(row) { return row.status === 'passed' ? 'Date passed · excluded from planning' : row.status === 'invalid' ? 'Check the recorded date'
    : row.status === 'undated' ? 'Add a leftover date' : row.days === 0 ? 'Due today' : row.days === 1 ? 'Due tomorrow' : 'Due in ' + row.days + ' days'; }
  function useSoonPanel() {
    if (!api) return '';
    const rows = root.MealPrepCore.dateAlerts(api.state()); if (!rows.length) return '';
    return '<div class="card use-soon"><div class="overview-heading"><h3>Use soon & check dates</h3><span class="pill">' + rows.length + '</span></div>'
      + rows.slice(0, 3).map(row => '<div class="use-soon-row"><div><b>' + html(row.name) + '</b><small>' + html(amount(row.amount) + ' ' + row.unit + ' · ' + row.storage)
        + '</small></div><span class="date-badge ' + (row.status === 'passed' || row.status === 'invalid' ? 'date-attention' : '') + '">' + html(dateLabel(row)) + '</span></div>').join('')
      + '<button class="btn secondary small" onclick="MealPrepUI.openDates()">Review dates</button><p class="sub">Uses dates you recorded. Check packaging and recipe storage notes.</p></div>';
  }
  function openDates() {
    const rows = root.MealPrepCore.dateAlerts(api.state());
    open('<h2>Use soon & check dates</h2><p class="sub">Use the date on the packaging, or follow your recipe’s storage guidance for cooked leftovers.</p>'
      + (rows.length ? rows.slice(0, 100).map((row, index) => '<div class="card"><b>' + html(row.name) + '</b><p class="sub">' + html(amount(row.amount) + ' ' + row.unit + ' · ' + row.storage)
        + '</p><p class="sub" id="prepDateStatus-' + index + '">' + html(dateLabel(row)) + '</p><div class="field"><label for="prepDate-' + index + '">Recorded expiry</label><input id="prepDate-' + index
        + '" type="date" value="' + html(row.status === 'invalid' ? '' : row.expiry) + '" onchange="MealPrepUI.date(\'' + row.collection + '\',decodeURIComponent(\'' + arg(row.id)
        + '\'),this.value,' + index + ')"></div></div>').join('') : '<div class="empty">No dates need attention in the next three days.</div>')
      + '<div class="actions"><button class="btn secondary" onclick="MealPrepUI.openDates()">Refresh list</button><button class="btn" onclick="closeModal()">Done</button></div>');
  }
  function date(collection, id, expiry, index) {
    const result = root.PantryCore.setExpiry(api.state(), id, expiry, collection);
    if (!result.ok) { api.toast(result.error); return; }
    api.save(); api.renderAll(); const status = document.getElementById('prepDateStatus-' + index);
    if (status) status.textContent = expiry ? 'Date saved: ' + expiry : 'Date cleared'; api.toast('Date saved');
  }
  function portionButtons(recipe, planned = false) {
    if (!api || recipe.servings === null) return '';
    const people = Math.max(1, Number(api.state().profile.people) || 1), seen = new Set();
    return '<div class="portion-presets" role="group" aria-label="Recipe portion shortcuts">'
      + [[1, '1 portion'], [people, 'Household'], [Number(recipe.servings) || 1, 'Recipe batch'], ...(!planned ? [[people * 3, '3 days']] : [])].filter(([value]) => {
        if (value < .25 || value > 100 || seen.has(value)) return false; seen.add(value); return true;
      }).map(([value, label]) => '<button class="chip" type="button" onclick="MealPrepUI.choosePortions(' + value + ',' + (label === '3 days') + ')">' + label + '</button>').join('') + '</div>';
  }
  function choosePortions(value, batchPreview = false) {
    const input = document.getElementById('recipeTargetServings'); if (!input || input.disabled || !Number.isFinite(value) || value < .25 || value > 100) return;
    input.value = value; api.updatePortions();
    if (input.dataset && batchPreview) input.dataset.prepBatchPreview = 'true';
  }
  root.MealPrepUI = Object.freeze({ configure(value) { api = value; }, panel, openSession, scopeChanged, viewRecipe, cook, record, check,
    checkStep,startTimer,exportSession, useSoonPanel, openDates, date, portionButtons, choosePortions });
})(globalThis);
