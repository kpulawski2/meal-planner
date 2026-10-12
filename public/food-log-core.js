/* Dated, per-person consumption. Planned meals and pantry stock are separate. */
(function (root) {
  'use strict';
  const keys = ['kcal', 'p', 'c', 'f'];
  const text = (value, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const number = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  const copy = value => JSON.parse(JSON.stringify(value));
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function nutrition(raw = {}) {
    if (!number(raw.kcal) || Number(raw.kcal) > 100000) throw new Error('Enter valid calories or choose a food with a complete calorie estimate.');
    const result = { source: ['ingredients', 'recipe', 'label'].includes(raw.source) ? raw.source : 'label' };
    for (const key of keys) {
      if (raw[key] == null || raw[key] === '') result[key] = null;
      else if (!number(raw[key]) || Number(raw[key]) > 100000) throw new Error('Nutrition values must be non-negative numbers.');
      else result[key] = Number(raw[key]);
    }
    return result;
  }
  function definition(raw = {}) {
    const name = text(raw.name), unit = text(raw.unit, 20), quantity = Number(raw.quantity);
    if (!name || !['g', 'ml', 'piece', 'slice', 'tsp', 'tbsp', 'portion'].includes(unit) || !number(raw.quantity) || quantity <= 0 || quantity > 100000)
      throw new Error('Add a food name, serving amount and supported unit.');
    const provenance = root.BarcodeCore?.provenance(raw.provenance);
    return { name, unit, quantity, nutrition: nutrition(raw.nutrition), note: text(raw.note, 300), ...(provenance ? { provenance } : {}) };
  }
  function scaled(food, quantity) {
    const base = definition(food), amount = Number(quantity);
    if (!number(quantity) || amount <= 0 || amount > 100000) throw new Error('Enter the amount you ate.');
    const factor = amount / base.quantity;
    return nutrition(Object.fromEntries([...keys.map(key => [key, base.nutrition[key] === null ? null : base.nutrition[key] * factor]), ['source', base.nutrition.source]]));
  }
  function entry(raw = {}) {
    if (!validDate(raw.date) || !text(raw.id)) throw new Error('Choose a valid date for this food.');
    const food = definition(raw.food), quantity = Number(raw.quantity);
    return { id: text(raw.id, 180), date: raw.date, food, quantity,
      nutrition: scaled(food, quantity), originKey: text(raw.originKey, 240) || null };
  }
  function normalizeState(state) {
    const rows = [], ids = new Set(), origins = new Set();
    for (const raw of Array.isArray(state.foodLog) ? state.foodLog : []) {
      try {
        const row = entry(raw), key = row.date + '::' + row.originKey;
        if (ids.has(row.id) || row.originKey && origins.has(key) || rows.length >= 5000) continue;
        ids.add(row.id); if (row.originKey) origins.add(key); rows.push(row);
      } catch { /* Ignore malformed imported rows, retaining valid history. */ }
    }
    state.foodLog = rows;
    const foods = [], foodIds = new Set();
    for (const raw of Array.isArray(state.savedFoods) ? state.savedFoods : []) {
      try { if (!text(raw.id) || foodIds.has(raw.id) || foods.length >= 300) continue;
        foods.push({ ...definition(raw), id: text(raw.id, 180) }); foodIds.add(raw.id);
      } catch { /* A bad label must not become a zero-calorie food. */ }
    }
    state.savedFoods = foods;
    return state;
  }
  function record(state, input, { id = root.crypto?.randomUUID?.() || 'food-' + Date.now() + '-' + Math.random().toString(36).slice(2) } = {}) {
    const rows = Array.isArray(state.foodLog) ? state.foodLog : [];
    const row = entry({ ...input, id: input.id || id }), index = rows.findIndex(value => value.id === row.id);
    if (row.originKey && rows.some(value => value.id !== row.id && value.date === row.date && value.originKey === row.originKey))
      throw new Error('This planned meal is already logged for that date. Edit its entry to change the amount.');
    if (index < 0 && rows.length >= 5000) throw new Error('Your food diary is full. Export a backup before removing older entries.');
    state.foodLog = index < 0 ? [...rows, row] : rows.map(value => value.id === row.id ? row : value);
    return copy(row);
  }
  function saveFood(state, input, { id = root.crypto?.randomUUID?.() || 'label-' + Date.now() } = {}) {
    const food = { ...definition(input), id }, rows = Array.isArray(state.savedFoods) ? state.savedFoods : [];
    const previous = food.provenance && rows.find(row => root.BarcodeCore?.same(row.provenance?.barcode, food.provenance.barcode));
    if (previous) { food.id = previous.id; state.savedFoods = rows.map(row => row.id === previous.id ? food : row); return copy(food); }
    if (rows.length >= 300) throw new Error('Your saved food list is full.');
    state.savedFoods = [...rows, food];
    return copy(food);
  }
  function summary(state, date) {
    const rows = (state.foodLog || []).filter(row => row.date === date);
    const totals = {}, missing = {};
    for (const key of keys) {
      totals[key] = rows.reduce((sum, row) => sum + (number(row.nutrition?.[key]) ? Number(row.nutrition[key]) : 0), 0);
      missing[key] = rows.filter(row => !number(row.nutrition?.[key])).length;
    }
    return { rows: copy(rows), totals, missing, estimated: rows.some(row => row.nutrition?.source !== 'label') };
  }
  root.FoodLogCore = Object.freeze({ validDate, localDate, definition, scaled, normalizeState, record, saveFood, summary });
})(globalThis);
