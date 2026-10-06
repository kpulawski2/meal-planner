# Meal Planner — supermarket price lookup

This project uses **Groq free-tier AI models** for recipe extraction and audio transcription, **free Open Prices community observations** for automatic price lookup, and a manual Allsupers price-verification workflow. There is no Apify integration and no paid grocery-price API requirement. Groq usage is subject to the current free-tier rate limits on your account; the application does not automatically upgrade to paid usage.

## AI recipe extraction

- **Recipe parsing and video-frame reading:** Groq `qwen/qwen3.8-27b` through the Chat Completions API. It is configured for JSON output and receives no more than three sampled frames per request.
- **Video speech transcription:** Groq `whisper-large-v3-turbo` through the audio transcriptions API.
- **Free limits:** both are configured as free-tier-first models, but availability and quotas depend on the current Groq account and can change. The app reports rate-limit/quota errors and does not automatically switch providers.
- Keep `GROQ_API_KEY` and `IMPORT_API_TOKEN` in Render environment variables only. Do not add secrets to `index.html` or commit them.

## Price sources

- **Open Prices by Open Food Facts** (`https://prices.openfoodfacts.org/api/v1`) is used for automatic community price lookup. Its observations may be sparse, missing, or out of date, so the app records observation dates and does not interpret a missing record as an unavailable product.
- **Allsupers** (`https://www.allsupers.co.uk/`) is available as a manual verification route in the Shopping tab. Open Allsupers from an ingredient's pack editor, confirm the exact supermarket, product and pack size, then enter the verified pack price. The app saves the source label and date, plus an optional product link.
- The app does **not** automatically scrape Allsupers. Its current Terms of Use prohibit automated scraping and systematic extraction/re-use of the database without prior written consent: `https://www.allsupers.co.uk/terms`. Allsupers says datasets and partnerships are available by licence; if they approve an API/feed, it can be integrated as an authorised source later.
- Lidl is not included in the retailer choices.

## Accuracy safeguards

The backend checks UK retailer/location metadata, GBP currency, observation dates, product-name relevance and pack-size compatibility. Median unit-price benchmarks are calculated only from sufficiently close, recent and unit-comparable observations. The benchmark is a planning statistic, not a purchasable pack price. Whole-pack checkout cost remains separate. Unmatched products remain unmatched rather than receiving invented prices.

Manual prices are tagged with their selected source (`Allsupers manually verified`, `Retailer website manually verified`, `In-store shelf manually checked` or `Manually entered price`) and the entry date. When available, save the precise product/source URL too.

## Configure the backend

1. Create a Groq API key at `https://console.groq.com/keys`. In Render, configure `GROQ_API_KEY`, `IMPORT_API_TOKEN`, and `ALLOWED_ORIGINS`. The Render blueprint defaults to `GROQ_RECIPE_MODEL=qwen/qwen3.8-27b` and `GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo`. No grocery-price API key is required.
2. Deploy the service. Check `/health`; the `priceDataSource` field should report free Open Prices observations with manual Allsupers verification.
3. In the app, configure the recipe-import backend as usual, open Shopping, and run the free price lookup. For missing matches, use **Check Allsupers** or **Compare on Allsupers** and manually save the exact price in the pack editor.
4. Never put backend API keys in `index.html` or GitHub Pages.

## Tests

From `recipe-import-api/`, run:

```bash
npm run check
npm test
```

## Limitations

Open Prices relies on community submissions, so coverage varies by retailer and product. Allsupers prices are not synchronised into the app automatically; a current price is only marked as Allsupers-verified when the user checks the site and saves the price. Regional availability, promotions and loyalty prices may differ at checkout.

## Deployment layout

Keep `index.html`, `manifest.webmanifest`, `render.yaml`, and `README.md` at the project root. Keep backend files inside `recipe-import-api/`. GitHub Pages hosts the frontend; Render hosts the backend.
