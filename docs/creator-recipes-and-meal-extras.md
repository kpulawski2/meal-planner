Eliya Eats recipes and optional meal extras
=========================================

The recipe bank includes 157 independently measured adaptations from 150 free
public Eliya Eats recipe pages, checked on 8–9 November 2026. This covers the public
recipes we could verify on her website, including older archives and the five
individual dishes in each of the rice-paper and meal-prep articles. The muffin
roundup points to the existing individual recipes instead of creating duplicates.
It is not a claim to cover every TikTok post, unpublished recipe or paid ebook.
`data/creator-source-audit.json` records every source and corresponding recipe ID.

Recipes → Eliya Eats opens the collection. It includes chicken funghi and mash,
curry bowls, lasagnes, fakeaway burgers and nuggets, noodle salad boxes, rice-paper
pies, overnight oats, pancake bowls, muffins and desserts. Each adaptation links
to the creator’s original recipe and explains its changes. No creator photographs,
prose or published macro claims are copied. The shared ingredient calculator
estimates nutrition from this version’s quantities, including oils, coatings,
sauces and toppings. The recipes have not been kitchen-tested.

Meals generally define one portion and scale to the user’s selected amount.
Recipes that require a complete prepared batch explicitly record their yield,
serving unit, storage guidance and whole-batch shopping quantities. For example,
one truffle portion is two truffles and the complete batch is twelve truffles.
Equipment requirements and saved dislikes continue to constrain planning.

Plan → a meal → Meal options → Sauce or side offers one optional sauce and one
optional side. The user sets an extra-calorie allowance per main-meal portion and
can select quarter, half or multiple portions of each extra. The picker filters
options to the remaining allowance and prevents saving over the allowance. It
shows the resulting meal calories, protein and day calorie total before saving.
If that day exceeds the daily goal, it says so without silently changing any meal.
Amounts scale with the main meal’s portion count: two main portions include two
sets of the selected per-portion extras.

There are 14 original measured pairing recipes, alongside suitable creator sauces
and sides. Full batch preparations such as a tray of rolls or nut spread stay separate; the
picker does not pretend a tiny fraction of a required batch can be prepared.
Recipes → Sauces & sides also provides a Pair with a meal route for suitable
extras. Main recipes already include any sauces listed in their ingredients;
optional extras are additional food, not replacements for an existing ingredient.

Saving creates an immutable personal combined recipe for that single planned
meal. The original main, 2/1/1-style portion settings, other meals, locks, diary,
pantry and purchases are retained. Shared nutrition, shopping, pantry cooking,
food logging and backup then operate on the same combined measured ingredients.
Recipe view and cooking mode also show the amounts for the main, sauce and side
separately, so shared oil or seasoning is allocated once to each component.
For an existing batch main, extras apply to each portion of its complete batch,
and the picker explicitly explains that shopping consequence. Reopening can
replace or remove extras without stacking previous ingredients. Edits to the
combined recipe itself become a new base so later changes cannot discard them.
Identical main-and-extra combinations reuse one recipe across days, allowing
fixed batches to be shared. Each meal keeps its own saved calorie allowance.

Cooked or partially cooked meals cannot be changed. Saving rechecks the current
meal, selected extra definitions, profile, equipment, preferences, portion count and cooking state; stale
previews cannot overwrite newer choices. Local storage is written before memory
or UI state changes. If saving fails, the existing plan stays intact. Old combined
recipes are retained for diary/history references. No cloud account or new
service is required.

The catalogue request bound is shared between HTTP validation and the worker at
500 ingredients. The expanded complete library exceeds the previous 200-item
bound. Product matching distinguishes breakfast wheat biscuits from sweet
biscuits, plain Biscoff biscuits from chocolate-coated variants, crisp rice cereal
from snack bars, fresh herbs from dried herbs, and plain gochujang from ready
meals. Standard retailer synonyms are normalized consistently in search and
compatibility checks. Missing specialist ingredients remain explicitly unpriced;
no prices or product availability are invented.

Verification
------------

The Node checks cover audited source completeness, calculated nutrition,
one-portion and batch shopping, catalogue product identity, calorie caps,
immutable single-meal changes, preserved stock/diary/portion choices, stale and
cooked guards, replacement/removal and backup. The browser journey covers
creator discovery and source links, pairing from the library, cap enforcement,
storage failure recovery, saved quantities, diary logging, reload, removal,
four viewport sizes and offline use. The existing cereal/tuna/chicken planning,
receipt review and full-screen barcode-scanning journeys remain in the suite.

The four new browser modules are cached in service-worker shell
`meal-planner-shell-v61-creator-meal-extras`; the existing iOS wrapper picks up the
web update on reload without a native rebuild.
