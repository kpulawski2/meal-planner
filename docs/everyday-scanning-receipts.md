# Everyday use, scanning and receipt prices

Today offers **Use simple Today view**: daily logged intake, a next meal, **Log food** and **Shopping list**. **Full view** restores the detailed dashboard. The setting is also in More → Appearance. New installations begin with Simple view.

**Edit plan** includes a real start date. A Sunday start displays Sunday, then Monday, regardless of the older internal meal keys. Today and Plan use the same selected day; the selection follows the calendar on the next day. Logging a planned meal opens its actual date for review. Already cooked meals cannot be moved to a different date: use **Start new week**, which carries pantry and leftovers into a new spending period. Internal pantry/cooking keys remain stable.

Weekly setup saves a separate unfinished draft on this device. Close the sheet or app and return to **Continue setup** to resume budgets, meals, measured cereal/milk and portion counts. **Discard draft** clears only unfinished choices. Preview uses current stock and prices; saving still requires **Save this week**, and clears the draft atomically. Saved plans, diary and stock are unchanged while editing.

**Pin usual portion** on a recipe, or **Pin this amount as a usual** in a diary entry, stores its exact reviewed food definition and amount. Recipe shortcuts show their ingredient amounts. One tap on a Today usual logs it for today; it does not cook a meal or deduct stock. Undo removes that last shortcut entry only while it remains unchanged. Up to twelve usual foods are available in More → Your usual foods; four appear on Simple Today. Saved nutrition is a snapshot: pin again if your recipe changes.

Shopping has **Start shopping**, a checklist, and **Finish shop · review bought items**. Finish uses the existing purchase/pack review before adding stock or recording spending. You can record packs even when online matching is unavailable. **Add receipt photo** opens price review separately; saving prices never invents a purchase or changes inventory.

## Barcode scanner

The camera requests an ideal 1920×1080 rear feed and continuous focus/exposure where supported. The main rear lens is preferred over ultra-wide/front lenses. Camera controls offer lens selection, refocus and real hardware zoom when exposed by the phone. A device that rejects HD constraints falls back to a rear-camera request. EAN-13, EAN-8, UPC-A, UPC-E and ITF are the decoder targets. Progressive canvas crops help with smaller barcodes; barcode photos are decoded locally with crop/rotation attempts. Images remain on the device; only the decoded barcode goes to product lookup. Product data and eaten quantity still need review.

Physical working distance depends on the phone, focus support, light and barcode print. Automated tests use a small EAN in a full-HD frame, a rotated photo, mocked camera capabilities and late permission/detection teardown; they do not replace a real iPhone camera check. Typing the printed number and entering a label remain available.

## Receipt price catalogue

Shopping → **Add receipt photo**, or More → **Receipt prices**, accepts JPEG/PNG/WebP photos. The browser converts a bounded image to JPEG and sends it to the existing AI vision reader. The route requires the private session and same-origin/token import access, applies image size/rate limits and uses the existing shared AI allowance. Images are processed in memory and not retained in the personal catalogue. If photo reading is unavailable, **Or paste receipt text** works locally.

Every result is a draft. Check the UK supermarket, date, quantities and per-pack prices; remove unwanted lines and confirm the review before saving. Printed discounts need checking. Financial identifiers are excluded. Unknown weights stay unknown; receipt names are not enough to guess a pack size, drained tuna weight or whether chicken was fresh or frozen.

Tick **Use this confirmed pack price in planning**, choose the recipe ingredient and enter its actual usable pack size. Currently the existing personal-price planning path supports **Lidl**. Asda/Aldi receipt lines and unmapped items can be saved for reference. Confirmed Lidl packs enable personal estimates; they retain receipt date/source and remain estimates, never official national prices. Existing 90-day eligibility rules still apply. Reference rows can be completed later through **Saved receipts**.

One atomic write stores the receipt journal and mapped prices under the existing personal-price catalogue key. Identical receipts are rejected, older receipts cannot overwrite newer pack checks, and edits replace their earlier pack mappings. Up to forty receipts/eighty items each and three hundred planning packs are supported within a bounded local payload. Removing a receipt record keeps saved pack prices. Full kitchen backups include the receipt journal. Data stays on this device until the user exports a backup; no cloud database is added.

## Prep reminders

More → **Prep reminders** enables in-app nudges for tomorrow’s dated meals, overnight preparation and known frozen items/portions. Instructions defer to the actual recipe and pack: frozen chicken is never assumed safe to cook without its instructions. Expired leftovers are excluded.

**Save & add phone calendar alerts** exports an `.ics` file with evening alerts for this plan in the weekly routine’s time zone. Add it to the phone’s calendar to receive alerts when the app is closed. These are calendar imports, not background push notifications. They are a snapshot: replace earlier imported reminders after changing a plan. Time conversion handles daylight saving, and long UTF-8 calendar lines are folded.

All features are web updates used by the existing iOS wrapper; no replacement IPA or new service is required.
