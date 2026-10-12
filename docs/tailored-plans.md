# Tailored meal requests

Open **Tailor my plan** from Today, Plan or Settings. Describe a 1–14-day
period, the meals you want, and optional daily nutrition limits. Review the
interpretation and matching saved recipes, choose Repeat or Variety for each
meal, confirm equipment you own, then select **Fit this plan**.

For example: “For the next 7 days, a variety of overnight oats for breakfast,
tuna pickles eggs and mayo salad with a wrap for lunch, and a chicken dish for
dinner. 1800 calories a day or under, 180g protein, 90g carbs and as little fat
as possible.” This means three meals per day, a strict calorie ceiling, a
protein minimum, a carbohydrate target within ±10%, and a lower-fat preference.
The review also supports carbohydrate ceilings and optional strict fat caps.
Both inline values such as `150g protein` and labelled lines such as
`Protein: 150g` work. Each label owns its value; values never cross line breaks
into the following macro. `Calories: 1600 or less` is a ceiling.

Alternative formats are alternatives: “tuna based dish, salad boxes or wrap”
requires tuna, with either a salad or a wrap. It does not require every format
in one recipe. Broad requests such as “anything chicken” use variety.

## Meals on specific days

“Chicken, one day where I can have a steak at the end” keeps chicken as the
ordinary dinner rule and creates a separate steak dinner on the final plan day.
The review shows editable day, meal type, query and matching recipe controls.
Users can add or remove these scheduled meals themselves. Day numbers are
positions in the plan, not calendar dates. Duplicate meal/day combinations,
out-of-period days, missing recipes and inactive meal types are rejected.

The scheduled meal replaces that meal type only on its chosen day. It cannot
spill into ordinary days, or count toward ordinary chicken variety. Scheduled
recipes survive library sampling, reload and JSON backup/restore. Generation,
browser acceptance, swaps and plan explanations share the same day-aware rules.
Already cooked meals remain protected; a conflicting historical meal can prevent
the new request fitting. Removing meal rules also removes scheduled meals.

## Budget and recipe choices

The exact 14-day example with varied overnight oats, tuna salads or wraps,
chicken dinners and one final steak dinner is validated with a £35 weekly
budget (£70 for the full period), a 1,600 kcal ceiling, 150g protein minimum,
90g carbs target (±10%) and a strict 20g fat cap. Current ASDA snapshot checks
found a £66.95 complete-pack plan; prices, household size, stock, kept meals,
appliances and exclusions can change that result. This is an estimate, not a
promise that the same budget will always fit. A calorie ceiling does not add
food simply to reach 1,600 kcal.

Seven more original measured recipes add overnight oats, lean tuna/Skyr
vegetable salad boxes and wraps, shared-ingredient chicken/rice dinners and a
lean medallion steak plate. Frozen vegetables are cooked and cooled before
adding to the tuna lunches. Methods include chilled-storage guidance; a
two-week plan does not imply storing prepared oats or tuna salad for two weeks.
The formulations have software checks, not claims of physical kitchen testing.

The raw lean medallion nutrition reference is the published **as-sold** label
for [Tesco 2 Beef Medallion Steaks 340G](https://www.tesco.com/shop/en-GB/products/308079625):
110 kcal, 22.4g protein, 0g carbs and 2.3g fat per 100g. It is explicitly labelled
as a representative ingredient estimate. Check the purchased pack; brands,
cuts and trimming vary. Pan-fried ASDA values are not applied to raw weights.
ASDA price matches require medallion steak, excluding mince and other cuts;
nutrition is not inferred from a supermarket listing or a low price.

The planner keeps inexpensive macro-safe portions alongside preferred ones.
If the first search fails the budget, a second bounded search ranks by cost
with identical meals, nutrition, portions and prices. Lower-fat or cooking-ease
preferences cannot be the only search route through a hard budget. No cap,
protein minimum, recipe rule or household budget is changed automatically.

Variety requires at least two matching recipes when planning more than one day;
one recipe may appear on at most half the days, rounded up. Repeat uses one
chosen recipe every day. Planner chooses leaves that meal unrestricted. A
tailored plan follows these meal rules without requiring unrelated protein
families. Existing food exclusions, equipment, cooking time, whole-pack budget,
pantry, leftovers and cooked or kept meals remain constraints.

Meals are gathered from the built-in, imported and saved recipe library. Up to
30 eligible matches per meal enter the reviewed brief, and the existing bounded
planner selects among them. Missing dishes can be imported or created from
Recipes. The AI does not create nutrition facts, retailer products or prices.
Thirteen original measured recipes add protein-focused overnight oats, leaner
tuna lunches, chicken dinners and the medallion steak plate.

Oats, eggs, mayo and chicken naturally contain fat. Lower fat ranks valid
options and does not promise zero fat or a global minimum. A numeric fat cap,
including zero, is strict. Required but unknown macros prevent accepting the
plan. Nutrition remains an estimate based on ingredients or confirmed labels.
If no plan passes all checks, saved meals and prior settings are retained, with
the request saved as an editable draft. Changes made while fitting are preserved.

Meal requests and optional limits persist on the device and in backups. Removing
meal rules keeps the current meals and optional macro limits. Reset macro limits
returns to the existing calorie range and protein minimum. Swaps and planned
nutrition badges use the same hard limits as generation. Intake is recorded only
when the user logs food eaten; generating a plan does not create diary entries.

`POST /api/planner/interpret` accepts only the request (maximum 2,000 characters)
and bounded planning defaults. It uses the existing same-origin importer access
and shared free AI allowance. Groq interprets text when configured and available;
a deterministic, editable interpretation works without AI or while the allowance
is unavailable. Explicit recognised food requests and numeric caps are preserved
across AI interpretation. No diary, pantry, cooking history or retailer catalogue
is sent for interpretation.

`POST /api/planner/generate` validates macro limits and recipe identities before
catalogue calculation. A small vertex solver handles up to four portion variables
with calorie, protein, carbohydrate and fat boundaries. Recipe sampling retains
reviewed choices, and macro-aware candidate pools retain protein-dense options
alongside cheaper recipes. All accepted plans still pass browser-side nutrition,
meal, cooked-quantity, variety and exact full-pack basket verification.
