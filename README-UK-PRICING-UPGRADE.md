# Meal Planner — UK supermarket pricing integration

This update wires the existing shopping list to two Apify product sources:

- **Lidl UK:** `datascrapers/lidl-scraper`, explicitly requested with `countryCode: "GB"`.
- **Aldi UK and ASDA UK:** `yappman/uk-supermarket-price-scraper`, with exactly one selected retailer per run.

It keeps the existing GitHub Pages front end, Render backend, Gemini recipe import, background price-lookup jobs and price-matching flow. It adds `price-adapter.js` to normalise the two different actor output schemas into one internal format, validate UK/currency/store fields, extract pack sizes and reject foreign Lidl rows. Queries are deduplicated and split into groups of 20, matching the combined actor's documented input limit.

## Install

Copy these files into the existing repository, preserving the paths:

1. Replace repository-root `index.html` with this bundle's `index.html`.
2. Replace `recipe-import-api/server.js` with this bundle's `recipe-import-api/server.js`.
3. Add the new `recipe-import-api/price-adapter.js` file.
4. Replace `recipe-import-api/package.json` with this bundle's version (same runtime dependencies; adds `npm run check` and `npm test`).

Commit to `main`. GitHub Pages will publish `index.html`; Render should redeploy the backend on the new commit. Keep the existing `manifest.webmanifest`, `render.yaml`, `Dockerfile`, Gemini key, importer token and `APIFY_API_TOKEN` unchanged. Do not place any API token in `index.html` or any public file.

## Verify

From `recipe-import-api/` run:

```bash
npm run check
npm test
```

The tests use mocked product rows; they do **not** call Apify or prove live account access. After deployment, visit the backend's `/health` endpoint and then test one selected retailer with a short meal plan before running a large basket lookup.

## Data and cost notes

- Product catalogue data is collected by third-party Apify Actors, not official retailer APIs. Confirm each Actor's current permissions, terms, pricing and input schema before using it.
- The Lidl connector sets the country to `GB` and rejects rows that explicitly identify another country or use a non-UK Lidl URL. It also requires GBP price data before accepting a product.
- Aldi and ASDA results are accepted only when the row's retailer identifies the selected store. The combined actor uses UK product listings and returns an ISO `scrapedAt` field when successful.
- Prices are snapshots of public online product data, not guaranteed postcode-specific checkout prices; promotions, loyalty pricing, stock and delivery availability can vary.
- Lookup runs consume the Apify account's usage/credit. Requests cap output volume and pass a run-cost ceiling, but the ceiling is per run rather than a promise of zero cost. Check the Apify Usage page and keep spending limits enabled.
- This bundle does not create a hosted PostgreSQL database. The current server cache is in memory and short-lived; the app persists matched retailer pack quotes locally in the browser. A durable shared product/price history database would be a separate step.

## Sources

- UK Supermarket Price Scraper (yappman): https://apify.com/yappman/uk-supermarket-price-scraper
- Lidl Product Scraper (datascrapers): https://apify.com/datascrapers/lidl-scraper
