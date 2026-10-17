# One-off meals

Open **One-off meal** on Today or beside the recipe library actions. It starts
with Dinner and a £10 total budget, uses the selected supermarket, and allows
1–8 people. Choose another meal type or an ingredient/dish search if wanted.
Pantry deductions are optional. The budget belongs to this meal, independently
of weekly spending and full-day calorie, protein or variety targets.

Food exclusions, dietary preferences, equipment, recipe feedback and cooking
time are respected. Only suitable measured recipes with known calories and
protein enter the browser request. The server also checks the meal type, search,
diet, equipment and time. Complete price calculations are sorted by checkout
cost; up to 12 options appear. Missing prices are excluded rather than treated
as zero. A failed search reports the cheapest fully priced match, when known,
and how many recipes have unpriced ingredients.

Checkout cost includes every full pack needed after active pantry deductions,
shared ingredients, recipe yields and people. Fixed recipes retain whole batches
and show extra portions. A pantry-covered measured meal can cost £0 to buy.
Pantry is only inspected; finding a meal does not consume it or record spending.

Lidl uses the same collected UK prices and labelled Aldi fallbacks as normal
planning. Optional personal Lidl pack prices remain request-local. Aldi and
historical references retain estimate labels, original dates, regions and source
links. Results are saved-price calculations; check current shelf prices and stock.

Each result has a separate shopping list to copy/download and a recipe view
scaled to the requested people, with a Back to one-off meals action. Weekly
meals, locks, household settings, pantry, food diary and purchase ledger remain
unchanged. Only the form's last choices are saved. Results expire after 30 minutes;
changing the form, recipes, store, profile or pantry requires a fresh check.
Closing or editing cancels pending requests and late responses are ignored.
New price searches require a connection; offline errors retain the saved plan.

`POST /api/meals/one-off` validates bounded input and runs through the existing
catalogue worker so catalogue loads do not block health checks. Prices are matched
once for the recipe ingredient pool; each meal then receives its own pack plan.
The browser independently rebuilds quantities and checks sources, pack costs,
totals, people and the budget before displaying the option. No AI-generated
price or paid service is needed.

Tests exercise full-pack vs consumed cost, exact-penny limits, people/yields,
optional/complete pantry coverage, fixed batches, missing quantities/prices,
food/equipment constraints, worker cancellation, source validation, altered totals,
state isolation, stale responses and the HTTP endpoint. Browser checks cover
£10 for one person, real Lidl/Aldi quotes, recipe scaling, clipboard shopping,
empty results, offline feedback and phone/desktop layouts.

The **Try frozen chicken dinners** shortcut searches the measured frozen dinner
collection. These recipes show preparation time plus oven time, retain frozen
pack instructions in copied lists, and use labelled Aldi estimates when Lidl
has no compatible frozen pack price. See [frozen chicken](frozen-chicken.md).
