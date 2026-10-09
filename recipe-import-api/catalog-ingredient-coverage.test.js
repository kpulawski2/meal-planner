import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendCatalogItems, searchCatalog } from './catalog-service.js';

function item(name, quantity, dimension = 'mass') {
  return { key: `${name}:${dimension}:${quantity}`, name, quantity, dimension };
}

function assertPurchase(row, { allow, reject, rejectCategory, requireCategory }) {
  assert.equal(row.confidence, 'high', `No confident ingredient match for ${row.query}`);
  assert.ok(row.plan?.products?.length, `No automatic pack price for ${row.query}`);
  assert.ok(row.plan.totalCostGBP > 0 && Number.isFinite(row.plan.totalCostGBP));
  assert.ok(row.plan.totalQuantity >= row.plan.requestedQuantity, `Insufficient packs for ${row.query}`);
  for (const product of row.plan.products) {
    assert.match(product.url, /^https:\/\/www\.asda\.com\/groceries\/product\//);
    assert.ok(Number.isInteger(product.packs) && product.packs > 0);
    assert.ok(Number.isFinite(product.priceGBP) && product.priceGBP > 0);
    assert.equal(product.costGBP, Number((product.priceGBP * product.packs).toFixed(2)));
    if (allow) assert.match(product.productName, allow, `Wrong product family for ${row.query}`);
    if (reject) assert.doesNotMatch(product.productName, reject, `Unsuitable product selected for ${row.query}`);
    if (rejectCategory) assert.doesNotMatch(product.category || '', rejectCategory,
      `Unsuitable product category selected for ${row.query}`);
    if (requireCategory) assert.match(product.category || '', requireCategory,
      `Expected a compatible ingredient category for ${row.query}`);
  }
}

test('the real ASDA catalogue automatically prices plain milk, Skyr and light cream cheese', { timeout: 60_000 }, async t => {
  const items = [item('Milk', 100, 'volume'), item('Milk', 1500, 'volume'),
    item('Skyr yoghurt', 60), item('Light cream cheese', 35), item('Chicken breast', 1500)];
  const result = await recommendCatalogItems('Asda', items);
  assert.ok(result.indexSize >= 10_000, 'Exercise the complete real catalogue rather than a seed');
  assert.equal(result.recommendations.length, items.length);
  for (const row of result.recommendations) {
    await t.test(row.key, () => {
    if (row.query === 'Milk') assertPurchase(row, { allow: /milk/i,
      reject: /banana|strawberry|chocolate|flavou?r|milkshake|condensed|evaporated|oat|almond|soy|coconut/i });
    if (row.query === 'Skyr yoghurt') assertPurchase(row, { allow: /skyr/i,
      reject: /banana|strawberry|raspberry|superberry|vanilla|coconut|chocolate|flavou?r/i });
    if (row.query === 'Light cream cheese') assertPurchase(row, { allow: /light|lighter|reduced fat/i,
      reject: /garlic|herb|chive|jalapeno|icing|cheesecake|alternative/i });
    if (row.query === 'Chicken breast') assertPurchase(row, { allow: /chicken.*breast/i,
      reject: /breaded|cooked|skewer|seasoned|marinated|sizzle|tikka|thai|sandwich|wrap/i,
      rejectCategory: /tinned|canned|cooked|ready meals/i });
    });
  }
});

test('ingredient prices exclude ready meals, desserts and substitutes from every chosen pack', { timeout: 60_000 }, async t => {
  const expectations = {
    'Frozen peas': { allow: /pea/i, reject: /dinner|chicken|mushy|soup|sugar.?snap|mangetout/i },
    'Frozen berries': { allow: /berr|fruit/i, reject: /chocolate|milk|yog[hu]*rt|smoothie|dessert|jam/i },
    'Cocoa powder': { allow: /cocoa/i, requireCategory: /home baking.*cocoa|cocoa$/i,
      reject: /hot chocolate|drink|icing|protein|croissant|cake|biscuit|filling/i },
    'Dark chocolate': { allow: /dark.*chocolate|chocolate.*dark/i, reject: /digestive|biscuit|cookie|cake|wafer|yog[hu]*rt/i },
    'Feta cheese': { allow: /feta/i, reject: /alternative|plant.based|vegan|salad|pastry|spinach/i },
    'Halloumi': { allow: /halloumi/i, reject: /medley|vegetable|salad|skewer|burger|fries/i },
    'Parmesan': { allow: /parmesan|parmigiano|grana padano/i, reject: /potato|salad|dip|pesto|twist|chicken|sauce/i },
    'Pasta': { reject: /bake|ready|sauce|meal|lasagne|ravioli|tortelloni|tortellini/i },
    'Red lentils': { allow: /red.*lentil/i, reject: /soup|curry|crisps|pasta/i },
    'Prawns': { allow: /prawn/i, reject: /skewer|chilli|battered|breaded|sauce|tempura|salad|cocktail|sandwich/i },
    'Dried mixed herbs': { allow: /mixed.*herb/i, reject: /spice|chicken|recipe mix/i },
    'Olive oil': { allow: /olive.*oil/i, reject: /blend|spray|infused|spread|tuna|anchovy|mackerel|crouton|alternative/i },
    'Lean pork': { allow: /pork/i, reject: /pie|sausage|burger|sandwich|batter|breaded|cooked|sauce|marinated|crunch|scratchings/i },
    'Cod fillet': { allow: /cod.*fillet/i, reject: /bread|batter|cooked|cake|sauce|lemon|herb|garlic/i },
    'Smoked salmon': { allow: /smoked.*salmon|salmon.*smoked/i, reject: /dip|spread|pate|cream|salad|sandwich|wrap|pizza/i },
    'Cooking oil': { allow: /oil/i, reject: /spray|1 cal|infused|flavou?r/i },
    'Cinnamon': { allow: /cinnamon/i, reject: /stick|sweets|drink|biscuit|cake/i },
    'Walnuts': { allow: /walnut/i, reject: /almond|cashew|hazelnut|chocolate|cookie|cake|mix|selection/i },
    'Grapes': { allow: /grape/i, reject: /apple|juice|raisins|dried|mixed/i },
    'Black beans': { allow: /black.*bean/i, reject: /black.?eye|black.?eyed/i },
    'Rice': { allow: /rice/i, reject: /micro|cooked|pudding|cake|snack|crisps|cracker|sauce|seasoned/i },
    'Noodles': { allow: /noodle/i, reject: /straight to wok|7Moon|flavou?r|seasoned|instant|sauce|pot noodle/i,
      rejectCategory: /fresh fruit|stir fry vegetables/i },
    'Couscous': { allow: /couscous/i, reject: /pearl|israeli|salad|soup|flavou?r|seasoned/i },
  };
  const result = await recommendCatalogItems('Asda', Object.keys(expectations)
    .flatMap(name => (name === 'Noodles' ? [100, 260, 500] : [100, name === 'Lean pork' ? 550 : 500])
      .map(quantity => item(name, quantity, name === 'Olive oil' ? 'volume' : 'mass'))));
  for (const row of result.recommendations) await t.test(row.key, () => assertPurchase(row, expectations[row.query]));
});

test('a fresh fruit ingredient never becomes a candle or toiletry', { timeout: 60_000 }, async () => {
  const result = await recommendCatalogItems('Asda', [item('Mandarin', 3, 'count')]);
  const row = result.recommendations[0];
  // A genuine fresh-fruit alias or an explicit unavailable result is safe; a
  // scented household item with a shared name must never be a priced match.
  if (row.match) {
    assert.match(row.match.category || '', /fresh.*fruit|fruit.*vegetables/i,
      'A fruit requested by count must be fresh fruit rather than a tinned or flavoured product');
    assert.doesNotMatch(row.match.category || '', /home|entertainment|toiletr|beauty|bath|household|baby/i);
    assert.doesNotMatch(row.match.productName, /candle|taper|soap|wash|lotion|jelly|squash/i);
  }
  if (row.plan) for (const product of row.plan.products) {
    assert.match(product.category || '', /fresh.*fruit|fruit.*vegetables/i);
    assert.doesNotMatch(product.category || '', /home|entertainment|toiletr|beauty|bath|household|baby/i);
    assert.doesNotMatch(product.productName, /candle|taper|soap|wash|lotion|jelly|squash/i);
  }
});

test('an unavailable dried herb does not get a confident price for another ingredient', { timeout: 60_000 }, async () => {
  const result = await recommendCatalogItems('Asda', [item('Dried dill', 1)]);
  const row = result.recommendations[0];
  if (row.match) {
    assert.match(row.match.productName, /\bdill\b/i);
    assert.match(`${row.match.productName} ${row.match.category}`, /dried|dry herbs|herbs & spices|spices/i);
  }
  if (row.plan) for (const product of row.plan.products) assert.match(product.productName, /\bdill\b/i);
});

test('automatic value comparison includes cheaper ordinary packs as well as premium brands', { timeout: 60_000 }, async () => {
  const quantity = 500;
  const [recommendation, search] = await Promise.all([
    recommendCatalogItems('Asda', [item('Blueberries', quantity)]),
    searchCatalog('Asda', 'Blueberries', 12, 'mass'),
  ]);
  const row = recommendation.recommendations[0];
  assertPurchase(row, { allow: /blueberr/i, reject: /chocolate|yog[hu]*rt|smoothie|juice|jam/i });
  const offers = search.results.filter(product => /fresh.*fruit/i.test(product.category || '')
    && /blueberries/i.test(product.productName) && product.packUnit === 'g'
    && Number(product.packQuantity) > 0 && Number(product.priceGBP) > 0);
  assert.ok(offers.length >= 2, 'Compare the available ordinary and premium blueberry packs');
  const cheapestSingleProduct = Math.min(...offers.map(product =>
    Math.ceil(quantity / Number(product.packQuantity)) * Number(product.priceGBP)));
  assert.ok(row.plan.totalCostGBP <= cheapestSingleProduct + 0.001,
    `The automatic basket costs £${row.plan.totalCostGBP}, but a suitable single-product purchase costs £${cheapestSingleProduct}`);
});

test('recipe units get automatic pack prices with labelled conversion assumptions', { timeout: 60_000 }, async t => {
  const items = [item('Cucumber', 100), item('Olive oil', 5), item('Garlic', 5),
    item('Wholemeal bread', 2, 'slice'), item('Cinnamon', 0.5, 'tsp'),
    item('Fajita seasoning', 1, 'portion'), item('Wholemeal wrap', 2, 'count'),
    item('Turkey sausages', 2, 'count'), item('Romaine lettuce', 80)];
  const result = await recommendCatalogItems('Asda', items);
  for (const row of result.recommendations) await t.test(row.key, () => {
    assertPurchase(row, {});
    if (row.query === 'Cucumber') {
      for (const product of row.plan.products) assert.match(product.productName, /^(?:ASDA\s+)?Cucumber$/i);
      assert.equal(row.plan.estimatedQuantity, true, 'Variable-weight cucumbers must be labelled as an estimate');
    }
    if (row.query === 'Olive oil') for (const product of row.plan.products) {
      assert.doesNotMatch(product.productName, /blend|spray|infused|spread|tuna|anchovy|mackerel|alternative/i);
    }
    if (row.query === 'Wholemeal bread' || row.query === 'Cinnamon' || row.query === 'Fajita seasoning') {
      assert.equal(row.plan.estimatedQuantity, true, 'A cooking-unit conversion must be explicit');
    }
    if (row.query === 'Cinnamon') for (const product of row.plan.products) assert.doesNotMatch(product.productName, /stick/i);
    if (row.plan.estimatedQuantity) {
      assert.ok(row.plan.estimateNotes?.length, 'Show the basis of an estimated cooking quantity');
      assert.ok(row.plan.estimateNotes.every(note => typeof note === 'string' && note.length > 10));
      for (const product of row.plan.products.filter(product => product.estimatedQuantity)) {
        assert.ok(typeof product.quantityBasis === 'string' && product.quantityBasis.length > 10);
      }
    }
    if (row.query === 'Wholemeal wrap' || row.query === 'Turkey sausages') {
      assert.equal(row.plan.estimatedQuantity, false, 'A declared count must not be treated as a guessed weight');
    }
  });
});

test('small remaining quantities still select the ingredient rather than a cheaper prepared food', { timeout: 60_000 }, async t => {
  const result = await recommendCatalogItems('Asda', [item('Eggs', 0.5, 'count'),
    item('Peanut butter', 5), item('Lean ham', 5)]);
  const expectations = {
    'Eggs': { allow: /egg/i, requireCategory: /eggs/i, reject: /custard|tart|chocolate|scotch|sandwich|salad/i },
    'Peanut butter': { allow: /peanut.*butter/i, requireCategory: /spreads|nut butters|peanut butter/i,
      reject: /snickers|chocolate|snack|protein|bar|biscuit|cookie/i },
    'Lean ham': { allow: /ham/i, reject: /soup|pie|sandwich|pizza|salad|snack/i },
  };
  for (const row of result.recommendations) await t.test(row.query, () => assertPurchase(row, expectations[row.query]));
});

test('common pantry staples use their own food category at small and large quantities', { timeout: 60_000 }, async t => {
  const expectations = {
    'Butter': { allow: /butter/i, requireCategory: /butter.*spreads|spreads.*butter/i,
      reject: /bean|peanut|sandwich|chicken|cake|biscuit|cookie|alternative/i },
    'Sugar': { allow: /sugar/i, requireCategory: /sugar|home baking/i,
      reject: /no added|low sugar|reduced sugar|bean|salt|sauce|cake|biscuit|chocolate|sweetener/i },
    'Salt': { allow: /salt/i, requireCategory: /salt|spices|seasoning/i,
      reject: /no added|low salt|reduced salt|bean|sugar|sauce|crisps|cracker|chocolate/i },
  };
  const items = Object.keys(expectations).flatMap(name => [item(name, 5), item(name, 100)]);
  const result = await recommendCatalogItems('Asda', items);
  for (const row of result.recommendations) await t.test(row.key, () => assertPurchase(row, expectations[row.query]));
});
