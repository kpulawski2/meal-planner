(function (root) {
  'use strict';
  const EPS = 1e-6;
  const text = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
  function suggestions(recipes, pantry, portions = 1, now = new Date()) {
    if (!Number.isFinite(Number(portions)) || Number(portions) <= 0) return [];
    const stock = new Map(), soon = new Set(), core = root.MealBudgetCore;
    for (const lot of root.PantryCore.activePantry(pantry, now)) {
      const meta = core.unitMeta(lot.unit, lot.name);
      const key = core.canonicalIngredientName(lot.name) + '::' + meta.dim;
      const row = stock.get(key) || { qty: 0, estimated: false };
      row.qty += Number(lot.qty) * meta.factor;
      row.estimated ||= !!lot.estimated || meta.estimated;
      stock.set(key, row);
      const days = (Date.parse(lot.expiry) - Date.parse(root.PantryCore.today(now))) / 86400000;
      if (days >= 0 && days <= 3) soon.add(key);
    }
    return recipes.flatMap(recipe => {
      const needed = root.PantryCore.requiredIngredients(recipe, Number(portions));
      if (!needed.ok || !needed.requirements.length) return [];
      let coverage = 0, useUp = 0, estimated = false;
      const missing = [];
      for (const row of needed.requirements) {
        const lot = stock.get(row.key), available = lot?.qty || 0;
        coverage += Math.min(1, available / row.qty);
        if (available > EPS && soon.has(row.key)) useUp++;
        estimated ||= row.estimated || !!lot?.estimated;
        if (available + EPS < row.qty) missing.push({ ...row, qty: Number((row.qty - available).toFixed(6)) });
      }
      if (!coverage) return [];
      return [{ recipe, ready: !missing.length, missing, coverage: coverage / needed.requirements.length, useUp, estimated, preparedServings: needed.preparedServings }];
    }).sort((a, b) => Number(b.ready) - Number(a.ready) || a.missing.length - b.missing.length || b.useUp - a.useUp || b.coverage - a.coverage || a.recipe.name.localeCompare(b.recipe.name));
  }
  function normalizeRoutines(value) {
    const seen = new Set();
    return (Array.isArray(value) ? value : []).flatMap(row => {
      const id = text(row?.id, 120), name = text(row?.name, 60), meals = Number(row?.meals);
      if (!id || !name || seen.has(id) || ![2, 3, 4].includes(meals)) return [];
      const repeatMeals = {};
      for (const slot of root.MealBudgetCore.mealSlots(meals)) {
        const chosen = text(row.repeatMeals?.[slot], 120);
        if (chosen) repeatMeals[slot] = chosen;
      }
      if (!Object.keys(repeatMeals).length) return [];
      seen.add(id);
      return [{ id, name, meals, repeatMeals }];
    }).slice(0, 20);
  }
  function createRoutine(profile, name, id) {
    if (profile.varietyMode !== 'Repeat favourites') throw new Error('Choose Repeat favourites in Settings first.');
    const row = normalizeRoutines([{ id, name, meals: profile.meals, repeatMeals: profile.repeatMeals }])[0];
    if (!row) throw new Error('Name your routine and choose at least one daily meal.');
    return row;
  }
  function routineProfile(profile, routine, recipes, allowed = () => true) {
    const row = normalizeRoutines([routine])[0];
    if (!row) throw new Error('This routine is unavailable.');
    for (const [slot, id] of Object.entries(row.repeatMeals)) {
      const recipe = recipes.find(recipe => recipe.id === id);
      const rawCategory = String(recipe?.cat || '').trim().toLowerCase();
      const category = rawCategory.includes('fruit') || rawCategory === 'snacks' ? 'snack' : rawCategory;
      if (!recipe || category !== slot.toLowerCase() || !allowed(recipe)) throw new Error('Review the routine recipes and your current food settings first.');
    }
    return { ...profile, meals: row.meals, varietyMode: 'Repeat favourites', repeatMeals: { ...row.repeatMeals } };
  }
  root.KitchenToolsCore = Object.freeze({ suggestions, normalizeRoutines, createRoutine, routineProfile });
})(typeof window !== 'undefined' ? window : globalThis);
