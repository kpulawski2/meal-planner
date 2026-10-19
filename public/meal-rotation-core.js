/* Recent plans guide future choices; explicit repeats and hard targets win. */
(function (root) {
  'use strict';
  const category = recipe => recipe?.cat === 'Fruit' ? 'Snack' : recipe?.cat;
  function fixedCategory(profile = {}, cat) {
    return profile.varietyMode === 'Repeat favourites' && Boolean(profile.repeatMeals?.[cat]) ||
      profile.varietyMode === 'Tailored' && profile.tailoredMeals?.[cat]?.mode === 'repeat';
  }
  function flavour(recipe = {}) {
    if (recipe.flavourProfile) return String(recipe.flavourProfile).slice(0, 60);
    const hay = [recipe.name, ...(Array.isArray(recipe.tags) ? recipe.tags : [])].join(' ').toLowerCase();
    const styles = [
      ['peri-peri', /peri[ -]?peri/], ['shawarma-gyros', /shawarma|gyros|kebab/],
      ['honey-garlic', /honey.*garlic|garlic.*honey/], ['sweet-chilli', /sweet.*chilli|sweet.*chili/],
      ['sweet-sour', /sweet.*sour|orange chicken/], ['teriyaki', /teriyaki|honey soy/],
      ['buffalo', /buffalo|nashville/], ['barbecue', /\bbbq\b|barbecue/],
      ['cajun', /cajun/], ['satay', /satay|peanut.*(?:chicken|tofu|noodle)/],
      ['curry', /curry|tikka|butter chicken|katsu/], ['mexican', /taco|burrito|fajita|chipotle/],
      ['burger', /burger|cheeseburger/], ['pizza', /pizza|margherita/],
      ['tuna-creamy', /tuna.*(?:skyr|yoghurt|yogurt|mayo|crunch|salad)/],
    ];
    return styles.find(([, pattern]) => pattern.test(hay))?.[0] || '';
  }
  function recent(state = {}) {
    return (Array.isArray(state.planHistory) ? state.planHistory : [])
      .filter(row => row && Array.isArray(row.week) && row.week.some(day => Array.isArray(day?.meals) && day.meals.length))
      .slice(0, 3);
  }
  function scores(recipes = [], state = {}) {
    const byId = new Map(recipes.map(row => [row.id, row])), exact = new Map(), styles = new Map();
    if (state.profile?.rotateMeals === false) return new Map();
    recent(state).forEach((plan, index) => {
      const weight = [12, 6, 3][index], counts = new Map(), flavours = new Set();
      for (const day of plan.week.slice(0, 14)) for (const id of (day?.meals || []).slice(0, 8)) {
        if (typeof id !== 'string') continue;
        counts.set(id, (counts.get(id) || 0) + 1);
        const recipe = byId.get(id), style = recipe && flavour(recipe);
        if (style) flavours.add(category(recipe) + '::' + style);
      }
      for (const [id, count] of counts) exact.set(id, (exact.get(id) || 0) + weight + Math.min(4, count - 1));
      for (const key of flavours) styles.set(key, (styles.get(key) || 0) + weight / 3);
    });
    return new Map(recipes.map(row => [row.id, fixedCategory(state.profile, category(row)) ? 0 :
      Math.min(40, (exact.get(row.id) || 0) + (styles.get(category(row) + '::' + flavour(row)) || 0))]));
  }
  function penalty(recipe, profile = {}) {
    if (profile.rotateMeals === false || fixedCategory(profile, category(recipe))) return 0;
    return Math.max(0, Math.min(40, Number(recipe.recentUseScore) || 0)) * 18;
  }
  function weekMemory(previousDays = []) {
    const memory = new Map();
    for (const row of previousDays.slice(0, 7).flatMap(day => day.rows || [])) {
      const cat = category(row), known = memory.get(cat) || { ids: new Set(), flavours: new Set() };
      known.ids.add(row.id); const style = flavour(row); if (style) known.flavours.add(style);
      memory.set(cat, known);
    }
    return memory;
  }
  function secondWeekPenalty(recipe, previousDays = [], profile = {}) {
    if (profile.rotateMeals === false || fixedCategory(profile, category(recipe))) return 0;
    const memory = previousDays instanceof Map ? previousDays : weekMemory(previousDays), rows = memory.get(category(recipe));
    return rows?.ids.has(recipe.id) ? 180 : rows?.flavours.has(flavour(recipe)) ? 45 : 0;
  }
  root.MealRotationCore = Object.freeze({ fixedCategory, flavour, recent, scores, penalty, weekMemory, secondWeekPenalty });
})(globalThis);
