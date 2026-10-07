# Meal Planner v2

## What changed
- ASDA-first product catalogue with direct official product links.
- Recipe quantities normalized to grams/ml.
- Shopping list rounds recipe requirements up to purchasable ASDA packs.
- Recipe library expanded to 79 original recipes.
- Searchable recipe library with meal categories and tags.
- Separate JSON data files so recipes/products can grow without editing the UI.
- Render backend scaffold for refreshing ASDA catalogue data.

## GitHub Pages
Upload/replace the contents of this folder in the existing GitHub Pages repository.
Do not upload the old single-file recipe database over the new data folder.

## Render
Deploy `backend/` as a Python web service. The `/refresh` endpoint rebuilds the ASDA catalogue.
Because ASDA prices and availability can change, the catalogue stores a checked date.

## Important
The included `data/products.json` is a seed snapshot from the project's 2026-10-06 official ASDA price snapshot.
It is not a claim that every ASDA product is already present. The Render crawler is the mechanism intended to expand/refresh the catalogue.


## Automatic catalogue refresh
The repository includes `.github/workflows/refresh-asda.yml`. GitHub Actions runs the catalogue refresh daily and can also be run manually from the Actions tab. It commits the refreshed `data/products.json`, so GitHub Pages receives the updated product prices/links automatically.

The first seed snapshot contains 42 seeded ASDA product records (used only until the first full catalogue refresh) from the project's 2026-10-06 official snapshot. The crawler is what expands this toward the full ASDA grocery catalogue; the exact number of crawlable products can vary with ASDA's site structure, availability and page changes.

## Full ASDA catalogue architecture

The refresh job does **not** use a fixed product list or a small page crawl. ASDA publishes an official sitemap index from its robots.txt. The updater reads that index, follows nested sitemaps, collects every URL under `/groceries/product/`, and fetches each official product page. This is the catalogue discovery mechanism used for each refresh.

The saved catalogue can contain products even when a particular product currently has no price or pack quantity exposed; those records are retained rather than silently discarded. Products with usable pack/price data are the ones the meal planner can cost directly.

Prices and availability are time-sensitive and can vary online/in-store, so every record is stamped with the refresh date.
