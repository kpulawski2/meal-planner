# Apply the direct retailer-product catalogue update

This version replaces Google/store-search handoff links with **direct ASDA and Aldi product-detail pages only**. Price snapshots are loaded directly into the Shopping List and can be applied to matching ingredient quantities. Rows without verified direct pages are left blank; it will not send you to Google or treat missing prices as £0.

## Replace these files in GitHub

Extract the patch ZIP and upload/replace these paths exactly, preserving folders:

- `public/index.html`
- `public/service-worker.js`
- `public/price-reference-catalog.csv`
- `public/price-reference-catalog.json`
- `public/price-reference-snapshots.csv`
- `recipe-import-api/server.js`
- `README.md`
- `DEPLOY-FREE.md`

Commit to `main` and wait for the existing green `meal-planner` Render service to finish deploying. Do not upload the ZIP as a single repository file, create a second Render service, or delete the `recipe-import-api/` directory.

## Data coverage

- 114 distinct ingredient names; 228 retailer rows total (ASDA + Aldi).
- 93 direct official product-detail URLs across those rows.
- 83 dated product-page price snapshots: 42 ASDA and 41 Aldi.
- The remaining 135 retailer rows have no verified direct product page; those URL and price fields stay blank.
- Two direct-page-only entries are not currently price snapshots (e.g. unavailable/price not re-verified).

## Important

This is not live automatic scraping. Prices are dated snapshots read from official product-page listings and should be checked before shopping. The old automatic price lookup API responds with HTTP 410 and cannot start a search job in this build. Groq remains for recipe/video importing. No new Render service or price-search API key is required.
