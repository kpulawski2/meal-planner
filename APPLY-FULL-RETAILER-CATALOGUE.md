# Apply the full retailer catalogue update

Replace the following files in your existing GitHub repository:

- `recipe-import-api/catalog-adapter.js` (new)
- `recipe-import-api/server.js`
- `public/index.html`
- `package.json`
- `README.md`

Commit to `main` and let the existing `meal-planner` Render service redeploy. No new API key is required.

The Shopping List now has **Search full ASDA/Aldi catalogue** in the pack/price editor. The backend discovers direct official product pages from the retailers' published sitemaps, scores them against the ingredient, then reads the selected official product page for the current price and pack size.
