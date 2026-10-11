(function (root) {
  'use strict';
  let api;
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const amount = value => Number(value.toFixed(2)).toLocaleString('en-GB');
  const button = (label, action, id) => '<button class="btn secondary small" onclick="KitchenToolsUI.' + action + '(decodeURIComponent(\'' + arg(id) + '\'))">' + label + '</button>';
  function routines() { return root.KitchenToolsCore.normalizeRoutines(api.state().mealRoutines); }
  function routinesPanel() {
    if (!api) return '';
    const rows = routines(), lookup = new Map(api.recipes().map(recipe => [recipe.id, recipe.name]));
    return '<div class="card meal-routines"><h3>Meal routines</h3><p class="sub">Save your daily favourites, then reuse them whenever you want a familiar week. Your current targets and budget still apply.</p><div class="actions"><button class="btn secondary" onclick="KitchenToolsUI.openSave()">Save a routine</button></div>' + rows.map(row => '<div class="routine-row"><b>' + html(row.name) + '</b><p class="sub">' + row.meals + ' meals a day · ' + root.MealBudgetCore.mealSlots(row.meals).map(slot => html(slot + ': ' + (lookup.get(row.repeatMeals[slot]) || (row.repeatMeals[slot] ? 'Recipe unavailable' : 'Planner chooses')))).join('<br>') + '</p><div class="actions">' + button('Use routine', 'load', row.id) + button('Delete', 'remove', row.id) + '</div></div>').join('') + '</div>';
  }
  function openSave() {
    api.captureDraft();
    if (api.state().profile.varietyMode !== 'Repeat favourites' || !Object.values(api.state().profile.repeatMeals || {}).some(Boolean)) { api.showTab('profile'); api.toast('Choose Repeat favourites and your daily meals, then save a routine.'); return; }
    api.openSheet('<h2>Save your meal routine</h2><p class="sub">Saves your daily recipe choices and meal count. You can change targets or household size each time you use it.</p><div class="field"><label for="routineName">Routine name</label><input id="routineName" maxlength="60" placeholder="My oats, wraps & chicken week"></div><button class="btn" onclick="KitchenToolsUI.saveRoutine()">Save routine</button>');
  }
  function saveRoutine() {
    try {
      const rows = routines();
      if (rows.length >= 20) throw new Error('You have 20 routines. Delete one before saving another.');
      const row = root.KitchenToolsCore.createRoutine(api.state().profile, document.getElementById('routineName').value, 'routine-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
      api.state().mealRoutines = [...rows, row]; api.save(); api.closeModal(); api.renderAll(); api.toast('Meal routine saved');
    } catch (error) { api.toast(error.message); }
  }
  function load(id) {
    try {
      api.captureDraft();
      api.state().profile = root.KitchenToolsCore.routineProfile(api.state().profile, routines().find(row => row.id === id), api.recipes(), api.allowed);
      api.save(); api.renderAll(); api.showTab('profile'); api.toast('Routine selected. Review Settings, then Save & fit my plan.');
    } catch (error) { api.toast(error.message); }
  }
  function remove(id) { api.state().mealRoutines = routines().filter(row => row.id !== id); api.save(); api.renderAll(); api.toast('Routine deleted'); }
  function pantryPanel() {
    if (!api) return '';
    const portions = Math.max(1, Number(api.state().profile.people) || 1);
    const rows = root.KitchenToolsCore.suggestions(api.recipes().filter(api.allowed), api.state().pantry, portions).filter(row => row.ready || row.missing.length <= 2).slice(0, 6);
    return '<div class="card pantry-suggestions"><h3>Cook from my pantry</h3><p class="sub">For ' + html(portions) + ' household portion' + (portions === 1 ? '' : 's') + '. Each suggestion checks your stock separately. Add a meal to your plan to check the week’s budget and targets.</p>' + (rows.length ? rows.map(row => '<div class="routine-row"><b>' + html(row.recipe.name) + '</b><p class="sub">' + (row.ready ? 'Ready with your recorded stock' : 'Missing: ' + row.missing.map(item => html(item.name + ' · ' + amount(item.qty) + ' ' + item.unit)).join(', ')) + (row.estimated ? ' · uses estimated quantities' : '') + (row.useUp ? ' · uses stock expiring within 3 days' : '') + (row.preparedServings > portions ? ' · prepares ' + amount(row.preparedServings) + ' portions as a full batch' : '') + '</p><div class="actions"><button class="btn secondary small" onclick="showRecipe(decodeURIComponent(\'' + arg(row.recipe.id) + '\'))">Recipe</button><button class="btn small" onclick="openAddToPlan(decodeURIComponent(\'' + arg(row.recipe.id) + '\'))">Plan meal</button></div></div>').join('') : '<p class="sub">Add stock to find ready meals and recipes needing just one or two more ingredients.</p>') + '</div>';
  }
  root.KitchenToolsUI = { configure(value) { api = value; }, routinesPanel, pantryPanel, openSave, saveRoutine, load, remove };
})(typeof window !== 'undefined' ? window : globalThis);
