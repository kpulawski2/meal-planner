# Everyday planning features

These features use the existing app and browser storage. There is no subscription or paid AI requirement for stock tracking, supermarket matching, planning, swaps or cooking mode.

## Food diary

Home has a dated **Food diary** for your own intake. **Log food** searches common foods, your saved food labels and recipes with complete nutrition estimates. Choose the amount you ate; calories, protein, carbs and fat scale to that amount. Common-food values are generic estimates, not supermarket product labels. Dry grains and raw chicken are identified by weight basis; cooked rice and cooked pasta have separate entries. Unsupported quantity conversions cannot be logged as complete estimates.

For packaged snacks or drinks, **Enter label** accepts the calories and optional macros for a measured label amount (g, ml or a portion). The app calculates the amount eaten and can save that label for next time. Missing macros remain unknown rather than being represented as a complete zero. This is a food diary with a small common-food reference list, not a complete branded-food database, barcode scanner or micronutrient tracker.

**Log eaten** on a planned meal opens its per-person portion for review. It never automatically logs the whole household's portions. Repeating that action for the same plan slot and date cannot add a second copy: edit or remove its diary entry instead. You can edit an entry's date and quantity, or remove it. Diary entries retain their recorded nutrition even if a recipe changes later.

Logged intake and planned nutrition are separate. Planning, shopping, cooking and leftovers do not automatically record consumption. Food logging does not change pantry stock, remaining shopping or recorded spending, and snacks in the diary do not silently replace a planned meal or alter planner targets. Dates are real calendar dates on this device, independent of the plan's weekday labels. The diary and saved labels stay in backups and carry over when starting a new week.

## Repeated daily meals

In Settings, **Meals per day → 3** creates Breakfast, Lunch and Dinner without an automatic snack slot. **Variety → Repeat favourites** permits the same recipes on consecutive days and removes the weekly minimum variety and protein-family mix requirements. The other variety modes retain their existing requirements.

Choose an **Every day** recipe for each active meal type, or leave a type to the planner. A recipe's **Repeat this breakfast/lunch/dinner** action selects it in these settings. Review all choices and use **Save & fit my plan**. Selected recipes are retained in the bounded planner library; they are not silently replaced when unavailable, unpriced or incompatible. Recipe portions may adjust to the configured daily calorie range and protein minimum.

Meal roles, distinct dishes within a day, dietary exclusions, measured nutrition, full-pack supermarket pricing, pantry/leftover deductions and recorded spending still apply. A conflicting kept meal requires reviewing the lock; cooked meals and their portions remain fixed. A failed fit retains the saved plan. Existing overnight-oats recipes, the measured **Tuna, Pickle, Egg & Mayo Wrap**, and chicken dinners can be selected for a repeated three-meal routine.

## Purchases and pantry stock

The app cannot detect a checkout at ASDA or Lidl. To record a purchase:

1. Open **Shopping**, with the supermarket you used selected.
2. Tick the ingredients you bought.
3. Select **Shopping done · add to pantry**.
4. Review the selected packs and confirm the purchase.

Confirmation adds the full purchased pack quantities to the pantry, including the amount beyond the recipe's immediate need. It records the checked catalogue cost against the current plan. Ticking an item alone does not add stock or record a purchase. Purchases outside this list can be added through **Add stock manually** in Pantry.

The purchase confirmation requires a current online pack check. Missing quantities, unpublished prices, stale prices or a changed list prevent confirmation. Individual produce weights and some usable pack quantities are estimates and are labelled. The recorded cost is the checked catalogue price; the app does not read a receipt, an actual checkout total, supermarket accounts or bank transactions.

You can set an optional expiry date on each stock entry. Entries past that date are excluded from shopping deductions and planning. Expiry dates are supplied by the user; the app does not inspect food or infer its condition.

## Cooking and leftovers

Select **Meal cooked** on a planned meal, or from cooking mode. Review the household portions and any extra portions to keep. Confirmation deducts measured ingredients from recorded pantry stock, using the earliest recorded expiry first. Missing stock needs an explicit confirmation that you supplied it; the app does not create stock for missing ingredients.

Extra cooked portions are stored separately as leftovers. Matching leftovers reduce the ingredients needed by later occurrences of the same recipe. **Use leftovers** records the portions actually served and reduces that leftover stock. Changed ingredients or recipe yields do not reuse old leftovers under a different recipe signature.

Cooked meals keep their recipe and portions fixed within the current plan. Undo the cooking record before changing those portions. Recent stock activity has **Undo** when later actions have not changed the affected stock. Undo later dependent actions first when necessary.

## Budget checks and meal swaps

The weekly dashboard shows the projected plan cost, remaining shopping, recorded purchases, nutrition targets and meal variety. Projected cost is the current plan's recorded purchases plus the remaining full supermarket packs. Existing pantry stock and matching leftovers reduce the remaining shopping. Unknown costs remain unknown.

**Swap** offers recipes of the same meal type that suit your preferences. Household portions are kept. **Check swap** prices the whole remaining basket before and after the change, including pack thresholds and pantry deductions. A suitable ingredient cost per portion is not a substitute for this full basket check.

A swap is marked safe only when:

- Every remaining ingredient quantity has a validated purchase plan from the selected supermarket.
- Recorded spending plus remaining packs fits the household budget for the plan length.
- Every day has complete nutrition and meets the calorie range and protein minimum.
- Meal types, current dietary restrictions and weekly variety pass.

