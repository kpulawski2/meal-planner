# Meal Planner — automatic best-product matching

This patch improves supermarket product searches and removes the multi-candidate-per-ingredient workflow.

## What's changed

- Lidl searches use `studio-amba/uk-grocery-price-matrix`, configured for `retailers: ["lidl"]` and a Great Britain residential proxy.
- Aldi and ASDA keep using `yappman/uk-supermarket-price-scraper`, which has already returned UK grocery rows in this project.
- Up to 10 products per query are requested (subject to provider availability and run caps), rather than the previous low batch cap, and duplicate products are removed while retaining different pack sizes.
- Product adapter accepts the matrix schema (`productName`, `packSize`, `promoPrice`, `url`, `retailer`) and prefers a valid lower promotional price.
- Each ingredient displays one best product recommendation. When the ingredient match is strong, pack size is compatible, and the returned catalogue record is recent, the product is saved automatically.
- Best-fit ranking requires a credible ingredient-name match first, then prioritises the lowest checkout cost for whole packs, then less surplus quantity. This avoids choosing a low-priced but unrelated item.
- Ambiguous/weak matches aren't silently saved: the app shows only one best recommendation for review instead of multiple options.
- Prices are never invented; coverage still depends on what the selected actor returns.

## Files to replace

From the ZIP, replace these files in the existing GitHub repository:

- `index.html` at the repository root
- `recipe-import-api/server.js`
- `recipe-import-api/price-adapter.js`
- `recipe-import-api/price-adapter.test.js` (optional for deployment, recommended for future testing)

No change is required to `manifest.webmanifest`, `render.yaml`, `Dockerfile`, `package.json`, Gemini settings, or the existing Render environment variables.

## Browser-based GitHub steps

1. Extract the ZIP on Windows.
2. In GitHub, open the repository root and choose **Add file → Upload files**. Upload the new `index.html`, then commit.
3. Open the `recipe-import-api` folder. Choose **Add file → Upload files** and upload `server.js`, `price-adapter.js`, and `price-adapter.test.js` together, then commit.
4. Wait for GitHub Pages and Render to redeploy.
5. In Edge, open the app, pick Lidl, Aldi, or ASDA, and run a small price lookup before testing a full week.

The files must be uploaded to the correct paths, not to a newly nested folder.

## Sources and cost

- Lidl actor: `studio-amba/uk-grocery-price-matrix` — input uses `searchQueries`, `retailers: ["lidl"]`, `maxItemsPerSource: 10`, `timeoutPerSourceSecs: 150`, and a GB residential proxy.
- Aldi/ASDA actor: `yappman/uk-supermarket-price-scraper` — input uses `mode: "search"`, `queries`, and one selected retailer.
- `APIFY_API_TOKEN` remains a private Render environment variable. Never add it to this file or `index.html`.
- Batch/result limits cap the likely cost, but Apify usage is not guaranteed free. Keep the account on the intended plan and don't enable paid billing if avoiding charges is essential.
- Prices are source snapshots, may vary by store/availability/offers, and are not guaranteed checkout totals.

## Checks

From `recipe-import-api/`:

```sh
npm test
npm run check
```
