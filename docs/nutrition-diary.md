# Nutrition diary

Diary is a main navigation tab. On mobile the five tabs are Today, Plan, Diary,
Shopping list and More. Recipes is available in More and the desktop sidebar.
Today keeps a compact food-diary summary and links to the full diary.

## Track your day

Choose a calendar date with the date field, arrows or Today. The energy summary
shows calories logged and the difference from the selected goal. Protein,
carbohydrate and fat cards show their recorded amounts and progress. Breakfast,
Lunch, Dinner and Snack each have their own Add food action and item totals.
Older entries without a meal group remain under Uncategorised. Tap a food to
change its amount, date or meal, or remove it.

Diary goals follow the planner's calories, protein minimum and any configured
carbohydrate/fat goals or ceilings by default. Diary-only goals let you choose
four tracking goals without changing the planner, saved meals, shopping or
pantry. Optional goals can stay blank. Independent goals, food definitions and
recorded entries are retained in the existing JSON backup.

The 7-day view shows the seven calendar dates ending on the selected date.
Unlogged days show a dash and are excluded from averages. This summarises
recorded intake, which may not include everything eaten. Missing macros are
labelled Unknown or as known lower bounds. It does not infer adherence to a
meal plan or add exercise calories to a food target.

## Find and add food

Add food opens a searchable list with All, Recent, Saved, Common and Recipes
filters. Multiple word fragments narrow local results without sending any
request. Common foods and recipes use the app's existing ingredient estimates;
dry grains and raw chicken are identified by weight basis. Pick a result,
review its amount/date/meal and add it to the diary. Scanning or entering a pack
label uses the existing measured label review and serving/pack controls.

Search packaged foods online submits the search text to Open Food Facts through
the same-origin `GET /api/foods/search?q=...` endpoint. Searches are explicit,
not triggered while typing. Results are UK-tagged community products, at most
20 per query, and require the same editable pack review as barcode results.
An absent result does not establish that a product is unavailable in a shop.
There is no supermarket stock, pricing or guaranteed complete food catalogue.
Saved reviewed labels remain usable offline, and changing them preserves the
values in past diary entries.

The server pins the legacy full-text search URL to Open Food Facts, requests
only needed fields, refuses redirects, and bounds responses to 512 KiB and
12 seconds. Two distinct searches may run concurrently; identical requests
share work. Upstream starts are capped at eight per minute and 100 result sets
are cached for 30 minutes. Barcode lookups now allow 14 uncached starts per
minute, below the published product-read limit. Failure, busy and offline
states offer saved foods, barcode input or manual label entry.

Only submitted search text or the scanned barcode goes to the public database.
Diary dates, amounts, goals, history, photos and camera frames stay local.
Results retain Open Food Facts / ODbL attribution and product links. This adds
no subscription, paid AI dependency or nutrition API credential.

## Reuse meals and review nutrients

Copy a meal / day lets you choose a source date, meal group or whole day, and
destination date. Review the foods and amounts before confirming. Adding to a
date that already has recorded food requires a separate acknowledgement. The
copy appends new diary entries with their historical nutrition; it never marks
a planned meal cooked or changes stock. Changed source records or copy options
invalidate the preview. A full diary or failed storage write leaves the saved
entries unchanged.

Nutrient detail separates label nutrients, minerals and vitamins. In addition
to fibre, sugars, saturates, salt and sodium it supports potassium, calcium,
iron, magnesium, zinc and vitamins C, D, B12, B6 and E. Only values supplied by
the food data or entered from a label are recorded. Mineral and applicable
vitamin values use mg; vitamins D and B12 use micrograms. Open Food Facts'
normalised gram values convert to those display/storage units. Small values
retain useful precision. Known zero, no data and partial coverage stay distinct.
No recommended vitamin/mineral targets or missing nutrients are invented.

## Checks and references

Pure tests cover goals, grouped totals, copying, stale previews, nutrient-unit
conversion and bounded/cached product searches. Browser checks cover actual
navigation and logging, review/confirmation, offline saved labels, copying into
occupied days, independent goals, seven-day navigation, storage errors,
cancelled/failed searches and backup restore. Layouts are checked at 320, 390,
768 and 1440 px in light and dark. External search responses are fixtures;
direct Open Food Facts access is unavailable in this executor. Existing real
barcode-image decoding and camera lifecycle checks remain in place; physical
phone-camera testing is separate.

Workflow reference: [Cronometer Add a Food](https://support.cronometer.com/hc/en-us/articles/360018955211-Mobile-Add-a-Food).
Search and limits: [Open Food Facts API documentation](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/)
and [official full-text search example](https://openfoodfacts.github.io/openfoodfacts-androidapp/app/openfoodfacts.github.scrachx.openfood.network.services/-products-a-p-i/search-product-by-name.html).
Unit semantics: [Open Food Facts nutrition normalisation](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/lib/ProductOpener/Nutrition.pm).
The app uses its own design and food data sources; it does not use Cronometer's
proprietary databases or claim the same nutrient coverage.
