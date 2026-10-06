# Meal Planner — complete project update

This bundle combines the current meal-planner frontend and the companion Render backend in the correct repository layout.

## Included

- `index.html`: frontend with recipes, multi-option swaps, nutrition, shopping list, pack planning, and background supermarket price lookup.
- `manifest.webmanifest`: PWA manifest for the existing GitHub Pages URL.
- `render.yaml`: Render Blueprint configuration for Gemini plus optional Apify retailer searches.
- `recipe-import-api/server.js`: Gemini recipe importer, video import, background lookup jobs, and price endpoints.
- `recipe-import-api/price-adapter.js`: product normalisation, retailer validation, pack parsing, and query batching.
- `recipe-import-api/price-adapter.test.js`: tests for the price adapter.
- `recipe-import-api/Dockerfile`: includes both `server.js` and `price-adapter.js` in the deployed image.
- `recipe-import-api/package.json`: backend scripts and dependencies.
- `recipe-import-api/.dockerignore`: excludes local secrets and generated files.
- `recipe-import-api/.env.example`: environment-variable names only; it contains no real secrets.

## Safest way to apply the update in one commit

GitHub's website does not extract a ZIP into the repository for you. Use GitHub Desktop so you can apply the complete folder tree and push one commit.

1. Install/open GitHub Desktop and clone `https://github.com/kpulawski2/meal-planner` if it is not already cloned locally.
2. Download and extract this ZIP. The extracted folder contains the repository files at its root.
3. Copy the extracted contents into your local cloned `meal-planner` folder, replacing files when asked. Keep the folder structure exactly as shown below.
4. If the repository has a stray **root-level** `server.js` (outside `recipe-import-api/`), delete it. The backend server belongs only at `recipe-import-api/server.js`.
5. In GitHub Desktop, review the changed/deleted files. Commit with a message such as `Integrate UK supermarket product lookup` and push to `main`.

Expected layout:

```text
meal-planner/
  index.html
  manifest.webmanifest
  render.yaml
  README.md
  recipe-import-api/
    .dockerignore
    Dockerfile
    .env.example
    package.json
    server.js
    price-adapter.js
    price-adapter.test.js
```

## Keep these secrets private

Do not put API tokens in `index.html`, `render.yaml`, GitHub, screenshots, or chat.

In Render → `meal-planner-recipe-import` → Environment, keep the existing values for:

- `GEMINI_API_KEY`
- `IMPORT_API_TOKEN`
- `APIFY_API_TOKEN` (optional; required for broad live catalogue search)
- `ALLOWED_ORIGINS=https://kpulawski2.github.io`

The `render.yaml` contains `sync: false` placeholders for secrets, not values. Do not enter your actual tokens into this file. If Render asks for a secret during a Blueprint sync, supply it directly in Render's protected environment form.

## Deploy

1. After pushing the commit, wait for GitHub Pages to build and deploy the frontend.
2. Wait for Render to build and deploy the backend. Its Docker build must run from `recipe-import-api/` and copy `server.js` plus `price-adapter.js`.
3. Test `https://meal-planner-recipe-import.onrender.com/health`. Expect `ok: true`, `aiConfigured: true`, and `tokenConfigured: true`. `livePriceSearchConfigured` is true only when `APIFY_API_TOKEN` is configured.
4. Open `https://kpulawski2.github.io/meal-planner/` in Edge, select a store, then run a small price lookup first.

## Tests

From `recipe-import-api/`, run:

```sh
npm test
npm run check
```

## Pricing accuracy

The app normalises returned products and filters by selected retailer and UK-specific records. Price coverage still depends on the selected Apify actor and its output; scrape results are not guarantees of local shelf availability, promotions, or checkout prices. Missing prices should remain missing rather than being invented. Confirm the first live results before relying on basket totals.
