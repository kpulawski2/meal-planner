const allowedGoals = ['Lose weight', 'Gain muscle', 'Eat healthy', 'Save money', 'Make cooking easier'];
export function activeGoals(profile = {}) {
  const input = Array.isArray(profile.goal) ? profile.goal : Array.isArray(profile.goals) ? profile.goals : ['Eat healthy', 'Save money', 'Make cooking easier'];
  return [...new Set(input.filter(value => allowedGoals.includes(value)))];
}

export function recipeQuality(recipe, profile = {}) {
  const goals = activeGoals(profile), ingredients = recipe.ings || [], yieldCount = Math.max(1, Number(recipe.servings) || 1);
  let plants = 0, wholegrain = 0, pulses = 0;
  for (const [name, rawQuantity, unit] of ingredients) {
    const words = String(name).toLowerCase(), quantity = Number(rawQuantity) / yieldCount;
    // This is an ingredient-based preference, not a clinical health score or
    // an invented fibre value. Wholegrain/pulse choices get an explicit bonus.
    const grams = /kg/i.test(unit) ? quantity * 1000 : /g|ml/i.test(unit) ? quantity : quantity * 80;
    if (/tomato|carrot|spinach|broccoli|pepper|courgette|cabbage|cauliflower|peas|vegetable|onion|mushroom|fruit|apple|banana|berr/.test(words)) plants += Math.min(200, grams);
    if (/lentil|chickpea|\bbeans\b/.test(words)) { pulses += Math.min(150, grams); plants += Math.min(150, grams); }
    if (/wholegrain|wholewheat|wholemeal|brown rice|oats/.test(words)) wholegrain += Math.min(150, grams);
  }
  const kcal = Number(recipe.n?.kcal ?? recipe.nutrition?.kcal) || 1, protein = Number(recipe.n?.p ?? recipe.nutrition?.p) || 0;
  const knownCookTime = Number.isFinite(Number(recipe.cookTime)) && recipe.cookTime !== null && Number(recipe.cookTime) >= 0;
  const cookMinutes = knownCookTime ? Number(recipe.cookTime) : Number(profile.cookTime) || 45;
  let penalty = 0;
  if (goals.includes('Eat healthy')) penalty -= Math.min(80, plants / 8 + wholegrain / 6 + pulses / 10);
  if (goals.includes('Gain muscle') || profile.priority === 'Protein value') penalty -= Math.min(80, protein / kcal * 800);
  if (goals.includes('Lose weight')) penalty -= Math.min(55, protein / kcal * 500);
  if (goals.includes('Make cooking easier')) penalty += cookMinutes * .65 + (knownCookTime ? 0 : 15);
  return { penalty, plantGrams: plants, wholegrainGrams: wholegrain, pulseGrams: pulses, cookMinutes, knownCookTime, proteinDensity: protein / kcal };
}

export function dailyQuality(rows, factors, profile = {}) {
  const goals = activeGoals(profile), kcal = rows.reduce((sum, row, i) => sum + row.n.kcal * factors[i], 0);
  const target = (Number(profile.calories) || 2000) * (goals.includes('Lose weight') ? .95 : 1);
  let penalty = rows.reduce((sum, row, i) => sum + (row.quality || recipeQuality(row, profile)).penalty * factors[i], 0);
  // The configured calorie interval remains a hard bound. A goal only ranks
  // valid portions within it; it never changes the user's calorie/protein target.
  penalty += Math.abs(kcal - target) * (goals.includes('Lose weight') ? .6 : .05);
  return penalty;
}

export function goalReport(profile, days = []) {
  const active = activeGoals(profile), allRows = days.flatMap(day => day.rows || []), unique = [...new Map(allRows.map(row => [row.id, row])).values()];
  const known = unique.filter(row => Number.isFinite(Number(row.cookTime)) && row.cookTime !== null);
  const explanation = [];
  if (active.includes('Save money') || profile.priority === 'Cheapest' || profile.varietyMode === 'Budget focus') explanation.push('Full-pack basket cost is prioritised, with shared ingredients and pantry deductions; required variety and daily nutrition remain hard limits.');
  if (active.includes('Eat healthy')) explanation.push('Recipes containing vegetables, pulses and wholegrains are preferred using their listed ingredients.');
  if (active.includes('Gain muscle')) explanation.push('Protein-dense recipes are preferred while retaining the configured daily protein and calorie targets.');
  if (active.includes('Lose weight')) explanation.push('Valid portions closer to 95% of the configured calorie target are preferred; the calorie range and protein minimum are unchanged.');
  if (active.includes('Make cooking easier')) explanation.push('Shorter known cooking times and reusable recipe batches are preferred within the variety limits. Unknown cooking times are not assumed to be quick.');
  return { active, explanation, recipeBatches: unique.length, knownCookTimeRecipes: known.length,
    estimatedBatchCookingMinutes: Math.round(known.reduce((sum, row) => sum + Number(row.cookTime), 0)),
    cookingTimeComplete: unique.length > 0 && known.length === unique.length };
}
