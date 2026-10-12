/* Cooking progress and elapsed timers never record stock or food eaten. */
(function (root) {
  'use strict';
  const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
  function signature(recipe, steps) {
    const value = JSON.stringify([recipe.id, recipe.servings ?? 1, recipe.fixedBatch === true, recipe.ings, steps]);
    let hash = 2166136261;
    for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
    return 'v1:' + value.length + ':' + (hash >>> 0).toString(16);
  }
  function session(raw) {
    if (!raw || !text(raw.id, 120) || !text(raw.signature, 80) || !positive(raw.portions) || raw.portions > 1400
      || !Number.isInteger(raw.step) || raw.step < 0 || raw.step > 999 || typeof raw.savedAt !== 'string' || !Number.isFinite(Date.parse(raw.savedAt))) return null;
    const planned = raw.day != null || raw.index != null;
    if (planned && (!text(raw.day, 100) || !Number.isInteger(raw.index) || raw.index < 0 || raw.index > 999 || !text(raw.planId, 180))) return null;
    const plannedPortions = planned ? raw.plannedPortions ?? raw.portions : null;
    const cookedPortions = planned ? raw.cookedPortions ?? 0 : null;
    if (planned && (!positive(plannedPortions) || plannedPortions > 1400 || typeof cookedPortions !== 'number'
      || !Number.isFinite(cookedPortions) || cookedPortions < 0 || Math.abs(plannedPortions - cookedPortions - raw.portions) > .000001)) return null;
    return { id: text(raw.id, 120), signature: text(raw.signature, 80), portions: raw.portions, step: raw.step,
      savedAt: new Date(raw.savedAt).toISOString(), day: planned ? text(raw.day, 100) : null,
      index: planned ? raw.index : null, planId: planned ? text(raw.planId, 180) : null, plannedPortions, cookedPortions };
  }
  function inspect(raw, { state, recipe, steps, portions, cooked = 0 }) {
    const value = session(raw);
    if (!value) return { ok: false, reason: 'No saved cooking progress.' };
    if (!recipe || recipe.id !== value.id || recipe.unavailable || !steps?.length || recipe.servings === null) return { ok: false, reason: 'This recipe is unavailable. Open it to review its ingredients and steps.' };
    if (value.signature !== signature(recipe, steps)) return { ok: false, reason: 'The recipe has changed. Start it again to use the current ingredients and steps.' };
    if (value.day !== null) {
      const row = state.week?.find(row => row.day === value.day);
      if (state.pantryLedger?.planId !== value.planId || row?.meals?.[value.index] !== value.id
        || !positive(portions) || Math.abs(portions - value.plannedPortions) > .000001) return { ok: false, reason: 'The planned meal or its portions have changed. Start cooking from your current plan.' };
      if (cooked + .000001 >= value.plannedPortions) return { ok: false, reason: 'This meal is already recorded as cooked. Open the recipe or discard its saved progress.' };
      if (!Number.isFinite(cooked) || Math.abs(cooked - value.cookedPortions) > .000001) return { ok: false, reason: 'The recorded cooking portions have changed. Start again for the remaining portions.' };
    }
    return { ok: true, value: { ...value, step: Math.min(value.step, steps.length - 1) } };
  }
  function timers(raw, now = Date.now()) {
    const result = [], seen = new Set();
    for (const row of Array.isArray(raw) ? raw : []) {
      if (!/^[a-zA-Z0-9_-]{1,90}$/.test(row?.id || '') || seen.has(row.id) || !text(row.label, 100)
        || !['running', 'paused', 'done'].includes(row.status)) continue;
      if (row.status === 'running' && (!positive(row.deadline) || row.deadline > now + 43200000)) continue;
      if (row.status === 'paused' && (!positive(row.remainingMs) || row.remainingMs > 43200000)) continue;
      seen.add(row.id);result.push({ id: row.id, label: text(row.label, 100), status: row.status,
        deadline: row.status === 'running' ? row.deadline : null, remainingMs: row.status === 'paused' ? row.remainingMs : null });
      if (result.length === 3) break;
    }
    return result;
  }
  function remaining(timer, now = Date.now()) {
    return timer.status === 'paused' ? Math.ceil(timer.remainingMs / 1000) : timer.status === 'done' ? 0 : Math.max(0, Math.ceil((timer.deadline - now) / 1000));
  }
  function advance(raw, now = Date.now()) {
    const completed = [], values = timers(raw, now).map(row => {
      if (row.status === 'running' && row.deadline <= now) { completed.push(row.id);return { ...row, status: 'done', deadline: null }; }
      return row;
    });
    return { values, completed };
  }
  function create(raw, minutes, label, { now = Date.now(), id = root.crypto?.randomUUID?.() || 'timer-' + now + '-' + Math.random().toString(36).slice(2) } = {}) {
    const values = advance(raw, now).values, value = Number(minutes);
    if (!['number','string'].includes(typeof minutes) || !Number.isFinite(value) || value < .1 || value > 720) throw new TypeError('Choose a timer from 0.1 to 720 minutes.');
    if (values.length >= 3) throw new Error('Keep up to three timers. Remove a finished timer or cancel one first.');
    const timer = { id, label: text(label, 100) || 'Kitchen timer', status: 'running', deadline: now + value * 60000, remainingMs: null };
    if (!/^[a-zA-Z0-9_-]{1,90}$/.test(id) || values.some(row => row.id === id)) throw new TypeError('This timer needs a unique identifier.');
    return [...values, timer];
  }
  function pause(raw, id, now = Date.now()) {
    return advance(raw, now).values.map(row => row.id === id && row.status === 'running'
      ? { ...row, status: 'paused', remainingMs: row.deadline - now, deadline: null } : row);
  }
  function resume(raw, id, now = Date.now()) {
    return advance(raw, now).values.map(row => row.id === id && row.status === 'paused'
      ? { ...row, status: 'running', deadline: now + row.remainingMs, remainingMs: null } : row);
  }
  function normalizeState(state, now = Date.now()) {
    state.cookingSession = session(state.cookingSession);state.kitchenTimers = advance(state.kitchenTimers, now).values;
    return state;
  }
  root.CookingSessionCore = Object.freeze({ signature, session, inspect, timers, remaining, advance, create, pause, resume, normalizeState });
})(globalThis);
