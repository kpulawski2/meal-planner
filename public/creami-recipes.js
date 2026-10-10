// Original measured recipes, CC0-1.0. Appliance technique references are linked
// separately: these formulations are not presented as Ninja-tested recipes.
(function () {
  'use strict';
  const standardGuide = 'https://support.ninjakitchen.co.uk/hc/en-gb/article_attachments/5111589338524/NC300UK_IB_Sheet.pdf';
  const deluxeGuide = 'https://support.ninjakitchen.co.uk/hc/en-gb/article_attachments/12401152639004';
  const proteinReference = 'https://www.sharkninja.co.uk/blog/protein-ice-cream.html';
  const yoghurtReference = 'https://www.sharkninja.co.uk/vanilla-frozen-yogurt/REC10600EU.html';
  const fruitReference = 'https://www.sharkninja.co.uk/no-prep-mango-sorbet/REC12062EU.html';
  const freeze = 'Pour into a tub compatible with your machine, staying below its MAX FILL line. Cover and freeze on a level shelf for at least 24 hours. Do not process an angled or uneven frozen base.';
  const spin = 'Assemble following your model manual. Use LITE ICE CREAM for this blended base. Use the correct processing zone on a Deluxe; these are scoop recipes, not Swirl dispensing recipes.';
  const portion = 'Divide the entire finished tub into 2 equal servings. The ingredients and shopping quantities make the whole tub; displayed nutrition is per serving.';
  function recipe(id, name, ings, preparation, options = {}) {
    const liquid = options.liquid || 'Skimmed milk';
    const mixIns = options.mixIns || [];
    const countedMixIns = mixIns.map(([ingredient, quantity, unit]) => `${quantity} ${unit} ${ingredient.toLowerCase()}`).join(' and ');
    const finishing = mixIns.length
      ? `After the first spin, make a hole in the processed base and add the reserved 30 ml ${liquid.toLowerCase()} and the measured ${countedMixIns}. Select MIX-IN; do not RE-SPIN before adding mix-ins.`
      : `Add the reserved 30 ml ${liquid.toLowerCase()} to the processed base and select RE-SPIN. All of this liquid is included in the ingredient and nutrition totals.`;
    return {
      id: `creami-${id}`, name, cat: 'Snack', icon: '🍨',
      ings: [...ings, ...mixIns],
      method: [`Reserve 30 ml of the listed ${liquid.toLowerCase()} for processing. ${preparation} Blend the remaining base ingredients until completely smooth; follow frozen fruit packet instructions, including cooking if required, then cool fully before blending. Do not put loose frozen chunks or plain ice into the CREAMi.`, freeze, spin, finishing, portion],
      servings: 2, fixedBatch: true, cookTime: options.cookTime || 10, freezeMinutes: 1440,
      batchLabel: '1 standard tub · 2 servings', tubSizeMl: 493,
      equipment: ['Ninja CREAMi'], proteinFamily: options.vegan ? 'plant' : 'dairy',
      tags: ['creami', 'dessert', 'batch', 'vegetarian', ...(options.vegan ? ['vegan'] : []), ...(options.protein ? ['high-protein'] : []), ...(options.tags || [])],
      kcal: null, p: null, c: null, f: null, cost: null, nutritionStatus: 'estimated',
      source: options.source || proteinReference, sourceName: 'Original Meal Planner recipe',
      sourceType: 'technique-reference', techniqueSource: standardGuide,
      techniqueSources: [standardGuide, deluxeGuide], license: 'CC0-1.0',
      testedInKitchen: false,
      reSpinLiquid: { name: liquid, quantity: 30, unit: 'ml', included: true },
      mixIns,
    };
  }
  globalThis.CREAMI_RECIPES = [
    recipe('plain-skyr', 'Plain Skyr CREAMi', [['Skyr yoghurt', 240, 'g'], ['Skimmed milk', 180, 'ml'], ['Sweetener', 1, 'g']], 'Stir the sweetener into the milk.', { source: yoghurtReference, protein: true }),
    recipe('chocolate-protein', 'Chocolate Protein CREAMi', [['Skimmed milk', 260, 'ml'], ['0% Greek yoghurt', 120, 'g'], ['Whey protein powder', 25, 'g'], ['Cocoa powder', 10, 'g'], ['Sweetener', 1, 'g']], 'Whisk the cocoa and protein powder into a little milk before adding the yoghurt.', { protein: true }),
    recipe('cottage-cocoa', 'Chocolate Cottage CREAMi', [['Cottage cheese', 180, 'g'], ['Skimmed milk', 220, 'ml'], ['Cocoa powder', 12, 'g'], ['Honey', 15, 'g']], 'Blend the cottage cheese until no curds remain.'),
    recipe('strawberry-yoghurt', 'Strawberry Yoghurt CREAMi', [['Strawberries', 170, 'g'], ['0% Greek yoghurt', 180, 'g'], ['Skimmed milk', 80, 'ml'], ['Honey', 10, 'g']], 'Remove the strawberry stalks and weigh the prepared fruit.', { source: yoghurtReference }),
    recipe('blueberry-skyr', 'Blueberry Skyr CREAMi', [['Blueberries', 160, 'g'], ['Skyr yoghurt', 190, 'g'], ['Skimmed milk', 80, 'ml'], ['Honey', 10, 'g']], 'Rinse and weigh the blueberries.', { source: yoghurtReference, protein: true }),
    recipe('banana-protein', 'Banana Protein CREAMi', [['Banana', 110, 'g'], ['Skimmed milk', 220, 'ml'], ['0% Greek yoghurt', 80, 'g'], ['Whey protein powder', 20, 'g']], 'Peel the banana and weigh the edible flesh.', { protein: true }),
    recipe('lemon-cheesecake', 'Lemon Cheesecake CREAMi', [['Quark', 180, 'g'], ['Light cream cheese', 40, 'g'], ['Skimmed milk', 190, 'ml'], ['Lemon juice', 15, 'ml'], ['Sweetener', 1, 'g']], 'Whisk the cream cheese and quark together until smooth.', { protein: true }),
    recipe('banana-peanut', 'Banana Peanut CREAMi', [['Banana', 100, 'g'], ['0% Greek yoghurt', 180, 'g'], ['Skimmed milk', 130, 'ml'], ['Peanut butter', 20, 'g']], 'Weigh the peeled banana and the peanut butter; blend both into the base.'),
    recipe('apple-cinnamon', 'Apple Cinnamon CREAMi', [['Apple', 160, 'g'], ['Skyr yoghurt', 160, 'g'], ['Skimmed milk', 100, 'ml'], ['Cinnamon', 1, 'g'], ['Honey', 10, 'g']], 'Core and weigh the apple. Chop, microwave with a spoonful of tap water until soft, then cool completely before blending.', { cookTime: 15, source: yoghurtReference }),
    recipe('pear-cottage', 'Pear Cottage CREAMi', [['Pear', 150, 'g'], ['Cottage cheese', 170, 'g'], ['Skimmed milk', 100, 'ml'], ['Cinnamon', 1, 'g'], ['Honey', 10, 'g']], 'Core the ripe pear and weigh the edible flesh. Blend the cottage cheese until smooth.'),
    recipe('mango-lassi', 'Mango Lassi CREAMi', [['Mango', 180, 'g'], ['0% Greek yoghurt', 180, 'g'], ['Skimmed milk', 60, 'ml'], ['Honey', 10, 'g']], 'Remove the mango skin and stone, then weigh the flesh.', { source: fruitReference }),
    recipe('pineapple-yoghurt', 'Pineapple Yoghurt CREAMi', [['Pineapple', 180, 'g'], ['0% Greek yoghurt', 170, 'g'], ['Skimmed milk', 70, 'ml'], ['Honey', 10, 'g']], 'Remove the pineapple skin and tough core, then weigh the flesh.', { source: yoghurtReference }),
    recipe('berry-chocolate-chip', 'Berry Chocolate Chip CREAMi', [['Frozen berries', 160, 'g'], ['Skyr yoghurt', 160, 'g'], ['Skimmed milk', 100, 'ml'], ['Honey', 10, 'g']], 'Thaw the berries; blend them and their juice into the base. Keep the chocolate aside until after the first spin.', { mixIns: [['Dark chocolate', 15, 'g']], source: yoghurtReference }),
    recipe('cocoa-peanut-protein', 'Chocolate Peanut Protein CREAMi', [['Skimmed milk', 250, 'ml'], ['0% Greek yoghurt', 120, 'g'], ['Whey protein powder', 20, 'g'], ['Peanut butter', 15, 'g'], ['Cocoa powder', 8, 'g']], 'Whisk the cocoa and protein powder into the milk, then blend with the peanut butter and yoghurt.', { protein: true }),
    recipe('banana-oat-cookie', 'Banana Oat Cookie CREAMi', [['Banana', 110, 'g'], ['Skyr yoghurt', 140, 'g'], ['Skimmed milk', 140, 'ml'], ['Cinnamon', 1, 'g']], 'Weigh the peeled banana. Keep the crumbled biscuits aside until after the first spin.', { mixIns: [['Oat biscuits', 20, 'g']], source: yoghurtReference }),
    recipe('strawberry-cheesecake', 'Strawberry Cheesecake CREAMi', [['Strawberries', 140, 'g'], ['Quark', 150, 'g'], ['Light cream cheese', 35, 'g'], ['Skimmed milk', 100, 'ml'], ['Honey', 10, 'g']], 'Remove the strawberry stalks and weigh the fruit. Blend with the cream cheese and quark.', { protein: true }),
    recipe('cocoa-date', 'Cocoa Date CREAMi', [['Cottage cheese', 170, 'g'], ['Skimmed milk', 220, 'ml'], ['Dates', 25, 'g'], ['Cocoa powder', 10, 'g']], 'Check the dates for stones. Soften them in a little of the measured milk, then blend thoroughly.'),
    recipe('banana-walnut', 'Banana Walnut CREAMi', [['Banana', 110, 'g'], ['0% Greek yoghurt', 170, 'g'], ['Skimmed milk', 130, 'ml'], ['Honey', 10, 'g']], 'Weigh the peeled banana. Chop the walnuts finely and keep them aside for the mix-in.', { mixIns: [['Walnuts', 15, 'g']] }),
    recipe('blueberry-lemon', 'Blueberry Lemon CREAMi', [['Blueberries', 170, 'g'], ['Quark', 170, 'g'], ['Skimmed milk', 80, 'ml'], ['Lemon juice', 10, 'ml'], ['Honey', 10, 'g']], 'Rinse and weigh the blueberries, then blend with the quark and lemon juice.', { source: yoghurtReference, protein: true }),
    recipe('berry-banana', 'Berry Banana CREAMi', [['Frozen berries', 130, 'g'], ['Banana', 80, 'g'], ['0% Greek yoghurt', 130, 'g'], ['Skimmed milk', 90, 'ml']], 'Thaw the berries, retaining their juice. Peel and weigh the banana.', { source: yoghurtReference }),
    recipe('tropical-coconut', 'Tropical Coconut CREAMi', [['Mango', 140, 'g'], ['Pineapple', 100, 'g'], ['Banana', 50, 'g'], ['Light coconut milk', 140, 'ml']], 'Weigh prepared fruit without skins, cores or stones. Blend into the coconut milk.', { liquid: 'Light coconut milk', vegan: true, source: fruitReference }),
    recipe('banana-coconut-cocoa', 'Banana Coconut Chocolate CREAMi', [['Banana', 200, 'g'], ['Light coconut milk', 200, 'ml'], ['Cocoa powder', 12, 'g']], 'Weigh the peeled banana and whisk the cocoa into the coconut milk.', { liquid: 'Light coconut milk', vegan: true, source: fruitReference }),
    recipe('mango-banana-coconut', 'Mango Banana Coconut CREAMi', [['Mango', 180, 'g'], ['Banana', 90, 'g'], ['Light coconut milk', 160, 'ml']], 'Peel the fruit, remove the mango stone and weigh the edible flesh.', { liquid: 'Light coconut milk', vegan: true, source: fruitReference }),
    recipe('berry-coconut-peanut', 'Berry Coconut Peanut CREAMi', [['Frozen berries', 160, 'g'], ['Banana', 90, 'g'], ['Light coconut milk', 150, 'ml'], ['Peanut butter', 20, 'g']], 'Thaw the berries and retain their juice. Weigh the peeled banana and peanut butter.', { liquid: 'Light coconut milk', vegan: true, source: fruitReference }),
  ];
})();
