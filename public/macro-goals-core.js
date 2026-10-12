/* Shared hard nutrition limits. Missing macros remain unknown. */
(function (root) {
  'use strict';
  const known = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  function normalise(value, strict = false) {
    const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const optional = (key, maximum) => {
      if (input[key] === null || input[key] === undefined || input[key] === '') return null;
      if (!known(input[key]) || Number(input[key]) > maximum) { if (strict) throw new TypeError('Check the ' + key + ' target.'); return null; }
      return Number(input[key]);
    };
    if (strict && input.calorieMode && !['range', 'max'].includes(input.calorieMode)) throw new TypeError('Choose a calorie range or maximum.');
    if (strict && input.carbMode && !['target', 'max'].includes(input.carbMode)) throw new TypeError('Choose a carbohydrate target or maximum.');
    return { calorieMode: input.calorieMode === 'max' ? 'max' : 'range', carbs: optional('carbs', 1000),
      carbMode: input.carbMode === 'max' ? 'max' : 'target', fatMax: optional('fatMax', 500), minimiseFat: input.minimiseFat === true };
  }
  function targets(profile = {}) {
    const goals = normalise(profile.nutritionTargets), calories = Number(profile.calories) || 2000;
    return { min: goals.calorieMode === 'max' ? 0 : calories * .9, max: calories * (goals.calorieMode === 'max' ? 1 : 1.1),
      protein: known(profile.protein) ? Number(profile.protein) : 200,
      carbMin: goals.carbs === null || goals.carbMode === 'max' ? 0 : goals.carbs * .9,
      carbMax: goals.carbs === null ? null : goals.carbs * (goals.carbMode === 'max' ? 1 : 1.1),
      fatMax: goals.fatMax, minimiseFat: goals.minimiseFat, requireC: goals.carbs !== null,
      requireF: goals.fatMax !== null || goals.minimiseFat };
  }
  function active(profile) { const value = normalise(profile?.nutritionTargets); return value.calorieMode === 'max' || value.carbs !== null || value.fatMax !== null || value.minimiseFat; }
  function complete(n, profile) { const goal = targets(profile); return n?.complete === true && known(n.kcal) && known(n.p)
    && (!goal.requireC || known(n.c)) && (!goal.requireF || known(n.f)); }
  function total(rows, factors) {
    return Object.fromEntries(['kcal', 'p', 'c', 'f'].map(key => [key, rows.every(row => known((row.n || row.nutrition || row)[key]))
      ? rows.reduce((sum, row, index) => sum + Number((row.n || row.nutrition || row)[key]) * factors[index], 0) : null]));
  }
  function meets(n, profile, tolerance = .000001) {
    const goal = targets(profile);
    return known(n?.kcal) && known(n.p) && n.kcalComplete !== false && n.pComplete !== false
      && n.kcal >= goal.min - tolerance && n.kcal <= goal.max + tolerance && n.p >= goal.protein - tolerance
      && (!goal.requireC || known(n.c) && n.cComplete !== false && n.cKnown !== false && n.c >= goal.carbMin - tolerance && n.c <= goal.carbMax + tolerance)
      && (!goal.requireF || known(n.f) && n.fComplete !== false && n.fKnown !== false && (goal.fatMax === null || n.f <= goal.fatMax + tolerance));
  }
  function summary(profile) {
    const value = normalise(profile.nutritionTargets), goal = targets(profile), number = value => Number(value.toFixed(1));
    return [value.calorieMode === 'max' ? 'At most ' + number(goal.max) + ' kcal' : number(goal.min) + '–' + number(goal.max) + ' kcal',
      'At least ' + number(goal.protein) + ' g protein', value.carbs === null ? '' : value.carbMode === 'max' ? 'At most ' + value.carbs + ' g carbs'
        : value.carbs + ' g carbs target (±10%)', value.fatMax === null ? '' : 'At most ' + value.fatMax + ' g fat', value.minimiseFat ? 'Prefer lower-fat options' : ''].filter(Boolean);
  }
  root.MacroGoalsCore = Object.freeze({ known, normalise, targets, active, complete, total, meets, summary });
})(globalThis);
