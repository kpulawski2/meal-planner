# Meal Planner

A phone-friendly meal planner with recipes, pantry tracking, shopping lists and automatic ASDA product matching and pricing.

## ASDA catalogue

`data/products.json` is generated from the public, read-only ASDA product search index used by ASDA.com. The refresh walks every active online top-level category and splits large categories by the site's own department facets. It saves official product links, current regional prices (England, Northern Ireland, Scotland and Wales where supplied), pack sizes, SKU/CIN, brand, category, image URL, active online status, and dietary claims exposed by the search index. The app matches recipe ingredients against this snapshot.

The search feed caps a single query at 20,000 hits, so the refresh checks ASDA's exhaustive category counts, fetches every category page, and verifies that the fetched records add up to the full result count. A missing category, short page, duplicate or conflicting product, invalid link, or unexpected catalogue drop stops publication. Product data and refresh metadata are replaced only after the entire snapshot passes validation.

The daily `.github/workflows/refresh-asda.yml` workflow runs the scraper tests first, refreshes the snapshot on `main`, and commits `data/products.json` and `data/catalogue-meta.json` only when the run succeeds. You can also start it from the repository's Actions tab. Public GitHub Actions runners and the configured Render Free service do not require a paid search API.

The feed currently does not publish GTINs, full nutrition tables, ingredients, or store-specific stock for every item. Those fields remain empty when ASDA does not expose them in the index; product links open the official pages for full details. Catalogue availability means listed online, and local stock can vary by store. Prices are regional and may change after a refresh.

The Node catalogue adapter refuses to use a seed or unhealthy snapshot. `/api/catalog/status` reports snapshot health and coverage; `/health` reports server liveness and the last loaded catalogue status.

Automatic shopping matches share one validated catalogue in a dedicated worker and use an ingredient name-token index. Large JSON parsing and matching run outside the web server's event loop, so cold catalogue loads also leave `/health` responsive. The worker reports cached status and has a 256 MiB JavaScript heap limit. The phone app retries interrupted matching requests and keeps previous results only when their ingredient quantities still agree. Catalogue data is unchanged by matching.

Ingredient matching checks product types before comparing pack prices. Plain milk excludes flavoured milk, milkshakes and plant drinks; plain Skyr excludes flavoured yoghurt; light cream cheese also recognises lighter soft cheese. Prepared meals, household products and unsuitable substitutes cannot compete with the requested plain ingredient. Suitable pack combinations are compared using their catalogue prices.

The shopping list fills in products, whole-pack counts, official links and the basket total automatically. The previous manual shelf-price panels and sparse product-reference lists are removed from the phone app. Existing manual price records are preserved in backups but do not affect automatic totals. The former saved retailer choice migrates once to ASDA, while meal-planning supermarket preferences stay unchanged. Aldi automatic pricing is currently unavailable and is labelled accordingly.

Where a recipe uses grams for produce sold by each, or kitchen measures for weighed packs, the app can use explicitly labelled typical weights and cooking conversions. These estimates are shown beside the purchase plan; ASDA's saved pack data and shelf price remain unchanged. An ingredient that cannot be identified or quantified is excluded from a clearly labelled partial subtotal. Meal costs represent the estimated value of ingredients used, while the basket total represents whole packs to buy after pantry deductions. Unplanned recipes calculate their cost when added to the plan. The phone app rechecks prices after 30 minutes when revisited or brought back into focus.

## Plan within a budget

Choose **Fit plan to budget** in Today, Plan or Shopping. The planner reads actual ASDA pack prices and chooses recipes and portions together. It combines shared ingredients across the whole plan, converts compatible recipe units, deducts pantry stock once, and counts the full packs required. It does not use the old fixed recipe cost estimates to generate a plan.

The weekly budget is for the whole household. A 14-day plan receives twice that amount; a 3-day plan receives three sevenths. Calories and protein are targets **per person, per day**. Accepted plans must keep every day within ±10% of the calorie target and at or above the protein target, with the requested meal count and household servings. Nutrition remains an estimate based on ingredient profiles or recipe values marked verified; it is not a guarantee of exact brand nutrition. The app does not calculate personal calorie targets from body measurements.

