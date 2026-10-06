# Meal Planner — Groq AI supermarket price lookup

This project uses **Groq AI** for recipe extraction, audio transcription, and automatic UK supermarket price searches. Price lookup uses Groq's built-in browser-search tool to research official retailer product pages. It does **not** use Open Prices, Apify, or a paid grocery-data API. Groq's free-tier request limits apply; if a limit is reached, the lookup fails with an explicit error instead of switching to a paid provider.

## AI recipe extraction

- **Recipe parsing and video-frame reading:** Groq `qwen/qwen3.8-27b` through the Chat Completions API. It is configured for JSON output and receives no more than three sampled frames per request.
- **Video speech transcription:** Groq `whisper-large-v3-turbo` through the audio transcriptions API.
- **Free limits:** both are configured as free-tier-first models, but availability and quotas depend on the current Groq account and can change. The app reports rate-limit/quota errors and does not automatically switch providers.
- Keep `GROQ_API_KEY` and `IMPORT_API_TOKEN` in Render environment variables only. Do not add secrets to `index.html` or commit them.

## Price lookup

- **AI web search:** price lookup uses Groq model `openai/gpt-oss-20b` with Groq's built-in `browser_search` tool. Current product searches are grouped into small batches for the selected supermarket and cached for three hours to reduce repeat lookups.
- **Retailer scope:** Lidl, ASDA, Aldi, Waitrose and Morrisons only. The UI and backend share this five-store allow-list, so compare-selected only searches stores selected from this list.
- **Evidence gates:** a candidate must have a GBP pack price, pack quantity, a URL on the selected supermarket's official domain, and source evidence that contains the quoted price and pack size. Search results that fail these checks are discarded.
- **User review:** even a validated AI result can be stale or region-specific. Each result shows the retailer product link and price evidence, and should be checked before buying. Loyalty prices, multi-buy conditions, local availability and prices at checkout may differ. Missing prices stay missing instead of being guessed.
- **Median baseline:** when several genuinely close product listings are found, the app computes a median unit-price benchmark in compatible units (for example £/kg or £/L) separately from the whole-pack checkout estimate.
- **Allsupers:** remains a manual cross-check option. The app does not automatically scrape Allsupers because its terms prohibit automated scraping and systematic extraction/re-use without prior written consent.

## Accuracy safeguards

The backend checks the selected retailer domain, GBP currency, quoted price evidence, pack-size evidence, product-name relevance and shopping-list unit compatibility. Median unit-price benchmarks are calculated only from sufficiently close and unit-comparable product listings. The benchmark is a planning statistic, not a purchasable pack price. Whole-pack checkout cost remains separate. Unmatched products remain unmatched rather than receiving invented prices.

Manual prices are tagged with their selected source (`Allsupers manually verified`, `Retailer website manually verified`, `In-store shelf manually checked` or `Manually entered price`) and the entry date. When available, save the precise product/source URL too.

## Configure the backend

1. Create a Groq API key at `https://console.groq.com/keys`. In Render, configure `GROQ_API_KEY`, `IMPORT_API_TOKEN`, and `ALLOWED_ORIGINS`. The Render blueprint defaults to `GROQ_RECIPE_MODEL=qwen/qwen3.8-27b`, `GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo`, and `GROQ_PRICE_SEARCH_MODEL=openai/gpt-oss-20b`. No separate price API key is required.
2. Deploy the service. Check `/health`; `priceDataSource` should report Groq browser search of official retailer product pages.
3. In the app, configure the recipe-import backend as usual, open Shopping, choose a supermarket, and run the AI price lookup. Review and open product links before accepting suggestions. For missing matches, use **Check Allsupers** or **Compare on Allsupers** and manually save a verified price in the pack editor.
4. Never put backend API keys in `index.html` or GitHub Pages.

## Tests

From `recipe-import-api/`, run:

```bash
npm run check
npm test
```

## Limitations

Browser search can miss products or surface stale indexed data; strict evidence validation improves reliability but cannot guarantee the page still displays that exact price or that the product is available in the user’s local area. Allsupers prices are not synchronised into the app automatically; a price is only marked as Allsupers-verified when the user checks the site and saves it.

## Deployment layout

Keep `index.html`, `manifest.webmanifest`, `render.yaml`, and `README.md` at the project root. Keep backend files inside `recipe-import-api/`. GitHub Pages hosts the frontend; Render hosts the backend.
