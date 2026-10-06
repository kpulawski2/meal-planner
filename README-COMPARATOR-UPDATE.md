# What's new in the comparator-style update

- Shopping-price lookup uses the public daily UK staple dataset first for Aldi and ASDA, avoiding paid live scraper calls when the ingredient is already covered.
- Items not adequately covered by the daily snapshot can use the configured live retailer catalogue fallback.
- Lidl remains a separate live catalogue/community source because the free public daily snapshot does not include it.
- The shopper sees one best-fit product per ingredient, retailer-specific prices, product links, timestamps, missing-price notes and three-store comparison cards ordered by coverage completeness first.
- Store-specific prices are not reused across retailers. Prices are not silently invented, and missing matches are not counted as free.
- Background job progress and retry-safe polling are preserved.

Important: this is a comparator-style workflow, not access to Meal Matcher's private database. The free snapshot is a limited staple dataset, not a full catalogue. A live price provider must return the right product before the basket total can be complete.
