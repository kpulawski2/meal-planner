/* Original measured social-food ideas and three credited public-video
   adaptations. All quantities, timings and methods below are Meal Planner
   formulations; nutrition is calculated, never copied from a video claim. */
(function (root) {
  'use strict';
  const chickenCheck = 'Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.';
  const prepStorage = 'Divide into four portions. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot.';
  const grain = 'Cook the weighed dry rice or grain following the packet directions; its cooked weight is not the ingredient weight.';
  const drain = 'Use drained weights for canned beans, tuna and sweetcorn.';
  const blend = ['Use a blender rated for frozen fruit and ice. Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.', 'Blend in short pulses until spoonable. Stop and unplug before scraping the sides. Use only the measured liquid and toppings; serve straight away.'];
  const recipe = (id, name, cat, icon, ings, method, cookTime, equipment = [], extra = {}) => ({
    id: 'social-' + id, name, cat, icon, ings, method, servings: 1, cookTime,
    equipment, collection: 'social', tags: ['measured', 'social-inspired'],
    kcal: null, p: null, c: null, f: null, cost: null, nutritionStatus: 'estimated',
    source: '', sourceType: 'original', sourceName: 'Original Meal Planner recipe',
    testedInKitchen: false, modifications: 'Original measured Meal Planner formulation. All used fats, sauces and toppings are included. Nutrition and times are estimates.', ...extra
  });
  const creator = (video, note) => ({ creator: '@smoothieflip', source: 'https://www.youtube.com/watch?v=' + video,
    sourceType: 'creator-adaptation', sourceName: '@smoothieflip · Meal Planner adaptation',
    modifications: 'Inspired by the creator’s public video caption. Metric weights, one-serving yield and rewritten method supplied by Meal Planner; these are selected weights rather than exact cup or scoop conversions. ' + note });
  const oats = (id, name, additions, extra = {}) => recipe(id, name, 'Breakfast', '🥣',
    [['Oats', 45, 'g'], ['0% Greek yoghurt', 150, 'g'], ['Milk', 100, 'ml'], ['Chia seeds', 5, 'g'], ...additions],
    ['Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.', 'Refrigerate at 5°C or below for at least six hours. Stir, add the measured topping and eat within 48 hours.'], 5, [],
    { tags: ['measured', 'social-inspired', 'overnight-oats', 'meal-prep', 'vegetarian'], passiveMinutes: 360, passiveLabel: 'chill', ...extra });
  const bowl = (id, name, fruit, additions = [], extra = {}) => recipe(id, name, 'Breakfast', '🥣',
    [...fruit, ['Unsweetened almond milk', 120, 'ml'], ['Whey protein powder', 30, 'g'], ...additions], blend, 6, ['Blender'],
    { tags: ['measured', 'social-inspired', 'smoothie-bowl', 'vegetarian'], ...extra });
  const prep = (id, name, ings, method, time, family, equipment = ['Hob']) => recipe(id, name, 'Lunch', '🍱', ings,
    [drain, ...method, prepStorage], time, equipment, { servings: 4, proteinFamily: family, tags: ['measured', 'social-inspired', 'meal-prep'] });
  const air = (id, name, ings, method, time, family, extraEquipment = []) => recipe(id, name, 'Dinner', '🍗', ings,
    ['Follow your air fryer’s preheating and fill instructions. Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.', ...method], time,
    ['Air fryer', ...extraEquipment], { proteinFamily: family, tags: ['measured', 'social-inspired', 'air-fryer'] });
  const slow = (id, name, ings, method, family, equipment = []) => recipe(id, name, 'Dinner', '🍲', ings,
    ['Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance. Never put frozen meat in the slow cooker.', drain, ...method, prepStorage],
    15, ['Slow cooker', ...equipment], { servings: 4, fixedBatch: true, batchStorage: 'recipe', passiveMinutes: 240, passiveLabel: 'slow cook', proteinFamily: family,
      tags: ['measured', 'social-inspired', 'slow-cooker', 'meal-prep'] });
  root.SOCIAL_RECIPES = [
    recipe('smoothieflip-chocolate-oats', 'Chocolate Banana Overnight Oats', 'Breakfast', '🍫',
      [['Oats', 45, 'g'], ['Whey protein powder', 30, 'g'], ['Chia seeds', 6, 'g'], ['Peanut butter', 8, 'g'], ['Cocoa powder', 5, 'g'], ['Dark chocolate', 5, 'g'], ['Unsweetened almond milk', 120, 'ml'], ['Banana', 60, 'g'], ['0% Greek yoghurt', 20, 'g']],
      ['Combine oats, protein, chia, peanut butter, cocoa and milk in a covered jar. Chill for at least six hours.', 'Stir and top with the measured banana, chocolate and yoghurt. Keep refrigerated and eat within 48 hours.'], 5, [],
      { ...creator('v1zwei2PTqQ', 'Peanut butter replaces PBfit, dark chocolate replaces mini chips and yoghurt replaces the unspecified whipped-cream topping. All three are included in nutrition.'), passiveMinutes: 360, passiveLabel: 'chill', tags: ['measured', 'overnight-oats', 'meal-prep', 'vegetarian'] }),
    oats('peanut-jar-oats', 'Peanut Butter Jar Overnight Oats', [['Peanut butter', 15, 'g'], ['Banana', 60, 'g']]),
    oats('strawberry-cheesecake-oats', 'Strawberry Cheesecake Overnight Oats', [['Strawberries', 100, 'g'], ['Light cream cheese', 25, 'g'], ['Oat biscuits', 8, 'g']]),
    oats('blueberry-lemon-oats', 'Blueberry Lemon Overnight Oats', [['Blueberries', 80, 'g'], ['Lemon juice', 5, 'ml'], ['Honey', 5, 'g']]),
    oats('apple-pie-oats', 'Apple Pie Overnight Oats', [['Apple', 100, 'g'], ['Cinnamon', .5, 'g'], ['Walnuts', 8, 'g']]),
    oats('carrot-cake-oats', 'Carrot Cake Overnight Oats', [['Carrot', 60, 'g'], ['Cinnamon', .5, 'g'], ['Walnuts', 8, 'g'], ['Honey', 5, 'g']]),
    oats('chocolate-cherry-oats', 'Chocolate Berry Overnight Oats', [['Frozen berries', 90, 'g'], ['Cocoa powder', 5, 'g'], ['Dark chocolate', 5, 'g']]),
    oats('pbj-oats', 'Peanut Butter & Berry Overnight Oats', [['Strawberries', 100, 'g'], ['Peanut butter', 12, 'g']]),
    oats('mango-oats', 'Mango Lassi Overnight Oats', [['Mango', 100, 'g'], ['Lime', 10, 'g']]),
    oats('coffee-free-tiramisu-oats', 'Cocoa Cheesecake Overnight Oats', [['Cocoa powder', 5, 'g'], ['Light cream cheese', 25, 'g'], ['Oat biscuits', 10, 'g']]),
    oats('banana-bread-oats', 'Banana Bread Overnight Oats', [['Banana', 90, 'g'], ['Cinnamon', .5, 'g'], ['Walnuts', 8, 'g']]),
    oats('pineapple-oats', 'Pineapple Yoghurt Overnight Oats', [['Pineapple', 110, 'g'], ['Honey', 5, 'g']]),

    bowl('smoothieflip-strawberry-bowl', 'Four-Ingredient Strawberry Protein Bowl', [['Frozen strawberries', 225, 'g']], [['Water', 180, 'ml']],
      creator('MJB_ZATvb48', 'Selects a 30 g whey serving and 225 g strawberries; the water is made into ice. No uncounted toppings are added.')),
    bowl('smoothieflip-raspberry-mango', 'Raspberry Mango Protein Bowl', [['Frozen raspberries', 65, 'g'], ['Frozen mango', 120, 'g']], [['Chia seeds', 2, 'g'], ['Water', 180, 'ml']],
      creator('32FhG9FvsCQ', 'Selects a 30 g whey serving and measured fruit weights; the water is made into ice. No uncounted toppings are added.')),
    bowl('blueberry-banana-bowl', 'Blueberry Banana Smoothie Bowl', [['Frozen blueberries', 100, 'g'], ['Frozen banana', 100, 'g']], [['Chia seeds', 5, 'g']]),
    bowl('tropical-bowl', 'Mango Pineapple Smoothie Bowl', [['Frozen mango', 100, 'g'], ['Frozen pineapple', 100, 'g'], ['Frozen banana', 60, 'g']]),
    bowl('chocolate-peanut-bowl', 'Chocolate Peanut Banana Bowl', [['Frozen banana', 150, 'g']], [['Cocoa powder', 8, 'g'], ['Peanut butter', 15, 'g']]),
    bowl('strawberry-cheesecake-bowl', 'Strawberry Cheesecake Smoothie Bowl', [['Frozen strawberries', 150, 'g'], ['Frozen banana', 80, 'g']], [['Light cream cheese', 25, 'g'], ['Oat biscuits', 10, 'g']]),
    bowl('green-pineapple-bowl', 'Pineapple Spinach Smoothie Bowl', [['Frozen pineapple', 160, 'g'], ['Frozen banana', 80, 'g'], ['Spinach', 30, 'g']]),
    bowl('raspberry-chocolate-bowl', 'Raspberry Chocolate Smoothie Bowl', [['Frozen raspberries', 120, 'g'], ['Frozen banana', 80, 'g']], [['Cocoa powder', 5, 'g'], ['Dark chocolate', 5, 'g']]),
    bowl('pbj-bowl', 'Peanut Butter & Strawberry Bowl', [['Frozen strawberries', 150, 'g'], ['Frozen banana', 80, 'g']], [['Peanut butter', 15, 'g']]),
    recipe('yoghurt-mango-bowl', 'Mango Yoghurt Smoothie Bowl', 'Breakfast', '🥭', [['Frozen mango', 180, 'g'], ['0% Greek yoghurt', 200, 'g'], ['Milk', 50, 'ml'], ['Oats', 20, 'g']],
      ['Blend mango, yoghurt and measured milk in a frozen-fruit-capable blender, stopping and unplugging before scraping.', 'Spoon into a bowl and add the weighed oats. Serve straight away.'], 6, ['Blender'], { tags: ['measured', 'social-inspired', 'smoothie-bowl', 'vegetarian'] }),

    prep('chicken-burrito-prep', 'Chicken Burrito Meal-Prep Bowls', [['Chicken breast', 600, 'g'], ['Rice', 240, 'g'], ['Black beans', 320, 'g'], ['Frozen mixed peppers', 400, 'g'], ['Onion', 120, 'g'], ['Cooking oil', 20, 'g'], ['Taco seasoning', 12, 'g'], ['0% Greek yoghurt', 160, 'g']],
      [grain, 'Cook diced chicken in the measured oil with onion, peppers and seasoning. ' + chickenCheck, 'Serve with cooked rice, black beans heated through and measured yoghurt.'], 30, 'chicken'),
    prep('honey-soy-chicken-prep', 'Honey Soy Chicken Rice Boxes', [['Chicken breast', 600, 'g'], ['Rice', 240, 'g'], ['Broccoli', 600, 'g'], ['Honey', 40, 'g'], ['Soy sauce', 40, 'ml'], ['Garlic', 12, 'g'], ['Cooking oil', 16, 'g']],
      [grain, 'Cook diced chicken and garlic in all the oil. Add honey, soy sauce and 40 ml water; simmer until fully cooked. ' + chickenCheck, 'Steam broccoli over the hob and divide with rice and chicken.'], 30, 'chicken'),
    prep('turkey-taco-prep', 'Turkey Taco Rice Meal Prep', [['Turkey mince', 600, 'g'], ['Rice', 220, 'g'], ['Kidney beans', 320, 'g'], ['Chopped tomatoes', 600, 'g'], ['Frozen mixed peppers', 400, 'g'], ['Taco seasoning', 12, 'g']],
      [grain, 'Brown turkey without extra oil until fully cooked. Add tomatoes, peppers, beans and seasoning; simmer for 15 minutes until piping hot.', 'Divide with cooked rice.'], 30, 'turkey'),
    prep('tuna-pasta-prep', 'Tuna Crunch Pasta Salad Boxes', [['Pasta', 240, 'g'], ['Tuna', 400, 'g'], ['Sweetcorn', 240, 'g'], ['Cucumber', 300, 'g'], ['0% Greek yoghurt', 160, 'g'], ['Mayonnaise', 40, 'g'], ['Lemon juice', 30, 'ml']],
      ['Cook dry pasta, drain and cool promptly.', 'Mix tuna, corn, diced cucumber, yoghurt, mayonnaise and lemon. Divide with pasta; refrigerate immediately.'], 20, 'fish'),
    prep('chicken-pesto-prep', 'Chicken Pesto Couscous Boxes', [['Chicken breast', 600, 'g'], ['Couscous', 240, 'g'], ['Cherry tomatoes', 400, 'g'], ['Spinach', 200, 'g'], ['Pesto', 60, 'g'], ['Cooking oil', 12, 'g']],
      ['Prepare couscous according to its packet. Cook chicken in all measured oil. ' + chickenCheck, 'Fold cooked chicken, tomatoes, spinach and measured pesto into couscous; heat through.'], 25, 'chicken'),
    prep('beef-burger-prep', 'Beef Burger Potato Meal Prep', [['5% beef mince', 600, 'g'], ['Potato', 800, 'g'], ['Lettuce', 240, 'g'], ['Tomato', 300, 'g'], ['Pickled gherkins', 120, 'g'], ['Mayonnaise', 40, 'g'], ['Mustard', 20, 'g'], ['Cooking oil', 16, 'g']],
      ['Dice and boil potatoes until tender. Brown mince in half the measured oil until cooked through, then crisp potatoes in the remaining oil.', 'Divide with lettuce, tomato and gherkins. Mix mayonnaise and mustard; keep the measured sauce separate.'], 30, 'beef'),
    prep('tofu-peanut-prep', 'Peanut Tofu Rice Meal Prep', [['Firm tofu', 700, 'g'], ['Rice', 240, 'g'], ['Broccoli', 600, 'g'], ['Carrot', 300, 'g'], ['Peanut butter', 60, 'g'], ['Soy sauce', 40, 'ml'], ['Cooking oil', 16, 'g']],
      [grain, 'Cook cubed tofu in all the oil; steam broccoli and carrot on the hob.', 'Thin peanut butter with soy sauce and 80 ml hot water. Divide all ingredients into four portions.'], 25, 'tofu'),
    prep('chickpea-couscous-prep', 'Chickpea Feta Couscous Jars', [['Chickpeas', 600, 'g'], ['Couscous', 220, 'g'], ['Feta cheese', 120, 'g'], ['Cucumber', 400, 'g'], ['Tomato', 400, 'g'], ['Lemon juice', 40, 'ml'], ['Olive oil', 20, 'g']],
      ['Prepare dry couscous following its packet and cool promptly.', 'Divide couscous, chickpeas, chopped vegetables, feta and the measured lemon/oil dressing into covered containers.'], 15, 'legume'),
    prep('egg-potato-prep', 'Egg & Potato Breakfast Boxes', [['Eggs', 8, 'piece'], ['Potato', 800, 'g'], ['Spinach', 200, 'g'], ['Cherry tomatoes', 400, 'g'], ['Cooking oil', 16, 'g']],
      ['Boil eggs until yolks and whites are fully set. Boil diced potato until tender.', 'Crisp potatoes in all the measured oil. Wilt spinach and divide with eggs and tomatoes.'], 25, 'egg'),
    prep('bean-chilli-prep', 'Three-Bean Chilli Meal Prep', [['Kidney beans', 400, 'g'], ['Black beans', 400, 'g'], ['Cannellini beans', 400, 'g'], ['Rice', 200, 'g'], ['Chopped tomatoes', 800, 'g'], ['Onion', 160, 'g'], ['Paprika', 4, 'g'], ['Ground cumin', 4, 'g'], ['Cooking oil', 16, 'g']],
      [grain, 'Soften onion in all the oil. Add spices, tomatoes and drained beans; simmer for 20 minutes until piping hot.', 'Divide with cooked rice.'], 30, 'legume'),

    air('honey-soy-chicken', 'Air Fryer Honey Soy Chicken & Potatoes', [['Chicken breast', 160, 'g'], ['Potato', 200, 'g'], ['Broccoli', 150, 'g'], ['Cooking oil', 5, 'g'], ['Soy sauce', 10, 'ml'], ['Honey', 10, 'g']],
      ['Dice potato into 1 cm pieces, toss with all oil and air fry at 190°C for about 15 minutes.', 'Add chicken cut into evenly sized pieces and broccoli; cook for roughly 12–15 minutes more, turning halfway. ' + chickenCheck, 'Heat the measured honey and soy in a microwave-safe cup until bubbling, and coat the cooked chicken.'], 30, 'chicken', ['Microwave']),
    air('paprika-chicken-wrap', 'Air Fryer Paprika Chicken Wrap', [['Chicken breast', 150, 'g'], ['Wholemeal wrap', 62, 'g'], ['Lettuce', 50, 'g'], ['Tomato', 80, 'g'], ['0% Greek yoghurt', 40, 'g'], ['Cooking oil', 4, 'g'], ['Paprika', 1, 'g']],
      ['Toss chicken strips in oil and paprika; cook at 190°C for roughly 12–16 minutes, turning halfway. ' + chickenCheck, 'Fill the wrap with chicken, yoghurt, lettuce and tomato.'], 20, 'chicken'),
    air('salmon-potatoes', 'Air Fryer Lemon Salmon & Potatoes', [['Salmon fillet', 140, 'g'], ['Potato', 200, 'g'], ['Green beans', 150, 'g'], ['Cooking oil', 5, 'g'], ['Lemon juice', 10, 'ml']],
      ['Dice potatoes, coat with all oil and cook at 190°C for about 20 minutes, shaking halfway.', 'Add salmon and green beans; cook for about 8–12 minutes until the fish is opaque, flakes readily and is cooked through. Add measured lemon juice.'], 35, 'fish'),
    air('tofu-bites', 'Air Fryer Peanut Tofu Bites', [['Firm tofu', 200, 'g'], ['Sweet potato', 180, 'g'], ['Frozen mixed peppers', 120, 'g'], ['Cooking oil', 5, 'g'], ['Peanut butter', 12, 'g'], ['Soy sauce', 10, 'ml']],
      ['Dice sweet potato into small cubes and coat with half the oil; cook at 190°C for about 12 minutes.', 'Add tofu coated with the remaining oil and peppers; cook for 12–15 minutes more until hot throughout. Mix peanut butter and soy with 20 ml hot tap water and drizzle over.'], 30, 'tofu'),
    air('halloumi-pitta', 'Air Fryer Halloumi & Pepper Pitta', [['Halloumi', 70, 'g'], ['Frozen mixed peppers', 150, 'g'], ['Wholemeal pitta', 60, 'g'], ['0% Greek yoghurt', 40, 'g'], ['Cooking oil', 3, 'g']],
      ['Coat peppers with all the oil and cook at 180°C for about 8 minutes. Add sliced halloumi for another 6–8 minutes until golden.', 'Warm pitta briefly in the fryer and fill with halloumi, peppers and measured yoghurt.'], 20, 'dairy'),
    air('turkey-meatballs', 'Air Fryer Turkey Meatballs & Couscous', [['Turkey mince', 160, 'g'], ['Couscous', 50, 'g'], ['Passata', 160, 'g'], ['Garlic', 3, 'g'], ['Dried mixed herbs', 1, 'g'], ['Cooking oil', 4, 'g']],
      ['Mix turkey, garlic and herbs and form small balls. Brush with all measured oil; cook at 190°C for about 12–16 minutes until the centre reaches 75°C for 30 seconds.', 'Prepare couscous following its packet and heat passata on the hob until piping hot. Serve together.'], 25, 'turkey', ['Hob']),
    air('chickpea-crunch-pitta', 'Air Fryer Chickpea Crunch Pitta', [['Chickpeas', 160, 'g'], ['Wholemeal pitta', 60, 'g'], ['Cucumber', 100, 'g'], ['Tomato', 100, 'g'], ['0% Greek yoghurt', 60, 'g'], ['Cooking oil', 4, 'g'], ['Paprika', 1, 'g']],
      [drain, 'Dry chickpeas well, coat with oil and paprika and cook at 190°C for 12–15 minutes, shaking halfway.', 'Fill a warmed pitta with chickpeas, diced vegetables and yoghurt.'], 20, 'legume'),
    air('egg-toast', 'Air Fryer Egg & Cheese Toast', [['Wholemeal bread', 70, 'g'], ['Eggs', 2, 'piece'], ['Cheddar', 20, 'g'], ['Cherry tomatoes', 120, 'g']],
      ['Press a well into each bread slice and place securely in the basket. Add one egg to each well and the measured grated cheddar.', 'Cook at 170°C for roughly 10–14 minutes until egg whites and yolks are fully set. Cook tomatoes alongside only if there is space.'], 18, 'egg'),
    air('loaded-sweet-potato', 'Air Fryer Tuna Sweet Potato', [['Sweet potato', 250, 'g'], ['Tuna', 100, 'g'], ['Sweetcorn', 60, 'g'], ['0% Greek yoghurt', 60, 'g'], ['Cooking oil', 3, 'g']],
      ['Prick the sweet potato, rub with all oil and cook at 190°C for about 40–50 minutes until soft through the middle.', 'Split and fill with drained tuna, sweetcorn and yoghurt.'], 50, 'fish'),
    air('cod-potato-bites', 'Air Fryer Cod & Potato Bites', [['Cod fillet', 170, 'g'], ['Potato', 220, 'g'], ['Frozen peas', 120, 'g'], ['Cooking oil', 5, 'g'], ['Lemon juice', 10, 'ml']],
      ['Dice potatoes and coat with all oil; cook at 190°C for about 20 minutes.', 'Add chunky cod pieces and cook for another 8–12 minutes until opaque, flaking and cooked through. Boil peas on the hob following the packet and add the measured lemon juice.'], 35, 'fish', ['Hob']),

    slow('chicken-taco', 'Slow Cooker Chicken Taco Bowls', [['Chicken breast', 600, 'g'], ['Black beans', 400, 'g'], ['Chopped tomatoes', 800, 'g'], ['Frozen mixed peppers', 400, 'g'], ['Taco seasoning', 12, 'g'], ['Rice', 240, 'g']],
      ['Put chicken, beans, tomatoes, peppers and seasoning in the cooker. Cook covered on HIGH for about four hours; extend as necessary. ' + chickenCheck, 'Shred the cooked chicken in its sauce. Cook rice separately on the hob and divide into four portions.'], 'chicken', ['Hob']),
    slow('chicken-curry', 'Slow Cooker Chicken & Chickpea Curry', [['Chicken breast', 600, 'g'], ['Chickpeas', 400, 'g'], ['Chopped tomatoes', 600, 'g'], ['Light coconut milk', 300, 'ml'], ['Curry paste', 60, 'g'], ['Spinach', 200, 'g'], ['Rice', 220, 'g']],
      ['Add chicken, chickpeas, tomatoes, coconut milk and curry paste. Cook covered on HIGH for about four hours. ' + chickenCheck, 'Stir in spinach and cook until wilted and hot. Cook rice separately on the hob and serve four portions.'], 'chicken', ['Hob']),
    slow('turkey-chilli', 'Slow Cooker Turkey & Bean Chilli', [['Turkey mince', 600, 'g'], ['Kidney beans', 500, 'g'], ['Chopped tomatoes', 800, 'g'], ['Onion', 160, 'g'], ['Frozen mixed peppers', 400, 'g'], ['Paprika', 4, 'g'], ['Ground cumin', 4, 'g'], ['Cooking oil', 12, 'g']],
      ['Brown turkey and onion on the hob in all measured oil until fully cooked.', 'Transfer with beans, tomatoes, peppers and spices. Cook covered on HIGH for about four hours until hot throughout. Serve four portions.'], 'turkey', ['Hob']),
    slow('beef-bolognese', 'Slow Cooker Beef Bolognese Pasta', [['5% beef mince', 600, 'g'], ['Passata', 800, 'g'], ['Carrot', 300, 'g'], ['Onion', 160, 'g'], ['Garlic', 12, 'g'], ['Dried mixed herbs', 4, 'g'], ['Pasta', 280, 'g']],
      ['Brown mince and onion on the hob without extra oil until cooked through. Transfer to the cooker with passata, finely diced carrot, garlic and herbs.', 'Cook covered on HIGH for about four hours until the carrot is tender and sauce piping hot. Cook dry pasta separately on the hob and divide into four portions.'], 'beef', ['Hob']),
    slow('peanut-chicken', 'Slow Cooker Peanut Chicken', [['Chicken breast', 600, 'g'], ['Peanut butter', 80, 'g'], ['Light coconut milk', 300, 'ml'], ['Soy sauce', 40, 'ml'], ['Frozen mixed peppers', 400, 'g'], ['Carrot', 300, 'g'], ['Rice', 220, 'g']],
      ['Mix peanut butter, coconut milk and soy in the cooker. Add chicken, diced carrot and peppers; cook covered on HIGH for about four hours. ' + chickenCheck, 'Cook weighed rice separately on the hob and serve four portions with all the sauce.'], 'chicken', ['Hob']),
    slow('bean-chilli', 'Slow Cooker Three-Bean Chilli', [['Kidney beans', 400, 'g'], ['Black beans', 400, 'g'], ['Cannellini beans', 400, 'g'], ['Chopped tomatoes', 800, 'g'], ['Sweet potato', 500, 'g'], ['Onion', 160, 'g'], ['Paprika', 4, 'g'], ['Ground cumin', 4, 'g']],
      ['Use cooked canned beans, never raw kidney beans. Add drained beans, tomatoes, small sweet-potato cubes, onion and spices to the cooker.', 'Cook covered on HIGH for about four hours until sweet potato is tender and everything is piping hot. Serve four portions.'], 'legume'),
    slow('lentil-dahl', 'Slow Cooker Red Lentil Dahl', [['Red lentils', 300, 'g'], ['Chopped tomatoes', 600, 'g'], ['Light coconut milk', 300, 'ml'], ['Onion', 160, 'g'], ['Curry powder', 8, 'g'], ['Spinach', 200, 'g'], ['Water', 600, 'ml']],
      ['Rinse dry red lentils. Add lentils, tomatoes, coconut milk, onion, curry powder and measured water.', 'Cook covered on HIGH for about four hours until lentils are fully soft; extend as needed. Stir in spinach and cook until hot throughout. Serve four portions.'], 'legume'),
    slow('chicken-potato', 'Slow Cooker Lemon Chicken & Potatoes', [['Chicken breast', 600, 'g'], ['Potato', 800, 'g'], ['Carrot', 400, 'g'], ['Chicken stock', 500, 'ml'], ['Lemon juice', 40, 'ml'], ['Dried mixed herbs', 4, 'g']],
      ['Put small potato and carrot chunks, chicken, prepared stock, lemon juice and herbs in the cooker.', 'Cook covered on HIGH for about four hours until the vegetables are tender. ' + chickenCheck + ' Serve four portions.'], 'chicken'),
    slow('bbq-chicken', 'Slow Cooker BBQ Chicken & Beans', [['Chicken breast', 650, 'g'], ['Black beans', 500, 'g'], ['Passata', 500, 'g'], ['BBQ sauce', 120, 'g'], ['Onion', 160, 'g'], ['Sweetcorn', 300, 'g']],
      ['Add chicken, beans, passata, BBQ sauce, onion and sweetcorn to the cooker.', 'Cook covered on HIGH for about four hours. ' + chickenCheck + ' Shred in the sauce and divide into four portions.'], 'chicken'),
    slow('chickpea-potato', 'Slow Cooker Chickpea & Sweet Potato Curry', [['Chickpeas', 700, 'g'], ['Sweet potato', 600, 'g'], ['Chopped tomatoes', 600, 'g'], ['Light coconut milk', 300, 'ml'], ['Curry paste', 60, 'g'], ['Spinach', 200, 'g']],
      ['Add drained chickpeas, small sweet-potato cubes, tomatoes, coconut milk and curry paste.', 'Cook covered on HIGH for about four hours until potato is tender. Add spinach and cook until hot throughout; serve four portions.'], 'legume'),

    recipe('feta-pasta', 'Baked Feta Tomato Pasta', 'Dinner', '🍝', [['Pasta', 60, 'g'], ['Feta cheese', 60, 'g'], ['Cherry tomatoes', 200, 'g'], ['Spinach', 60, 'g'], ['Olive oil', 5, 'g'], ['Garlic', 3, 'g']], ['Bake feta, tomatoes, garlic and all measured oil in a small dish at 200°C for about 25 minutes.', 'Cook dry pasta separately on the hob. Mash the baked mixture, stir in pasta and spinach and heat until the spinach wilts.'], 30, ['Oven', 'Hob']),
    recipe('salmon-rice-bowl', 'Salmon Rice Crunch Bowl', 'Lunch', '🍚', [['Salmon fillet', 140, 'g'], ['Rice', 50, 'g'], ['Cucumber', 100, 'g'], ['Mayonnaise', 15, 'g'], ['Soy sauce', 10, 'ml'], ['Cooking oil', 3, 'g']], [grain, 'Cook salmon in all measured oil on the hob until opaque, flaking and cooked through.', 'Flake over rice and add cucumber, measured mayonnaise and soy sauce.'], 25, ['Hob']),
    recipe('smash-taco', 'Smash Burger Tortilla', 'Lunch', '🌮', [['5% beef mince', 120, 'g'], ['Wholemeal wrap', 62, 'g'], ['Cheddar', 20, 'g'], ['Lettuce', 50, 'g'], ['Pickled gherkins', 30, 'g'], ['Mayonnaise', 10, 'g']], ['Press a thin layer of mince onto one side of the wrap. Cook meat-side down in a non-stick pan without extra oil until fully cooked through.', 'Turn, add cheddar and warm the wrap. Top with lettuce, gherkins and measured mayonnaise.'], 15, ['Hob']),
    recipe('cottage-cheese-pasta', 'Blended Cottage Cheese Tomato Pasta', 'Dinner', '🍝', [['Pasta', 65, 'g'], ['Cottage cheese', 150, 'g'], ['Passata', 150, 'g'], ['Spinach', 80, 'g'], ['Garlic', 3, 'g']], ['Blend cottage cheese and passata until smooth. Cook dry pasta separately.', 'Warm sauce with garlic and spinach on the hob, stirring without a hard boil. Toss with drained pasta.'], 20, ['Blender', 'Hob']),
    recipe('tortilla-pizza', 'Chicken Tortilla Pizza', 'Lunch', '🍕', [['Wholemeal wrap', 62, 'g'], ['Chicken breast', 100, 'g'], ['Passata', 60, 'g'], ['Cheddar', 25, 'g'], ['Frozen mixed peppers', 80, 'g']], ['Cook small chicken pieces on the hob in a non-stick pan without extra oil. ' + chickenCheck, 'Put the wrap on a baking tray, spread passata and top with chicken, peppers and weighed cheese. Bake at 200°C for about 8–12 minutes until hot and crisp.'], 25, ['Hob', 'Oven']),
    recipe('egg-feta-toast', 'Feta Egg Toast', 'Breakfast', '🍳', [['Eggs', 2, 'piece'], ['Feta cheese', 30, 'g'], ['Wholemeal bread', 60, 'g'], ['Tomato', 100, 'g'], ['Cooking oil', 3, 'g']], ['Warm feta in all measured oil in a non-stick pan. Add eggs and cook gently until whites and yolks are fully set.', 'Serve on bread with sliced tomato. The bread may be left untoasted.'], 12, ['Hob']),
    recipe('chocolate-yoghurt-bark', 'Chocolate Berry Yoghurt Bark', 'Snack', '🍓', [['0% Greek yoghurt', 400, 'g'], ['Frozen berries', 160, 'g'], ['Dark chocolate', 30, 'g'], ['Peanut butter', 30, 'g']], ['Thaw berries safely following the packet. Spread yoghurt in a lined freezer-safe container; add berries, finely chopped chocolate and measured peanut butter.', 'Freeze for at least four hours, then divide into four equal portions. Keep frozen until serving.'], 8, [], { servings: 4, fixedBatch: true, batchStorage: 'recipe', passiveMinutes: 240, passiveLabel: 'freeze' }),
    recipe('cucumber-tuna-crunch', 'Cucumber Tuna Crunch Bowl', 'Lunch', '🥒', [['Tuna', 120, 'g'], ['Cucumber', 250, 'g'], ['0% Greek yoghurt', 80, 'g'], ['Soy sauce', 10, 'ml'], ['Lemon juice', 10, 'ml'], ['Wholemeal bread', 60, 'g']], [drain, 'Thinly slice cucumber and mix with tuna, yoghurt, soy and lemon. Serve with the measured bread.'], 8)
  ];
})(globalThis);
