# Lidl GB website catalogue

## Recipe pricing and personal pack prices

The app uses one collected Lidl price list automatically for planning, shopping,
swaps and browsing. There is no separate reference-price switch. Usable current
website prices take priority; saved published prices retain their original
source dates and estimate labels. Old disabled settings do not suppress them.
Prices may come from any UK Lidl branch, including Northern Ireland. UK source
regions stay visible. Missing compatible Lidl prices automatically fall back to
[labelled Aldi estimates](aldi-prices.md). Aldi packs never inflate Lidl listing
counts or replace usable Lidl prices. Unknown usable quantities stay excluded.
Personal receipt prices are still a separate optional notebook.

The collected list has 143 exact price records across ten official sources. The
GB review added 39 records, including the five-family-meals matrix checked on
12 October 2026. The original dates remain visible: these are estimates, not
fresh checks of today’s shelf prices. For the exact same named pack and
region, the newest dated observation takes precedence over an older reference.
Different brands, variants and weights remain distinct. The source list keeps
the historical evidence even when a newer observation is preferred.

The matrix's sweetcorn tin is labelled 340g with 285g drained contents; recipe
purchases use the explicit 285g edible yield. Its 145g sunflower-oil tuna amount
does not establish a drained yield and cannot cost recipe grams. It also cannot
stand in for brine or spring-water tuna. Regional cheese and egg references
retain their UK origins and can be used as estimates. Upcoming XXL chicken offers do not become today's prices.

The recipe matcher recognises Lidl's Baking and Oil & Fats shelves, preserves
frozen produce categories, and safely handles plain/all-purpose flour wording.
The publisher accepts unambiguous decimal-comma pack quantities such as 1,5kg
while rejecting size choices, weight ranges and ambiguous thousands separators.
Mayonnaise and salt/pepper spoon conversions carry explicit quantity estimates.

For unpublished staples, **Settings → Your checked pack prices** lets the shopper
save an observed receipt or shelf-label price with the product name, usable
quantity, date and optional store. Planning inclusion is a separate opt-in.
The same price is used by planning, shopping and swaps for the exact assigned
ingredient; no private price enters the official catalogue or another user's
request. Checked packs are saved locally and included in device backups.
Prices older than 30 days are labelled; after 90 days they are excluded until
rechecked. Editing or disabling prices cancels stale requests and saved quotes.
Supported cooking conversions are shared by server and client and labelled.
An estimated future shopping cost never records a new actual pantry purchase.

The [complete website/reference directory export](price-exports/lidl-all-website-prices-2026-10-15.csv)
includes published listings and separately labelled source references, missing
prices, offer windows and member conditions. An amount does not establish a
usable recipe pack, local stock or the full range of a physical store.

The manually run `audit-lidl-price-sources.yml` audits every recursive sitemap URL and non-product
public content page, plus linked official leaflet viewers. Stores/legal/assets
have explicit dispositions; canonical product URLs belong to the separate full
product refresh. Source hashes, compressed captures, price contexts and PDF
links are retained for review. All workers share a one-request-per-second gate
and honour `Retry-After`; denied or unfinished pages make the report incomplete.
Extracted text is only evidence to review, never an automatically imported price.
PDF links, unlisted pages and inaccessible viewer content do not imply complete
in-store price coverage.
The full crawl runs on demand to avoid re-reading hundreds of unrelated content
pages for every app edit. The regular full product refresh and its pull-request
verification continue independently.

`audit-lidl-leaflets.yml` separately captures the official GB leaflet hub and
provider overview, then the identified weekly flyer metadata, including regional
variants. It retains response hashes, offer dates, locale declarations, product
metadata and OCR text for review. The reader has exact source allowlists,
request pacing, and strict response/time/flyer bounds. Images and PDFs are not
downloaded by this audit. Member prices, future offers and regional variants
cannot establish today's universal standard price, and metadata capture never
publishes a price automatically.

The free refresh follows the official `robots.txt` sitemap declaration and every
child sitemap, including gzip files. Every discovered `/p/.../p<number>` page is
read with four workers and bounded retries. Identity, canonical URL, counts,
currency and integrity are checked before publishing. A failed page, changed
sitemap, large catalogue shrink, or lost price coverage retains the healthy
snapshot. Explicit product-page HTTP 404/410 responses are checked a second time.
If a page instead returns HTTP 200 without either product entity, it is read
again and its ID must also receive two explicit unpublished responses from
Lidl's official gridbox endpoint. Missing markup alone never establishes removal.
Confirmed removed pages are recorded separately; their previous identities remain
as unavailable history with no current price and are excluded from current
browsing and matching. New verified products can therefore
be published even when Lidl's sitemap still lists retired offers. Recheck errors,
other HTTP failures, invalid product data or more than 20% confirmed unavailable
identities keep the healthy snapshot. Products and metadata are atomically written individually; the runtime
checks the product-file hash to reject mismatched generations.

