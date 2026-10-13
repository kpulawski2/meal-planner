# Kitchen assistant

Open **Ask my kitchen assistant** from Today, the Plan tools or More. Ask, for
example, “How should I prep my 1 kg of chicken for the next few days? I’m thinking
curry.” Review the editable main ingredient, measured weight and weight basis,
number of days, people, and dish search. The guide assumes one equal portion per
person each day. Choose a recipe to see the entire batch’s ingredients, steps,
estimated nutrition per equal portion and storage split.

Save & view recipe creates a separate local recipe and opens its existing review
screen, where it can be edited or added to a plan. The plan’s existing checks and
cooked-meal protections still apply. Save & start cooking opens resumable cooking
mode with the entire batch selected. These actions do not consume pantry stock,
record food eaten, or silently replace meals. A text guide can be downloaded.
The question and reviewed details survive closing, reloads and app backups.

## Quantities and limits

Supported weighed ingredients are chicken breast, chicken thigh, turkey mince,
lean beef mince, tofu, salmon, tuna, chickpeas and red lentils. Raw, cooked, dry
and drained weights must match the recipe. There is no cooked-to-raw conversion,
bone-in yield assumption or substitution of chicken sausages for breast. A recipe
must have confirmed quantities, usable steps, a known yield, complete ingredient
nutrition, and match current dietary exclusions, equipment, feedback and active
cooking-time settings. Fixed appliance batches keep their original capacity in
Recipes and are excluded from arbitrary scaling.

All ingredient rows scale together by available main-ingredient grams divided by
the recipe’s measured main-ingredient grams. The resulting batch is divided into
the selected number of portions. This produces new per-portion estimates through
the existing ingredient nutrition engine. No model-generated nutrition or prices
are used. Prices remain unknown until existing shopping/catalogue checks run.
Daily macro targets and the household budget require the full plan checks; a batch
proposal alone is not a promise that those targets fit.

Original method timings, vessel sizes and embedded quantities are not rewritten
as tested directions for a larger batch. The guide prominently asks users to
check capacity/timings and cook in smaller batches when needed. Shorter source
recipe or packaging storage instructions take priority; recipes unsuitable for
freezing should be cooked in fewer-day sessions.

## Interpretation and privacy

`POST /api/kitchen/interpret` uses the existing protected same-origin/token
admission and shared free AI allowance. Groq may interpret unfamiliar phrasing
into the bounded prep fields. It does not invent a recipe or answer food-safety
questions. Explicit weights, recognised ingredients, bases, periods, people and
dishes are owned by local parsing; unknown or ambiguous weights remain unknown.
Malformed provider data falls back to the local interpretation. The browser can
also build/edit proposals without a connection or provider key.

Only the question and prep fields are sent for interpretation. Pantry stock,
food diary, personal recipe notes, saved meals and nutrition goals are not sent.
Requests are bounded to 2,000 characters, 10–10,000 g, 1–14 days and 1–8 people.
Closing, editing the question or changing the fields cancels pending results.
Saving checks both the reviewed fields and source recipe again. Identical saved
batches are reused; edited batches are preserved separately.

## Food storage guidance

The deterministic guidance was checked against Food Standards Agency guidance
on 13 October 2026:

- [Chilling, freezing and defrosting](https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely).
- [Cooking and reheating](https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food).
- [Rice storage](https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker).

Ordinary batches allocate at most two days’ portions to the fridge and the rest
to prompt freezing. Rice-containing batches allocate at most one day to the
fridge, using the faster rice cooling guidance. Exact elapsed-hour limits remain
visible, rather than relying on day labels or automatically assigning expiry
dates to food that has not yet been cooked. Cooking mode retains these reminders.

Validation covers real shipped curry recipes, scaling and redistribution,
weight/cut mismatches, unsafe storage-period assumptions, missing measurements,
malformed or conflicting AI interpretations, request admission/rate limits,
stale source recipes, saved drafts and safe cooking handoffs. Real Chromium
checks cover mobile/desktop themes, keyboard/modal behaviour, save/view/add-to-plan
review, downloads, resumable cooking and offline operation. Provider fixtures are
not live model verification; the cloud workspace has no Groq key or Render egress.
