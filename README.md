# Meal Planner

A phone-friendly meal planner with recipes, pantry tracking, shopping lists, product matching and retailer price references.

## ASDA catalogue

`data/products.json` is generated from the public, read-only ASDA product search index used by ASDA.com. The refresh walks every active online top-level category and splits large categories by the site's own department facets. It saves official product links, current regional prices (England, Northern Ireland, Scotland and Wales where supplied), pack sizes, SKU/CIN, brand, category, image URL, active online status, and dietary claims exposed by the search index. The app matches recipe ingredients against this snapshot.

The search feed caps a single query at 20,000 hits, so the refresh checks ASDA's exhaustive category counts, fetches every category page, and verifies that the fetched records add up to the full result count. A missing category, short page, duplicate or conflicting product, invalid link, or unexpected catalogue drop stops publication. Product data and refresh metadata are replaced only after the entire snapshot passes validation.

The daily `.github/workflows/refresh-asda.yml` workflow runs the scraper tests first, refreshes the snapshot on `main`, and commits `data/products.json` and `data/catalogue-meta.json` only when the run succeeds. You can also start it from the repository's Actions tab. Public GitHub Actions runners and the configured Render Free service do not require a paid search API.

The feed currently does not publish GTINs, full nutrition tables, ingredients, or store-specific stock for every item. Those fields remain empty when ASDA does not expose them in the index; product links open the official pages for full details. Catalogue availability means listed online, and local stock can vary by store. Prices are regional and may change after a refresh.

The Node catalogue adapter refuses to use a seed or unhealthy snapshot. `/api/catalog/status` reports snapshot health and coverage; `/health` includes the same catalogue metadata.

## Use the app on a phone

The full app is live on the free Render service at [meal-planner-wm4j.onrender.com](https://meal-planner-wm4j.onrender.com). Open it on your phone and choose **Add to Home Screen** on iPhone or **Install app** in Android Chrome. The app shell and local planner data work offline; product search needs an internet connection. Saved recipes, pantry items and shopping changes stay in browser storage on that device. Use Settings → Export backup / Import backup to move them between devices.

The free Render service can sleep when idle, so its first request after a quiet period may take longer. The app and catalogue refresh do not require a paid ASDA/Algolia search subscription; the catalogue key is ASDA's public read-only browser key.

## Run and verify locally

```sh
python -m pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
node --check recipe-import-api/server.js
node --check recipe-import-api/catalog-adapter.js
node --test recipe-import-api/catalog-adapter.test.js
```

Refresh a full catalogue snapshot with:

```sh
python backend/refresh_catalogue.py
```

If ASDA rotates its public search key, set `ASDA_ALGOLIA_SEARCH_KEY` to the current search-only key shown in ASDA's public page configuration. Never use an Algolia write or admin key.