The additive refresh also reads Lidl's official public search in complete
48-product pages. It validates GB product IDs and canonical URLs, checks hidden
results through the official gridbox endpoint, and rechecks both sources before
publication. New published URLs join the existing catalogue. Explicit null
gridboxes are reported as unpublished IDs; URLs are never invented. Previous
identities are retained when no longer listed, with purchases disabled and their
last published price kept only as history. Failed or changing discovery leaves
both healthy files untouched. The previous generation's hash is checked first.
Discovery is deduplicated by product identity, with current search canonical
paths preferred over old sitemap slugs. A changed canonical path is accepted
only when the GB product ID still agrees with its page data. Metadata accounts
for every discovered identity as a published record or confirmed removed page.

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
a sales channel, not verification of a local branch's stock. A Lidl budget estimate requires a usable pack price for every needed ingredient,
from the current snapshot or the explicitly enabled reference view.
Otherwise the user sees what is missing and their saved meals are retained.

Sources: [official robots](https://www.lidl.co.uk/robots.txt),
[official sitemap](https://www.lidl.co.uk/static/sitemap.xml),
[official public search](https://www.lidl.co.uk/q/api/search?assortment=GB&locale=en_GB&version=2.1.0&fetchsize=48&productsOnly=true&idsOnly=false&offset=0),
[cucumber regular-price label](https://www.lidl.co.uk/p/cucumber/p10055848),
[example milk page with an unpublished price](https://www.lidl.co.uk/p/milbona-uht-skimmed-milk/p10000029).

## Browse the food range

**Browse Lidl ingredients** in Shopping opens the **Lidl catalogue**. Food &
drink is the initial department; **All products, including household** exposes
every currently published product page in the saved snapshot. Search, category,
price and source filters use bounded, stable pagination. Household goods, pets,
gift cards and other non-food products never become recipe ingredients.

The 15 October snapshot contains 2,090 discovered identities: **1,828 published
product pages** and **262 confirmed removed pages**. Food browsing includes
**1,261 current food listings**, with **297 usable website prices** at the check.
The full directory includes upcoming offers with their advertised amount and
dates, separately from prices eligible for a budget. Published listings do not
establish local stock or a complete branch inventory.

## Reference price estimates

The app includes **143 explicit Lidl pack-price reference records** in
`data/lidl-price-references.json`. Their sources are:

- [Lidl's price comparison PDF](https://www.lidl.co.uk/static/assets/Morrisons_Price_Conparison-Online-MainList-2134661.pdf): only the Lidl retail-price column, not competitors or printed unit prices. No usable date is printed; the app shows **Undated**.
- [May 2026 shopping list](https://www.lidl.co.uk/static/assets/Lidl5-for-20-May2026-2204485.pdf): keeps **May 2026**, including explicit regional alternatives. A newer webpage linking this PDF does not make its prices current.
- [Royal Menu shopping list](https://corporate.lidl.co.uk/media-centre/pressreleases/2025/royal-warrant): retains the stated **14–15 January 2025** price-check period. Variable-weight lamb and chicken packs are browsable but cannot supply a fixed purchasing capacity.
- [Five family meals price matrix](https://www.lidl.co.uk/static/assets/5-for-20-October-2026-Pricing-Matrix-2510860-2518185.pdf): **12 October 2026**, as dated by the linking official meal page. Declared drained yields take precedence over tin net weights.
- [Own-brand award winners](https://corporate.lidl.co.uk/media-centre/pressreleases/2023/the-better-than-nutella-chocolate-spread-and-seven-other-lidl-award-winning-swaps-that-could-save-brits-almost-500-a-year): **6 February 2023**, historical Lidl amounts with explicit packs.
- [High-protein product list](https://corporate.lidl.co.uk/media-centre/pressreleases/2025/tiktok-shop-protein): **18 February 2025**, individual in-store products rather than the separate promotional bundle.
- [Way To Go tea](https://corporate.lidl.co.uk/media-centre/pressreleases/2026/waytogo!-tea): **15 September 2026**, the published launch amount and 80-bag pack.
- [BBQ basket](https://corporate.lidl.co.uk/media-centre/pressreleases/2023/more-bangers-for-your-buck-lidl-wins-which-cheapest-bbq-basket): **19 July 2023**, historical products with exact pack sizes.
- [Northern Ireland basket list](https://www.lidl-ni.co.uk/static/assets/WK39-1152742.pdf): **Undated**. It explicitly states 1 kg organic jumbo porridge oats at £1.99. The filename does not establish a check date; missing pack sizes for other items are not guessed.
- [Northern Ireland July 2025 retail list](https://www.lidl-ni.co.uk/static/assets/NIWk27LPSavingsweb-1644357.pdf): **3–9 July 2025**. The 1 kg Birchwood chicken breast uses the published **LP Old RP** amount of £6.44, rather than the expired member offer of £4.79.

The app always includes these prices in its Lidl requests, alongside website
prices. Original source dates and estimate labels remain visible in the same
list. The 61 unpriced range records remain available too. For diagnostics,
direct API callers can still request a strict website-only view; the internal
flags are `allowReferencePrices: true` for recommendations and
`profile.lidlReferencePrices: true` for planning. The app sets them automatically.

Reference records are validated separately. They do not modify the product
snapshot, its hash, its health counts or strict matching caches. An existing
usable website price takes priority. Attaching a reference to a product page
requires the exact Lidl store item number, matching brand and variant words,
and a compatible known pack. An unknown pack can be supplied by that exact
reference. Lidl reuses item numbers: Dairy Manor's milk price must not transfer
to Milbona, and organic egg prices must not transfer to ordinary eggs. Other
references use identifiable source-document entries with source links and no
invented product page, SKU or stock assertion.

Reference products from all UK regions enter the app's estimate index automatically.
NI source records cannot attach to GB listings by item number: those identifiers
belong to separate markets. The source region travels through plan quotes,
shopping, swaps, offline baskets, copied lists and CSV exports.
Ingredient compatibility and whole-pack calculations are shared with normal
shopping and planning. Regional UK references can supply a budget estimate with their origin shown;
ambiguous pack weights remain unpriceable. Missing prices
stay unknown. Source dates are never replaced with the review date or reported
as a current shelf-price check. These manually reviewed reference records do
not auto-refresh; changed source values require another evidence review.

Basket totals, accepted plans, swap previews, product details, copied shopping
lists and CSV exports identify reference estimates and preserve source periods
and links. Receipt spending is not automatically recorded from reference
estimates; the purchase flow explains this instead of treating them as actual
spending. Nutrition, variety, locks, pantry deductions and the full-pack budget
limit continue to apply. A feasible reference-based result is an estimated
budget fit, not verification of today's Sheffield shelf prices.

`refresh-lidl.yml` continues its daily refresh at 05:55 UTC and preserves a healthy
snapshot on failure. Scraper pull requests also run a read-only full source
audit and retain the resulting validated files as a review artifact. New public
products join browsing automatically after successful refreshes.

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

## Ingredient compatibility

Matching recognises Skyr yoghurt and named pasta shapes such as fusilli.
Prepared tuna salad and sweetened oat bites cannot stand in for plain tuna
and oats. Explicit reference pricing does not relax ingredient compatibility.
An unpublished product without a suitable exact reference stays unpriced.

## Food & Drink sidebar audit: 15 October 2026

The refresh now follows the actual Food & Drink sidebar, every published child
category and every declared product batch, in addition to the sitemap and general
search. The live audit covered **15 departments**, **64 category pages** and
**98 distinct source URLs** with additional repeated identity/head checks.
It accounted for **326 identities**: **325 published products** and one explicit
unpublished ID (`10048408`). The frozen category's count includes this identity;
it is confirmed twice through Lidl's explicit GB gridbox endpoint and does not
acquire an invented product page or price.

The landing page's HTML hydration stops after 21 batches even though its count
is larger. The importer follows the website's actual `category.id=10068374`
load-more search API, then checks its count, country, offsets, unique identities
and explicit missing-ID evidence. Hub pages expose their child paths in public
Nuxt data. A second full menu traversal must agree before publication. Invalid,
changing or incomplete source data preserves the healthy product snapshot.

The detailed audit found **320 explicit public prices** and **86 products with
member prices**. The new single-pack regular-price label support adds Pepsi Max's
explicit **£4.15 per pack** while retaining its **2 for £7** Lidl Plus promotion
separately. Other standard prices already existed in the validated catalogue.
Member totals, unit-price labels and promotion conditions are preserved for
display; they do not replace public prices in automatic budgets.

- [Complete published-product price list](price-exports/lidl-food-menu-prices-2026-10-15.csv)
- [Every audited category and its counts](price-exports/lidl-food-menu-categories-2026-10-15.csv)

Exports include original pack text, dates, regional restrictions, product and
source URLs, membership conditions and the actual check timestamp. They are a
dated source audit; upcoming offers are not current checkout prices. The app's
Lidl catalogue category selector also includes the audited website hierarchy,
and a Lidl Plus filter displays member offers separately.

The supplied branch is confirmed by Lidl's [Alison Crescent store page](https://www.lidl.co.uk/s/en-GB/store-finder/sheffield/alison-crescent/):
Alison Crescent, Sheffield S2 1AS. This validates the address, not every shelf
price or local stock quantity. The exported prices are the published GB website
figures. The isolated browser selector probe did not establish a branch-specific
price feed, so these are not presented as verified Sheffield shelf prices.

`audit-lidl-menu.yml` retains the full read-only category report, CSV files and
source captures for seven days on relevant pull requests or a manual run. The
regular daily publisher incorporates the same traversal, validates every new
canonical product page and preserves menu membership in the snapshot. No missing
price or pack is filled using another brand, a member discount or a generic guess.
