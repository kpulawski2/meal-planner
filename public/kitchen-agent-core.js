/* Recipe retrieval is read-only; explicit plan requests use the checked planner. */
(function(root) {
  'use strict';
  const text = (value, max = 1200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const norm = value => text(value, 4000).normalize('NFKD').replace(/[łŁ]/g, 'l').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const proteins = ['chicken', 'turkey', 'beef', 'pork', 'salmon', 'tuna', 'prawn', 'tofu', 'chickpea', 'lentil', 'egg'];
  const styles = ['curry', 'chilli', 'stir fry', 'traybake', 'soup', 'stew', 'pasta', 'wrap', 'salad', 'fajita', 'teriyaki', 'tikka', 'bolognese', 'overnight oats', 'smoothie bowl'];
  const cuisines = ['romanian', 'polish', 'italian', 'japanese', 'korean', 'mexican', 'indian', 'greek', 'thai'];
  const foods = ['oats', 'rice', 'potato', 'broccoli', 'banana', 'berries', 'mushroom', 'yoghurt', 'skyr', 'pickle', 'cabbage', 'beetroot', 'pancake', 'buckwheat', 'polenta', 'bean', 'lemon', 'garlic', 'ginger'];
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];
  function focus(raw = {}) {
    const positive = value => value == null || value === '' ? null : Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
    return { protein: proteins.includes(raw.protein) ? raw.protein : '', style: styles.includes(raw.style) ? raw.style : '',
      cuisine: cuisines.includes(raw.cuisine) ? raw.cuisine : '', category: categories.includes(raw.category) ? raw.category : 'All',
      diet: ['Vegetarian', 'Vegan'].includes(raw.diet) ? raw.diet : '',
      terms: Array.isArray(raw.terms) ? raw.terms.filter(word => foods.includes(word)).slice(0, 6) : [],
      lowerFat: raw.lowerFat === true, highProtein: raw.highProtein === true, quick: raw.quick === true, fromPantry: raw.fromPantry === true,
      affordable: raw.affordable === true, exclude: Array.isArray(raw.exclude) ? [...new Set(raw.exclude.map(value => text(value, 35)).filter(Boolean))].slice(0, 16) : [],
      maxCalories: positive(raw.maxCalories), minProtein: positive(raw.minProtein), maxFat: positive(raw.maxFat) };
  }
  function intent(value) {
    const q = norm(value);
    if (/how (?:long|many days).*(?:keep|fridge|store)|safe(?:ly|ty)?|reheat|defrost|thaw|(?:can|should|how).*(?:freeze|store)|storage/.test(q)) return 'storage';
    if (/^(?:what|why|how many|how much|is|are|should i|can i)\b/.test(q)&&!/\b(?:make|create|build|generate|tailor|fit|change|update)\b.{0,60}\bplan\b/.test(q)||/\b(?:don’t|don't|do not)\s+(?:make|create|save|replace|build)\b/.test(q)) return 'discover';
    const measuredFood = /\b\d+(?:\.\d+)?\s*(?:kgs?|kilos?|grams?|g)\b\s*(?:of\s+|raw\s+|cooked\s+|dry\s+|drained\s+)*(?:chicken|turkey|beef|pork|tuna|salmon|tofu|chickpeas|lentils|rice|oats)\b/.test(q);
    if (/\b(?:prep|batch)\b/.test(q) || measuredFood && !/a day|per day|daily|\bplan\b/.test(q)) return 'prep';
    if (/\b(?:next|for)\s+(?:\d+|two|one|a)\s+(?:days|weeks|months|month|fortnight)|\bplan\b|a day|per day|daily.*(?:calories|protein)/.test(q) && !/\b(?:prep|batch)\b/.test(q)) return 'plan';
    if (/compare|difference|which (?:one|is)|versus|\bvs\b/.test(q)) return 'compare';
    if (/how (?:do i|to).*(?:cook|make)|walk me through|steps|method|cook (?:this|it)/.test(q) && !/\b\d+(?:\.\d+)?\s*(?:kg|g|kilos?)\b/.test(q)) return 'cook';
    if (/log (?:food|this|a|my)|food diary|track (?:food|my|this)/.test(q)) return 'diary';
    return 'discover';
  }
  function interpret(value, previous = {}) {
    if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new TypeError('Ask a kitchen question in 1–2000 characters.');
    const q = norm(value).replace(/\bchili\b/g, 'chilli').replace(/stir-fry/g, 'stir fry').replace(/tray bake/g, 'traybake'), next = focus(previous);
    const main = proteins.find(word => new RegExp('\\b' + word + 's?\\b').test(q));
    const category = categories.slice(1).find(word => q.includes(word.toLowerCase()));
    if (category && category !== next.category && !main) { next.protein = ''; next.style = ''; next.cuisine = ''; next.terms = []; }
    if (category) next.category = category;
    if (main && !new RegExp('\\b(?:no|without|avoid)\\s+' + main + 's?\\b').test(q)) next.protein = main;
    const style = styles.find(word => q.includes(word)), cuisine = cuisines.find(word => q.includes(word));
    if (style) next.style = style; if (cuisine) next.cuisine = cuisine;
    if (/vegetarian|vegan|meat.free|no meat/.test(q)) { next.protein = ''; next.diet = /vegan/.test(q) ? 'Vegan' : 'Vegetarian'; }
    if (/low(?:er)?[ -]?fat|less fat|leaner|minimi[sz]e.*fat/.test(q)) next.lowerFat = true;
    if (/high(?:er)?[ -]?protein|more protein|protein.rich/.test(q)) next.highProtein = true;
    if (/quick|fast|short on time|under 30 minutes/.test(q)) next.quick = true;
    if (/use.*(?:pantry|stock|fridge)|from my (?:pantry|stock|fridge)|what.*already have/.test(q)) next.fromPantry = true;
    if (/cheaper|budget|affordable|cheap/.test(q)) next.affordable = true;
    if (/any (?:style|dish)|different (?:style|dish)|something else|not curry/.test(q)) next.style = '';
    if (/start over|new idea|forget that/.test(q)) return { kind: intent(value), focus: focus(), query: '' };
    for (const match of q.matchAll(/\b(?:without|no|avoid)\s+([a-z]+(?:\s+rice)?)/g)) next.exclude.push(match[1]);
    if (/\b(?:no|without|avoid) fish\b/.test(q)) next.exclude.push('tuna','salmon','cod','haddock','prawn','shrimp','anchovy','sardine','mackerel');
    next.exclude = [...new Set(next.exclude)].slice(0, 16);
    const positiveFoods = foods.filter(word => new RegExp('\\b' + word + '(?:s|es)?\\b').test(q) && !new RegExp('\\b(?:without|no|avoid)\\s+' + word).test(q));
    if (positiveFoods.length) next.terms = positiveFoods.slice(0, 6);
    next.terms = next.terms.filter(word => !next.exclude.includes(word));
    if (!/a day|per day|daily/.test(q)) {
      const calories = q.match(/(?:under|at most|up to|less than)\s*(\d+)\s*(?:kcal|calories)/), protein = q.match(/(?:at least|min(?:imum)?)\s*(\d+(?:\.\d+)?)\s*g?\s*protein/), fat = q.match(/(?:under|at most|max(?:imum)?)\s*(\d+(?:\.\d+)?)\s*g?\s*fat/);
      if (calories) next.maxCalories = Number(calories[1]); if (protein) next.minProtein = Number(protein[1]); if (fat) next.maxFat = Number(fat[1]);
    }
    return { kind: intent(value), focus: next, query: [next.protein, next.style, next.cuisine].filter(Boolean).join(' ') };
  }
  function signature(recipe) { return JSON.stringify([recipe.id, recipe.name, recipe.ings, recipe.servings, recipe.method, recipe.equipment, recipe.cookTime, recipe.passiveMinutes]); }
  function retrieve(recipes, parsed, { ready = () => true, nutrition = recipe => recipe.nutrition, pantry = [], pantryScore = () => null, lastIds = [], favorites = [] } = {}) {
    const f = parsed.focus, previous = ['compare', 'cook', 'storage'].includes(parsed.kind) ? new Set(lastIds) : null, saved = new Set(favorites);
    return recipes.filter(recipe => ready(recipe, f.diet)).map(recipe => {
      const n = nutrition(recipe), hay = norm([recipe.name, recipe.cuisine, ...(recipe.tags || []), ...recipe.ings.map(row => row[0])].join(' '));
      if (!n?.complete || !['kcal', 'p', 'c', 'f'].every(key => Number.isFinite(n[key])) || f.category !== 'All' && recipe.cat !== f.category
        || f.protein && !hay.includes(f.protein) || f.style && !hay.includes(f.style) || f.cuisine && !hay.includes(f.cuisine)
        || f.terms.some(word => !hay.includes(word === 'berries' ? 'berr' : word))
        || f.exclude.some(word => new RegExp('\\b' + norm(word).replace(/[^a-z0-9 ]/g, '') + '(?:s)?\\b').test(hay))
        || f.quick && !(Number(recipe.cookTime ?? recipe.time) > 0 && Number(recipe.cookTime ?? recipe.time) <= 30)
        || f.maxCalories !== null && n.kcal > f.maxCalories || f.minProtein !== null && n.p < f.minProtein || f.maxFat !== null && n.f > f.maxFat) return null;
      const stock = pantry.length ? pantryScore(recipe) : null;
      const score = (previous?.has(recipe.id) ? 10000 : 0) + (saved.has(recipe.id) ? 10 : 0) + (f.highProtein ? n.p * 2 : n.p * .1)
        - (f.lowerFat ? n.f * 5 : 0) + (f.affordable && /afford|budget/.test(hay + ' ' + recipe.id) ? 100 : 0)
        + (f.fromPantry && stock ? (stock.ready ? 300 : 0) - stock.missing.length * 40 : 0);
      return { recipe, nutrition: n, stock, score, signature: signature(recipe) };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name)).slice(0, 6);
  }
  function localReply(parsed, candidates) {
    const kind = parsed.kind, f = parsed.focus;
    if (kind === 'storage') return { text: 'Use the storage guide below for cooking, cooling, freezing and reheating. The rules are based on Food Standards Agency guidance. Follow shorter recipe or packaging instructions.', source: 'local', kind, recipeIds: [], followUps: ['Find a meal I can batch prep', 'Help me prep chicken curry'] };
    if (kind === 'plan') return { text: 'I’ll interpret your meals and targets, find measured recipes and check supermarket packs against your household budget. The finished plan or any follow-up question will appear here.', source: 'local', kind, recipeIds: [], followUps: [] };
    if (kind === 'diary') return { text: 'Open Log food to review the food, amount and date before recording what you ate. Cooking and shopping remain separate from your intake.', source: 'local', kind, recipeIds: [], followUps: ['Find a high-protein snack', 'Compare two breakfasts'] };
    if (!candidates.length) return { text: 'I couldn’t find a measured recipe that meets all of these choices and your current food/equipment settings. Try a different dish or explicitly edit the constraints. I’ll keep your existing plan and targets. A missing recipe can be imported from Recipes.', source: 'local', kind, recipeIds: [], followUps: ['Try a different dish', 'Find something quick'] };
    let answer = kind === 'compare' ? 'Here are the matching recipes side by side, using their current ingredient estimates per portion. Compare protein, fat, calories and preparation time before choosing.'
      : kind === 'cook' ? 'Choose Open recipe for its measured ingredients and full method. Cooking mode walks you through the original steps and timers. For a larger batch, use Prep a batch and check the quantities and vessel capacity first.'
      : kind === 'prep' ? 'I found measured recipes for that prep idea. Choose Prep a batch to review the weighed main ingredient, portions, full ingredient list and fridge/freezer split.'
      : 'Here are measured recipe options from your library' + (f.highProtein ? ', prioritising protein' : '') + (f.lowerFat ? ' and lower fat' : '') + (f.quick ? ', with at most 30 minutes of active cooking' : '') + '.';
    if (f.fromPantry) answer += ' Pantry matches check each recipe separately; later meals can need the same stock.';
    if (f.affordable) answer += ' Recipes tagged for budget cooking get priority; verified pack costs still need Shopping or plan fitting.';
    return { text: answer, source: 'local', kind, recipeIds: candidates.slice(0, kind === 'compare' ? 3 : 3).map(row => row.recipe?.id || row.id), followUps: ['Make it lower fat', 'Give me more protein', 'Compare these recipes'] };
  }
  function normalizeSession(raw = {}) {
    const messages = [], allowed = new Set(['discover', 'prep', 'compare', 'cook', 'storage', 'plan', 'diary']);
    for (const message of Array.isArray(raw.messages) ? raw.messages.slice(-24) : []) {
      if (!['user', 'assistant'].includes(message?.role) || !text(message.text, 2000)) continue;
      messages.push({ role: message.role, text: text(message.text, message.role === 'user' ? 2000 : 1600), source: message.source === 'ai' ? 'ai' : 'local',
        kind: allowed.has(message.kind) ? message.kind : 'discover', recipeIds: Array.isArray(message.recipeIds) ? message.recipeIds.filter(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(id)).slice(0, 6) : [],
        signatures: message.signatures && typeof message.signatures === 'object' ? Object.fromEntries(Object.entries(message.signatures).filter(([id, value]) => /^[a-zA-Z0-9_-]{1,120}$/.test(id) && typeof value === 'string' && value.length <= 16000).slice(0, 6)) : {},
        followUps: Array.isArray(message.followUps) ? message.followUps.map(value => text(value, 100)).filter(Boolean).slice(0, 3) : [],planReceipt:root.KitchenPlanCore?.normalizeReceipt(message.planReceipt)||null });
    }
    return { messages, focus: focus(raw.focus), draft: text(raw.draft, 2000), useSettings: raw.useSettings !== false, usePantry: raw.usePantry === true, planDraft:root.KitchenPlanCore?.normalizeDraft(raw.planDraft)||null };
  }
  root.KitchenAgentCore = Object.freeze({ focus, interpret, retrieve, signature, localReply, normalizeSession });
})(globalThis);
