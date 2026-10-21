(function (root) {
  'use strict';
  const core = root.FoodLogCore;
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const shownNutrient = value => value == null ? '—' : Number(value).toLocaleString('en-GB',{maximumSignificantDigits:4});
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const shown = value => value == null ? '—' : Number(Number(value).toFixed(1));
  let api, date = core.localDate(), draft = null;
  const extras=()=>root.FoodNutrientsCore?.fields||[];
  const meals=['Breakfast','Lunch','Dinner','Snack'];
  function recentButtons(context = 'panel') {
    const rows = core.recentFoods(api.state()); if (!rows.length) return '';
    return '<details class="diary-recents planner-help" ' + (context === 'modal' ? 'open' : '') + '><summary>Log a recent food again</summary><p class="sub">Starts a new diary entry with the last recorded amount and values. Review them against what you ate; check the current label if it changed.</p><div class="diary-recent-list">' + rows.map(row => '<button class="diary-recent-food" onclick="FoodLogUI.openRecent(decodeURIComponent(\'' + arg(row.id) + '\'))"><b>' + html(row.food.name) + '</b><span>' + html(shown(row.quantity) + ' ' + row.food.unit + ' · last logged ' + row.date) + '</span></button>').join('') + '</div></details>';
  }
  function change() { api.save(); api.changed(); }
  function nutrientText(n) { return `${Math.round(n.kcal)} kcal · ${shown(n.p)}g protein · ${shown(n.c)}g carbs · ${shown(n.f)}g fat`; }
  function panel() {
    if (!api) return '';
    const result = core.summary(api.state(), date), n = result.totals;
    const rows = result.rows.map(row => '<div class="food-log-row"><div><b>' + html(row.food.name) + '</b><small>' + html((row.meal?row.meal+' · ':'')+row.quantity + ' ' + row.food.unit) + ' · ' + Math.round(row.nutrition.kcal) + ' kcal</small></div><button class="btn secondary small" onclick="FoodLogUI.edit(decodeURIComponent(\'' + arg(row.id) + '\'))">Edit</button></div>').join('');
    return '<section class="card food-diary" aria-label="Daily food diary"><div class="overview-heading"><h3>Food diary</h3><button class="btn small" onclick="FoodLogUI.open()">＋ Log food</button>'+(root.BarcodeUI?'<button class="btn secondary small" onclick="BarcodeUI.open(\''+date+'\')">Scan barcode</button>':'')+'</div><div class="field diary-date"><label for="foodDiaryDate">Date</label><input id="foodDiaryDate" type="date" value="' + date + '" onchange="FoodLogUI.setDate(this.value)"><div class="diary-date-buttons" role="group" aria-label="Diary date shortcuts"><button class="btn secondary small" aria-label="Previous diary day" onclick="FoodLogUI.moveDate(-1)">←</button><button class="btn secondary small" onclick="FoodLogUI.today()">Today</button><button class="btn secondary small" aria-label="Next diary day" onclick="FoodLogUI.moveDate(1)">→</button></div></div><div class="diary-total" aria-live="polite"><b>' + (result.estimated ? '~' : '') + Math.round(n.kcal) + ' kcal logged</b><span> / ' + html(api.state().profile.calories) + ' kcal target</span></div><div class="progress"><i style="width:' + Math.min(100, n.kcal / Math.max(1, Number(api.state().profile.calories)) * 100) + '%"></i></div><p class="sub">Protein ' + shown(n.p) + 'g · Carbs ' + shown(n.c) + 'g · Fat ' + shown(n.f) + 'g' + (Object.values(result.missing).some(Boolean) ? ' · some macros missing' : '') + '</p>' + (rows ? '<details class="planner-help"><summary>' + result.rows.length + ' logged item' + (result.rows.length === 1 ? '' : 's') + '</summary>' + rows + '</details>' : '<p class="sub">Add meals, snacks and drinks as you eat them.</p>') + (extras().length&&result.rows.length?'<details class="diary-nutrients"><summary>Label nutrient totals</summary>'+extras().map(field=>'<p>'+html(field.label)+': '+(result.extraMissing[field.key]===result.rows.length?'Unknown':html(shownNutrient(result.extraTotals[field.key])+' '+field.unit)+(result.extraMissing[field.key]?' · partial, '+result.extraMissing[field.key]+' foods missing':''))+'</p>').join('')+'<p class="sub">Missing label values are not counted as zero. Recipe and common-food estimates may not include these nutrients.</p></details>':'')+recentButtons() + '<small class="sub">Your intake only. Planned meals appear below; cooking and shopping do not log food automatically.</small></section>';
  }
  function options(query = '') {
    const q = query.trim().toLowerCase();
    const items = [
      ...core.recentFoods(api.state(), 20).map(row => ({key: 'recent:' + row.id, name: row.food.name, group: 'Recently logged · ' + row.date})),
      ...(api.state().savedFoods || []).map(food => ({ key: 'saved:' + food.id, name: food.name, group: 'Your labels' })),
      ...api.foodNames().map(name => ({ key: 'food:' + name, name, group: /^(rice|pasta|oats|noodles|orzo|couscous|red lentils)$/.test(name) ? 'Dry weight · estimate' : name === 'chicken breast' ? 'Raw weight · estimate' : 'Common food · estimate' })),
      ...api.recipes().filter(recipe => api.recipeNutrition(recipe).complete).map(recipe => ({ key: 'recipe:' + recipe.id, name: recipe.name, group: 'Recipe · per portion' })),
    ];
    if (draft?.snapshotFood && !items.some(item => item.key === draft.selection)) items.unshift({ key: draft.selection, name: draft.snapshotFood.name, group: 'Recorded food values' });
    const choices = items.filter(item => item.name.toLowerCase().includes(q)).slice(0, 80);
    const selected = items.find(item => item.key === draft?.selection);
    if (selected && !choices.some(item => item.key === selected.key)) choices.unshift(selected);
    return choices;
  }
  function search() {
    const target = document.getElementById('diaryFood'), choices = options(document.getElementById('diarySearch')?.value || '');
    target.innerHTML = '<option value="">Choose food or a recipe</option>' + choices.map(item => '<option value="' + html(item.key) + '">' + html(item.name + ' · ' + item.group) + '</option>').join('');
    if (choices.some(item => item.key === draft.selection)) target.value = draft.selection;
  }
  function draw() {
    const editing = Boolean(draft.entry), manual = draft.manual;
    const row = draft.entry;
    document.getElementById('sheet').innerHTML = '<button class="close" aria-label="Close food log" onclick="FoodLogUI.close()">×</button><h2>' + (editing ? 'Edit logged food' : draft.provenance ? 'Review scanned food' : 'Log food') + '</h2><p class="sub">Amount eaten by you, for this date.</p><div class="field"><label for="diaryDate">Date</label><input id="diaryDate" type="date" value="' + html(row?.date || draft.logDate || date) + '"></div>' + (!editing ? '<div class="checkrow"><button class="chip ' + (!manual ? 'on' : '') + '" onclick="FoodLogUI.findFood()">Food or recipe</button><button class="chip ' + (manual ? 'on' : '') + '" onclick="FoodLogUI.mode(true)">Enter label</button>'+(root.BarcodeUI?'<button class="chip" onclick="BarcodeUI.open(document.getElementById(\'diaryDate\').value,document.getElementById(\'diaryMeal\').value)">Scan barcode</button>':'')+'</div>' : '') +
      (!editing && !manual && !draft.fromPicker ? recentButtons('modal') : '') + (editing ? '<h3>' + html(row.food.name) + '</h3>' : manual ? (draft.provenance?'<div class="scanned-food-heading"><h3>'+html(draft.productName||'Your product')+'</h3><p class="sub">'+html(draft.brand||'')+'</p></div><details class="label-editor" '+(draft.reviewReady?'':'open')+'><summary>Review or correct the label</summary>':'')+'<div class="field"><label for="diaryName">Food name</label><input id="diaryName" maxlength="160" oninput="FoodLogUI.preview()" placeholder="Your snack or drink"></div><div class="grid"><div class="field"><label for="diaryBasis">Label amount</label><input id="diaryBasis" type="number" min="0.01" step="any" value="100" oninput="FoodLogUI.preview()"></div><div class="field"><label for="diaryBasisUnit">Label unit</label><select id="diaryBasisUnit" onchange="FoodLogUI.preview()"><option value="g">g</option><option value="ml">ml</option><option value="portion">portion</option></select></div></div><div class="grid">' + [['kcal', 'Calories (kcal)'], ['p', 'Protein (g)'], ['c', 'Carbs (g)'], ['f', 'Fat (g)']].map(([key, label]) => '<div class="field"><label for="diary-' + key + '">' + label + '</label><input id="diary-' + key + '" type="number" min="0" step="any" placeholder="' + (key === 'kcal' ? 'Required' : 'Leave blank if unknown') + '" oninput="FoodLogUI.preview()"></div>').join('') + '</div><details class="label-nutrients"><summary>Fibre, sugars, salt, vitamins and minerals</summary><div class="grid">'+extras().map(field=>'<div class="field"><label for="diary-'+field.key+'">'+html(field.label+' ('+field.unit+')')+'</label><input id="diary-'+field.key+'" type="number" min="0" step="any" placeholder="Unknown" oninput="FoodLogUI.preview()"></div>').join('')+'</div></details><div class="grid"><div class="field"><label for="diaryServing">One serving weighs (g/ml)</label><input id="diaryServing" type="number" min="0.01" step="any" oninput="FoodLogUI.preview()" placeholder="Optional"></div><div class="field"><label for="diaryPack">Whole pack contains (g/ml)</label><input id="diaryPack" type="number" min="0.01" step="any" oninput="FoodLogUI.preview()" placeholder="Optional"></div></div><p class="sub">Values above are for the label amount. Serving and pack weights use the same g/ml unit. Missing nutrients stay unknown.</p>'+(draft.provenance?'</details>':'') : (draft.fromPicker?'<h3>'+html(options().find(option=>option.key===draft.selection)?.name||'Selected food')+'</h3><button class="text-button" onclick="FoodPickerUI.open(document.getElementById(\'diaryDate\').value,document.getElementById(\'diaryMeal\').value)">Change food</button><div hidden>':'')+'<div class="field"><label for="diarySearch">Find a food or recipe</label><input id="diarySearch" type="search" placeholder="Banana, chocolate, overnight oats…" oninput="FoodLogUI.search()"></div><div class="field"><label for="diaryFood">Food</label><select id="diaryFood" onchange="FoodLogUI.select(this.value)"></select></div>'+(draft.fromPicker?'</div>':'')) +
      '<div class="field"><label for="diaryMeal">Diary meal</label><select id="diaryMeal"><option value="">Uncategorised</option>'+meals.map(meal=>'<option '+((row?.meal||draft.meal)===meal?'selected':'')+'>'+meal+'</option>').join('')+'</select></div><div class="grid"><div class="field"><label for="diaryAmount">Amount you ate</label><input id="diaryAmount" type="number" min="0.01" step="any" value="' + (row?.quantity || 1) + '" oninput="FoodLogUI.preview()"></div><div class="field"><label for="diaryUnit">Unit</label><select id="diaryUnit" onchange="FoodLogUI.measure()">' + ['g', 'ml', 'piece', 'slice', 'tsp', 'tbsp', 'portion'].map(unit => '<option>' + unit + '</option>').join('') + '</select></div></div><div id="diaryPreview" class="import-preview" role="status" aria-live="polite"></div>' +
      (draft.manual?'<div class="actions portion-shortcuts"><button class="chip" onclick="FoodLogUI.portion(0.5)">½ serving</button><button class="chip" onclick="FoodLogUI.portion(1)">1 serving</button><button class="chip" onclick="FoodLogUI.portion(2)">2 servings</button><button class="chip" onclick="FoodLogUI.portion(1,true)">Whole pack</button></div>':'')+(draft.provenance ? '<div class="barcode-attribution">'+(draft.provenance.source==='Open Food Facts'?'<a target="_blank" rel="noopener noreferrer" href="'+html(draft.provenance.sourceUrl)+'">Open Food Facts · ODbL</a>':'Your pack label')+'<p>'+html(draft.brand||'')+'</p><p>'+html((draft.warnings||[]).join(' '))+'</p><p>Check the product name, all values and the g/ml basis against your current pack.</p><label class="diary-save-label"><input id="barcodeConfirmed" type="checkbox"> I checked these values and the label amount/unit.</label></div>':'')+
      (manual && !editing ? '<label class="diary-save-label"><input id="diarySaveFood" type="checkbox" checked> Save this label to use again</label>' : '') + '<div class="actions"><button class="btn" onclick="FoodLogUI.commit()">' + (editing ? 'Save entry' : 'Add to diary') + '</button>' + (editing ? '<button class="btn secondary" onclick="FoodLogUI.remove()">Remove entry</button>' : draft.provenance?'<button class="btn secondary" onclick="FoodLogUI.commit(true)">Add & scan next</button>' : '') + '</div>';
    document.getElementById('modal').style.display = 'flex';
    if (editing) { document.getElementById('diaryUnit').value = row.food.unit; document.getElementById('diaryUnit').disabled = true; }
    else if (!manual) { search(); if (draft.selection) select(draft.selection, true); }
    else { document.getElementById('diaryAmount').value = 100; document.getElementById('diaryUnit').disabled = true; }
    preview();
  }
  function select(key, initial = false) {
    draft.selection = key;
    if (!initial) draft.originKey = null;
    const unit = document.getElementById('diaryUnit'), amount = document.getElementById('diaryAmount');
    unit.disabled = false;
    if (key.startsWith('recent:')) {
      const row = api.state().foodLog.find(row => row.id === key.slice(7));
      if (!row && !draft.snapshotFood) { api.toast('This diary entry is no longer available.'); return; }
      if (!initial || !draft.snapshotFood) draft.snapshotFood = core.definition(row.food);
      unit.value = draft.snapshotFood.unit; unit.disabled = true; amount.value = initial && draft.portions || row.quantity;
    }
    else if (key.startsWith('recipe:')) { unit.value = 'portion'; unit.disabled = true; amount.value = initial && draft.portions || 1; }
    else if (key.startsWith('saved:')) { const food = api.state().savedFoods.find(row => row.id === key.slice(6)); if (food) { unit.value = food.unit; unit.disabled = true; amount.value = food.quantity; } }
    else if (key.startsWith('food:')) { const profile = api.foodProfile(key.slice(5)); unit.value = profile?.basis === 'ml' ? 'ml' : profile?.eachG ? 'piece' : 'g'; amount.value = unit.value === 'piece' ? 1 : 100; }
    preview();
  }
  function definition() {
    if (draft.entry) return draft.entry.food;
    if (draft.manual) {
      const n = { source: 'label' };
      for (const key of ['kcal', 'p', 'c', 'f',...extras().map(field=>field.key)]) n[key] = document.getElementById('diary-' + key).value.trim() || null;
      return core.definition({ brand:draft.brand,serving:labelMeasure('diaryServing','Serving'),pack:labelMeasure('diaryPack','Whole pack'),name: document.getElementById('diaryName').value, quantity: document.getElementById('diaryBasis').value, unit: document.getElementById('diaryBasisUnit').value, nutrition: n, provenance: draft.provenance, note: draft.provenance ? 'Barcode '+draft.provenance.barcode+' · label reviewed by you.' : '' });
    }
    const key = draft.selection || '';
    if (key.startsWith('recent:')) return core.definition(draft.snapshotFood);
    if (key.startsWith('saved:')) return api.state().savedFoods.find(row => row.id === key.slice(6));
    if (key.startsWith('recipe:')) {
      const recipe = api.recipes().find(row => row.id === key.slice(7)), n = recipe && api.recipeNutrition(recipe);
      if (!n?.complete) throw new Error('This recipe needs a complete nutrition estimate first.');
      return { name: recipe.name, quantity: 1, unit: 'portion', nutrition: { ...n, source: 'recipe' } };
    }
    if (key.startsWith('food:')) {
      const name = key.slice(5), unit = document.getElementById('diaryUnit').value;
      const n = api.ingredientNutrition({ servings: 1, ings: [[name, 1, unit]] });
      if (!n.complete) throw new Error('That unit cannot be estimated for this food. Use g or ml, or enter the label.');
      const weightNote = /^(rice|pasta|oats|noodles|orzo|couscous|red lentils)$/.test(name) ? 'Use the dry weight. Choose cooked rice or cooked pasta for cooked amounts.' : name === 'chicken breast' ? 'Use the raw weight; cooked chicken has a different weight.' : '';
      return { name, quantity: 1, unit, nutrition: { ...n, source: 'ingredients' }, note: weightNote || api.foodProfile(name)?.note || '' };
    }
    throw new Error('Choose a food or recipe, or enter its label.');
  }
  function labelMeasure(id,label){const raw=document.getElementById(id)?.value;if(raw==null||raw==='')return null;const quantity=Number(raw);if(!Number.isFinite(quantity)||quantity<=0||quantity>100000)throw new Error('Enter a valid '+label.toLowerCase()+' weight.');return {quantity,unit:document.getElementById('diaryBasisUnit').value,label};}
  function amountUnits(food){if(!draft.manual)return;const target=document.getElementById('diaryUnit'),previous=target.value,choices=[[food.unit,food.unit],...(food.serving?[['serving','Servings']]:[]),...(food.pack?[['pack','Packs']]:[])];target.innerHTML=choices.map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('');target.value=choices.some(([key])=>key===previous)?previous:food.unit;target.disabled=false;draft.amountUnit=target.value;}
  function amount(food){const quantity=document.getElementById('diaryAmount').value,unit=document.getElementById('diaryUnit').value;if(draft.manual&&['serving','pack'].includes(unit)){if(!food[unit])throw new Error('Enter the '+unit+' weight from your label.');return Number(quantity)*food[unit].quantity;}return quantity;}
  function measure(){if(!draft?.manual){preview();return;}try{const food=definition(),unit=document.getElementById('diaryUnit').value,old=draft.amountUnit||food.unit,factor=value=>['serving','pack'].includes(value)?food[value]?.quantity:1;if(!factor(unit))throw new Error('Enter the '+unit+' weight first.');document.getElementById('diaryAmount').value=Number((Number(document.getElementById('diaryAmount').value)*factor(old)/factor(unit)).toFixed(6));draft.amountUnit=unit;preview();}catch(e){api.toast(e.message);}}
  function portion(quantity,pack=false){try{const food=definition(),unit=pack?'pack':'serving';if(!food[unit])throw new Error('Enter the '+unit+' weight from your pack label first.');document.getElementById('diaryUnit').value=unit;document.getElementById('diaryAmount').value=quantity;draft.amountUnit=unit;preview();}catch(e){api.toast(e.message);}}
  function preview() {
    const target = document.getElementById('diaryPreview'); if (!target) return;
    try {
      const food = definition();amountUnits(food);const n = core.scaled(food, amount(food));
      if(!draft.manual)document.getElementById('diaryUnit').value = food.unit;
      document.getElementById('diaryUnit').disabled = !draft.manual&&(Boolean(draft.entry)||!(draft.selection||'').startsWith('food:'));
      target.innerHTML='<div class="scan-macros">'+[['kcal','kcal'],['p','g protein'],['c','g carbs'],['f','g fat']].map(([key,label])=>'<div><b>'+html(shown(n[key]))+'</b><span>'+label+'</span></div>').join('')+'</div><p class="sub">'+html(amount(food)+' '+food.unit+' recorded')+'</p>'+extras().filter(field=>n[field.key]!=null).map(field=>'<span class="nutrient-pill">'+html(field.label+': '+shownNutrient(n[field.key])+' '+field.unit)+'</span>').join('');
      target.setAttribute?.('aria-label',nutrientText(n));
      const signature=JSON.stringify(food);if(draft.reviewSignature&&draft.reviewSignature!==signature){const box=document.getElementById('barcodeConfirmed');if(box)box.checked=false;}draft.reviewSignature=signature;
      /* textual label status */ const description = nutrientText(n) + (n.source === 'label' ? ' · your label values' : ' · estimate') + (['p', 'c', 'f'].some(key => n[key] == null) ? ' · missing macros stay unknown' : '') + (food.note ? ' · ' + food.note : '');target.innerHTML+='<p class="sub">'+html(description)+'</p>';
    } catch (error) { target.textContent = error.message; }
  }
  function commit(scanNext=false) {
    try {
      if(draft.provenance&&!document.getElementById('barcodeConfirmed')?.checked)throw new Error('Confirm the product, values and label amount/unit before logging.');
      const food = definition(), quantity = amount(food), nextDate = document.getElementById('diaryDate').value, meal=document.getElementById('diaryMeal')?.value;
      core.scaled(food, quantity);
      if (!core.validDate(nextDate)) throw new Error('Choose a valid date.');
      if (document.getElementById('diarySaveFood')?.checked && api.state().savedFoods.length >= 300 && !(food.provenance && api.state().savedFoods.some(row=>root.BarcodeCore?.same(row.provenance?.barcode,food.provenance.barcode)))) throw new Error('Your saved food list is full. Untick Save this label to log it once.');
      const next=structuredClone(api.state());core.record(next, { id: draft.entry?.id, date: nextDate, food, quantity,meal,originKey: draft.entry?.originKey || draft.originKey });
      if (document.getElementById('diarySaveFood')?.checked) core.saveFood(next, food);
      if(api.commit)api.commit(next);else{Object.assign(api.state(),next);api.save();}
      date = nextDate; close();api.changed();api.toast('Added '+food.name);if(scanNext)root.BarcodeUI.open(nextDate,meal);
    } catch (error) { const target=document.getElementById('diaryPreview');if(target)target.textContent=error.message;api.toast(error.message); }
  }
  function close() { draft = null; api.close(); }
  root.FoodLogUI = Object.freeze({
    configure(value) { api = value; core.normalizeState(api.state()); }, panel, search, select, preview, commit, close,measure,portion,
    setDate(value) { if (core.validDate(value)) { date = value; api.changed(); } },
    moveDate(offset) { try { date = core.shiftDate(date, offset); api.changed(); } catch (error) { api.toast(error.message); } },
    today() { date = core.localDate(); api.changed(); },
    openRecent(id) {
      const row = api.state().foodLog.find(row => row.id === id);
      if (!row) { api.toast('This diary entry is no longer available.'); return; }
      try {
        const snapshotFood = core.definition(row.food);
        draft = { manual: false, selection: 'recent:' + id, portions: row.quantity, snapshotFood,meal:row.meal,logDate: date, originKey: null };
        draw();
      } catch (error) { api.toast(error.message); }
    },
    findFood(){const logDate=document.getElementById('diaryDate')?.value,meal=document.getElementById('diaryMeal')?.value;if(root.FoodPickerUI)root.FoodPickerUI.open(logDate,meal);else this.mode(false);},
    getDate:()=>date,
    open(logDate,meal) { draft = { manual: false,logDate:core.validDate(logDate)?logDate:date,meal }; draw(); },
    openSelection(key,logDate,meal) {const saved=key.startsWith('saved:')&&api.state().savedFoods.find(row=>row.id===key.slice(6));if(saved){this.openLabel({...saved,barcode:saved.provenance?.barcode,source:saved.provenance?.source,sourceUrl:saved.provenance?.sourceUrl},logDate,meal);return;}const recent=key.startsWith('recent:')&&api.state().foodLog.find(row=>row.id===key.slice(7));draft={manual:false,fromPicker:true,selection:key,logDate,meal,...(recent?{snapshotFood:core.definition(recent.food),portions:recent.quantity}: {})};draw();},
    openLabel(product,logDate,meal='Snack') { draft={manual:true,meal,productName:product.name,reviewReady:Boolean(product.name&&product.nutrition?.kcal!=null),provenance:root.BarcodeCore?.provenance(product),logDate:core.validDate(logDate)?logDate:date,warnings:product.warnings||[],brand:product.brand||''}; draw(); document.getElementById('diaryName').value=product.name||'';document.getElementById('diaryBasis').value=product.quantity||100;document.getElementById('diaryBasisUnit').value=['g','ml'].includes(product.unit)?product.unit:'g';document.getElementById('diaryUnit').value=document.getElementById('diaryBasisUnit').value;document.getElementById('diaryAmount').value=product.quantity||100;document.getElementById('diaryServing').value=product.serving?.quantity??'';document.getElementById('diaryPack').value=product.pack?.quantity??'';for(const key of ['kcal','p','c','f',...extras().map(field=>field.key)])document.getElementById('diary-'+key).value=product.nutrition?.[key]??'';const target=document.getElementById('diaryPreview');target.textContent=(product.warnings||[]).join(' '); preview();if(product.serving?.quantity)portion(1); },
    mode(manual) { const nextDate = document.getElementById('diaryDate')?.value; draft = { manual,meal:document.getElementById('diaryMeal')?.value,logDate: core.validDate(nextDate) ? nextDate : date }; draw(); },
    openRecipe(id, day = null, index = null) {
      const recipe = api.recipes().find(row => row.id === id);
      if (!recipe || !api.recipeNutrition(recipe).complete) { api.toast('Complete the recipe nutrition before logging it.'); return; }
      draft = { manual: false,meal:recipe.cat==='Fruit'?'Snack':recipe.cat,selection: 'recipe:' + id, portions: day == null ? 1 : api.portions(day, index) / Math.max(1, Number(api.state().profile.people) || 1),
        originKey: day == null ? null : (api.state().pantryLedger?.planId || 'current') + '::' + day + '::' + index };
      draw();
    },
    edit(id) { const row = api.state().foodLog.find(value => value.id === id); if (row) { draft = { entry: row }; draw(); } },
    remove() { if (!draft?.entry) return;try{const next=structuredClone(api.state());next.foodLog=next.foodLog.filter(row=>row.id!==draft.entry.id);if(api.commit)api.commit(next);else{Object.assign(api.state(),next);api.save();}close();api.changed();api.toast('Food entry removed');}catch(error){api.toast('Entry could not be removed. '+error.message);} },
  });
})(globalThis);
