# Lidl GB website catalogue

The free refresh follows the official `robots.txt` sitemap declaration and every
child sitemap, including gzip files. Every discovered `/p/.../p<number>` page is
read with four workers and bounded retries. Identity, canonical URL, counts,
currency and integrity are checked before publishing. A failed page, changed
sitemap, large catalogue shrink, or lost price coverage retains the healthy
snapshot. Products and metadata are atomically written individually; the runtime
checks the product-file hash to reject mismatched generations.

The initial source contains **1,918 website products**, including **1,345 food
and drink products**. **622** products (**310** food/drink products) publish a GBP
price. These are counts of source prices, including offers that might be future
or unavailable. Dates and availability determine which can enter a budget.
The runtime excludes expired, future, unavailable, member-only and regional
offers, and never fills a Lidl price with an ASDA price or generic estimate.

This is complete coverage of the official product sitemap, **not a complete
priced in-store inventory**. Many everyday pages explicitly say “See in store
for price”. The publisher does not expose those prices, GTINs or nutrition in
the examined public product data. Missing fields stay null. `InStoreOnly` is
a sales channel, not verification of a local branch's stock. A Lidl budget can
only be accepted if every needed ingredient is actually priced and purchasable.
Otherwise the user sees what is missing and their saved meals are retained.

Sources: [official robots](https://www.lidl.co.uk/robots.txt),
[official sitemap](https://www.lidl.co.uk/static/sitemap.xml),
[example milk page with an unpublished price](https://www.lidl.co.uk/p/milbona-uht-skimmed-milk/p10000029).

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
