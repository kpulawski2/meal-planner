/* Pure whole-plan checks shared by the swap UI and its tests. */
(function (root) {
  'use strict';
  const amount = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  const category = recipe => {
    const name = String(recipe?.cat || '').trim().toLowerCase();
    return name === 'fruit' || name === 'snack' || name === 'snacks' ? 'snack' : name;
  };
  const key = (day, index) => `${day}::${index}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  function personalPayload(store) {
    if (!root.PersonalPricesCore) return {};
    const saved = root.PersonalPricesCore.read();
    try { return saved.ok ? root.PersonalPricesCore.requestPayload(saved.snapshot, { store }) : {}; } catch { return {}; }
  }
  function fingerprint(state, recipes, store, catalogue = null, extraIds = []) {
    const ids = new Set([...(state.week || []).flatMap(day => day.meals || []), ...extraIds]);
    const rows = recipes.filter(recipe => ids.has(recipe.id)).map(recipe => ({ id: recipe.id, name: recipe.name, cat: recipe.cat,
      ings: recipe.ings, servings: recipe.servings, fixedBatch: recipe.fixedBatch, kcal: recipe.kcal, p: recipe.p,
      c: recipe.c, f: recipe.f, nutritionStatus: recipe.nutritionStatus, nutrition: recipe.nutrition,
      equipment: recipe.equipment, unavailable: recipe.unavailable, dishFamily: recipe.dishFamily, copiedFrom: recipe.copiedFrom }));
    return JSON.stringify({ store, catalogue, personalPrices: personalPayload(store), profile: state.profile, week: state.week, mealServings: state.mealServings,
      locked: state.locked, pantry: state.pantry, ledger: state.pantryLedger, leftovers: state.leftovers,
      feedback: state.recipeFeedback, recent: state.recentMeals, rows });
  }
  function dayNutrition(state, recipes, day, nutritionOf, slotAllowed = () => true) {
    const row = state.week.find(item => item.day === day), people = Math.max(1, Number(state.profile?.people) || 1);
    const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
    let kcal = 0, p = 0, complete = Boolean(row?.meals?.length);
    const nutrients = [], factors = [];
    for (const [index, id] of (row?.meals || []).entries()) {
      const recipe = byId.get(id), n = recipe ? nutritionOf(recipe) : null;
      const servings = Number(state.mealServings?.[key(day, index)] ?? people);
      if (!recipe || !slotAllowed(recipe, day, index) || !n?.complete || !amount(n.kcal) || !amount(n.p) || !Number.isFinite(servings) || servings < .25 || servings > 100) { complete = false; continue; }
      kcal += Number(n.kcal) * servings / people; p += Number(n.p) * servings / people;
      nutrients.push(n); factors.push(servings / people);
    }
    const calories = Number(state.profile?.calories) || 2000;
    const targetProtein = amount(state.profile?.protein) ? Number(state.profile.protein) : 200;
    const macros = root.MacroGoalsCore, totals = macros ? macros.total(nutrients, factors) : {kcal,p};
    const limits = macros ? macros.targets(state.profile) : {min:calories*.9,max:calories*1.1};
    const met = complete && (macros ? nutrients.every(n=>macros.complete(n,state.profile)) && macros.meets(totals,state.profile) : kcal >= calories*.9-.05 && kcal <= calories*1.1+.05 && p >= targetProtein-.05);
    return { ...totals, complete, met, calorieMin: limits.min, calorieMax: limits.max, proteinMin: targetProtein };
  }
  function prospective({ state, recipes, day, index, replacementId, nutritionOf, allowed = () => true, isCooked = () => false, core = root.MealBudgetCore }) {
    if (!Array.isArray(state.week) || !state.week.length || !Number.isInteger(index) || index < 0) throw new Error('That meal is no longer in this plan.');
    const row = state.week.find(item => item.day === day), current = recipes.find(recipe => recipe.id === row?.meals?.[index]);
    const replacement = recipes.find(recipe => recipe.id === replacementId);
    if (!row || !current || !replacement || replacement.unavailable || current.id === replacement.id) throw new Error('That meal is no longer available.');
    if (state.locked?.[key(day, index)]) throw new Error('Unlock this meal before swapping it.');
    if (isCooked(state, day, index, recipes)) throw new Error('This meal has already been cooked. Choose another meal to swap.');
    const expected = core?.mealSlots(Number(state.profile?.meals) || row.meals.length)?.[index];
    if (!allowed(replacement) || category(current) !== category(replacement) || expected && category(replacement) !== expected.toLowerCase()) throw new Error('Choose a suitable recipe for this meal type.');
    const next = clone(state); next.week.find(item => item.day === day).meals[index] = replacementId;
    const changedDay = next.week.find(item => item.day === day), dayRecipes = changedDay.meals.map(id => recipes.find(recipe => recipe.id === id)).filter(Boolean);
    if (core?.distinctDishes && !core.distinctDishes(dayRecipes)) throw new Error('This dish is already planned on that day.');
    const servings = Number(next.mealServings?.[key(day, index)] ?? Math.max(1, Number(next.profile?.people) || 1));
    if (!Number.isFinite(servings) || servings < .25 || servings > 100) throw new Error('Check this meal’s portion count before swapping.');
    return { state: next, replacement, servings, day: dayNutrition(next, recipes, day, nutritionOf), beforeDay: dayNutrition(state, recipes, day, nutritionOf) };
  }
  function shoppingItems(state, recipes, core = root.MealBudgetCore, pantryCore = root.PantryCore) {
    if (!core?.buildShopping) throw new Error('The shopping calculator could not load.');
    const input = pantryCore?.shoppingInput ? pantryCore.shoppingInput(state, recipes) : { week: state.week, recipes, mealServings: state.mealServings,
      people: Math.max(1, Number(state.profile?.people) || 1), pantry: state.pantry || [] };
    const entries = Object.entries(core.buildShopping({ ...input, recipes })), items = [];
    for (const [nameKey, item] of entries) {
      const groups = Object.entries(item.groups || {}).filter(([, group]) => group.remaining > .0001);
      for (const [dimension, group] of groups) items.push({ key: `${nameKey}::${dimension}`, name: item.name, dimension, quantity: group.remaining });
      // Even partially measured ingredients need an unknown row. A known group
      // must never disguise a second missing amount as a complete basket.
      if (item.unknown) items.push({ key: `${nameKey}::unknown`, name: item.name, dimension: '', quantity: 0 });
    }
    return items;
  }
  function officialUrl(value, store, product = {}, item = {}) {
    if (product.priceBasis === 'personal' || String(value || '').startsWith('personal:')) return root.PersonalPricesCore?.productMatches?.(product, {store, ingredient:item.name, dimension:item.dimension}) === true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password && !url.port && (store === 'Asda'
        ? ['www.asda.com', 'groceries.asda.com'].includes(url.hostname) && /^\/(?:groceries\/)?product\//.test(url.pathname)
        : store === 'Lidl' && (url.hostname === 'www.lidl.co.uk' && /^\/p\/[^/]+\/p\d+\/?$/.test(url.pathname) || product.estimatedPrice === true && product.priceBasis === 'reference' && (url.hostname === 'www.lidl.co.uk' && /^\/static\/assets\/[^/]+\.pdf$/.test(url.pathname) || url.hostname === 'corporate.lidl.co.uk' && /^\/media-centre\/pressreleases\/\d{4}\/[\w!-]+$/.test(url.pathname))));
    } catch { return false; }
  }
  function planValid(plan, requested, store, item = {}) {
    if (!plan || !Array.isArray(plan.products) || !plan.products.length || !amount(plan.totalCostGBP) || !amount(plan.requestedQuantity) ||
      !(Number(plan.totalQuantity) > 0) || !Number.isFinite(Number(plan.totalQuantity)) || Math.abs(Number(plan.requestedQuantity) - requested) > .001 ||
      Number(plan.totalQuantity) < requested - .000001 || !(requested > 0)) return false;
    if (plan.products.some(product => product.priceBasis === 'personal') && plan.estimatedPrice !== true) return false;
    if (!plan.products.every(product => Number.isInteger(Number(product.packs)) && Number(product.packs) > 0 && amount(product.costGBP) &&
      amount(product.priceGBP) && Number(product.priceGBP) > 0 && Number(product.totalQuantity) > 0 && Number.isFinite(Number(product.totalQuantity)) &&
      product.available !== false && (product.priceBasis !== 'personal' || Boolean(item.dimension)) && officialUrl(product.url, store, product, item) && Math.abs(Number(product.costGBP) - Number(product.packs) * Number(product.priceGBP)) < .011)) return false;
    return Math.abs(plan.products.reduce((sum, product) => sum + Number(product.costGBP), 0) - Number(plan.totalCostGBP)) < .011 &&
      Math.abs(plan.products.reduce((sum, product) => sum + Number(product.totalQuantity), 0) - Number(plan.totalQuantity)) < .00001;
  }
  function basket(data, items, store) {
    if (!items.length) return { complete: true, subtotal: 0, total: 0, missing: [], recommendations: [], generation: data?.refreshedAt || null };
    if (!data || data.store !== store || !Array.isArray(data.recommendations) || !Number.isFinite(Date.parse(data.refreshedAt))) throw new Error('The supermarket returned an incomplete price check.');
    const wanted = new Set(items.map(item => item.key)), returned = data.recommendations.map(row => row?.key);
    if (new Set(returned).size !== returned.length || data.recommendations.length !== items.length || returned.some(name => !wanted.has(name))) throw new Error('The supermarket returned an incomplete price check.');
    let subtotal = 0; const missing = [];
    for (const item of items) {
      const row = data.recommendations.find(result => result.key === item.key);
      if (!row?.match || row.dimension !== item.dimension || !officialUrl(row.match.url, store, row.match, item) || !planValid(row.plan, item.quantity, store, item)) missing.push(item.name);
      else subtotal += Number(row.plan.totalCostGBP);
    }
    subtotal = Math.round(subtotal * 100) / 100;
    return { complete: !missing.length, estimatedPrice: data.recommendations.some(row => row.plan?.estimatedPrice), subtotal, total: missing.length ? null : subtotal, missing: [...new Set(missing)], recommendations: data.recommendations, generation: data.refreshedAt };
  }
  function spend(state, pantryCore = root.PantryCore) {
    const summary = pantryCore?.spentSummary?.(state, { planOnly: true });
    if (summary) return { total: Number(summary.totalCostGBP ?? summary.total ?? 0), complete: summary.known !== false && summary.complete !== false && amount(summary.totalCostGBP ?? summary.total) };
    const total = pantryCore?.spentTotal?.(state, { planOnly: true }) ?? 0;
    return { total: amount(total) ? Number(total) : 0, complete: amount(total) };
  }
  function evaluate({ state, prospectiveState, before, after, day, spending = spend(state), core = root.MealBudgetCore, recipes = [], nutritionOf = recipe => recipe.nutrition, allowed = () => true, cookedPortions = root.PantryCore?.cookedPortions || (() => 0) }) {
    const budget = Math.max(0, Number(state.profile?.budget) || 0) * Math.max(1, state.week.length) / 7;
    const priced = before.complete && after.complete && spending.complete && amount(spending.total);
    const beforeTotal = before.complete && spending.complete ? before.total + spending.total : null;
    const total = after.complete && spending.complete ? after.total + spending.total : null;
    const budgetMet = total !== null && total <= budget + .005;
    // Taste or diet changes apply to future choices. A past cooked slot remains
    // history; allowing that row must never allow a future occurrence of its ID.
    const historicalSlot = (dayName, index) => {
      const planned = Number(prospectiveState.mealServings?.[key(dayName, index)] ?? Math.max(1, Number(prospectiveState.profile?.people) || 1));
      return planned > 0 && Number(cookedPortions(prospectiveState, dayName, index, recipes)) >= planned - .000001;
    };
    const historicalIds = new Set(prospectiveState.week.flatMap(row => row.meals.filter((id, index) => historicalSlot(row.day, index))));
    const permitted = recipes.filter(recipe => !recipe.unavailable && (allowed(recipe) || historicalIds.has(recipe.id)));
    const slotAllowed = (recipe, dayName, index) => !recipe.unavailable && (allowed(recipe) || historicalSlot(dayName, index));
    const days = prospectiveState.week.map(row => ({ day: row.day, ...dayNutrition(prospectiveState, recipes, row.day, nutritionOf, slotAllowed) }));
    const nutritionMet = days.length > 0 && days.every(row => row.met);
    const slotsMet = prospectiveState.week.every(row => {
      const expected = core?.mealSlots?.(Number(prospectiveState.profile?.meals) || row.meals?.length);
      return Array.isArray(expected) && row.meals?.length === expected.length && row.meals.every((id, index) => {
        const recipe = permitted.find(item => item.id === id); return recipe && (!root.MealIntentCore || root.MealIntentCore.allowed(recipe,prospectiveState.profile,prospectiveState.week.indexOf(row)) || cookedPortions(prospectiveState,row.day,index,recipes)>0) && slotAllowed(recipe, row.day, index) && category(recipe) === expected[index].toLowerCase();
      });
    });
    const cookedMeals = Object.fromEntries(prospectiveState.week.flatMap(row=>row.meals.map((id,index)=>cookedPortions(prospectiveState,row.day,index,recipes)>0 ? [key(row.day,index),{recipeId:id}] : null).filter(Boolean)));
    const variety = core?.inspectVariety ? core.inspectVariety(prospectiveState.week, permitted, prospectiveState.profile, cookedMeals) : null;
    const varietyMet = variety?.met === true;
    return { complete: after.complete && spending.complete, estimatedPrice: after.estimatedPrice === true, beforeTotal, total, spent: spending.total, remaining: after.total, subtotal: after.subtotal + spending.total,
      delta: priced ? Math.round((total - beforeTotal) * 100) / 100 : null, budget, budgetMet, dayMet: day.met,
      nutritionMet, slotsMet, days, safe: after.complete && spending.complete && budgetMet && nutritionMet && slotsMet && varietyMet,
      variety, varietyMet, missing: after.missing, generation: after.generation, beforeGeneration: before.generation };
  }
  root.MealSwapCore = Object.freeze({ category, fingerprint, dayNutrition, prospective, shoppingItems, planValid, basket, spend, evaluate });
})(globalThis);
