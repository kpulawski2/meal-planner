/* More detailed Meal Planner methods for existing measured recipes. No ingredient,
   yield, nutrition or price changes. Original/imported recipes retain their own
   method unless this exact ingredient list and yield has a reviewed entry. */
(function(root){
 'use strict';
 const entries = {
  "fakeaway-crispy-chilli-chicken": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Plain flour",
        24,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Honey",
        20,
        "g"
      ],
      [
        "Hot sauce",
        20,
        "ml"
      ],
      [
        "Soy sauce",
        20,
        "ml"
      ],
      [
        "Lime",
        30,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Cut thawed chicken into evenly sized 2 cm pieces and pat dry. Finely grate the garlic and squeeze the lime. Mix the honey, hot sauce, soy sauce and lime juice in a clean bowl; keep this glaze away from raw chicken.",
      "Toss the chicken with all the measured flour until lightly coated. Heat all the measured oil in a wide non-stick pan over medium-high heat. Cook in batches for about 8–10 minutes, turning until the coating is golden; avoid crowding the pan.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Move cooked chicken to a clean plate. Add the frozen peppers to the same pan with a splash of water and cook for 5–7 minutes, until hot and softened. Add garlic and stir for 30 seconds without letting it burn.",
      "Pour in the reserved glaze. Bubble for 1–2 minutes, stirring, until it coats a spoon; add a little water if it becomes sticky before the vegetables are ready.",
      "Return the chicken just long enough to coat and heat through. Divide with the rice and serve immediately for the crispest coating.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-honey-garlic-noodles": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Noodles",
        110,
        "g"
      ],
      [
        "Broccoli",
        260,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Honey",
        24,
        "g"
      ],
      [
        "Soy sauce",
        30,
        "ml"
      ],
      [
        "Garlic",
        12,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Chilli flakes",
        1,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook the weighed dry noodles following their packet, then drain. Loosen them with a splash of water if they stick together; no extra oil is needed.",
      "Slice thawed chicken into thin, even strips. Cut broccoli into small florets, thinly slice the carrot and grate the garlic. Mix honey and soy sauce in a clean bowl.",
      "Heat all the measured oil over medium-high heat in a wide non-stick pan. Cook chicken for 6–8 minutes, turning until lightly browned. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Add carrot, broccoli and a splash of water. Cover for 3–5 minutes, stirring once, until the vegetables are tender with a little bite.",
      "Uncover and let excess water evaporate. Lower to medium heat, add garlic and the measured chilli flakes, and stir for 30 seconds until fragrant.",
      "Add the honey-soy mixture and enough water to loosen it. Bubble gently for 1–2 minutes until glossy, then toss through the drained noodles. Divide into the stated servings.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-sweet-sour-chicken": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Pineapple",
        160,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Passata",
        100,
        "g"
      ],
      [
        "Honey",
        16,
        "g"
      ],
      [
        "Lemon juice",
        25,
        "ml"
      ],
      [
        "Soy sauce",
        20,
        "ml"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Cut thawed chicken into 2 cm cubes, dice the onion and cut pineapple into bite-sized pieces. Mix passata, honey, soy sauce and lemon juice in a clean bowl.",
      "Heat all the measured oil over medium-high heat. Brown chicken for 6–8 minutes, turning regularly, then add onion and frozen peppers. Cook for another 5–7 minutes until the vegetables soften.",
      "Pour in the sweet-and-sour sauce and add pineapple. Lower the heat and simmer for about 5 minutes, stirring, until the sauce coats the chicken rather than pooling like water.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "If the sauce becomes thick before the chicken is ready, add a splash of water and continue simmering. Divide the chicken, vegetables and sauce over the rice.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-shawarma-fries": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Potato",
        400,
        "g"
      ],
      [
        "Cooking oil",
        12,
        "g"
      ],
      [
        "Ground cumin",
        2,
        "g"
      ],
      [
        "Paprika",
        3,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Lemon juice",
        20,
        "ml"
      ],
      [
        "0% Greek yoghurt",
        80,
        "g"
      ],
      [
        "Lettuce",
        80,
        "g"
      ],
      [
        "Tomato",
        120,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Heat the oven to 210°C conventional / 190°C fan. Cut potatoes into even thin chips, pat dry and toss with half the measured oil. Spread on a tray in a single layer.",
      "Roast for 30–35 minutes, turning halfway, until golden at the edges and soft in the middle. Use a second tray if the chips would overlap.",
      "Slice thawed chicken into thin strips. Coat with all the measured cumin and paprika, half the grated garlic and the remaining oil. Leave covered in the fridge while the chips begin cooking; a long marinade is not required.",
      "Heat a non-stick frying pan over medium-high heat. Fry the chicken in a single layer for about 7–10 minutes, turning and reducing the heat if the spices darken too quickly. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Mix the yoghurt, measured lemon juice and remaining garlic in a clean bowl. Wash and chop the lettuce and tomato using clean utensils.",
      "Divide chips and chicken between plates, then add the salad and cold garlic-yoghurt sauce. Keep the sauce and salad separate if packing for later.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-peri-peri-rice": {
    "ings": [
      [
        "Chicken breast",
        420,
        "g"
      ],
      [
        "Rice",
        110,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Frozen peas",
        100,
        "g"
      ],
      [
        "Onion",
        80,
        "g"
      ],
      [
        "Hot sauce",
        25,
        "ml"
      ],
      [
        "Lemon juice",
        25,
        "ml"
      ],
      [
        "Paprika",
        3,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Finely dice the onion and grate the garlic. Mix all the hot sauce, lemon juice, paprika and garlic in a clean bowl. Reserve half in a separate clean bowl before the other half touches raw chicken.",
      "Cut thawed chicken into even strips and coat with its half of the peri-peri mixture. Heat half the measured oil in a non-stick pan over medium-high heat.",
      "Cook the chicken for about 8–10 minutes, turning until browned. Lower the heat if the paprika begins to catch; add a splash of water rather than extra oil. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Transfer cooked chicken to a clean plate. Add the remaining oil and onion to the pan and soften over medium heat for 3–4 minutes. Add frozen peppers and cook for 5–7 minutes.",
      "Stir in peas and the clean reserved sauce. Cook following the peas’ packet time until piping hot, then fold in freshly cooked rice and heat it all through.",
      "Divide the spicy rice and chicken between the stated servings. Do not use leftover raw-chicken marinade as a finishing sauce.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-korean-style-chicken": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "White cabbage",
        200,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Soy sauce",
        30,
        "ml"
      ],
      [
        "Honey",
        20,
        "g"
      ],
      [
        "Hot sauce",
        20,
        "ml"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Lime",
        30,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Shred the cabbage and carrot, toss with all the squeezed lime and set aside as a cold slaw. Grate the garlic. Mix soy sauce, honey and hot sauce in a clean bowl.",
      "Cut thawed chicken into 2 cm pieces. Heat all the measured oil over medium-high heat and cook chicken for 8–10 minutes, turning to brown the edges. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Lower the heat to medium. Add the garlic and stir for 30 seconds until fragrant, then add the soy-honey mixture and a splash of water.",
      "Bubble for 1–2 minutes, stirring, until the sauce is glossy and coats the chicken. Reduce the heat if the honey starts to catch.",
      "Serve over rice with the crunchy slaw. This recipe uses a spicy soy glaze rather than gochujang; no additional sauce or toppings are required.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-butter-chicken": {
    "ings": [
      [
        "Chicken breast",
        420,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Passata",
        300,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Tikka seasoning",
        8,
        "g"
      ],
      [
        "Light cream cheese",
        50,
        "g"
      ],
      [
        "Milk",
        80,
        "ml"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Spinach",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Dice the onion finely, grate the garlic and cut thawed chicken into even 2 cm pieces. Measure the tikka seasoning, cream cheese and milk before starting.",
      "Heat all the measured oil over medium heat. Soften the onion for 5–7 minutes, stirring, until translucent with lightly golden edges.",
      "Add garlic and all the tikka seasoning. Stir for 30 seconds until fragrant; lower the heat if it begins to stick. Add the chicken and turn it through the spiced onion for 2 minutes.",
      "Add passata and a splash of water if needed. Bring to a gentle simmer, partly cover and cook for 15–20 minutes, stirring occasionally. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Turn the heat to low. Stir in the cream cheese in small spoonfuls, then the milk, until the sauce is smooth. Avoid a hard boil once the dairy is added.",
      "Add spinach and stir for 1–2 minutes until wilted and hot. Divide over rice; the measured cream cheese supplies the creamy finish without extra butter or cream.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-cajun-chicken-pasta": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Pasta",
        120,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Light cream cheese",
        60,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Paprika",
        3,
        "g"
      ],
      [
        "Chilli flakes",
        1,
        "g"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook the weighed dry pasta in a saucepan of boiling water for the packet time, until just tender. Save a little cooking water before draining.",
      "Slice thawed chicken into even strips. Dice the onion and grate the garlic. Coat chicken with all the measured paprika, chilli flakes and dried mixed herbs.",
      "Heat all the measured oil in a wide non-stick pan over medium-high heat. Fry the chicken for about 7–10 minutes, turning until browned. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Move chicken to a clean plate. Soften onion and frozen peppers in the same pan over medium heat for 5–7 minutes, adding a splash of water if needed. Stir in garlic for the final 30 seconds.",
      "Lower the heat and add milk and cream cheese. Stir until smooth, adding a little reserved pasta water to make a sauce that lightly coats the back of a spoon.",
      "Return chicken and drained pasta. Toss over low heat until piping hot, then divide into the stated servings. Do not boil the creamy sauce hard.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-bbq-loaded-wedges": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Potato",
        400,
        "g"
      ],
      [
        "BBQ sauce",
        60,
        "g"
      ],
      [
        "Cheddar",
        30,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ],
      [
        "Paprika",
        2,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Heat the oven to 210°C conventional / 190°C fan. Cut potatoes into equal wedges, pat dry and coat with half the measured oil and all the paprika. Spread on a tray.",
      "Roast for 30–35 minutes, turning halfway, until golden and easily pierced with a knife. Dice the onion and cut thawed chicken into even strips while the wedges cook.",
      "Heat the remaining oil in a non-stick pan over medium-high heat. Fry the chicken for 7–10 minutes, turning, then add onion and frozen peppers and cook until softened. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Turn the heat to low and stir in all the measured BBQ sauce. Warm for 1–2 minutes; add a splash of water if it sticks rather than extra sauce.",
      "Divide the wedges and chicken mixture between ovenproof dishes or sections of the tray. Sprinkle with all the weighed cheddar and return to the oven for 3–5 minutes, until melted.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-hot-honey-pizza": {
    "ings": [
      [
        "Chicken breast",
        360,
        "g"
      ],
      [
        "Wholemeal wrap",
        124,
        "g"
      ],
      [
        "Passata",
        120,
        "g"
      ],
      [
        "Cheddar",
        50,
        "g"
      ],
      [
        "Honey",
        14,
        "g"
      ],
      [
        "Hot sauce",
        15,
        "ml"
      ],
      [
        "Onion",
        80,
        "g"
      ],
      [
        "Frozen mixed peppers",
        120,
        "g"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Heat the oven to 200°C conventional / 180°C fan. Finely dice the onion, cut the peppers small and grate the measured cheddar. Mix passata and all the dried mixed herbs in a clean bowl.",
      "Dice thawed chicken into small, even pieces. Heat all the measured oil over medium-high heat and cook the chicken for 7–10 minutes, stirring. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Move chicken to a clean plate and soften onion and peppers in the pan for 4–5 minutes. Let excess moisture evaporate so the wrap bases will not become soggy.",
      "Place the wraps flat on a baking tray. Spread with the herby passata, leaving a small border, then add cooked chicken, vegetables and the weighed cheddar.",
      "Bake for 8–10 minutes until the edges are crisp and the cheese is melted. Watch closely near the end because thin wraps colour quickly.",
      "Mix the honey and hot sauce in a clean bowl and drizzle over the pizzas just before serving. Divide into the stated servings.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-salt-pepper-chicken": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Potato",
        400,
        "g"
      ],
      [
        "Plain flour",
        24,
        "g"
      ],
      [
        "Cooking oil",
        12,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Black pepper",
        1,
        "g"
      ],
      [
        "Chilli flakes",
        1,
        "g"
      ],
      [
        "Salt",
        1,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Heat the oven to 210°C conventional / 190°C fan. Cut potatoes into even 2 cm cubes, pat dry and toss with half the measured oil. Roast in one layer for 30–35 minutes, turning halfway.",
      "Cut thawed chicken into 2 cm pieces and pat dry. Toss with all the flour and black pepper. Dice the onion and grate the garlic.",
      "Heat the remaining oil in a wide non-stick pan over medium-high heat. Cook chicken in batches for 8–10 minutes, turning until golden, then place on a clean plate. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Add onion, frozen peppers and a splash of water to the same pan. Stir-fry for 5–7 minutes until softened and hot, allowing excess water to evaporate.",
      "Lower the heat to medium. Add garlic, all the measured chilli flakes and salt, and stir for 30 seconds. Return chicken and toss through this seasoning for 1 minute.",
      "Serve with the crisp potato cubes. Use the listed salt amount; no extra salt or finishing oil is needed.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-katsu-style": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Wholemeal bread",
        45,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Curry powder",
        6,
        "g"
      ],
      [
        "Carrot",
        160,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Chicken stock",
        200,
        "ml"
      ],
      [
        "Light coconut milk",
        100,
        "ml"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Heat the oven to 210°C conventional / 190°C fan. Toast the weighed bread and crumble it finely. Beat the egg in one bowl and put crumbs in another. Grate carrot and finely dice onion.",
      "Cut thawed chicken into even thin cutlets. Coat in egg, then press into the crumbs. Brush with half the measured oil and arrange on a tray without overlapping.",
      "Bake for about 20–25 minutes, turning carefully halfway, until golden. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Meanwhile, heat the remaining oil over medium heat. Soften carrot and onion for 5–7 minutes. Add all the curry powder and stir for 30 seconds until fragrant.",
      "Add stock and coconut milk. Simmer gently for 10–15 minutes, stirring, until the vegetables are tender and the sauce coats a spoon. If any beaten egg remains, stir it into the simmering sauce and cook until fully set; discard crumbs that touched raw chicken.",
      "Slice the cooked cutlets with clean utensils and serve with rice and the curry sauce.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-cheesy-chicken-tacos": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Wholemeal wrap",
        124,
        "g"
      ],
      [
        "Cheddar",
        40,
        "g"
      ],
      [
        "Passata",
        100,
        "g"
      ],
      [
        "Taco seasoning",
        6,
        "g"
      ],
      [
        "Lettuce",
        80,
        "g"
      ],
      [
        "Tomato",
        120,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Finely chop thawed chicken and wash and chop the lettuce and tomato. Grate the cheddar and measure the taco seasoning before starting.",
      "Heat half the measured oil over medium-high heat in a non-stick pan. Add chicken and cook for 5–7 minutes, stirring to separate the pieces.",
      "Lower the heat to medium, add all the taco seasoning and stir for 30 seconds. Add passata and simmer for about 5 minutes until the filling is thick enough to stay inside a folded wrap. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Divide the hot chicken and weighed cheese between the wraps and fold each in half. Wipe the pan if there are dark spice residues, then heat the remaining oil over medium heat.",
      "Toast the folded wraps for 2–3 minutes on each side, pressing gently, until crisp and the cheese is melted. Serve with lettuce and tomato on the side.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-buffalo-wrap": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Wholemeal wrap",
        124,
        "g"
      ],
      [
        "Hot sauce",
        30,
        "ml"
      ],
      [
        "Lighter than light mayonnaise",
        40,
        "g"
      ],
      [
        "Dried mixed herbs",
        1,
        "g"
      ],
      [
        "Garlic",
        4,
        "g"
      ],
      [
        "Lettuce",
        80,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "White cabbage",
        100,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Wash and shred the lettuce, carrot and cabbage. Grate the garlic. Mix all the measured mayonnaise, garlic and dried mixed herbs in a clean bowl; refrigerate the dressing while the chicken cooks.",
      "Cut thawed chicken into even strips. Heat all the measured oil over medium-high heat and fry for about 8–10 minutes, turning until lightly browned. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Lower the heat and add all the measured hot sauce. Toss for 1 minute to coat; add a splash of water if the sauce catches.",
      "Lay the wraps flat and spread with the herby mayonnaise. Add shredded vegetables and chicken, keeping filling in a strip through the centre.",
      "Fold the sides in, then roll firmly from the bottom. Cut with a clean knife and serve. For a packed lunch, cool the chicken promptly before assembling and keep chilled.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-burger-wrap": {
    "ings": [
      [
        "5% beef mince",
        340,
        "g"
      ],
      [
        "Wholemeal wrap",
        124,
        "g"
      ],
      [
        "Cheddar",
        30,
        "g"
      ],
      [
        "Lettuce",
        80,
        "g"
      ],
      [
        "Tomato",
        120,
        "g"
      ],
      [
        "Pickled gherkins",
        60,
        "g"
      ],
      [
        "Lighter than light mayonnaise",
        30,
        "g"
      ],
      [
        "Mustard",
        12,
        "g"
      ],
      [
        "Onion",
        80,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Dice onion finely and grate the cheddar. Wash and chop lettuce and tomato, and slice the drained gherkins. Mix mayonnaise and mustard in a clean bowl.",
      "Heat a wide non-stick pan over medium-high heat. Add mince and onion without extra oil and break the meat into small pieces. Cook for 7–10 minutes, stirring until browned and the onion is soft. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Let any excess liquid evaporate so the wraps do not turn soggy. Turn off the heat.",
      "Spread the measured mustard-mayonnaise sauce over each wrap. Add mince, cheddar, gherkins, lettuce and tomato, dividing the ingredients evenly.",
      "Fold in the sides and roll tightly. If desired, toast seam-side down in a dry non-stick pan over medium heat for 1–2 minutes per side, until sealed and lightly golden.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-smoky-chicken-box": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Rice",
        90,
        "g"
      ],
      [
        "Black beans",
        160,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Sweetcorn",
        80,
        "g"
      ],
      [
        "Paprika",
        3,
        "g"
      ],
      [
        "Ground cumin",
        2,
        "g"
      ],
      [
        "Hot sauce",
        20,
        "ml"
      ],
      [
        "Lime",
        30,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Drain and rinse the black beans and sweetcorn before weighing. Squeeze the lime and cut thawed chicken into even strips. Coat chicken with all the paprika and cumin.",
      "Heat all the measured oil in a wide non-stick pan over medium-high heat. Cook chicken for 8–10 minutes, turning and reducing the heat if the spices start to catch. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Move chicken to a clean plate. Add frozen peppers and a splash of water to the pan and cook for 5–7 minutes until softened and hot.",
      "Add beans, sweetcorn and all the hot sauce. Heat for 3–4 minutes, stirring, until piping hot; add the lime juice off the heat.",
      "Divide rice, smoky chicken and vegetables into the stated servings. Keep any portions for later in shallow containers so they cool quickly.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-gyros-pitta": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Wholemeal pitta",
        120,
        "g"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Cucumber",
        160,
        "g"
      ],
      [
        "Tomato",
        160,
        "g"
      ],
      [
        "Onion",
        60,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Lemon juice",
        20,
        "ml"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Grate the cucumber and squeeze out excess water. Mix with all the yoghurt, grated garlic and measured lemon juice in a clean bowl, then refrigerate. Wash and chop tomato; slice onion thinly.",
      "Slice thawed chicken into even strips. Coat with all the dried mixed herbs and measured oil.",
      "Heat a non-stick pan over medium-high heat and fry the chicken for 8–10 minutes, turning until golden. Add the onion for the final 4–5 minutes to soften it. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Warm the pittas following the packet and carefully open a pocket. Spread with the cold cucumber-yoghurt sauce, then fill with chicken, onion and tomato.",
      "Serve immediately. For meal prep, keep the chicken, salad, sauce and pittas separate until eating.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-fajita-jackets": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Potato",
        450,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Fajita seasoning",
        6,
        "g"
      ],
      [
        "Cheddar",
        30,
        "g"
      ],
      [
        "Passata",
        100,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Prick the washed potatoes several times. Microwave, turning halfway, until the centre is tender; start with 7–12 minutes for a medium potato and add short bursts as needed, following the appliance instructions.",
      "Dice the onion and cut thawed chicken into small, even strips. Coat chicken in all the measured fajita seasoning.",
      "Heat all the measured oil over medium-high heat. Cook chicken for 7–10 minutes, turning, then add onion and frozen peppers and soften for 5–7 minutes. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Stir in passata and simmer over medium-low heat for about 5 minutes until the filling is thick. Add a splash of water if needed to stop the spices catching.",
      "Split the potatoes, spoon over the fajita chicken and divide all the weighed cheddar over the top. Let the heat melt the cheese, or briefly return to a hot oven if using one.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-satay-noodle-box": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Noodles",
        100,
        "g"
      ],
      [
        "Peanut butter",
        30,
        "g"
      ],
      [
        "Soy sauce",
        25,
        "ml"
      ],
      [
        "Lime",
        30,
        "g"
      ],
      [
        "Hot sauce",
        15,
        "ml"
      ],
      [
        "Carrot",
        150,
        "g"
      ],
      [
        "White cabbage",
        150,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook the weighed dry noodles following their packet, then drain. Loosen them with a splash of water if they stick together; no extra oil is needed.",
      "Shred carrot and cabbage finely. Mix peanut butter, soy sauce, all the hot sauce and squeezed lime in a clean bowl. Stir in hot water a spoonful at a time until the sauce pours easily.",
      "Cut thawed chicken into even strips. Heat all the measured oil over medium-high heat and cook for 8–10 minutes, turning. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Lower the heat to medium, add the carrot and cabbage with a splash of water and stir-fry for 2–3 minutes until just softened.",
      "Add drained noodles and the peanut sauce. Toss over low heat for 1–2 minutes until everything is hot and coated; loosen with water if needed rather than more peanut butter or oil.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-pizza-pasta-box": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Pasta",
        120,
        "g"
      ],
      [
        "Passata",
        260,
        "g"
      ],
      [
        "Frozen mixed peppers",
        180,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Cheddar",
        30,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook the weighed dry pasta in a saucepan of boiling water for the packet time, until just tender. Save a little cooking water before draining.",
      "Dice the onion, grate garlic and cheddar, and cut thawed chicken into small, even pieces. Keep the ingredients measured and ready beside the hob.",
      "Heat all the measured oil over medium-high heat. Brown chicken for 7–10 minutes, turning, then transfer to a clean plate. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Soften onion and frozen peppers in the same pan over medium heat for 5–7 minutes. Add garlic and all the dried mixed herbs; stir for 30 seconds.",
      "Add passata and simmer gently for 5–8 minutes until reduced slightly. Return chicken and toss through the drained pasta, adding a splash of pasta water if needed.",
      "Scatter over all the measured cheddar, cover over low heat for 1–2 minutes until melted and serve. No additional pizza sauce or oil is needed.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-korean-beef": {
    "ings": [
      [
        "5% beef mince",
        360,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Broccoli",
        250,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Soy sauce",
        30,
        "ml"
      ],
      [
        "Honey",
        20,
        "g"
      ],
      [
        "Hot sauce",
        15,
        "ml"
      ],
      [
        "Garlic",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Cut broccoli into small florets, thinly slice carrot and grate garlic. Mix soy sauce, honey and hot sauce in a clean bowl.",
      "Heat a wide non-stick pan over medium-high heat. Add the mince without extra oil and break it up. Cook for 7–10 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Add broccoli, carrot and a splash of water. Cover for 3–5 minutes until the vegetables are tender with a little bite, then uncover to evaporate excess water.",
      "Lower the heat, add garlic and stir for 30 seconds. Pour in the soy-honey sauce and bubble for 1–2 minutes until glossy, stirring so the honey does not burn.",
      "Divide the beef and vegetables over the rice. Use all the listed sauce and do not add an unmeasured finishing drizzle.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-smoky-beef-potatoes": {
    "ings": [
      [
        "5% beef mince",
        360,
        "g"
      ],
      [
        "Potato",
        420,
        "g"
      ],
      [
        "Passata",
        180,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Frozen mixed peppers",
        180,
        "g"
      ],
      [
        "Cheddar",
        30,
        "g"
      ],
      [
        "Paprika",
        3,
        "g"
      ],
      [
        "Ground cumin",
        2,
        "g"
      ],
      [
        "Hot sauce",
        15,
        "ml"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Heat the oven to 210°C conventional / 190°C fan. Cut potatoes into even 2 cm cubes, pat dry and toss with all the measured oil. Roast in one layer for 30–35 minutes, turning halfway.",
      "Dice onion and grate the cheddar. Heat a non-stick pan over medium-high heat, add mince and onion without extra oil, and break up the meat. Cook for 7–10 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Lower to medium heat. Add all the paprika and cumin and stir for 30 seconds, then add frozen peppers, passata and hot sauce.",
      "Simmer for 8–10 minutes, stirring, until peppers are tender and the sauce is thick enough to cling to the beef. Add a splash of water if it catches.",
      "Divide the potatoes and beef between the stated servings. Scatter over all the weighed cheddar and allow it to melt into the hot filling.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-teriyaki-salmon": {
    "ings": [
      [
        "Salmon fillet",
        280,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Broccoli",
        250,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Teriyaki sauce",
        40,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Lime",
        30,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Cut broccoli into small florets and slice carrot thinly. Grate garlic and squeeze the lime into a clean bowl.",
      "Steam or boil broccoli and carrot for 4–7 minutes until tender with a little bite, following any packet instructions. Drain well.",
      "Pat salmon dry. Heat all the measured oil in a non-stick pan over medium heat. Add salmon and cook for about 4–5 minutes on the first side; turn carefully and cook for another 3–5 minutes, adjusting for thickness.",
      "Check the fish is opaque through the centre and flakes easily; cook longer if needed and follow the pack instructions. Reduce the heat, add garlic and stir in the pan for 30 seconds without burning it.",
      "Add all the teriyaki sauce and a splash of water. Bubble gently for 1 minute, spooning over the fish. Remove from the heat and add the measured lime juice.",
      "Divide rice and vegetables between plates and add the salmon and glaze. The teriyaki sauce provides the seasoning; no extra soy sauce is needed.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-chilli-tofu": {
    "ings": [
      [
        "Firm tofu",
        400,
        "g"
      ],
      [
        "Noodles",
        100,
        "g"
      ],
      [
        "Plain flour",
        20,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Honey",
        20,
        "g"
      ],
      [
        "Hot sauce",
        20,
        "ml"
      ],
      [
        "Soy sauce",
        25,
        "ml"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook the weighed dry noodles following their packet, then drain. Loosen them with a splash of water if they stick together; no extra oil is needed.",
      "Drain the tofu, pat it dry thoroughly and cut into 2 cm cubes. Cut carrot into thin strips and grate garlic. Mix honey, hot sauce and soy sauce in a clean bowl.",
      "Toss tofu with all the measured flour until lightly coated. Heat all the measured oil over medium-high heat in a wide non-stick pan and fry for 8–10 minutes, turning until golden on several sides.",
      "Move tofu to a plate. Stir-fry frozen peppers and carrot in the same pan with a splash of water for 4–6 minutes until hot and just tender.",
      "Lower the heat, add garlic and stir for 30 seconds. Add the sauce and a splash of water and bubble for 1–2 minutes until glossy.",
      "Return tofu and drained noodles and toss just long enough to coat and heat through. Serve immediately for the best tofu texture.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fakeaway-buffalo-prep-burritos": {
    "ings": [
      [
        "Chicken breast",
        700,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Light cream cheese",
        100,
        "g"
      ],
      [
        "Cheddar",
        60,
        "g"
      ],
      [
        "Hot sauce",
        70,
        "ml"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Grate garlic and cheddar and dice thawed chicken into 1–2 cm pieces. Heat all the measured oil in a wide non-stick pan over medium-high heat.",
      "Cook chicken for 8–10 minutes, stirring until lightly golden. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Add frozen peppers and cook for 5–7 minutes until tender and piping hot. Lower the heat, add garlic and stir for 30 seconds.",
      "Add all the hot sauce and cream cheese. Stir over low heat until smooth; add only a little water if needed, keeping the filling thick rather than runny.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Fold in cooked rice. Divide the filling and all the weighed cheddar evenly between the listed wraps (four per recipe batch). Fold sides in and roll firmly to make four burritos.",
      "For eating now, toast seam-side down in a dry non-stick pan over medium heat for 2–3 minutes per side until sealed and lightly crisp.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-honey-chicken-prep-burritos": {
    "ings": [
      [
        "Chicken breast",
        700,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Black beans",
        200,
        "g"
      ],
      [
        "Cheddar",
        60,
        "g"
      ],
      [
        "Honey",
        35,
        "g"
      ],
      [
        "Hot sauce",
        40,
        "ml"
      ],
      [
        "Paprika",
        5,
        "g"
      ],
      [
        "Ground cumin",
        3,
        "g"
      ],
      [
        "Lime",
        45,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Drain and rinse black beans before weighing. Squeeze the lime, grate cheddar and dice thawed chicken small. Mix honey, hot sauce and lime in a clean bowl.",
      "Coat chicken with all the paprika and cumin. Heat all the measured oil over medium-high heat and cook chicken for 8–10 minutes, stirring and lowering the heat if spices catch. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Add frozen peppers and a splash of water and cook for 5–7 minutes until hot and tender. Stir in beans and cook for 3 minutes until piping hot.",
      "Lower the heat and add the honey-lime sauce. Bubble for 1–2 minutes until glossy, then stir in cooked rice. The filling should be moist but not wet.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide filling and all the cheddar evenly between the listed wraps (four per recipe batch). Fold sides in and roll tightly to make four burritos. Toast in a dry non-stick pan if eating now.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-beef-bean-prep-burritos": {
    "ings": [
      [
        "5% beef mince",
        600,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Kidney beans",
        300,
        "g"
      ],
      [
        "Rice",
        80,
        "g"
      ],
      [
        "Passata",
        200,
        "g"
      ],
      [
        "Onion",
        160,
        "g"
      ],
      [
        "Taco seasoning",
        10,
        "g"
      ],
      [
        "Cheddar",
        80,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Dice onion, grate cheddar and drain and rinse kidney beans before weighing. Heat a wide non-stick pan over medium-high heat.",
      "Add mince and onion without extra oil. Break up the meat and cook for 7–10 minutes, stirring until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Lower to medium heat, stir in all the taco seasoning for 30 seconds, then add passata and kidney beans.",
      "Simmer for 8–10 minutes until the beans are piping hot and the sauce is thick enough to hold its shape on a spoon. Stir in cooked rice.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide the filling and all the weighed cheddar evenly between the listed wraps (four per recipe batch). Fold in the sides and roll firmly to make four burritos; toast seam-side down in a dry pan if serving immediately.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-tikka-prep-burritos": {
    "ings": [
      [
        "Chicken breast",
        700,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Passata",
        200,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Tikka seasoning",
        10,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Light cream cheese",
        80,
        "g"
      ],
      [
        "Cheddar",
        50,
        "g"
      ],
      [
        "Spinach",
        120,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Dice the onion, grate garlic and cheddar, and cut thawed chicken into small, even pieces. Heat all the measured oil in a wide pan over medium heat.",
      "Soften onion for 5–7 minutes. Add garlic and all the tikka seasoning and stir for 30 seconds until fragrant.",
      "Add chicken and turn through the spiced onion for 2 minutes. Pour in passata and simmer gently for 15–20 minutes, stirring and adding a splash of water if necessary. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Lower the heat and stir in cream cheese until smooth. Add spinach and cook for 1–2 minutes until wilted, then fold in cooked rice. Simmer away excess liquid so the filling is thick.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide filling and all the cheddar evenly between the listed wraps (four per recipe batch). Fold in the sides and roll tightly to make four burritos; dry-toast if eating now.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-bbq-prep-burritos": {
    "ings": [
      [
        "Chicken breast",
        700,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Black beans",
        300,
        "g"
      ],
      [
        "Sweetcorn",
        160,
        "g"
      ],
      [
        "BBQ sauce",
        100,
        "g"
      ],
      [
        "Cheddar",
        60,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Drain and rinse black beans and sweetcorn before weighing. Dice onion, grate cheddar and cut thawed chicken into small, even pieces. Coat the chicken with all the paprika.",
      "Heat all the measured oil over medium-high heat and fry chicken for 8–10 minutes, turning to brown. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Add onion and soften over medium heat for 4–5 minutes. Add beans and sweetcorn and stir until piping hot.",
      "Lower the heat and stir through all the BBQ sauce. Warm for 1–2 minutes until the filling is coated and thick; add a splash of water only if it sticks.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide the filling and all the weighed cheddar between the listed wraps (four per recipe batch). Fold sides in and roll firmly to make four burritos. Dry-toast seam-side down if serving immediately.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-breakfast-prep-burritos": {
    "ings": [
      [
        "Eggs",
        8,
        "piece"
      ],
      [
        "Egg whites",
        200,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Potato",
        320,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Cheddar",
        60,
        "g"
      ],
      [
        "Paprika",
        3,
        "g"
      ],
      [
        "Hot sauce",
        30,
        "ml"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cut potato into even 1 cm cubes. Boil in water for 6–8 minutes until almost tender, then drain well. Grate the cheddar and beat the eggs and egg whites together in a bowl.",
      "Heat all the measured oil in a large non-stick pan over medium-high heat. Add potato and cook for 5–7 minutes, turning until golden at the edges.",
      "Add frozen peppers and cook for 5–7 minutes until piping hot. Stir in all the paprika for the final 30 seconds, lowering the heat if it starts to catch.",
      "Turn the heat to low-medium and pour in the beaten eggs and egg whites. Stir gently for 3–5 minutes until fully set with no liquid egg; do not leave it runny for meal prep.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Remove from the heat and stir in all the measured hot sauce. Divide the filling and cheddar evenly between the listed wraps (four per recipe batch). Fold in the sides and roll tightly to make four burritos.",
      "Dry-toast seam-side down for 2–3 minutes per side if eating immediately.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-lime-chicken-dinner-burritos": {
    "ings": [
      [
        "Chicken breast",
        700,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Black beans",
        200,
        "g"
      ],
      [
        "Rice",
        80,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Cheddar",
        50,
        "g"
      ],
      [
        "Hot sauce",
        40,
        "ml"
      ],
      [
        "Lime",
        60,
        "g"
      ],
      [
        "Ground cumin",
        4,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Drain and rinse black beans before weighing. Grate garlic and cheddar and squeeze the lime. Dice thawed chicken small and coat with all the measured cumin.",
      "Heat all the measured oil over medium-high heat and fry chicken for 8–10 minutes, stirring. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Add frozen peppers with a splash of water and cook for 5–7 minutes until tender. Lower the heat, add garlic and stir for 30 seconds.",
      "Add beans and hot sauce and cook for 3–4 minutes until piping hot. Remove from the heat, stir in lime juice and cooked rice, and check the filling is thick rather than watery.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide filling and all the weighed cheddar between the listed wraps (four per recipe batch). Fold the sides in and roll firmly to make four burritos. Dry-toast if serving immediately.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-peri-chicken-dinner-burritos": {
    "ings": [
      [
        "Chicken breast",
        700,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Potato",
        320,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Cheddar",
        50,
        "g"
      ],
      [
        "Hot sauce",
        50,
        "ml"
      ],
      [
        "Lemon juice",
        40,
        "ml"
      ],
      [
        "Paprika",
        5,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cut potato into even 1 cm cubes, boil for 6–8 minutes until nearly tender and drain well. Grate garlic and cheddar. Mix hot sauce, lemon juice, paprika and garlic in a clean bowl, reserving half before any sauce touches raw meat.",
      "Cut thawed chicken into small, even pieces and coat with one half of the sauce. Heat half the measured oil over medium-high heat and fry chicken for 8–10 minutes. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Move cooked chicken to a clean plate. Heat the remaining oil over medium-high heat, add potato and cook for 5–7 minutes until golden at the edges.",
      "Add frozen peppers and cook for 5–7 minutes until tender and hot. Return cooked chicken and add the clean reserved sauce. Toss over medium heat until hot and no watery liquid remains.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide filling and all the weighed cheddar between the listed wraps (four per recipe batch). Fold sides in and roll firmly to make four burritos; dry-toast if eating now. Never add reserved raw-chicken marinade to the finished filling.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-smoky-beef-dinner-burritos": {
    "ings": [
      [
        "5% beef mince",
        600,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Rice",
        100,
        "g"
      ],
      [
        "Kidney beans",
        200,
        "g"
      ],
      [
        "Frozen mixed peppers",
        240,
        "g"
      ],
      [
        "Passata",
        160,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Paprika",
        5,
        "g"
      ],
      [
        "Ground cumin",
        3,
        "g"
      ],
      [
        "Hot sauce",
        30,
        "ml"
      ],
      [
        "Cheddar",
        50,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Dice onion, grate cheddar and drain and rinse kidney beans before weighing. Heat a wide non-stick pan over medium-high heat.",
      "Brown mince and onion without extra oil for 7–10 minutes, breaking up the meat. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Lower to medium heat and add all the paprika and cumin. Stir for 30 seconds until fragrant, then add peppers, passata, kidney beans and hot sauce.",
      "Simmer for 8–10 minutes until the vegetables are tender and the beans piping hot. Let excess liquid evaporate, then fold in cooked rice.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide filling and all the cheddar between the listed wraps (four per recipe batch). Fold sides in and roll tightly to make four burritos; dry-toast seam-side down if eating now.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "fakeaway-black-bean-queso-burritos": {
    "ings": [
      [
        "Black beans",
        500,
        "g"
      ],
      [
        "Cottage cheese",
        440,
        "g"
      ],
      [
        "Wholemeal wrap",
        248,
        "g"
      ],
      [
        "Sweet potato",
        160,
        "g"
      ],
      [
        "Frozen mixed peppers",
        160,
        "g"
      ],
      [
        "Cheddar",
        60,
        "g"
      ],
      [
        "Taco seasoning",
        8,
        "g"
      ],
      [
        "Hot sauce",
        30,
        "ml"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Peel sweet potato and cut into even 1 cm cubes. Boil for 8–10 minutes until just tender, then drain well. Drain and rinse black beans before weighing and grate cheddar.",
      "Heat all the measured oil in a wide non-stick pan over medium-high heat. Fry sweet potato for 4–5 minutes, turning until lightly browned, then add peppers and cook for 5–7 minutes until hot and tender.",
      "Lower the heat, add all the taco seasoning and stir for 30 seconds. Add black beans and hot sauce and heat thoroughly for 3–4 minutes. Mash a few beans to help bind the filling.",
      "Remove from the heat and fold in all the cottage cheese and half the cheddar. Let the residual heat melt the cheese; avoid boiling the cottage cheese.",
      "If storing these burritos, cool the filling promptly before this assembly step, within one hour if it contains rice. Divide filling and remaining cheddar between the listed wraps (four per recipe batch). Fold sides in and roll firmly to make four burritos. Dry-toast seam-side down if serving immediately.",
      "If freezing, cool the filling promptly before assembling four burritos, then wrap individually, label and Freeze promptly. Rice fillings must cool within one hour. Defrost in the fridge and reheat only once until steaming hot in the centre; follow your appliance instructions and check the centre reaches 75°C for 30 seconds. Refrigerate rice burritos for no more than 24 hours; other cooked fillings for no more than 48 hours."
    ]
  },
  "everyday-tuna-pickle-egg-mayo-wrap": {
    "ings": [
      [
        "Wholemeal wrap",
        62,
        "g"
      ],
      [
        "Tuna",
        100,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Mayonnaise",
        15,
        "g"
      ],
      [
        "Pickled gherkins",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the egg in a small saucepan, cover with water and bring to the boil. Simmer for 9–10 minutes until the white and yolk are set, then cool under cold water, peel and chop.",
      "Drain the canned tuna thoroughly before weighing. Drain the gherkins and dice finely; blot excess liquid so the filling will not soak the wrap.",
      "Flake tuna into a bowl and fold in chopped egg, gherkins and all the measured mayonnaise. Mix gently until coated, keeping a little texture.",
      "Lay the wrap flat and spoon the filling in a line through the centre, leaving a clear border. Fold the sides in, then roll firmly from the bottom.",
      "Serve straight away or cover, refrigerate and eat within 24 hours. The gherkins provide tang and the mayonnaise the dressing; no additional sauce or oil is included."
    ]
  },
  "everyday-tuna-crunch-pitta": {
    "ings": [
      [
        "Wholemeal pitta",
        60,
        "g"
      ],
      [
        "Tuna",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Carrot",
        60,
        "g"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain canned tuna thoroughly before weighing, then flake it into a bowl. Wash the carrot and cucumber; grate the carrot and dice the cucumber, draining any pooled liquid.",
      "Stir all the yoghurt and measured lemon juice together until smooth. Fold into the tuna until coated; the lemon supplies acidity and the yoghurt is the dressing.",
      "Warm the pitta using its packet instructions, just until flexible. Open a pocket carefully without cutting right through the back.",
      "Fill with the tuna mixture, grated carrot and cucumber. Keep the filling central so the pocket closes without splitting.",
      "Serve immediately for the best crunch. For a packed lunch, keep the filling chilled and fill the pitta close to eating; use within 24 hours. No oil is added."
    ]
  },
  "everyday-chicken-pepper-couscous": {
    "ings": [
      [
        "Chicken breast",
        120,
        "g"
      ],
      [
        "Couscous",
        40,
        "g"
      ],
      [
        "Frozen mixed peppers",
        120,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the ratio on its packet, cover and leave for the packet time, then fluff with a fork.",
      "Cut thawed chicken into thin, even strips. Heat all the measured oil in a non-stick pan over medium-high heat and cook chicken for 6–8 minutes, turning until lightly golden.",
      "Lower the heat to medium and add all the paprika. Stir for 20–30 seconds so the paprika coats the chicken without burning.",
      "Add frozen peppers and a splash of water. Cook for 5–7 minutes until the peppers are tender and piping hot. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Spoon chicken and peppers over the fluffed couscous. Serve with all the measured yoghurt as a cold topping; do not boil it in the pan.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-white-bean-lemon-soup": {
    "ings": [
      [
        "Cannellini beans",
        160,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Spinach",
        60,
        "g"
      ],
      [
        "Wholemeal bread",
        40,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain and rinse the cannellini beans before weighing. Dice onion and carrot finely and wash the spinach.",
      "Heat all the measured oil in a saucepan over medium heat. Cook onion and carrot for 5–7 minutes, stirring, until the onion is soft; lower the heat if it starts to colour too quickly.",
      "Add the beans and enough water to make a soup. Bring to a gentle simmer and cook for about 10–15 minutes until the carrot is easily pierced with a fork.",
      "Mash a spoonful of beans against the side of the pan, then stir them back in to thicken the broth. Add spinach and cook for 1–2 minutes until wilted and hot.",
      "Remove from the heat and stir in all the measured lemon juice for a fresher finish. Toast the bread and serve with the soup.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-egg-hummus-free-wrap": {
    "ings": [
      [
        "Wholemeal wrap",
        50,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Chickpeas",
        70,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ],
      [
        "Cucumber",
        60,
        "g"
      ],
      [
        "Carrot",
        50,
        "g"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cover the egg with water in a saucepan. Bring to the boil and simmer for 9–10 minutes until fully set. Cool under cold water, peel and chop.",
      "Drain and rinse chickpeas before weighing. Mash with all the measured yoghurt and lemon juice, leaving some texture rather than blending completely smooth.",
      "Wash and grate carrot and dice cucumber. Drain any excess cucumber liquid so the wrap stays firm.",
      "Spread the chickpea mixture over the wrap, leaving a border. Add chopped egg, carrot and cucumber through the centre.",
      "Fold the sides in and roll tightly. Serve now or refrigerate in a covered container and use within 24 hours. No extra oil or mayonnaise is needed."
    ]
  },
  "everyday-cottage-pea-couscous": {
    "ings": [
      [
        "Couscous",
        40,
        "g"
      ],
      [
        "Cottage cheese",
        140,
        "g"
      ],
      [
        "Frozen peas",
        80,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put dry couscous in a heatproof bowl, add boiling water according to the packet ratio, cover and stand for the packet time. Fluff well with a fork.",
      "Cook the frozen peas following their packet instructions until piping hot, then drain. If making a cold salad, spread couscous and peas in a shallow container and cool promptly.",
      "Wash and dice cucumber and tomato, draining any pooled liquid. Stir all the measured lemon juice into the cottage cheese.",
      "Fold the vegetables, peas and cottage cheese through the couscous just before serving. No extra oil is included.",
      "For meal prep, cover and refrigerate promptly. Keep chilled and eat within 48 hours; use sooner if a dairy pack says so."
    ]
  },
  "everyday-tofu-peanut-noodles": {
    "ings": [
      [
        "Firm tofu",
        100,
        "g"
      ],
      [
        "Noodles",
        35,
        "g"
      ],
      [
        "Carrot",
        80,
        "g"
      ],
      [
        "Broccoli",
        100,
        "g"
      ],
      [
        "Peanut butter",
        8,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry noodles following their packet, then drain. Loosen them with a splash of water if they stick together; no extra oil is needed.",
      "Cut broccoli into small florets and grate the carrot. Cook broccoli in boiling water for 4–6 minutes until just tender, then drain.",
      "Drain tofu, pat dry and cut into 2 cm cubes. Heat a non-stick pan over medium heat with a splash of water; add tofu and carrot and stir for 4–5 minutes until hot throughout.",
      "Mix all the peanut butter and soy sauce in a small bowl. Add hot water a spoonful at a time until the sauce is smooth and pourable.",
      "Add broccoli, drained noodles and the sauce to the pan. Toss over low heat for 1–2 minutes until piping hot and coated; add a splash of water if the noodles absorb the sauce.",
      "Serve immediately. The soy-peanut sauce is the seasoning; no extra oil or toppings are required.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-turkey-tomato-pitta": {
    "ings": [
      [
        "Turkey mince",
        100,
        "g"
      ],
      [
        "Wholemeal pitta",
        60,
        "g"
      ],
      [
        "Chopped tomatoes",
        120,
        "g"
      ],
      [
        "Lettuce",
        40,
        "g"
      ],
      [
        "Cucumber",
        60,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and shred lettuce and slice cucumber. Measure the paprika and canned tomatoes. Warm the pitta following its packet instructions near the end of cooking.",
      "Heat a non-stick pan over medium-high heat. Add turkey mince without extra oil, break it into small pieces and cook for 6–8 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Lower the heat to medium. Stir in all the paprika for 30 seconds, then add chopped tomatoes.",
      "Simmer for 5–7 minutes, stirring, until the filling is thick rather than watery. Add a little water if it sticks before the mince is ready.",
      "Carefully open the warm pitta and fill with turkey, lettuce and cucumber. For a cold packed lunch, cool the turkey promptly before packing and keep the salad separate until eating.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-lentil-carrot-soup": {
    "ings": [
      [
        "Red lentils",
        45,
        "g"
      ],
      [
        "Carrot",
        140,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Chopped tomatoes",
        120,
        "g"
      ],
      [
        "Wholemeal bread",
        40,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ],
      [
        "Ground cumin",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Rinse the dry red lentils. Dice onion and carrot finely so they soften in the soup’s cooking time.",
      "Heat all the measured oil in a saucepan over medium heat. Soften onion and carrot for 5–7 minutes, stirring.",
      "Add all the ground cumin and stir for 30 seconds until fragrant. Add lentils, chopped tomatoes and enough water to cover comfortably.",
      "Bring to a gentle simmer and cook for about 20 minutes, stirring occasionally. Add water as needed to keep it soupy and prevent the lentils sticking to the base.",
      "Check the lentils have broken down and the carrot is fork-tender. Mash a little with the back of a spoon for a thicker texture, then serve with toasted bread.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-chicken-courgette-orzo": {
    "ings": [
      [
        "Chicken breast",
        140,
        "g"
      ],
      [
        "Orzo",
        40,
        "g"
      ],
      [
        "Courgette",
        180,
        "g"
      ],
      [
        "Chopped tomatoes",
        120,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry orzo using its packet time. Save a little cooking water, then drain. Dice the courgette into even 1 cm pieces and cut thawed chicken into small strips.",
      "Heat all the measured oil in a wide non-stick pan over medium-high heat. Fry chicken for 7–10 minutes, turning until lightly browned. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Transfer chicken to a clean plate. Add courgette to the same pan and cook for 4–5 minutes until lightly coloured at the edges, adding a splash of water if it sticks.",
      "Add chopped tomatoes, lower the heat and simmer for 5–7 minutes until courgette is tender and the sauce has thickened slightly.",
      "Return chicken and drained orzo and toss until hot. Remove from the heat and stir in all the measured lemon juice; this gives the dish its fresh finish.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-cod-white-bean-stew": {
    "ings": [
      [
        "Cod fillet",
        160,
        "g"
      ],
      [
        "Cannellini beans",
        120,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain and rinse cannellini beans before weighing. Dice carrot and onion finely and cut the cod into large, even pieces, checking for bones.",
      "Heat all the measured oil in a saucepan over medium heat. Soften onion and carrot for 5–7 minutes, stirring.",
      "Add chopped tomatoes and enough water to make a loose stew. Simmer gently for 10–12 minutes until the carrot is almost tender.",
      "Stir in beans, then nestle cod pieces into the sauce. Cover and simmer gently for about 6–10 minutes, depending on thickness; avoid vigorous stirring that breaks up the fish.",
      "Check the cod is opaque through the centre and flakes easily, and that the beans are piping hot. Cook longer if needed and follow the fish pack instructions before serving.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-beef-cabbage-free-pepper": {
    "ings": [
      [
        "5% beef mince",
        120,
        "g"
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Frozen mixed peppers",
        120,
        "g"
      ],
      [
        "Chopped tomatoes",
        120,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cut potato into even 1 cm cubes. Boil for 8–10 minutes until just tender, then drain well.",
      "Heat a wide non-stick pan over medium-high heat. Add mince without extra oil, break it into small pieces and brown for 7–10 minutes. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Lower the heat, add all the paprika and stir for 30 seconds. Add frozen peppers and chopped tomatoes.",
      "Simmer for 7–10 minutes until the peppers are tender and the sauce is thick. Add drained potato and fold gently to coat without crushing it.",
      "Cook for another 2–3 minutes until the potato is hot throughout. No extra oil is required; use a splash of water if the sauce sticks.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-turkey-sweet-potato": {
    "ings": [
      [
        "Turkey mince",
        100,
        "g"
      ],
      [
        "Sweet potato",
        150,
        "g"
      ],
      [
        "Kidney beans",
        80,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Frozen mixed peppers",
        100,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Peel sweet potato and cut into even 1 cm cubes. Drain and rinse kidney beans before weighing.",
      "Heat a non-stick saucepan over medium-high heat. Add turkey mince without extra oil, break it up and cook for 6–8 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Lower to medium heat and stir in all the paprika for 30 seconds. Add chopped tomatoes, frozen peppers, sweet potato and enough water to keep the mixture loose.",
      "Simmer gently for 15–20 minutes, stirring, until the sweet potato is fork-tender. Add water if needed rather than letting the sauce stick.",
      "Add kidney beans and simmer for another 3–5 minutes until piping hot. Let excess liquid evaporate so the sauce coats the turkey and vegetables.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-tofu-broccoli-peanut": {
    "ings": [
      [
        "Firm tofu",
        130,
        "g"
      ],
      [
        "Rice",
        35,
        "g"
      ],
      [
        "Broccoli",
        160,
        "g"
      ],
      [
        "Carrot",
        80,
        "g"
      ],
      [
        "Peanut butter",
        8,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Drain tofu, pat dry and cut into 2 cm cubes. Cut broccoli into small florets and carrot into thin slices.",
      "Steam or boil broccoli and carrot for 4–7 minutes until tender with a little bite, then drain well.",
      "Heat tofu in a non-stick pan over medium heat with a splash of water, stirring for 4–5 minutes until hot throughout. No additional oil is needed.",
      "Mix all the peanut butter and soy sauce in a clean bowl. Add hot water a spoonful at a time until smooth and pourable.",
      "Toss tofu and vegetables with the sauce over low heat for 1–2 minutes, then serve over rice. Loosen with water if the sauce thickens too much.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-chickpea-courgette-pan": {
    "ings": [
      [
        "Chickpeas",
        120,
        "g"
      ],
      [
        "Couscous",
        30,
        "g"
      ],
      [
        "Courgette",
        180,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ],
      [
        "Ground cumin",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare the weighed dry couscous using its packet water ratio and standing time. Fluff with a fork. Drain and rinse chickpeas before weighing.",
      "Dice onion finely and cut courgette into even 1 cm pieces. Heat all the measured oil in a non-stick pan over medium heat.",
      "Soften onion for 4–5 minutes. Add courgette and cook for another 4–5 minutes until lightly coloured at the edges.",
      "Add all the ground cumin and stir for 30 seconds until fragrant. Add chopped tomatoes and chickpeas and simmer for 7–10 minutes until the courgette is tender and the chickpeas piping hot.",
      "Serve over the fluffed couscous. Add a splash of water if the sauce becomes dry while the vegetables are cooking.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-mushroom-cottage-potato": {
    "ings": [
      [
        "Potato",
        200,
        "g"
      ],
      [
        "Mushrooms",
        180,
        "g"
      ],
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Spinach",
        80,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and prick the potato several times. Microwave following the appliance instructions, turning halfway, until a knife slides through the centre easily; allow extra time for a large potato.",
      "Slice mushrooms and wash spinach. Heat all the measured oil in a non-stick pan over medium-high heat.",
      "Cook mushrooms for 5–7 minutes, stirring occasionally, until their released water has evaporated and the edges begin to brown.",
      "Add spinach and stir for 1–2 minutes until wilted and hot. Lower the heat if the mushrooms catch; add water rather than extra oil.",
      "Split the potato and spoon over cottage cheese and the hot mushroom-spinach mixture. The cottage cheese stays creamy if added off the heat; no butter is included."
    ]
  },
  "everyday-tuna-corn-pepper-rice": {
    "ings": [
      [
        "Tuna",
        110,
        "g"
      ],
      [
        "Rice",
        40,
        "g"
      ],
      [
        "Sweetcorn",
        70,
        "g"
      ],
      [
        "Frozen mixed peppers",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        100,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Drain canned tuna and sweetcorn before weighing. Flake the tuna gently, leaving some larger pieces.",
      "Heat all the measured oil in a non-stick pan over medium heat. Add frozen peppers and cook for 5–7 minutes until hot and softened.",
      "Add chopped tomatoes and simmer for 5–7 minutes until slightly reduced. Stir in sweetcorn and cook for 2–3 minutes.",
      "Fold in tuna and freshly cooked rice. Stir over medium-low heat until piping hot, taking care not to mash the tuna.",
      "Divide into the stated servings. No additional sauce or finishing oil is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "everyday-tofu-mushroom-breakfast": {
    "ings": [
      [
        "Firm tofu",
        140,
        "g"
      ],
      [
        "Mushrooms",
        120,
        "g"
      ],
      [
        "Wholemeal bread",
        40,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain and pat tofu dry, then crumble it into bite-sized pieces. Slice mushrooms and wash and chop tomato.",
      "Heat all the measured oil in a non-stick pan over medium-high heat. Cook mushrooms for 5–7 minutes until their water evaporates and the edges begin to brown.",
      "Lower to medium heat, add tofu and all the measured paprika, and stir for 30 seconds so the spice coats the tofu.",
      "Add a splash of water and cook for 3–4 minutes until the tofu is hot throughout. Toast the bread while the pan finishes.",
      "Spoon the tofu and mushrooms over toast and serve with chopped tomato. No extra oil is needed."
    ]
  },
  "everyday-tomato-cottage-eggs": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Wholemeal bread",
        40,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Dice the tomato and beat the eggs in a bowl. Toast the bread near the end of cooking so it stays crisp.",
      "Heat all the measured oil in a non-stick pan over medium heat. Add tomato and cook for 2–3 minutes until softened and excess juice has mostly evaporated.",
      "Turn the heat to low-medium and pour in the eggs. Stir gently with a spatula for 2–4 minutes, drawing the cooked edges into the centre.",
      "When the eggs are fully set with no liquid remaining, remove the pan from the heat and fold in all the cottage cheese. The residual heat will warm it without splitting it.",
      "Serve immediately on the toast. No additional butter or oil is included."
    ]
  },
  "tailored-berry-oats": {
    "ings": [
      [
        "Oats",
        30,
        "g"
      ],
      [
        "Skyr",
        250,
        "g"
      ],
      [
        "Skimmed milk",
        80,
        "ml"
      ],
      [
        "Frozen berries",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare the frozen berries following their packet instructions. If the pack requires cooking, heat them as directed, then cool promptly before mixing with dairy.",
      "Use a clean lidded container large enough for the oats to expand. Stir the measured oats, skyr and skimmed milk until no dry pockets remain, then fold in the prepared berries.",
      "Cover and refrigerate straight away at 5°C or below for 6–12 hours, until the oats have softened. This is overnight soaking time, in addition to the hands-on preparation time.",
      "Stir before eating. If too thick, loosen with a little water; any extra milk or toppings would need adding to the ingredient amounts.",
      "Keep chilled and eat within 48 hours, or sooner if a dairy pack instructs. Prepare small batches rather than a whole week of refrigerated oats."
    ]
  },
  "tailored-budget-berry-oats": {
    "ings": [
      [
        "Oats",
        50,
        "g"
      ],
      [
        "Skyr",
        200,
        "g"
      ],
      [
        "Skimmed milk",
        100,
        "ml"
      ],
      [
        "Frozen berries",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare the frozen berries following their packet instructions. If the pack requires cooking, heat them as directed, then cool promptly before mixing with dairy.",
      "Use a clean lidded container large enough for the oats to expand. Stir the measured oats, skyr and skimmed milk until no dry pockets remain, then fold in the prepared berries.",
      "Cover and refrigerate straight away at 5°C or below for 6–12 hours, until the oats have softened. This is overnight soaking time, in addition to the hands-on preparation time.",
      "Stir before eating. If too thick, loosen with a little water; any extra milk or toppings would need adding to the ingredient amounts.",
      "Keep chilled and eat within 48 hours, or sooner if a dairy pack instructs. Prepare small batches rather than a whole week of refrigerated oats."
    ]
  },
  "lighter-berry-skyr-oats": {
    "ings": [
      [
        "Oats",
        35,
        "g"
      ],
      [
        "Skyr yoghurt",
        170,
        "g"
      ],
      [
        "Skimmed milk",
        100,
        "ml"
      ],
      [
        "Frozen berries",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare the frozen berries following their packet instructions. If the pack requires cooking, heat them as directed, then cool promptly before mixing with dairy.",
      "Use a clean lidded container large enough for the oats to expand. Stir the measured oats, skyr and skimmed milk until no dry pockets remain, then fold in the prepared berries.",
      "Cover and refrigerate straight away at 5°C or below for 6–12 hours, until the oats have softened. This is overnight soaking time, in addition to the hands-on preparation time.",
      "Stir before eating. If too thick, loosen with a little water; any extra milk or toppings would need adding to the ingredient amounts.",
      "Keep chilled and eat within 48 hours, or sooner if a dairy pack instructs. Prepare small batches rather than a whole week of refrigerated oats."
    ]
  },
  "tailored-apple-oats": {
    "ings": [
      [
        "Oats",
        30,
        "g"
      ],
      [
        "Skyr",
        250,
        "g"
      ],
      [
        "Skimmed milk",
        80,
        "ml"
      ],
      [
        "Apple",
        50,
        "g"
      ],
      [
        "Cinnamon",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and core the apple, then dice finely or grate for a softer texture. Leave the skin on if preferred.",
      "Stir the measured oats, skyr and skimmed milk in a clean lidded container. Add all the cinnamon and apple and mix until the cinnamon is evenly distributed with no dry oat pockets.",
      "Cover and refrigerate straight away at 5°C or below for 6–12 hours, until the oats are soft.",
      "Stir before eating and loosen with a little water if needed. Keep chilled and eat within 48 hours; no additional sweetener is included."
    ]
  },
  "tailored-budget-apple-oats": {
    "ings": [
      [
        "Oats",
        50,
        "g"
      ],
      [
        "Skyr",
        200,
        "g"
      ],
      [
        "Skimmed milk",
        100,
        "ml"
      ],
      [
        "Apple",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and core the apple, then grate or dice finely. Stir it into the measured oats, skyr and skimmed milk in a clean lidded container.",
      "Mix thoroughly so no dry oat pockets remain. Cover and refrigerate straight away at 5°C or below for 6–12 hours.",
      "Stir before eating. The apple provides sweetness; no additional sugar, cinnamon or toppings are included in this version.",
      "Keep chilled and eat within 48 hours. Loosen a thick mixture with a little water rather than unmeasured extra milk."
    ]
  },
  "tailored-banana-oats": {
    "ings": [
      [
        "Oats",
        30,
        "g"
      ],
      [
        "Skyr",
        250,
        "g"
      ],
      [
        "Skimmed milk",
        80,
        "ml"
      ],
      [
        "Banana",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Peel and weigh the banana, then mash it with a fork until mostly smooth.",
      "Mix the banana with the measured skyr and skimmed milk. Stir in the oats thoroughly so they are evenly coated.",
      "Transfer to a clean lidded container, cover and refrigerate straight away at 5°C or below for 6–12 hours.",
      "Stir before eating. Keep chilled and use within 48 hours; the banana may darken slightly. No extra sweetener or toppings are included."
    ]
  },
  "tailored-tuna-wrap": {
    "ings": [
      [
        "Wholemeal wrap",
        62,
        "g"
      ],
      [
        "Tuna",
        150,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Mayonnaise",
        5,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ],
      [
        "Pickled gherkins",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cover the egg with water, bring to the boil and simmer for 9–10 minutes until the white and yolk are set. Cool under cold water, peel and chop.",
      "Drain canned tuna thoroughly before weighing. Drain the gherkins and dice finely, blotting excess liquid.",
      "Mix all the measured mayonnaise and yoghurt in a bowl until smooth. Fold in tuna, egg and gherkins gently; this version uses a small amount of regular mayo plus yoghurt.",
      "Lay the wrap flat, add the filling in a line through the centre and leave a border. Fold sides in and roll tightly.",
      "Serve now or refrigerate in a covered container and use within 24 hours. No additional oil or sauce is included."
    ]
  },
  "tailored-lemon-chicken": {
    "ings": [
      [
        "Chicken breast",
        300,
        "g"
      ],
      [
        "Broccoli",
        150,
        "g"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ],
      [
        "Cooking oil",
        2,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cut thawed chicken into thin, even strips and cut broccoli into similar-sized florets. Mix all the yoghurt and measured lemon juice in a clean bowl; refrigerate while cooking.",
      "Heat all the measured oil in a non-stick pan over medium-high heat. Cook the chicken in a single layer for about 8–10 minutes, turning; use batches rather than crowding the pan.",
      "If the small amount of oil is not enough to prevent sticking, reduce the heat and add water a spoonful at a time rather than more oil. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Steam or boil broccoli for 4–6 minutes until tender with a little bite, then drain.",
      "Serve chicken and broccoli with the cold lemon-yoghurt sauce. Keep sauce separate from raw chicken and do not boil it in the pan.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "tailored-paprika-chicken": {
    "ings": [
      [
        "Chicken breast",
        300,
        "g"
      ],
      [
        "Frozen mixed peppers",
        150,
        "g"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Paprika",
        2,
        "g"
      ],
      [
        "Cooking oil",
        2,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cut thawed chicken into thin, even strips. Toss with all the measured paprika and oil so the chicken is evenly coated. Keep the yoghurt chilled as a cold sauce.",
      "Heat a non-stick pan over medium heat. Cook chicken in one layer for 8–10 minutes, turning; reduce the heat if the paprika begins to darken before the meat is ready.",
      "Add frozen peppers and a splash of water. Cook for 5–7 minutes, stirring, until the peppers are tender and hot throughout. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Let excess water evaporate so the paprika coating clings to the chicken. Serve with all the measured yoghurt on the side.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "tailored-medallion-steak": {
    "ings": [
      [
        "Beef medallion steak",
        200,
        "g"
      ],
      [
        "Broccoli",
        150,
        "g"
      ],
      [
        "Potato",
        80,
        "g"
      ],
      [
        "Skyr",
        50,
        "g"
      ],
      [
        "Cooking oil",
        2,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Check the raw lean medallion steak pack: other steak cuts have different nutrition. Follow any pack-specific cooking instructions, especially if the meat is tenderised or reformed.",
      "Cut potato into even small cubes, cover with water and simmer for 10–15 minutes until fork-tender. Cut broccoli into florets and steam or boil for 4–6 minutes.",
      "Pat steak dry and coat with all the measured oil. Heat a non-stick pan over medium-high heat and sear every surface, turning with clean tongs.",
      "Continue cooking according to the steak’s thickness and pack instructions. For a fully cooked result, check the centre reaches 75°C for 30 seconds rather than relying on colour alone.",
      "Rest on a clean plate for 3–5 minutes, then slice and serve with drained potato, broccoli and all the skyr.",
      "If buying for the end of a two-week plan, freeze raw steak before its use-by date and defrost in the fridge according to the pack instructions."
    ]
  },
  "tailored-lean-tuna-box": {
    "ings": [
      [
        "Tuna",
        200,
        "g"
      ],
      [
        "Skyr",
        50,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ],
      [
        "Sweetcorn",
        30,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook frozen mixed vegetables following their packet instructions until piping hot, then drain and cool promptly in a shallow container.",
      "Drain canned tuna and sweetcorn thoroughly before weighing. Flake tuna into a clean bowl and mix with all the measured skyr until coated.",
      "Fold in the cooled vegetables and sweetcorn. Do not mix hot vegetables into the cold dairy filling if preparing a packed lunch.",
      "Spoon into a clean lidded lunch box, keeping the filling chilled.",
      "Keep covered in the fridge at 5°C or below and eat within 24 hours. No oil, mayonnaise or extra toppings are included."
    ]
  },
  "tailored-lean-tuna-wrap": {
    "ings": [
      [
        "Tuna",
        200,
        "g"
      ],
      [
        "Skyr",
        50,
        "g"
      ],
      [
        "Wholemeal wrap",
        40,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ],
      [
        "Sweetcorn",
        30,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook frozen mixed vegetables following their packet instructions until piping hot, then drain and cool promptly in a shallow container.",
      "Drain canned tuna and sweetcorn thoroughly before weighing. Flake tuna into a clean bowl and mix with all the measured skyr until coated.",
      "Fold in the cooled vegetables and sweetcorn. Do not mix hot vegetables into the cold dairy filling if preparing a packed lunch.",
      "Use the listed amount of wholemeal wrap; if cutting a larger tortilla, weigh the portion. Spoon filling through the centre, fold the sides in and roll tightly.",
      "Keep covered in the fridge at 5°C or below and eat within 24 hours. No oil, mayonnaise or extra toppings are included."
    ]
  },
  "tailored-budget-tomato-chicken": {
    "ings": [
      [
        "Chicken breast",
        250,
        "g"
      ],
      [
        "Rice",
        25,
        "g"
      ],
      [
        "Broccoli",
        100,
        "g"
      ],
      [
        "Passata",
        100,
        "g"
      ],
      [
        "Cooking oil",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Cut thawed chicken into thin, even strips and broccoli into small florets. Steam or boil broccoli for 4–6 minutes until just tender, then drain.",
      "Heat all the measured oil in a non-stick pan over medium heat. Cook chicken in batches for about 8–10 minutes, turning; add water a spoonful at a time if it sticks rather than more oil.",
      "Add passata and simmer gently for 5–7 minutes until the sauce thickens and coats the chicken. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Divide chicken, rice and broccoli into the stated servings. No extra sauce or finishing oil is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "tailored-budget-paprika-chicken": {
    "ings": [
      [
        "Chicken breast",
        250,
        "g"
      ],
      [
        "Rice",
        25,
        "g"
      ],
      [
        "Broccoli",
        100,
        "g"
      ],
      [
        "Passata",
        100,
        "g"
      ],
      [
        "Paprika",
        2,
        "g"
      ],
      [
        "Cooking oil",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Cut thawed chicken into thin, even strips and broccoli into small florets. Steam or boil broccoli for 4–6 minutes until just tender, then drain.",
      "Heat all the measured oil in a non-stick pan over medium heat. Cook chicken in batches for about 8–10 minutes, turning; add water a spoonful at a time if it sticks rather than more oil.",
      "Add all the paprika and stir for 20–30 seconds over medium-low heat, coating the chicken without letting the spice burn.",
      "Add passata and simmer gently for 5–7 minutes until the sauce thickens and coats the chicken. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Divide chicken, rice and broccoli into the stated servings. No extra sauce or finishing oil is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "lighter-tuna-egg-wrap": {
    "ings": [
      [
        "Wholemeal wrap",
        60,
        "g"
      ],
      [
        "Tuna",
        90,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Lighter than light mayonnaise",
        15,
        "g"
      ],
      [
        "Lettuce",
        30,
        "g"
      ],
      [
        "Cucumber",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cover the egg with water, bring to the boil and simmer for 9–10 minutes until fully set. Cool under cold water, peel and chop.",
      "Drain canned tuna thoroughly before weighing. Wash and dry lettuce and dice cucumber, draining any excess liquid.",
      "Gently mix tuna, egg and all the measured lighter-than-light mayonnaise. Spread the filling down the centre of the wrap and add lettuce and cucumber.",
      "Fold the sides in and roll tightly. Serve immediately or keep covered and chilled and eat within 24 hours. No cooking oil is needed."
    ]
  },
  "lighter-chicken-yoghurt-wrap": {
    "ings": [
      [
        "Wholemeal wrap",
        50,
        "g"
      ],
      [
        "Chicken breast",
        120,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ],
      [
        "Lettuce",
        40,
        "g"
      ],
      [
        "Tomato",
        70,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and dry lettuce and chop tomato. Cut thawed chicken into thin, even strips using a separate board; wash hands and utensils before handling the salad.",
      "Heat all the measured oil in a non-stick pan over medium-high heat. Fry chicken for 8–10 minutes, turning to colour both sides. Add a splash of water if it sticks rather than extra oil. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "For serving hot, let chicken stop steaming heavily before assembling. For a packed lunch, cool it promptly first and keep chilled.",
      "Spread all the yoghurt over the wrap, add lettuce, tomato and chicken, fold the sides in and roll firmly.",
      "Eat immediately or refrigerate in a covered container and use within 24 hours. No extra dressing is included."
    ]
  },
  "lighter-tuna-egg-salad": {
    "ings": [
      [
        "Tuna",
        100,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Lighter than light mayonnaise",
        15,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Wholemeal bread",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil the egg for 9–10 minutes once the water is simmering, until the white and yolk are fully set. Cool under cold water, peel and cut into wedges.",
      "Drain canned tuna before weighing and flake it into a bowl. Wash cucumber and tomato, dice them and drain any pooled juice.",
      "Fold all the measured lighter-than-light mayonnaise through the tuna, then add the vegetables. Keep some egg wedges on top so they do not break apart.",
      "Serve with the weighed bread. Keep covered and chilled if preparing ahead and eat within 24 hours; no additional oil is needed."
    ]
  },
  "lighter-cottage-potato": {
    "ings": [
      [
        "Potato",
        200,
        "g"
      ],
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash the potato and prick the skin several times. Microwave following your appliance instructions, turning halfway, until a knife slides easily into the centre. Large potatoes need longer than small ones.",
      "Let stand for 2 minutes, then split carefully because steam escapes. Spoon in all the measured cottage cheese.",
      "Wash and chop cucumber and tomato. Serve alongside the potato for crunch rather than stirring their juice into the topping.",
      "Serve straight away; no butter or oil is included. Refrigerate any unused cottage cheese according to its pack."
    ]
  },
  "lighter-chicken-broccoli": {
    "ings": [
      [
        "Chicken breast",
        160,
        "g"
      ],
      [
        "Potato",
        160,
        "g"
      ],
      [
        "Broccoli",
        150,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cut potato into even small cubes and broccoli into similar-sized florets. Simmer potato for 10–15 minutes until fork-tender and steam or boil broccoli for 4–6 minutes.",
      "Cut thawed chicken into thin, even strips and pat dry. Heat all the measured oil in a non-stick pan over medium-high heat.",
      "Cook chicken for about 8–10 minutes, turning until lightly browned. Add a splash of water and lower the heat if needed to stop it sticking. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Turn off the heat and add all the measured lemon juice, stirring to lift the browned juices from the pan. Serve chicken and those juices with the drained vegetables.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "lighter-cod-peas": {
    "ings": [
      [
        "Cod fillet",
        180,
        "g"
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Frozen peas",
        100,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C conventional / 180°C fan. Cut potato into even small pieces and boil for 10–15 minutes until fork-tender.",
      "Check cod for bones and pat dry. Brush with all the measured oil, put in a small ovenproof dish and bake for about 12–18 minutes, depending on thickness and the pack instructions.",
      "Cook frozen peas following their packet instructions until piping hot and drain. Check the cod is opaque at the centre and flakes easily; return to the oven if it is still translucent.",
      "Finish the cooked fish with all the measured lemon juice and serve with potato and peas. No additional butter is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "lighter-turkey-courgette": {
    "ings": [
      [
        "Turkey mince",
        130,
        "g"
      ],
      [
        "Pasta",
        45,
        "g"
      ],
      [
        "Courgette",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in a saucepan of boiling water for the packet time, until just tender. Save a little cooking water before draining.",
      "Grate courgette and measure the chopped tomatoes. Heat a non-stick pan over medium-high heat.",
      "Add turkey mince without extra oil, break it into small pieces and cook for 6–8 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Add grated courgette and cook for 3–4 minutes until softened and some of its water has evaporated. Add chopped tomatoes and simmer for 10 minutes, stirring occasionally.",
      "Toss with drained pasta, adding a little reserved pasta water only if needed to loosen the sauce. Heat through and serve.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "lighter-tofu-vegetables": {
    "ings": [
      [
        "Firm tofu",
        140,
        "g"
      ],
      [
        "Rice",
        35,
        "g"
      ],
      [
        "Broccoli",
        150,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Drain and pat tofu dry, then cut into 2 cm cubes. Cut broccoli into small florets and thinly slice carrot.",
      "Steam or boil broccoli and carrot for 4–7 minutes until just tender. Drain well so the sauce does not become watery.",
      "Heat tofu in a non-stick pan over medium heat with a splash of water for 4–5 minutes, stirring, until hot throughout.",
      "Add vegetables and all the measured soy sauce. Toss over low heat for 1 minute, then serve over rice. No additional oil is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "lighter-egg-spinach-toast": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Wholemeal bread",
        40,
        "g"
      ],
      [
        "Spinach",
        80,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash spinach and dice tomato. Beat the eggs in a bowl and toast the bread near the end of cooking.",
      "Heat all the measured oil in a non-stick pan over medium heat. Cook tomato for 2–3 minutes, then add spinach and stir until wilted and excess liquid has evaporated.",
      "Lower the heat to low-medium and add the beaten eggs. Stir gently for 2–4 minutes, drawing cooked edges into the centre, until fully set with no liquid egg.",
      "Serve immediately on the toast. Do not add extra butter or oil."
    ]
  },
  "frozen-teriyaki-rice": {
    "ings": [
      [
        "Frozen chicken breast",
        250,
        "g"
      ],
      [
        "Rice",
        55,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        180,
        "g"
      ],
      [
        "Teriyaki sauce",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Keep unused fillets frozen and weigh the required plain, unbreaded frozen chicken breast. Put it in a separate ovenproof dish and follow its own pack temperature and full cooking time; many packs need around 40–45 minutes. The hands-on time is not the total oven time. Check the centre reaches 75°C for 30 seconds before slicing.",
      "Near the end of the chicken’s oven time, cook the weighed dry rice and frozen mixed vegetables following their own packet instructions.",
      "Put all the measured teriyaki sauce in a small saucepan with a splash of water. Heat over low-medium heat for 1–2 minutes until bubbling and glossy; reduce the heat if the sugars begin to catch.",
      "Before slicing, check the thickest part of the chicken reaches 75°C for 30 seconds, or the equivalent safe time and temperature stated on the pack. Use clean utensils and never shorten the pack time because the outside looks cooked.",
      "Slice the fully cooked chicken, turn it through the hot teriyaki glaze and serve with the rice and drained vegetables.",
      "Serve immediately and follow the chicken pack’s storage and any do-not-reheat instruction. No extra oil or toppings are included."
    ]
  },
  "frozen-curry-rice": {
    "ings": [
      [
        "Frozen chicken breast",
        250,
        "g"
      ],
      [
        "Rice",
        45,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Curry powder",
        2,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Keep unused fillets frozen and weigh the required plain, unbreaded frozen chicken breast. Put it in a separate ovenproof dish and follow its own pack temperature and full cooking time; many packs need around 40–45 minutes. The hands-on time is not the total oven time. Check the centre reaches 75°C for 30 seconds before slicing.",
      "Near the end of the oven time, cook the weighed dry rice following its packet instructions.",
      "Put all the measured curry powder into a non-stick saucepan with a splash of water. Stir over low-medium heat for 30 seconds until fragrant without letting it dry out or burn.",
      "Add chopped tomatoes and frozen mixed vegetables. Bring to a gentle simmer and cook for 8–12 minutes, following the vegetables’ packet time, until hot throughout and the sauce has thickened.",
      "Before slicing, check the thickest part of the chicken reaches 75°C for 30 seconds, or the equivalent safe time and temperature stated on the pack. Use clean utensils and never shorten the pack time because the outside looks cooked.",
      "Slice the fully cooked chicken and stir into the hot curry sauce. Warm through briefly and serve over rice; do not try to cook the frozen chicken in this short sauce stage.",
      "Serve immediately and follow the chicken pack’s storage and any do-not-reheat instruction. No extra oil or toppings are included."
    ]
  },
  "frozen-tomato-pasta": {
    "ings": [
      [
        "Frozen chicken breast",
        250,
        "g"
      ],
      [
        "Pasta",
        60,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Keep unused fillets frozen and weigh the required plain, unbreaded frozen chicken breast. Put it in a separate ovenproof dish and follow its own pack temperature and full cooking time; many packs need around 40–45 minutes. The hands-on time is not the total oven time. Check the centre reaches 75°C for 30 seconds before slicing.",
      "Near the end of the oven time, cook the weighed dry pasta following its packet instructions. Save a little cooking water, then drain.",
      "Simmer chopped tomatoes and frozen mixed vegetables in a separate saucepan for 8–12 minutes, following the vegetables’ packet time, until piping hot and the sauce is slightly reduced. Add water if it sticks; no additional oil is included.",
      "Before slicing, check the thickest part of the chicken reaches 75°C for 30 seconds, or the equivalent safe time and temperature stated on the pack. Use clean utensils and never shorten the pack time because the outside looks cooked.",
      "Slice the fully cooked chicken and toss with hot pasta and tomato sauce. Add a little reserved pasta water if needed to coat the pasta evenly.",
      "Serve immediately and follow the chicken pack’s storage and any do-not-reheat instruction. No extra oil or toppings are included."
    ]
  },
  "frozen-bbq-potato": {
    "ings": [
      [
        "Frozen chicken breast",
        250,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        180,
        "g"
      ],
      [
        "BBQ sauce",
        25,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Keep unused fillets frozen and weigh the required plain, unbreaded frozen chicken breast. Put it in a separate ovenproof dish and follow its own pack temperature and full cooking time; many packs need around 40–45 minutes. The hands-on time is not the total oven time. Check the centre reaches 75°C for 30 seconds before slicing.",
      "Cut potato into even small cubes and boil for 10–15 minutes until fork-tender. Cook frozen mixed vegetables following their own packet instructions and drain.",
      "Heat all the measured BBQ sauce in a separate small pan over low heat with a splash of water. Stir for 1–2 minutes until hot, reducing the heat if it begins to stick.",
      "Before slicing, check the thickest part of the chicken reaches 75°C for 30 seconds, or the equivalent safe time and temperature stated on the pack. Use clean utensils and never shorten the pack time because the outside looks cooked.",
      "Slice the fully cooked chicken, coat with the hot BBQ sauce and serve with drained potato and vegetables. The pack-directed chicken oven time still takes priority.",
      "Serve immediately and follow the chicken pack’s storage and any do-not-reheat instruction. No extra oil or toppings are included."
    ]
  },
  "frozen-peanut-noodles": {
    "ings": [
      [
        "Frozen chicken breast",
        250,
        "g"
      ],
      [
        "Noodles",
        50,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        180,
        "g"
      ],
      [
        "Peanut butter",
        10,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Keep unused fillets frozen and weigh the required plain, unbreaded frozen chicken breast. Put it in a separate ovenproof dish and follow its own pack temperature and full cooking time; many packs need around 40–45 minutes. The hands-on time is not the total oven time. Check the centre reaches 75°C for 30 seconds before slicing.",
      "Near the end of the oven time, cook the weighed dry noodles and frozen mixed vegetables following their own packet instructions, then drain.",
      "Mix all the measured peanut butter and soy sauce in a small pan. Add hot water a spoonful at a time until smooth, then warm gently over low heat for 1–2 minutes; do not boil it dry.",
      "Before slicing, check the thickest part of the chicken reaches 75°C for 30 seconds, or the equivalent safe time and temperature stated on the pack. Use clean utensils and never shorten the pack time because the outside looks cooked.",
      "Slice the fully cooked chicken and toss with the hot noodles, vegetables and peanut sauce. Loosen with water if needed rather than extra peanut butter or oil.",
      "Serve immediately and follow the chicken pack’s storage and any do-not-reheat instruction. No extra oil or toppings are included."
    ]
  },
  "social-honey-soy-chicken": {
    "ings": [
      [
        "Chicken breast",
        160,
        "g"
      ],
      [
        "Potato",
        200,
        "g"
      ],
      [
        "Broccoli",
        150,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ],
      [
        "Honey",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating and fill guidance. Cut potato into even 1 cm cubes, pat dry and toss with all the measured oil.",
      "Air fry potato at 190°C for about 15 minutes, shaking halfway. Keep food in a single layer and cook in batches if needed.",
      "Cut thawed chicken into even 2 cm pieces and broccoli into small florets. Add chicken and broccoli and cook for about 12–15 minutes more, turning halfway; extend as needed for your appliance and ingredient size.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces. Check potato is soft through the centre; if it needs longer, remove cooked chicken to a clean plate and finish the potato.",
      "Mix all the measured honey and soy sauce in a microwave-safe bowl. Heat in short bursts until bubbling, stirring carefully, then coat only the fully cooked chicken.",
      "Serve with the hot potato and broccoli. Keep the glaze away from raw meat; adding the sugary sauce at the end prevents it burning in the air fryer.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "social-paprika-chicken-wrap": {
    "ings": [
      [
        "Chicken breast",
        150,
        "g"
      ],
      [
        "Wholemeal wrap",
        62,
        "g"
      ],
      [
        "Lettuce",
        50,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "Paprika",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow the air fryer’s preheating instructions. Cut thawed chicken into evenly sized strips and toss with all the measured oil and paprika until coated.",
      "Arrange chicken in a single layer and air fry at 190°C for about 12–16 minutes, turning halfway. Use batches rather than overfilling the basket; reduce the heat if the paprika catches.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "While chicken cooks, wash and dry lettuce and slice tomato on a clean board. Keep all the yoghurt chilled as a dressing.",
      "Spread yoghurt over the wrap and add salad and cooked chicken down the centre. Fold the sides in and roll tightly. If packing to eat cold, cool chicken promptly before assembling and refrigerate.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "social-turkey-meatballs": {
    "ings": [
      [
        "Turkey mince",
        160,
        "g"
      ],
      [
        "Couscous",
        50,
        "g"
      ],
      [
        "Passata",
        160,
        "g"
      ],
      [
        "Garlic",
        3,
        "g"
      ],
      [
        "Dried mixed herbs",
        1,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating instructions. Grate the garlic and gently mix into turkey mince with all the dried mixed herbs; avoid overworking the meat.",
      "With clean hands, shape evenly sized small meatballs, about 3 cm across. Brush with all the measured oil and arrange in a single layer without crowding.",
      "Air fry at 190°C for about 12–16 minutes, turning carefully halfway. Check the centre of the largest meatballs reaches 75°C for 30 seconds; extend the time if needed.",
      "Prepare the weighed dry couscous with the water ratio and standing time on its packet, then fluff with a fork.",
      "Heat passata in a small saucepan until piping hot. Simmer for 3–5 minutes until slightly thickened, adding a splash of water if needed. Serve meatballs with couscous and tomato sauce.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "social-chicken-taco": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Black beans",
        400,
        "g"
      ],
      [
        "Chopped tomatoes",
        800,
        "g"
      ],
      [
        "Frozen mixed peppers",
        400,
        "g"
      ],
      [
        "Taco seasoning",
        12,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use thawed chicken and a slow cooker suited to the four-serving batch. Follow its minimum fill and liquid guidance; never put frozen meat in the slow cooker.",
      "Drain and rinse black beans before weighing. Put tomatoes, frozen peppers and all the taco seasoning in the cooker and stir so the spice is evenly distributed through the sauce.",
      "Add chicken and beans, turning chicken through the sauce. Cover and cook on HIGH for about four hours, keeping the lid closed as much as possible; your cooker’s guidance takes priority.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds and the beans and vegetables are piping hot. Extend cooking if needed rather than relying on the clock alone.",
      "Remove chicken to a clean plate, shred with two clean forks and return to the sauce. If very watery, reduce the sauce in a saucepan on the hob before combining; do not leave undercooked chicken aside.",
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Divide the chicken filling and rice into the stated servings (four per recipe batch). The preparation time excludes the several hours in the slow cooker.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "social-chicken-curry": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Chickpeas",
        400,
        "g"
      ],
      [
        "Chopped tomatoes",
        600,
        "g"
      ],
      [
        "Light coconut milk",
        300,
        "ml"
      ],
      [
        "Curry paste",
        60,
        "g"
      ],
      [
        "Spinach",
        200,
        "g"
      ],
      [
        "Rice",
        220,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use thawed chicken and a slow cooker suited to this four-serving batch. Follow its minimum fill and liquid guidance; never use frozen meat.",
      "Drain and rinse chickpeas before weighing. Stir all the measured curry paste into the chopped tomatoes and coconut milk in the cooker until no clumps of paste remain.",
      "Add chicken and chickpeas and turn to coat. Cover and cook on HIGH for about four hours, extending as required by your cooker and the size of the chicken pieces.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds. Stir in spinach, cover again and continue until it is wilted and piping hot.",
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Divide curry and rice into the stated servings (four per recipe batch). If the sauce needs thickening, reduce it in a saucepan on the hob after the chicken is fully cooked rather than adding unlisted thickeners.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "social-turkey-chilli": {
    "ings": [
      [
        "Turkey mince",
        600,
        "g"
      ],
      [
        "Kidney beans",
        500,
        "g"
      ],
      [
        "Chopped tomatoes",
        800,
        "g"
      ],
      [
        "Onion",
        160,
        "g"
      ],
      [
        "Frozen mixed peppers",
        400,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Ground cumin",
        4,
        "g"
      ],
      [
        "Cooking oil",
        12,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use a slow cooker suited to this four-serving batch and follow its fill guidance. Drain and rinse canned kidney beans before weighing; this method does not use dried kidney beans.",
      "Dice onion. Heat all the measured oil in a non-stick pan over medium-high heat. Brown turkey and onion for 7–10 minutes, breaking up the mince. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Lower the pan to medium heat, add all the paprika and cumin and stir for 30 seconds until fragrant without burning the spices.",
      "Transfer to the slow cooker with kidney beans, chopped tomatoes and frozen peppers. Stir thoroughly, cover and cook on HIGH for about four hours, following your appliance’s guidance.",
      "Check the chilli is piping hot throughout and the vegetables are tender. If watery, reduce in a saucepan on the hob, stirring, until the sauce coats the filling.",
      "Divide into the stated servings (four per recipe batch). The hands-on preparation time excludes the slow cooker time.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "regional-ostropel": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Passata",
        400,
        "g"
      ],
      [
        "Garlic",
        12,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Polenta",
        90,
        "g"
      ],
      [
        "Water",
        450,
        "ml"
      ],
      [
        "Green beans",
        250,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Dice onion finely, grate garlic and cut thawed chicken into even 2 cm pieces. Measure passata and keep the polenta water ready.",
      "Heat all the measured oil in a non-stick saucepan over medium heat. Soften onion for 5–7 minutes until translucent with lightly golden edges.",
      "Add chicken and turn for 3–4 minutes to lightly colour it. Stir in garlic for 30 seconds, then add passata before the garlic darkens.",
      "Simmer gently for 15–20 minutes, partly covered, stirring and adding a splash of water if the sauce gets too thick. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Meanwhile, whisk the weighed dry polenta into the measured water and cook following its packet instructions, stirring until thick and smooth. Steam or boil green beans until tender.",
      "Divide the polenta, garlic-tomato chicken and green beans between the stated servings. Use the pan sauce as the dressing; no extra oil is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "regional-ciorba-chicken": {
    "ings": [
      [
        "Chicken breast",
        350,
        "g"
      ],
      [
        "Carrot",
        180,
        "g"
      ],
      [
        "Celery",
        100,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Potato",
        200,
        "g"
      ],
      [
        "Water",
        700,
        "ml"
      ],
      [
        "Lemon juice",
        30,
        "ml"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Wash the vegetables. Dice onion, carrot, celery and potato small and evenly so they cook together. Cut thawed chicken into even bite-sized pieces using a separate board.",
      "Put the measured water, onion, carrot, celery, potato and all the dried mixed herbs in a saucepan. Bring to a gentle simmer and cook for about 10 minutes.",
      "Add chicken and return to a gentle simmer. Cook for about 12–15 minutes more, until the potato is tender and the chicken reaches 75°C for 30 seconds; extend if needed.",
      "Turn off the heat and stir in all the measured lemon juice for the soup’s sour finish.",
      "Put the yoghurt in a small bowl and gradually whisk in a few spoonfuls of warm broth. Stir this back into the soup off the heat to reduce curdling; do not boil after adding it.",
      "Divide into the stated servings and serve hot.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "regional-bigos-pork": {
    "ings": [
      [
        "Lean pork",
        380,
        "g"
      ],
      [
        "Sauerkraut",
        250,
        "g"
      ],
      [
        "White cabbage",
        350,
        "g"
      ],
      [
        "Mushrooms",
        200,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Passata",
        200,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Wholemeal bread",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Use cultivated mushrooms and drain the sauerkraut before weighing. Slice onion, mushrooms and fresh white cabbage thinly; cut thawed lean pork into even small pieces.",
      "Heat all the measured oil in a heavy saucepan over medium-high heat. Brown pork for 4–6 minutes, turning, then lower to medium heat and add onion and mushrooms.",
      "Cook for 5–7 minutes, stirring, until the onion softens and the mushrooms release their moisture. Add white cabbage, sauerkraut and passata.",
      "Add just enough plain water to loosen the pot. Bring to a gentle simmer, cover and cook for about 45–60 minutes, stirring occasionally and adding water if needed.",
      "Check pork and cabbage are tender and the centre of the meat reaches 75°C for 30 seconds. Uncover briefly to evaporate excess liquid if the stew is watery.",
      "Divide into the stated servings and serve with the weighed wholemeal bread. The sauerkraut supplies tang; this lean-pork adaptation has no added sausage or bacon.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "regional-ciorba-meatballs": {
    "ings": [
      [
        "Turkey mince",
        350,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Carrot",
        180,
        "g"
      ],
      [
        "Celery",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        300,
        "g"
      ],
      [
        "Water",
        700,
        "ml"
      ],
      [
        "Lemon juice",
        25,
        "ml"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Rinse and weigh the rice dry. Dice carrot and celery finely. Mix turkey mince, all the rice and half the measured dried mixed herbs, then shape small, even meatballs with clean hands.",
      "Bring the measured water, chopped tomatoes, carrot, celery and remaining herbs to a gentle simmer in a saucepan. Cook for 5 minutes to start softening the vegetables.",
      "Lower meatballs carefully into the simmering broth. Cover partly and simmer gently for about 20–25 minutes; vigorous boiling can break them apart.",
      "Check the rice inside a cut meatball is tender and the centre of the largest meatball reaches 75°C for 30 seconds. Continue simmering if either check is not met.",
      "Remove from the heat and add all the measured lemon juice for the sour finish. Divide soup and meatballs evenly into the stated servings.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "fajita": {
    "ings": [
      [
        "Chicken breast",
        200,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ],
      [
        "Fajita seasoning",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Slice thawed chicken into even strips and toss with all the measured fajita seasoning. Keep yoghurt chilled as a cold topping.",
      "Heat all the measured oil in a wide non-stick pan over medium-high heat. Cook chicken in one layer for 7–10 minutes, turning, until lightly browned. Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "Transfer chicken to a clean plate. Add frozen mixed peppers and a splash of water to the same pan. Cook for 5–7 minutes until tender and piping hot, lifting the browned seasoning from the pan.",
      "Return chicken, toss until hot and divide over rice. Serve with all the weighed yoghurt; no additional seasoning mix or oil is needed.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "chickencurry": {
    "ings": [
      [
        "Chicken breast",
        200,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ],
      [
        "Curry powder",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Cut thawed chicken into even 2 cm pieces. Measure the curry powder and keep the yoghurt chilled until the final stage.",
      "Heat all the measured oil in a non-stick pan over medium heat. Add all the curry powder and stir for 20–30 seconds until fragrant; add a splash of water if needed to stop it burning.",
      "Add chicken and turn in the spiced oil for 3–4 minutes. Add chopped tomatoes and frozen mixed vegetables and bring to a gentle simmer.",
      "Simmer for 12–15 minutes, stirring, until the vegetables are tender and the chicken reaches 75°C for 30 seconds. Add water if the sauce thickens before the chicken is done.",
      "Remove from the heat. Mix the yoghurt with a few spoonfuls of warm sauce, then stir it back into the curry to reduce curdling. Serve with rice and do not boil after adding yoghurt.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "tuna": {
    "ings": [
      [
        "Tuna",
        145,
        "g"
      ],
      [
        "Pasta",
        60,
        "g"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Sweetcorn",
        80,
        "g"
      ],
      [
        "Mixed salad",
        100,
        "g"
      ],
      [
        "Eggs",
        1,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in a saucepan of boiling water for the packet time, until just tender. Save a little cooking water before draining.",
      "Boil the egg for 9–10 minutes once the water is simmering until fully set. Cool under cold water, peel and chop.",
      "Drain canned tuna and sweetcorn before weighing. Wash and dry mixed salad. Cool drained pasta promptly with cold running water if making a cold salad, then drain thoroughly.",
      "Fold all the measured yoghurt through the tuna and sweetcorn. Add cooled pasta and chopped egg and mix gently until coated.",
      "Fold in the salad just before eating so the leaves keep their texture. Keep covered and chilled and eat within 24 hours; no extra dressing is included."
    ]
  },
  "chickenwrap": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        ""
      ],
      [
        "Mixed salad",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and dry mixed salad. Cut thawed chicken into thin, even strips on a separate board; clean hands and utensils before handling the salad.",
      "Heat a non-stick pan over medium heat with a splash of water. Add chicken and cook for about 8–10 minutes, turning, adding water in small amounts to prevent sticking; no oil is listed for this recipe.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces.",
      "For eating now, let the chicken stop steaming heavily before filling. For a packed lunch, cool promptly first.",
      "Spread all the measured yoghurt over the wrap and add chicken and salad through the centre. Fold sides in and roll tightly.",
      "Serve now or refrigerate covered and eat within 24 hours. No additional oil, sauce or seasoning blend is included."
    ]
  },
  "beefpasta": {
    "ings": [
      [
        "5% beef mince",
        150,
        "g"
      ],
      [
        "Pasta",
        70,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in a saucepan of boiling water for the packet time, until just tender. Save a little cooking water before draining.",
      "Heat a non-stick pan over medium-high heat. Add beef mince without extra oil, break it into small pieces and cook for 7–10 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Add chopped tomatoes and frozen mixed vegetables. Bring to a gentle simmer and cook for 10–12 minutes, stirring, until the vegetables are tender and the sauce is thicker.",
      "Add water in small amounts if the sauce sticks before the vegetables are ready. Fold in drained pasta and loosen with a little reserved pasta water if needed.",
      "Heat through and divide into the stated servings. No extra oil or cheese is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "chillipotato": {
    "ings": [
      [
        "5% beef mince",
        180,
        "g"
      ],
      [
        "Potato",
        200,
        "g"
      ],
      [
        "Kidney beans",
        120,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and prick the potato several times. Microwave following your appliance instructions, turning halfway, until a knife slides easily into the centre; start with 7–12 minutes for a medium potato and extend if needed.",
      "Drain and rinse canned kidney beans before weighing. Heat all the measured oil in a non-stick pan over medium-high heat.",
      "Add beef mince and break it into small pieces. Cook for 7–10 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Add kidney beans, chopped tomatoes and frozen mixed vegetables. Simmer gently for 12–15 minutes, stirring, until vegetables are tender and the filling is thick.",
      "Split the potato and spoon over the beef-and-bean filling. Add all the measured yoghurt off the heat as a topping; no additional chilli blend or sauce is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "beefrice": {
    "ings": [
      [
        "5% beef mince",
        180,
        "g"
      ],
      [
        "Rice",
        55,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Chopped tomatoes",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh the rice dry and cook it using the water ratio and time on its packet. Keep it covered while the rest of the meal finishes; the listed weight is not cooked rice.",
      "Heat a wide non-stick pan over medium-high heat. Add beef mince without extra oil and break it into small pieces. Cook for 7–10 minutes until browned. Break up any remaining clumps and check the mince reaches 75°C for 30 seconds throughout.",
      "Add frozen mixed peppers and chopped tomatoes, then lower to medium-low heat. Simmer for 8–10 minutes until the peppers are tender and the sauce coats the beef.",
      "Use a splash of water if it sticks rather than adding oil. Divide the filling over rice and serve with all the measured yoghurt as a cold topping.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "overnightoats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Frozen berries",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook as directed and cool promptly before mixing with dairy.",
      "In a clean lidded container, mix the weighed oats, all the yoghurt and measured milk until no dry oat pockets remain. Fold in the prepared berries.",
      "Cover and refrigerate straight away at 5°C or below for 6–12 hours until the oats soften. This soaking time is in addition to hands-on preparation.",
      "Stir before eating and loosen with a little water if too thick. Keep chilled and eat within 48 hours, or sooner if a dairy pack instructs. No extra sweetener is included."
    ]
  },
  "chickentray": {
    "ings": [
      [
        "Chicken breast",
        200,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        200,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C conventional / 180°C fan. Cut potato into even 2 cm pieces, pat dry and toss with half the measured oil. Spread on a baking tray and roast for 15 minutes.",
      "Cut thawed chicken into evenly sized thick strips and coat with the remaining oil. Add to the tray with frozen mixed vegetables, spreading everything out rather than piling it up.",
      "Roast for another 20–25 minutes, turning the potato and chicken halfway through. Use a second tray if necessary to avoid crowding.",
      "Check the thickest chicken pieces reach 75°C for 30 seconds. Use clean utensils and a clean plate for cooked meat; keep raw chicken away from salad and cold sauces. Check potato is fork-tender and vegetables piping hot; continue cooking any component that is not ready.",
      "Serve with the juices from the tray. No additional sauce, oil or seasoning blend is included.",
      "For meal prep, divide into the stated servings and cool promptly. Refrigerate within two hours and eat within 48 hours or freeze. Cool cooked rice within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot. Keep cold salad and sauces separate."
    ]
  },
  "breakfast": {
    "ings": [
      [
        "0% Greek yoghurt",
        400,
        "g"
      ],
      [
        "Oats",
        30,
        "g"
      ],
      [
        "Frozen berries",
        100,
        "g"
      ],
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Cinnamon",
        1,
        " tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Put the eggs in a small saucepan, cover with water and bring to a boil.",
      "Simmer for 8–10 minutes, then cool under cold water and peel.",
      "Stir the Greek yoghurt, oats and cinnamon together in a bowl until combined.",
      "Add the prepared berries, then serve the yoghurt bowl with the boiled eggs on the side.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "eggs": {
    "ings": [
      [
        "Eggs",
        3,
        ""
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Toast the wholemeal bread. Slice the tomato while the bread toasts.",
      "Beat the eggs in a bowl. Cook in a non-stick pan over low–medium heat, stirring gently until softly scrambled and fully set.",
      "Serve the eggs with the toast, sliced tomato and Greek yoghurt on the side.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "snack": {
    "ings": [
      [
        "Cottage cheese",
        200,
        "g"
      ],
      [
        "Banana",
        1,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Peel the banana and slice it into a bowl.",
      "Add the cottage cheese and serve immediately.",
      "For a colder snack, chill the cottage cheese first.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "proteinpud": {
    "ings": [
      [
        "0% Greek yoghurt",
        250,
        "g"
      ],
      [
        "Frozen berries",
        100,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Spoon the Greek yoghurt into a bowl.",
      "Mix in the cocoa powder until evenly combined.",
      "Top with the frozen berries. Use berries prepared according to their packet.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "eggwrap": {
    "ings": [
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        ""
      ],
      [
        "Tomato",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Beat the eggs and stir in the cottage cheese.",
      "Pour into a non-stick frying pan over medium-low heat and gently scramble until the eggs are fully set.",
      "Add the chopped tomato for the final minute to warm it through.",
      "Warm the wrap briefly, fill with the egg mixture and roll tightly. Leave a clear border, fold the sides in and roll firmly from the bottom so the filling stays enclosed.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "appleyog": {
    "ings": [
      [
        "0% Greek yoghurt",
        250,
        "g"
      ],
      [
        "Apple",
        1,
        ""
      ],
      [
        "Oats",
        20,
        "g"
      ],
      [
        "Cinnamon",
        1,
        " tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Core and dice the apple into small pieces.",
      "Stir the Greek yoghurt, oats and cinnamon together in a bowl.",
      "Fold in the apple and leave for 5 minutes so the oats begin to soften, or refrigerate overnight for a softer texture.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "tunasweet": {
    "ings": [
      [
        "Tuna",
        120,
        "g"
      ],
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Sweetcorn",
        60,
        "g"
      ],
      [
        "0% Greek yoghurt",
        60,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato with a fork and microwave until soft, turning halfway, or bake at 200°C until tender.",
      "Drain the tuna and sweetcorn, then mix with the Greek yoghurt.",
      "Split the hot potato and pile the tuna mixture on top.",
      "Heat the sweetcorn with the tuna mixture briefly if you prefer it warm.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "tofurice": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Rice",
        55,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        200,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Pat the tofu dry and cut into cubes.",
      "Use a hot non-stick pan to brown the cubes on several sides.",
      "Add the frozen vegetables and cook until piping hot and tender, about 5–7 minutes.",
      "Stir through the soy sauce and serve over the rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "turkeychilli": {
    "ings": [
      [
        "Turkey mince",
        180,
        "g"
      ],
      [
        "Kidney beans",
        100,
        "g"
      ],
      [
        "Rice",
        45,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain kidney beans before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Add the turkey mince to a non-stick pan and cook, breaking it apart, until no pink remains.",
      "Add the kidney beans, chopped tomatoes and frozen vegetables.",
      "Simmer for 12–15 minutes until thick and the turkey is cooked through (75°C).",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve the turkey chilli over the rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "porknoodles": {
    "ings": [
      [
        "Lean pork",
        170,
        "g"
      ],
      [
        "Noodles",
        65,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        200,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry noodles following their packet time, then drain. Loosen with a splash of water if they stick; do not add unlisted oil.",
      "Slice the pork thinly. Cook in a hot non-stick frying pan, stirring, until browned and cooked through.",
      "Add the frozen vegetables and stir-fry for 5–7 minutes until hot and tender.",
      "Add the noodles and soy sauce, toss together for 1–2 minutes and serve.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "lentilcurry": {
    "ings": [
      [
        "Lentils",
        150,
        "g"
      ],
      [
        "Chickpeas",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Rice",
        45,
        "g"
      ],
      [
        "Curry powder",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain chickpeas, lentils before weighing the listed amounts. Rinse canned beans and chickpeas. Lentils listed without “red” use a ready-cooked/drained weight, not dry lentils.",
      "Rinse the rice and cook according to the packet instructions.",
      "Put the drained ready-cooked lentils, chickpeas, chopped tomatoes and curry powder in a saucepan with enough water to cover the lentils well; bring to a simmer.",
      "Simmer the ready-cooked lentils, drained chickpeas, tomatoes and measured curry powder for 10–12 minutes until piping hot. Add only enough water to keep it loose; dry lentils need a different quantity and are not interchangeable here.",
      "Serve the curry over rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "edamamesnack": {
    "ings": [
      [
        "Edamame beans",
        100,
        "g"
      ],
      [
        "Apple",
        1,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the edamame according to the packet instructions (usually boil or microwave until piping hot).",
      "Drain well and allow to cool until comfortable to eat.",
      "Serve with the fruit. No additional salt is included."
    ]
  },
  "cottagecrackers": {
    "ings": [
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Wholegrain crackers",
        25,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Spoon the cottage cheese into a bowl.",
      "Slice the cucumber into sticks or rounds.",
      "Serve the cottage cheese with the cucumber and wholegrain crackers.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "extra1": {
    "ings": [
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Oats",
        45,
        "g"
      ],
      [
        "Peanut butter",
        10,
        "g"
      ],
      [
        "Banana",
        0.5,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix the Greek yoghurt, oats and peanut butter in a bowl or lidded jar until evenly combined.",
      "Slice the banana and stir half through, reserving the rest for the top if preferred.",
      "Eat straight away for a chewy texture, or cover and refrigerate overnight to soften the oats.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "extra2": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "Milk",
        150,
        "ml"
      ],
      [
        "Banana",
        1,
        ""
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Whey protein powder",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the oats, milk and cocoa powder in a saucepan and simmer gently for 4–6 minutes, stirring, until the oats are soft.",
      "Add a splash of water if needed. Remove from the heat and leave for 1–2 minutes so it is not boiling hot.",
      "Stir in the protein powder until smooth.",
      "Slice the banana over the top and serve.",
      "Avoid boiling the protein powder directly, as it can become lumpy."
    ]
  },
  "extra3": {
    "ings": [
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Smoked salmon",
        60,
        "g"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ]
    ],
    "servings": 1,
    "steps": [
      "Toast the bread and set aside. Beat the eggs and cook in a non-stick pan over low heat, stirring until softly scrambled and fully set.",
      "Remove from the heat and fold in the smoked salmon so it warms gently. Serve with the toast."
    ]
  },
  "extra4": {
    "ings": [
      [
        "Turkey sausages",
        2,
        ""
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Eggs",
        1,
        ""
      ],
      [
        "Spinach",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Dice the potato into small cubes. Microwave with a splash of water for 3–4 minutes to speed up cooking, then drain.",
      "Slice the turkey sausages. Brown them in a non-stick pan according to pack directions, ensuring they are cooked through.",
      "Add the potato cubes and cook until golden, stirring regularly.",
      "Add the spinach and stir until wilted.",
      "Cook the egg in the pan or separately to your liking, ensuring the white is set, then serve on top of the hash.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food."
    ]
  },
  "extra5": {
    "ings": [
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Oats",
        30,
        "g"
      ],
      [
        "Frozen berries",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Blend or mash the cottage cheese, eggs and oats into a thick batter.",
      "Heat a good non-stick pan over medium-low heat.",
      "Spoon in small pancakes and cook for 2–3 minutes per side, turning when the edges set.",
      "Heat the berries in a small pan or microwave until juicy and serve over the pancakes.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "extra6": {
    "ings": [
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Turkey mince",
        70,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        ""
      ],
      [
        "Tomato",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Brown the turkey mince in a non-stick pan, breaking it up until fully cooked through. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Beat the eggs, add them to the pan and stir until set.",
      "Dice the tomato and fold it through.",
      "Warm the wrap, add the filling, tuck in the sides and roll into a burrito.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra7": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Apple",
        1,
        ""
      ],
      [
        "Cinnamon",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Core the apple and grate it or dice it finely.",
      "Stir the oats, Greek yoghurt and cinnamon together in a lidded container, then fold through the apple.",
      "Cover and refrigerate for at least 4 hours, preferably overnight.",
      "Stir before eating; the oats will soften as they absorb moisture.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "extra8": {
    "ings": [
      [
        "Eggs",
        3,
        ""
      ],
      [
        "Spinach",
        60,
        "g"
      ],
      [
        "Feta cheese",
        25,
        "g"
      ],
      [
        "Tomato",
        60,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 180°C conventional / 160°C fan. Use a non-stick silicone muffin mould, with no additional greasing oil. Wash and chop spinach, dice tomato and crumble feta.",
      "Beat all the measured eggs until evenly combined, then fold in spinach, tomato and feta. Divide between the moulds, leaving a little room for them to rise.",
      "Bake for 15–20 minutes until puffed and fully set through the centre; extend if the middle is still liquid. Let stand for 3–5 minutes before removing carefully.",
      "Serve now, or cool promptly and refrigerate within two hours. Use within 48 hours and reheat only once until steaming hot."
    ]
  },
  "extra9": {
    "ings": [
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Eggs",
        2,
        ""
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Frozen berries",
        70,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Beat the eggs in a shallow bowl and dip each slice of bread into the egg, coating both sides.",
      "Cook in a non-stick frying pan over medium heat for 2–3 minutes per side, until golden and the egg is fully cooked.",
      "Serve with the Greek yoghurt and berries.",
      "Prepare frozen berries according to the packet before adding.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "extra10": {
    "ings": [
      [
        "0% Greek yoghurt",
        250,
        "g"
      ],
      [
        "Frozen berries",
        100,
        "g"
      ],
      [
        "Chia seeds",
        10,
        "g"
      ],
      [
        "Oats",
        15,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Stir the chia seeds and oats into the Greek yoghurt.",
      "Fold through the prepared berries and add a small splash of water only if you prefer a thinner pot.",
      "Cover and refrigerate for at least 2 hours, ideally overnight, so the chia seeds and oats soften.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "extra11": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Pasta",
        70,
        "g"
      ],
      [
        "Pesto",
        15,
        "g"
      ],
      [
        "Spinach",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Reserve a small cup of pasta water before draining.",
      "Slice the chicken into strips and cook in a non-stick pan until browned and cooked through (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add the spinach to the pan and stir until wilted.",
      "Toss with the drained pasta and pesto, loosening with a little reserved pasta water if needed.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra12": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ],
      [
        "Hot sauce",
        15,
        "ml"
      ],
      [
        "Mixed salad",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Cut the potato into wedges or cubes and roast until golden and tender, about 25–35 minutes, turning halfway.",
      "Cook the chicken in a non-stick pan until browned and cooked through (75°C at the thickest point), then slice or chop. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Mix the Greek yoghurt with the hot sauce.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve the chicken and potatoes over the mixed salad and drizzle with the sauce.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra13": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Noodles",
        70,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        180,
        "g"
      ],
      [
        "Soy sauce",
        15,
        "ml"
      ],
      [
        "Honey",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry noodles following their packet time, then drain. Loosen with a splash of water if they stick; do not add unlisted oil.",
      "Slice the chicken into thin strips and stir-fry in a non-stick pan until cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add the frozen vegetables and stir-fry for 5–7 minutes until piping hot.",
      "Mix the soy sauce and honey, pour into the pan and toss to coat.",
      "Add noodles, toss for a further minute and serve.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra14": {
    "ings": [
      [
        "Chicken breast",
        170,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        ""
      ],
      [
        "Mixed salad",
        80,
        "g"
      ],
      [
        "Light Caesar dressing",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the chicken in a non-stick pan until golden and cooked through (75°C at the thickest point), then slice. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Spread the Caesar dressing over the wrap.",
      "Add the mixed salad and chicken, fold in the sides and roll tightly.",
      "Keep the dressing separate if preparing ahead to avoid a soggy wrap.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra15": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Sweet potato",
        250,
        "g"
      ],
      [
        "BBQ sauce",
        20,
        "g"
      ],
      [
        "Green beans",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Pierce the sweet potato with a fork and bake for 35–50 minutes until soft, or microwave until tender.",
      "Cook the chicken in a non-stick pan until browned and cooked through (75°C at the thickest point); brush or toss with the BBQ sauce near the end. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Steam or microwave the green beans until tender, then serve with the chicken and sweet potato.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra16": {
    "ings": [
      [
        "Turkey mince",
        180,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Kidney beans",
        80,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ],
      [
        "Taco seasoning",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain kidney beans before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Brown the turkey mince in a non-stick pan, breaking it up until cooked through, then stir in the taco taco seasoning. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add the kidney beans and diced tomato and cook for 2–3 minutes to warm through.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve the seasoned turkey and beans over rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra17": {
    "ings": [
      [
        "Tuna",
        120,
        "g"
      ],
      [
        "Couscous",
        60,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Feta cheese",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the packet ratio, cover for the stated standing time, then fluff thoroughly with a fork.",
      "Drain the tuna and crumble the feta.",
      "Dice the cucumber and tomato. Toss the couscous, tuna, vegetables and feta together.",
      "Chill for 10 minutes if you prefer a cold salad.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "extra18": {
    "ings": [
      [
        "Prawns",
        180,
        "g"
      ],
      [
        "Rice",
        55,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        180,
        "g"
      ],
      [
        "Garlic",
        5,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Heat a non-stick pan and cook the prawns with the garlic for 2–3 minutes, turning until pink and opaque (cook from frozen according to pack directions if applicable).",
      "Add the frozen mixed vegetables and cook until piping hot.",
      "Stir in the soy sauce and cooked rice, then toss for 2–3 minutes until everything is hot.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra19": {
    "ings": [
      [
        "5% beef mince",
        170,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Kidney beans",
        80,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain kidney beans before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Brown the beef mince in a non-stick pan, breaking it up until fully cooked. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Stir in the kidney beans and diced tomato and heat for 3–4 minutes.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve over rice with the Greek yoghurt.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra20": {
    "ings": [
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Lean ham",
        100,
        "g"
      ],
      [
        "Cottage cheese",
        80,
        "g"
      ],
      [
        "Mixed salad",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Spread the cottage cheese over one or both slices of wholemeal bread.",
      "Layer on the lean ham and mixed salad.",
      "Close the sandwich and cut in half. If packing for later, keep the salad dry and refrigerate until needed."
    ]
  },
  "extra21": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Peanut butter",
        15,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Slice the chicken and cook in a non-stick frying pan until cooked through (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add the frozen vegetables and stir-fry until hot.",
      "Mix the peanut butter with the soy sauce and a spoonful of warm water to make a pourable sauce. Stir in hot water a spoonful at a time until smooth and pourable; use all the measured peanut butter rather than adding an extra drizzle.",
      "Toss the chicken and vegetables with the sauce and serve over the rice.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra22": {
    "ings": [
      [
        "Lentils",
        160,
        "g"
      ],
      [
        "Feta cheese",
        35,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Mixed salad",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain lentils before weighing the listed amounts. Rinse canned beans and chickpeas. Lentils listed without “red” use a ready-cooked/drained weight, not dry lentils.",
      "If using dried lentils, cook them until tender and drain; if using ready-cooked lentils, drain and rinse them.",
      "Dice the cucumber and tomato and crumble the feta.",
      "Toss the lentils with the vegetables, mixed salad and feta.",
      "Chill until serving; add a little lemon or pepper only if you have it."
    ]
  },
  "extra23": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        ""
      ],
      [
        "Kidney beans",
        60,
        "g"
      ],
      [
        "Mixed salad",
        70,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Slice the chicken into strips and cook in a non-stick pan until golden and cooked through (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Warm the wrap. Drain and rinse the kidney beans, then lightly mash a few if you want them to hold together.",
      "Spread Greek yoghurt on the wrap, then add chicken, beans and salad.",
      "Fold the sides inward and roll tightly.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra24": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Noodles",
        65,
        "g"
      ],
      [
        "Peanut butter",
        12,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        180,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry noodles following their packet time, then drain. Loosen with a splash of water if they stick; do not add unlisted oil.",
      "Pat the tofu dry, cube it and brown in a hot non-stick pan on multiple sides.",
      "Add the frozen vegetables and stir-fry until hot.",
      "Mix the peanut butter and soy sauce with a little warm noodle water to make a sauce. Stir in hot water a spoonful at a time until smooth and pourable; use all the measured peanut butter rather than adding an extra drizzle.",
      "Toss noodles, tofu, vegetables and sauce together until coated and hot."
    ]
  },
  "extra25": {
    "ings": [
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Chicken breast",
        150,
        "g"
      ],
      [
        "Sweetcorn",
        70,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato all over. Microwave until tender, turning halfway, or bake at 200°C until soft in the middle.",
      "Cut the chicken into small pieces and cook in a non-stick pan until no pink remains and the centre reaches 75°C. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Drain the sweetcorn and stir it into the chicken with the Greek yoghurt off the heat.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Split the potato and spoon over the chicken and sweetcorn mixture.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra26": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Couscous",
        60,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Feta cheese",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the packet ratio, cover for the stated standing time, then fluff thoroughly with a fork.",
      "Season the chicken with any preferred herbs already on hand, then cook in a non-stick pan until cooked through (75°C). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Slice after a short rest. Dice the cucumber and tomato and crumble the feta.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve the chicken over couscous with the vegetables and feta.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra27": {
    "ings": [
      [
        "Turkey sausages",
        2,
        ""
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Cannellini beans",
        80,
        "g"
      ],
      [
        "Spinach",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Slice the turkey sausages and brown them in a pan according to the packet instructions, ensuring they are cooked through.",
      "Add the chopped tomatoes and cannellini beans; simmer for 8–10 minutes.",
      "Stir in the spinach until wilted. Toss the sauce with the pasta and serve.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra28": {
    "ings": [
      [
        "Chicken breast",
        200,
        "g"
      ],
      [
        "Rice",
        55,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        180,
        "g"
      ],
      [
        "Teriyaki sauce",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cut the chicken into bite-sized pieces and cook in a non-stick pan until browned and cooked through (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add the frozen vegetables and cook until piping hot.",
      "Pour in the teriyaki sauce and simmer for 1–2 minutes to coat the chicken and vegetables.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve over the rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra29": {
    "ings": [
      [
        "5% beef mince",
        170,
        "g"
      ],
      [
        "Noodles",
        65,
        "g"
      ],
      [
        "Broccoli",
        180,
        "g"
      ],
      [
        "Soy sauce",
        15,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry noodles following their packet time, then drain. Loosen with a splash of water if they stick; do not add unlisted oil.",
      "Brown the beef mince in a hot non-stick pan until fully cooked. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add the broccoli with a splash of water, cover and steam-fry for 4–6 minutes until tender and hot.",
      "Add soy sauce and noodles, toss for 1–2 minutes and serve.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra30": {
    "ings": [
      [
        "Turkey mince",
        180,
        "g"
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Parmesan",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Mix the turkey mince into small meatballs with clean hands.",
      "Brown in a non-stick pan, turning gently until cooked through; the centre should reach 75°C.",
      "Add chopped tomatoes and simmer for 10–12 minutes until the sauce thickens and the meatballs are cooked through.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve over pasta and finish with the grated parmesan.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra31": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Kidney beans",
        80,
        "g"
      ],
      [
        "Cheddar",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain kidney beans before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Heat the oven to 200°C (180°C fan).",
      "Rinse and cook the rice until just tender.",
      "Cut the chicken into small pieces and cook in a non-stick pan until cooked through (75°C). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Mix the rice, chicken, chopped tomatoes and kidney beans in an ovenproof dish.",
      "Scatter the cheddar over the top. Bake for 15–20 minutes until bubbling and hot throughout.",
      "Let stand for 5 minutes before portioning.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra32": {
    "ings": [
      [
        "Chicken breast",
        180,
        "g"
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Mushrooms",
        100,
        "g"
      ],
      [
        "Light cream cheese",
        35,
        "g"
      ],
      [
        "Spinach",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Slice the chicken and cook in a non-stick pan until browned and cooked through (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Remove to a plate. Cook the sliced mushrooms in the same pan until softened. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Stir in the light cream cheese and a splash of pasta water until a sauce forms.",
      "Add the spinach until wilted, return the chicken to the pan and toss with the pasta.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra33": {
    "ings": [
      [
        "Chicken breast",
        200,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Green beans",
        150,
        "g"
      ],
      [
        "Honey",
        8,
        "g"
      ],
      [
        "Mustard",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Cut the potatoes into bite-sized chunks and roast for 25–35 minutes until tender, turning halfway.",
      "Cook the chicken in a non-stick pan until browned and cooked through (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Mix the honey and mustard, brush over the chicken near the end of cooking and heat for another minute.",
      "Steam or microwave the green beans until tender and serve with the chicken and potatoes.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra34": {
    "ings": [
      [
        "Lean pork",
        180,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Green beans",
        150,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Peel and chop the potatoes. Boil for 15–20 minutes until tender.",
      "Meanwhile, sear the pork in a hot non-stick pan, then lower the heat and cook until the centre reaches 70°C followed by a 3-minute rest, or follow the pack instructions.",
      "Rest before slicing. Drain the potatoes, mash until smooth, then stir in the Greek yoghurt.",
      "Steam or microwave the green beans until tender and serve alongside the sliced pork and mash.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra35": {
    "ings": [
      [
        "5% beef mince",
        170,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Carrot",
        80,
        "g"
      ],
      [
        "Frozen peas",
        80,
        "g"
      ],
      [
        "Chopped tomatoes",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Dice the potato and boil for 15–20 minutes until soft; drain well and mash.",
      "Brown the beef mince in a pan, breaking it up. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add diced carrot, peas and chopped tomatoes and simmer for 10–12 minutes until the mince is fully cooked and the mixture thickens.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Spoon the beef mixture into a bowl and top with the mashed potato.",
      "For a browned top, place under a hot grill for 3–5 minutes in an oven-safe dish.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra36": {
    "ings": [
      [
        "Salmon fillet",
        160,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Broccoli",
        150,
        "g"
      ],
      [
        "Teriyaki sauce",
        15,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cook the salmon in a non-stick pan or at 200°C oven heat until it flakes easily and is cooked through; follow the pack instructions for thickness.",
      "Steam or microwave the broccoli until tender.",
      "Brush or spoon teriyaki sauce over the salmon for the final 1–2 minutes of cooking, then serve with rice and broccoli.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra37": {
    "ings": [
      [
        "Cod fillet",
        200,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Green beans",
        150,
        "g"
      ],
      [
        "Olive oil",
        5,
        "g"
      ],
      [
        "Lemon",
        0.5,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Cut the potatoes into chunks, toss with the olive oil and roast for 30–40 minutes, turning halfway.",
      "Add the cod to a lined baking tray for the final 12–15 minutes of the potato cooking time, or until it is opaque and flakes easily.",
      "Squeeze lemon over it. Steam or microwave the green beans until tender and serve with the lemon cod and potatoes."
    ]
  },
  "extra38": {
    "ings": [
      [
        "Prawns",
        180,
        "g"
      ],
      [
        "Light coconut milk",
        100,
        "ml"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Curry powder",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Put the chopped tomatoes, light coconut milk and curry powder in a pan.",
      "Simmer gently for 5–8 minutes. Add the prawns and cook until pink, opaque and piping hot, following the pack timing if frozen.",
      "Serve the coconut prawn curry over rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra39": {
    "ings": [
      [
        "Chickpeas",
        150,
        "g"
      ],
      [
        "Spinach",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Light coconut milk",
        50,
        "ml"
      ],
      [
        "Rice",
        45,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain chickpeas before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Add the chickpeas, chopped tomatoes and light coconut milk to a saucepan; bring to a gentle simmer.",
      "Simmer for 10–12 minutes, stirring occasionally.",
      "Add the spinach and cook until wilted and the chickpeas are hot.",
      "Serve the curry over rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra40": {
    "ings": [
      [
        "Black beans",
        150,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Frozen mixed peppers",
        180,
        "g"
      ],
      [
        "0% Greek yoghurt",
        50,
        "g"
      ],
      [
        "Fajita seasoning",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cook the frozen peppers in a non-stick pan until soft.",
      "Add the drained black beans and fajita fajita seasoning, then heat through.",
      "Serve the bean and pepper mixture over rice with Greek yoghurt.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra41": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Carrot",
        80,
        "g"
      ],
      [
        "Curry sauce",
        80,
        "g"
      ],
      [
        "Broccoli",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Pat the tofu dry and cut into slabs or cubes.",
      "Brown in a non-stick pan until crisp on the outside.",
      "Cook the carrot and broccoli with a splash of water in a covered pan until just tender.",
      "Heat the curry sauce in a small saucepan and serve over the rice with the tofu and vegetables.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra42": {
    "ings": [
      [
        "Red lentils",
        70,
        "g"
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Carrot",
        80,
        "g"
      ],
      [
        "Onion",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Finely dice the onion and carrot. Soften them in a saucepan with a splash of water, stirring for 5–7 minutes.",
      "Add the red lentils and chopped tomatoes plus enough water to cover the lentils.",
      "Simmer for 18–25 minutes, stirring and topping up water as needed until tender.",
      "Serve the lentil sauce over pasta. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra43": {
    "ings": [
      [
        "Halloumi",
        70,
        "g"
      ],
      [
        "Couscous",
        60,
        "g"
      ],
      [
        "Courgette",
        100,
        "g"
      ],
      [
        "Frozen mixed peppers",
        100,
        "g"
      ],
      [
        "Chickpeas",
        70,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the packet ratio, cover for the stated standing time, then fluff thoroughly with a fork.",
      "Cut the halloumi into slices and cook in a non-stick pan for 1–2 minutes per side until golden.",
      "Cook the courgette and peppers in the same pan until softened.",
      "Drain and rinse the chickpeas and warm them through with the vegetables.",
      "Serve the roasted vegetables, chickpeas and halloumi over couscous."
    ]
  },
  "extra44": {
    "ings": [
      [
        "Kidney beans",
        100,
        "g"
      ],
      [
        "Black beans",
        100,
        "g"
      ],
      [
        "Cannellini beans",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Rice",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Drain and rinse the kidney beans, black beans and cannellini beans.",
      "Combine all beans with chopped tomatoes in a saucepan.",
      "Simmer for 12–15 minutes, stirring occasionally, until thick and piping hot.",
      "Serve the three-bean chilli over rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra45": {
    "ings": [
      [
        "Turkey mince",
        160,
        "g"
      ],
      [
        "Rice",
        40,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Chopped tomatoes",
        120,
        "g"
      ],
      [
        "Cheddar",
        15,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 190°C conventional / 170°C fan. This uses frozen pepper pieces as a rice bake rather than trying to stuff pepper halves. Grate the measured cheddar.",
      "Cook weighed dry rice using the water ratio and time on its packet. Brown turkey mince in a non-stick pan over medium-high heat for 7–10 minutes, breaking it up.",
      "Stir in frozen mixed peppers and chopped tomatoes and simmer for 8–10 minutes until the peppers are hot and tender. Check the mince reaches 75°C for 30 seconds.",
      "Fold in cooked rice, spoon into an ovenproof dish and scatter with all the cheddar. Bake for 10–15 minutes until the cheese melts and the centre is piping hot.",
      "For meal prep, cool within one hour because it contains rice. Refrigerate for no more than 24 hours or freeze promptly; reheat only once until steaming hot."
    ]
  },
  "extra46": {
    "ings": [
      [
        "Chicken breast",
        150,
        "g"
      ],
      [
        "Lentils",
        100,
        "g"
      ],
      [
        "Carrot",
        80,
        "g"
      ],
      [
        "Celery",
        50,
        "g"
      ],
      [
        "Chicken stock",
        250,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain lentils before weighing the listed amounts. Rinse canned beans and chickpeas. Lentils listed without “red” use a ready-cooked/drained weight, not dry lentils.",
      "Dice the carrot and celery. Cut the chicken into small pieces.",
      "Put the chicken stock, carrot, celery and lentils in a saucepan and bring to a simmer.",
      "Cook lentils according to type and packet directions until nearly tender.",
      "Add the chicken and simmer until fully cooked (75°C at the thickest piece) and the lentils are soft, usually 10–15 minutes more.",
      "Add water if the soup becomes too thick.",
      "Taste, check the chicken is cooked through, and serve hot.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra47": {
    "ings": [
      [
        "5% beef mince",
        180,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Mixed salad",
        80,
        "g"
      ],
      [
        "Cheddar",
        15,
        "g"
      ],
      [
        "Light burger sauce",
        15,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Cut the potato into wedges and roast until golden and tender, about 25–35 minutes.",
      "Shape the beef mince into a patty and cook in a hot non-stick pan for 4–6 minutes per side depending on thickness, until thoroughly cooked through.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve the patty over mixed salad with sliced or grated cheddar and burger sauce, alongside the wedges.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra48": {
    "ings": [
      [
        "Chicken breast",
        200,
        "g"
      ],
      [
        "Rice",
        45,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        60,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cut the chicken into strips. Cook in a non-stick pan until browned and cooked through (75°C).",
      "Dice the cucumber and tomato. Stir the Greek yoghurt until smooth to make a simple sauce.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve the chicken over rice with the chopped salad and yoghurt.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "extra49": {
    "ings": [
      [
        "Turkey sausages",
        3,
        ""
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Onion",
        60,
        "g"
      ],
      [
        "Olive oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Cut the potato and carrot into similar-sized chunks and slice the onion into wedges.",
      "Toss the vegetables with olive oil on a baking tray and roast for 15 minutes.",
      "Add the turkey sausages and turn the vegetables.",
      "Roast for another 20–25 minutes or as directed on the sausage pack, turning once, until the sausages are cooked through and vegetables are tender.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food."
    ]
  },
  "extra50": {
    "ings": [
      [
        "Chicken breast",
        150,
        "g"
      ],
      [
        "Potato",
        150,
        "g"
      ],
      [
        "Sweetcorn",
        80,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chicken stock",
        200,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain canned sweetcorn before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Dice the chicken and potato into small pieces.",
      "Add them to a saucepan with the chicken stock and simmer for 10–12 minutes.",
      "Add the sweetcorn and milk. Simmer gently until the potato is soft and the chicken reaches 75°C at its thickest point; avoid a hard boil after adding milk. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Break up a few potato pieces against the side of the pan to thicken the chowder.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve hot using the ingredients listed.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "extra51": {
    "ings": [
      [
        "Milk",
        200,
        "ml"
      ],
      [
        "Whey protein powder",
        20,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Warm the milk in a small saucepan or microwave until hot but not boiling.",
      "Whisk the cocoa powder into a little of the warm milk to make a smooth paste, then whisk it into the remaining milk.",
      "Let the drink cool slightly, then whisk in the whey protein powder until smooth. Do not boil the protein powder."
    ]
  },
  "extra52": {
    "ings": [
      [
        "Apple",
        1,
        ""
      ],
      [
        "Peanut butter",
        15,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wash and core the apple, then slice it into wedges.",
      "Serve with the peanut butter for dipping.",
      "Measure the peanut butter separately if tracking calories."
    ]
  },
  "extra53": {
    "ings": [
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Carrot",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Place the eggs in a saucepan and cover with cold water.",
      "Bring to a boil, then simmer for 9–10 minutes for hard-boiled eggs.",
      "Cool the eggs under cold running water and peel.",
      "Peel or wash the carrot and cut into sticks.",
      "Serve alongside the eggs. Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid."
    ]
  },
  "extra54": {
    "ings": [
      [
        "Tuna",
        100,
        "g"
      ],
      [
        "Cucumber",
        150,
        "g"
      ],
      [
        "0% Greek yoghurt",
        30,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tuna well and mix with the Greek yoghurt until it holds together.",
      "Slice the cucumber into thick rounds or long batons.",
      "Spoon the tuna mixture onto the cucumber or serve it alongside for dipping. Keep chilled until serving."
    ]
  },
  "extra55": {
    "ings": [
      [
        "Milk",
        200,
        "ml"
      ],
      [
        "Banana",
        1,
        ""
      ],
      [
        "Whey protein powder",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Pour the milk into a blender. Add the banana, peeled and broken into chunks.",
      "Add the whey protein powder and blend until smooth, about 20–30 seconds.",
      "Drink immediately or refrigerate promptly and use the same day; shake again before drinking.",
      "Use a blender rated for the ingredients. Stop and unplug before scraping the sides; serve straight away and add only the measured toppings."
    ]
  },
  "extra56": {
    "ings": [
      [
        "Edamame beans",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the measured edamame beans following their pack instructions until piping hot; check whether your pack contains shelled beans or pods.",
      "Drain thoroughly and allow to cool just enough to handle. If using pods, eat the beans inside and discard the pods; the ingredient quantity is the edible bean weight.",
      "Serve warm without added salt, since salt is not in this recipe’s ingredient list. Refrigerate any prepared leftovers promptly and use within 48 hours."
    ]
  },
  "extra57": {
    "ings": [
      [
        "Lean ham",
        100,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Light cream cheese",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Spread the light cream cheese over the lean ham slices.",
      "Cut the cucumber into thin batons and place on the ham.",
      "Roll each ham slice around the cucumber, seam-side down. Keep refrigerated until eating."
    ]
  },
  "extra58": {
    "ings": [
      [
        "Cottage cheese",
        200,
        "g"
      ],
      [
        "Frozen berries",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Spoon the cottage cheese into a bowl.",
      "Add the frozen berries on top and Use berries prepared according to their packet.",
      "Stir together just before eating. Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "extra59": {
    "ings": [
      [
        "Chickpeas",
        120,
        "g"
      ],
      [
        "Olive oil",
        3,
        "g"
      ],
      [
        "Paprika",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Drain and rinse the chickpeas, then pat very dry with a clean towel.",
      "Toss the chickpeas with the olive oil and paprika, spreading them in one layer on a baking tray.",
      "Roast for 25–35 minutes, shaking the tray halfway, until crisp.",
      "They crisp further as they cool; store in a dry airtight container and eat soon for best crunch."
    ]
  },
  "extra60": {
    "ings": [
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Wholemeal pitta",
        1,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Grate or finely dice the cucumber. If very watery, squeeze out excess moisture.",
      "Mix the cucumber into the Greek yoghurt.",
      "Chill for 10–15 minutes so the flavours combine.",
      "Serve the dip with the wholemeal pitta, warmed or toasted if preferred.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "extra61": {
    "ings": [
      [
        "0% Greek yoghurt",
        250,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Dark chocolate",
        8,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Stir the cocoa powder into the Greek yoghurt until smooth.",
      "Finely chop or grate the dark chocolate and fold it through or sprinkle it on top.",
      "Chill for 10 minutes for a thicker, mousse-like texture, or eat immediately.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "extra62": {
    "ings": [
      [
        "Skyr yoghurt",
        170,
        "g"
      ],
      [
        "Pear",
        1,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Spoon the skyr into a bowl. Wash and slice the pear, removing the core.",
      "Serve the pear alongside or on top of the skyr.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein01": {
    "ings": [
      [
        "Skyr yoghurt",
        200,
        "g"
      ],
      [
        "Frozen berries",
        100,
        "g"
      ],
      [
        "Oats",
        20,
        "g"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Honey",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Spoon the Skyr into a bowl and stir until smooth. If using a flavoured version, check its label because calories and sugar may differ.",
      "Add the oats and chia seeds and mix well so there are no dry pockets.",
      "Fold through the berries. Drizzle with the measured honey and eat straight away, or refrigerate for 10–15 minutes to soften the oats."
    ]
  },
  "protein02": {
    "ings": [
      [
        "Skyr yoghurt",
        170,
        "g"
      ],
      [
        "Oats",
        40,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Banana",
        0.5,
        ""
      ],
      [
        "Chia seeds",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix the Skyr, oats, milk and chia seeds in a sealable container until all the oats are damp.",
      "Slice half a banana and stir it through.",
      "Cover and refrigerate for at least 4 hours, preferably overnight.",
      "In the morning, stir the oats; add a splash of milk if they're too thick.",
      "Top with the remaining banana if desired.",
      "Keep chilled until serving. Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "protein03": {
    "ings": [
      [
        "Skyr yoghurt",
        170,
        "g"
      ],
      [
        "Light cream cheese",
        40,
        "g"
      ],
      [
        "Whey protein powder",
        10,
        "g"
      ],
      [
        "Apple",
        0.5,
        ""
      ],
      [
        "Oats",
        15,
        "g"
      ],
      [
        "Cinnamon",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mash the light cream cheese with a spoon until smooth, then beat in the Skyr and whey protein powder until lump-free.",
      "Dice the apple finely and toss it with the cinnamon.",
      "Put the oats in the bottom of a jar, spoon over the yoghurt mixture and top with the apple.",
      "Refrigerate for at least 30 minutes so the oats soften."
    ]
  },
  "protein04": {
    "ings": [
      [
        "Cottage cheese",
        120,
        "g"
      ],
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ],
      [
        "Tomato",
        80,
        "g"
      ],
      [
        "Spinach",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Toast the bread. Wash and dice the tomato; roughly chop the spinach.",
      "Whisk the eggs with the cottage cheese.",
      "Heat a non-stick pan over low–medium heat and add the egg mixture.",
      "Stir slowly until the eggs are fully set but still moist, about 3–5 minutes.",
      "Fold in the spinach and tomato for the final minute, then spoon over the toast.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein05": {
    "ings": [
      [
        "Firm tofu",
        150,
        "g"
      ],
      [
        "Eggs",
        1,
        ""
      ],
      [
        "Wholemeal wrap",
        1,
        ""
      ],
      [
        "Spinach",
        50,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Pat the tofu dry, crumble it into a bowl and dice the tomato.",
      "Heat a non-stick pan over medium heat.",
      "Add the tofu and cook for 3–4 minutes, stirring to remove excess moisture.",
      "Add the tomato and spinach and cook until the spinach wilts.",
      "Beat the egg, pour it in and stir until fully set.",
      "Spoon into the warmed wrap and fold closed."
    ]
  },
  "protein06": {
    "ings": [
      [
        "Eggs",
        3,
        ""
      ],
      [
        "Lean ham",
        60,
        "g"
      ],
      [
        "Mushrooms",
        80,
        "g"
      ],
      [
        "Cottage cheese",
        50,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Slice the mushrooms and chop the ham into small pieces.",
      "Whisk the eggs with the cottage cheese.",
      "Pour into a non-stick pan over medium-low heat and scatter over the mushrooms and ham.",
      "Cook gently for 4–6 minutes, lifting the edges so uncooked egg runs underneath.",
      "Fold when almost set and cook until the centre is no longer runny.",
      "Serve with sliced tomato. Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein07": {
    "ings": [
      [
        "Oats",
        40,
        "g"
      ],
      [
        "Milk",
        150,
        "ml"
      ],
      [
        "Skyr yoghurt",
        100,
        "g"
      ],
      [
        "Pear",
        1,
        ""
      ],
      [
        "Cinnamon",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the oats and milk in a saucepan.",
      "Bring to a gentle simmer, stirring, then cook for 4–6 minutes until creamy; add a splash of water if it thickens too much.",
      "Remove from the heat and let cool for 1–2 minutes before stirring in the Skyr.",
      "This helps keep the yoghurt thick and smooth.",
      "Slice the pear over the top and finish with cinnamon. If taking to work, chill promptly in a lidded container.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein08": {
    "ings": [
      [
        "Chicken breast",
        170,
        "g"
      ],
      [
        "Skyr yoghurt",
        60,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        ""
      ],
      [
        "Lettuce",
        50,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Tikka seasoning",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Stir the Skyr and tikka tikka seasoning together.",
      "Cut the chicken into bite-sized strips, coat it in the yoghurt marinade and leave for 10 minutes if time allows.",
      "Heat a non-stick pan over medium heat and cook the chicken for 6–10 minutes, turning regularly, until browned and fully cooked (75°C at the thickest point).",
      "Discard any raw marinade. Warm the wrap.",
      "Add lettuce and sliced cucumber, pile in the chicken and roll tightly.",
      "Keep any packed leftovers chilled. Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein09": {
    "ings": [
      [
        "Chicken breast",
        150,
        "g"
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "High-protein natural yoghurt",
        50,
        "g"
      ],
      [
        "Parmesan",
        10,
        "g"
      ],
      [
        "Romaine lettuce",
        80,
        "g"
      ],
      [
        "Light Caesar dressing",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Slice the chicken into strips and cook in a non-stick pan until browned and fully cooked (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Let it rest briefly, then slice if needed.",
      "Mix the high-protein yoghurt with the light Caesar dressing and a splash of pasta water to make a pourable sauce.",
      "Toss with the pasta and chicken. Fold in the chopped romaine just before eating so it stays crisp, then finish with finely grated Parmesan.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein10": {
    "ings": [
      [
        "Tuna",
        120,
        "g"
      ],
      [
        "Cannellini beans",
        100,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "High-protein natural yoghurt",
        40,
        "g"
      ],
      [
        "Lemon",
        0.5,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tuna and cannellini beans thoroughly.",
      "Rinse the beans under cold water and drain again.",
      "Dice the cucumber and tomato. Mix the high-protein yoghurt with a squeeze of lemon juice to make a simple dressing.",
      "Combine the tuna, beans and vegetables, then fold through the dressing.",
      "Taste and add extra lemon if available.",
      "Chill promptly if not eating straight away.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein11": {
    "ings": [
      [
        "5% beef mince",
        160,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Edamame beans",
        80,
        "g"
      ],
      [
        "Carrot",
        60,
        "g"
      ],
      [
        "Soy sauce",
        15,
        "ml"
      ],
      [
        "Honey",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Rinse the rice and cook according to the packet instructions. If meal-prepping, spread cooked rice in a shallow container and cool promptly.",
      "Heat a non-stick frying pan over medium-high heat.",
      "Add the beef mince and break it into small pieces; cook until well browned and no pink remains.",
      "Stir in the soy sauce and honey. Add the edamame and grated carrot with a splash of water, then cook for 3–4 minutes until the edamame is piping hot.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve over the rice. For leftovers, refrigerate promptly and reheat until piping hot."
    ]
  },
  "protein12": {
    "ings": [
      [
        "Smoked salmon",
        80,
        "g"
      ],
      [
        "Bagel",
        1,
        ""
      ],
      [
        "Skyr yoghurt",
        40,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Lemon",
        0.5,
        ""
      ]
    ],
    "servings": 1,
    "steps": [
      "Slice the cucumber thinly and mix the Skyr with a little lemon juice and black pepper if available.",
      "Cut the bagel in half and toast it to your preferred level.",
      "Spread the Skyr mixture on each half, add the smoked salmon and cucumber, and close the bagel.",
      "Keep refrigerated until serving; do not leave it warm for extended periods."
    ]
  },
  "protein13": {
    "ings": [
      [
        "Turkey mince",
        160,
        "g"
      ],
      [
        "Wholemeal pitta",
        1,
        ""
      ],
      [
        "Passata",
        100,
        "g"
      ],
      [
        "High-protein natural yoghurt",
        40,
        "g"
      ],
      [
        "Lettuce",
        50,
        "g"
      ],
      [
        "Dried mixed herbs",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Mix the turkey mince with the dried herbs.",
      "Shape into 4–5 small meatballs, washing your hands after handling raw mince.",
      "Brown the meatballs in a non-stick pan over medium heat, turning carefully.",
      "Add the passata, cover and simmer for 10–12 minutes until cooked through (75°C in the centre).",
      "Warm the pitta. Mix the high-protein yoghurt with a spoonful of water to loosen it, then add lettuce, meatballs and tomato sauce to the pitta.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Spoon over the yoghurt sauce. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein14": {
    "ings": [
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Tuna",
        100,
        "g"
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Sweetcorn",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato all over with a fork.",
      "Microwave for 7–12 minutes, turning halfway, until soft, or bake at 200°C (180°C fan) for 45–60 minutes depending on size.",
      "Drain the tuna and sweetcorn. Mix with the cottage cheese in a bowl; add black pepper or chopped herbs if available.",
      "Split the cooked potato, fluff the centre with a fork and spoon the tuna mixture over it.",
      "For a cold filling, keep it chilled until serving.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein15": {
    "ings": [
      [
        "Chicken breast",
        160,
        "g"
      ],
      [
        "Couscous",
        60,
        "g"
      ],
      [
        "Pesto",
        10,
        "g"
      ],
      [
        "Cherry tomatoes",
        100,
        "g"
      ],
      [
        "Skyr yoghurt",
        30,
        "g"
      ],
      [
        "Spinach",
        40,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the packet ratio, cover for the stated standing time, then fluff thoroughly with a fork.",
      "Cover for 5 minutes, then fluff with a fork.",
      "Cut the chicken into strips and cook in a non-stick pan over medium heat until browned and fully cooked (75°C at the thickest point). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Stir the pesto into the warm couscous, then fold in the halved cherry tomatoes and spinach so the spinach just begins to wilt.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve with the chicken and a spoonful of Skyr stirred with a little water to make a creamy dressing.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein16": {
    "ings": [
      [
        "Chicken breast",
        170,
        "g"
      ],
      [
        "Orzo",
        65,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Spinach",
        60,
        "g"
      ],
      [
        "Feta cheese",
        15,
        "g"
      ],
      [
        "Chicken stock",
        150,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Cut the chicken into bite-sized pieces and season with dried herbs if available.",
      "Put the orzo, chopped tomatoes and chicken stock in an ovenproof dish and stir.",
      "Nestle the chicken into the mixture and cover tightly with foil.",
      "Bake for 20 minutes, stir, then bake for another 10–15 minutes until the orzo is tender and the chicken reaches 75°C.",
      "Add a splash of water if it looks dry before the orzo is cooked.",
      "Stir in the spinach until wilted and crumble the feta over the top.",
      "Rest for 3 minutes before serving. Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein17": {
    "ings": [
      [
        "5% beef mince",
        170,
        "g"
      ],
      [
        "Couscous",
        60,
        "g"
      ],
      [
        "Cucumber",
        70,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ],
      [
        "Skyr yoghurt",
        50,
        "g"
      ],
      [
        "Ground cumin",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Put the couscous in a bowl and cover with boiling water according to the packet.",
      "Cover for 5 minutes, then fluff with a fork.",
      "Mix the beef mince with cumin. Shape into small koftas around skewers or into oval patties; wash hands and utensils after touching raw mince.",
      "Cook in a hot non-stick pan for 8–10 minutes, turning often, until browned and cooked through with no pink centre.",
      "For a thermometer check, aim for 75°C in the centre.",
      "Dice the cucumber and tomato. Mix the Skyr with a spoonful of water for a quick sauce, then plate the koftas over couscous with salad and sauce.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein18": {
    "ings": [
      [
        "Salmon fillet",
        140,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Green beans",
        120,
        "g"
      ],
      [
        "Lemon",
        0.5,
        ""
      ],
      [
        "Skyr yoghurt",
        30,
        "g"
      ],
      [
        "Dried dill",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Heat the oven to 200°C (180°C fan).",
      "Cut the potatoes into even chunks and boil for 8 minutes, then drain well.",
      "Put the potatoes on a baking tray, toss with a little cooking oil if available and roast for 20 minutes.",
      "Add the salmon to the tray and bake for another 12–15 minutes, depending on thickness, until it flakes and is cooked through.",
      "Steam or boil the green beans for 4–6 minutes until tender.",
      "Mix the Skyr with lemon juice and dill to make a cool sauce.",
      "Serve the salmon with the potatoes, beans and lemon-yoghurt sauce.",
      "Keep the sauce separate if packing for later."
    ]
  },
  "protein19": {
    "ings": [
      [
        "Chicken breast",
        160,
        "g"
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Cottage cheese",
        80,
        "g"
      ],
      [
        "Spinach",
        50,
        "g"
      ],
      [
        "Milk",
        30,
        "ml"
      ],
      [
        "Garlic",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Reserve a little pasta water before draining.",
      "Blend or mash the cottage cheese with the milk and garlic until smooth. If using a blender, scrape down the sides once.",
      "Cut the chicken into small strips and pan-cook until browned and fully cooked (75°C). Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add the spinach and stir until wilted.",
      "Turn the heat to low. Stir in the cottage cheese sauce and drained pasta, adding a little pasta water to loosen it.",
      "Warm gently without boiling hard, then serve.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein20": {
    "ings": [
      [
        "Turkey mince",
        170,
        "g"
      ],
      [
        "Orzo",
        65,
        "g"
      ],
      [
        "Passata",
        150,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Parmesan",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix the turkey mince with the finely diced onion.",
      "Shape into 8 small meatballs, washing hands and surfaces after handling raw mince.",
      "Brown the meatballs in a large non-stick pan, turning gently.",
      "Add the passata and simmer covered for 10–12 minutes until the meatballs are cooked through (75°C in the centre).",
      "Meanwhile, cook the orzo in boiling water according to the packet, then drain.",
      "Stir the orzo into the tomato sauce, spoon into bowls and finish with the Parmesan.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein21": {
    "ings": [
      [
        "Prawns",
        180,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Light coconut milk",
        80,
        "ml"
      ],
      [
        "Curry paste",
        15,
        "g"
      ],
      [
        "Spinach",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Rinse the rice and cook according to the packet instructions.",
      "Warm the curry paste in a saucepan for 30 seconds, stirring.",
      "Add the light coconut milk and a splash of water, then simmer for 3 minutes.",
      "Add the prawns and simmer until opaque and cooked through; follow pack instructions if they are raw or already cooked.",
      "Add the spinach for the final 1–2 minutes until wilted.",
      "Serve immediately over rice. Refrigerate leftovers promptly and reheat until piping hot only once."
    ]
  },
  "protein22": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Light coconut milk",
        60,
        "ml"
      ],
      [
        "Peanut butter",
        10,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Broccoli",
        150,
        "g"
      ],
      [
        "Curry paste",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Pat the tofu dry and cut into cubes.",
      "Brown in a non-stick pan on several sides for 6–8 minutes, turning as it colours.",
      "Stir the curry paste and peanut butter together with the light coconut milk and a splash of water.",
      "Pour over the tofu and simmer gently for 5 minutes.",
      "Add the broccoli and cook until tender but still bright green, adding a little water if the sauce thickens too much.",
      "Serve over rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "protein23": {
    "ings": [
      [
        "Lean pork",
        170,
        "g"
      ],
      [
        "Potato",
        200,
        "g"
      ],
      [
        "Green beans",
        120,
        "g"
      ],
      [
        "Skyr yoghurt",
        40,
        "g"
      ],
      [
        "Mustard",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cut the potatoes into even chunks and boil for 12–15 minutes until tender; drain.",
      "Steam or boil the green beans for 4–6 minutes.",
      "Trim the pork into medallions. Heat a non-stick pan and cook for 3–5 minutes per side depending on thickness, until cooked through (aim for 70°C and allow a 3-minute rest).",
      "Remove the pan from the heat. Stir the mustard into the Skyr with a spoonful of warm water, then add it to the pan off the heat so the yoghurt stays creamy.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve the pork with the potatoes and beans, spooning the mustard-Skyr sauce over the meat.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "protein24": {
    "ings": [
      [
        "Skyr yoghurt",
        170,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Whey protein powder",
        10,
        "g"
      ],
      [
        "Frozen berries",
        50,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Spoon the Skyr into a bowl and sift in the cocoa powder to avoid lumps.",
      "Stir in the whey protein powder a little at a time until smooth.",
      "Add a teaspoon of cold water if the mixture becomes too thick.",
      "Top with the berries and chill for 10 minutes for a thicker mousse texture, or eat straight away.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein25": {
    "ings": [
      [
        "High-protein natural yoghurt",
        200,
        "g"
      ],
      [
        "Frozen berries",
        80,
        "g"
      ],
      [
        "Whey protein powder",
        10,
        "g"
      ],
      [
        "Dark chocolate",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Stir the whey protein into the high-protein yoghurt until smooth. If it becomes very thick, add a teaspoon of water.",
      "Spread the mixture in a thin layer on a baking-paper-lined tray or freezer-safe plate.",
      "Scatter the berries and finely chopped dark chocolate over the top.",
      "Freeze for 2–3 hours until firm, then break into pieces.",
      "Eat straight from the freezer; it softens quickly.",
      "Freeze leftovers in a sealed container."
    ]
  },
  "protein26": {
    "ings": [
      [
        "Quark",
        150,
        "g"
      ],
      [
        "Whey protein powder",
        10,
        "g"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ],
      [
        "Oat biscuits",
        10,
        "g"
      ],
      [
        "Sweetener",
        1,
        "portion"
      ]
    ],
    "servings": 1,
    "steps": [
      "Crush the oat biscuits into fine crumbs and press them into the bottom of a small pot.",
      "Mix the quark, whey protein, lemon juice and sweetener until smooth.",
      "Taste and add a little more lemon if you prefer a sharper flavour.",
      "Spoon over the biscuit base and refrigerate for at least 30 minutes to thicken. Keep chilled until eating."
    ]
  },
  "protein27": {
    "ings": [
      [
        "High-protein natural yoghurt",
        150,
        "g"
      ],
      [
        "Cottage cheese",
        50,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Dried mixed herbs",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Blend or mash the cottage cheese with the high-protein yoghurt until smooth; a fork works if you don't mind a little texture.",
      "Stir in the dried herbs and chill for 10 minutes so the flavours develop.",
      "Cut the carrot and cucumber into sticks.",
      "Serve with the dip, keeping it refrigerated until snack time."
    ]
  },
  "protein28": {
    "ings": [
      [
        "Edamame beans",
        100,
        "g"
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Lime",
        0.5,
        ""
      ],
      [
        "Chilli flakes",
        0.5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the edamame according to the packet instructions until piping hot, then drain well.",
      "Mix the cottage cheese with lime juice and a small pinch of chilli flakes.",
      "Spoon the edamame into a bowl and top with the lime cottage cheese.",
      "Serve warm or chill promptly for later.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein29": {
    "ings": [
      [
        "Skyr yoghurt",
        150,
        "g"
      ],
      [
        "Dates",
        25,
        "g"
      ],
      [
        "Walnuts",
        8,
        "g"
      ],
      [
        "Cinnamon",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Spoon the Skyr into a bowl and stir in the cinnamon.",
      "Chop the dates and walnuts into small pieces; check dates for stones if not already pitted.",
      "Scatter the dates and walnuts over the Skyr.",
      "Serve straight away, or pack chilled and add the nuts just before eating to keep their texture.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "protein30": {
    "ings": [
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Eggs",
        2,
        ""
      ],
      [
        "Egg whites",
        80,
        "g"
      ],
      [
        "Edamame beans",
        80,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Rinse the rice and cook according to the packet.",
      "For best fried rice texture, spread it on a shallow plate and let steam escape for a few minutes; use leftover rice only if it was cooled and refrigerated safely.",
      "Heat a non-stick wok or large pan. Add the edamame and frozen vegetables with a splash of water and cook until piping hot.",
      "Push the vegetables to one side. Add the beaten eggs and egg whites and stir until fully set, then mix with the vegetables.",
      "Add the rice and soy sauce, stir-fry for 2–3 minutes until everything is hot, and serve immediately.",
      "Cool leftovers quickly and refrigerate."
    ]
  },
  "afford-milky-oats": {
    "ings": [
      [
        "Oats",
        60,
        "g"
      ],
      [
        "Milk",
        300,
        "ml"
      ],
      [
        "Banana",
        0.5,
        "piece"
      ]
    ],
    "servings": 1,
    "steps": [
      "Simmer the oats and milk together for 5–7 minutes, stirring.",
      "Slice the banana over the porridge."
    ]
  },
  "afford-cottage-oats": {
    "ings": [
      [
        "Oats",
        50,
        "g"
      ],
      [
        "Milk",
        200,
        "ml"
      ],
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Apple",
        0.5,
        "piece"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix the oats, milk and cottage cheese in a lidded container.",
      "Chop and stir in the apple. Refrigerate overnight, then stir before eating.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "afford-cottage-pancakes": {
    "ings": [
      [
        "Oats",
        40,
        "g"
      ],
      [
        "Cottage cheese",
        200,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Milk",
        150,
        "ml"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Blend or mash the oats, cottage cheese, egg and milk into a batter.",
      "Use the measured oil in a non-stick pan.",
      "Cook small pancakes on both sides until the egg is fully cooked.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-tomato-egg-toast": {
    "ings": [
      [
        "Eggs",
        3,
        "piece"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Toast the bread and chop the tomato.",
      "Beat the eggs and cook gently in a non-stick pan until fully set.",
      "Use the measured oil to soften the tomato, then serve with the scrambled eggs on toast."
    ]
  },
  "afford-bean-egg-breakfast": {
    "ings": [
      [
        "Kidney beans",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Heat the kidney beans with the tomatoes for 5 minutes.",
      "Toast the bread. Poach or scramble the eggs until set, then serve with the beans.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid."
    ]
  },
  "afford-spinach-cottage-omelette": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Cottage cheese",
        120,
        "g"
      ],
      [
        "Spinach",
        60,
        "g"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Wilt the spinach in a pan with the measured oil.",
      "Beat the eggs with the cottage cheese, pour over the spinach and cook until fully set.",
      "Serve with toast. Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-peanut-milk-oats": {
    "ings": [
      [
        "Oats",
        55,
        "g"
      ],
      [
        "Milk",
        250,
        "ml"
      ],
      [
        "Peanut butter",
        15,
        "g"
      ],
      [
        "Banana",
        0.5,
        "piece"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the oats in the milk, stirring until creamy.",
      "Stir through the peanut butter and top with sliced banana."
    ]
  },
  "afford-cottage-apple-toast": {
    "ings": [
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Apple",
        1,
        "piece"
      ],
      [
        "Cinnamon",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Toast the bread and spread with cottage cheese.",
      "Core and thinly slice the apple. Add it to the toast and finish with cinnamon.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-egg-potato-hash": {
    "ings": [
      [
        "Eggs",
        3,
        "piece"
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Dice the potato and microwave until almost tender.",
      "Pan-fry it in the measured oil with the frozen vegetables until hot throughout.",
      "Beat in the eggs and cook until fully set."
    ]
  },
  "afford-cottage-banana-bowl": {
    "ings": [
      [
        "Cottage cheese",
        200,
        "g"
      ],
      [
        "Oats",
        35,
        "g"
      ],
      [
        "Banana",
        1,
        "piece"
      ],
      [
        "Milk",
        100,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix the cottage cheese, oats and milk.",
      "Top with sliced banana; let the oats soften for 10 minutes, or refrigerate overnight.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "afford-savoury-oats": {
    "ings": [
      [
        "Oats",
        50,
        "g"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Frozen peas",
        80,
        "g"
      ],
      [
        "Cottage cheese",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Simmer the oats with water and peas until the peas are piping hot.",
      "Beat in the eggs over low heat and stir until fully cooked.",
      "Remove from heat and fold through the cottage cheese.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-tomato-cottage-wrap": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        "piece"
      ],
      [
        "Tomato",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Beat the eggs and cook gently in a non-stick pan until fully set.",
      "Warm the wrap. Fill with the cooked eggs, cottage cheese and chopped tomato, then roll up.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-cocoa-cottage-oats": {
    "ings": [
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Milk",
        200,
        "ml"
      ],
      [
        "Oats",
        45,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Stir the cocoa into the milk, then mix with the oats and cottage cheese.",
      "Refrigerate overnight, or leave for 15 minutes to soften before eating.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "afford-mushroom-eggs": {
    "ings": [
      [
        "Eggs",
        3,
        "piece"
      ],
      [
        "Mushrooms",
        150,
        "g"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Slice the mushrooms and cook in the measured oil until tender. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Beat the eggs and cook gently in a non-stick pan until fully set.",
      "Serve the eggs and mushrooms with toasted bread."
    ]
  },
  "afford-lentil-breakfast": {
    "ings": [
      [
        "Red lentils",
        40,
        "g"
      ],
      [
        "Chopped tomatoes",
        120,
        "g"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ]
    ],
    "servings": 1,
    "steps": [
      "Rinse the dry red lentils. Simmer in water for 15–20 minutes, or until soft, following the packet instructions.",
      "Stir the tomatoes into the drained lentils and heat through.",
      "Poach the eggs until the whites are set.",
      "Serve over the lentils with toast. Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-skyr-banana-oats": {
    "ings": [
      [
        "Skyr yoghurt",
        200,
        "g"
      ],
      [
        "Oats",
        45,
        "g"
      ],
      [
        "Banana",
        1,
        "piece"
      ],
      [
        "Milk",
        100,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Stir the Skyr, oats and milk together.",
      "Add sliced banana. Eat after the oats soften or refrigerate overnight.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "afford-chicken-lentil-soup": {
    "ings": [
      [
        "Chicken breast",
        120,
        "g"
      ],
      [
        "Red lentils",
        50,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Onion",
        50,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Dice the chicken, carrot and onion.",
      "Soften the onion in the measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add chicken, rinsed lentils, carrot, tomatoes and enough water to cover.",
      "Simmer for 20–25 minutes until the lentils are soft and chicken is fully cooked.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-chicken-pea-rice": {
    "ings": [
      [
        "Chicken breast",
        150,
        "g"
      ],
      [
        "Rice",
        55,
        "g"
      ],
      [
        "Frozen peas",
        120,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cut the chicken into small pieces and cook in the measured oil until fully cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add the peas and a splash of water to the chicken; cook until piping hot.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve over the rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-tuna-bean-jacket": {
    "ings": [
      [
        "Tuna",
        120,
        "g"
      ],
      [
        "Cannellini beans",
        100,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Cottage cheese",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato and microwave or bake until tender.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Mix the tuna, cannellini beans and cottage cheese.",
      "Split the hot potato and add the filling.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-egg-cottage-sandwich": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Carrot",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil the eggs until fully set, then cool and peel.",
      "Mash the eggs with cottage cheese and sandwich between the bread.",
      "Serve with carrot sticks. Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-lentil-tomato-pasta": {
    "ings": [
      [
        "Red lentils",
        65,
        "g"
      ],
      [
        "Pasta",
        55,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Onion",
        50,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Soften diced onion and grated carrot in the measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add rinsed lentils, tomatoes and water.",
      "Simmer until the lentils are soft. Mix with the cooked pasta.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-tofu-pea-rice": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Frozen peas",
        120,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Dice the tofu and brown it in the measured oil.",
      "Add peas and soy sauce; heat until the peas are fully cooked.",
      "Serve over rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-chickpea-cottage-salad": {
    "ings": [
      [
        "Chickpeas",
        130,
        "g"
      ],
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Grate the carrot and chop the cucumber.",
      "Mix with the chickpeas and cottage cheese.",
      "Serve with toasted bread. Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-chicken-cottage-potato": {
    "ings": [
      [
        "Chicken breast",
        150,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Frozen peas",
        80,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato and microwave or bake until tender.",
      "Cut the chicken into small pieces and cook in the measured oil until fully cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Cook the peas until piping hot. Mix with cooked chicken and cottage cheese, then spoon into the split potato.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-tuna-pea-pasta": {
    "ings": [
      [
        "Tuna",
        130,
        "g"
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Frozen peas",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Heat the tomatoes and peas until fully cooked, then add tuna.",
      "Stir into the pasta. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-bean-egg-wrap": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Kidney beans",
        100,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        "piece"
      ],
      [
        "Chopped tomatoes",
        100,
        "g"
      ],
      [
        "Cottage cheese",
        60,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Heat the beans with the tomatoes. Scramble the eggs until fully set.",
      "Warm the wrap and fill with the beans, eggs and cottage cheese.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-beef-lentil-rice": {
    "ings": [
      [
        "5% beef mince",
        100,
        "g"
      ],
      [
        "Red lentils",
        40,
        "g"
      ],
      [
        "Rice",
        45,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Brown the mince in a non-stick pan, breaking it up, until fully cooked with no pink remaining. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add rinsed lentils, tomatoes, vegetables and water to the mince.",
      "Simmer until the lentils are tender.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve with rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-turkey-bean-potato": {
    "ings": [
      [
        "Turkey mince",
        120,
        "g"
      ],
      [
        "Kidney beans",
        100,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato and microwave or bake until tender.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Brown the mince in a non-stick pan, breaking it up, until fully cooked with no pink remaining. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add the kidney beans and tomatoes to the cooked turkey.",
      "Simmer for 10 minutes, then serve in the potato.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-cottage-lentil-bowl": {
    "ings": [
      [
        "Lentils",
        150,
        "g"
      ],
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain lentils before weighing the listed amounts. Rinse canned beans and chickpeas. Lentils listed without “red” use a ready-cooked/drained weight, not dry lentils.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Heat the lentils and vegetables until piping hot.",
      "Fold in the cottage cheese off the heat and serve with toasted bread.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-chicken-bean-wrap": {
    "ings": [
      [
        "Chicken breast",
        120,
        "g"
      ],
      [
        "Cannellini beans",
        100,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        "piece"
      ],
      [
        "Carrot",
        80,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Cut the chicken into small pieces and cook in the measured oil until fully cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Mash the cannellini beans, grate the carrot and warm the wrap.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Fill with the chicken, beans and carrot.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-tofu-chickpea-pasta": {
    "ings": [
      [
        "Firm tofu",
        150,
        "g"
      ],
      [
        "Chickpeas",
        80,
        "g"
      ],
      [
        "Pasta",
        55,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Crumble the tofu into the tomatoes with the chickpeas.",
      "Simmer for 10 minutes, then stir into the pasta.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-tuna-lentil-toast": {
    "ings": [
      [
        "Tuna",
        120,
        "g"
      ],
      [
        "Lentils",
        120,
        "g"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Tomato",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain lentils, canned tuna before weighing the listed amounts. Rinse canned beans and chickpeas. Lentils listed without “red” use a ready-cooked/drained weight, not dry lentils.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Mix the tuna and lentils with chopped tomato.",
      "Toast the bread and spoon the filling over it.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-chicken-lentil-curry": {
    "ings": [
      [
        "Chicken breast",
        140,
        "g"
      ],
      [
        "Red lentils",
        50,
        "g"
      ],
      [
        "Rice",
        40,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ],
      [
        "Curry powder",
        0.5,
        "tsp"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cut the chicken into small pieces and cook in the measured oil until fully cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Stir in curry powder, rinsed lentils, tomatoes, vegetables and water.",
      "Simmer until the lentils and chicken are fully cooked.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve with rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-chicken-pea-potatoes": {
    "ings": [
      [
        "Chicken breast",
        160,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Frozen peas",
        120,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cut the potato and carrot into small chunks.",
      "Microwave or boil until almost tender.",
      "Roast the vegetables with measured oil at 200°C, adding chicken pieces and cooking until fully cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Boil the peas and serve alongside. Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-chicken-cottage-pasta": {
    "ings": [
      [
        "Chicken breast",
        140,
        "g"
      ],
      [
        "Pasta",
        60,
        "g"
      ],
      [
        "Cottage cheese",
        120,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Cut the chicken into small pieces and cook in the measured oil until fully cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Cook the vegetables until piping hot.",
      "Combine chicken, vegetables and pasta, then stir in cottage cheese off the heat.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-tuna-bean-bake": {
    "ings": [
      [
        "Tuna",
        140,
        "g"
      ],
      [
        "Cannellini beans",
        100,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Cottage cheese",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato and microwave or bake until tender.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Slice the potato into an oven dish with tuna, beans and tomatoes.",
      "Spoon cottage cheese on top and bake at 200°C until bubbling and hot throughout."
    ]
  },
  "afford-tuna-lentil-stew": {
    "ings": [
      [
        "Tuna",
        130,
        "g"
      ],
      [
        "Red lentils",
        50,
        "g"
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Dice the potato and carrot. Simmer with rinsed lentils, tomatoes and enough water to cover until all are tender.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Stir in the tuna and heat through. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-turkey-lentil-bolognese": {
    "ings": [
      [
        "Turkey mince",
        120,
        "g"
      ],
      [
        "Red lentils",
        40,
        "g"
      ],
      [
        "Pasta",
        60,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Brown the mince in a non-stick pan, breaking it up, until fully cooked with no pink remaining. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add grated carrot, lentils, tomatoes and water to the turkey.",
      "Simmer until the lentils are soft. Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Serve over pasta. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-beef-bean-chilli": {
    "ings": [
      [
        "5% beef mince",
        120,
        "g"
      ],
      [
        "Kidney beans",
        120,
        "g"
      ],
      [
        "Rice",
        45,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Brown the mince in a non-stick pan, breaking it up, until fully cooked with no pink remaining. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add grated carrot, kidney beans, tomatoes and paprika.",
      "Simmer for 15 minutes and serve with rice.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-beef-lentil-mash": {
    "ings": [
      [
        "5% beef mince",
        110,
        "g"
      ],
      [
        "Red lentils",
        40,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Frozen peas",
        80,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil and mash the potato. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Brown the mince in a non-stick pan, breaking it up, until fully cooked with no pink remaining. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add grated carrot, lentils, peas, tomatoes and water.",
      "Simmer until tender. Put in an oven dish, top with mash and bake until hot throughout.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-chickpea-lentil-curry": {
    "ings": [
      [
        "Chickpeas",
        130,
        "g"
      ],
      [
        "Red lentils",
        60,
        "g"
      ],
      [
        "Rice",
        35,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Curry powder",
        0.5,
        "tsp"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Soften grated carrot in the measured oil.",
      "Add curry powder, rinsed lentils, tomatoes and water.",
      "Simmer until tender, stir in chickpeas and heat through.",
      "Serve with rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-lentil-bean-chilli": {
    "ings": [
      [
        "Red lentils",
        60,
        "g"
      ],
      [
        "Kidney beans",
        130,
        "g"
      ],
      [
        "Rice",
        40,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Simmer the rinsed lentils, tomatoes, paprika and vegetables with water until tender.",
      "Add kidney beans and heat thoroughly.",
      "Serve with rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-tofu-lentil-curry": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Red lentils",
        45,
        "g"
      ],
      [
        "Rice",
        35,
        "g"
      ],
      [
        "Chopped tomatoes",
        180,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ],
      [
        "Curry powder",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Simmer the lentils, tomatoes, vegetables and curry powder with water until the lentils are tender.",
      "Add cubed tofu and heat through. Serve with rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-tofu-egg-rice": {
    "ings": [
      [
        "Firm tofu",
        150,
        "g"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Frozen peas",
        100,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Dice the tofu and pan-fry in the measured oil.",
      "Add peas and cook until hot. Beat in the eggs and stir until fully set.",
      "Add rice and soy sauce, heating everything through.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-egg-lentil-skillet": {
    "ings": [
      [
        "Firm tofu",
        150,
        "g"
      ],
      [
        "Red lentils",
        45,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Rice",
        35,
        "g"
      ],
      [
        "Curry powder",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Simmer rinsed lentils, grated carrot, tomatoes, curry powder and water until the lentils are tender.",
      "Add cubed tofu and heat through. Serve with the cooked rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-cottage-pea-pasta": {
    "ings": [
      [
        "Cottage cheese",
        200,
        "g"
      ],
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Frozen peas",
        150,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Boil the peas until fully cooked and chop the tomato.",
      "Mix hot pasta and peas with cottage cheese off the heat.",
      "Fold in the tomato and serve. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-bean-cottage-potato": {
    "ings": [
      [
        "Cannellini beans",
        150,
        "g"
      ],
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prick the potato and microwave or bake until tender.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Heat the beans and vegetables until piping hot.",
      "Spoon over the potato and add the cottage cheese."
    ]
  },
  "afford-chicken-bean-chilli": {
    "ings": [
      [
        "Chicken breast",
        130,
        "g"
      ],
      [
        "Kidney beans",
        130,
        "g"
      ],
      [
        "Rice",
        45,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Cut the chicken into small pieces and cook in the measured oil until fully cooked through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add kidney beans, tomatoes and paprika to the chicken.",
      "Simmer for 10 minutes and serve with rice.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-turkey-pea-rice": {
    "ings": [
      [
        "Turkey mince",
        150,
        "g"
      ],
      [
        "Rice",
        55,
        "g"
      ],
      [
        "Frozen peas",
        150,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Brown the mince in a non-stick pan, breaking it up, until fully cooked with no pink remaining. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add grated carrot and peas to the turkey.",
      "Cook until piping hot, then stir in the cooked rice and soy sauce.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-pork-bean-potatoes": {
    "ings": [
      [
        "Lean pork",
        150,
        "g"
      ],
      [
        "Cannellini beans",
        100,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil or microwave diced potato and carrot until tender. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Cut pork into thin strips and cook through in the measured oil.",
      "Add beans and vegetables and heat thoroughly.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-lentil-mushroom-pasta": {
    "ings": [
      [
        "Red lentils",
        70,
        "g"
      ],
      [
        "Pasta",
        55,
        "g"
      ],
      [
        "Mushrooms",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        200,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Slice mushrooms and soften in the measured oil. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Add rinsed lentils, tomatoes and water; simmer until soft.",
      "Stir through the cooked pasta. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-tuna-cottage-rice": {
    "ings": [
      [
        "Tuna",
        130,
        "g"
      ],
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Frozen peas",
        120,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Boil the peas until cooked. Mix tuna and peas into the rice and fold in cottage cheese off the heat.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "afford-cottage-apple-snack": {
    "ings": [
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Apple",
        1,
        "piece"
      ]
    ],
    "servings": 1,
    "steps": [
      "Core and slice the apple.",
      "Serve with cottage cheese.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-milk-banana-snack": {
    "ings": [
      [
        "Milk",
        300,
        "ml"
      ],
      [
        "Banana",
        1,
        "piece"
      ]
    ],
    "servings": 1,
    "steps": [
      "Measure the milk into a clean glass and keep the remainder refrigerated according to its pack.",
      "Peel the banana and serve alongside the milk. No additional sweetener or toppings are included."
    ]
  },
  "afford-eggs-carrot-snack": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Carrot",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil the eggs until fully set, then cool and peel.",
      "Cut the carrots into sticks and serve with the eggs."
    ]
  },
  "afford-cottage-peanut-toast": {
    "ings": [
      [
        "Cottage cheese",
        120,
        "g"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ],
      [
        "Peanut butter",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Toast the bread, spread with peanut butter and top with cottage cheese.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-cottage-cocoa-snack": {
    "ings": [
      [
        "Cottage cheese",
        180,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Blend or stir the cottage cheese with the milk and cocoa powder.",
      "Chill if preferred.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-skyr-apple-snack": {
    "ings": [
      [
        "Skyr yoghurt",
        200,
        "g"
      ],
      [
        "Apple",
        0.5,
        "piece"
      ],
      [
        "Cinnamon",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Chop the apple and fold into Skyr.",
      "Sprinkle with cinnamon.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-pea-cottage-toast": {
    "ings": [
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Frozen peas",
        80,
        "g"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil the peas until cooked.",
      "Mash with cottage cheese and spoon onto toast.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-chickpea-dip": {
    "ings": [
      [
        "Chickpeas",
        100,
        "g"
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Carrot",
        150,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Mash the chickpeas and cottage cheese into a thick dip.",
      "Serve with carrot sticks. Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-egg-cottage-pot": {
    "ings": [
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil the egg until fully set, then cool, peel and chop.",
      "Mix with cottage cheese and serve with cucumber slices.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "afford-milk-oat-cup": {
    "ings": [
      [
        "Milk",
        300,
        "ml"
      ],
      [
        "Oats",
        25,
        "g"
      ],
      [
        "Cinnamon",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Combine the measured milk, oats and all the cinnamon in a small saucepan over low-medium heat.",
      "Simmer gently for about 4–6 minutes, stirring often, until oats soften and the mixture thickens. Lower the heat if it catches, then serve without extra sugar or milk."
    ]
  },
  "afford-tofu-pea-snack": {
    "ings": [
      [
        "Firm tofu",
        150,
        "g"
      ],
      [
        "Frozen peas",
        80,
        "g"
      ],
      [
        "Soy sauce",
        5,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Cube the tofu and heat in a non-stick pan with a splash of water.",
      "Add peas and soy sauce and cook until piping hot."
    ]
  },
  "afford-bean-tomato-toast": {
    "ings": [
      [
        "Cannellini beans",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        100,
        "g"
      ],
      [
        "Wholemeal bread",
        1,
        "slice"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Heat beans and tomatoes for 5 minutes.",
      "Spoon onto toast."
    ]
  },
  "afford-plant-peanut-porridge": {
    "ings": [
      [
        "Oats",
        65,
        "g"
      ],
      [
        "Peanut butter",
        20,
        "g"
      ],
      [
        "Banana",
        1,
        "piece"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook the oats with water following the packet directions.",
      "Stir in peanut butter and top with sliced banana."
    ]
  },
  "afford-tofu-breakfast-toast": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Frozen peas",
        100,
        "g"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Crumble tofu into a pan with the measured oil and peas.",
      "Heat until the peas are fully cooked.",
      "Add chopped tomato and serve on toasted bread."
    ]
  },
  "afford-chickpea-breakfast-toast": {
    "ings": [
      [
        "Chickpeas",
        180,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Wholemeal bread",
        2,
        "slices"
      ],
      [
        "Paprika",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Mash some chickpeas and simmer all the chickpeas with tomatoes and paprika for 5–7 minutes.",
      "Spoon over toasted bread."
    ]
  },
  "afford-bean-breakfast-bowl": {
    "ings": [
      [
        "Cannellini beans",
        180,
        "g"
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Dice and microwave the potato until tender.",
      "Drain the canned ingredients before weighing the quantity used.",
      "Cook grated carrot in the measured oil.",
      "Add potato and cannellini beans and heat thoroughly."
    ]
  },
  "afford-lentil-savoury-oats": {
    "ings": [
      [
        "Red lentils",
        55,
        "g"
      ],
      [
        "Oats",
        35,
        "g"
      ],
      [
        "Chopped tomatoes",
        150,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Simmer rinsed lentils in water until nearly tender.",
      "Stir in oats, tomatoes and vegetables.",
      "Add water as needed and cook until the oats soften and vegetables are piping hot.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "afford-tofu-potato-breakfast": {
    "ings": [
      [
        "Firm tofu",
        180,
        "g"
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Frozen mixed vegetables",
        120,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Dice and microwave the potato until almost tender.",
      "Brown cubed tofu in measured oil, then add potato and vegetables. Heat everything thoroughly."
    ]
  },
  "afford-apple-peanut-oats": {
    "ings": [
      [
        "Oats",
        60,
        "g"
      ],
      [
        "Peanut butter",
        20,
        "g"
      ],
      [
        "Apple",
        1,
        "piece"
      ],
      [
        "Cinnamon",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Stir oats, peanut butter and cinnamon with enough water to make a thick mixture.",
      "Fold in chopped apple and refrigerate overnight.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "afford-chickpea-carrot-wrap": {
    "ings": [
      [
        "Chickpeas",
        150,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        "piece"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the canned ingredients before weighing the quantity used.",
      "Mash the chickpeas and grate the carrot.",
      "Fill a warmed wrap with chickpeas, carrot and chopped tomato."
    ]
  },
  "world-french-toast": {
    "ings": [
      [
        "Wholemeal bread",
        4,
        "slices"
      ],
      [
        "Eggs",
        2,
        "pieces"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Frozen berries",
        160,
        "g"
      ],
      [
        "Cinnamon",
        1,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Beat the eggs with milk and cinnamon.",
      "Dip each slice of bread into the mixture until coated.",
      "Heat the measured oil in a non-stick pan; cook the soaked bread on both sides until golden and the egg is set.",
      "Cook the berries following their packet instructions and divide everything between the stated servings.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid."
    ]
  },
  "world-scrambled-spinach": {
    "ings": [
      [
        "Eggs",
        4,
        "pieces"
      ],
      [
        "Milk",
        40,
        "ml"
      ],
      [
        "Spinach",
        120,
        "g"
      ],
      [
        "Wholemeal bread",
        4,
        "slices"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Toast the bread. Wilt the spinach in the measured oil over a medium heat.",
      "Beat eggs with milk, add to the spinach and stir gently until fully set. Divide between the toast."
    ]
  },
  "world-huevos-rancheros": {
    "ings": [
      [
        "Eggs",
        4,
        "pieces"
      ],
      [
        "Wholemeal wrap",
        2,
        "pieces"
      ],
      [
        "Black beans",
        240,
        "g"
      ],
      [
        "Chopped tomatoes",
        300,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Ground cumin",
        2,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften diced onion in half the oil, add tomatoes and cumin and simmer for 10 minutes.",
      "Stir in rinsed, drained beans until hot.",
      "Cook the eggs in the remaining oil until set and warm the wraps.",
      "Divide beans, sauce and eggs between the two wraps.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid."
    ]
  },
  "world-menemen": {
    "ings": [
      [
        "Eggs",
        4,
        "pieces"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Frozen mixed peppers",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        300,
        "g"
      ],
      [
        "Wholemeal bread",
        4,
        "slices"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften diced onion and peppers in the oil for 7 minutes.",
      "Add tomatoes and simmer until the sauce thickens.",
      "Beat the eggs, pour into the vegetables and stir over a gentle heat until set.",
      "Serve with the toasted bread. Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid."
    ]
  },
  "world-lentil-soup": {
    "ings": [
      [
        "Red lentils",
        240,
        "g"
      ],
      [
        "Carrot",
        300,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        400,
        "g"
      ],
      [
        "Ground cumin",
        3,
        "g"
      ],
      [
        "Water",
        1200,
        "ml"
      ],
      [
        "Wholemeal bread",
        8,
        "slices"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Soften diced onion and carrot in the oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Rinse the dry lentils and add with tomatoes, cumin and water.",
      "Simmer for 25 minutes, stirring occasionally, until the lentils and carrots are tender.",
      "Blend if preferred. Serve the stated servings with the bread.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "world-tuna-salad": {
    "ings": [
      [
        "Tuna",
        240,
        "g"
      ],
      [
        "Natural yoghurt",
        80,
        "g"
      ],
      [
        "Celery",
        80,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Lettuce",
        80,
        "g"
      ],
      [
        "Wholemeal pitta",
        2,
        "pieces"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Drain the tuna. Finely dice celery and onion; mix with tuna, yoghurt and lemon juice.",
      "Warm the pittas, fill with lettuce and divide the tuna mixture evenly.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "world-greek-chickpea": {
    "ings": [
      [
        "Chickpeas",
        240,
        "g"
      ],
      [
        "Tomato",
        250,
        "g"
      ],
      [
        "Cucumber",
        200,
        "g"
      ],
      [
        "Feta cheese",
        80,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Olive oil",
        10,
        "g"
      ],
      [
        "Lemon juice",
        20,
        "ml"
      ],
      [
        "Wholemeal pitta",
        2,
        "pieces"
      ]
    ],
    "servings": 2,
    "steps": [
      "Rinse and drain the chickpeas.",
      "Chop cucumber, tomatoes and onion; combine with chickpeas and crumble over feta.",
      "Dress with the measured oil and lemon juice and serve with warmed pittas."
    ]
  },
  "world-gazpacho": {
    "ings": [
      [
        "Tomato",
        500,
        "g"
      ],
      [
        "Cucumber",
        200,
        "g"
      ],
      [
        "Frozen mixed peppers",
        100,
        "g"
      ],
      [
        "Garlic",
        3,
        "g"
      ],
      [
        "Lemon juice",
        20,
        "ml"
      ],
      [
        "Olive oil",
        10,
        "g"
      ],
      [
        "Cannellini beans",
        240,
        "g"
      ],
      [
        "Wholemeal bread",
        4,
        "slices"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook the frozen peppers following their packet instructions and cool them.",
      "Blend tomatoes, cucumber, peppers, garlic, lemon juice and oil until smooth; chill if preferred.",
      "Rinse and drain the beans, divide between the stated servings and pour over the soup. Serve with toast."
    ]
  },
  "world-pasta-fagioli": {
    "ings": [
      [
        "Pasta",
        200,
        "g"
      ],
      [
        "Cannellini beans",
        480,
        "g"
      ],
      [
        "Chopped tomatoes",
        400,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Celery",
        150,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Dried mixed herbs",
        3,
        "g"
      ],
      [
        "Water",
        1000,
        "ml"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Dice the vegetables and soften in the oil for 8 minutes.",
      "Add crushed garlic, tomatoes, herbs and water.",
      "Simmer for 10 minutes, add dry pasta and cook for its packet time.",
      "Add rinsed, drained beans and heat through.",
      "Divide into the stated servings. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "world-potato-soup": {
    "ings": [
      [
        "Potato",
        800,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Milk",
        400,
        "ml"
      ],
      [
        "Water",
        600,
        "ml"
      ],
      [
        "Natural yoghurt",
        160,
        "g"
      ],
      [
        "Wholemeal bread",
        8,
        "slices"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Soften chopped onion in the oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add peeled, diced potatoes and water; simmer for 20 minutes until tender.",
      "Blend with milk, return to a gentle heat and stir in yoghurt without boiling.",
      "Divide into the stated servings and serve with bread."
    ]
  },
  "world-mushroom-soup": {
    "ings": [
      [
        "Mushrooms",
        600,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Cannellini beans",
        480,
        "g"
      ],
      [
        "Milk",
        300,
        "ml"
      ],
      [
        "Water",
        600,
        "ml"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ],
      [
        "Wholemeal bread",
        8,
        "slices"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Drain cannellini beans before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Soften onion and sliced mushrooms in the oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Add garlic, herbs, rinsed beans and water; simmer for 15 minutes.",
      "Blend roughly, add milk and heat through without boiling.",
      "Serve the stated servings with bread."
    ]
  },
  "world-couscous-salad": {
    "ings": [
      [
        "Couscous",
        120,
        "g"
      ],
      [
        "Chickpeas",
        240,
        "g"
      ],
      [
        "Tomato",
        200,
        "g"
      ],
      [
        "Cucumber",
        150,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Lemon juice",
        30,
        "ml"
      ],
      [
        "Olive oil",
        10,
        "g"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ],
      [
        "Water",
        150,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Drain chickpeas before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the packet ratio, cover for the stated standing time, then fluff thoroughly with a fork.",
      "Fluff and cool. Dice the vegetables and stir into couscous with rinsed chickpeas, herbs, lemon juice and oil. Divide into the stated servings."
    ]
  },
  "world-potato-egg-salad": {
    "ings": [
      [
        "Potato",
        500,
        "g"
      ],
      [
        "Eggs",
        4,
        "pieces"
      ],
      [
        "Natural yoghurt",
        100,
        "g"
      ],
      [
        "Mustard",
        15,
        "g"
      ],
      [
        "Celery",
        80,
        "g"
      ],
      [
        "Onion",
        40,
        "g"
      ],
      [
        "Lettuce",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Boil diced potatoes until tender, drain and cool. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Boil eggs until the whites and yolks are set, peel and quarter.",
      "Mix yoghurt with mustard and diced celery and onion.",
      "Fold through potatoes and eggs; serve on lettuce."
    ]
  },
  "world-croque": {
    "ings": [
      [
        "Wholemeal bread",
        4,
        "slices"
      ],
      [
        "Lean ham",
        120,
        "g"
      ],
      [
        "Cheddar",
        60,
        "g"
      ],
      [
        "Mustard",
        10,
        "g"
      ],
      [
        "Milk",
        40,
        "ml"
      ],
      [
        "Eggs",
        1,
        "pieces"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Mixed salad",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Spread mustard on bread and sandwich the ham and cheddar between the slices.",
      "Beat egg with milk; lightly coat both sides of each sandwich.",
      "Heat the oil and cook the sandwiches gently on both sides until the egg is set and cheese melted.",
      "Serve with salad. Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid."
    ]
  },
  "world-tzatziki-pitta": {
    "ings": [
      [
        "0% Greek yoghurt",
        180,
        "g"
      ],
      [
        "Cucumber",
        200,
        "g"
      ],
      [
        "Garlic",
        3,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ],
      [
        "Dried dill",
        1,
        "g"
      ],
      [
        "Chickpeas",
        240,
        "g"
      ],
      [
        "Wholemeal pitta",
        2,
        "pieces"
      ],
      [
        "Tomato",
        150,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Grate cucumber and squeeze out excess water.",
      "Mix with yoghurt, crushed garlic, lemon juice and dill.",
      "Rinse and drain chickpeas; warm pittas and fill with chickpeas, diced tomato and the yoghurt mixture.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "world-quesadilla": {
    "ings": [
      [
        "Wholemeal wrap",
        2,
        "pieces"
      ],
      [
        "Black beans",
        240,
        "g"
      ],
      [
        "Spinach",
        100,
        "g"
      ],
      [
        "Cheddar",
        60,
        "g"
      ],
      [
        "Tomato",
        150,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Rinse and drain beans and mash lightly.",
      "Wilt spinach, drain well and mix with beans and diced tomatoes.",
      "Fill one half of each wrap with the mixture and grated cheese, fold and cook in the measured oil on both sides until crisp and hot."
    ]
  },
  "world-aloo-gobi": {
    "ings": [
      [
        "Cauliflower",
        400,
        "g"
      ],
      [
        "Potato",
        600,
        "g"
      ],
      [
        "Chickpeas",
        480,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        400,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Curry powder",
        10,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Drain chickpeas before weighing the listed amounts; rinse canned beans and chickpeas and use clean utensils for ready-to-eat ingredients.",
      "Dice potatoes and split cauliflower into small florets.",
      "Soften onion in oil, add garlic and curry powder and stir for 1 minute.",
      "Add tomatoes and potatoes with a splash of tap water.",
      "Simmer covered for 15 minutes; add cauliflower and rinsed chickpeas and cook until vegetables are tender. Divide into the stated servings."
    ]
  },
  "world-chana": {
    "ings": [
      [
        "Chickpeas",
        720,
        "g"
      ],
      [
        "Chopped tomatoes",
        600,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Ground cumin",
        4,
        "g"
      ],
      [
        "Curry powder",
        8,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Soften diced onion in oil, add garlic and ground cumin / curry powder and stir for 1 minute.",
      "Add tomatoes and simmer for 15 minutes.",
      "Stir in rinsed, drained chickpeas and heat thoroughly; divide with the rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-mejadra": {
    "ings": [
      [
        "Lentils",
        600,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Onion",
        400,
        "g"
      ],
      [
        "Ground cumin",
        4,
        "g"
      ],
      [
        "Olive oil",
        20,
        "g"
      ],
      [
        "Cucumber",
        300,
        "g"
      ],
      [
        "Natural yoghurt",
        200,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Drain lentils before weighing the listed amounts. Rinse canned beans and chickpeas. Lentils listed without “red” use a ready-cooked/drained weight, not dry lentils.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Slowly brown thinly sliced onion in the oil for 20 minutes, stirring often.",
      "Rinse and drain cooked canned lentils, heat with cumin and stir through rice and half the onions.",
      "Top with the rest and serve with cucumber and yoghurt.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-dal": {
    "ings": [
      [
        "Red lentils",
        280,
        "g"
      ],
      [
        "Spinach",
        250,
        "g"
      ],
      [
        "Chopped tomatoes",
        400,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Curry powder",
        8,
        "g"
      ],
      [
        "Rice",
        200,
        "g"
      ],
      [
        "Water",
        900,
        "ml"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook dry rice separately. Soften diced onion in oil, stir in garlic and curry powder, then add rinsed dry lentils, tomatoes and water. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Simmer for 25 minutes until lentils are soft, adding tap water if needed.",
      "Stir in spinach until wilted; divide with rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-japanese-curry": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Potato",
        400,
        "g"
      ],
      [
        "Carrot",
        300,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Curry sauce",
        400,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Dice the chicken and vegetables; soften onion in oil then brown the chicken.",
      "Add potatoes, carrot and curry sauce with a splash of tap water.",
      "Simmer covered until the vegetables are tender and chicken cooked through.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Divide with rice. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-bibimbap": {
    "ings": [
      [
        "5% Beef mince",
        400,
        "g"
      ],
      [
        "Eggs",
        4,
        "pieces"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Spinach",
        200,
        "g"
      ],
      [
        "Mushrooms",
        200,
        "g"
      ],
      [
        "Soy sauce",
        40,
        "ml"
      ],
      [
        "Hot sauce",
        20,
        "ml"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook dry rice. Use half the oil to cook sliced carrots, mushrooms and spinach in separate batches. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Brown the mince and stir in soy sauce; Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Cook the eggs in the remaining oil until set.",
      "Divide rice, vegetables, mince and eggs between the stated servings; add the measured hot sauce and mix before eating.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-kung-pao": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Frozen mixed peppers",
        300,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Peanut butter",
        40,
        "g"
      ],
      [
        "Soy sauce",
        40,
        "ml"
      ],
      [
        "Chilli flakes",
        2,
        "g"
      ],
      [
        "Honey",
        20,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Measure the listed chilli flakes before starting and distribute it evenly through the cooked filling or sauce; keep it within the ingredient amount shown.",
      "Cook dry rice. Mix soy sauce, peanut butter and honey with a little warm tap water. Stir in hot water a spoonful at a time until smooth and pourable; use all the measured peanut butter rather than adding an extra drizzle.",
      "Stir-fry diced chicken in oil, add onion, peppers, garlic and chilli and cook until tender. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Stir in sauce and heat through; divide with rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-sweet-sour": {
    "ings": [
      [
        "Lean pork",
        600,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Pineapple",
        200,
        "g"
      ],
      [
        "Frozen mixed peppers",
        300,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Passata",
        200,
        "g"
      ],
      [
        "Lemon juice",
        30,
        "ml"
      ],
      [
        "Soy sauce",
        30,
        "ml"
      ],
      [
        "Honey",
        25,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook dry rice. Mix passata, lemon juice, soy sauce and honey for the sauce.",
      "Stir-fry diced pork in oil, add onion and peppers and cook until pork is fully cooked.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Add pineapple and sauce, simmer until hot and serve with rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-teriyaki": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Broccoli",
        400,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Teriyaki sauce",
        100,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook dry rice and steam broccoli and sliced carrot until tender.",
      "Brown sliced chicken in the oil, continue cooking until fully cooked, then stir in teriyaki sauce and heat through. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Divide chicken, vegetables and rice into the stated servings.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-fried-rice": {
    "ings": [
      [
        "Rice",
        280,
        "g"
      ],
      [
        "Eggs",
        6,
        "pieces"
      ],
      [
        "Frozen mixed vegetables",
        500,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Soy sauce",
        40,
        "ml"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Beat the eggs; cook in half the oil, then remove from the pan.",
      "Use the remaining oil to stir-fry onion, garlic and vegetables until tender. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add rice, cooked eggs and soy sauce; heat thoroughly and serve immediately.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-pad-thai": {
    "ings": [
      [
        "Noodles",
        240,
        "g"
      ],
      [
        "Chicken breast",
        500,
        "g"
      ],
      [
        "Eggs",
        2,
        "pieces"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Frozen mixed peppers",
        200,
        "g"
      ],
      [
        "Peanut butter",
        40,
        "g"
      ],
      [
        "Soy sauce",
        40,
        "ml"
      ],
      [
        "Lemon juice",
        30,
        "ml"
      ],
      [
        "Honey",
        20,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook the weighed dry noodles following their packet time, then drain. Loosen with a splash of water if they stick; do not add unlisted oil.",
      "Mix peanut butter, soy sauce, lemon juice and honey with a little tap water. Stir in hot water a spoonful at a time until smooth and pourable; use all the measured peanut butter rather than adding an extra drizzle.",
      "Stir-fry sliced chicken and vegetables in oil until fully cooked. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Push aside, scramble eggs until set, then mix with noodles and sauce and heat through.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "world-chilli": {
    "ings": [
      [
        "5% Beef mince",
        500,
        "g"
      ],
      [
        "Kidney beans",
        480,
        "g"
      ],
      [
        "Chopped tomatoes",
        600,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Ground cumin",
        4,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Chilli flakes",
        2,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook dry rice separately. Soften onion in oil, add mince and brown thoroughly.",
      "Stir in garlic and paprika / ground cumin / chilli flakes.",
      "Add tomatoes and rinsed, drained beans; simmer for 25 minutes.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Divide into the stated servings with rice.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-bolognese": {
    "ings": [
      [
        "5% Beef mince",
        500,
        "g"
      ],
      [
        "Pasta",
        280,
        "g"
      ],
      [
        "Passata",
        600,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Celery",
        150,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Dried mixed herbs",
        3,
        "g"
      ],
      [
        "Parmesan",
        40,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Dice onion, carrot and celery and soften in oil.",
      "Brown the mince, stir in garlic and herbs, add passata and simmer for 25 minutes.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Drain, divide between the stated servings and top with sauce and parmesan.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "world-spaghetti-meatballs": {
    "ings": [
      [
        "Turkey mince",
        600,
        "g"
      ],
      [
        "Pasta",
        280,
        "g"
      ],
      [
        "Eggs",
        1,
        "pieces"
      ],
      [
        "Wholemeal bread",
        1,
        "slices"
      ],
      [
        "Passata",
        600,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Dried mixed herbs",
        3,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Crumble the bread finely and mix with turkey, egg and half the herbs; shape into 16 small meatballs.",
      "Brown in half the oil. Soften diced onion and garlic in the remaining oil, add passata and herbs, then simmer meatballs in the sauce until fully cooked. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Cook dry pasta separately and serve.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "world-swedish-meatballs": {
    "ings": [
      [
        "Turkey mince",
        600,
        "g"
      ],
      [
        "Eggs",
        1,
        "pieces"
      ],
      [
        "Wholemeal bread",
        1,
        "slices"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Milk",
        200,
        "ml"
      ],
      [
        "Light cream cheese",
        80,
        "g"
      ],
      [
        "Potato",
        800,
        "g"
      ],
      [
        "Frozen peas",
        300,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Boil diced potatoes until tender. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Finely chop onion and mix half with turkey, egg and crumbled bread; shape into small meatballs.",
      "Brown meatballs in the oil with the remaining onion, add milk and cream cheese and simmer gently until fully cooked.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Cook peas separately and divide with potatoes.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "world-cottage-pie": {
    "ings": [
      [
        "5% Beef mince",
        500,
        "g"
      ],
      [
        "Potato",
        1000,
        "g"
      ],
      [
        "Carrot",
        250,
        "g"
      ],
      [
        "Frozen peas",
        250,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Passata",
        300,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Dried mixed herbs",
        3,
        "g"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Heat the oven to 200°C. Boil diced potatoes until tender, drain and mash with milk. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Brown mince and onion in oil. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add carrot, passata, herbs and a splash of tap water; simmer until carrot is tender and beef fully cooked.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Stir in peas, place in a baking dish, top with mash and bake until hot throughout and lightly golden."
    ]
  },
  "world-fish-pie": {
    "ings": [
      [
        "Cod fillet",
        600,
        "g"
      ],
      [
        "Potato",
        1000,
        "g"
      ],
      [
        "Frozen peas",
        300,
        "g"
      ],
      [
        "Milk",
        300,
        "ml"
      ],
      [
        "Light cream cheese",
        120,
        "g"
      ],
      [
        "Dried dill",
        2,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Heat oven to 200°C. Boil diced potatoes until tender, drain and mash with 100 ml of the milk. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Gently simmer cod in the remaining milk until cooked and opaque.",
      "Stir in cream cheese, dill and peas, transfer to a baking dish and top with mash.",
      "Bake until piping hot throughout and golden."
    ]
  },
  "world-paella": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Prawns",
        300,
        "g"
      ],
      [
        "Rice",
        280,
        "g"
      ],
      [
        "Frozen mixed peppers",
        300,
        "g"
      ],
      [
        "Frozen peas",
        200,
        "g"
      ],
      [
        "Chopped tomatoes",
        400,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Chicken stock",
        600,
        "ml"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Brown diced chicken and onion in oil, stir in garlic, paprika and dry rice.",
      "Add tomatoes, peppers and stock; simmer gently, covered, until rice is nearly tender.",
      "Add peas and prawns and continue cooking until rice, chicken and prawns are fully cooked, adding tap water if needed.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Serve the stated servings. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-jambalaya": {
    "ings": [
      [
        "Chicken breast",
        400,
        "g"
      ],
      [
        "Turkey sausages",
        4,
        "pieces"
      ],
      [
        "Rice",
        280,
        "g"
      ],
      [
        "Frozen mixed peppers",
        250,
        "g"
      ],
      [
        "Celery",
        150,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Chopped tomatoes",
        400,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Chilli flakes",
        2,
        "g"
      ],
      [
        "Chicken stock",
        600,
        "ml"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Brown diced chicken and sliced sausages in oil.",
      "Add diced onion, celery and peppers and soften; stir in paprika / chilli flakes.",
      "Add dry rice, tomatoes and stock. Cover and simmer until rice is tender and all meat fully cooked, adding tap water if needed.",
      "Cook meat and poultry fully through; use a food thermometer to check the centre reaches 75°C for at least 30 seconds.",
      "Divide into the stated servings. If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-ratatouille": {
    "ings": [
      [
        "Courgette",
        500,
        "g"
      ],
      [
        "Frozen mixed peppers",
        300,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Chopped tomatoes",
        600,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Cannellini beans",
        480,
        "g"
      ],
      [
        "Dried mixed herbs",
        4,
        "g"
      ],
      [
        "Wholemeal bread",
        8,
        "slices"
      ],
      [
        "Olive oil",
        20,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Soften onion, courgette and peppers in the oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Stir in garlic and herbs, add tomatoes and simmer gently for 25 minutes.",
      "Add rinsed, drained beans and heat through.",
      "Divide into the stated servings and serve with bread."
    ]
  },
  "world-kedgeree": {
    "ings": [
      [
        "Cod fillet",
        500,
        "g"
      ],
      [
        "Eggs",
        4,
        "pieces"
      ],
      [
        "Rice",
        280,
        "g"
      ],
      [
        "Frozen peas",
        300,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Curry powder",
        6,
        "g"
      ],
      [
        "Lemon juice",
        25,
        "ml"
      ],
      [
        "Cooking oil",
        10,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook dry rice and boil eggs until fully set.",
      "Poach cod gently in tap water until opaque and cooked through, then drain and flake.",
      "Soften onion in oil, stir in curry powder, cooked rice and peas and heat through. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Fold in fish and lemon juice; serve topped with peeled, quartered eggs.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-rice-pudding": {
    "ings": [
      [
        "Rice",
        120,
        "g"
      ],
      [
        "Skimmed milk",
        700,
        "ml"
      ],
      [
        "Sweetener",
        6,
        "g"
      ],
      [
        "Cinnamon",
        2,
        "g"
      ],
      [
        "Frozen berries",
        200,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Simmer the dry rice with milk, sweetener and cinnamon over a low heat, stirring often, until rice is tender and mixture creamy; add tap water if it becomes too thick.",
      "Cook berries following their packet instructions.",
      "Divide pudding and berries into four servings.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "world-apple-crisp": {
    "ings": [
      [
        "Apple",
        600,
        "g"
      ],
      [
        "Oats",
        100,
        "g"
      ],
      [
        "Cinnamon",
        2,
        "g"
      ],
      [
        "Honey",
        30,
        "g"
      ],
      [
        "Cooking oil",
        15,
        "g"
      ],
      [
        "Natural yoghurt",
        200,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Heat oven to 190°C. Dice apples into a baking dish, add cinnamon and a splash of tap water.",
      "Mix oats with the measured honey and oil, scatter over apples and bake until fruit is soft and topping golden.",
      "Divide into the stated servings with yoghurt."
    ]
  },
  "world-latkes": {
    "ings": [
      [
        "Potato",
        500,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Eggs",
        2,
        "pieces"
      ],
      [
        "Wholemeal bread",
        1,
        "slices"
      ],
      [
        "Cooking oil",
        20,
        "g"
      ],
      [
        "Natural yoghurt",
        160,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 4,
    "steps": [
      "Grate potatoes and onion, squeeze out moisture, then mix with beaten eggs and finely crumbled bread.",
      "Shape into 8 small patties. Use the measured oil to shallow-fry patties gently on both sides until golden and cooked through.",
      "Mix yoghurt with lemon juice; divide patties and dip between four servings."
    ]
  },
  "world-hummus": {
    "ings": [
      [
        "Chickpeas",
        360,
        "g"
      ],
      [
        "Peanut butter",
        30,
        "g"
      ],
      [
        "Lemon juice",
        30,
        "ml"
      ],
      [
        "Garlic",
        3,
        "g"
      ],
      [
        "Olive oil",
        10,
        "g"
      ],
      [
        "Carrot",
        300,
        "g"
      ],
      [
        "Cucumber",
        300,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Rinse and drain chickpeas.",
      "Blend with peanut butter, lemon juice, garlic, oil and a little tap water to a smooth dip.",
      "Cut carrot and cucumber into sticks; divide dip and vegetables between four servings."
    ]
  },
  "lighter-apple-skyr": {
    "ings": [
      [
        "Skyr yoghurt",
        200,
        "g"
      ],
      [
        "Oats",
        30,
        "g"
      ],
      [
        "Apple",
        100,
        "g"
      ],
      [
        "Cinnamon",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Stir oats and cinnamon into the skyr.",
      "Top with diced apple; no extra honey or sugar is added.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "lighter-cottage-berry-pot": {
    "ings": [
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Frozen berries",
        100,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Thaw berries safely according to their packet instructions.",
      "Spoon over cottage cheese and serve.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "everyday-peach-free-apple-toast": {
    "ings": [
      [
        "Wholemeal bread",
        60,
        "g"
      ],
      [
        "Apple",
        120,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Cinnamon",
        0.5,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Chop the apple and microwave with 15 ml water until softened.",
      "Toast the bread. Spoon the yoghurt and apple over the toast, then add the measured cinnamon. No oil or sugar is added.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "everyday-peanut-berry-yoghurt": {
    "ings": [
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Oats",
        35,
        "g"
      ],
      [
        "Frozen berries",
        80,
        "g"
      ],
      [
        "Peanut butter",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Thaw the berries safely following the packet instructions.",
      "Mix the yoghurt, oats and measured peanut butter.",
      "Add berries and let the oats soften for 10 minutes, or refrigerate overnight.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "everyday-yoghurt-cocoa-pot": {
    "ings": [
      [
        "0% Greek yoghurt",
        170,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Peanut butter",
        8,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Stir yoghurt with all the measured cocoa and peanut butter until evenly mixed. No sugar or extra toppings are added.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "everyday-egg-tomato-crackers": {
    "ings": [
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Wholegrain crackers",
        20,
        "g"
      ],
      [
        "Tomato",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Boil the egg until fully set, then cool, peel and slice.",
      "Serve on the crackers with sliced tomato. No butter or mayonnaise is added."
    ]
  },
  "everyday-cottage-apple-peanut": {
    "ings": [
      [
        "Cottage cheese",
        140,
        "g"
      ],
      [
        "Apple",
        100,
        "g"
      ],
      [
        "Peanut butter",
        8,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Core and dice the weighed apple.",
      "Mix peanut butter into cottage cheese and top with apple. No extra sweetener is added.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "everyday-chickpea-cucumber-cup": {
    "ings": [
      [
        "Chickpeas",
        100,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Carrot",
        60,
        "g"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ],
      [
        "Ground cumin",
        0.25,
        "tsp"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain canned beans or fish before weighing the quantity used.",
      "Dice cucumber and grate carrot.",
      "Toss with chickpeas, measured lemon juice and cumin. No oil is added."
    ]
  },
  "simple-tuna-crunch-wrap": {
    "ings": [
      [
        "Tuna",
        150,
        "g"
      ],
      [
        "Wholemeal wrap",
        1,
        "piece"
      ],
      [
        "Carrot",
        60,
        "g"
      ],
      [
        "Cucumber",
        80,
        "g"
      ],
      [
        "Mayonnaise",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain canned beans or fish before weighing the quantity used.",
      "Grate the carrot and finely dice the cucumber.",
      "Mix the drained tuna with all the measured mayonnaise, carrot and cucumber.",
      "Fill the wrap and roll up. Leave a clear border, fold the sides in and roll firmly from the bottom so the filling stays enclosed.",
      "Serve immediately or refrigerate promptly; follow the shortest ingredient storage instruction."
    ]
  },
  "simple-tuna-crunch-salad": {
    "ings": [
      [
        "Tuna",
        200,
        "g"
      ],
      [
        "Carrot",
        100,
        "g"
      ],
      [
        "Cucumber",
        60,
        "g"
      ],
      [
        "Mayonnaise",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain canned beans or fish before weighing the quantity used.",
      "Grate the carrot and chop the cucumber.",
      "Toss with the drained tuna and all the measured mayonnaise.",
      "Serve immediately or refrigerate promptly; follow the shortest ingredient storage instruction. No extra oil or toppings are included."
    ]
  },
  "social-smoothieflip-chocolate-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Chia seeds",
        6,
        "g"
      ],
      [
        "Peanut butter",
        8,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Dark chocolate",
        5,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Banana",
        60,
        "g"
      ],
      [
        "0% Greek yoghurt",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Combine oats, protein, chia, peanut butter, cocoa and milk in a covered jar.",
      "Chill for at least six hours. Stir and top with the measured banana, chocolate and yoghurt.",
      "Keep refrigerated and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-peanut-jar-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Peanut butter",
        15,
        "g"
      ],
      [
        "Banana",
        60,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-strawberry-cheesecake-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Strawberries",
        100,
        "g"
      ],
      [
        "Light cream cheese",
        25,
        "g"
      ],
      [
        "Oat biscuits",
        8,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-blueberry-lemon-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Blueberries",
        80,
        "g"
      ],
      [
        "Lemon juice",
        5,
        "ml"
      ],
      [
        "Honey",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-apple-pie-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Apple",
        100,
        "g"
      ],
      [
        "Cinnamon",
        0.5,
        "g"
      ],
      [
        "Walnuts",
        8,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Measure all the listed cinnamon and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-carrot-cake-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Carrot",
        60,
        "g"
      ],
      [
        "Cinnamon",
        0.5,
        "g"
      ],
      [
        "Walnuts",
        8,
        "g"
      ],
      [
        "Honey",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Measure all the listed cinnamon and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-chocolate-cherry-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Frozen berries",
        90,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Dark chocolate",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-pbj-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Strawberries",
        100,
        "g"
      ],
      [
        "Peanut butter",
        12,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-mango-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Mango",
        100,
        "g"
      ],
      [
        "Lime",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-coffee-free-tiramisu-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Light cream cheese",
        25,
        "g"
      ],
      [
        "Oat biscuits",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-banana-bread-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Banana",
        90,
        "g"
      ],
      [
        "Cinnamon",
        0.5,
        "g"
      ],
      [
        "Walnuts",
        8,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Measure all the listed cinnamon and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-pineapple-oats": {
    "ings": [
      [
        "Oats",
        45,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Milk",
        100,
        "ml"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ],
      [
        "Pineapple",
        110,
        "g"
      ],
      [
        "Honey",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Mix all measured ingredients in a covered food-safe jar, keeping any biscuit or chocolate topping separate if you prefer it crunchy.",
      "Refrigerate at 5°C or below for at least six hours.",
      "Stir, add the measured topping and eat within 48 hours.",
      "Cover and refrigerate at 5°C or below for 6–12 hours to soften the oats or seeds, then stir before eating. Keep chilled and use within 48 hours, or sooner if the dairy pack instructs. Loosen with water if needed; extra milk or toppings are not included."
    ]
  },
  "social-smoothieflip-strawberry-bowl": {
    "ings": [
      [
        "Frozen strawberries",
        225,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Water",
        180,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-smoothieflip-raspberry-mango": {
    "ings": [
      [
        "Frozen raspberries",
        65,
        "g"
      ],
      [
        "Frozen mango",
        120,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Chia seeds",
        2,
        "g"
      ],
      [
        "Water",
        180,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-blueberry-banana-bowl": {
    "ings": [
      [
        "Frozen blueberries",
        100,
        "g"
      ],
      [
        "Frozen banana",
        100,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Chia seeds",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-tropical-bowl": {
    "ings": [
      [
        "Frozen mango",
        100,
        "g"
      ],
      [
        "Frozen pineapple",
        100,
        "g"
      ],
      [
        "Frozen banana",
        60,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-chocolate-peanut-bowl": {
    "ings": [
      [
        "Frozen banana",
        150,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Cocoa powder",
        8,
        "g"
      ],
      [
        "Peanut butter",
        15,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-strawberry-cheesecake-bowl": {
    "ings": [
      [
        "Frozen strawberries",
        150,
        "g"
      ],
      [
        "Frozen banana",
        80,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Light cream cheese",
        25,
        "g"
      ],
      [
        "Oat biscuits",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-green-pineapple-bowl": {
    "ings": [
      [
        "Frozen pineapple",
        160,
        "g"
      ],
      [
        "Frozen banana",
        80,
        "g"
      ],
      [
        "Spinach",
        30,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-raspberry-chocolate-bowl": {
    "ings": [
      [
        "Frozen raspberries",
        120,
        "g"
      ],
      [
        "Frozen banana",
        80,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Cocoa powder",
        5,
        "g"
      ],
      [
        "Dark chocolate",
        5,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-pbj-bowl": {
    "ings": [
      [
        "Frozen strawberries",
        150,
        "g"
      ],
      [
        "Frozen banana",
        80,
        "g"
      ],
      [
        "Unsweetened almond milk",
        120,
        "ml"
      ],
      [
        "Whey protein powder",
        30,
        "g"
      ],
      [
        "Peanut butter",
        15,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Use a blender rated for frozen fruit and ice.",
      "Add the measured milk, then fruit and remaining ingredients; any water listed is frozen into ice beforehand.",
      "Blend in short pulses until spoonable.",
      "Stop and unplug before scraping the sides.",
      "Use only the measured liquid and toppings; serve straight away."
    ]
  },
  "social-yoghurt-mango-bowl": {
    "ings": [
      [
        "Frozen mango",
        180,
        "g"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Milk",
        50,
        "ml"
      ],
      [
        "Oats",
        20,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Blend mango, yoghurt and measured milk in a frozen-fruit-capable blender, stopping and unplugging before scraping.",
      "Spoon into a bowl and add the weighed oats.",
      "Serve straight away. Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "social-chicken-burrito-prep": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Black beans",
        320,
        "g"
      ],
      [
        "Frozen mixed peppers",
        400,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Cooking oil",
        20,
        "g"
      ],
      [
        "Taco seasoning",
        12,
        "g"
      ],
      [
        "0% Greek yoghurt",
        160,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cook diced chicken in the measured oil with onion, peppers and taco seasoning. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.",
      "Serve with cooked rice, black beans heated through and measured yoghurt.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-honey-soy-chicken-prep": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Broccoli",
        600,
        "g"
      ],
      [
        "Honey",
        40,
        "g"
      ],
      [
        "Soy sauce",
        40,
        "ml"
      ],
      [
        "Garlic",
        12,
        "g"
      ],
      [
        "Cooking oil",
        16,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cook diced chicken and garlic in all the oil. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Add honey, soy sauce and 40 ml water; simmer until fully cooked.",
      "Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.",
      "Steam broccoli over the hob and divide with rice and chicken.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-turkey-taco-prep": {
    "ings": [
      [
        "Turkey mince",
        600,
        "g"
      ],
      [
        "Rice",
        220,
        "g"
      ],
      [
        "Kidney beans",
        320,
        "g"
      ],
      [
        "Chopped tomatoes",
        600,
        "g"
      ],
      [
        "Frozen mixed peppers",
        400,
        "g"
      ],
      [
        "Taco seasoning",
        12,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Brown turkey without extra oil until fully cooked. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Add tomatoes, peppers, beans and taco seasoning; simmer for 15 minutes until piping hot.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Divide with cooked rice. Divide into the stated servings.",
      "Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-tuna-pasta-prep": {
    "ings": [
      [
        "Pasta",
        240,
        "g"
      ],
      [
        "Tuna",
        400,
        "g"
      ],
      [
        "Sweetcorn",
        240,
        "g"
      ],
      [
        "Cucumber",
        300,
        "g"
      ],
      [
        "0% Greek yoghurt",
        160,
        "g"
      ],
      [
        "Mayonnaise",
        40,
        "g"
      ],
      [
        "Lemon juice",
        30,
        "ml"
      ]
    ],
    "servings": 4,
    "steps": [
      "Cook the weighed dry pasta in boiling water for the packet time, until just tender. Save a little cooking water before draining, to loosen the finished sauce if needed.",
      "Mix tuna, corn, diced cucumber, yoghurt, mayonnaise and lemon.",
      "Divide with pasta; refrigerate immediately.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-chicken-pesto-prep": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Couscous",
        240,
        "g"
      ],
      [
        "Cherry tomatoes",
        400,
        "g"
      ],
      [
        "Spinach",
        200,
        "g"
      ],
      [
        "Pesto",
        60,
        "g"
      ],
      [
        "Cooking oil",
        12,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the packet ratio, cover for the stated standing time, then fluff thoroughly with a fork.",
      "Cook chicken in all measured oil. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.",
      "Fold cooked chicken, tomatoes, spinach and measured pesto into couscous; heat through.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-beef-burger-prep": {
    "ings": [
      [
        "5% beef mince",
        600,
        "g"
      ],
      [
        "Potato",
        800,
        "g"
      ],
      [
        "Lettuce",
        240,
        "g"
      ],
      [
        "Tomato",
        300,
        "g"
      ],
      [
        "Pickled gherkins",
        120,
        "g"
      ],
      [
        "Mayonnaise",
        40,
        "g"
      ],
      [
        "Mustard",
        20,
        "g"
      ],
      [
        "Cooking oil",
        16,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Dice and boil potatoes until tender. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Brown mince in half the measured oil until cooked through, then crisp potatoes in the remaining oil. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Divide with lettuce, tomato and gherkins.",
      "Mix mayonnaise and mustard; keep the measured sauce separate.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-tofu-peanut-prep": {
    "ings": [
      [
        "Firm tofu",
        700,
        "g"
      ],
      [
        "Rice",
        240,
        "g"
      ],
      [
        "Broccoli",
        600,
        "g"
      ],
      [
        "Carrot",
        300,
        "g"
      ],
      [
        "Peanut butter",
        60,
        "g"
      ],
      [
        "Soy sauce",
        40,
        "ml"
      ],
      [
        "Cooking oil",
        16,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cook cubed tofu in all the oil; steam broccoli and carrot on the hob.",
      "Thin peanut butter with soy sauce and 80 ml hot water. Stir in hot water a spoonful at a time until smooth and pourable; use all the measured peanut butter rather than adding an extra drizzle.",
      "Divide all ingredients into the stated servings.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-chickpea-couscous-prep": {
    "ings": [
      [
        "Chickpeas",
        600,
        "g"
      ],
      [
        "Couscous",
        220,
        "g"
      ],
      [
        "Feta cheese",
        120,
        "g"
      ],
      [
        "Cucumber",
        400,
        "g"
      ],
      [
        "Tomato",
        400,
        "g"
      ],
      [
        "Lemon juice",
        40,
        "ml"
      ],
      [
        "Olive oil",
        20,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Put the weighed dry couscous in a heatproof bowl. Add boiling water in the packet ratio, cover for the stated standing time, then fluff thoroughly with a fork.",
      "Divide couscous, chickpeas, chopped vegetables, feta and the measured lemon/oil dressing into covered containers.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-egg-potato-prep": {
    "ings": [
      [
        "Eggs",
        8,
        "piece"
      ],
      [
        "Potato",
        800,
        "g"
      ],
      [
        "Spinach",
        200,
        "g"
      ],
      [
        "Cherry tomatoes",
        400,
        "g"
      ],
      [
        "Cooking oil",
        16,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Boil eggs until yolks and whites are fully set.",
      "Boil diced potato until tender. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Crisp potatoes in all the measured oil.",
      "Wilt spinach and divide with eggs and tomatoes.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-bean-chilli-prep": {
    "ings": [
      [
        "Kidney beans",
        400,
        "g"
      ],
      [
        "Black beans",
        400,
        "g"
      ],
      [
        "Cannellini beans",
        400,
        "g"
      ],
      [
        "Rice",
        200,
        "g"
      ],
      [
        "Chopped tomatoes",
        800,
        "g"
      ],
      [
        "Onion",
        160,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Ground cumin",
        4,
        "g"
      ],
      [
        "Cooking oil",
        16,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Soften onion in all the oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add paprika / ground cumin, tomatoes and drained beans; simmer for 20 minutes until piping hot.",
      "Divide with cooked rice. Divide into the stated servings.",
      "Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-salmon-potatoes": {
    "ings": [
      [
        "Salmon fillet",
        140,
        "g"
      ],
      [
        "Potato",
        200,
        "g"
      ],
      [
        "Green beans",
        150,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating and fill instructions.",
      "Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.",
      "Dice potatoes, coat with all oil and cook at 190°C for about 20 minutes, shaking halfway.",
      "Add salmon and green beans; cook for about 8–12 minutes until the fish is opaque, flakes readily and is cooked through. Add measured lemon juice."
    ]
  },
  "social-tofu-bites": {
    "ings": [
      [
        "Firm tofu",
        200,
        "g"
      ],
      [
        "Sweet potato",
        180,
        "g"
      ],
      [
        "Frozen mixed peppers",
        120,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ],
      [
        "Peanut butter",
        12,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Drain the tofu and pat its surface dry before cutting it as described below; excess moisture prevents browning and dilutes the sauce.",
      "Follow your air fryer’s preheating and fill instructions.",
      "Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.",
      "Dice sweet potato into small cubes and coat with half the oil; cook at 190°C for about 12 minutes.",
      "Add tofu coated with the remaining oil and peppers; cook for 12–15 minutes more until hot throughout.",
      "Mix peanut butter and soy with 20 ml hot tap water and drizzle over."
    ]
  },
  "social-halloumi-pitta": {
    "ings": [
      [
        "Halloumi",
        70,
        "g"
      ],
      [
        "Frozen mixed peppers",
        150,
        "g"
      ],
      [
        "Wholemeal pitta",
        60,
        "g"
      ],
      [
        "0% Greek yoghurt",
        40,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating and fill instructions.",
      "Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.",
      "Coat peppers with all the oil and cook at 180°C for about 8 minutes.",
      "Add sliced halloumi for another 6–8 minutes until golden.",
      "Warm pitta briefly in the fryer and fill with halloumi, peppers and measured yoghurt."
    ]
  },
  "social-chickpea-crunch-pitta": {
    "ings": [
      [
        "Chickpeas",
        160,
        "g"
      ],
      [
        "Wholemeal pitta",
        60,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        60,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "Paprika",
        1,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating and fill instructions.",
      "Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.",
      "Dry chickpeas well, coat with oil and paprika and cook at 190°C for 12–15 minutes, shaking halfway.",
      "Fill a warmed pitta with chickpeas, diced vegetables and yoghurt."
    ]
  },
  "social-egg-toast": {
    "ings": [
      [
        "Wholemeal bread",
        70,
        "g"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Cheddar",
        20,
        "g"
      ],
      [
        "Cherry tomatoes",
        120,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating and fill instructions.",
      "Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.",
      "Press a well into each bread slice and place securely in the basket.",
      "Add one egg to each well and the measured grated cheddar.",
      "Cook at 170°C for roughly 10–14 minutes until egg whites and yolks are fully set.",
      "Cook tomatoes alongside only if there is space."
    ]
  },
  "social-loaded-sweet-potato": {
    "ings": [
      [
        "Sweet potato",
        250,
        "g"
      ],
      [
        "Tuna",
        100,
        "g"
      ],
      [
        "Sweetcorn",
        60,
        "g"
      ],
      [
        "0% Greek yoghurt",
        60,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating and fill instructions.",
      "Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.",
      "Prick the sweet potato, rub with all oil and cook at 190°C for about 40–50 minutes until soft through the middle.",
      "Split and fill with drained tuna, sweetcorn and yoghurt."
    ]
  },
  "social-cod-potato-bites": {
    "ings": [
      [
        "Cod fillet",
        170,
        "g"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Frozen peas",
        120,
        "g"
      ],
      [
        "Cooking oil",
        5,
        "g"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ]
    ],
    "servings": 1,
    "steps": [
      "Follow your air fryer’s preheating and fill instructions.",
      "Cook in a single layer and use batches if needed; times vary with the appliance and ingredient size.",
      "Dice potatoes and coat with all oil; cook at 190°C for about 20 minutes.",
      "Add chunky cod pieces and cook for another 8–12 minutes until opaque, flaking and cooked through.",
      "Boil peas on the hob following the packet and add the measured lemon juice."
    ]
  },
  "social-beef-bolognese": {
    "ings": [
      [
        "5% beef mince",
        600,
        "g"
      ],
      [
        "Passata",
        800,
        "g"
      ],
      [
        "Carrot",
        300,
        "g"
      ],
      [
        "Onion",
        160,
        "g"
      ],
      [
        "Garlic",
        12,
        "g"
      ],
      [
        "Dried mixed herbs",
        4,
        "g"
      ],
      [
        "Pasta",
        280,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use fully thawed meat and follow the slow cooker’s fill and liquid guidance. The listed hands-on time excludes slow cooking; never put frozen meat into this method.",
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance.",
      "Never put frozen meat in the slow cooker.",
      "Brown mince and onion on the hob without extra oil until cooked through. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Transfer to the cooker with passata, finely diced carrot, garlic and herbs.",
      "Cook covered on HIGH for about four hours until the carrot is tender and sauce piping hot.",
      "Cook dry pasta separately on the hob and divide into the stated servings.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-peanut-chicken": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Peanut butter",
        80,
        "g"
      ],
      [
        "Light coconut milk",
        300,
        "ml"
      ],
      [
        "Soy sauce",
        40,
        "ml"
      ],
      [
        "Frozen mixed peppers",
        400,
        "g"
      ],
      [
        "Carrot",
        300,
        "g"
      ],
      [
        "Rice",
        220,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use fully thawed meat and follow the slow cooker’s fill and liquid guidance. The listed hands-on time excludes slow cooking; never put frozen meat into this method.",
      "Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance.",
      "Never put frozen meat in the slow cooker.",
      "Mix peanut butter, coconut milk and soy in the cooker. Stir in hot water a spoonful at a time until smooth and pourable; use all the measured peanut butter rather than adding an extra drizzle.",
      "Add chicken, diced carrot and peppers; cook covered on HIGH for about four hours.",
      "Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.",
      "Cook weighed rice separately on the hob and serve the stated servings with all the sauce.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-bean-chilli": {
    "ings": [
      [
        "Kidney beans",
        400,
        "g"
      ],
      [
        "Black beans",
        400,
        "g"
      ],
      [
        "Cannellini beans",
        400,
        "g"
      ],
      [
        "Chopped tomatoes",
        800,
        "g"
      ],
      [
        "Sweet potato",
        500,
        "g"
      ],
      [
        "Onion",
        160,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Ground cumin",
        4,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance.",
      "Never put frozen meat in the slow cooker.",
      "Use cooked canned beans, never raw kidney beans.",
      "Add drained beans, tomatoes, small sweet-potato cubes, onion and paprika / ground cumin to the cooker.",
      "Cook covered on HIGH for about four hours until sweet potato is tender and everything is piping hot.",
      "Serve the stated servings. Divide into the stated servings.",
      "Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-lentil-dahl": {
    "ings": [
      [
        "Red lentils",
        300,
        "g"
      ],
      [
        "Chopped tomatoes",
        600,
        "g"
      ],
      [
        "Light coconut milk",
        300,
        "ml"
      ],
      [
        "Onion",
        160,
        "g"
      ],
      [
        "Curry powder",
        8,
        "g"
      ],
      [
        "Spinach",
        200,
        "g"
      ],
      [
        "Water",
        600,
        "ml"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance.",
      "Never put frozen meat in the slow cooker.",
      "Rinse dry red lentils. Add lentils, tomatoes, coconut milk, onion, curry powder and measured water.",
      "Cook covered on HIGH for about four hours until lentils are fully soft; extend as needed.",
      "Stir in spinach and cook until hot throughout.",
      "Serve the stated servings. Divide into the stated servings.",
      "Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-chicken-potato": {
    "ings": [
      [
        "Chicken breast",
        600,
        "g"
      ],
      [
        "Potato",
        800,
        "g"
      ],
      [
        "Carrot",
        400,
        "g"
      ],
      [
        "Chicken stock",
        500,
        "ml"
      ],
      [
        "Lemon juice",
        40,
        "ml"
      ],
      [
        "Dried mixed herbs",
        4,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use fully thawed meat and follow the slow cooker’s fill and liquid guidance. The listed hands-on time excludes slow cooking; never put frozen meat into this method.",
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance.",
      "Never put frozen meat in the slow cooker.",
      "Put small potato and carrot chunks, chicken, prepared stock, lemon juice and herbs in the cooker.",
      "Cook covered on HIGH for about four hours until the vegetables are tender.",
      "Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.",
      "Serve the stated servings. Divide into the stated servings.",
      "Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-bbq-chicken": {
    "ings": [
      [
        "Chicken breast",
        650,
        "g"
      ],
      [
        "Black beans",
        500,
        "g"
      ],
      [
        "Passata",
        500,
        "g"
      ],
      [
        "BBQ sauce",
        120,
        "g"
      ],
      [
        "Onion",
        160,
        "g"
      ],
      [
        "Sweetcorn",
        300,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use fully thawed meat and follow the slow cooker’s fill and liquid guidance. The listed hands-on time excludes slow cooking; never put frozen meat into this method.",
      "Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance.",
      "Never put frozen meat in the slow cooker.",
      "Add chicken, beans, passata, BBQ sauce, onion and sweetcorn to the cooker.",
      "Cook covered on HIGH for about four hours.",
      "Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.",
      "Shred in the sauce and divide into the stated servings.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-chickpea-potato": {
    "ings": [
      [
        "Chickpeas",
        700,
        "g"
      ],
      [
        "Sweet potato",
        600,
        "g"
      ],
      [
        "Chopped tomatoes",
        600,
        "g"
      ],
      [
        "Light coconut milk",
        300,
        "ml"
      ],
      [
        "Curry paste",
        60,
        "g"
      ],
      [
        "Spinach",
        200,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use thawed ingredients and a cooker suited to this four-serving batch; follow its minimum fill and liquid guidance.",
      "Never put frozen meat in the slow cooker.",
      "Add drained chickpeas, small sweet-potato cubes, tomatoes, coconut milk and curry paste.",
      "Cook covered on HIGH for about four hours until potato is tender.",
      "Add spinach and cook until hot throughout; serve the stated servings.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze. If a dish contains rice, cool it within one hour and refrigerate for no more than 24 hours; reheat only once until steaming hot."
    ]
  },
  "social-feta-pasta": {
    "ings": [
      [
        "Pasta",
        60,
        "g"
      ],
      [
        "Feta cheese",
        60,
        "g"
      ],
      [
        "Cherry tomatoes",
        200,
        "g"
      ],
      [
        "Spinach",
        60,
        "g"
      ],
      [
        "Olive oil",
        5,
        "g"
      ],
      [
        "Garlic",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Bake feta, tomatoes, garlic and all measured oil in a small dish at 200°C for about 25 minutes.",
      "Cook dry pasta separately on the hob.",
      "Mash the baked mixture, stir in pasta and spinach and heat until the spinach wilts.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "social-salmon-rice-bowl": {
    "ings": [
      [
        "Salmon fillet",
        140,
        "g"
      ],
      [
        "Rice",
        50,
        "g"
      ],
      [
        "Cucumber",
        100,
        "g"
      ],
      [
        "Mayonnaise",
        15,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Cook salmon in all measured oil on the hob until opaque, flaking and cooked through.",
      "Flake over rice and add cucumber, measured mayonnaise and soy sauce.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "social-smash-taco": {
    "ings": [
      [
        "5% beef mince",
        120,
        "g"
      ],
      [
        "Wholemeal wrap",
        62,
        "g"
      ],
      [
        "Cheddar",
        20,
        "g"
      ],
      [
        "Lettuce",
        50,
        "g"
      ],
      [
        "Pickled gherkins",
        30,
        "g"
      ],
      [
        "Mayonnaise",
        10,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Press a thin layer of mince onto one side of the wrap.",
      "Cook meat-side down in a non-stick pan without extra oil until fully cooked through.",
      "Turn, add cheddar and warm the wrap.",
      "Top with lettuce, gherkins and measured mayonnaise.",
      "Before serving, check the centre of the thickest meat pieces or mince reaches 75°C for 30 seconds. Continue cooking if needed and use clean utensils for the cooked food.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "social-cottage-cheese-pasta": {
    "ings": [
      [
        "Pasta",
        65,
        "g"
      ],
      [
        "Cottage cheese",
        150,
        "g"
      ],
      [
        "Passata",
        150,
        "g"
      ],
      [
        "Spinach",
        80,
        "g"
      ],
      [
        "Garlic",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Blend cottage cheese and passata until smooth.",
      "Cook dry pasta separately. Warm sauce with garlic and spinach on the hob, stirring without a hard boil.",
      "Toss with drained pasta. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "social-tortilla-pizza": {
    "ings": [
      [
        "Wholemeal wrap",
        62,
        "g"
      ],
      [
        "Chicken breast",
        100,
        "g"
      ],
      [
        "Passata",
        60,
        "g"
      ],
      [
        "Cheddar",
        25,
        "g"
      ],
      [
        "Frozen mixed peppers",
        80,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Cook small chicken pieces on the hob in a non-stick pan without extra oil. Use a non-stick pan over medium heat and cook even thin pieces for about 8–10 minutes, turning; add a little water if the measured oil is not enough to prevent sticking.",
      "Check the thickest part of the chicken reaches 75°C for 30 seconds before serving.",
      "Put the wrap on a baking tray, spread passata and top with chicken, peppers and weighed cheese.",
      "Bake at 200°C for about 8–12 minutes until hot and crisp.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "social-egg-feta-toast": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Feta cheese",
        30,
        "g"
      ],
      [
        "Wholemeal bread",
        60,
        "g"
      ],
      [
        "Tomato",
        100,
        "g"
      ],
      [
        "Cooking oil",
        3,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Warm feta in all measured oil in a non-stick pan.",
      "Add eggs and cook gently until whites and yolks are fully set.",
      "Serve on bread with sliced tomato. The bread may be left untoasted."
    ]
  },
  "social-chocolate-yoghurt-bark": {
    "ings": [
      [
        "0% Greek yoghurt",
        400,
        "g"
      ],
      [
        "Frozen berries",
        160,
        "g"
      ],
      [
        "Dark chocolate",
        30,
        "g"
      ],
      [
        "Peanut butter",
        30,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Thaw berries safely following the packet.",
      "Spread yoghurt in a lined freezer-safe container; add berries, finely chopped chocolate and measured peanut butter.",
      "Freeze for at least four hours, then divide into the stated servings. Keep frozen until serving."
    ]
  },
  "social-cucumber-tuna-crunch": {
    "ings": [
      [
        "Tuna",
        120,
        "g"
      ],
      [
        "Cucumber",
        250,
        "g"
      ],
      [
        "0% Greek yoghurt",
        80,
        "g"
      ],
      [
        "Soy sauce",
        10,
        "ml"
      ],
      [
        "Lemon juice",
        10,
        "ml"
      ],
      [
        "Wholemeal bread",
        60,
        "g"
      ]
    ],
    "servings": 1,
    "steps": [
      "Thinly slice cucumber and mix with tuna, yoghurt, soy and lemon.",
      "Serve with the measured bread.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-mamaliga-breakfast": {
    "ings": [
      [
        "Polenta",
        70,
        "g"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Cottage cheese",
        240,
        "g"
      ],
      [
        "Tomato",
        250,
        "g"
      ],
      [
        "Water",
        350,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook dry polenta with the measured water following its packet directions, stirring until thick.",
      "Hard-boil the eggs until the whites and yolks are set.",
      "Divide polenta, cottage cheese, peeled eggs and sliced tomatoes between the stated servings.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-branza-toast": {
    "ings": [
      [
        "Cottage cheese",
        300,
        "g"
      ],
      [
        "Wholemeal bread",
        120,
        "g"
      ],
      [
        "Cucumber",
        200,
        "g"
      ],
      [
        "Tomato",
        200,
        "g"
      ],
      [
        "Dried dill",
        1,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Stir dill into cottage cheese. Wash and slice cucumber and tomatoes.",
      "Spread the cheese on the bread and serve with the vegetables.",
      "This uses cottage cheese in place of richer Romanian cheese.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-romanian-apple-porridge": {
    "ings": [
      [
        "Oats",
        80,
        "g"
      ],
      [
        "Skimmed milk",
        300,
        "ml"
      ],
      [
        "Apple",
        250,
        "g"
      ],
      [
        "Quark",
        200,
        "g"
      ],
      [
        "Cinnamon",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook oats, skimmed milk, grated apple and cinnamon over a gentle heat until the oats soften.",
      "Take off the heat and stir in quark.",
      "Divide into the stated servings. Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-clatite-cheese": {
    "ings": [
      [
        "Plain flour",
        90,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Skimmed milk",
        200,
        "ml"
      ],
      [
        "Cottage cheese",
        250,
        "g"
      ],
      [
        "Frozen berries",
        180,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Whisk flour, egg and milk into a thin batter.",
      "Cook the frozen berries following their packet instructions and let them cool.",
      "Use all measured oil across a non-stick pan and cook thin pancakes on both sides until the batter is fully set.",
      "Fill the cooked pancakes with cottage cheese and berries and divide equally.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-fasole-batuta": {
    "ings": [
      [
        "Cannellini beans",
        400,
        "g"
      ],
      [
        "Wholemeal bread",
        120,
        "g"
      ],
      [
        "Onion",
        150,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Passata",
        100,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Mixed salad",
        200,
        "g"
      ],
      [
        "Paprika",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Use drained canned beans. Mash them with crushed garlic.",
      "Soften sliced onion in all measured oil; stir in paprika and passata. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Warm the mashed beans in the pan, adding a little of the measured passata mixture to loosen them.",
      "Divide onto bread, top with the remaining onions and serve with salad."
    ]
  },
  "regional-salata-vinete": {
    "ings": [
      [
        "Aubergine",
        500,
        "g"
      ],
      [
        "Cannellini beans",
        300,
        "g"
      ],
      [
        "0% Greek yoghurt",
        120,
        "g"
      ],
      [
        "Wholemeal bread",
        100,
        "g"
      ],
      [
        "Onion",
        50,
        "g"
      ],
      [
        "Tomato",
        250,
        "g"
      ],
      [
        "Lemon juice",
        20,
        "ml"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Halve the aubergines, brush with all measured oil and roast at 200°C until the flesh is completely tender, about 35–45 minutes.",
      "Scoop the cooled flesh and mash it with drained beans, yoghurt, finely chopped onion and lemon juice.",
      "This is a protein-rich adaptation of aubergine salad.",
      "Divide between the stated servings and serve with tomatoes and the weighed bread.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-zacusca-toast": {
    "ings": [
      [
        "Aubergine",
        350,
        "g"
      ],
      [
        "Frozen mixed peppers",
        300,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Passata",
        200,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Cottage cheese",
        300,
        "g"
      ],
      [
        "Wholemeal bread",
        120,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Chop aubergine and onion and mix with peppers, passata and all measured oil in a covered oven dish.",
      "Bake at 190°C for about 40–50 minutes until vegetables are tender, uncovering near the end to thicken.",
      "Mash and let the spread cool slightly.",
      "Serve the stated servings of spread on bread with cottage cheese.",
      "Keep this as a fresh refrigerated spread; it is not a shelf-stable preserve."
    ]
  },
  "regional-salata-boeuf-chicken": {
    "ings": [
      [
        "Chicken breast",
        300,
        "g"
      ],
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Frozen peas",
        120,
        "g"
      ],
      [
        "Pickled gherkins",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        160,
        "g"
      ],
      [
        "Lighter than light mayonnaise",
        30,
        "g"
      ],
      [
        "Mustard",
        10,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Poach chicken until fully cooked; Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Boil diced potato and carrot until tender and cook peas following their packet. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Cool the cooked ingredients promptly, then dice the chicken.",
      "Mix with drained gherkins, yoghurt, the weighed mayonnaise and mustard.",
      "Divide into two salad boxes and refrigerate.",
      "This version uses chicken rather than beef and a yoghurt-rich dressing."
    ]
  },
  "regional-ciorba-lentil": {
    "ings": [
      [
        "Red lentils",
        100,
        "g"
      ],
      [
        "Carrot",
        180,
        "g"
      ],
      [
        "Celery",
        100,
        "g"
      ],
      [
        "Courgette",
        250,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        300,
        "g"
      ],
      [
        "Water",
        650,
        "ml"
      ],
      [
        "Lemon juice",
        25,
        "ml"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften chopped onion, carrot and celery in all measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add rinsed dry lentils, courgette, tomatoes and water.",
      "Simmer, stirring, until lentils and vegetables are tender, adding only plain water if needed to prevent sticking.",
      "Add lemon juice and divide into the stated servings.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-sarmale-turkey": {
    "ings": [
      [
        "Turkey mince",
        700,
        "g"
      ],
      [
        "Rice",
        140,
        "g"
      ],
      [
        "White cabbage",
        800,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Passata",
        600,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Dried dill",
        3,
        "g"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Soften large cabbage leaves in boiling water and trim thick ribs.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Mix turkey, cooked rice, onion and dill.",
      "Divide across leaves and roll into compact parcels.",
      "Place seam-side down in a deep lidded pan.",
      "Cover with passata and enough plain water to reach halfway up the rolls.",
      "Simmer gently for about 45–60 minutes until cabbage is tender and the centre of the filling is cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Serve the stated servings with the measured yoghurt.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze.",
      "For rice dishes, cool within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot."
    ]
  },
  "regional-ardei-umpluti": {
    "ings": [
      [
        "Turkey mince",
        700,
        "g"
      ],
      [
        "Rice",
        140,
        "g"
      ],
      [
        "Bell pepper",
        600,
        "g"
      ],
      [
        "Onion",
        180,
        "g"
      ],
      [
        "Passata",
        500,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Dried mixed herbs",
        3,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Weigh rice dry and use the water ratio and cooking time on its packet. Simmer with the lid as directed, then fluff gently; the ingredient amount is not cooked rice.",
      "Halve and deseed peppers. Soften onion in all measured oil, add turkey and cook it through.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Mix the cooked turkey, rice and herbs and fill the pepper halves.",
      "Put passata in a deep oven dish and arrange peppers on top.",
      "Cover and bake at 190°C for about 35–45 minutes until peppers are tender and filling is steaming hot.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze.",
      "For rice dishes, cool within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot."
    ]
  },
  "regional-ghiveci": {
    "ings": [
      [
        "Cannellini beans",
        400,
        "g"
      ],
      [
        "Aubergine",
        300,
        "g"
      ],
      [
        "Courgette",
        250,
        "g"
      ],
      [
        "Carrot",
        150,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Chopped tomatoes",
        400,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Wholemeal bread",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Use drained canned beans. Soften chopped onion and carrot in all measured oil, then add aubergine, courgette, garlic and tomatoes. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Cover and simmer until the vegetables are tender, then stir in beans and heat thoroughly.",
      "Divide into the stated servings and serve with bread."
    ]
  },
  "regional-mancare-mazare": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Frozen peas",
        300,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Carrot",
        180,
        "g"
      ],
      [
        "Passata",
        250,
        "g"
      ],
      [
        "Potato",
        250,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Dried dill",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften diced onion and carrot in all measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add small chicken pieces, passata and a little plain water; cover and simmer until chicken is cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Add peas and dill and heat following the pea packet guidance.",
      "Boil potatoes separately and serve the stated servings. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-ciulama": {
    "ings": [
      [
        "Chicken breast",
        380,
        "g"
      ],
      [
        "Mushrooms",
        300,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Skimmed milk",
        300,
        "ml"
      ],
      [
        "Plain flour",
        20,
        "g"
      ],
      [
        "Polenta",
        80,
        "g"
      ],
      [
        "Water",
        400,
        "ml"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Dried dill",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften onion and cultivated mushrooms in all measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Add small chicken pieces and cook through.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Whisk flour into cold skimmed milk, pour into the pan and simmer, stirring, until the sauce thickens and the flour is cooked.",
      "Add dill. Cook dry polenta in the measured water following its packet and divide with the creamy chicken.",
      "This sauce uses milk rather than cream.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-tocana-pork": {
    "ings": [
      [
        "Lean pork",
        360,
        "g"
      ],
      [
        "Potato",
        350,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Chopped tomatoes",
        300,
        "g"
      ],
      [
        "Paprika",
        3,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Green beans",
        200,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cut pork into small cubes and brown in all measured oil.",
      "Add onion, carrot, potato, paprika and tomatoes, with enough plain water to just cover.",
      "Simmer covered until pork is fully cooked and tender and potato is soft, about 35–45 minutes.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Add green beans for the final 8–10 minutes, then divide equally.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-mici-beef": {
    "ings": [
      [
        "5% beef mince",
        360,
        "g"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Paprika",
        2,
        "g"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ],
      [
        "Potato",
        300,
        "g"
      ],
      [
        "White cabbage",
        250,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Mustard",
        15,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Mix beef with garlic, paprika and herbs and shape short thin patties.",
      "Brush with all measured oil and air-fry at 190°C, turning, until fully cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Boil the weighed potatoes. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Shred cabbage and carrot and mix with yoghurt and mustard.",
      "Serve the stated servings. These are lean beef patties inspired by mici, not a traditional sausage mixture.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-romanian-fish-polenta": {
    "ings": [
      [
        "Cod fillet",
        400,
        "g"
      ],
      [
        "Polenta",
        90,
        "g"
      ],
      [
        "Water",
        450,
        "ml"
      ],
      [
        "Garlic",
        8,
        "g"
      ],
      [
        "Lemon juice",
        25,
        "ml"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Tomato",
        300,
        "g"
      ],
      [
        "Green beans",
        250,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Cook dry polenta in the measured water following its packet.",
      "Steam green beans and slice tomatoes.",
      "Cook cod in a lidded non-stick pan with all measured oil, garlic and lemon juice until opaque and fully cooked throughout.",
      "Divide fish, polenta and vegetables equally."
    ]
  },
  "regional-slow-cabbage-chicken": {
    "ings": [
      [
        "Chicken breast",
        700,
        "g"
      ],
      [
        "White cabbage",
        800,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Passata",
        600,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Dried dill",
        3,
        "g"
      ],
      [
        "Wholemeal bread",
        200,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use fully thawed meat and follow the slow cooker’s fill and liquid guidance. The listed hands-on time excludes slow cooking; never put frozen meat into this method.",
      "Slice cabbage and onion and put them into the slow cooker with passata, paprika and dill.",
      "Add chicken in small pieces and stir.",
      "Cook on High for about four hours or follow the appliance guidance, until the vegetables are tender and the chicken is fully cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Serve the stated servings with weighed bread.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze.",
      "For rice dishes, cool within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot."
    ]
  },
  "regional-papanasi-baked": {
    "ings": [
      [
        "Quark",
        300,
        "g"
      ],
      [
        "Plain flour",
        50,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Frozen berries",
        150,
        "g"
      ],
      [
        "Honey",
        10,
        "g"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Mix quark, flour and egg and spoon four small cakes onto baking paper.",
      "Bake at 180°C for 25–30 minutes until set throughout and lightly golden.",
      "Cook berries following their packet and let them cool.",
      "Serve two cakes per portion with yoghurt, berries and weighed honey.",
      "This is a baked, lightly sweetened adaptation of fried papanași.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-placinta-apple": {
    "ings": [
      [
        "Wholemeal wrap",
        120,
        "g"
      ],
      [
        "Apple",
        300,
        "g"
      ],
      [
        "Cinnamon",
        2,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Grate apple and mix with cinnamon. Split between the weighed wraps and fold into two closed parcels; brush with all measured oil.",
      "Bake seam-side down at 180°C for 15–20 minutes until hot and crisp.",
      "Serve one parcel each with yoghurt.",
      "The wrap replaces traditional pastry in this adaptation.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-courgette-chiftele": {
    "ings": [
      [
        "Courgette",
        400,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Oats",
        50,
        "g"
      ],
      [
        "Cottage cheese",
        100,
        "g"
      ],
      [
        "Garlic",
        4,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Dried dill",
        1,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Grate courgette and squeeze out excess liquid.",
      "Mix with egg, oats, cottage cheese and garlic and shape eight small thin patties.",
      "Brush with all measured oil and bake at 200°C for about 20–25 minutes, turning, until fully set.",
      "Mix yoghurt with dill and serve four patties per portion with the dip.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-twarozek": {
    "ings": [
      [
        "Cottage cheese",
        300,
        "g"
      ],
      [
        "0% Greek yoghurt",
        80,
        "g"
      ],
      [
        "Cucumber",
        200,
        "g"
      ],
      [
        "Wholemeal bread",
        120,
        "g"
      ],
      [
        "Tomato",
        200,
        "g"
      ],
      [
        "Dried dill",
        1,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Mix cottage cheese, yoghurt, dill and finely chopped cucumber.",
      "Wash and slice tomatoes. Divide the cheese mixture, bread and tomatoes between the stated servings.",
      "Cottage cheese replaces twaróg in this measured adaptation.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-jajecznica": {
    "ings": [
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Egg whites",
        200,
        "g"
      ],
      [
        "Mushrooms",
        250,
        "g"
      ],
      [
        "Tomato",
        250,
        "g"
      ],
      [
        "Wholemeal bread",
        120,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften sliced mushrooms in all measured oil. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Whisk eggs with the weighed egg whites, add to the pan and stir gently until fully set.",
      "Divide the scramble between the stated servings and serve with bread and tomatoes.",
      "Egg whites increase protein while using fewer whole eggs."
    ]
  },
  "regional-owsianka": {
    "ings": [
      [
        "Oats",
        80,
        "g"
      ],
      [
        "Skimmed milk",
        300,
        "ml"
      ],
      [
        "Quark",
        250,
        "g"
      ],
      [
        "Apple",
        250,
        "g"
      ],
      [
        "Cinnamon",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Simmer oats, milk, grated apple and cinnamon until the oats soften, stirring to prevent sticking.",
      "Remove from the heat and stir in quark.",
      "Divide between the stated servings.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-nalesniki": {
    "ings": [
      [
        "Plain flour",
        90,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Skimmed milk",
        200,
        "ml"
      ],
      [
        "Cottage cheese",
        260,
        "g"
      ],
      [
        "Frozen berries",
        180,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "Honey",
        10,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Whisk flour, egg and milk into a thin batter.",
      "Use all measured oil across a non-stick pan and cook thin pancakes on both sides until completely set.",
      "Cook berries following their packet and stir in the weighed honey.",
      "Fill pancakes with cottage cheese, add the compote and divide equally.",
      "Make sure the egg or egg batter is fully set throughout before serving; extend the gentle cooking time if the centre is still liquid.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-rosol": {
    "ings": [
      [
        "Chicken breast",
        350,
        "g"
      ],
      [
        "Noodles",
        80,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Celery",
        120,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Water",
        800,
        "ml"
      ],
      [
        "Dried mixed herbs",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Measure all the listed dried mixed herbs and mix it evenly into the component specified below, rather than leaving it as an unmeasured garnish.",
      "Simmer small chicken pieces, chopped vegetables and herbs in water until the chicken is cooked through.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Cook the weighed dry noodles following their packet time, then drain. Loosen with a splash of water if they stick; do not add unlisted oil.",
      "Ladle over chicken and broth. This quicker adaptation uses breast rather than a long-simmered whole-chicken stock.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-pomidorowa": {
    "ings": [
      [
        "Chicken breast",
        320,
        "g"
      ],
      [
        "Rice",
        70,
        "g"
      ],
      [
        "Passata",
        400,
        "g"
      ],
      [
        "Carrot",
        180,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Water",
        650,
        "ml"
      ],
      [
        "0% Greek yoghurt",
        120,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften chopped onion and carrot in all measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add passata, water and small chicken pieces; simmer until the chicken is cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Weigh grains dry and cook following their packet directions.",
      "Cooked grain weighs more than the listed dry amount.",
      "Divide rice between the stated servings, add the soup and spoon on yoghurt away from the heat instead of cream.",
      "If preparing ahead, divide into shallow containers, cool promptly and refrigerate within two hours; eat within 48 hours or freeze. Rice must cool within one hour, stay refrigerated for no more than 24 hours and be reheated only once until steaming hot."
    ]
  },
  "regional-krupnik": {
    "ings": [
      [
        "Turkey mince",
        320,
        "g"
      ],
      [
        "Pearl barley",
        80,
        "g"
      ],
      [
        "Potato",
        180,
        "g"
      ],
      [
        "Carrot",
        180,
        "g"
      ],
      [
        "Celery",
        100,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Water",
        900,
        "ml"
      ],
      [
        "Dried dill",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Rinse dry pearl barley. Simmer it with diced potato, carrot, celery and onion in water, following the barley packet for its full cooking time.",
      "Add turkey in small crumbled pieces for the final 20 minutes and cook through.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Stir in dill and divide equally. If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-ogorkowa": {
    "ings": [
      [
        "Chicken breast",
        320,
        "g"
      ],
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Carrot",
        180,
        "g"
      ],
      [
        "Pickled gherkins",
        140,
        "g"
      ],
      [
        "Water",
        750,
        "ml"
      ],
      [
        "0% Greek yoghurt",
        150,
        "g"
      ],
      [
        "Dried dill",
        2,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Simmer small chicken pieces, diced potato and carrot in water until the potato is tender and the chicken fully cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Grate drained gherkins and add them with dill after the potatoes soften.",
      "Heat through, divide into the stated servings and add yoghurt off the heat.",
      "Pickled gherkins provide a supermarket-friendly adaptation of fermented sour cucumbers.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-barszcz-beans": {
    "ings": [
      [
        "Cooked beetroot",
        400,
        "g"
      ],
      [
        "Cannellini beans",
        350,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Garlic",
        6,
        "g"
      ],
      [
        "Water",
        600,
        "ml"
      ],
      [
        "Lemon juice",
        25,
        "ml"
      ],
      [
        "Wholemeal bread",
        100,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Use plain cooked beetroot, not beetroot in vinegar, and drained canned beans.",
      "Simmer chopped carrot, onion and garlic in water until tender.",
      "Add grated beetroot and beans, warm thoroughly and stir in lemon juice.",
      "Divide with bread. The beans make this a fuller meal inspired by barszcz, rather than a traditional clear broth."
    ]
  },
  "regional-chlodnik": {
    "ings": [
      [
        "Cooked beetroot",
        350,
        "g"
      ],
      [
        "Cucumber",
        250,
        "g"
      ],
      [
        "0% Greek yoghurt",
        350,
        "g"
      ],
      [
        "Skimmed milk",
        100,
        "ml"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Wholemeal bread",
        100,
        "g"
      ],
      [
        "Dried dill",
        2,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Hard-boil eggs until whites and yolks are fully set, then cool and peel.",
      "Grate plain cooked beetroot and dice cucumber.",
      "Mix beetroot, cucumber, yoghurt, milk, dill and lemon juice.",
      "Chill until serving and divide into the stated servings with one egg and half the bread each.",
      "This uses yoghurt and milk in place of kefir.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-salatka-jarzynowa": {
    "ings": [
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ],
      [
        "Frozen peas",
        150,
        "g"
      ],
      [
        "Eggs",
        2,
        "piece"
      ],
      [
        "Pickled gherkins",
        100,
        "g"
      ],
      [
        "Apple",
        100,
        "g"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Lighter than light mayonnaise",
        30,
        "g"
      ],
      [
        "Mustard",
        10,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Boil diced potato and carrot until tender and cook peas following their packet. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Hard-boil eggs until fully set, cool promptly and chop.",
      "Combine cooled vegetables, eggs, drained chopped gherkins and apple.",
      "Fold through yoghurt, the weighed mayonnaise and mustard and split between two boxes. Refrigerate until serving."
    ]
  },
  "regional-golabki-turkey": {
    "ings": [
      [
        "Turkey mince",
        700,
        "g"
      ],
      [
        "Rice",
        140,
        "g"
      ],
      [
        "White cabbage",
        800,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Passata",
        600,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Paprika",
        3,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Soften large cabbage leaves in boiling water and trim their thick ribs.",
      "Cook weighed dry rice and soften onion in all measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Mix turkey, cooked rice, onion and paprika.",
      "Wrap the filling in cabbage leaves and place seam-side down in a lidded deep pan.",
      "Add passata and plain water to halfway up the rolls and simmer for 45–60 minutes, until cabbage is tender and the filling is fully cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze.",
      "For rice dishes, cool within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot."
    ]
  },
  "regional-pierogi-potato": {
    "ings": [
      [
        "Plain flour",
        150,
        "g"
      ],
      [
        "Water",
        80,
        "ml"
      ],
      [
        "Potato",
        220,
        "g"
      ],
      [
        "Quark",
        250,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "White cabbage",
        250,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Lemon juice",
        20,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Boil and mash the weighed potato. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Soften onion in all measured oil and mix with potato and quark for the filling. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Knead flour with warm measured water into a pliable dough.",
      "Rest briefly, roll thinly and cut circles, using flour already included in the measured amount for dusting.",
      "Fill, fold and seal the dumplings. Boil in batches until the dough and filling are cooked through, allowing several minutes after they float.",
      "Shred cabbage and carrot and mix with lemon juice.",
      "Divide dumplings and slaw equally. Quark replaces twaróg and the dumplings are boiled rather than fried."
    ]
  },
  "regional-kopytka": {
    "ings": [
      [
        "Potato",
        350,
        "g"
      ],
      [
        "Plain flour",
        100,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Mushrooms",
        250,
        "g"
      ],
      [
        "Spinach",
        180,
        "g"
      ],
      [
        "Cottage cheese",
        250,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Boil the weighed potato, drain well and mash. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Cool briefly, then mix with flour and egg into a soft dough.",
      "Use the measured flour for all rolling and dusting.",
      "Shape into ropes and cut small dumplings.",
      "Boil gently in batches until fully cooked through; do not taste raw dough.",
      "Soften mushrooms in all measured oil, wilt spinach and fold in cottage cheese off the heat. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Serve the stated servings of dumplings and vegetables."
    ]
  },
  "regional-placki-turkey": {
    "ings": [
      [
        "Potato",
        350,
        "g"
      ],
      [
        "Onion",
        100,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Plain flour",
        25,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Turkey mince",
        300,
        "g"
      ],
      [
        "0% Greek yoghurt",
        100,
        "g"
      ],
      [
        "Dried dill",
        2,
        "g"
      ],
      [
        "Cucumber",
        250,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Grate potato and onion and squeeze out excess liquid.",
      "Mix with egg and flour, make six thin small patties and brush with all measured oil.",
      "Air-fry in batches at 190°C for about 15–20 minutes, turning, until fully set and potato is tender.",
      "Keep the basket clear of loose paper.",
      "Cook turkey mince in a non-stick pan without extra oil until fully cooked. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Serve with three potato patties each, cucumber and yoghurt mixed with dill.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-schabowy": {
    "ings": [
      [
        "Lean pork",
        360,
        "g"
      ],
      [
        "Wholemeal bread",
        50,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Cucumber",
        300,
        "g"
      ],
      [
        "0% Greek yoghurt",
        140,
        "g"
      ],
      [
        "Dried dill",
        2,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Crumb all weighed bread. Flatten two lean pork cutlets, coat in beaten egg and the crumbs, using any remaining egg in the coating.",
      "Brush with all measured oil. Bake at 200°C for about 20–25 minutes, turning, until the pork and egg coating are fully cooked.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Boil potatoes. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well.",
      "Mix sliced cucumber with yoghurt, dill and lemon juice for a lighter mizeria.",
      "Divide into the stated servings; this cutlet is baked rather than fried.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-ryba-grecku": {
    "ings": [
      [
        "Cod fillet",
        400,
        "g"
      ],
      [
        "Carrot",
        300,
        "g"
      ],
      [
        "Celery",
        120,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Passata",
        300,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Potato",
        300,
        "g"
      ],
      [
        "Lemon juice",
        15,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Soften grated carrot, celery and onion in all measured oil. Use medium heat and stir for about 5–7 minutes, until the onion is translucent; lower the heat if it catches.",
      "Add passata and simmer until vegetables are tender.",
      "Nestle cod pieces in the sauce, cover and cook gently until opaque and fully cooked throughout.",
      "Boil potatoes separately and divide everything between the stated servings, adding measured lemon juice. Cut into even pieces and simmer until a fork slides through easily, usually 10–15 minutes for small cubes; drain well."
    ]
  },
  "regional-kasza-pork": {
    "ings": [
      [
        "Buckwheat",
        100,
        "g"
      ],
      [
        "Lean pork",
        350,
        "g"
      ],
      [
        "Mushrooms",
        250,
        "g"
      ],
      [
        "Onion",
        120,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "0% Greek yoghurt",
        120,
        "g"
      ],
      [
        "White cabbage",
        250,
        "g"
      ],
      [
        "Carrot",
        120,
        "g"
      ],
      [
        "Lemon juice",
        20,
        "ml"
      ]
    ],
    "servings": 2,
    "steps": [
      "Weigh grains dry and cook following their packet directions.",
      "Cooked grain weighs more than the listed dry amount.",
      "Cook thin pork strips, onion and mushrooms in all measured oil until the pork is fully cooked. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Take off the heat and stir in yoghurt.",
      "Mix shredded cabbage and carrot with lemon juice.",
      "Divide cooked buckwheat, pork sauce and slaw equally.",
      "If preparing ahead, cool promptly in shallow containers, refrigerate within two hours and eat within 48 hours or freeze. Reheat cooked portions only once until steaming hot; keep raw salad and cold sauces separate."
    ]
  },
  "regional-leniwe": {
    "ings": [
      [
        "Quark",
        400,
        "g"
      ],
      [
        "Plain flour",
        110,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Spinach",
        250,
        "g"
      ],
      [
        "Mushrooms",
        200,
        "g"
      ],
      [
        "Cooking oil",
        6,
        "g"
      ],
      [
        "Carrot",
        200,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Mix quark, egg and flour into a soft dough.",
      "Shape small ropes and cut into bite-sized dumplings, keeping all dusting flour within the listed weight.",
      "Boil in batches until dumplings are firm and cooked through, allowing several minutes after they float.",
      "Soften mushrooms and spinach in all measured oil. Allow the mushrooms to release their liquid and let that liquid evaporate before moving to the next stage, so the filling is not watery.",
      "Serve the stated servings of dumplings and vegetables with grated carrot.",
      "This is a savoury adaptation rather than a butter-and-sugar topping."
    ]
  },
  "regional-slow-fasolka": {
    "ings": [
      [
        "Cannellini beans",
        700,
        "g"
      ],
      [
        "Turkey mince",
        600,
        "g"
      ],
      [
        "Onion",
        200,
        "g"
      ],
      [
        "Passata",
        600,
        "g"
      ],
      [
        "Paprika",
        4,
        "g"
      ],
      [
        "Garlic",
        10,
        "g"
      ],
      [
        "Cooking oil",
        8,
        "g"
      ],
      [
        "Wholemeal bread",
        200,
        "g"
      ]
    ],
    "servings": 4,
    "steps": [
      "Use fully thawed meat and follow the slow cooker’s fill and liquid guidance. The listed hands-on time excludes slow cooking; never put frozen meat into this method.",
      "Use drained canned beans. Brown turkey and onion in all measured oil in a pan, breaking the mince into small pieces. Use a non-stick pan over medium-high heat, breaking the mince into small pieces for about 7–10 minutes rather than leaving large clumps.",
      "Transfer to the slow cooker with beans, passata, garlic and paprika.",
      "Cook on High for about four hours or following the appliance guide, until fully cooked and piping hot.",
      "Check the centre of the meat reaches 75°C for at least 30 seconds.",
      "Serve the stated servings with bread.",
      "Turkey replaces smoked sausage in this adaptation.",
      "Divide into the stated servings. Cool promptly and refrigerate within two hours; use within 48 hours or freeze.",
      "For rice dishes, cool within one hour, refrigerate for no more than 24 hours and reheat only once until steaming hot."
    ]
  },
  "regional-sernik": {
    "ings": [
      [
        "Quark",
        350,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Plain flour",
        20,
        "g"
      ],
      [
        "Honey",
        15,
        "g"
      ],
      [
        "Frozen berries",
        150,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Prepare frozen berries following their packet instructions. If heating is required, cook them as directed and cool promptly before combining with yoghurt, milk or a cold filling; do not assume every pack is ready to eat frozen.",
      "Mix quark, egg, flour and measured honey and divide between two oven-safe dishes.",
      "Bake at 170°C for about 30–40 minutes until fully set throughout.",
      "Cook berries following their packet instructions.",
      "Cool the baked pots promptly and refrigerate; add half the berries to each before serving.",
      "This is a small crustless, lightly sweetened adaptation."
    ]
  },
  "regional-szarlotka": {
    "ings": [
      [
        "Apple",
        350,
        "g"
      ],
      [
        "Oats",
        60,
        "g"
      ],
      [
        "Cinnamon",
        2,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "Honey",
        10,
        "g"
      ],
      [
        "0% Greek yoghurt",
        250,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Slice apples into a small oven dish and mix with cinnamon.",
      "Mix oats with all measured oil and honey and scatter over the fruit.",
      "Bake at 180°C for 25–30 minutes until apples are soft and the top golden.",
      "Divide and serve with yoghurt. The oat topping replaces traditional pastry in this adaptation.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  },
  "regional-racuchy": {
    "ings": [
      [
        "Plain flour",
        70,
        "g"
      ],
      [
        "Eggs",
        1,
        "piece"
      ],
      [
        "Skimmed milk",
        100,
        "ml"
      ],
      [
        "Apple",
        200,
        "g"
      ],
      [
        "Cooking oil",
        4,
        "g"
      ],
      [
        "0% Greek yoghurt",
        200,
        "g"
      ],
      [
        "Cinnamon",
        1,
        "g"
      ]
    ],
    "servings": 2,
    "steps": [
      "Whisk flour, egg and milk into a batter and fold in finely grated apple and cinnamon.",
      "Use all measured oil across a non-stick pan and cook thin small pancakes on both sides until the batter is fully set.",
      "Divide equally with yoghurt. These are thin, yeast-free mini pancakes inspired by racuchy.",
      "Serve fresh, or cover and keep chilled at 5°C or below. Use a prepared tuna filling within 24 hours and follow the dairy pack’s use-by instructions."
    ]
  }
};
 function steps(recipe){
  if(!recipe||recipe.custom||recipe.unavailable||!Object.hasOwn(entries,recipe.id))return null;
  const entry=entries[recipe.id];
  if((recipe.servings??1)!==entry.servings||JSON.stringify(recipe.ings)!==JSON.stringify(entry.ings))return null;
  return entry.steps.slice();
 }
 root.RecipeMethodDetails=Object.freeze({steps,ids:Object.freeze(Object.keys(entries))});
})(globalThis);