The library contains **196 recipes and fruit options**, including **72 new affordable recipes** in `public/affordable-recipes.js`, with cooking methods and times. The search compares suitable recipes, adjusts portions, and calculates shared whole-pack basket costs in integer pence. Goals influence recipe scoring: saving money favours full-pack savings and ingredient sharing; easier cooking favours shorter known cooking times and reusable batches; healthy eating favours vegetables, pulses and wholegrains; gaining muscle favours protein density. Losing weight prefers valid portions closer to 95% of the selected calorie target, within the unchanged ±10% range and protein minimum. Goals do not change the targets you set. **Keep meal** locks both a recipe and its portions; dietary exclusions remain constraints.

Variety is required alongside the budget and nutrition checks. For a seven-day plan, the modes use these limits:

| Mode | Different lunches / dinners, each | Maximum uses of a main recipe | Different breakfasts / snacks, each | Maximum uses of a breakfast or snack |
| --- | --- | --- | --- | --- |
| Balanced | 3 | 3 | 2 | 4 |
| More variety | 4 | 2 | 3 | 3 |
| Budget focus | 3 | 3 | 2 | 5 |

Limits adjust for shorter or longer plans and apply only to requested meal categories. Identical main meals cannot repeat on consecutive days. Main meals need three protein families where eligible choices allow, and no family may supply more than half the main meals. Budget focus still enforces these minimums; the planner reports an unsuccessful search instead of accepting an all-week repeated meal plan.

A plan replaces saved meals only after both the worker and browser independently validate its prices, quantities, nutrition, meal categories, budget and variety. Missing prices never count as free. A failed or cancelled search keeps the current plan and reports what could not be satisfied. A lowest-cost proposal found by the bounded search is not proof that no cheaper plan exists. Editing meals, portions, settings or pantry stock recalculates the checks; an old successful result does not certify an edited plan. Catalogue prices can change, so the app rechecks them when refreshed.

`POST /api/planner/generate` performs the search in the existing catalogue worker, with bounded request size, one active budget search, cancellation and a deadline. Health checks continue on the web server's event loop. No paid AI or solver service is required for budget planning.

Tinned tuna, beans and sweetcorn use drained contents where ASDA's declared unit-price data exposes them; that inference is labelled beside the selected packs. Generic salmon cannot match a plant-based substitute, and Greek-style yoghurt cannot silently receive the higher protein profile used for strained Greek yoghurt.

## Import recipes

In Recipes, choose **Import recipe**, then paste a recipe website link or recipe text with an ingredient list and cooking steps. Structured recipe websites and pasted recipes import through the app's own API for free, with no access token or AI setup required. A separate importer can still use an optional token in Advanced connection. Optional Groq AI can help with unstructured text and video using a configured free-tier account; availability is subject to its rate limits. If a source blocks access or AI is unavailable, paste the recipe text instead. Failed requests preserve the entered details and offer recovery actions.

Nutrition is estimated automatically from quantified ingredients and confirmed recipe servings, including measured cooking oils. Cooked and dry rice/pasta use different profiles. Missing quantities, unknown food profiles or an unknown recipe yield stay marked for review; they are not silently guessed or presented as complete nutrition. Review the extracted ingredients, steps and servings before saving.

## Use the app on a phone

The full app is live on the free Render service at [meal-planner-wm4j.onrender.com](https://meal-planner-wm4j.onrender.com). Open it on your phone and choose **Add to Home Screen** on iPhone or **Install app** in Android Chrome. The app shell and local planner data work offline; product search needs an internet connection. Saved recipes, pantry items and shopping changes stay in browser storage on that device. Use Settings → Export backup / Import backup to move them between devices.

The free Render service can sleep when idle, so its first request after a quiet period may take longer. The app and catalogue refresh do not require a paid ASDA/Algolia search subscription; the catalogue key is ASDA's public read-only browser key.

The compact weekly overview shows checkout cost, daily nutrition checks and meal variety. Navigation remains fixed at the bottom, selected settings stay highlighted, and the recipe library can filter by category, protein source and cooking time. Longer explanations and optional setup are kept in expandable details.

## Run and verify locally

```sh
python -m pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
node --check recipe-import-api/server.js
node --check recipe-import-api/catalog-adapter.js
npm install --ignore-scripts
npm test
```

Refresh a full catalogue snapshot with:

```sh
python backend/refresh_catalogue.py
```

If ASDA rotates its public search key, set `ASDA_ALGOLIA_SEARCH_KEY` to the current search-only key shown in ASDA's public page configuration. Never use an Algolia write or admin key.
