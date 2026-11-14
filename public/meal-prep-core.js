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
  function session(state, recipes, options = {}, now = new Date(), methodOf = recipe => recipe?.method) {
    const selected = scope(state, options), coverage = root.PantryCore.plannerCoverage(root.PlanWorkspaceCore?.mode(state)==='next'?{...state,leftovers:[]}:state, recipes, now);
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
      const method = task.recipe ? methodOf(task.recipe) : null, steps = Array.isArray(method) ? method.filter(Boolean) : String(method || '').trim();
      const fresh = Boolean(task.recipe?.personalCereal) || (task.recipe?.tags || []).some(tag => ['smoothie-bowl','cereal'].includes(tag));
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
        steps, task.recipe?.equipment, task.slots]);
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
    if (task.fresh) throw new Error('Make smoothie bowls fresh, and add milk to cereal on the day; record individual meals from your plan.');
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
  function workflow(value,steps=recipe=>recipe.method||[],allowed=()=>true){
    const ready=value.tasks.filter(task=>!task.reason&&!task.fresh&&task.recipe&&allowed(task.recipe)),rows=[],ingredients=new Map();
    if(ready.length){rows.push({text:'Gather equipment and weigh the combined ingredients below. Keep each recipe’s portioned ingredients separate.'},{text:'Prepare vegetables before handling raw meat. Keep raw meat separate from ready-to-eat food; wash hands and clean utensils between tasks.'});}
    for(const task of ready){
      for(const ingredient of task.requirements){const old=ingredients.get(ingredient.key);if(old)old.qty=rounded(old.qty+ingredient.qty);else ingredients.set(ingredient.key,{...ingredient});}
      rows.push({ingredients:task.requirements,components:root.MealExtrasCore?.componentGroups(task.recipe,task.preparedServings)||[],recipeId:task.id,text:task.name+' — prepare '+task.preparedServings+' portions. Use the scaled quantities for this batch; follow the recipe’s temperatures and doneness checks.'+(task.waiting?' Start its waiting stage first, then prepare other dishes and return to finish.':'')});
      const method=steps(task.recipe),instructions=Array.isArray(method)?method:String(method||'').split(/\r?\n/);for(const text of instructions)if(typeof text==='string'&&text.trim())rows.push({recipeId:task.id,text:task.name+': '+text});
    }
    if(ready.length)rows.push({text:'Portion and label with the dish and cooking date. Cool hot food and refrigerate within two hours (rice within one hour). Eat refrigerated leftovers within two days (rice within 24 hours), or freeze later portions. Follow any shorter recipe or pack instructions.'});
    const fresh=value.tasks.filter(task=>task.fresh);if(fresh.length)rows.push({text:'Make fresh on the day: '+fresh.map(task=>task.name).join(', ')+'.'});
    return {steps:rows,ingredients:[...ingredients.values()].sort((a,b)=>a.name.localeCompare(b.name)),containers:Math.ceil(ready.reduce((sum,task)=>sum+task.preparedServings,0)),equipment:[...new Set(ready.flatMap(task=>task.recipe.equipment||[]))],blocked:value.tasks.filter(task=>task.reason||task.recipe&&!allowed(task.recipe)).length,signature:JSON.stringify([value.scope,ready.map(task=>task.signature),rows])};
  }
  root.MealPrepCore = Object.freeze({ workflow,scope, session, batchRequest, dateAlerts });
})(globalThis);
