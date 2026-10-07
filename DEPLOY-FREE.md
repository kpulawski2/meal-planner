# Meal Planner — free mobile deployment

The app runs on one Render service: Render serves the mobile-friendly website and Node backend from the same HTTPS address. GitHub holds the source code; GitHub Pages is not required.

## Environment variables

Keep these secrets in Render → `meal-planner` → Environment, not in GitHub:

- `GROQ_API_KEY`: needed for recipe imports and video/audio transcription only.
- `IMPORT_API_TOKEN`: a long private random token used to protect the recipe-import endpoints.
- `ALLOWED_ORIGINS`: leave blank for same-origin hosting.

**No Brave Search key or other price-search API key is required.** The Shopping screen uses a static manual reference catalogue and does not automatically search or scrape price websites. The public files `/price-reference-catalog.csv` and `/price-reference-catalog.json` list the bundled recipe ingredients and retailer links.

## Deploy/update the main app

1. Keep `Dockerfile`, `render.yaml`, `package.json`, `public/`, and `recipe-import-api/` at the repository root.
2. Commit changes to the existing GitHub `main` branch and let the existing green `meal-planner` Render service deploy.
3. Do not re-enable the obsolete `meal-planner-recipe-import` Render service. Do not delete the `recipe-import-api/` directory from the repository; it still serves the recipe-import backend.
4. Open `https://<your-render-service>.onrender.com/health`. The `aiConfigured` and `tokenConfigured` flags should be `true` for recipe imports. `automaticPriceLookupSupported` and `livePriceSearchConfigured` are correctly `false`: current price lookups are manual links, not an API call.

## Price-reference catalogue

The current catalogue has 114 unique ingredient names from the bundled recipes and links for ASDA and Aldi (228 ingredient/store rows). 22 ASDA/Aldi product-page snapshots (15 ASDA and 7 Aldi) had visible prices and pack sizes checked on 6 October 2026; they appear as dated snapshots in the app and CSV. Other entries have links but no price until it is manually checked. Empty prices are intentional and must not be treated as zero. Online prices can vary by location and from in-store shelf prices; check the retailer page before shopping.

Saved retailer-specific prices feed the basket comparison on the current device. They are not synchronised between phone and PC; use Settings → Export backup / Import backup to move data between devices.

## Add to a phone

1. Open your Render HTTPS URL in Safari on iPhone or Chrome on Android.
2. Choose Share/Menu → Add to Home Screen (or Install app).
3. It opens like an app. Render Free services sleep after inactivity, so the first opening may take about a minute.

## Free-plan notes

- Manual price-reference links incur no search API charge. Groq free-tier limits still apply to recipe/video AI features.
- Render Free may sleep when inactive.
- Saved planner data is in browser storage on each device; export backups regularly.
