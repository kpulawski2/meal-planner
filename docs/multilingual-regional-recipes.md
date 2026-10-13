# English video imports and Romanian / Polish recipes

## Importing another language

Open **Recipes → Import recipe**, select **Source language** (or leave
**Automatic detection** for a video), then upload a saved video or paste its
TikTok link. Readable spoken recipe details, captions and sampled on-screen text
are extracted into English ingredient names, ingredient notes and cooking steps.
Ingredient notes and source warnings are visible in the review. An explicit
cooked weight in a translated note is carried into the ingredient name so it
cannot be silently treated as a dry/raw weight. The review identifies English output and whether its source language was selected
or detected. The original speech transcript can remain in the source-text field
for comparison. Review the recipe before saving; unknown quantities, yields and
nutrition remain unknown. Saved translation provenance stays in recipe details
and backups.

The optional language hints include Romanian, Polish and 22 other common
languages, plus automatic detection. Auto detection can recognise other languages
supported by the speech service; the picker is not a promise that every language
or recording can be understood. Accents, background music, conflicting captions
and unclear numbers still need review. A traditional dish name can remain alongside
an English explanation; its ingredients and method are requested in English.

For a non-English pasted recipe or structured website, choose its source language
to request translation. Structured translation preserves each ingredient and
step, original amounts, units, yield, times and source nutrition. An omitted or
reordered ingredient, missing step or oversized recipe blocks the translation
instead of silently discarding content. English structured imports retain their
existing path without AI. Auto-detection on that path preserves the source text;
it does not claim that a structured non-English page was translated.

Video processing and selected foreign-language translation use the existing
configured Groq connection and the same shared allowance (20 AI imports/day,
at least one minute between requests). No extra service, model subscription or
payment flow is added. Missing configuration, allowance limits and failed
translation preserve the current review draft. Saved videos remain limited to
50 MB and five minutes. Uploaded and downloaded temporary media is removed.

Speech uses the multilingual transcription endpoint, with a source-language hint
when supplied. The existing turbo speech model transcribes in the original
language; the recipe model translates that evidence and readable frame text into
English in the same extraction request. It is not sent to the audio translation
endpoint, which the turbo model does not support. Details:
[Groq speech-to-text documentation](https://console.groq.com/docs/speech-to-text).

Only two representative frames are sampled to keep the existing provider bounds.
The app cannot guarantee recovery of text appearing only elsewhere in a clip.
Add the full caption or transcript if something was missed. Audio failures and
shortened source text produce review warnings. Missing or explicitly non-English
output-language confirmation is a controlled failure. English output requests do
not guarantee a perfect translation; check unfamiliar ingredients and quantities.

## The Romanian & Polish collection

**Recipes → Romanian & Polish** contains 48 original measured adaptations,
24 for each cuisine: 4 breakfasts, 7 lunches, 10 dinners and 3 snacks. Filter by
Romanian / Polish, category, equipment, meal prep or ingredient. Traditional names
are searchable with or without diacritics, including Polish ł. Favourites, editable
copies, cooking mode, pantry suggestions, the Prep centre, shopping and the usual
planner checks work with these recipes.

Romanian examples include mămăligă, clătite, several ciorbă soups, fasole bătută,
salată de vinete, zacuscă, salată de boeuf with chicken, ostropel, sarmale, stuffed
peppers, ghiveci, pea stew, ciulama, tocană, lean mici-inspired patties and baked
papanași-style cakes. Polish examples include twaróżek, jajecznica, owsianka,
naleśniki, rosół, pomidorowa, krupnik, ogórkowa, barszcz, chłodnik, sałatka jarzynowa,
gołąbki, bigos, pierogi, kopytka, placki, schabowy, ryba po grecku, buckwheat kasza,
leniwe and lighter sernik / szarlotka / racuchy snacks.

These formulations use lean proteins, vegetables, measured oils, modest sweetening
and yoghurt/quark in selected richer sauces or fillings. They are adaptations,
not claims of an unchanged traditional recipe, independently kitchen-tested food
or clinical health benefit. Substitutions and changes are stated. All fats,
sauces and toppings used in a method are measured in its ingredient list.
Estimates depend on the actual pack and portion; the collection label never
relaxes daily calorie, protein, carbohydrate, fat, budget, diet or equipment checks.
Similar porridge, pancake, cottage-cheese toast and cabbage-roll variations across
both countries share dish families so they cannot inflate variety checks.

Batch dishes have explicit yields, full-batch rounding, storage instructions and
passive cooking time. Air-fryer and slow-cooker choices require those appliances.
Recipe names, weights and methods are original Meal Planner text. Cultural
references are [Romania Tourism's cuisine guide](https://romaniatourism.com/romanian-food-wine.html)
and [Poland Travel's cuisine guide](https://www.poland.travel/en/flavours-of-polish-cuisine/);
these guides are linked for context and their recipes/text are not bulk copied.

## Additional ingredient reference values

Published references checked 13 October 2026 provide per-100-g estimates for foods
not previously covered. Cooked/drained and dry bases remain explicit. These are
reference values, not a claim that every ASDA/Lidl pack has the same nutrition.

| Ingredient basis | kcal | Protein | Carbs | Fat | Reference |
| --- | ---: | ---: | ---: | ---: | --- |
| Dry cornmeal/polenta | 360 | 9.4 g | 73 g | 3.3 g | [Island Sun label](https://www.tesco.com/shop/en-GB/products/266303459) |
| Dry plain wheat flour | 357 | 9.9 g | 73.5 g | 1.7 g | [Tesco plain flour](https://www.tesco.com/shop/en-GB/products/254917828) |
| Raw white cabbage | 36 | 2.4 g | 4.1 g | 0.2 g | [Tesco white cabbage](https://www.tesco.com/shop/en-GB/products/279684223) |
| Plain cooked beetroot | 42 | 1.5 g | 7.1 g | 0.4 g | [Redmere Farms label](https://www.tesco.com/shop/en-GB/products/292213510) |
| Dry pearl barley | 338 | 7 g | 69 g | 2.2 g | [Melvit groats label](https://www.tesco.com/shop/en-GB/products/301372450) |
| Dry roasted buckwheat | 367 | 13 g | 69 g | 3 g | [Melvit manufacturer](https://melvit.pl/en/roasted-buckwheat-groats-4-x-100-g/) |
| Drained sauerkraut | 25 | 1.1 g | 3.4 g | 0 g | [Dawtona label](https://www.tesco.com/shop/en-GB/products/305046773) |
| Raw aubergine | 20 | 0.9 g | 2.2 g | 0.4 g | [Tesco aubergine](https://www.tesco.com/shop/en-GB/products/293610620) |
| Raw mixed sweet peppers | 29 | 1 g | 4.8 g | 0.3 g | [Tesco mixed peppers](https://www.tesco.com/shop/en-GB/products/253557731) |

Dry buckwheat excludes ready meals, cooked grains and prepared alternatives from
its automatic matches; plain flour excludes self-raising or different flours.
A variable-weight cabbage uses its declared typical mass only where the stored
item price agrees with the same snapshot's per-kg price. That weight and checkout
cost remain estimates. Drained sauerkraut uses coherent per-kg edible-weight
evidence and cannot borrow an unverified jar net weight. A bell pepper sold by
count uses a labelled 130-g-per-item reference assumption; weigh your own peppers
for precise portions. Unknown Lidl prices and usable quantities remain unknown.
