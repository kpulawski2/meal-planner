# One place to plan the week

Use **Plan → Edit plan**, **Settings → Plan this week**, or the shopping-day
prompt to open the same draft screen. Choose supermarket, weekly household
budget, period, people, meal count, cooking approach and meal focus. Each meal
has a specific recipe or preferred style and a portion count per person. Daily
nutrition goals are available in the same screen. Switching to two meals hides
breakfast; switching back retains its draft choice and portions.

Selecting FUEL10K cereal adds separate cereal and skimmed-milk measurements, in
grams or millilitres. The screen shows the full breakfast quantity: 70 g cereal
and 200 g milk **per portion**, at two portions, means 140 g cereal and 400 g milk.
Existing personal recipes are reused when those amounts have not changed.

**Preview my week** does not save settings, recipes or meals. It shows all days,
exact portions, nutrition differences and the whole-pack shopping estimate plus
recorded spending. Repeated meals and daily totals are compacted into “Every day”.
Missing prices remain visible and never become a verified total. Explicit meal
choices can be saved with warnings; automatic search results must pass the
existing checks before they can enter the preview. A later incomplete or
over-budget price quote changes the result to a reviewed manual plan.

Suggestions explain small measured substitutions at the same portions. Trying
one edits the draft; preview again to check every day and shopping prices. A
calorie minimum shortfall offers an explicit calorie-ceiling choice. Targets,
portions and saved meals are never silently relaxed. Cancelling, stale results
and storage failures preserve the prior saved state. Cooked and kept meals stay
protected; use the existing **Start new week** action when the current week is
finished and a new shopping budget should begin.

## Undo and history

**More → Plan history & undo** lists up to twelve recent plan revisions and
twelve archived weeks. Plan replacement, checked swaps, portion edits and cereal
edits retain the preceding plan. Preview undo before saving. Restoration changes
meal choices and planning goals, while keeping current food exclusions,
equipment, disliked recipes, stock, purchases and diary entries. Existing
kept/cooked meals and their exact quantities take priority over the old copy.
Removing a cooked day or restoring an unavailable/conflicting recipe is blocked
with an explanation. An undo can itself be undone through the new revision.

## Better recipe feedback and images

After liking or disliking a recipe, **What did you think?** offers optional
reasons. Time, seasoning, heat and available recipe cost estimates can gently
influence ranking. Unknown costs are not invented. Dislikes still exclude the
specific recipe; nutrition, food restrictions, equipment and pack budgets retain
authority. Reasons remain in local app state and backups.

Popular oats, cereal, tuna-pasta, chicken-enchilada, chicken-burrito and chicken-
curry families have locally hosted, labelled AI-generated serving illustrations.
They are illustrative, not photographs of the exact recipe or nutrition data.
Recipe details identify the source; ingredients and portions remain authoritative.
Other recipes retain their existing art. **Add your food photo** accepts JPEG,
PNG or WebP, compresses it on the device, and stores it locally, with no upload.
There is a twelve-photo limit and storage failures leave the previous data intact.

## Release checks

The GitHub mobile job runs the actual browser flow through draft edits, two/three
meals, measured cereal at 2/1/1, preview/cancel/save, undo, taste reasons, photo
storage failure/success, shopping, reload, responsive sizes, dark mode and offline
use. Screenshots and a report are retained for seven days. The scheduled ASDA
publisher waits for this check and the existing app/catalogue tests. Locally:

```
npm install --no-audit --no-fund --ignore-scripts
npx playwright install chromium
npm run test:mobile
```

Use `MOBILE_BROWSER_EXECUTABLE` to test an already installed Chromium and
`SMOKE_ARTIFACT_DIR` to choose the report directory. Production credentials are
not required or used by the smoke server. Offline cache revision is v58. The
hosted app updates the existing iPhone shell; no new signing or IPA is needed.
