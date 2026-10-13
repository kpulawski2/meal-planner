(function(root) {
  'use strict';
  let api, active = false, busy = false, generation = 0, controller = null, pending = false;
  const Core = () => root.KitchenAgentCore;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const arg = value => encodeURIComponent(String(value)).replace(/'/g, '%27');
  const session = () => api.state().kitchenConversation = Core().normalizeSession(api.state().kitchenConversation);
  function panel() { return '<section class="card assistant-entry"><span class="eyebrow">Ideas, answers and a helpful next step</span><h3>Kitchen assistant</h3><p class="sub">Ask about meals, compare recipes or work through a prep idea. Follow up to make it suit you.</p><div class="actions"><button class="btn" onclick="KitchenAgentUI.open()">Chat with my assistant</button><button class="btn secondary" onclick="KitchenAssistantUI.open()">Batch prep guide</button></div></section>'; }
  function open() {
    cancel(); root.ConsumerUI?.cleanup(); active = true; const s = session();
    api.openSheet('<section class="kitchen-chat"><span class="eyebrow">Your everyday kitchen companion</span><h2>Kitchen assistant</h2><p class="sub">A conversation around your recipes, preferences and what you have. Everything you save or record gets a review first.</p><div class="agent-toolbar"><button class="text-button" onclick="KitchenAgentUI.clear()">New conversation</button><button class="text-button" onclick="KitchenAgentUI.prep()">Open batch prep</button></div><details class="planner-help agent-context"><summary>Context I can use</summary><label class="tailored-check"><input id="agentUseSettings" type="checkbox" ' + (s.useSettings ? 'checked' : '') + ' onchange="KitchenAgentUI.contextChanged()"> Include my goals, diet, budget and equipment</label><label class="tailored-check"><input id="agentUsePantry" type="checkbox" ' + (s.usePantry ? 'checked' : '') + ' onchange="KitchenAgentUI.contextChanged()"> Include my recorded pantry stock</label><p class="sub">Recipe options and this conversation can be sent for AI help with the context selected above. Food diary and personal cooking notes stay on this device. Current food/equipment settings still protect the recipe choices. AI may be unavailable or limited; measured on-device matching keeps working.</p></details><div id="agentMessages" class="agent-messages" aria-label="Kitchen conversation"></div><div id="agentStatus" role="status" aria-live="polite"></div><div class="agent-compose"><div class="field"><label for="agentQuestion">Your question or follow-up</label><textarea id="agentQuestion" maxlength="2000" rows="3" placeholder="High-protein chicken curry for meal prep… then: make it lower fat, or compare these choices." oninput="KitchenAgentUI.capture()">' + esc(s.draft) + '</textarea></div><div class="actions"><button id="agentSend" class="btn" onclick="KitchenAgentUI.send()">Ask assistant</button><button class="btn secondary" onclick="closeModal()">Save & close</button></div><div class="agent-starters">' + ['Find high-protein chicken dinners', 'Use what is in my pantry', 'I want overnight oats ideas', 'Help me prep 1kg chicken curry for 5 days'].map(value => '<button class="chip" onclick="KitchenAgentUI.follow(decodeURIComponent(\'' + arg(value) + '\'))">' + esc(value) + '</button>').join('') + '</div></div></section>');
    draw(); void api.loadRecipes();
  }
  function capture() { if (!active) return; const s = session(); s.draft = (document.getElementById('agentQuestion')?.value || '').slice(0, 2000); api.save(); }
  function stop() { controller?.abort(); controller = null; busy = false; generation++; if (pending) { const s = session(); if (s.messages.at(-1)?.role === 'user') s.messages.pop(); api.save(); pending = false; } }
  function cancel() { if (active) capture(); stop(); active = false; }
  function contextChanged() { stop(); const s = session(); s.useSettings = document.getElementById('agentUseSettings')?.checked === true; s.usePantry = document.getElementById('agentUsePantry')?.checked === true; api.save(); draw(); }
  function clear() { stop(); const s = session(); api.state().kitchenConversation = { ...s, messages: [], focus: Core().focus(), draft: '' }; api.save(); document.getElementById('agentQuestion').value = ''; draw(); }
  function follow(value) { if (!active) return; if (/pantry/.test(value)) { const s = session(); s.usePantry = true; document.getElementById('agentUsePantry').checked = true; api.save(); } document.getElementById('agentQuestion').value = value; capture(); void send(); }
  function input(question, s) {
    const parsed = Core().interpret(question, s.focus), pantry = s.usePantry ? root.PantryCore.activePantry(api.state().pantry) : [];
    const last = [...s.messages].reverse().find(message => message.role === 'assistant');
    const rows = Core().retrieve(api.recipes(), parsed, { ready: (recipe, diet) => api.ready(recipe, diet), nutrition: api.nutrition, pantry,
      pantryScore: recipe => root.KitchenToolsCore?.suggestions([recipe], pantry, 1)[0] || null, lastIds: last?.recipeIds || [], favorites: api.state().favorites || [] })
      .map(row => ({...row,signature:Core().signature({...row.recipe,method:api.steps(row.recipe)})}));
    const profile = api.state().profile;
    const context = s.useSettings || s.usePantry ? { ...(s.useSettings ? { equipment: profile.equipment || [], diet: profile.diet || '', targets: root.MacroGoalsCore.summary(profile).join(' · '), supermarket: profile.supermarket || '', weeklyBudget: Number(profile.budget) } : {}),
      ...(s.usePantry ? { pantry: pantry.slice(0, 20).map(item => ({ name: item.name, quantity: Number(item.qty), unit: item.unit })) } : {}) } : null;
    const recipes = rows.map(({recipe, nutrition, stock}) => ({ id: recipe.id, name: recipe.name, category: recipe.cat, nutrition: { kcal: nutrition.kcal, p: nutrition.p, c: nutrition.c, f: nutrition.f },
      ingredients: recipe.ings.slice(0, 12).map(row => [row[0], Number(row[1]), row[2] || 'piece']), servings: Number(recipe.servings ?? 1), minutes: Number(recipe.cookTime ?? recipe.time) || null,
      equipment: recipe.equipment || [], steps: api.steps(recipe).slice(0, 4), pantry: stock ? { ready: stock.ready, missing: stock.missing.map(row => row.name) } : null }));
    return { parsed, rows, body: { text: question, focus: s.focus, recipes, context, history: s.messages.slice(-6).map(message => ({ role: message.role, text: message.text })) } };
  }
  async function send() {
    if (!active || busy) return;
    const s = session(), question = document.getElementById('agentQuestion').value.trim(); let work;
    try { work = input(question, s); } catch (error) { document.getElementById('agentStatus').textContent = error.message; return; }
    const historyBefore = s.messages.map(message => ({ ...message })), priorFocus = { ...s.focus }, current = ++generation;
    s.messages.push({ role: 'user', text: question, recipeIds: [] }); s.draft = question; api.save(); pending = true; busy = true; draw();
    const button = document.getElementById('agentSend'); button.disabled = true; document.getElementById('agentStatus').textContent = 'Looking through your measured recipe options…';
    const requestController = new AbortController(); controller = requestController; const timer = root.setTimeout(() => requestController.abort(), 22000);
    let reply = Core().localReply(work.parsed, work.rows);
    try {
      const response = await fetch('/api/kitchen/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(work.body), signal: requestController.signal });
      if (!response.ok) throw new Error('unavailable'); const data = await response.json();
      const allowed = new Set(work.rows.map(row => row.recipe.id));
      if (typeof data.text !== 'string' || data.text.length > 1600 || !Array.isArray(data.recipeIds) || data.recipeIds.some(id => !allowed.has(id))) throw new Error('Unknown recipe data');
      reply = { ...data, kind: work.parsed.kind };
    } catch { /* The recipe comparisons and existing review actions work offline. */ }
    finally { root.clearTimeout(timer); if (controller === requestController) controller = null; }
    if (!active || current !== generation || !document.getElementById('agentMessages')) return;
    const live = session(); const refreshed = input(question, { ...live, focus: priorFocus, messages: historyBefore });
    if (JSON.stringify(refreshed.body) !== JSON.stringify(work.body)) {
      live.messages = historyBefore; pending = false; busy = false; api.save(); draw(); document.getElementById('agentStatus').textContent = 'Your recipe options or settings changed. Ask again to use the latest details.'; return;
    }
    live.focus = work.parsed.focus; live.draft = ''; live.messages.push({ ...reply, role: 'assistant', signatures: Object.fromEntries(work.rows.map(row => [row.recipe.id, row.signature])) });
    live.messages = live.messages.slice(-24); pending = false; busy = false; api.save(); document.getElementById('agentQuestion').value = ''; draw();
    document.getElementById('agentStatus').textContent = reply.source === 'ai' ? 'AI reply grounded in your recipe options. Review the measured cards before choosing.' : 'Using measured on-device matching. AI can help when its service is available.';
    const answer = document.getElementById('agentMessages').lastElementChild; answer?.scrollIntoView?.({ behavior: root.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  function actionAllowed(id, message) { const recipe = api.recipes().find(row => row.id === id); return recipe && api.ready(recipe, session().focus.diet) && message?.signatures?.[id] === Core().signature({...recipe,method:api.steps(recipe)}) ? recipe : null; }
  function card(id, message, index) {
    const recipe = api.recipes().find(row => row.id === id); if (!recipe) return '<p class="sub">A suggested recipe is no longer available.</p>';
    const n = api.nutrition(recipe), current = actionAllowed(id, message), key = arg(id);
    const stock = session().usePantry ? root.KitchenToolsCore?.suggestions([recipe], root.PantryCore.activePantry(api.state().pantry), 1)[0] : null;
    const actions = '<button class="btn secondary small" ' + (!current ? 'disabled' : '') + ' onclick="KitchenAgentUI.view(decodeURIComponent(\'' + key + '\'),' + index + ')">Open recipe</button>'
      + (root.KitchenAssistantUI.canPrep(recipe) ? '<button class="btn secondary small" ' + (!current ? 'disabled' : '') + ' onclick="KitchenAgentUI.prepare(decodeURIComponent(\'' + key + '\'),' + index + ')">Prep a batch</button>' : '');
    return '<article class="agent-recipe"><h4>' + esc(recipe.name) + '</h4><p class="sub">' + esc(recipe.cat + ' · ' + (Number(recipe.cookTime ?? recipe.time) > 0 ? (recipe.cookTime ?? recipe.time) + ' min active' : 'Time not recorded')) + '</p><div class="agent-macro-row">' + [['kcal','kcal'],['p','g protein'],['c','g carbs'],['f','g fat']].map(([key,label]) => '<span><b>' + (n.complete && Number.isFinite(n[key]) ? Number(n[key].toFixed(1)) : '—') + '</b> ' + label + '</span>').join('') + '</div><p class="sub">Per portion · ingredient estimates. Full-day targets and pack costs need plan fitting.</p>'
      + (stock ? '<p class="agent-stock">' + esc('Recorded stock for ' + stock.preparedServings + ' prepared portion' + (stock.preparedServings === 1 ? '' : 's') + ': ' + (stock.ready ? 'ready' : 'missing ' + stock.missing.map(row => row.name + ' (' + Number(row.qty.toFixed(2)) + ' ' + row.unit + ')').join(', ')) + (stock.estimated ? ' · quantities include estimates' : '')) + '</p>' : '')
      + '<div class="actions">' + actions + '</div>' + (!current ? '<p class="sub">This recipe or its settings changed. Ask again before choosing it.</p>' : '') + '</article>';
  }
  function draw() {
    const s = session(), target = document.getElementById('agentMessages'); if (!target) return;
    target.innerHTML = s.messages.length ? s.messages.map((message, index) => '<article class="agent-message ' + (message.role === 'user' ? 'agent-user' : 'agent-answer') + '"><span class="eyebrow">' + (message.role === 'user' ? 'You' : message.source === 'ai' ? 'Kitchen assistant · AI' : 'Kitchen assistant · on device') + '</span><p class="agent-answer-text">' + esc(message.text) + '</p>'
      + (message.role === 'assistant' ? '<div class="agent-recipe-grid">' + message.recipeIds.map(id => card(id, message, index)).join('') + '</div>' + (message.kind === 'storage' ? storage(message, index) : '')
        + (message.kind === 'plan' ? '<button class="btn" onclick="KitchenAgentUI.plan(' + index + ')">Review my plan request</button>' : message.kind === 'diary' ? '<button class="btn" onclick="KitchenAgentUI.diary()">Log food</button>' : '')
        + '<div class="agent-followups">' + message.followUps.map(value => '<button class="chip" ' + (busy ? 'disabled' : '') + ' onclick="KitchenAgentUI.follow(decodeURIComponent(\'' + arg(value) + '\'))">' + esc(value) + '</button>').join('') + '</div>' : '') + '</article>').join('')
      : '<div class="agent-welcome"><h3>What are we cooking?</h3><p>Ask for recipe ideas, a comparison, a plan request or a measured prep guide. Follow up with “less fat”, “without rice” or “something quicker”.</p></div>';
    const button = document.getElementById('agentSend'); if (button) button.disabled = busy;
  }
  function storage(message, index) {
    let recipe = api.recipes().find(row => message.recipeIds.includes(row.id)) || {ings:[]};
    const question = session().messages.slice(0, index).reverse().find(row => row.role === 'user')?.text || '';
    if (/\brice\b/i.test(question)) recipe = { ...recipe, ings: [...recipe.ings, ['Rice', 1, 'g']] };
    const guide = root.KitchenAssistantCore.storage(recipe, { ingredient: 'Chicken breast', basis: 'raw', days: 3, people: 1 });
    const rice = root.KitchenAssistantCore.storage({ings:[['Rice',1,'g']]}, {ingredient:'Chicken breast',basis:'raw',days:3,people:1});
    return '<section class="agent-storage"><h4>Storage & reheating guide</h4><p class="sub">Ordinary leftovers: use within 48 hours. Rice dishes: no more than 24 hours refrigerated. Follow shorter recipe or pack instructions.</p><ul>' + guide.steps.map(step => '<li>' + esc(step) + '</li>').join('') + '</ul><h4>If the dish includes rice</h4><p>' + esc(rice.steps[2]) + '</p>' + guide.sources.map(([name,url]) => '<p><a href="' + url + '" target="_blank" rel="noopener noreferrer">' + name + '</a></p>').join('') + '</section>';
  }
  function view(id, index) { const message = session().messages[index]; if (!actionAllowed(id, message)) { api.toast('Ask again: this recipe or your settings changed.'); return; } cancel(); api.showRecipe(id); }
  function prepare(id, index) {
    const s = session(), message = s.messages[index], recipe = actionAllowed(id, message); if (!recipe) { api.toast('Ask again: this recipe or your settings changed.'); return; }
    let wanted = root.KitchenAssistantCore.normalise({}, {people:Math.min(8, Math.max(1, Number(api.state().profile.people) || 1))});
    for (const row of s.messages.slice(0, index).filter(row => row.role === 'user')) {
      try {
        const main = root.KitchenAssistantCore.ingredient(row.text);
        wanted = root.KitchenAssistantCore.parse(row.text, { ...wanted, grams: main && main !== wanted.ingredient ? null : wanted.grams });
      } catch { /* Unconfirmed or unsupported batch measurements stay editable. */ }
    }
    cancel(); root.KitchenAssistantUI.openRecipe(id, wanted);
  }
  function prep() { cancel(); root.KitchenAssistantUI.open(); }
  function diary() { cancel(); root.FoodLogUI.open(); }
  function plan(index) { const s = session(), question = s.messages.slice(0, index).reverse().find(row => row.role === 'user')?.text; if (!question) return; api.state().tailoredDraft = { text: question }; api.save(); cancel(); root.TailoredPlanUI.open(); }
  root.KitchenAgentUI = { configure: value => { api = value; }, panel, open, capture, cancel, contextChanged, clear, follow, send, view, prepare, prep, diary, plan };
})(globalThis);
