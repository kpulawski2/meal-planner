# Meal Planner

Mobile-first personal meal planner with recipe categories, weekly planning, pantry, shopping lists, pack-size planning, retailer-specific saved price snapshots, and a Groq-powered recipe/video importer.

## Direct price references

Shopping supports ASDA and Aldi only. The bundled recipe library has 114 unique ingredient names and 228 ingredient/store rows in `public/price-reference-catalog.csv` and `public/price-reference-catalog.json`. The current catalogue contains **93 direct official product-detail URLs** and **83 dated price snapshots** (42 ASDA and 41 Aldi). No Google or other search-engine URLs are generated. Where a direct product page has not been verified, the URL and price fields are blank rather than replaced with a search page.

The price data is a static snapshot catalogue, not a live price feed. Prices and availability can vary by postcode and over time. Always open the official product page before buying; when a price cannot be verified, record it manually in the Shopping List. Automatic `/api/prices/lookup` searches are disabled in this build. Groq is retained for recipe/video importing only.

## Running and hosting

The single Render service serves both the frontend and backend. Keep `Dockerfile`, `render.yaml`, `package.json`, `public/`, and `recipe-import-api/` at the repository root. See `DEPLOY-FREE.md` for environment variables, deployment and mobile home-screen setup. GitHub Pages is not required.

Keep `GROQ_API_KEY` and `IMPORT_API_TOKEN` in Render environment settings only. The Groq key is used for recipe/video import, not price lookup.


## Full retailer catalogue
The shopping page is no longer restricted to the 114 ingredients in the bundled recipe library. The backend can search the official ASDA grocery product sitemap (`https://www.asda.com/sitemap-index.xml`) and ALDI product sitemap (`https://www.aldi.co.uk/sitemap_products.xml`) to discover direct product pages. When you choose a product, the backend reads that official product page for the current price and pack information; no Google search results are used.
