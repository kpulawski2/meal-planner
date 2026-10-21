# Recipe preferences and food scanning

## Like and dislike

Recipe cards, Today/Plan meals and recipe details expose Like and Dislike.
The selected button has `aria-pressed=true`. Selecting it again clears the
choice. More → Recipe likes & dislikes lists both kinds of preferences and
offers Clear choice. Existing `again` / `skip` feedback is retained without
a migration. Favourites are still independent saved recipes.

Dislike excludes the recipe from future generation, swaps and suggestions
through the existing shared recipe eligibility check. Editable copies retain
the existing source-feedback inheritance. Likes rank otherwise suitable meals;
they do not override budget, nutrition, dietary or equipment requirements.

On dislike, conflicting daily, tailored and scheduled recipe choices are
removed and uncooked keeps are released. A stale assistant plan draft is
cleared. The saved plan is not regenerated automatically, and food already
cooked or logged remains in history. Update plan without disliked meals runs
the existing checked planner; failed searches keep the saved plan. Clearing a
dislike permits the recipe again but does not restore removed repeat rules.

Preferences save on this device, survive reload/new weeks and use existing
backup support. A storage failure leaves the prior preference and plan intact.

## Scan, review and log

The food diary supports live rear-camera scanning, typed EAN/UPC numbers,
saved scanned foods and a barcode photo. JPEG/PNG/WebP photos up to 12 MiB
are decoded locally by the pinned ZXing bundle. The photo must show a readable
printed barcode; food-photo recognition is not part of this flow. Camera
autofocus/torch controls depend on device support. Closing or hiding the app
stops camera tracks and ignores late lookup/decode results.

Online lookup uses Open Food Facts through the existing bounded same-origin
endpoint. Only the barcode goes to that database. Camera frames, photos, diary
entries and amounts remain on the device. Existing attribution, cache and rate
limits are unchanged; see [kitchen insights](kitchen-insights.md).

The review screen shows the product, editable label, date, diary meal and live
nutrition for the amount eaten. Users must confirm the current label before
logging scanned data. Changing label nutrition or its basis clears confirmation.
Calories are required; missing optional values remain unknown.

Declared serving and pack weights are retained when their units match the
nutrition basis. Explicit kg/l amounts convert to g/ml. A serving description
such as “1 pot (150 g)” can supply its weight; an unmeasured “one bowl” cannot.
The user can correct weights from the current pack. Grams and millilitres are
never equated. Choose measured amounts, fractional servings or packs, including
half/one/two serving and whole-pack shortcuts. Add & scan next preserves the
diary date and meal group.

Optional fibre, sugars, saturated fat and salt are stored in grams, sodium in
milligrams. Only declared values are used; no missing nutrient or micronutrient
is inferred. Diary totals distinguish known zero, entirely unknown and partial
coverage. Saved labels retain serving/pack information and can be reused
offline. Updating a saved label never rewrites previous entries.

Logging saves the food and diary entry together. Full device storage does not
leave a partially saved label or entry. Logging never changes household meals,
targets, pantry stock, purchases or the shopping list.

## Validation and references

Automated checks cover serving/pack units, sodium conversion, missing values,
history snapshots, dislike inheritance/undo, repeat-rule cleanup and failed
storage. Chromium checks cover a real EAN-13 image through the shipped decoder,
portion review, label corrections, repeated scans, offline saved labels,
preference persistence, camera/torch cleanup and 320/390/1440 px layouts.
Camera hardware is mocked in those checks; physical phone scanning remains a
device-specific check. Product responses are fixtures because this executor
cannot reach Open Food Facts directly.

Workflow inspiration: [Cronometer’s Add a Food guide](https://support.cronometer.com/hc/en-us/articles/360018955211-Mobile-Add-a-Food).
Product-field semantics: [Open Food Facts nutrition data documentation](https://openfoodfacts.github.io/documentation/docs/Product-Opener/dev/explain-nutrition-data/)
and [nutrition schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_nutrition/).
This implementation uses the app’s own UI and Open Food Facts data, and does
not claim Cronometer’s full database or micronutrient coverage.
