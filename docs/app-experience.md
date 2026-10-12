# Everyday app experience

The responsive shell uses a sidebar on desktop and five primary phone tabs:
Today, Plan, Recipes, Shop and More. More opens favourites, pantry and preferences,
appearance choices, and backup download. Existing screens and saved data remain
available. Light, Dark and Device setting persist on this device and in backups.

Today puts planned nutrition and meals before secondary tools. The food diary
continues to describe actual logged intake for its selected date, separately from
planned meals. Unknown or incomplete planned nutrition displays a dash rather
than a complete-looking total. Budget details use the existing price and stock
checks. Generating a plan continues to enforce all existing hard constraints.

Today and Plan can browse all 1–14 planned days, including week two. Day numbers
are positions within the plan, not calendar dates. The selected day stays visible
in the scrolling day row. Plan supports One day and All days. These presentation
choices do not change meals, quantities, pantry stock, purchases or diary entries.
Day choice and view mode survive reload and backup.

Recipes supports searches with words anywhere in recipe names, ingredients,
equipment and creator tags, including common mayo/pickle/yoghurt aliases. Sort
by Recommended, Most protein, Lowest calories, Quickest or A–Z. Missing and
partial nutrition sort after complete values. Unknown cooking times sort last.
Recommended prioritises suitable measured recipes, saved favourites and recorded
taste preferences. Sorting and filtering do not change the saved recipe library.

Pick for me opens a preview from the current filtered results, using measured
recipes compatible with the existing diet, owned equipment and planning rules.
It avoids repeating the last pick when alternatives exist. A preview never adds
a meal or logs intake. Existing plan validation still applies when planning or
swapping. Reset filters makes it easy to recover from an empty search.

Recipe artwork uses lightweight decorative illustrations and existing food icons;
it does not claim to be a photograph of a recipe. All assets are local and cached
by the service worker, with no external font or image dependency.

Dialogs have names, keyboard focus, a Tab loop, Escape dismissal and focus return.
Background controls are inert while a dialog is open. Focus indicators, larger
touch controls, reduced-motion handling and a skip-to-content link support
keyboard and mobile use. Day browsing gives separate IDs to Today and Plan
portion controls so labels focus the correct field.

Implementation: `app-experience-core.js` stores bounded presentation preferences,
`recipe-discovery-core.js` provides pure search/sort/pick functions, and
`app-experience-ui.js` plus `app-experience.css` render the shell. Existing recipe,
food-log, pantry and budget modules remain the sources of data and actions.