A final online pack check runs before the change is applied. Changes to the plan, pantry, portions, preferences, cooked records, catalogue generation or prices invalidate an earlier preview. Locked or cooked slots cannot be swapped.

When a complete quote would exceed the budget or miss nutrition or variety targets, the app shows those changes and requires a separate acknowledgement. Such a choice is never marked safe. A swap with missing prices or incompatible future meal slots cannot be applied.

Already consumed meals remain part of the day's nutrition and the plan's history after a preference change. This exception does not allow a future occurrence or an uncooked portion of an excluded recipe.

## Preferences and recipe details

**Create recipe** opens personal recipe entry without requiring an import. Add measured ingredients using the name/amount/unit helper, or edit the full ingredient list. Nutrition previews show calories and macros per recipe serving, including oils and sauces. **My recipes** filters the collection to your local recipes. Editing the yield or ingredient amounts previews the recalculated estimate and clears outdated verified values when saved; incomplete ingredients remain flagged for review. Unknown foods are not assigned invented nutrition. Regular mayonnaise and drained pickled gherkins use labelled generic estimates in the new wrap.

**Would eat again** raises a recipe's preference score. **Skip next time** excludes it from future automatic choices. Recent cooking history reduces the preference for meals cooked recently; it does not override nutrition, pricing, diet or variety checks.

Recipe details list missing information that prevents automatic use, such as unmeasured ingredients, an unknown yield, missing steps or incomplete nutrition. A built-in or web recipe can become an editable local copy. Editing quantities or yield clears old nutrition claims so the ingredient estimate can be recalculated. Copies preserve their source reference and do not overwrite the original recipe.

The Everyday collection adds original measured breakfasts, lunches, dinners and snacks. Oils, sauces and garnishes used in those recipes are quantified. Nutrition is estimated from ingredients, and supermarket pack costs are calculated separately.

## Cooking mode and offline use

**Cooking mode** displays one recipe step at a time, scaled ingredients and timers. A supported browser can keep the screen awake. Timers require the app to remain open; this is not a background alarm service.

The app saves the most recently checked shopping basket for each supermarket. When offline, a matching saved basket shows its check time. Changed quantities or a different supermarket cannot borrow an incompatible saved quote. Purchase confirmation and swap confirmation require fresh online checks.

Pantry stock, leftovers, taste preferences, cooking history and saved baskets are kept on this device in browser storage. They are included in app backups. There is no automatic account synchronisation between a phone and another browser, and clearing browser data removes local state unless restored from a backup.

## Starting the next week

**Start new week** asks for confirmation, archives the previous plan and starts a new spending period. Pantry stock, leftovers, custom recipes and taste preferences carry over. Re-fitting the current week keeps its purchases and cooked meals in that same spending period.

## Catalogue limits

Prices are supermarket catalogue snapshots, not guaranteed store checkout prices or stock reservations. Lidl does not publish prices for every essential product, so the app cannot certify a complete Lidl budget when required prices are missing. It preserves existing plans when no fully verified replacement can be found.

## Favourites

The Favourites tab shows every saved recipe independently of the Recipes tab's
filters. Tap a recipe's heart to save or remove it. Search by meal or ingredient,
filter by meal category, view the recipe, or add it to a plan. Saved favourites
survive reloads, backup restore and starting a new week. A missing web recipe's
saved link is retained while the collection is offline.

## Browse Lidl ingredients

Select Lidl in Settings, then open Shopping and choose **Browse Lidl ingredients**.
You can browse the full saved food range before generating a plan, including
unpriced entries, or search and filter by food category and price availability.
Additional official range references show their source year/month and link.
Their current pack, price and stock remain unknown until checked in store.
Browsing does not change your shopping list, pantry or budget.

## Cook from my pantry and meal routines

The Pantry tab compares measured recipe ingredients with active stock for the
current household size. Lots and duplicate recipe ingredients are combined in
compatible units. Expired or invalid dated stock is excluded; stock expiring
within three days is highlighted. Full-batch recipes require their entire batch,
and estimated quantities remain labelled. Ready meals appear first, followed by
recipes missing at most two ingredients. Suggestions each check the stock
independently. They do not reserve food, change spending or mark meals cooked.
The normal Plan meal action checks the plan before applying a change.

Meal routines are available in Favourites and Settings. Choose Repeat favourites
and one or more daily recipe choices, then name a routine. Up to 20 routines
are stored locally and included in the existing backup export. Unselected slots
remain Planner chooses. Loading a routine restores only the meal count and
daily recipe choices: household size, targets, dietary settings and budget stay
as currently set. Missing or incompatible recipes prevent loading. Review
Settings and use Save & fit my plan to generate a week through the existing
nutrition, budget and cooked-meal checks. Saving or loading a routine never
replaces the saved week or changes pantry, leftovers or purchase history.

## Social recipes and equipment

Recipes → TikTok ideas contains 60 measured breakfasts, bowls, batch lunches,
air-fryer dishes, slow-cooker pots and quick meals/snacks. Filter by equipment,
recipe style or @smoothieflip, and save favourites or make editable copies.
Settings groups 21 appliances; recipe editing supports explicit required
equipment. Planning respects those requirements while browsing stays open.
Hands-on time is shown separately from chilling/slow cooking. See
[the collection's sources and batch behaviour](social-recipes.md).
