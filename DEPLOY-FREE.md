# Free mobile deployment (GitHub + Render)

This keeps the complete Node.js backend running, so Groq recipe imports, video/audio processing and supermarket price lookups remain available. GitHub is the private source repository; Render serves the app over HTTPS. You do not need GitHub Pages for this project because GitHub Pages cannot run the Node backend or keep the Groq key secret.

## Before starting

- A GitHub account
- A Render account
- A free Groq API key from https://console.groq.com/keys (recipes/video importer)
- A Brave Search API key from https://api-dashboard.search.brave.com/ (supermarket prices)

The app can run at £0/month on Render's Free instance, Groq's free allowance and Brave Search's monthly included credits, subject to each provider's limits. Brave Search currently includes $5 in monthly credits on its Search API plan (about 1,000 requests at $5 per 1,000). Brave requires a payment card to activate the plan, and may place a temporary $0/$1 verification hold that it says is refunded. For no out-of-pocket API spend, choose the prepaid Search plan, set prepay to $0, turn auto-reload off, and set the usage limit so the included $5 credit is the maximum available usage. The prepaid service pauses when the balance reaches $0. Check the settings in Brave's dashboard before relying on this as a hard cap. Render Free services sleep after 15 minutes without traffic, so the first visit after inactivity can take around a minute.

## 1. Put the project in GitHub

1. Download and extract the project ZIP.
2. Make sure the files inside the `meal-planner` folder are the repository root. In particular, `render.yaml`, `Dockerfile`, `package.json`, `public/` and `recipe-import-api/` should sit alongside one another at the top level.
3. Create a **private** repository on GitHub (for example, `meal-planner`).
4. Use GitHub Desktop to add the extracted folder as a local repository, commit the files, and publish it to your private GitHub repository. Alternatively, upload the project files to the repository while preserving the folder structure.
5. Check that `.env` is not committed. The provided `.gitignore` excludes it, and the ZIP only contains `.env.example`. Never commit a real Groq key or importer token.

## 2. Deploy the app on Render Free

1. Sign in at https://dashboard.render.com/.
2. Choose **New → Blueprint** and connect GitHub if asked.
3. Select the `meal-planner` repository. Render reads the root `render.yaml` and configures a Docker-based web service on the Free plan.
4. When prompted for environment variables, enter:
   - `GROQ_API_KEY`: your key from Groq Console.
   - `IMPORT_API_TOKEN`: create a long, private random password (at least 32 characters) and save it somewhere safe. You will enter the same value in the app later.
   - `BRAVE_SEARCH_API_KEY`: your Search API key from the Brave Search API dashboard. Price lookup uses this key; it no longer consumes Groq tokens.
5. Keep the app's `GROQ_*_MODEL` values at their supplied defaults unless a supported model ID changes. Do not add the secret values to GitHub files.
6. Create/deploy the Blueprint and wait for the first deploy to finish. If you change code later, push a commit to GitHub and Render redeploys automatically.

## Updating an existing Render deployment

If the main `meal-planner` Render service is already deployed, do not create another service or re-enable the old `meal-planner-recipe-import` service. Commit the updated files to the existing GitHub `main` branch and let the green `meal-planner` service deploy. In Render → `meal-planner` → **Environment**, add `BRAVE_SEARCH_API_KEY` with the key created in the Brave Search API dashboard. Keep `GROQ_API_KEY` and `IMPORT_API_TOKEN` as they are; Groq is still used for recipe/video importing. Save the environment change so Render restarts the main service.

## 3. Test the live service

Render gives the service an HTTPS address ending in `.onrender.com`.

1. Open that address in a browser. The Meal Planner should load.
2. Visit `<your-service-url>/health`. Look for `"ok": true`, `"aiConfigured": true`, `"tokenConfigured": true`, `"braveSearchConfigured": true` and `"livePriceSearchConfigured": true`. This endpoint does not reveal secret values.
3. In the app, open **Recipes → Add a recipe → AI importer connection**. Keep the API URL as the app's own HTTPS address and enter the same `IMPORT_API_TOKEN` you set in Render. Save and use **Test connection**.
4. Test with one pasted recipe or a small price lookup first. Brave monthly credits/rate limits apply to price searches; Groq limits still apply to recipe/video import. Exact prices may not be readable from every product page.

## 4. Add it to your phone's home screen

### iPhone

1. Open the Render HTTPS address in **Safari**.
2. Tap **Share**.
3. Choose **Add to Home Screen**. Enable **Open as Web App** if shown, then tap **Add**.

### Android

1. Open the Render HTTPS address in **Chrome**.
2. Open the browser menu and choose **Install app** or **Add to Home screen**.

The app then has a home-screen icon. Internet access is required for AI features and live price searches.

## 5. Keep your saved planner data

Meal plans, recipes, shopping checks and settings are stored in browser storage on each device; this project does not include a cloud-synced account database. Before switching to the new URL, use **Settings → Export backup** in the old app. Open the new app and use **Settings → Import backup**. Keep periodic backups because browser data is tied to that device and browser.

## Free-plan limitations

- Render sleeps after 15 minutes of inactivity; waking can take about a minute.
- Free service filesystems are temporary. The app's saved planner data is stored in the phone/browser, not in the server filesystem.
- Render, Groq and Brave have usage/rate limits. Each ingredient/store lookup normally uses one Brave search request, so an illustrative 66-item basket uses up to 66 queries per supermarket. Price lookup uses Brave Search transiently to discover official pages and extracts price/pack details directly from those pages; the code does not save Brave result titles/snippets/URLs. Results are best-effort and should be checked against the linked listing.
- Do not use the service as a public multi-user application; it was designed as a personal planner.
