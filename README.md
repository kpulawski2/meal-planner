# Meal Planner — mobile-first personal app

A clean, installable meal planner designed for phones, with your existing recipe library and settings, day/week planning, favourites, pantry deductions, consolidated shopping list, editable pack sizes, per-supermarket saved prices, recipe import, video transcription, and local backup/restore. Recipes are grouped into Breakfast, Lunch, Dinner, Snacks, Fruit and other recipes. Bottom navigation is built for touch screens.

## Recommended hosting: £0/month using GitHub + Render Free

Use a private GitHub repository for the source and deploy the complete Node/Docker service through the included `render.yaml`. This keeps the Groq key on the server and preserves the full importer/price-search backend. GitHub Pages alone is not sufficient because it only hosts static files and cannot run this Node backend.

**Start here: [DEPLOY-FREE.md](./DEPLOY-FREE.md)** — it includes the full GitHub, Render, API key, spending control, health-check and phone installation steps.

Free hosting has limitations: Render services sleep after 15 minutes of inactivity and can take around a minute to wake. Groq's free tier has rate limits for recipe/video imports. Keep `GROQ_API_KEY`, `BRAVE_SEARCH_API_KEY` and `IMPORT_API_TOKEN` in Render's environment settings only; never commit actual values to GitHub.

## Supermarket price lookups

The Shopping page calls its same-origin Render backend directly, so price lookup does not require saving `IMPORT_API_TOKEN` in the browser. Brave Search finds candidate links; the backend then fetches the official retailer product page and extracts structured price/pack data or nearby visible price text. It does not send price queries to Groq and does not save Brave API result titles, snippets or result URLs; only a canonical/product URL declared by the retailer page can be returned as the source link. Supported stores are Tesco, Sainsbury's, ASDA, Morrisons, Waitrose, Ocado and Aldi, plus M&S. A new ingredient/store pair normally uses a Brave search request, while repeat lookups first refresh the saved official product page URL directly (normally about 1,000 Search API requests are covered by the $5 monthly credit); results require an official retailer domain, GBP price and parseable pack size. If page data cannot be verified, the ingredient stays unpriced. This is best-effort research, not an official guaranteed price feed. Prices can differ by local store, delivery region, promotion and membership.

[Shopsplit](https://shopsplit.uk/supermarkets/) remains an optional manual cross-check. No public API was identified, so this app does not scrape its private endpoints or claim access to its internal database.

## Deployment package

This download is trimmed for deployment: it omits Windows/macOS local-run scripts and automated test fixtures. Those files are not needed by the deployed app. Use the included `DEPLOY-FREE.md` to publish the project through GitHub and Render.

## Data and privacy

The app stores planner data in browser local storage. Use **Settings → Export backup** before switching devices or browsers. When using the AI recipe importer, source URL/text is sent to Groq through the backend. For price searches, ingredient names are sent to Brave Search to discover official product-page links; result titles/snippets are only used transiently to rank candidate pages and are not saved. The app then reads public product details from retailer pages. Review extracted recipes and linked retailer prices before relying on them.
