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
