# Lidl GB website catalogue

The free refresh follows the official `robots.txt` sitemap declaration and every
child sitemap, including gzip files. Every discovered `/p/.../p<number>` page is
read with four workers and bounded retries. Identity, canonical URL, counts,
currency and integrity are checked before publishing. A failed page, changed
sitemap, large catalogue shrink, or lost price coverage retains the healthy
snapshot. Products and metadata are atomically written individually; the runtime
checks the product-file hash to reject mismatched generations.

The additive refresh also reads Lidl's official public search in complete
48-product pages. It validates GB product IDs and canonical URLs, checks hidden
results through the official gridbox endpoint, and rechecks both sources before
publication. New published URLs join the existing catalogue. Explicit null
gridboxes are reported as unpublished IDs; URLs are never invented. Previous
identities are retained when no longer listed, with purchases disabled and their
last published price kept only as history. Failed or changing discovery leaves
both healthy files untouched. The previous generation's hash is checked first.

The initial source contains **1,918 website products**, including **1,345 food
and drink products**. **622** products (**310** food/drink products) publish a GBP
price. These are counts of source prices, including offers that might be future
or unavailable. Dates and availability determine which can enter a budget.
The runtime excludes expired, future, unavailable, member-only and regional
offers, and never fills a Lidl price with an ASDA price or generic estimate.

The expansion also reads the explicit **“Regular price £…”** label alongside a
Lidl Plus offer. This is the published non-member shelf price; the discounted
member number, crossed-out price, percentage, unit price, “from” price, and
conflicting labels are not substituted. Currency must be GBP. Price evidence,
source URL and check time are retained. Regional restrictions in text and offer
dates still apply. Ambiguous pack choices such as `70/85g` or weight ranges
remain unusable for pack optimisation; four UK pints can be converted to ml.

The October expansion audit found **69** regular-price labels absent from the
initial import, including cucumber, chestnut mushrooms, butter and pasta sauce.
The expanded snapshot preserves all **1,918** product identities and has **691**
published prices, including **379** food/drink prices (previously 310).
Some are future or regional offers; the metadata reports published prices and
prices usable at refresh time separately. No additional published product
identities were found in the public search, current leaflets or checked range
pages. The daily search check can add new identities as Lidl publishes them.

This is complete coverage of the official product sitemap, **not a complete
priced in-store inventory**. Many everyday pages explicitly say “See in store
for price” without any regular-price label. The publisher does not expose those prices, GTINs or nutrition in
the examined public product data. Missing fields stay null. `InStoreOnly` is
a sales channel, not verification of a local branch's stock. A Lidl budget can
only be accepted if every needed ingredient is actually priced and purchasable.
Otherwise the user sees what is missing and their saved meals are retained.

Sources: [official robots](https://www.lidl.co.uk/robots.txt),
[official sitemap](https://www.lidl.co.uk/static/sitemap.xml),
[official public search](https://www.lidl.co.uk/q/api/search?assortment=GB&locale=en_GB&version=2.1.0&fetchsize=48&productsOnly=true&idsOnly=false&offset=0),
[cucumber regular-price label](https://www.lidl.co.uk/p/cucumber/p10055848),
[example milk page with an unpublished price](https://www.lidl.co.uk/p/milbona-uht-skimmed-milk/p10000029).

## Browse the food range

Shopping at Lidl now includes **Browse Lidl ingredients**, available even before
creating a meal plan. Search, food-category and price filters cover the entire
saved food catalogue with stable, bounded pages. Health, household, pets and
plants departments are excluded. A price filter means a usable website price;
it does not verify local stock.

`data/lidl-range-references.json` adds 61 named food references from Lidl's
[May 2026 shopping list](https://www.lidl.co.uk/static/assets/Lidl5-for-20-May2026-2204485.pdf)
and [2025 most-loved range survey](https://www.lidl.co.uk/c/your-lidl-favourites/s10049239).
After name deduplication against the current product snapshot, **45** additional
entries join **1,246** food product pages: **1,291** browsable food entries.
Counts may change as the daily product catalogue refreshes.

These sources include light mayonnaise, tortilla wraps, wholemeal rolls,
cannellini beans, fresh herbs, cheese and frozen vegetables. Range references
show their source period and source link. Any published pack is labelled as
historical information; current pack, price and stock must be checked in store.
The old PDF prices are deliberately omitted. References have no invented product
page, SKU, nutrition, price or current availability assertion. They never enter
the validated matching index or budget optimiser, and a daily product refresh
cannot erase them. This expands the ingredient directory without claiming a
complete priced branch inventory.

`refresh-lidl.yml` runs daily at 05:55 UTC, validates the scraper first and commits
only successful snapshots. ASDA continues on its own daily refresh. Changing
the selected supermarket invalidates both matching and planner requests.

## Measured lighter meals

Twelve original measured recipes are shipped in `public/lighter-recipes.js`.
Their nutrition is calculated from every ingredient, including all cooking oil
and sauces. The tuna/egg wrap uses 60g wholemeal tortilla, 90g drained tuna, one
egg, 15g lighter-than-light mayonnaise, 30g lettuce and 50g cucumber: approximately
394 kcal and 37g protein. Portions and selected products can change estimates.

Mayonnaise label facts are specific to the lighter-than-light variant; regular
or light mayonnaise cannot replace it silently. Source:
[Hellmann's product](https://www.hellmanns.com/uk/p/lighter-than-light-squeezy-mayonnaise.html/08722700479499)
and [label nutrition supplied by Unilever on Tesco](https://www.tesco.com/shop/en-GB/products/257130705).
