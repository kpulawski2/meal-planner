/* Read-only prep sessions and calendar-date reminders, using the stock ledger. */
(function (root) {
  'use strict';
  const EPS = 1e-6;
  const rounded = value => Number(value.toFixed(6));
  const quantity = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
  const dateOnly = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  function scope(state, options = {}) {
    const days = Array.isArray(state.week) ? state.week : [];
    const startDay = days.some(day => day.day === options.startDay) ? options.startDay : days[0]?.day;
    const start = Math.max(0, days.findIndex(day => day.day === startDay));
    const requested = Number(options.count);
    const count = Number.isInteger(requested) && requested > 0 ? Math.min(14, requested) : 3;
    return { startDay: startDay || '', count, days: days.slice(start, start + count) };
  }
  function session(state, recipes, options = {}, now = new Date()) {
    const selected = scope(state, options), coverage = root.PantryCore.plannerCoverage(state, recipes, now);
    const lookup = new Map(recipes.map(recipe => [recipe.id, recipe])), grouped = new Map();
    let planned = 0, covered = 0;
    for (const day of selected.days) for (const [index, id] of (day.meals || []).entries()) {
      const row = coverage[day.day + '::' + index]; if (!row) continue;
      planned += row.plannedPortions; covered += row.coveredPortions;
      if (row.remainingPortions <= EPS) continue;
      const recipe = lookup.get(id), task = grouped.get(id) || { id, recipe, slots: [], portions: 0 };
      task.slots.push({ day: day.day, index, portions: row.remainingPortions });
      task.portions += row.remainingPortions; grouped.set(id, task);
    }
    const ingredients = new Map();
    const tasks = [...grouped.values()].map(task => {
      task.portions = rounded(task.portions);
      const needed = root.PantryCore.requiredIngredients(task.recipe, task.portions);
      const missingEquipment = root.KitchenEquipment?.missing(task.recipe, state.profile) || [];
      const steps = Array.isArray(task.recipe?.method) ? task.recipe.method.filter(Boolean) : String(task.recipe?.method || '').trim();
      const fresh = (task.recipe?.tags || []).includes('smoothie-bowl');
      const waiting = Math.max(0, Number(task.recipe?.passiveMinutes) || 0, Number(task.recipe?.freezeMinutes) || 0);
      const reason = !needed.ok ? needed.error : !steps.length ? 'Review the recipe steps first.'
        : task.recipe?.unavailable || task.recipe?.needsReview ? 'Review this recipe first.'
        : missingEquipment.length ? 'Choose equipment: ' + missingEquipment.join(', ') : '';
      const prepIngredients = new Map((needed.requirements || []).map(row => [row.key, { ...row }]));
      if (needed.ok) for (const [name, qty, unit] of task.recipe.ings) {
        if (!root.MealBudgetCore.isCookingWater(name) || !quantity(qty)) continue;
        const meta = root.MealBudgetCore.unitMeta(unit, name), key = 'water::' + meta.dim;
        const row = prepIngredients.get(key) || { key, name: 'Water', qty: 0, unit: meta.label, estimated: meta.estimated };
        row.qty = rounded(row.qty + Number(qty) * needed.preparedServings / Number(task.recipe.servings ?? 1) * meta.factor);
        prepIngredients.set(key, row);
      }
      if (needed.ok) for (const row of prepIngredients.values()) {
        const total = ingredients.get(row.key) || { ...row, qty: 0 };
        total.qty = rounded(total.qty + row.qty); total.estimated ||= row.estimated; ingredients.set(row.key, total);
      }
      const signature = JSON.stringify([state.pantryLedger?.planId || '', root.PantryCore.recipeSignature(task.recipe),
        task.recipe?.method, task.recipe?.equipment, task.slots]);
      return { ...task, name: task.recipe?.name || 'Recipe unavailable', preparedServings: needed.preparedServings || null,
        requirements: [...prepIngredients.values()], reason, fresh, waiting, signature,
        checked: state.prepPlan?.sessionChecks?.[task.id] === signature };
    }).sort((a, b) => Number(Boolean(a.reason)) - Number(Boolean(b.reason)) || Number(a.fresh) - Number(b.fresh) || b.waiting - a.waiting || a.name.localeCompare(b.name));
    return { scope: selected, tasks, ingredients: [...ingredients.values()].sort((a, b) => a.name.localeCompare(b.name)),
      plannedPortions: rounded(planned), coveredPortions: rounded(covered), remainingPortions: rounded(planned - covered),
      completeIngredients: tasks.every(task => task.preparedServings !== null),
      revision: root.PantryCore.revision(state, recipes) };
  }
  function batchRequest(task) {
    if (!task || task.reason) throw new Error(task?.reason || 'Open your prep session again.');
    if (task.fresh) throw new Error('Make smoothie bowls fresh; record individual meals from your plan.');
    const first = task.slots[0]; if (!first) throw new Error('This batch is already covered.');
    const extra = rounded(task.portions - first.portions);
    if (extra > 100) throw new Error('Choose fewer days for this batch; at most 100 extra portions can be recorded at once.');
    return { day: first.day, index: first.index, portions: first.portions, extraServings: extra };
  }
  function dateAlerts(state, now = new Date(), days = 3) {
    const today = root.PantryCore.today(now), horizon = Math.max(0, Math.min(14, Number(days) || 0)), rows = [];
    for (const collection of ['pantry', 'leftovers']) for (const item of state[collection] || []) {
      const amount = quantity(collection === 'pantry' ? item?.qty : item?.servings); if (!(amount > EPS)) continue;
      const expiry = item.expiry || '', valid = dateOnly(expiry);
      const distance = valid ? Math.round((Date.parse(expiry + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000) : null;
      const status = expiry && !valid ? 'invalid' : distance !== null && distance < 0 ? 'passed'
        : distance !== null && distance <= horizon ? 'soon' : !expiry && collection === 'leftovers' ? 'undated' : null;
      if (!status) continue;
      rows.push({ id: item.id, collection, name: collection === 'pantry' ? item.name : item.recipeSnapshot?.name || item.recipeId,
        amount, unit: collection === 'pantry' ? item.unit : 'portions', storage: item.place || item.storage || '',
        expiry, days: distance, status });
    }
    const priority = { passed: 0, invalid: 1, soon: 2, undated: 3 };
    return rows.sort((a, b) => priority[a.status] - priority[b.status] || (a.days ?? 999) - (b.days ?? 999)
      || String(a.name).localeCompare(String(b.name)));
  }
  root.MealPrepCore = Object.freeze({ scope, session, batchRequest, dateAlerts });
})(globalThis);
