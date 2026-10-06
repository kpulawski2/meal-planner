# Meal Planner — mobile-first personal app

A clean, installable meal planner designed for phones, with your existing recipe library and settings, day/week planning, favourites, pantry deductions, consolidated shopping list, editable pack sizes, per-supermarket saved prices, recipe import, video transcription, and local backup/restore. Recipes are grouped into Breakfast, Lunch, Dinner, Snacks, Fruit and other recipes. Bottom navigation is built for touch screens.

## Recommended hosting: £0/month using GitHub + Render Free

Use a private GitHub repository for the source and deploy the complete Node/Docker service through the included `render.yaml`. This keeps the Groq key on the server and preserves the full importer/price-search backend. GitHub Pages alone is not sufficient because it only hosts static files and cannot run this Node backend.

**Start here: [DEPLOY-FREE.md](./DEPLOY-FREE.md)** — it includes the full GitHub, Render, secrets, health-check and phone installation steps.

Free hosting has limitations: Render services sleep after 15 minutes of inactivity and can take around a minute to wake. Groq's free tier has rate limits. Keep the `GROQ_API_KEY` and `IMPORT_API_TOKEN` in Render's environment settings only; never commit actual values to GitHub.

## Supermarket price lookups

The Shopping page calls its same-origin Render backend directly, so price lookup does not require saving `IMPORT_API_TOKEN` in the browser. The server checks same-origin browser requests and rate-limits lookup starts. The AI recipe/video importer still requires a local token setup. The app can ask Groq's `openai/gpt-oss-20b` with its browser-search tool to find listed prices on official supermarket product pages. Supported stores are Tesco, Sainsbury's, ASDA, Morrisons, Waitrose, Ocado and Aldi, plus M&S. Each retailer is searched separately. It checks official domain, GBP price evidence and pack-size evidence; unsupported or unverified products stay unpriced. This is best-effort research, not an official guaranteed price feed. Prices can differ by local store, delivery region, promotion and membership.

[Shopsplit](https://shopsplit.uk/supermarkets/) remains an optional manual cross-check. No public API was identified, so this app does not scrape its private endpoints or claim access to its internal database.

## Deployment package

This download is trimmed for deployment: it omits Windows/macOS local-run scripts and automated test fixtures. Those files are not needed by the deployed app. Use the included `DEPLOY-FREE.md` to publish the project through GitHub and Render.

## Data and privacy

The app stores planner data in browser local storage. Use **Settings → Export backup** before switching devices or browsers. When using the AI recipe importer or price lookup, the source URL/text or shopping ingredient names are sent to Groq through the backend. Review extracted recipes and linked retailer prices before relying on them.
