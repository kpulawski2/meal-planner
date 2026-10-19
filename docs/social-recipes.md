# Social recipe collection and kitchen equipment

`public/social-recipes.js` adds 60 measured recipes: 12 overnight-oat breakfasts,
10 smoothie bowls, 10 meal-prep batches, 10 air-fryer dinners, 10 slow-cooker
batches and eight quick meals/snacks. Find them under **Recipes → TikTok ideas**.
Search includes creator, ingredient, equipment and style. Equipment and style
filters work alongside category, collection, quick cooking and saved favourites.
All recipes remain browseable; planning and pantry suggestions require their
listed appliances, complete ingredient nutrition and current food preferences.

Three recipes adapt ingredients described in @smoothieflip's public YouTube
video captions. The app links those videos, credits the creator and labels the
records as Meal Planner adaptations:

- Chocolate banana overnight oats: https://www.youtube.com/watch?v=v1zwei2PTqQ
- Four-ingredient strawberry bowl: https://www.youtube.com/watch?v=MJB_ZATvb48
- Raspberry mango bowl: https://www.youtube.com/watch?v=32FhG9FvsCQ

Metric weights and serving yield are selected Meal Planner formulations, not
assertions of exact cup/scoop conversions or creator-tested metric recipes.
The oats substitute measured peanut butter, dark chocolate and yoghurt for
PBfit, mini chips and unspecified whipped cream. All substitutions and toppings
are counted. Methods are rewritten. The other 57 records are original Meal
Planner formulations of social-food ideas. No TikTok video identity, endorsement,
creator calories or published shelf price is invented. TikTok blocked direct
access during research; verified creator sources above are public YouTube posts.
Paid cookbooks, reposted scans and AI recipe aggregations are not sources for
this collection. No creator images or video transcripts are redistributed.
These newly formulated recipes have not been physically kitchen-tested.

Nutrition is calculated from every measured ingredient and divided by yield.
Unsweetened almond drink and raspberries have explicit generic nutrition
profiles; actual brands and protein powders can differ. The source's calorie
claims are not stored as verified app nutrition. Grain weights are dry and
canned bean/fish weights drained. Air-fryer instructions include appliance
capacity, approximate timing and doneness checks. Batch instructions distinguish
rice storage from other leftovers, and slow-cooker instructions use thawed
meat and cooked canned beans. Cooking temperature guidance follows the FSA:
https://www.food.gov.uk/safety-hygiene/cooking-your-food

## Equipment choices and compatibility

`public/equipment-core.js` provides 21 shared appliance choices across Settings,
recipe editing, browser selection, readiness and server planning. Everyday
appliances, cookers, blending/baking and specialist devices are grouped.
Selections are saved on the device and included in the existing backup. Existing
selections are preserved and common aliases normalised; no new appliance is
silently marked owned. New appliances start off until selected.

All of a recipe's listed requirements must be owned. Unknown requirements
stay incompatible rather than being silently removed. The request bounds remain
250 recipes/40 ingredients/21 required appliances per recipe; the planner retains all supported profile
equipment, not just CREAMi. Already cooked recipes keep their existing lifecycle
protection. Appliance filters let a user browse unowned recipes without changing
kitchen settings. Required appliances can be edited on a local recipe/copy.
Recipes in older collections without explicit equipment tags retain their
existing behaviour; their method should still be reviewed before cooking.

## Timings and full batches

Curated slow-cooker recipes show 15 minutes hands-on plus four hours slow cooking;
oats show five minutes hands-on plus six hours chilling. `passiveMinutes` and
`passiveLabel` describe the separate waiting period. Maximum hands-on time and
the quick filter use `cookTime`; older recipes' existing cook/total time remains
a conservative bound. Existing CREAMi freeze time still displays separately.

Slow-cooker recipes prepare a full four-serving pot. `fixedBatch` preserves whole
batch rounding and shares a pot across allocated days. Ingredient shopping and
stock consumption count the full batch; nutrition and food logging count eaten
portions. The existing cooking confirmation records cooked leftovers. General
batches use recipe-specific storage instructions, while CREAMi tubs retain their
frozen-storage wording. Browsing or saving a recipe does not consume ingredients,
record purchases or replace a user's plan.

The collection also includes 34 measured fakeaways and ten freezer-burrito
batches via `public/fakeaway-recipes.js`. See [Fakeaways and fresh weeks](fakeaways-and-rotation.md)
for source attribution, batch quantities and the recent-plan rotation preference.
