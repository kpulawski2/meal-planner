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
Six original measured recipes add protein-focused overnight oats, a lighter
tuna-pickle-egg-mayo-yoghurt wrap and two chicken dinners.

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
