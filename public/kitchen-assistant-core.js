/* Measured batch proposals. Interpretation never writes to a meal plan or stock. */
(function (root) {
  'use strict';
  const ingredients = Object.freeze([
    ['Chicken breast', 'raw'], ['Chicken thigh', 'raw'], ['Turkey mince', 'raw'],
    ['Lean beef mince', 'raw'], ['Tofu', 'raw'], ['Salmon', 'raw'],
    ['Tuna', 'drained'], ['Chickpeas', 'drained'], ['Red lentils', 'dry'],
  ]);
  const clean = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const round = value => Number(value.toFixed(6));
  function ingredient(value) {
    const name = clean(value);
    if (/\bchicken\b/.test(name)) return /\bthighs?\b/.test(name) ? 'Chicken thigh' : 'Chicken breast';
    if (/\bturkey\b.*\bmince/.test(name)) return 'Turkey mince';
    if (/\bbeef\b.*\bmince|\bminced beef\b/.test(name)) return 'Lean beef mince';
    return ingredients.find(([label]) => name.includes(clean(label)))?.[0] || null;
  }
  function normalise(value = {}, defaults = {}) {
    const data = { ingredient: 'Chicken breast', grams: null, basis: 'raw', days: 4, people: 1, query: '', ...defaults, ...value };
    if (!ingredients.some(([name]) => name === data.ingredient)) throw new TypeError('Choose an ingredient from the list.');
    if (!['raw', 'cooked', 'dry', 'drained'].includes(data.basis)) throw new TypeError('Confirm whether your weighed ingredient is raw, cooked, dry or drained.');
    const grams = data.grams === null || data.grams === '' || data.grams === undefined ? null : Number(data.grams);
    if (grams !== null && (!Number.isFinite(grams) || grams < 10 || grams > 10000)) throw new TypeError('Enter an ingredient weight from 10 g to 10 kg.');
    const days = Number(data.days), people = Number(data.people);
    if (!Number.isInteger(days) || days < 1 || days > 14) throw new TypeError('Choose 1–14 days. Split a longer period into separate prep sessions.');
    if (!Number.isInteger(people) || people < 1 || people > 8) throw new TypeError('Choose 1–8 people.');
    if (typeof data.query !== 'string' || data.query.length > 120) throw new TypeError('Keep the dish or flavour request within 120 characters.');
    return { ingredient: data.ingredient, grams, basis: data.basis, days, people, query: data.query.trim() };
  }
  function parse(text, defaults = {}) {
    if (typeof text !== 'string' || !text.trim() || text.length > 2000) throw new TypeError('Ask your kitchen question in 1–2000 characters.');
    const brief = normalise({}, defaults), name = ingredient(text);
    if (!name && /\b(pork|lamb|steak|eggs?|turkey|beef)\b/i.test(text)) throw new TypeError('Choose a supported main ingredient below, or import a measured recipe for that ingredient.');
    if (name) { brief.ingredient = name; brief.basis = ingredients.find(([label]) => label === name)[1]; }
    const weights = [...text.matchAll(/\b(\d+(?:\.\d+)?)\s*(kilograms?|kilos?|kgs?|grams?|g)\b/gi)];
    const labels = 'chicken(?:\\s+(?:breasts?|thighs?))?|turkey\\s+mince|(?:lean\\s+)?beef\\s+mince|tofu|salmon|tuna|chickpeas|red\\s+lentils';
    const basisText = text.replace(/\b\d+(?:\.\d+)?\s*(kilograms?|kilos?|kgs?|grams?|g)\b/gi, ' ');
    const hint = [...basisText.matchAll(new RegExp('\\b(raw|cooked|leftovers?|dry|drained)\\s+(?:boneless\\s+)?(' + labels + ')\\b', 'gi'))]
      .find(row => ingredient(row[2]) === brief.ingredient);
    if (hint) brief.basis = /^leftover/i.test(hint[1]) ? 'cooked' : hint[1].toLowerCase();
    // Prefer the weight adjacent to the named ingredient, not a side ingredient.
    const adjacent = new RegExp('^(?:\\s|of\\b|raw\\b|cooked\\b|drained\\b|dry\\b|fresh\\b|boneless\\b)*(' + labels + ')\\b', 'i');
    const main = weights.find(row => ingredient(text.slice(row.index + row[0].length).match(adjacent)?.[1] || '') === brief.ingredient)
      || weights.find(row => ingredient(text.slice(Math.max(0, row.index - 25), row.index).split(/[,;+]/).at(-1)) === brief.ingredient);
    if (main) brief.grams = Number(main[1]) * (/^k/i.test(main[2]) ? 1000 : 1);
    else if (weights.length) brief.grams = null;
    const count = text.match(/\b(\d+)\s*(days?|weeks?)\b/i);
    if (count) brief.days = Number(count[1]) * (/week/i.test(count[2]) ? 7 : 1);
    else if (/\b(two weeks|fortnight)\b/i.test(text)) brief.days = 14;
    else if (/\b(week|weekly)\b/i.test(text)) brief.days = 7;
    else if (/\b(few days|three days)\b/i.test(text)) brief.days = 3;
    const people = text.match(/\b(?:for|feed|feeding)\s+(\d+)\s+(?:people|persons?|adults?)\b/i);
    if (people) brief.people = Number(people[1]);
    const style = text.match(/\b(curry|chill?i|stir[ -]?fry|tray[ -]?bake|soup|stew|pasta|wraps?|salad|fajitas?|casserole|teriyaki|tikka|bolognese)\b/i);
    if (style) brief.query = style[0].toLowerCase().replace(/stir[ -]?fry/, 'stir fry').replace(/tray[ -]?bake/, 'traybake');
    return normalise(brief);
  }
  function rowBasis(name, chosen) {
    const text = clean(name);
    if (/\b(cooked|ready cooked|rotisserie)\b/.test(text)) return 'cooked';
    if (/\b(dried|dry|uncooked)\b/.test(text)) return 'dry';
    if (/\b(drained|canned|tinned)\b/.test(text)) return 'drained';
    return ingredients.find(([label]) => label === chosen)?.[1];
  }
  function anchorMass(recipe, brief) {
    let total = 0;
    for (const [name, qty, unit] of recipe.ings || []) {
      if (ingredient(name) !== brief.ingredient) continue;
      // Generic breast proposals cannot borrow whole/bone-in chicken or a sauce.
      if (/\b(whole|bone|bones|stock|broth|sauce|powder)\b/i.test(name) || rowBasis(name, brief.ingredient) !== brief.basis) return 0;
      if (brief.ingredient === 'Chicken breast' && !/\bbreasts?\b/i.test(name)) return 0;
      if (brief.ingredient === 'Lean beef mince' && (!/\blean\b|\b5\s*%/i.test(name) || /\b(?:10|15|20)\s*%/.test(name))) return 0;
      const factor = /^(g|grams?)$/i.test(unit) ? 1 : /^(kg|kilograms?)$/i.test(unit) ? 1000 : 0;
      if (!factor || !Number.isFinite(Number(qty)) || Number(qty) <= 0) return 0;
      total += Number(qty) * factor;
    }
    return total;
  }
  function matches(recipe, brief) {
    if (!anchorMass(recipe, brief)) return false;
    const words = clean(brief.query).replace(/\bchili\b/g, 'chilli').split(' ').filter(Boolean);
    const hay = clean([recipe.name, ...(recipe.tags || []), ...(recipe.ings || []).map(row => row[0])].join(' ')).replace(/\bchili\b/g, 'chilli');
    return words.every(word => hay.includes(word.replace(/^(wrap|fajita)s$/, '$1')));
  }
  function candidates(recipes, brief, ready = () => true) {
    brief = normalise(brief);
    return recipes.filter(recipe => !recipe.fixedBatch && !recipe.unavailable && !recipe.needsReview && recipe.servings !== null && Number(recipe.servings ?? 1) > 0
      && matches(recipe, brief) && ready(recipe));
  }
  const sources = Object.freeze([
    ['Cooling, freezing & defrosting', 'https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely'],
    ['Cooking & reheating', 'https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food'],
    ['Rice storage', 'https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker'],
  ]);
  function storage(recipe, brief) {
    const rice = (recipe.ings || []).some(([name]) => /\brice\b/i.test(name) && !/rice (?:cakes?|flour|milk|drink|vinegar)/i.test(name));
    const fridgeDays = rice ? 1 : 2, chilled = Math.min(brief.days, fridgeDays) * brief.people;
    return { rice, fridgeHours: rice ? 24 : 48, chilled, frozen: Math.max(0, brief.days * brief.people - chilled),
      steps: [
        'Use ingredients within their use-by dates and follow packaging instructions. Keep raw meat separate; wash hands, boards and utensils after handling it.',
        ...(brief.basis === 'raw' && /chicken|turkey|beef/i.test(brief.ingredient) ? ['Cook poultry and mince thoroughly. Check the centre with a clean thermometer: 75°C for 30 seconds (or 70°C for 2 minutes).'] : []),
        rice ? 'Portion rice dishes immediately, cool quickly and refrigerate or freeze within one hour. Keep refrigerated rice for no more than 24 hours.'
          : 'Divide into shallow containers, cool promptly and refrigerate within 1–2 hours. Eat refrigerated leftovers within 48 hours.',
        'Keep the fridge at 0–5°C. Freeze later portions as soon as cooled, label them and follow the recipe or pack’s freezing instructions.',
        'Thaw frozen portions in the fridge. Use within 24 hours of fully thawing. Reheat only once until steaming hot throughout; stir and check the centre.',
      ], sources };
  }
  function proposal(recipe, brief, steps = recipe?.method) {
    brief = normalise(brief);
    const mass = anchorMass(recipe, brief), method = Array.isArray(steps) ? steps.filter(step => typeof step === 'string' && step.trim()) : [];
    if (!brief.grams || !mass || recipe.fixedBatch || recipe.servings === null || !method.length || recipe.unavailable || recipe.needsReview) {
      throw new TypeError('Confirm the weight and choose a measured, scalable recipe with matching raw/cooked ingredients and steps.');
    }
    if (!Array.isArray(recipe.ings) || !recipe.ings.length || recipe.ings.some(row => !Array.isArray(row) || row.length < 3 || !Number.isFinite(Number(row[1])) || Number(row[1]) <= 0 || !String(row[2]).trim())) {
      throw new TypeError('This recipe needs all ingredient amounts confirmed before scaling.');
    }
    const factor = brief.grams / mass, portions = brief.days * brief.people;
    const warning = 'Amounts scaled from ' + recipe.name + '. Divide the entire batch into ' + portions + ' equal portions. Original method timings and container sizes need checking for this batch; cook in smaller batches if necessary.';
    return { sourceId: recipe.id, factor, portions, brief, storage: storage(recipe, brief),
      recipe: { ...JSON.parse(JSON.stringify(recipe)), name: recipe.name + ' · prep batch', servings: portions,
        ings: recipe.ings.map(([name, qty, unit]) => [name, round(Number(qty) * factor), unit]),
        method: [warning, ...method, ...storage(recipe, brief).steps],
        custom: true, fixedBatch: false, needsReview: false, correctionDraft: false,
        cost: null, kcal: null, p: null, c: null, f: null, nutrition: undefined, nutritionStatus: 'estimated',
        changeNotice: warning, modifications: [recipe.modifications, warning].filter(Boolean).join(' ') } };
  }
  root.KitchenAssistantCore = Object.freeze({ ingredients, ingredient, normalise, parse, anchorMass, candidates, proposal, storage });
})(globalThis);
