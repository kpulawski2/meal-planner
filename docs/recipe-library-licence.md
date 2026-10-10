# Open recipe collection

`data/recipe-library.json` and the adapted Wikibooks recipe content within it are
released under **Creative Commons Attribution-ShareAlike 4.0 International**:
<https://creativecommons.org/licenses/by-sa/4.0/>.

Credit: **Wikibooks contributors; compiled through Recipe Context Protocol**.
Every recipe includes its original Wikibooks page (`source`), contributor history
(`authorsUrl`), source revision, licence link and attribution. Those links and
notices must accompany a redistributed recipe. Adapted recipe content and
substantial extracts of this collection must retain the same licence. This notice
applies to the recipe data, rather than changing the app code's licence.

`public/world-recipes.js` also releases its 41 measured Wikibooks adaptations
under CC BY-SA 4.0. Each record links the primary source, contributor history and
revision, and states changes to quantities, yield, ingredients and method. These
are revised Meal Planner formulations, not unmodified or kitchen-tested versions
of the publisher's recipes. Cooking temperature guidance follows the UK Food
Standards Agency: <https://www.food.gov.uk/safety-hygiene/cooking-your-food>.

## Source and permissions

- Original publisher: Wikibooks Cookbook. Its official copyright policy expressly
  permits copying, adapting and redistributing text under CC BY-SA 4.0, provided
  attribution, a licence notice and an indication of changes are retained:
  <https://en.wikibooks.org/wiki/Wikibooks:Copyrights>.
- Collection provider: Recipe Context Protocol, a free structured representation
  of Wikibooks recipes. Its collection and recipe licence notices are at
  <https://recipecontextprotocol.com/about>. Its documented API, field coverage,
  request limits and attribution requirements are at
  <https://recipecontextprotocol.com/llms.txt>.
- This app downloads every paginated entry in the provider's modern `wikibooks`
  corpus. It does not include the provider's historical Gutenberg corpus or copy
  images. No paid API or AI is needed for the collection refresh.
- Ingredient quantities are parsed into fields; metric equivalents are selected
  where the publisher explicitly supplies them, without inventing a generic cup
  weight. Source methods remain intact.
  Missing amounts, yields and times remain unknown. Cooking fats mentioned only
  in methods are added with an unknown amount, so calorie totals cannot silently
  omit them. These adaptations are described in each row's `modifications`.

## Nutrition and suitability

The source does not provide a complete nutrition panel. The app's ingredient
calculations are estimates, not published source nutrition. Recipes with unknown
yield or amounts need review before they can support reliable portion, shopping
or nutrition totals. Source measures such as cups and tins need a conversion
specific to the ingredient. The collection includes meal components and desserts
as well as main meals, and community content has not been independently tested by
this app. A recipe appearing in the browser does not mean it qualifies for the
automatic budget planner.

## Refresh and protection

Run `node recipe-import-api/refresh-recipe-library.js`. It reads all index pages
and details with four workers, at most one request start every 260 milliseconds,
bounded retries, `Retry-After`, ETags and restart checkpoints. Published metadata
records actual discovery and validation counts. The refresh requires exact index
coverage, at least 98% validated recipes, unique identifiers, complete provenance,
and no more than a 5% drop from a healthy previous collection. A rejected or
interrupted refresh never replaces the existing collection.

The automated GitHub workflow refreshes monthly. A manual `workflow_dispatch`
refresh is also available. Metadata is in `data/recipe-library-meta.json`.

## Sources deliberately not bulk copied

NHS Healthier Families' specific terms reserve copyright and allow personal
extracts; they do not grant the broader reuse permission assumed by a blanket
Open Government Licence label. Those recipes were therefore not copied into this
redistributable collection:
<https://www.nhs.uk/healthier-families/terms-and-conditions/>.

Other recipe sites can still be linked or imported individually by a user. Their
availability online does not give permission to republish their whole collection.
