# Aldi store and Lidl estimates

Aldi can be selected in setup, Settings and Shopping. The current curated
catalogue contains 114 sourced UK Aldi packs for recipe ingredients. It is not
a claim to cover Aldi's entire range or local stock. Browse Aldi ingredients
shows products, pack sizes, source links and original price dates.

`data/aldi-prices.json` combines 40 official Aldi product-page observations from
6 October 2026, 69 ingredient packs from Tesco's published UK Aldi comparison
(prices checked 7 May 2026), plus five packs checked on 17 October 2026:
fat-free Greek-style yoghurt, frozen chicken breast, fresh 1 kg/2 kg chicken,
and the Fishmonger four-pack of tuna (408 g drained at £2.49).
The comparison uses the **Aldi actual item
price and Aldi item weight**, never Tesco's price, pack or the pro-rata column.
For example, Maris Piper potatoes are 2.5 kg at £2.25, not Tesco's 2 kg £1.80.
Original periods are retained; reviewing an old document does not refresh its
prices. UK GBP sources only; overseas amounts are not converted.

The server validates source URLs, dates, positive prices, pack units and unique
identities. Only validated, immutable products can become offers. Source URLs
are official Aldi UK product pages or the exact reviewed comparison PDF with
a page link. Update the manifest with new dated evidence rather than changing
an old price's date. Current stock is unknown. Saved Aldi prices are estimates.

For Lidl, the normal app includes saved Lidl prices automatically. The matcher
uses Aldi only when there is no usable compatible Lidl pack for that ingredient
and quantity unit. Personal Lidl pack prices retain their existing opt-in and
priority. A cheaper Aldi pack cannot undercut an available Lidl pack. The
diagnostic API's strict `allowReferencePrices:false` mode remains Lidl-only.

`aldi_reference` identifies a saved Aldi price for an Aldi basket;
`aldi_estimate` identifies an Aldi pack used to estimate a missing Lidl price.
Both keep `sourceStore:Aldi`, the actual Aldi product name, date, usable pack
and source link. Labels survive planning, shopping, swaps, CSV, copied lists and
offline baskets. Aldi prices stay outside Lidl's validated snapshots, hashes,
product directory and listing counts. Store changes cancel obsolete requests.

Matching retains ingredient qualifiers and dairy/protein distinctions. Wholemeal
wraps cannot become white wraps, plain Skyr cannot become fruit yoghurt, and a
named FUEL10K cereal cannot become a cheaper cereal. Greek-style yoghurt cannot
price strained Greek yoghurt. Unknown drained weights and stock-cube dilution
remain unpriced. The frozen berry medley is a plain fruit ingredient, not a
prepared meal. Lentil snacks cannot price lentils. Missing costs never mean zero.

Estimate totals carry `~` and cannot be confirmed as actual pantry spending.
Use the existing receipt/pantry flow to record actual purchases. The service
worker caches the source-validation helper; saved baskets have a new fingerprint
to prevent older quotations being reused under the changed pricing policy.

Validation includes source rejection, real catalogue matching, whole-pack
rounding, Lidl priority, strict-mode isolation, worker/offline provenance and
14-day pricing integration. Browser checks exercise store switching, catalogue
search, source labels, copied/CSV lists, reload and small-screen layout.

The exact FUEL10K cereal is a separate, labelled ASDA purchase in Lidl and Aldi
plans. Its saved £2.50/350 g pack price counts toward the budget; it is never
claimed as either store’s own product or price.
