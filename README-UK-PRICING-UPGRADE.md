# UK supermarket pricing integration

This release wires the Meal Planner shopping list to a shared retailer product schema for Lidl UK, Aldi UK and ASDA UK. The backend calls the configured Apify actor(s), normalises the returned rows, validates retailer/country details, and calculates compatible pack-size matches. Lookups run as background jobs and expose progress through the authenticated status endpoint.

## Current caveats

- Lidl UK uses the configured Lidl actor and must return UK/GBP records with a UK product URL or country metadata.
- Aldi and ASDA use the UK Grocery Prices actor with store-specific retailer filtering.
- Live price records depend on the actor's current output, account permissions and available usage credit; no actor has been verified live using the account for this packaged snapshot.
- Product listings and prices can vary by date, postcode, promotion and loyalty eligibility.
- The UI does not treat generic starter prices as verified retailer prices.

See `README.md` for installation and secret-handling instructions.
