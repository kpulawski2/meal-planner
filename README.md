# Meal Planner v2

The meal planner uses direct ASDA product pages as the source for its growing product catalogue and shopping pack/price matching.

## ASDA catalogue

`data/products.json` is generated from ASDA's official sitemap index (`https://www.asda.com/sitemap-index.xml`), published by `https://www.asda.com/robots.txt`. The scraper recursively follows the sitemap tree, visits every discovered `/groceries/product/` page, and records product name, price, pack size, SKU/GTIN, brand, category, availability, image, nutrition and ingredients where the page exposes them.

The catalogue is refreshed daily by `.github/workflows/refresh-asda.yml` and can also be run from the Actions tab. That workflow runs the scraper tests first. It commits `data/products.json` and `data/catalogue-meta.json` only after a complete, validated run.

The scraper retries transient HTTP failures, uses bounded concurrency, and fails closed when sitemap discovery fails, any discovered product page cannot be parsed, fewer than 100 products are available, or a previously healthy catalogue would drop by more than 20%. It stages both JSON files and atomically replaces each only after validation, so a partial scrape cannot replace a healthy snapshot.

`data/catalogue-meta.json` records refresh status, the number of visited sitemaps, discovered URLs, saved products, coverage, duration, and field coverage. The Render catalogue service exposes this at `/catalogue/status` and includes it in `/health`.

The meal planner's ASDA catalogue search reads the validated snapshot, scores matches against product name, ingredient text, brand, category, pack size, SKU and GTIN, and returns the captured product details and price. Until a complete snapshot is available, the app can still build its live URL index from ASDA's official sitemap.

The product page may omit a price, pack quantity, nutrition or availability. Such products remain in the catalogue with missing values instead of being discarded. The planner only allows a product to be selected as a verified pack quote when it has both a price and a usable pack quantity. Online price and availability are time-sensitive and may vary by location.

## Run and test locally

From the repository root:

```sh
python -m pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
python backend/refresh_catalogue.py
```

To run the Node app tests, install the dependencies in `package.json`, then run:

```sh
npm run check
npm test
```

## Render

The optional Python service in `backend/render.yaml` exposes `/health`, `/catalogue/status`, `/products` and `POST /refresh`. The main meal-planner Docker image includes the committed `data/` catalogue snapshot so its matcher can use the same data.
