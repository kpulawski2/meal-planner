/* Shared appliance vocabulary for settings, recipe editing and planning. */
(function (root) {
  'use strict';
  const groups = [
    ['Everyday cooking', ['Hob', 'Oven', 'Microwave', 'Toaster', 'Grill']],
    ['Cookers', ['Air fryer', 'Slow cooker', 'Pressure cooker', 'Rice cooker', 'Steamer']],
    ['Blending & baking', ['Blender', 'Hand blender', 'Food processor', 'Hand mixer', 'Stand mixer']],
    ['Specialist appliances', ['Ninja CREAMi', 'Sandwich press', 'Waffle maker', 'Bread maker', 'Dehydrator', 'Sous vide cooker']]
  ];
  const names = groups.flatMap(([, names]) => names);
  const aliases = { airfryer: 'Air fryer', slowcooker: 'Slow cooker', 'instant pot': 'Pressure cooker', stove: 'Hob', stovetop: 'Hob', creami: 'Ninja CREAMi' };
  function canonical(value) { const name = String(value || '').trim().toLowerCase(); return names.find(item => item.toLowerCase() === name) || aliases[name] || null; }
  function normalize(value) { return [...new Set((Array.isArray(value) ? value : []).map(canonical).filter(Boolean))]; }
  function missing(recipe, profile = {}) {
    const available = new Set(normalize(profile.equipment));
    return [...new Set((Array.isArray(recipe?.equipment) ? recipe.equipment : []).filter(value => typeof value === 'string' && value.trim()).map(value => canonical(value) || value.trim()))].filter(value => !available.has(value));
  }
  root.KitchenEquipment = Object.freeze({ groups, names, canonical, normalize, missing, allowed: (recipe, profile) => missing(recipe, profile).length === 0 });
})(typeof globalThis !== 'undefined' ? globalThis : this);
