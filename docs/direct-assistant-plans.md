# Direct plans in the assistant

Describe the meals, period and targets in **Chat with my assistant**. For example:
“For the next 7 days, overnight oats varieties for breakfast, tuna salad or wraps
for lunch and chicken dinners. Under 1600 calories, at least 150 g protein,
90 g carbs and no more than 20 g fat, with a £35 weekly budget.” The assistant
interprets the request, finds measured recipes and runs the existing full-pack
budget and nutrition planner. A successful result saves the plan and shows a
summary and meals in chat. **View my plan** is optional navigation afterwards.

Follow up with “change lunch to tuna salad”, “make it 3 days” or a new weekly
budget. Unmentioned limits and meal requests carry forward. Missing details,
unsupported periods and unavailable recipes prompt a question in chat; a short
answer can complete it. Explicit repeated meals and per-slot variety are both
supported. An end-of-plan meal such as steak on the last day stays a scheduled
exception when the period changes. The supported period remains 1–14 days and
2–4 meals per day. Informational nutrition and cooking questions do not create
plans.

Only a validated result replaces the saved plan and settings. The browser checks
known recipes, quantities, category rules, every day's macro limits, recipe
variety, a complete priced basket and existing paid spending. Current cooked or
kept meals and their quantities must remain present. Cancelled, failed, stale or
late responses leave the prior plan and settings intact. Planning does not log
food, record a purchase or consume stock. Recipe nutrition and prices come from
the existing measured library and catalogue; model text cannot invent them or
silently change numerical limits. An impossible request reports the limitation
and asks what to change.

## AI and local interpretation

`POST /api/planner/interpret` accepts an optional `direct: true` conversational
interpretation mode. It may use bounded prior meal requests to interpret a
follow-up, while deterministic parsing retains authority over numerical targets.
It uses the existing Groq text model and shared free daily allowance/minute
spacing. There are no new dependencies, credentials or paid services. When AI is
unavailable or limited, supported wording uses local interpretation and is
labelled **on device**. A fresh, complete plan still requires an online catalogue
price check; offline interpretation cannot manufacture a priced result.

AI sharing switches control the context sent to the model. Plan validation
independently sends necessary current planner settings, stock and protected
meals to the app's server. Food diary entries and personal cooking notes stay
local. Conversations, drafts and bounded saved-result summaries persist in
on-device storage and existing backups. Historical chat summaries identify
prices as estimates checked when saved. Their **View my plan** action appears
only while that saved result matches the current plan.

The assistant starts with one message field and Send; Stop appears while work is
running. Context controls are collapsed, and New conversation clears the thread
without deleting the plan. Existing manual Tailor, recipe, batch preparation,
cooking and logging tools remain available. Shell cache and CSS version are v33.

## Validation

Automated checks cover local and provider-assisted interpretation, preserved
limits and diet exclusions, repeat/variety rules, numeric clarification answers,
transactional saving, protected meals, stale data, cancellation and reload.
Chromium checks use the real ASDA catalogue and optimizer, including successful
planning and follow-ups, an unaffordable request that preserves the prior plan,
reload, offline price-check failure and 320/390/1440 light/dark layouts. Live
Groq response quality is not verified in this workspace without a provider key.
