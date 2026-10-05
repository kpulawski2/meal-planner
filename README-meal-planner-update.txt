# Meal Planner — Gemini AI Recipe Importer

This repository version adds a private backend for importing recipes into the Meal Planner. The backend uses Google's Gemini API rather than OpenAI, so you can use the Gemini API Free Tier while staying within Google's current model and request limits.

## What it can do

- For TikTok links, attempts to retrieve post title/caption via TikTok metadata, download an accessible video with `yt-dlp`, transcribe audible speech using Gemini audio input, and analyse sampled frames for on-screen ingredient lists/instructions.
- For public recipe websites, reads accessible page text and Schema.org `Recipe` data where available.
- Converts source material into a structured recipe record, while flagging unknown quantities/nutrition rather than inventing details.
- Uses `GEMINI_API_KEY` only on the backend. The key is not embedded in `index.html`.

TikTok access is not guaranteed; private, restricted, regional, or temporarily unsupported posts may not be downloadable. You can paste the caption/transcript instead.

## Deploy to Render

1. Push the repository files to GitHub: `index.html`, `manifest.webmanifest`, `render.yaml`, and the `recipe-import-api/` folder.
2. Create a Gemini key at [Google AI Studio](https://aistudio.google.com/apikey). Use the Gemini API Free Tier and do **not** attach a paid billing account if you want to avoid paid API usage. Free models have rate limits and availability can change.
3. In [Render](https://dashboard.render.com/), select **New → Blueprint**, connect this repository, and apply the detected `render.yaml` blueprint.
4. Supply the requested `GEMINI_API_KEY` and `IMPORT_API_TOKEN` secrets. The token should be a long random value; generate one with PowerShell or another secure random generator. Do not commit either secret to GitHub.
5. Deploy and wait until the service is live. The service address will look like `https://YOUR-SERVICE.onrender.com`.
6. Visit `https://YOUR-SERVICE.onrender.com/health`. Confirm `ok`, `aiConfigured`, and `tokenConfigured` are all `true`; `aiProvider` should say `Google Gemini API`.
7. Open your Meal Planner at `https://kpulawski2.github.io/meal-planner/`. Under **Recipes → Add a recipe → AI importer connection**, enter the Render base URL (no `/health`, `/api`, or trailing slash), enter the exact same `IMPORT_API_TOKEN`, click **Test connection**, then **Save connection on this device**.

## Environment variables

- `GEMINI_API_KEY` — secret key from Google AI Studio.
- `IMPORT_API_TOKEN` — shared secret between this personal app and backend.
- `GEMINI_MODEL` — defaults to `gemini-3.8-flash`.
- `GEMINI_RECIPE_MODEL` / `GEMINI_AUDIO_MODEL` — optional overrides; otherwise use `GEMINI_MODEL`.
- `ALLOWED_ORIGINS` — defaults to `https://kpulawski2.github.io`.
- `PORT` — Render supplies this; default is `10000`.

## Keeping usage free

- The code defaults to a Gemini model that is listed with free-tier access in Google's current API pricing; access, rate limits, model names and free-tier availability may change.
- Keep the Google AI Studio project on its Free Tier and don't add/attach paid billing if you want no paid API usage. Requests may fail when free quotas are exhausted; try later.
- Google's terms say data submitted under the unpaid service tier may be used to improve its products. Do not send passwords, sensitive personal data, or unrelated private material.
- Render's free service may sleep when idle and can take time to wake up. Free hosting limits can change; this deployment does not guarantee zero hosting costs if you upgrade or enable paid features.
- The backend limits import requests, requires the token, validates external URLs, and only permits the configured web origin by default. This is a personal prototype, not a public multi-user service.

## Troubleshooting

- `aiConfigured: false`: set `GEMINI_API_KEY` in Render Environment and redeploy.
- `tokenConfigured: false`: set `IMPORT_API_TOKEN` in Render Environment and redeploy.
- HTTP 401 from import: the token saved in the app does not match Render's `IMPORT_API_TOKEN`.
- HTTP 429: Gemini free-tier rate limit reached; wait and retry later.
- API-key/model error: confirm the key was created in Google AI Studio, the model is available to your account, and you have not exhausted the current quota.
- TikTok failure: paste the post caption/transcript or import a recipe webpage. Video access is not guaranteed.
- CORS error: use the full HTTPS Render base URL; update `ALLOWED_ORIGINS` if the frontend domain changes.

## Privacy note

For recipe extraction, source page text, the supplied caption/transcript, sampled video frames and/or audio are sent from this backend to Google's Gemini API. Free-tier data-use terms differ from paid-tier terms. See Google's [Gemini API pricing and data-use notes](https://ai.google.dev/gemini-api/docs/pricing) before using it.
