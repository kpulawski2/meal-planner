# Meal Planner — comparator-style shopping upgrade

The pricing layer now separates a supermarket-specific median unit-price benchmark from the actual whole-pack checkout cost. It still uses the existing data feeds as inputs: a public daily snapshot for common Aldi/ASDA staples, configured retailer catalogue searches for uncovered items, and Open Prices community observations as a fallback. The benchmark is an interim improvement to price estimation, not a completed switch to Allsupers or another licensed catalogue API.

## What is included

- `index.html`: current meal-planner frontend, including one-best-product selection, retailer-by-retailer lookup and comparison cards.
- `recipe-import-api/server.js`: background price lookup, public daily snapshot-first approach for Aldi/ASDA, retailer scraper fallback when `APIFY_API_TOKEN` is configured, and Open Prices community fallback.
- `recipe-import-api/price-adapter.js`: product schema normalisation, UK retailer checks, pack-size parsing, best-pack selection, and median unit-price benchmark calculation from recent, close-match packs.
- `recipe-import-api/price-adapter.test.js`: regression tests for retailers, UK Lidl rows, daily snapshot data, pack matching, median calculations, dimensional separation and large-query batching.
- `recipe-import-api/Dockerfile`: copies both `server.js` and `price-adapter.js` into the backend container.
- Existing Render, PWA, and Node project configuration.

## Pricing model

For each ingredient and selected supermarket, the backend:

1. Normalises candidate pack sizes to grams, millilitres, items or slices.
2. Keeps only close name matches with usable pack prices and recent observations (up to 45 days for the benchmark).
3. Calculates comparable unit prices (£/kg, £/L, £/item or £/slice) and returns the median, range, sample size and newest date.
4. Continues to select a separate best-fit product for the real shopping list, calculating the number of whole packs, checkout spend and estimated leftover quantity.

The median is a planning benchmark, not a purchasable pack or a guarantee that the product is in stock. The UI labels it as an estimate and keeps whole-pack checkout cost separate. No benchmark is shown when there are no sufficiently recent, confident pack matches.

## Data source and coverage

The first lookup source for Aldi and ASDA is the public daily dataset for the UK Supermarket Price Scraper (Apify), maintained by `yappman/uk-supermarket-price-scraper`:

- Actor page: https://apify.com/yappman/uk-supermarket-price-scraper
- Public JSON dataset: https://api.apify.com/v2/datasets/ynAT9NPps2EdjMOJa/items?format=json
- Attribution requested by publisher: `UK Supermarket Price Scraper (Apify), yappman/uk-supermarket-price-scraper`

The free daily dataset contains a curated basket of common staples, not the full retailer catalogue, and does not cover Lidl. For items outside the daily snapshot, the backend uses the existing Apify live catalogue adapters if `APIFY_API_TOKEN` is set. Lidl still uses the configured separate catalogue adapter. Open Prices community observations remain a final fallback, but can be sparse. Price and stock information can vary by location, promotion, and time; always check the product URL/date before relying on a basket estimate.

Do not describe the public daily dataset as a full or guaranteed live retailer API. The app's messages should continue to distinguish the daily snapshot, live catalogue, community observations and missing matches. Allsupers/MealMatcher access has not been wired in because a supported public API or authorised data feed has not been established; do not scrape their pages or reverse engineer private endpoints. The provider can be replaced once approved access and its schema are available.

## Deploy through the browser

1. Extract this ZIP locally on Windows.
2. In the GitHub repository root, replace `index.html`, `manifest.webmanifest`, `render.yaml`, and `README.md` if you want the updated project documentation/config copied in. The PWA manifest and Render file are unchanged configuration; you normally only need `index.html` at the root.
3. Open the existing `recipe-import-api` folder in GitHub. Replace `server.js`, `price-adapter.js`, `price-adapter.test.js`, `Dockerfile`, `package.json`, `.dockerignore`, `.env.example` from the matching folder in this ZIP.
4. Commit to `main`. GitHub Pages will deploy the frontend; Render should build the backend after the commit.
5. In Render, keep existing `GEMINI_API_KEY`, `IMPORT_API_TOKEN`, `ALLOWED_ORIGINS`, and `APIFY_API_TOKEN` values. Never put secrets in GitHub or the frontend.
6. After deployment, open `https://meal-planner-recipe-import.onrender.com/health`, then run a short 3–5 ingredient lookup before comparing the full basket.

GitHub's browser uploader does not unpack ZIP files. Keep the inner paths above: in particular, `server.js`, `price-adapter.js`, and `Dockerfile` belong inside `recipe-import-api/` (not an extra nested directory).

## Checks

From `recipe-import-api/`, run:

```bash
npm run check
npm test
```

## Notes

The free daily snapshot does not need an Apify token. Broader live searches do need `APIFY_API_TOKEN` in Render and may consume Apify usage credits; a per-run cost ceiling is not a guarantee of zero cost. Keep the Apify account on the plan you intend to use and do not enable paid billing if you want to avoid charges.
