# Free deployment and phone install

The meal planner runs as one Render Free web service. It serves the mobile PWA and its Node API from the same HTTPS address. The app, product matcher and ASDA catalogue refresh do not require a paid search API.

## App settings

In Render → `meal-planner` → Environment:

- `GROQ_API_KEY` is used only for recipe imports and video/audio transcription.
- `IMPORT_API_TOKEN` protects the recipe-import endpoints.
- Leave `ALLOWED_ORIGINS` blank for same-origin hosting.

Meal planning, shopping lists, the ASDA catalogue and product matching work without the AI settings.

## ASDA catalogue refresh

`.github/workflows/refresh-asda.yml` runs daily and can be started manually in GitHub Actions. It reads ASDA's public, read-only product index, checks every active online category and all result pages, verifies full coverage, and commits the new product snapshot plus its metadata only after validation succeeds. A partial or unexpectedly reduced catalogue leaves the last healthy snapshot in place. On the public repository, the standard GitHub-hosted refresh runner is free.

The search key embedded in the Python refresher is the public search-only key ASDA sends to browsers; it cannot modify ASDA's index. If ASDA rotates it, add the replacement as a repository **variable** named `ASDA_ALGOLIA_SEARCH_KEY`. Do not use an Algolia write or admin key.

The snapshot stores ASDA region prices where supplied and defaults product matching to England's price. The public index does not include each store's live stock or every product's full nutrition table; availability means listed online, and the product link opens ASDA's page for current details. Prices and stock can vary by location.

## Deploy the app

Keep `Dockerfile`, `render.yaml`, `package.json`, `public/`, `recipe-import-api/`, and `data/` in the repository root. When a catalogue refresh commits on `main`, the connected Render service can deploy the updated snapshot along with the app.

Open `https://<your-render-service>.onrender.com/health` to check service health and the ASDA snapshot status. Render Free may sleep while idle, so the first request after a quiet period can take longer.

## Add it to a phone

1. Open the Render HTTPS address in Safari on iPhone or Chrome on Android.
2. Choose **Share/Menu → Add to Home Screen** or **Install app**.
3. Open Meal Planner from the new home-screen icon.

The app shell and locally saved recipes, pantry and shopping data work offline. ASDA product search needs internet access. Planner data stays on each device; use Settings → Export backup / Import backup to move it between phone and computer.
