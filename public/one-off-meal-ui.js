(function (root) {
  'use strict';
  let api, opened = false, sequence = 0, controller = null, result = null, signature = '', quotedAt = 0;
  const core = () => root.OneOffMealCore;
  const node = id => document.getElementById(id);
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const arg = value => encodeURIComponent(value).replace(/'/g, '%27');
  const money = value => '£' + Number(value).toFixed(2);
  const pricePeriod = product => String(product.sourceDate || product.sourcePeriod || product.checkedAt || 'Undated') + (product.referenceRegions?.length ? ' · '+product.referenceRegions.join(' / ') : '');
  function stop() { sequence++; controller?.abort(); controller = null; }
  function cancel() { opened = false; stop(); }
  function read() { return core().normalise({ budget: node('oneOffBudget').value, people: node('oneOffPeople').value,
    category: node('oneOffCategory').value, query: node('oneOffQuery').value, usePantry: node('oneOffPantry').checked, store: api.store() }); }
  function payload(brief) {
    const profile = { ...api.state().profile, varietyMode: 'Balanced', tailoredMeals: {}, scheduledMeals: [], repeatMeals: {} };
    const recipes = api.recipes().filter(recipe => (api.category(recipe) === brief.category || brief.category === 'Snack' && api.category(recipe) === 'Fruit') &&
      api.allowed(recipe, profile) && root.RecipeDiscoveryCore.matches(recipe, brief.query)).slice(0,250).map(recipe => ({ id: recipe.id, name: recipe.name, cat: api.category(recipe),
        ings: recipe.ings, servings: recipe.servings, nutrition: api.nutrition(recipe), cookTime: recipe.cookTime ?? recipe.time,
        equipment: recipe.equipment || [], passiveMinutes: recipe.passiveMinutes || 0, fixedBatch: recipe.fixedBatch === true, batchStorage: recipe.batchStorage || null }));
    return { ...brief, profile: { diet: profile.diet, dislikes: profile.dislikes, custom: profile.custom, cookTime: profile.cookTime, equipment: profile.equipment },
      recipes, pantry: brief.usePantry ? root.PantryCore.activePantry(api.state().pantry || []) : [], ...api.personalPrices(brief.store) };
  }
  function status(text) { if (node('oneOffStatus')) node('oneOffStatus').textContent = text; }
  async function open() {
    api.closeModal?.();
    stop(); opened = true; const token = sequence;
    let brief; try { brief = core().normalise({ budget: 10, people: Math.max(1, Math.min(8, Number(api.state().profile.people) || 1)), category: 'Dinner',
      ...api.state().oneOffMealBrief, store: api.store() }); } catch { brief = core().normalise({ budget:10,people:1,category:'Dinner',store:api.store() }); }
    api.openSheet('<h2>Just one meal</h2><p class="sub">Find a meal within a total shopping budget at ' + html(brief.store) + '. Your saved plan stays as it is.</p>' +
      '<form onsubmit="event.preventDefault();OneOffMealUI.find()"><div class="grid"><div class="field"><label for="oneOffCategory">Meal</label><select id="oneOffCategory" onchange="OneOffMealUI.edit()">' + core().categories.map(category => '<option ' + (category===brief.category?'selected':'') + '>' + category + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="oneOffBudget">Total budget (£)</label><input id="oneOffBudget" type="number" min="0" max="500" step="0.01" required value="' + brief.budget + '" oninput="OneOffMealUI.edit()"></div>' +
      '<div class="field"><label for="oneOffPeople">People</label><input id="oneOffPeople" type="number" min="1" max="8" step="1" required value="' + brief.people + '" oninput="OneOffMealUI.edit()"></div></div>' +
      '<div class="field"><label for="oneOffQuery">Anything you fancy? <small>Optional</small></label><input id="oneOffQuery" type="search" maxlength="120" value="' + html(brief.query) + '" placeholder="Chicken, pasta, curry…" oninput="OneOffMealUI.edit()"></div>' +
      '<button class="btn secondary small" type="button" onclick="OneOffMealUI.frozen()">Try frozen chicken dinners</button>' +
      '<label class="checkrow"><input id="oneOffPantry" type="checkbox" ' + (brief.usePantry?'checked':'') + ' onchange="OneOffMealUI.edit()"> Use what’s in my pantry</label>' +
      '<p class="sub">Budget includes full packs you need to buy. Food, equipment and cooking-time preferences apply. This meal’s budget is separate from your weekly plan.</p>' +
      '<div class="actions"><button id="oneOffFind" class="btn" type="submit" disabled>Find a meal</button></div></form><p id="oneOffStatus" class="sub" role="status" aria-live="polite">Loading recipes…</p><div id="oneOffResults"></div>');
    try { await api.loadRecipes(); } catch { /* Local measured recipes remain searchable. */ }
    if (!opened || token !== sequence || !node('oneOffFind')) return;
    node('oneOffFind').disabled = false; status('');
    if (result && signature === JSON.stringify(payload(brief)) && Date.now()-quotedAt < 30*60000) draw(); else { result = null; }
  }
  function edit() { stop(); result = null; if (node('oneOffResults')) node('oneOffResults').innerHTML = ''; if (node('oneOffFind')) node('oneOffFind').disabled = false; status('Choose Find a meal to check these details.'); }
  async function find() {
    if (!opened || controller) return;
    let brief, body; try { brief = read(); body = payload(brief); } catch (error) { status(error.message); return; }
    result = null; node('oneOffResults').innerHTML = '';
    if (!body.recipes.length) { status('No suitable measured recipes match. Try a broader search or review your food, time and equipment settings.'); return; }
    const current = ++sequence, request = new AbortController(); controller = request;
    const timer = root.setTimeout(() => request.abort(), 60000);
    api.state().oneOffMealBrief = brief; api.save(); signature = JSON.stringify(body);
    node('oneOffFind').disabled = true; status('Checking full-pack prices for your meal…');
    try {
      const response = await fetch('/api/meals/one-off', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:request.signal });
      if (!response.ok) throw new Error('Meal prices are unavailable. Go online and try again; your saved plan is safe.');
      const data = await response.json();
      if (!opened || current !== sequence) return;
      if (signature !== JSON.stringify(payload(read()))) throw new Error('Your ingredients or settings changed. Find a meal again for fresh prices.');
      if (!data.ok || data.store !== brief.store || !Array.isArray(data.options) || data.options.length > 12 || JSON.stringify(data.brief) !== JSON.stringify(brief) ||
        data.options.some(option => { const recipe = body.recipes.find(recipe => recipe.id === option.recipeId); return !recipe || !core().validateOption(option, recipe, brief, body.pantry); })) throw new Error('The meal prices could not be verified. Please try again.');
      result = data; quotedAt = Date.now(); status(''); draw();
    } catch (error) { if (opened && current === sequence) status(error.name==='AbortError'?'Price checking timed out. Please try again.':error.name==='TypeError'||root.navigator?.onLine===false?'Meal prices are unavailable. Go online and try again; your saved plan is safe.':error.message); }
    finally { root.clearTimeout(timer); if (controller === request) controller = null; if (opened && current === sequence && node('oneOffFind')) node('oneOffFind').disabled = false; }
  }
  function draw() {
    const brief = result.brief;
    if (!result.options.length) {
      node('oneOffResults').innerHTML = '<div class="notice">No fully priced matches inside ' + money(brief.budget) + ' were found.' +
        (result.cheapestOverBudgetGBP!==null?' The cheapest fully priced match was '+money(result.cheapestOverBudgetGBP)+'.':'') +
        (result.unpriced?' '+result.unpriced+' matching meals have missing prices; these are excluded.':'') + ' Try another ingredient or review the budget.</div>'; return;
    }
    node('oneOffResults').innerHTML = '<h3>' + result.affordable + ' meal' + (result.affordable===1?'':'s') + ' within ' + money(brief.budget) + '</h3><p class="sub">For ' + brief.people + ' ' + (brief.people===1?'person':'people') + ' · cheapest checkout first' + (result.affordable>12?' · showing 12':'') + '.</p>' + result.options.map(option => {
      const recipe = api.recipes().find(recipe => recipe.id === option.recipeId), nutrition = api.nutrition(recipe), id = arg(recipe.id);
      return '<article class="card"><h3>'+html(recipe.name)+'</h3><p><strong>'+(option.estimatedPrice?'~':'')+money(option.totalCostGBP)+' to buy</strong> · '+money(brief.budget-option.totalCostGBP)+' under budget</p>' +
        '<p class="sub">~'+Math.round(nutrition.kcal)+' kcal · '+Math.round(nutrition.p)+' g protein per portion'+(recipe.cookTime?' · '+html(recipe.cookTime)+' min'+(recipe.passiveMinutes?' prep + '+html(recipe.passiveMinutes)+' min waiting/cooking':''):'')+'</p>' +
        (option.fixedBatch?'<p class="sub">Prepare '+option.preparedPortions+' portions in whole batches; '+(option.preparedPortions-brief.people)+' extra portions. Follow the recipe’s storage directions.</p>':'') +
        (option.estimatedPrice?'<p class="sub">Uses labelled saved-price estimates. Original dates and sources are below; check current shelf prices.</p>':'') +
        (option.recommendations.some(row=>row.plan.products.some(product=>product.storage==='Freezer' && product.preparationNote))?'<p class="sub">Uses frozen chicken. Allow the pack’s full cooking time. Nutrition varies by pack; check its label, including any no-reheat instruction.</p>':'') +
        '<details><summary>Shopping for this meal</summary>'+shoppingMarkup(option)+'<button class="btn secondary small" onclick="OneOffMealUI.copy(decodeURIComponent(\''+id+'\'))">Copy this shopping list</button></details>' +
        '<div class="actions"><button class="btn secondary" onclick="OneOffMealUI.view(decodeURIComponent(\''+id+'\'))">View recipe</button></div></article>';
    }).join('') + (result.unpriced?'<p class="sub">'+result.unpriced+' matching meals were excluded because some prices are missing.</p>':'');
  }
  function shoppingMarkup(option) {
    if (!option.items.length) return '<p>Your pantry covers the measured ingredients. Nothing to buy for this meal.</p>';
    return option.recommendations.map(row => '<div class="one-off-shopping"><b>'+html(row.query)+'</b>' + row.plan.products.map(product => '<p>'+product.packs+' × '+html(product.productName)+' ('+html(product.packSize)+') · '+money(product.costGBP)+'<br><small>'+html(product.priceBasis==='personal'?'Your checked pack price':product.priceBasis==='aldi_estimate'?'Aldi estimate for Lidl':product.sourceStore||result.store)+' · '+html(pricePeriod(product))+'</small>' + (product.priceBasis==='personal'?'':' · <a href="'+html(product.priceSourceUrl||product.url)+'" target="_blank" rel="noopener noreferrer">Price source ↗</a>') + (product.storage==='Freezer'?'<br><small>Keep frozen · freezer pack</small>':'') + (product.preparationNote?'<br><small>'+html(product.preparationNote)+'</small>':'') + '</p>').join('')+'</div>').join('');
  }
  function current(id) {
    if (!result || Date.now()-quotedAt >= 30*60000) throw new Error('Find a meal again to refresh these prices.');
    const brief = opened ? read() : { ...result.brief, store: api.store() }, body = payload(brief), option = result.options.find(option=>option.recipeId===id), recipe = body.recipes.find(recipe=>recipe.id===id);
    if (signature !== JSON.stringify(body) || !recipe || !core().validateOption(option, recipe, brief, body.pantry)) throw new Error('Your ingredients or settings changed. Find a meal again for fresh prices.');
    return { option, recipe, brief };
  }
  function view(id) {
    try { const {brief}=current(id); stop(); opened=false; api.showRecipe(id); const input=node('recipeTargetServings');if(input){input.value=brief.people;api.updatePortions();}
      const actions=document.querySelector('#sheet .actions');if(actions){const back=document.createElement('button');back.className='btn secondary';back.textContent='Back to one-off meals';back.onclick=()=>open();actions.appendChild(back);}
    } catch(error) { api.toast(error.message); }
  }
  async function copy(id) {
    try {
      const {option,recipe,brief}=current(id), lines=['One-off '+brief.category.toLowerCase()+': '+recipe.name,brief.people+' '+(brief.people===1?'person':'people')+' · '+brief.store,'Total to buy: '+(option.estimatedPrice?'~':'')+money(option.totalCostGBP)+' (budget '+money(brief.budget)+')',''];
      for(const row of option.recommendations){lines.push(row.query+':');for(const product of row.plan.products)lines.push('  '+product.packs+' × '+product.productName+' ('+product.packSize+') — '+money(product.costGBP),'  '+(product.priceBasis==='aldi_estimate'?'Aldi estimate for Lidl':product.sourceStore||brief.store)+' · '+pricePeriod(product),...(product.priceBasis==='personal'?[]:['  '+(product.priceSourceUrl||product.url)]),...(product.preparationNote?['  '+product.preparationNote]:[]));}
      if(!option.items.length)lines.push('Your pantry covers the measured ingredients. Nothing to buy.');
      if(option.estimatedPrice)lines.push('Saved-price estimate; check current prices and stock before shopping.');
      try { await navigator.clipboard.writeText(lines.join('\n'));api.toast('One-off shopping list copied'); }
      catch { api.download('one-off-meal-shopping.txt',lines.join('\n'),'text/plain');api.toast('One-off shopping list downloaded'); }
    } catch(error) { api.toast(error.message); }
  }
  function frozen() { if (!opened) return; node('oneOffCategory').value='Dinner'; node('oneOffQuery').value='frozen chicken'; edit(); node('oneOffFind').focus(); }
  root.OneOffMealUI = { configure:value=>{api=value;},open,find,edit,cancel,view,copy,frozen };
})(globalThis);
