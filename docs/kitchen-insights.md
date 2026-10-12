# Plan explanations, barcode diary and weekly check-in

Today and Plan expose **Why this plan?** and **Weekly check-in**. The More menu
also links to check-in. The actual food diary offers **Scan barcode**.

## Explain a fit

The explanation reviews the most recent generation request, including an
unsuccessful tailored request whose settings were rolled back. Without a
recent request, it reviews current settings and saved daily nutrition. It
shows selected and nutritionally complete recipes, missing published ingredient
prices, variety requirements, conflicting uncooked locks, and observed budget
gaps. Suggestions open editable settings or recipe previews; they never change
targets, kept/cooked meals or saved plans automatically. A suggested budget
includes recorded spending, while the displayed proposal cost is for remaining
packs. Save & fit is still required.

Individual impossible limits are explained using necessary bounds over allowed
recipes at the free portion range (0.5–2 portions). These bounds apply only
when at least one day is entirely unfixed. Historical kept or cooked quantities
can fall outside that range. A search failure is otherwise described as a
bounded search failure, not proof that no possible plan exists. Nutrition and
meal rules remain hard requirements; unknown values never satisfy them.

## Scan and review a pack

EAN/UPC input supports valid 8-, 12-, 13- and 14-digit checksums, preserving
leading zeroes. Camera scanning uses the native detector where supported and
a pinned local ZXing decoder otherwise. Rear camera access requires a secure
context and permission. Frames stay on the device; only the barcode goes to
the same-origin product endpoint. Permission, detection and lookup results
arriving after close are ignored. Tracks stop on result, Stop camera, close,
page hide and tab hide, including delayed permission and decoder startup.

`GET /api/foods/barcode/:code` queries the fixed Open Food Facts v3 food endpoint
with a named application User-Agent. Redirects are refused. Responses are
limited to 128 KiB and 12 seconds. The process allows two concurrent distinct
lookups and 40 uncached starts per minute, in addition to the existing client
rate limit. Identical requests share work without one disconnected caller
cancelling other callers. A bounded 300-entry cache keeps found results for six
hours and missing results for 15 minutes. No API key or paid AI is required.

Database names and calories/macros are editable. Missing calories must be
entered before logging; missing optional macros stay unknown. Explicit kJ may
be converted with a warning, while calories are never inferred from macros.
Values are per 100 g unless the response explicitly states 100 ml. The user
must check the current product, values and g/ml basis and tick confirmation
before adding food. Mass and volume are never silently equated.

Not-found, offline, busy or failed lookup offers manual pack entry. Reviewed
labels can be saved and reused locally without another product request;
rescanning asks for pack confirmation again. Updating a saved barcode label
keeps historical diary entries unchanged. Reviewed source metadata survives
reload and existing JSON backup/restore. Community product data is not a
claim of verified label accuracy or supermarket availability.

## Review recorded activity

Choose a review-ending date for the preceding seven calendar days. Diary dates
are explicit user selections. Purchase/cooking timestamps use Europe/London,
including daylight saving changes. The review is read-only and spans plan IDs.
It recomputes intake from food definitions and amounts, excludes duplicate
records and unlogged days, and reports each nutrient's number of days with
complete recorded values. A day with a missing macro is excluded from that
macro's average. These are summaries of recorded food, not complete intake or
a measure of adherence to planned meals.

Spending includes dated active purchase transactions, excluding undone
transactions. No purchases or an unknown purchase price means an unknown
total, not zero spending. Cooking confirmations and leftover uses are shown
separately from food eaten. Meals marked “Would eat again” appear when rated
during the period or cooked during it. Ideas link to existing diary, pantry,
recipe and tailored-plan tools; they do not change the plan automatically.

## Data and dependencies

Product data is attributed to [Open Food Facts](https://world.openfoodfacts.org/)
and [ODbL](https://opendatacommons.org/licenses/odbl/1-0/), with a fixed product
link in each reviewed label. Saved product fields remain local unless the
user exports a backup. The diary, amounts, dates and camera frames are not sent
to the product database. This app does not redistribute a product catalogue.

`public/vendor/zxing-browser-0.1.5.min.js` is the unmodified UMD browser bundle
from the npm `@zxing/browser` 0.1.5 package, sourced from
[ZXing for JS](https://github.com/zxing-js/browser). Its MIT licence is in
`public/vendor/ZXING-LICENSE.txt`. The bundled `@zxing/library` core uses Apache
2.0; its licence is in `public/vendor/ZXING-LIBRARY-LICENSE.txt`. The decoder is
loaded lazily and cached with the application shell for offline use.

Validation includes mocked product responses, real EAN-13 image decoding,
mobile/desktop Chromium and native/fallback camera lifecycle tests. Live
database access and physical phone-camera scanning still require production
and device checks; the development executor cannot reach Open Food Facts.
