(function (root) {
  'use strict';
  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  function normalise(input = {}) {
    const budget = Number(input.budget), people = Number(input.people);
    if (input.budget === '' || input.budget == null || !Number.isFinite(budget) || budget < 0 || budget > 500 || Math.abs(budget * 100 - Math.round(budget * 100)) > .000001) throw new TypeError('Enter a total meal budget from £0 to £500, in pounds and pence.');
    if (!Number.isInteger(people) || people < 1 || people > 8) throw new TypeError('Choose between 1 and 8 people.');
    if (!categories.includes(input.category)) throw new TypeError('Choose a meal type.');
    if (!['Asda','Lidl','Aldi'].includes(input.store)) throw new TypeError('Choose Asda, Lidl or Aldi.');
    return { budget: Math.round(budget * 100) / 100, people, category: input.category, store: input.store, query: String(input.query || '').trim().slice(0, 120), usePantry: input.usePantry !== false };
  }
  function shopping(recipe, brief, pantry = []) {
    const map = root.MealBudgetCore.buildShopping({ week: [{ day: 'One-off', meals: [recipe.id] }], recipes: [recipe], people: brief.people, pantry: brief.usePantry ? pantry : [] });
    const items = [], unknown = [];
    for (const [key, item] of Object.entries(map)) {
      if (item.unknown) unknown.push(item.name);
      for (const [dimension, group] of Object.entries(item.groups)) if (group.remaining > .000001) items.push({ key: key + '::' + dimension, name: item.name, quantity: group.remaining, dimension });
    }
    return { map, items, unknown };
  }
  function validateOption(option, recipe, brief, pantry = []) {
    if (!option || option.recipeId !== recipe.id || option.people !== brief.people || !Number.isFinite(option.totalCostGBP) || option.totalCostGBP < 0 || Math.round(option.totalCostGBP * 100) > Math.round(brief.budget * 100)) return false;
    const expected = shopping(recipe, brief, pantry);
    if (expected.unknown.length) return false;
    try {
      const basket = root.MealSwapCore.basket({ store: brief.store, refreshedAt: option.refreshedAt, recommendations: option.recommendations }, expected.items, brief.store);
      return basket.complete && Math.abs(basket.total - option.totalCostGBP) < .005 && (basket.estimatedPrice !== true || option.estimatedPrice === true);
    } catch { return false; }
  }
  root.OneOffMealCore = { categories, normalise, shopping, validateOption };
})(globalThis);
