# More useful cooking methods

`public/recipe-method-details.js` contains 426 methods matched to existing measured recipes. The first 100 cover: all 34 fakeaways (including ten freezer burrito batches), 19 everyday recipes, 13 tailored recipes, ten lighter meals, five frozen-chicken dinners, six air-fryer/slow-cooker recipes, four Romanian/Polish recipes and nine older staples. The published list is `RecipeMethodDetails.ids`; counts should be checked against it when changing the collection.

The methods explain preparation, the point at which each listed spice or sauce is used, heat level, indicative times, texture and doneness checks, and suitable storage. They use only the existing ingredients and yields, so adding method detail does not change nutrition, supermarket matching, shopping quantities or pantry/cooked-meal signatures. Plain meals do not acquire unlisted seasonings. Water used to cook or loosen a sauce is not an extra priced food. Timings remain estimates and the recipes do not gain a kitchen-tested claim.

The shared `recipeMethodSteps` function serves the recipe sheet, cooking mode, editable copies and the kitchen assistant. A detailed method applies only when its exact ingredient rows and yield match. Custom recipes, changed ingredient quantities/yields, unavailable recipes and imports retain their own instructions. Existing missing-method handling remains in place.

Serving instructions refer to the selected ingredient amounts; freezer burritos explain the four-wrap recipe batch and cooling before assembly. Frozen chicken continues to cook separately for its full pack-directed oven time. Old in-progress cooking steps are rejected with the existing changed-recipe explanation; recorded cooked quantities and historical pantry/diary data are preserved.

The remaining 326 curated meals and snacks were subsequently expanded; see [recipe-expansion.md](recipe-expansion.md). Simple fruit, cereal and existing specialist CREAMi instructions retain their appropriate level of detail.

The browser module is precached in app shell v53. The fixture reader uses the same methods so recipe and planning regression tests exercise the published content.
