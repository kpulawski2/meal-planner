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
    api.openSheet('<section class="kitchen-chat"><span class="eyebrow">Your everyday kitchen companion</span><h2>Kitchen assistant</h2><p class="sub">Tell me the meals, period and targets. I’ll build and save a plan here after the nutrition and budget checks pass.</p><div class="agent-toolbar"><button class="text-button" onclick="KitchenAgentUI.clear()">New conversation</button></div><details class="planner-help agent-context"><summary>Context I can use</summary><label class="tailored-check"><input id="agentUseSettings" type="checkbox" ' + (s.useSettings ? 'checked' : '') + ' onchange="KitchenAgentUI.contextChanged()"> Share my goals, diet, budget and equipment with AI</label><label class="tailored-check"><input id="agentUsePantry" type="checkbox" ' + (s.usePantry ? 'checked' : '') + ' onchange="KitchenAgentUI.contextChanged()"> Share my recorded pantry stock with AI</label><p class="sub">Your request and selected context can be sent for AI interpretation. Plan creation uses your current planning settings and recorded stock on the app’s planner server to check portions and supermarket packs, even when AI context is off. Food diary and personal cooking notes stay on this device. Current food/equipment settings still protect the recipe choices. AI may be unavailable or limited; measured on-device matching keeps working.</p></details><div id="agentMessages" class="agent-messages" aria-label="Kitchen conversation"></div><div id="agentStatus" role="status" aria-live="polite"></div><div class="agent-compose"><div class="field"><label for="agentQuestion">Your plan, question or follow-up</label><textarea id="agentQuestion" maxlength="2000" rows="3" placeholder="For 14 days: varied overnight oats for breakfast, tuna wraps for lunch and chicken dinners. Under 1600 calories, 150g protein, 90g carbs and max 20g fat." oninput="KitchenAgentUI.capture()">' + esc(s.draft) + '</textarea></div><div class="actions"><button id="agentSend" class="btn" onclick="KitchenAgentUI.send()">Send</button><button id="agentStop" class="btn secondary" onclick="KitchenAgentUI.stopRequest()" hidden>Stop</button></div></div></section>');
    draw(); void api.loadRecipes();
  }
  function capture() { if (!active) return; const s = session(); s.draft = (document.getElementById('agentQuestion')?.value || '').slice(0, 2000); api.save(); }
  function stop() { controller?.abort(); controller = null; busy = false; generation++; if (pending) { const s = session(); if (s.messages.at(-1)?.role === 'user') s.messages.pop(); api.save(); pending = false; } }
  function cancel() { if (active) capture(); stop(); active = false; }
  function contextChanged() { stop(); const s = session(); s.useSettings = document.getElementById('agentUseSettings')?.checked === true; s.usePantry = document.getElementById('agentUsePantry')?.checked === true; api.save(); draw(); }
  function clear() { stop(); const s = session(); api.state().kitchenConversation = { ...s, messages: [], focus: Core().focus(), draft: '', planDraft:null }; api.save(); document.getElementById('agentQuestion').value = ''; draw(); }
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
    try { const parsed=Core().interpret(question,s.focus),last=s.messages.at(-1);if(root.KitchenPlanCore.isPlan(question,parsed.kind,s.planDraft,last?.kind))return await sendPlan(question,s); }
    catch(error){document.getElementById('agentStatus').textContent=error.message;return;}
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
      reply = { text:data.text,source:data.source==='ai'?'ai':'local',recipeIds:data.recipeIds,followUps:Array.isArray(data.followUps)?data.followUps.slice(0,3):[],kind:work.parsed.kind };
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
  function planningStateKey(){const s=api.state();return JSON.stringify([s.profile,s.week,s.mealServings,s.locked,s.pantry,s.leftovers,s.pantryLedger,s.favorites,s.recipeFeedback,s.shoppingStore]);}
  async function sendPlan(question,s){
    const Plan=root.KitchenPlanCore,current=++generation,previous=Plan.rebase(s.planDraft,api.state().profile),useSettings=s.useSettings;let draft,source='local',reply;
    s.messages.push({role:'user',text:question,recipeIds:[]});s.draft=question;api.save();pending=true;busy=true;draw();
    const requestController=new AbortController();controller=requestController;
    const progress=text=>{if(active&&current===generation&&document.getElementById('agentStatus'))document.getElementById('agentStatus').textContent=text;};
    try{
      progress('Understanding your meals and daily targets…');await api.loadRecipes();if(requestController.signal.aborted)return;
      const baseline=planningStateKey(),profile=structuredClone(api.state().profile);let work=Plan.merge(question,previous,profile);draft=work.draft;
      // Invalid periods/limits get an inline question, rather than consuming AI calls.
      root.MealIntentCore.normaliseBrief(draft);
      const defaults=useSettings?{days:draft.days,meals:draft.meals,calories:draft.calories,protein:draft.protein,nutritionTargets:draft.nutritionTargets,requests:draft.requests,scheduledMeals:draft.scheduledMeals}:{};
      const interpretation=new AbortController(),abortInterpretation=()=>interpretation.abort();requestController.signal.addEventListener('abort',abortInterpretation,{once:true});
      const timer=root.setTimeout(()=>interpretation.abort(),22000);
      try{
        const response=await fetch('/api/planner/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:previous?.pendingCategory?work.text:question,defaults,direct:true}),signal:interpretation.signal});
        if(response.ok){const data=await response.json();work=Plan.merge(question,previous,profile,data);draft=work.draft;source=work.source;}
      }catch{ /* The local parser preserves explicit meals, numbers and prior follow-ups. */ }
      finally{root.clearTimeout(timer);requestController.signal.removeEventListener('abort',abortInterpretation);}
      if(requestController.signal.aborted){reply={status:'cancelled',text:'Planning stopped before anything was saved. Please send your request again.'};}
      else if(planningStateKey()!==baseline){reply={status:'stale',text:'Your settings, stock or saved meals changed while I was interpreting that. Send it again so I can use the latest details.'};}
      else{
        const candidate=Plan.prepare(draft,profile,api.recipes(),{allowed:api.allowed,nutrition:api.planNutrition||api.nutrition});
        const ids=new Set([...Object.values(candidate.tailoredMeals).flatMap(row=>row.recipeIds),...candidate.scheduledMeals.flatMap(row=>row.recipeIds)]),signatures=new Map(api.recipes().filter(r=>ids.has(r.id)).map(r=>[r.id,Core().signature({...r,method:api.steps(r)})]));
        const guard=()=>active&&current===generation&&planningStateKey()===baseline&&[...signatures].every(([id,value])=>{const r=api.recipes().find(row=>row.id===id);return r&&value===Core().signature({...r,method:api.steps(r)});});
        session().planDraft=draft;api.save();progress('Finding your meals and checking portions, nutrition and supermarket packs…');
        const outcome=await api.generate(candidate,{signal:requestController.signal,onProgress:progress,guard});
        if(outcome?.status==='feasible'){
          const state=api.state(),cost=Number(outcome.result.basket.totalCostGBP)+Number(api.spent?.()||0);
          reply={status:'saved',text:'I’ve made and saved your '+state.week.length+'-day plan. The meals, portions, nutrition and full-pack shopping budget passed the planner’s checks. Tell me any changes here and I’ll update it.',cost,budget:candidate.budget*candidate.days/7,days:candidate.days,meals:candidate.meals,store:candidate.supermarket||profile.supermarket||'',signature:Plan.planSignature(state)};
        }else{
          reply={status:['no_feasible_plan','stale','cancelled'].includes(outcome?.status)?outcome.status:'unavailable',text:outcome?.message||'I couldn’t finish the price and nutrition checks. Your saved plan and settings are unchanged. Try again here when the planner is available.'};
          if(outcome?.result?.warnings?.some(warning=>typeof warning==='string'&&/complete daily meals within the nutrition range/.test(warning)))reply.text='I found measured matches, but the search couldn’t combine their supported portions within all your daily nutrition limits. Your saved plan and targets are unchanged. Which meal choice or target would you like to change?';
          const reported=outcome?.result?.basket?.totalCostGBP,limit=candidate.budget*candidate.days/7,cost=typeof reported==='number'?reported+Number(api.spent?.()||0):NaN;
          if(outcome?.status==='no_feasible_plan'&&outcome.result.basket?.complete===true&&Number.isFinite(cost)&&cost>limit){draft.pendingField='budget';reply.text='The search reported a £'+cost.toFixed(2)+' basket against your £'+limit.toFixed(2)+' household budget. I haven’t changed your saved plan or targets. What weekly budget would you like to use, or would you prefer different meals?';}
        }
      }
    }catch(error){
      if(draft&&error.category){draft.pendingCategory=error.category;draft.pendingDay=error.day||0;}
      if(draft){const field=String(error.message).match(/Check (?:the )?(days|meals|calories|protein|carbs|fatMax)/)?.[1]||(/weekly household budget/.test(error.message)?'budget':/many people/.test(error.message)?'people':'');draft.pendingField=error.field||field;}
      const text=/Check days/.test(error.message)?'How many days would you like, from 1 to 14?':String(error.message||'Please describe the meals and targets again.').replace(/fatMax/g,'maximum fat');
      reply={status:'needs_info',text};
    }finally{if(controller===requestController)controller=null;}
    if(!active||current!==generation||!document.getElementById('agentMessages'))return;
    if(!reply)reply={status:'cancelled',text:'Planning stopped. Your saved plan and settings are unchanged.'};
    const live=session();if(draft)live.planDraft=draft;live.draft='';live.messages.push({role:'assistant',kind:'plan',source,text:reply.text,recipeIds:[],followUps:[],planReceipt:reply});live.messages=live.messages.slice(-24);
    pending=false;busy=false;api.save();document.getElementById('agentQuestion').value='';draw();progress(reply.status==='saved'?'Plan checked and saved. You can keep talking here.':'Tell me the change here, or try again when you’re ready.');
    document.getElementById('agentMessages').lastElementChild?.scrollIntoView?.({behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  function stopRequest(){stop();draw();const target=document.getElementById('agentStatus');if(target)target.textContent='Stopped. Your saved plan and settings are unchanged.';}
  function planReceipt(message){
    const receipt=message.planReceipt;if(receipt?.status!=='saved')return '';
    if(receipt.signature!==root.KitchenPlanCore.planSignature(api.state()))return '<p class="sub">This was an earlier saved plan. Your current plan or settings have since changed.</p>';
    const state=api.state(),cost=Number.isFinite(receipt.cost)?'£'+receipt.cost.toFixed(2):'—',budget=Number.isFinite(receipt.budget)?'£'+receipt.budget.toFixed(2):'—';
    return '<section class="agent-plan-result"><h4>Your saved plan</h4><p>'+receipt.days+' days · '+receipt.meals+' meals a day · '+esc(state.profile.people)+' '+(Number(state.profile.people)===1?'person':'people')+'</p><p class="sub">'+root.MacroGoalsCore.summary(state.profile).map(esc).join(' · ')+'</p><p><b>'+cost+'</b> / '+budget+' household budget</p><small class="sub">Remaining '+esc(receipt.store)+' packs + recorded purchases, checked when saved. Prices can change.</small><details class="planner-help"><summary>See the meals</summary>'+state.week.map(row=>'<div class="agent-plan-day"><b>'+esc(row.day)+'</b><ul>'+row.meals.map(id=>'<li>'+esc(api.recipes().find(r=>r.id===id)?.name||'Recipe unavailable')+'</li>').join('')+'</ul></div>').join('')+'</details><button class="btn secondary small" onclick="KitchenAgentUI.showPlan()">View my plan</button></section>';
  }
  function showPlan(){cancel();api.showPlan();}
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
        + (message.kind === 'plan' ? planReceipt(message)+(message.planReceipt?'':'<button class="btn secondary small" onclick="KitchenAgentUI.plan('+index+')">Make this plan</button>') : message.kind === 'diary' ? '<button class="btn" onclick="KitchenAgentUI.diary()">Log food</button>' : '')
        + '<div class="agent-followups">' + message.followUps.map(value => '<button class="chip" ' + (busy ? 'disabled' : '') + ' onclick="KitchenAgentUI.follow(decodeURIComponent(\'' + arg(value) + '\'))">' + esc(value) + '</button>').join('') + '</div>' : '') + '</article>').join('')
      : '<div class="agent-welcome"><h3>What would you like to eat?</h3><p>Describe your plan and I’ll build it here. For example: “14 days of varied overnight oats, tuna wraps for lunch and chicken dinners, under 1600 calories with 150g protein.” You can also ask for recipe ideas or prep help.</p></div>';
    const button = document.getElementById('agentSend'); if (button) button.disabled = busy;
    const question=document.getElementById('agentQuestion');if(question)question.readOnly=busy;
    const stopButton=document.getElementById('agentStop');if(stopButton)stopButton.hidden=!busy;
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
  function plan(index) { const s=session(),message=s.messages[index],question=s.messages.slice(0,index).reverse().find(row=>row.role==='user')?.text;if(message?.role==='assistant'&&message.kind==='plan'&&question)follow(question); }
  root.KitchenAgentUI = { configure: value => { api = value; }, panel, open, capture, cancel, contextChanged, clear, follow, send, view, prepare, prep, diary, plan,stopRequest,showPlan };
})(globalThis);
