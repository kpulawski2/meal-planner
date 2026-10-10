/* Shared shopping quantities for the browser and the catalogue worker. */
(function (root) {
  'use strict';
  const produceGrams = { cucumber: 300, banana: 120, apple: 180, pear: 170, lemon: 60, lime: 45, onion: 150, avocado: 150, orange: 150, mandarin: 80, carrot: 80, potato: 175, kiwi: 75, garlic: 50, lettuce: 250, melon: 700 };
  const spiceGrams = { cinnamon: 2.6, paprika: 2.3, cumin: 2.1, chilli: 1.8, curry: 2, herb: 1, dill: 1, seasoning: 2.5, cocoa: 2.5 };
  const canonicalIngredientName = name => String(name || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/\byogurt\b/g, 'yoghurt');
  const isCookingWater = name => /^(?:tap |cooking )?water$/.test(canonicalIngredientName(name));
  function unitMeta(unit, name) {
    const ingredient = canonicalIngredientName(name), u = String(unit || '').trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
    const words = ingredient.replace(/s\b/g, '').split(/[^a-z]+/);
    const produce = Object.keys(produceGrams).find(word => words.includes(word));
    const spice = Object.keys(spiceGrams).find(word => ingredient.includes(word));
    const liquid = /(?:\bmilk\b|\bjuice\b|\bsauce\b|\bdressing\b|\bstock\b)/.test(ingredient) && !/powder|cube|concentrat/.test(ingredient);
    const oil = /\boil\b/.test(ingredient), honey = /\bhoney\b/.test(ingredient);
    const meta = (dim, factor, label, note = '') => ({ dim, factor, label, estimated: !!note, note });
    if (['clove','cloves'].includes(u) && /\bgarlic\b/.test(ingredient)) return meta('mass', 3, 'g', 'Garlic cloves estimated at 3 g each; actual weights vary.');
    if (['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms'].includes(u)) {
      const factor = u.startsWith('k') ? 1000 : 1;
      if (oil || liquid) return meta('volume', factor / (oil ? .92 : 1), 'ml', oil ? 'Cooking oil density estimated at 0.92 g/ml.' : 'Liquid ingredient density estimated at 1 g/ml.');
      return meta('mass', factor, 'g');
    }
    if (['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters', 'l', 'litre', 'litres', 'liter', 'liters'].includes(u)) {
      const factor = u === 'l' || u.startsWith('lit') ? 1000 : 1;
      return honey ? meta('mass', factor * 1.42, 'g', 'Honey density estimated at 1.42 g/ml.') : meta('volume', factor, 'ml');
    }
    if (['tsp', 'teaspoon', 'teaspoons', 'tbsp', 'tablespoon', 'tablespoons'].includes(u)) {
      const tablespoon = u === 'tbsp' || u.startsWith('table'), multiplier = tablespoon ? 3 : 1;
      if (spice) return meta('mass', spiceGrams[spice] * multiplier, 'g', `Typical ${spice} spoon weight used; actual weights vary.`);
      if (oil || liquid) return meta('volume', 5 * multiplier, 'ml', 'Recipe teaspoons estimated at 5 ml and tablespoons at 15 ml.');
      if (honey) return meta('mass', 5 * multiplier * 1.42, 'g', 'Honey spoon amount uses 1.42 g/ml and 5 ml per teaspoon.');
      return meta(tablespoon ? 'tbsp' : 'tsp', 1, tablespoon ? 'tbsp' : 'tsp');
    }
    if (['slice', 'slices'].includes(u)) return /\bbread\b/.test(ingredient) ? meta('mass', 36, 'g', 'Bread slices estimated at 36 g each; actual slice weights vary.') : meta('slice', 1, 'slices');
    if (['portion', 'portions', 'serving', 'servings'].includes(u)) {
      if (/seasoning|curry powder/.test(ingredient)) return meta('mass', 5, 'g', 'Seasoning portions estimated at 5 g.');
      if (/sweetener/.test(ingredient)) return meta('mass', 1, 'g', 'Sweetener portions estimated at 1 g.');
      return meta('portion', 1, 'portions');
    }
    if (['piece', 'pieces', 'pcs', 'pc', 'each', 'ea', 'count', ''].includes(u)) {
      if (!u && /cinnamon|paprika|seasoning|oil|salt|pepper|sauce|stock|powder|spice/.test(ingredient)) return meta('unit', 1, 'units');
      if (produce && !/juice|sauce|powder|dried|oil/.test(ingredient)) return meta('mass', produceGrams[produce], 'g', `${produce[0].toUpperCase() + produce.slice(1)} estimated at ${produceGrams[produce]} g per item; actual weights vary.`);
      return meta('each', 1, 'pieces');
    }
    return meta('unit:' + u, 1, u || 'units');
  }
  function dayNames(count) { const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; return Array.from({ length: count }, (_, i) => names[i % 7] + (i >= 7 ? ' (Week 2)' : '')); }
  function mealSlots(count) { return Number(count) === 2 ? ['Lunch', 'Dinner'] : Number(count) === 3 ? ['Breakfast', 'Lunch', 'Dinner'] : ['Breakfast', 'Lunch', 'Dinner', 'Snack']; }
  // Shared by the browser and worker so a successful budget response is also
  // checked against the same visible variety policy before it replaces a plan.
  function proteinFamily(recipe) {
    const ingredients = (recipe?.ings || []).map(row => canonicalIngredientName(row[0]));
    const named = ingredients.join(' ');
    const animal = [['chicken', /\bchicken\b/], ['turkey', /\bturkey\b/], ['pork', /\bpork|\bham\b|\bbacon\b/], ['beef', /\bbeef\b/], ['lamb', /\blamb\b/], ['fish', /\btuna\b|\bsalmon\b|\bcod\b|\bfish\b|\bprawn|\bshrimp|\banchov/]];
    for (const [family, expression] of animal) if (ingredients.some(name => expression.test(name) && !/vegan|plant.based|meat.free/.test(name))) return family;
    if (/\blentils?\b/.test(named)) return 'lentils';
    if (ingredients.some(name => /\bbeans?\b|\bchickpeas?\b/.test(name) && !/\bgreen beans\b/.test(name))) return 'beans';
    if (/\btofu\b|\btempeh\b|\bedamame\b|\bsoy\b|\bsoya\b/.test(named)) return 'tofu';
    if (/\beggs?\b/.test(named)) return 'egg';
    if (/\bcheese\b|\bquark\b|\bskyr\b|\byoghurt\b/.test(named)) return 'dairy';
    if (/\bnuts?\b|\bpeanut\b|\balmond\b|\bwalnut\b/.test(named)) return 'nuts';
    return 'plant';
  }
  function varietyPolicy(profile = {}, count = Number(profile.days) || 7) {
    const days = Math.max(1, Math.min(14, count)), mode = ['Balanced', 'More variety', 'Budget focus'].includes(profile.varietyMode) ? profile.varietyMode : 'Balanced';
    return { mode, days, repeatLimit: Math.min(days, (mode === 'More variety' ? 2 : 3) * Math.ceil(days / 7)),
      minimumDistinct: Math.min(days, Math.ceil(days / (mode === 'More variety' ? 2 : 3))),
      sideRepeatLimit: Math.min(days, (mode === 'More variety' ? 3 : mode === 'Budget focus' ? 5 : 4) * Math.ceil(days / 7)),
      minimumSideDistinct: Math.min(days, mode === 'More variety' ? Math.max(2, Math.ceil(days / 3)) : 2),
      requiredFamilies: Math.min(3, days * 2), dominantFamilyLimit: days, avoidConsecutive: days > 1 };
  }
  function inspectVariety(week = [], recipes = [], profile = {}) {
    const policy = varietyPolicy(profile, week.length || Number(profile.days) || 7), byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
    const categoryIds = Object.fromEntries(mealSlots(Number(profile.meals) || week[0]?.meals?.length || 4).map(category => [category, new Set()])), recipeCounts = Object.create(null), families = Object.create(null), violations = [];
    let mainMeals = 0;
    for (const [dayIndex, day] of week.entries()) for (const [slot, id] of (day.meals || []).entries()) {
      const recipe = byId.get(id);
      if (!recipe) continue;
      const category = recipe.cat === 'Fruit' ? 'Snack' : recipe.cat;
      if (!categoryIds[category]) continue;
      categoryIds[category].add(id); recipeCounts[id] = (recipeCounts[id] || 0) + 1;
      if (!['Lunch', 'Dinner'].includes(category)) continue;
      mainMeals++;
      const family = proteinFamily(recipe); families[family] = (families[family] || 0) + 1;
      if (policy.avoidConsecutive && dayIndex && week[dayIndex - 1]?.meals?.[slot] === id) violations.push(`${recipe.name || id} repeats on consecutive days.`);
    }
    const distinctRecipes = Object.fromEntries(Object.entries(categoryIds).map(([category, ids]) => [category, ids.size]));
    const minimumDistinctByCategory = Object.fromEntries(Object.keys(categoryIds).map(category => [category, ['Lunch', 'Dinner'].includes(category) ? policy.minimumDistinct : policy.minimumSideDistinct]));
    const repeatLimitByCategory = Object.fromEntries(Object.keys(categoryIds).map(category => [category, ['Lunch', 'Dinner'].includes(category) ? policy.repeatLimit : policy.sideRepeatLimit]));
    for (const [category, count] of Object.entries(distinctRecipes)) if (count < minimumDistinctByCategory[category]) violations.push(`${category} needs at least ${minimumDistinctByCategory[category]} different recipes; this plan has ${count}.`);
    for (const [id, count] of Object.entries(recipeCounts)) { const recipe = byId.get(id), category = recipe?.cat === 'Fruit' ? 'Snack' : recipe?.cat, limit = repeatLimitByCategory[category] || policy.repeatLimit; if (count > limit) violations.push(`${recipe?.name || id} appears ${count} times; the limit is ${limit}.`); }
    const proteinFamilies = Object.keys(families), dominantFamilyCount = Math.max(0, ...Object.values(families));
    const availableFamilies = [...new Set(recipes.filter(recipe => ['Lunch', 'Dinner'].includes(recipe.cat)).map(proteinFamily))];
    const requiredFamilies = Math.min(policy.requiredFamilies, availableFamilies.length);
    if (proteinFamilies.length < requiredFamilies) violations.push(`Main meals need ${requiredFamilies} protein families; this plan has ${proteinFamilies.length}.`);
    if (mainMeals && dominantFamilyCount > Math.ceil(mainMeals / 2)) violations.push(`One protein family supplies ${dominantFamilyCount} of ${mainMeals} main meals; the limit is half.`);
    return { met: !violations.length, mode: policy.mode, repeatLimit: policy.repeatLimit, repeatLimitByCategory, minimumDistinctByCategory, distinctRecipes, proteinFamilies,
      availableFamilies, requiredFamilies, familyCounts: { ...families }, dominantFamilyCount, dominantFamilyLimit: Math.ceil(mainMeals / 2),
      recipeCounts: { ...recipeCounts }, mainMeals, violations };
  }
  function buildShopping({ week = [], recipes = [], mealServings = {}, people = 1, pantry = [] } = {}) {
    const byId = new Map(recipes.map(recipe => [recipe.id, recipe])), map = Object.create(null), stock = Object.create(null);
    const uses=[], batches=new Map();
    for (const day of week) for (const [index, id] of (day.meals || []).entries()) {
      const recipe = byId.get(id); if (!recipe) { const key = `unknown recipe ${id}`; map[key] = { name: key, groups: Object.create(null), unknown: true, pantryNotes: [], quantityNotes: [] }; continue; }
      const portions = Number(mealServings[`${day.day}::${index}`]) || Number(people) || 1;
      if(recipe.fixedBatch){const previous=batches.get(id)||{recipe,portions:0};previous.portions+=portions;batches.set(id,previous);}else uses.push({recipe,portions});
    }
    for(const use of batches.values())uses.push(use);
    for(const {recipe,portions} of uses){
      const yieldCount=Math.max(1,Number(recipe.servings)||1),purchased=recipe.fixedBatch?Math.ceil((portions-.000001)/yieldCount)*yieldCount:portions,scale=purchased/yieldCount;
      for (const [rawName, rawQuantity, rawUnit] of recipe.ings || []) {
        const name = String(rawName || '').trim().replace(/\s+/g, ' '); if (!name) continue;
        if (isCookingWater(name)) continue;
        const key = canonicalIngredientName(name), meta = unitMeta(rawUnit, name), quantity = Number(rawQuantity);
        const item = map[key] || (map[key] = { name, groups: Object.create(null), unknown: false, pantryNotes: [], quantityNotes: [] });
        if (meta.note && !item.quantityNotes.includes(meta.note)) item.quantityNotes.push(meta.note);
        if(recipe.fixedBatch){const note=`${recipe.name}: ${purchased/yieldCount} full tub${purchased/yieldCount===1?'':'s'}, ${Number(Math.max(0,purchased-portions).toFixed(2))} extra serving${Math.abs(purchased-portions-1)<.000001?'':'s'} kept frozen.`;if(!item.quantityNotes.includes(note))item.quantityNotes.push(note);}
        if (!(quantity > 0) || !Number.isFinite(quantity)) { item.unknown = true; continue; }
        const group = item.groups[meta.dim] || (item.groups[meta.dim] = { need: 0, remaining: 0, label: meta.label, dim: meta.dim, pantry: 0, pantryUsed: 0 });
        group.need += quantity * scale * meta.factor;
      }
    }
    for (const item of pantry) {
      const key = canonicalIngredientName(item.name), meta = unitMeta(item.unit, item.name), quantity = Math.max(0, Number(item.qty) || 0);
      stock[key] ||= Object.create(null); stock[key][meta.dim] = (stock[key][meta.dim] || 0) + quantity * meta.factor;
    }
    for (const [key, item] of Object.entries(map)) for (const [dimension, group] of Object.entries(item.groups)) {
      group.pantry = stock[key]?.[dimension] || 0; group.pantryUsed = Math.min(group.need, group.pantry); group.remaining = Math.max(0, group.need - group.pantryUsed);
      if (group.pantry) item.pantryNotes.push(`${Number(group.pantry.toFixed(2))} ${group.label} in inventory`);
    }
    return Object.fromEntries(Object.entries(map).filter(([, item]) => item.unknown || Object.values(item.groups).some(group => group.remaining > .000001)));
  }
  root.MealBudgetCore = Object.freeze({ canonicalIngredientName, isCookingWater, unitMeta, buildShopping, dayNames, mealSlots, produceGrams, spiceGrams, proteinFamily, varietyPolicy, inspectVariety });
})(globalThis);
