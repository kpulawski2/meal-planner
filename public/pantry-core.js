/* Quantified purchases, cooking and leftovers. Shared pure lifecycle rules. */
(function (root) {
  'use strict';
  const EPS = 1e-6;
  const clone = value => JSON.parse(JSON.stringify(value));
  const num = value => value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : NaN;
  const rounded = value => Number(value.toFixed(6));
  const core = () => { if (!root.MealBudgetCore) throw new Error('Shopping units are unavailable.'); return root.MealBudgetCore; };
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
    return JSON.stringify(value);
  }
  const dateOnly = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  function today(now = new Date()) { return new Date(now).toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); }
  function expired(item, now = new Date()) { return dateOnly(item?.expiry) && item.expiry < today(now); }
  function initialise(state, now = new Date()) {
    state.pantry = Array.isArray(state.pantry) ? state.pantry.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [];
    state.leftovers = Array.isArray(state.leftovers) ? state.leftovers.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [];
    if (!state.pantryLedger || typeof state.pantryLedger !== 'object' || Array.isArray(state.pantryLedger)) state.pantryLedger = {};
    const ledger = state.pantryLedger;
    ledger.version = 1; ledger.sequence = Number.isSafeInteger(ledger.sequence) && ledger.sequence >= 0 ? ledger.sequence : 0;
    ledger.cooked = ledger.cooked && typeof ledger.cooked === 'object' && !Array.isArray(ledger.cooked) ? ledger.cooked : {};
    ledger.transactions = Array.isArray(ledger.transactions) ? ledger.transactions : [];
    ledger.purchaseKeys = Array.isArray(ledger.purchaseKeys) ? ledger.purchaseKeys : [];
    if (!ledger.planId) ledger.planId = nextId(state, 'plan', now);
    const used = new Set();
    for (const lot of state.pantry) { if (!lot.id || used.has(lot.id)) lot.id = nextId(state, 'lot', now); used.add(lot.id); }
    for (const leftover of state.leftovers) { if (!leftover.id || used.has(leftover.id)) leftover.id = nextId(state, 'leftover', now); used.add(leftover.id); }
    return state;
  }
  function nextId(state, kind, now = new Date()) { return kind + ':' + new Date(now).getTime() + ':' + (++state.pantryLedger.sequence); }
  function resetPlan(state, now = new Date()) { initialise(state, now); state.pantryLedger.planId = nextId(state, 'plan', now); state.pantryLedger.cooked = {}; return state.pantryLedger.planId; }
  function recipeSignature(recipe) { return stable({ id: recipe?.id, cat: recipe?.cat, ings: recipe?.ings, servings: recipe?.servings ?? 1, fixedBatch: !!recipe?.fixedBatch, kcal: recipe?.kcal, p: recipe?.p, c: recipe?.c, f: recipe?.f, nutritionStatus: recipe?.nutritionStatus }); }
  function slotKey(state, day, index) { return String(state.pantryLedger?.planId || '') + '::' + day + '::' + index; }
  function recipeFor(state, recipes, day, index) { const row = (state.week || []).find(row => row.day === day); return (recipes || []).find(recipe => recipe.id === row?.meals?.[index]); }
  function cookedPortions(state, day, index, recipes) {
    const entry = state.pantryLedger?.cooked?.[slotKey(state, day, index)], id = (state.week || []).find(row => row.day === day)?.meals?.[index];
    if (!entry || entry.recipeId !== id || !(num(entry.servings) > 0)) return 0;
    if (recipes && entry.recipeSignature !== recipeSignature(recipeFor(state, recipes, day, index))) return 0;
    return num(entry.servings);
  }
  function isCooked(state, day, index, recipes) { return cookedPortions(state, day, index, recipes) > EPS; }
  function activePantry(pantry = [], now = new Date()) { return pantry.filter(item => item && (!item.expiry || dateOnly(item.expiry)) && !expired(item, now) && num(item.qty) > 0); }
  function plannedPortions(state, day, index) { const value = num(state.mealServings?.[day + '::' + index]); return value > 0 ? value : Math.max(1, num(state.profile?.people) || 1); }
  function plannerCoverage(state, recipes = [], now = new Date()) {
    const coverage = {}, leftoverStock = new Map((state.leftovers || []).filter(item => item && (!item.expiry || dateOnly(item.expiry)) && !expired(item, now)).map(item => [item.id, Math.max(0, num(item.servings) || 0)]));
    for (const day of state.week || []) for (const [index, recipeId] of (day.meals || []).entries()) {
      const planned = plannedPortions(state, day.day, index), cooked = Math.min(planned, cookedPortions(state, day.day, index, recipes)), reservations = [];
      let remaining = Math.max(0, planned - cooked);
      for (const leftover of matchingLeftovers(state, recipes, day.day, index, now)) {
        const reserved = Math.min(remaining, leftoverStock.get(leftover.id) || 0); if (!(reserved > EPS)) continue;
        remaining = Math.max(0, remaining - reserved); leftoverStock.set(leftover.id, Math.max(0, (leftoverStock.get(leftover.id) || 0) - reserved)); reservations.push({ leftoverId: leftover.id, servings: reserved });
      }
      const leftoverPortions = reservations.reduce((sum, item) => sum + item.servings, 0);
      coverage[day.day + '::' + index] = { recipeId, plannedPortions: planned, cookedPortions: cooked, leftoverPortions, coveredPortions: cooked + leftoverPortions, remainingPortions: remaining, leftoverReservations: reservations };
    }
    return coverage;
  }
  function shoppingInput(state, recipes = [], now = new Date()) {
    const week = [], mealServings = {}, coverage = plannerCoverage(state, recipes, now);
    for (const day of state.week || []) {
      const row = { ...day, meals: [] };
      for (const [index, id] of (day.meals || []).entries()) {
        const remaining = coverage[day.day + '::' + index].remainingPortions;
        if (remaining <= EPS) continue;
        mealServings[day.day + '::' + row.meals.length] = remaining; row.meals.push(id);
      }
      week.push(row);
    }
    return { week, recipes, mealServings, people: state.profile?.people || 1, pantry: activePantry(state.pantry, now) };
  }
  function revision(state, recipes = []) { return stable({ week: state.week, mealServings: state.mealServings, people: state.profile?.people, store: state.shoppingStore, shopping: state.shopping, pantry: state.pantry, leftovers: state.leftovers, ledger: state.pantryLedger, recipes: recipes.filter(recipe => (state.week || []).some(day => day.meals?.includes(recipe.id))).map(recipeSignature) }); }
  function officialProductUrl(url, store) {
    try { const parsed = new URL(url); return parsed.protocol === 'https:' && !parsed.username && !parsed.password && (store === 'Asda' ? ['www.asda.com', 'groceries.asda.com'].includes(parsed.hostname) && /\/(?:groceries\/)?product\//.test(parsed.pathname) : store === 'Lidl' && parsed.hostname === 'www.lidl.co.uk' && /^\/p\/[^/]+\/p\d+\/?$/.test(parsed.pathname)); } catch { return false; }
  }
  function productCurrent(product, checkedAt, now) {
    const instant = new Date(now).getTime(), checked = Date.parse(checkedAt), day = today(now);
    if (!Number.isFinite(checked) || checked > instant + 60 * 1000 || instant - checked > 7 * 86400000 || product.available === false || product.priceMemberOnly === true || product.offer?.validForMemberTier || product.regionRestricted === true || /out.?of.?stock|not.?listed|unavailable/i.test(String(product.availability || ''))) return false;
    for (const [field, future] of [['validFrom', true], ['validThrough', false]]) {
      const value = product[field] || product.offer?.[field]; if (!value) continue;
      if (!Number.isFinite(Date.parse(value)) || (dateOnly(value) ? future ? value > day : value < day : future ? Date.parse(value) > instant : Date.parse(value) < instant)) return false;
    }
    return true;
  }
  function purchasePreview({ state, entries = [], basket, store, catalogue = {}, now = new Date() }) {
    if (!state.pantryLedger) initialise(state, now);
    const selected = entries.filter(([key, item]) => state.shopping?.[key] || state.shopping?.[item.name]);
    if (!selected.length) return { ok: false, error: 'Tick the items you bought first.' };
    if (new Set(selected.map(([key]) => key)).size !== selected.length) return { ok: false, error: 'Your shopping list contains duplicate rows. Refresh the list.' };
    if (!['Asda', 'Lidl'].includes(store) || basket?.status !== 'ready' || basket.offline || catalogue.offline) return { ok: false, error: 'Wait for the current supermarket packs to load online.' };
    const loadedAt = num(catalogue.loadedAt); if (!(loadedAt > 0) || new Date(now).getTime() - loadedAt > 30 * 60 * 1000 || loadedAt > new Date(now).getTime() + 60 * 1000) return { ok: false, error: 'Refresh these product prices before confirming your purchase.' };
    const lots = [], rows = [], requests = []; let totalCostGBP = 0;
    for (const [key, item] of selected) {
      if (item.unknown) return { ok: false, error: item.name + ' needs a confirmed ingredient quantity.' };
      const groups = Object.entries(item.groups || {}).filter(([, group]) => num(group.remaining) > EPS);
      if (!groups.length) return { ok: false, error: 'Your shopping quantities changed. Refresh the list.' };
      for (const [dimension, group] of groups) {
        const at = basket.items?.findIndex(row => row.key === key + '::' + dimension), requested = basket.items?.[at], result = basket.results?.[at], plan = result?.plan;
        if (!requested || result?.key !== requested.key || !Number.isFinite(num(requested.quantity)) || Math.abs(num(requested.quantity) - num(group.remaining)) > EPS || !result?.match || !Array.isArray(plan?.products) || !plan.products.length || !Number.isFinite(num(plan.requestedQuantity)) || Math.abs(num(plan.requestedQuantity) - num(group.remaining)) > .001) return { ok: false, error: item.name + ' has no current verified purchase plan.' };
        requests.push({ key: requested.key, name: item.name, dimension, quantity: num(requested.quantity) });
        let lineQuantity = 0, lineCost = 0;
        for (const product of plan.products) {
          const packs = num(product.packs), size = num(product.packQuantity), cost = num(product.costGBP), price = num(product.priceGBP), checkedAt = product.checkedAt || result.match.checkedAt;
          if (!Number.isInteger(packs) || packs <= 0 || !(size > 0) || !(cost > 0) || !(price > 0) || Math.abs(packs * price - cost) > .011 || !officialProductUrl(product.url, store) || !checkedAt || !productCurrent(product, checkedAt, now)) return { ok: false, error: item.name + ' has incomplete or outdated pack or price information.' };
          const native = core().unitMeta(product.packUnit, item.name), total = num(product.totalQuantity), nativeTotal = packs * size * native.factor;
          let qty = packs * size, unit = product.packUnit || 'pieces', estimated = !!product.estimatedQuantity;
          if (native.dim !== dimension || Number.isFinite(total) && Math.abs(total - nativeTotal) > .001) {
            const declared = String(product.quantityBasis || '').match(/^(\d+) items declared in the product name\.$/), declaredName = String(product.productName || '').match(/\b(\d+)\s+(?:(?:\w+[ -]){0,5})(?:wraps?|pittas?|sausages?|bagels?|slices?|eggs?)\b/i);
            const verifiedCount = dimension === 'each' && declared && declaredName && Number(declared[1]) === Number(declaredName[1]) && Math.abs(total - packs * Number(declared[1])) < .001;
            if (!(total > 0) || !(estimated && product.quantityBasis || verifiedCount)) return { ok: false, error: item.name + ' has incompatible pack units.' };
            qty = total; unit = dimension === 'mass' ? 'g' : dimension === 'volume' ? 'ml' : dimension === 'each' ? 'pieces' : group.label;
          }
          const quantity = core().unitMeta(unit, item.name); if (quantity.dim !== dimension || !(num(qty) > 0)) return { ok: false, error: item.name + ' has an unknown usable pack quantity.' };
          lineQuantity += qty * quantity.factor; lineCost += cost;
          lots.push({ name: item.name, qty: rounded(qty), unit, place: /frozen/i.test(item.name + ' ' + product.productName) ? 'Freezer' : /milk|yoghurt|yogurt|cheese|chicken|pork|beef|salmon|cod|turkey|prawn|mixed salad|lettuce/i.test(item.name) && !/uht|tinned|canned|dried/i.test(product.productName) ? 'Fridge' : 'Pantry', expiry: '', purchasedAt: new Date(now).toISOString(), store, estimated, quantityBasis: product.quantityBasis || null, product: { id: product.id || product.sku || null, name: product.productName || item.name, url: product.url, packs, packQuantity: size, packUnit: product.packUnit, packSize: product.packSize || '', priceGBP: price, costGBP: cost, checkedAt, validFrom: product.validFrom || product.offer?.validFrom || null, validThrough: product.validThrough || product.offer?.validThrough || null } });
        }
        if (!Number.isFinite(num(plan.totalQuantity)) || Math.abs(lineQuantity - num(plan.totalQuantity)) > .001 || lineQuantity + EPS < num(group.remaining) || !(num(plan.totalCostGBP) >= 0) || Math.abs(lineCost - num(plan.totalCostGBP)) > .011) return { ok: false, error: item.name + ' has an inconsistent purchase plan.' };
        totalCostGBP += lineCost;
      }
      rows.push(key);
    }
    const quotedLots = lots.map(({ purchasedAt, ...lot }) => lot);
    const context = revision(state), quote = stable({ store, fingerprint: catalogue.fingerprint, loadedAt, requests, lots: quotedLots }), purchaseKey = stable({ planId: state.pantryLedger.planId, rows, quote });
    if (state.pantryLedger.purchaseKeys.includes(purchaseKey)) return { ok: false, error: 'This purchase has already been added.' };
    return { ok: true, context, quote, purchaseKey, rows, lots, totalCostGBP: rounded(totalCostGBP), store, catalogueFingerprint: catalogue.fingerprint, loadedAt, createdAt: new Date(now).toISOString() };
  }
  function applyPurchase(state, preview, current, now = new Date()) {
    initialise(state, now);
    if (!preview?.ok || !current?.ok || preview.context !== revision(state) || preview.context !== current.context || preview.quote !== current.quote || preview.purchaseKey !== current.purchaseKey || new Date(now).getTime() - current.loadedAt > 30 * 60 * 1000 || current.lots.some(lot => !productCurrent(lot.product, lot.product.checkedAt, now))) return { ok: false, error: 'Your list, pantry or prices changed. Check the purchase again.' };
    if (state.pantryLedger.purchaseKeys.includes(preview.purchaseKey)) return { ok: false, error: 'This purchase has already been added.' };
    const transaction = { id: nextId(state, 'purchase', now), type: 'purchase', planId: state.pantryLedger.planId, createdAt: new Date(now).toISOString(), store: preview.store, totalCostGBP: preview.totalCostGBP, purchaseKey: preview.purchaseKey, changes: [] };
    for (const raw of preview.lots) { const lot = { ...clone(raw), purchasedAt: transaction.createdAt, id: nextId(state, 'lot', now), transactionId: transaction.id }; state.pantry.push(lot); transaction.changes.push({ collection: 'pantry', id: lot.id, before: null, after: clone(lot) }); }
    state.pantryLedger.purchaseKeys.push(preview.purchaseKey); state.pantryLedger.transactions.push(transaction);
    for (const key of preview.rows) { delete state.shopping[key]; for (const lot of preview.lots) if (core().canonicalIngredientName(lot.name) === key) delete state.shopping[lot.name]; }
    return { ok: true, transaction };
  }
  function requiredIngredients(recipe, portions) {
    if (!recipe || !Array.isArray(recipe.ings) || !recipe.ings.length || recipe.servings === null || recipe.servings === '' || !(num(portions) > 0)) return { ok: false, error: 'Measured ingredients and recipe servings are needed.' };
    const yieldCount = num(recipe.servings ?? 1); if (!(yieldCount > 0)) return { ok: false, error: 'Confirm the recipe serving yield first.' };
    const prepared = recipe.fixedBatch ? Math.ceil((portions - EPS) / yieldCount) * yieldCount : portions;
    const requirements = new Map(), unknown = [];
    for (const ingredient of recipe.ings) {
      if (!Array.isArray(ingredient) || ingredient.length < 2) { unknown.push('unmeasured ingredient'); continue; }
      const [rawName, rawQty, rawUnit] = ingredient;
      const name = String(rawName || '').trim(), qty = num(rawQty); if (!name || core().isCookingWater(name)) continue;
      if (!(qty > 0)) { unknown.push(name); continue; }
      const meta = core().unitMeta(rawUnit, name), key = core().canonicalIngredientName(name) + '::' + meta.dim;
      const row = requirements.get(key) || { key, name, dimension: meta.dim, unit: meta.label, qty: 0, estimated: !!meta.estimated, note: meta.note };
      row.qty = rounded(row.qty + qty * prepared / yieldCount * meta.factor); requirements.set(key, row);
    }
    if (unknown.length || !requirements.size) return { ok: false, error: 'Confirm ingredient amounts before recording cooking: ' + (unknown.join(', ') || 'no measured ingredients') };
    return { ok: true, requirements: [...requirements.values()], preparedServings: prepared };
  }
  function cookPreview(state, recipes, { day, index, portions, extraServings = 0, storage = 'Fridge', expiry = '', now = new Date() } = {}) {
    initialise(state, now); const recipe = recipeFor(state, recipes, day, index);
    if (!recipe) return { ok: false, error: 'This planned meal no longer exists.' };
    const remaining = Math.max(0, plannedPortions(state, day, index) - cookedPortions(state, day, index, recipes));
    portions = portions === undefined ? remaining : num(portions); extraServings = num(extraServings);
    if (!(portions > 0) || portions > remaining + EPS || !(extraServings >= 0) || extraServings > 100 || !['Fridge', 'Freezer'].includes(storage) || expiry && !dateOnly(expiry)) return { ok: false, error: 'Check the portions, storage and expiry date.' };
    const ingredients = requiredIngredients(recipe, portions + extraServings); if (!ingredients.ok) return ingredients;
    const allocations = [], missing = [], lots = activePantry(state.pantry, now).slice().sort((a, b) => String(a.expiry || '9999-12-31').localeCompare(String(b.expiry || '9999-12-31')) || String(a.purchasedAt || '').localeCompare(String(b.purchasedAt || '')));
    const available = new Map(lots.map(lot => [lot.id, num(lot.qty)]));
    for (const requirement of ingredients.requirements) {
      let needed = requirement.qty;
      for (const lot of lots) {
        const meta = core().unitMeta(lot.unit, lot.name); if (core().canonicalIngredientName(lot.name) !== core().canonicalIngredientName(requirement.name) || meta.dim !== requirement.dimension) continue;
        const usedBase = Math.min(needed, available.get(lot.id) * meta.factor); if (!(usedBase > EPS)) continue;
        const used = rounded(usedBase / meta.factor); available.set(lot.id, Math.max(0, available.get(lot.id) - used)); needed = Math.max(0, needed - usedBase);
        allocations.push({ id: lot.id, used, before: clone(lot), after: { ...clone(lot), qty: rounded(Math.max(0, num(lot.qty) - used)) } });
      }
      if (needed > EPS) missing.push({ name: requirement.name, qty: rounded(needed), unit: requirement.unit });
    }
    return { ok: true, context: revision(state, recipes), recipeId: recipe.id, recipeSignature: recipeSignature(recipe), day, index, slotKey: slotKey(state, day, index), portions: rounded(portions), extraServings, preparedServings: rounded(ingredients.preparedServings), leftoverServings: rounded(ingredients.preparedServings - portions), requirements: ingredients.requirements, allocations, missing, storage, expiry, createdAt: new Date(now).toISOString(), recipeSnapshot: clone(recipe) };
  }
  function applyCook(state, recipes, preview, { confirmMissing = false, now = new Date() } = {}) {
    initialise(state, now);
    if (!preview?.ok || preview.context !== revision(state, recipes)) return { ok: false, error: 'This meal or your stock changed. Check the cooking preview again.' };
    if (preview.allocations.some(item => !activePantry([state.pantry.find(lot => lot.id === item.id)], now).length)) return { ok: false, error: 'Some pantry stock expired. Check the cooking preview again.' };
    if (preview.missing.length && !confirmMissing) return { ok: false, error: 'Some ingredients are missing from your pantry. Confirm that you supplied them before recording cooking.', missing: preview.missing };
    const transaction = { id: nextId(state, 'cook', now), type: 'cook', recipeId: preview.recipeId, slotKey: preview.slotKey, portions: preview.portions, preparedServings: preview.preparedServings, createdAt: new Date(now).toISOString(), missingStock: clone(preview.missing), changes: [] };
    const merged = new Map();
    for (const allocation of preview.allocations) { const record = merged.get(allocation.id) || { before: allocation.before, used: 0 }; record.used += allocation.used; merged.set(allocation.id, record); }
    for (const [id, record] of merged) { const lot = state.pantry.find(item => item.id === id), before = clone(lot); lot.qty = rounded(Math.max(0, num(lot.qty) - record.used)); transaction.changes.push({ collection: 'pantry', id, before, after: clone(lot) }); }
    const before = state.pantryLedger.cooked[preview.slotKey] ? clone(state.pantryLedger.cooked[preview.slotKey]) : null;
    const matchingBefore = before?.recipeId === preview.recipeId && before.recipeSignature === preview.recipeSignature ? before : null;
    const after = { recipeId: preview.recipeId, recipeSignature: preview.recipeSignature, servings: rounded((matchingBefore?.servings || 0) + preview.portions), transactionIds: [...(matchingBefore?.transactionIds || []), transaction.id] };
    state.pantryLedger.cooked[preview.slotKey] = after; transaction.cookedChange = { key: preview.slotKey, before, after: clone(after) };
    if (preview.leftoverServings > EPS) { const leftover = { id: nextId(state, 'leftover', now), recipeId: preview.recipeId, recipeSignature: preview.recipeSignature, recipeSnapshot: preview.recipeSnapshot, servings: preview.leftoverServings, createdAt: transaction.createdAt, storage: preview.storage, expiry: preview.expiry, transactionId: transaction.id }; state.leftovers.push(leftover); transaction.changes.push({ collection: 'leftovers', id: leftover.id, before: null, after: clone(leftover) }); }
    state.pantryLedger.transactions.push(transaction); return { ok: true, transaction };
  }
  function matchingLeftovers(state, recipes, day, index, now = new Date()) { const recipe = recipeFor(state, recipes, day, index); if (!recipe) return []; return (state.leftovers || []).filter(item => item && item.recipeId === recipe.id && item.recipeSignature === recipeSignature(recipe) && num(item.servings) > EPS && (!item.expiry || dateOnly(item.expiry)) && !expired(item, now)).sort((a, b) => String(a.expiry || '9999-12-31').localeCompare(String(b.expiry || '9999-12-31')) || String(a.createdAt || '').localeCompare(String(b.createdAt || ''))); }
  function useLeftover(state, recipes, { day, index, leftoverId, portions, expectedRevision, now = new Date() } = {}) {
    initialise(state, now); if (expectedRevision && expectedRevision !== revision(state, recipes)) return { ok: false, error: 'Your plan or leftovers changed. Check again.' };
    const remaining = plannedPortions(state, day, index) - cookedPortions(state, day, index, recipes), leftover = matchingLeftovers(state, recipes, day, index, now).find(item => item.id === leftoverId), recipe = recipeFor(state, recipes, day, index); portions = num(portions);
    if (!leftover || !(portions > 0) || portions > remaining + EPS || portions > num(leftover.servings) + EPS) return { ok: false, error: 'There are not enough matching leftover portions for this meal.' };
    const transaction = { id: nextId(state, 'leftover-use', now), type: 'leftover-use', recipeId: recipe.id, slotKey: slotKey(state, day, index), portions, createdAt: new Date(now).toISOString(), changes: [] }, before = clone(leftover);
    leftover.servings = rounded(Math.max(0, leftover.servings - portions)); transaction.changes.push({ collection: 'leftovers', id: leftover.id, before, after: clone(leftover) });
    const cookedBefore = state.pantryLedger.cooked[transaction.slotKey] ? clone(state.pantryLedger.cooked[transaction.slotKey]) : null, matchingBefore = cookedBefore?.recipeId === recipe.id && cookedBefore.recipeSignature === recipeSignature(recipe) ? cookedBefore : null, after = { recipeId: recipe.id, recipeSignature: recipeSignature(recipe), servings: rounded((matchingBefore?.servings || 0) + portions), transactionIds: [...(matchingBefore?.transactionIds || []), transaction.id] };
    state.pantryLedger.cooked[transaction.slotKey] = after; transaction.cookedChange = { key: transaction.slotKey, before: cookedBefore, after: clone(after) }; state.pantryLedger.transactions.push(transaction); return { ok: true, transaction };
  }
  function canUndo(state, transactionId) {
    const transaction = state.pantryLedger?.transactions?.find(item => item.id === transactionId);
    if (!transaction || transaction.undoneAt) return { ok: false, error: 'This action is already undone or no longer available.' };
    for (const change of transaction.changes || []) if (stable((state[change.collection] || []).find(item => item.id === change.id) || null) !== stable(change.after)) return { ok: false, error: 'These items changed after this action. Undo the later action first.' };
    if (transaction.cookedChange && stable(state.pantryLedger.cooked[transaction.cookedChange.key] || null) !== stable(transaction.cookedChange.after)) return { ok: false, error: 'This meal changed after cooking. Undo the later action first.' };
    return { ok: true, transaction };
  }
  function undo(state, transactionId, now = new Date()) {
    const result = canUndo(state, transactionId); if (!result.ok) return result;
    const transaction = result.transaction;
    for (const change of transaction.changes || []) {
      const at = state[change.collection].findIndex(item => item.id === change.id);
      if (change.before === null) { if (at >= 0) state[change.collection].splice(at, 1); }
      else if (at >= 0) state[change.collection][at] = clone(change.before);
      else state[change.collection].splice(Math.max(0, Math.min(state[change.collection].length, Number(change.position) || 0)), 0, clone(change.before));
    }
    if (transaction.cookedChange) { if (transaction.cookedChange.before === null) delete state.pantryLedger.cooked[transaction.cookedChange.key]; else state.pantryLedger.cooked[transaction.cookedChange.key] = clone(transaction.cookedChange.before); }
    if (transaction.purchaseKey) state.pantryLedger.purchaseKeys = state.pantryLedger.purchaseKeys.filter(key => key !== transaction.purchaseKey);
    transaction.undoneAt = new Date(now).toISOString(); return { ok: true, transaction };
  }
  function setExpiry(state, id, expiry, collection = 'pantry') { if (!['pantry', 'leftovers'].includes(collection) || expiry && !dateOnly(expiry)) return { ok: false, error: 'Enter a valid expiry date.' }; const item = state[collection]?.find(item => item.id === id); if (!item) return { ok: false, error: 'This item no longer exists.' }; item.expiry = expiry || ''; return { ok: true }; }
  const stockSnapshot = item => stable(item || null);
  function adjustStock(state, { id, qty, place, expiry = '', reason = 'Stock correction', expected } = {}, now = new Date()) {
    const item = state.pantry?.find(row => row.id === id), quantity = num(qty);
    if (!item || typeof expected !== 'string' || expected !== stockSnapshot(item)) return { ok: false, error: 'This stock changed. Open the stock editor again.' };
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 1000000) return { ok: false, error: 'Enter a remaining quantity from 0 to 1,000,000 in the existing unit.' };
    if (!['Pantry', 'Fridge', 'Freezer'].includes(place) || expiry && !dateOnly(expiry)) return { ok: false, error: 'Choose a storage location and a valid recorded expiry date.' };
    if (!['Stock correction', 'Used outside the plan', 'Thrown away', 'Storage update'].includes(reason)) return { ok: false, error: 'Choose a reason for the stock change.' };
    const before = clone(item), after = { ...before, qty: rounded(quantity), place, expiry };
    if (stockSnapshot(before) === stockSnapshot(after)) return { ok: false, error: 'No stock details changed.' };
    initialise(state, now);
    const transaction = { id: nextId(state, 'stock-adjustment', now), type: 'stock-adjustment', name: item.name, reason,
      createdAt: new Date(now).toISOString(), changes: [{ collection: 'pantry', id, before, after: clone(after) }] };
    state.pantry[state.pantry.findIndex(row => row.id === id)] = after;
    state.pantryLedger.transactions.push(transaction); return { ok: true, transaction };
  }
  function removeStock(state, id, collection = 'pantry', now = new Date()) {
    if (!['pantry', 'leftovers'].includes(collection)) return { ok: false, error: 'Choose a stock item or leftover.' };
    let at = state[collection]?.findIndex(row => row?.id === id);
    if (at === undefined || at < 0) return { ok: false, error: 'This item no longer exists.' };
    initialise(state, now);
    at = state[collection].findIndex(row => row.id === id);
    if (at < 0) return { ok: false, error: 'This item changed. Open your pantry again.' };
    const before = clone(state[collection][at]);
    const transaction = { id: nextId(state, 'stock-removal', now), type: 'stock-removal', name: before.name || before.recipeSnapshot?.name || before.recipeId,
      createdAt: new Date(now).toISOString(), changes: [{ collection, id, position: at, before, after: null }] };
    state[collection].splice(at, 1); state.pantryLedger.transactions.push(transaction); return { ok: true, transaction };
  }
  function stockStatus(item, now = new Date()) {
    if (!(num(item?.qty) > EPS)) return 'empty';
    if (!item.expiry) return 'undated';
    if (!dateOnly(item.expiry)) return 'attention';
    const days = Math.round((Date.parse(item.expiry + 'T12:00:00Z') - Date.parse(today(now) + 'T12:00:00Z')) / 86400000);
    return days < 0 ? 'attention' : days <= 3 ? 'soon' : 'dated';
  }
  function browseStock(pantry = [], { query = '', place = 'All', status = 'all' } = {}, now = new Date()) {
    const normal = value => String(value || '').normalize('NFKD').replace(/[łŁ]/g, 'l').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const words = normal(query).slice(0, 160).trim().split(/\s+/).filter(Boolean);
    const rows = pantry.filter(item => item && typeof item === 'object' && typeof item.name === 'string');
    return rows.filter(item => (place === 'All' || (item.place || 'Pantry') === place)
      && (status === 'all' ? stockStatus(item, now) !== 'empty' : stockStatus(item, now) === status)
      && words.every(word => normal(item.name + ' ' + (item.store || '') + ' ' + (item.product?.name || '')).includes(word)))
      .sort((a, b) => String(a.expiry || '9999-12-31').localeCompare(String(b.expiry || '9999-12-31')) || a.name.localeCompare(b.name));
  }
  function spentSummary(state, { planOnly = true } = {}) { const purchases = (state.pantryLedger?.transactions || []).filter(item => item.type === 'purchase' && !item.undoneAt && (!planOnly || item.planId === state.pantryLedger?.planId)); const known = purchases.every(item => num(item.totalCostGBP) >= 0); return { totalCostGBP: rounded(purchases.reduce((sum, item) => sum + (num(item.totalCostGBP) >= 0 ? num(item.totalCostGBP) : 0), 0)), known, purchases: purchases.length }; }
  function spentTotal(state, options) { return spentSummary(state, options).totalCostGBP; }
  function recipeUseUpScore(recipe, pantry = [], now = new Date()) {
    const requirements = requiredIngredients(recipe, 1); if (!requirements.ok) return 0;
    let score = 0;
    for (const lot of activePantry(pantry, now)) {
      if (!dateOnly(lot.expiry)) continue;
      const days = Math.round((Date.parse(lot.expiry + 'T00:00:00Z') - Date.parse(today(now) + 'T00:00:00Z')) / 86400000); if (days > 7) continue;
      const meta = core().unitMeta(lot.unit, lot.name), requirement = requirements.requirements.find(item => core().canonicalIngredientName(item.name) === core().canonicalIngredientName(lot.name) && item.dimension === meta.dim); if (!requirement) continue;
      score += (days <= 1 ? 4 : days <= 3 ? 3 : 1) * Math.min(1, num(lot.qty) * meta.factor / requirement.qty);
    }
    return Math.min(10, rounded(score));
  }
  root.PantryCore = Object.freeze({ initialise, resetPlan, activePantry, expired, today, recipeSignature, slotKey, cookedPortions, isCooked, plannedPortions, plannerCoverage, shoppingInput, revision, purchasePreview, applyPurchase, requiredIngredients, cookPreview, applyCook, matchingLeftovers, useLeftover, canUndo, undo, setExpiry, stockSnapshot, adjustStock, removeStock, stockStatus, browseStock, spentSummary, spentTotal, recipeUseUpScore, officialProductUrl });
})(globalThis);
