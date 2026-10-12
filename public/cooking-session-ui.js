(function (root) {
  'use strict';
  const core = root.CookingSessionCore;
  let api, active = null, interval = null, wake = null, wakeRequest = false, generation = 0;
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const clock = seconds => Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  function inspect(value = api.state().cookingSession) {
    const recipe = value && api.recipe(value.id);
    return core.inspect(value, { state: api.state(), recipe, steps: recipe && api.steps(recipe),
      portions: value?.day != null ? api.portions(value.day, value.index) : null,
      cooked: value?.day != null ? api.cooked(value.day, value.index) : 0 });
  }
  function releaseWake() { if (wake) { void wake.release().catch(() => {});wake = null; } }
  async function acquireWake() {
    if (!active || wake || wakeRequest || document.hidden || !root.navigator?.wakeLock) return;
    const current = generation;wakeRequest = true;
    try {
      const requested = await navigator.wakeLock.request('screen');
      if (current !== generation || !active || document.hidden) await requested.release();
      else { wake = requested;requested.addEventListener?.('release', () => { if (wake === requested) wake = null; }); }
    } catch { /* Browsers may decline screen wake; cooking remains usable. */ }
    finally { wakeRequest = false;if (active && !document.hidden && current !== generation) void acquireWake(); }
  }
  function persistSession() {
    active = { ...active, savedAt: new Date().toISOString() };api.state().cookingSession = { ...active };api.save();api.changed();
  }
  function timerRows() {
    return api.state().kitchenTimers.map(timer => '<div class="kitchen-timer-row ' + (timer.status === 'done' ? 'timer-done' : '') + '"><span id="timerRemaining-' + timer.id + '" class="timer-clock" role="timer" aria-live="off">' + (timer.status === 'done' ? 'Finished' : clock(core.remaining(timer))) + '</span><div><b>' + html(timer.label) + '</b><small>' + (timer.status === 'paused' ? 'Paused' : timer.status === 'done' ? 'Time elapsed' : 'Running') + '</small></div><div class="timer-actions">' + (timer.status === 'running' ? '<button class="btn secondary small" data-kitchen-timer="' + timer.id + '" onclick="CookingSessionUI.pauseTimer(\'' + timer.id + '\')" aria-label="Pause ' + html(timer.label) + '">Pause</button>' : timer.status === 'paused' ? '<button class="btn secondary small" data-kitchen-timer="' + timer.id + '" onclick="CookingSessionUI.resumeTimer(\'' + timer.id + '\')" aria-label="Resume ' + html(timer.label) + '">Resume</button>' : '') + '<button class="text-button" data-kitchen-timer="' + timer.id + '" onclick="CookingSessionUI.cancelTimer(\'' + timer.id + '\')" aria-label="Remove ' + html(timer.label) + '">Remove</button></div></div>').join('');
  }
  function drawTimers() {
    const target = document.getElementById('cookTimer');if (!target) return;
    if (!api.state().kitchenTimers.length) target.textContent = 'No timer running';else target.innerHTML = timerRows();
  }
  function arm() {
    const running = api.state().kitchenTimers.some(row => row.status === 'running');
    if (running && interval === null) interval = setInterval(tick, 1000);
    if (!running && interval !== null) { clearInterval(interval);interval = null; }
  }
  function tick() {
    if (!api) return;
    const next = core.advance(api.state().kitchenTimers);
    if (next.completed.length) {
      api.state().kitchenTimers = next.values;api.save();drawTimers();api.changed();
      for (const id of next.completed) api.toast((next.values.find(row => row.id === id)?.label || 'Kitchen timer') + ' finished');
    }
    for (const timer of api.state().kitchenTimers) {
      const target = document.getElementById('timerRemaining-' + timer.id);
      if (target) target.textContent = timer.status === 'done' ? 'Finished' : clock(core.remaining(timer));
    }
    arm();
  }
  function timerControls() {
    return '<section class="cook-timer"><h3>Your kitchen timers</h3><div id="cookTimer" role="group" aria-label="Kitchen timers"></div><div class="actions">' + [2, 5, 10].map(value => '<button class="chip" onclick="ConsumerUI.setTimer(' + value + ')">' + value + ' min</button>').join('') + '</div><div class="grid"><div class="field"><label for="cookTimerLabel">Timer name</label><input id="cookTimerLabel" maxlength="100" placeholder="Rice, chicken, oats…"></div><div class="field"><label for="cookTimerMinutes">Minutes</label><input id="cookTimerMinutes" type="number" min="0.1" max="720" step="any" value="5"></div></div><button class="btn secondary small" onclick="ConsumerUI.customTimer()">Start timer</button><p class="sub">Up to three named timers. Times and paused timers survive reloads. Alerts need the app open; use your device alarm if you need a background alert.</p></section>';
  }
  function draw() {
    const recipe = api.recipe(active.id), steps = api.steps(recipe), base = Math.max(1, Number(recipe.servings) || 1), factor = recipe.fixedBatch ? Math.ceil(active.portions / base) : active.portions / base;
    const checked = inspect(active), note = root.RecipeExperience?.personalNote(recipe, api.state()) || '';
    const ingredients = (Array.isArray(recipe.ings)?recipe.ings:[]).map(row => '<div class="recipe-ing"><span>' + html(row[0]) + '</span><b>' + html(api.quantity(row, factor)) + '</b></div>').join('');
    api.openSheet('<div class="cooking-mode"><span class="eyebrow">Cooking mode · ' + html(api.portionLabel(active.portions)) + ' household portions</span><h2>' + html(recipe.name) + '</h2><p class="sub">Progress is saved on this device. Close and continue when you are ready.</p>' + (recipe.fixedBatch ? '<p class="sub">Whole batches prepare ' + html(api.portionLabel(factor * base)) + ' portions. Store any extra portions following the recipe.</p>' : '') + '<div class="cook-progress" role="progressbar" aria-label="Recipe steps" aria-valuemin="1" aria-valuemax="' + steps.length + '" aria-valuenow="' + (active.step + 1) + '"><i style="width:' + ((active.step + 1) / steps.length * 100) + '%"></i></div><p class="cook-step-count">Step ' + (active.step + 1) + ' of ' + steps.length + '</p><div class="cook-step" aria-live="polite">' + html(steps[active.step]) + '</div><div class="cook-step-actions"><button id="cookPrevious" class="btn secondary" ' + (!active.step ? 'disabled' : '') + ' onclick="ConsumerUI.step(-1)">Previous</button><button id="cookNext" class="btn" ' + (active.step === steps.length - 1 ? 'disabled' : '') + ' onclick="ConsumerUI.step(1)">Next step</button></div><details class="cook-ingredients"><summary>Ingredients for ' + html(api.portionLabel(active.portions)) + ' portions</summary>' + ingredients + '</details>' + (note ? '<details class="cooking-notes"><summary>Your cooking notes</summary><p class="personal-note-text">' + html(note) + '</p></details>' : '') + timerControls() + '<div class="actions">' + (active.day !== null && checked.ok ? '<button class="btn" onclick="ConsumerUI.finishCooking()">Review & record cooked meal</button>' : '') + '<button class="btn secondary" onclick="ConsumerUI.closeCooking()">Save & close</button></div><p class="sub">Steps and timers do not record cooking or food eaten. Record a planned meal when you finish.</p></div>');
    drawTimers();tick();
  }
  function start(id, day = null, index = null, prepPortions = null) {
    if (!api) return;
    const recipe = api.recipe(id), steps = api.steps(recipe), planned = day !== null || index !== null;
    const plannedPortions = planned ? api.portions(day, index) : null, cookedPortions = planned ? api.cooked(day, index) : null;
    const portions = planned ? plannedPortions - cookedPortions : prepPortions !== null ? Number(prepPortions) : Math.max(1, Number(api.state().profile.people) || 1);
    if (recipe.unavailable || !steps.length || recipe.servings === null || !Number.isFinite(portions) || portions <= 0 || portions > 1400 || planned && prepPortions !== null) { api.toast('Review the recipe steps, servings and batch portions first.');return; }
    const next = { id, step: 0, portions, signature: core.signature(recipe, steps), savedAt: new Date().toISOString(),
      day, index, planId: planned ? api.state().pantryLedger?.planId : null, plannedPortions, cookedPortions };
    const checked = inspect(next);if (!checked.ok) { api.toast(checked.reason);return; }
    cleanup();active = checked.value;persistSession();draw();void acquireWake();
  }
  function resume() {
    const checked = inspect();if (!checked.ok) { api.toast(checked.reason);return; }
    cleanup();active = checked.value;persistSession();draw();void acquireWake();
  }
  function cleanup() { generation++;active = null;releaseWake(); }
  function finish() {
    if (!active?.day) return;
    const checked = inspect(active);if (!checked.ok) { api.toast(checked.reason);return; }
    const { day, index } = active;cleanup();api.state().cookingSession = null;api.save();api.changed();api.record(day, index);
  }
  function saveTimers(values) { const focusId = document.activeElement?.dataset?.kitchenTimer;api.state().kitchenTimers = values;api.save();drawTimers();arm();api.changed();if (focusId) (document.querySelector?.('[data-kitchen-timer="' + focusId + '"]') || document.querySelector?.('[data-kitchen-timer]') || document.getElementById('cookTimerMinutes'))?.focus({ preventScroll: true }); }
  function setTimer(minutes) {
    tick();try { const label = document.getElementById('cookTimerLabel')?.value.trim() || (active ? api.recipe(active.id).name + ' · step ' + (active.step + 1) : 'Kitchen timer');saveTimers(core.create(api.state().kitchenTimers, minutes, label)); }
    catch (error) { api.toast(error.message); }
  }
  function panel() {
    if (!api) return '';
    const session = api.state().cookingSession, timers = api.state().kitchenTimers, checked = session && inspect();
    if (!session && !timers.length) return '';
    return '<section class="card kitchen-session-card"><span class="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h3>' + (session ? html(api.recipe(session.id).name) : 'Your kitchen timers') + '</h3>' + (session ? '<p class="sub">' + (checked.ok ? 'Step ' + (session.step + 1) + ' · ' + html(api.portionLabel(session.portions)) + ' portions saved' : html(checked.reason)) + '</p><div class="actions"><button class="btn small" ' + (!checked.ok ? 'disabled' : '') + ' onclick="CookingSessionUI.resume()">Continue cooking</button><button class="text-button" onclick="CookingSessionUI.discard()">Discard progress</button></div>' : '') + (timers.length ? '<p class="sub">' + timers.filter(row => row.status === 'running').length + ' running · ' + timers.filter(row => row.status === 'paused').length + ' paused · ' + timers.filter(row => row.status === 'done').length + ' finished</p><button class="btn secondary small" onclick="CookingSessionUI.openTimers()">Manage timers</button>' : '') + '</section>';
  }
  function restore() {
    cleanup();if (interval !== null) { clearInterval(interval);interval = null; }
    const state = api.state(), before = JSON.stringify([state.cookingSession, state.kitchenTimers]);core.normalizeState(state);
    if (before !== JSON.stringify([state.cookingSession, state.kitchenTimers])) api.save();arm();drawTimers();
  }
  root.CookingSessionUI = Object.freeze({ configure(value) { api = value;restore();document.addEventListener('visibilitychange', () => { if (document.hidden) releaseWake();else { tick();void acquireWake(); } });root.addEventListener?.('pagehide', cleanup); },
    start, resume, cleanup, restore, panel, finish, setTimer, tick,
    step(delta) { if (!active || !Number.isInteger(delta)) return;const checked = inspect(active);if (!checked.ok) { api.toast(checked.reason);return; }active.step = Math.max(0, Math.min(api.steps(api.recipe(active.id)).length - 1, active.step + delta));persistSession();draw();const next = document.getElementById(delta < 0 ? 'cookPrevious' : 'cookNext'), previous = document.getElementById(delta < 0 ? 'cookNext' : 'cookPrevious');(next?.disabled ? previous : next)?.focus({ preventScroll: true }); },
    close() { cleanup();api.closeModal(); }, discard() { cleanup();api.state().cookingSession = null;api.save();api.changed();api.toast('Saved cooking progress removed. Your meals and stock are unchanged.'); },
    customTimer() { setTimer(document.getElementById('cookTimerMinutes')?.value); },
    cancelTimer(id = null) { saveTimers(id ? api.state().kitchenTimers.filter(row => row.id !== id) : []); },
    pauseTimer(id) { saveTimers(core.pause(api.state().kitchenTimers, id)); }, resumeTimer(id) { saveTimers(core.resume(api.state().kitchenTimers, id)); },
    openTimers() { cleanup();api.openSheet('<h2>Your kitchen timers</h2>' + timerControls());drawTimers();tick(); } });
})(globalThis);
