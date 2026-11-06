# User-chosen meal portions

The current app defaults to fixed portions: one portion per person for each meal.
**Meal portions** is available in Today, Plan and meal settings. Users can choose
an amount for each meal type and apply it to the current uncooked plan. Previously
cooked or partially cooked meals and diary entries retain their recorded amounts.
Existing saved plan quantities are not silently rewritten on upgrade; Apply my
portions replaces the old automatic quantities after the user's explicit action.

The card shows portions per person. A manual card edit also becomes the saved
amount for that meal type in future generated plans and disables automatic
resizing. It does not rewrite other already planned days. Use Apply my portions
to update the other uncooked meals too. Household shopping amounts multiply the
per-person choice by household size. Fixed-batch recipes still buy the full
required batches and retain their existing leftover rules.

**Cereal amounts** on a cereal card, or **Set cereal & milk amounts** in Meal
portions, creates a separate measured personal recipe. Cereal grams and milk
grams/millilitres are independent. For example, 70 g FUEL10K flakes and 200 g
skimmed (red-top) milk make one portion. Measured milk uses a labelled estimated
density of 1.035 g/ml consistently for nutrition, shopping and pantry deduction.
The estimate is around 340 kcal and 24.5 g protein; the user's label takes
precedence. Choose Use this breakfast every day to save its repeat rule. Lunch
and dinner portion settings are retained. Original recipes and already cooked
versions remain unchanged.

Both browser and worker enforce fixed quantities and reject an otherwise valid
resized response. The search chooses suitable recipes at the specified amounts;
it reports a constraint failure if those quantities cannot meet the targets.
There is no silent target relaxation or resizing. Users can explicitly opt into
automatic resizing. Personal measured cereal retains its chosen breakfast size
even in automatic mode. Locked/cooked meal quantities stay authoritative.

For compatibility, older API clients that omit portionMode retain the previous
automatic contract. The current browser always sends fixed by default. Profile
signatures include mode and per-meal amounts, so changing them marks the saved
plan stale and invalidates late results. Unavailable planning keeps saved meals.
These changes are delivered by the hosted app in the existing iPhone shell;
no newly signed IPA is required. Offline cache revision: v56.
