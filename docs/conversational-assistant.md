# Conversational kitchen assistant and navy theme

## What users can do

**Chat with my assistant** opens a saved conversation from Today, Plan or More.
Ask for meals, then follow up with “make it lower fat”, “more protein”, “without
rice”, “something quicker” or “compare these recipes”. The assistant carries
food/category preferences and explicit per-portion limits into later questions,
rather than starting again each time. A new conversation clears that thread.

Recipe cards show current calculated ingredient estimates per portion, preparation
time when recorded, and optional pantry coverage for the recipe's required batch.
Pantry coverage is checked separately for each recipe; it does not reserve stock
across several suggested meals. Expired/invalid stock is excluded. Suggestions
respect current diet, food exclusions, feedback, equipment and cooking-time
settings; a requested vegetarian/vegan filter can tighten an existing diet but
cannot loosen a vegan profile. “Budget” prioritises budget recipe tags, with full
pack prices still checked through Shopping or the planner.

Each useful action opens an existing review:

- **Open recipe** shows measured quantities and full original method/cooking mode.
- **Prep a batch** opens the measured batch tool with confirmed weight and period
  carried through the conversation. Unsupported main ingredients or fixed
  appliance batches use the original recipe instead. Changing the main ingredient
  clears an old unrelated weight rather than assuming an equal raw/cooked yield.
- **Review my plan request** passes the request to Tailor my plan for explicit meal,
  target and budget review. It does not automatically fit or replace a plan.
- **Log food** opens the amount/date review; it does not record consumption itself.

Storage/reheating questions use the deterministic Food Standards Agency guide,
with the separate rice cooling/refrigeration rule. The model does not supply
shelf lives, temperatures or medical advice. Current recipe or packaging limits
remain authoritative. Recipe changes invalidate old conversation actions.

## Context, models and limits

Users can choose whether to include goals/diet/budget/equipment, or recorded pantry
stock. Pantry sharing starts off; asking through the explicit pantry starter turns
it on visibly. Recipe options and recent conversation are included. Food diary and
personal cooking notes are not read or sent. The thread stays in on-device storage
and existing app backups, bounded to 24 messages; only six short recent messages
are sent to the model. A new conversation removes that thread's previous context.

`POST /api/kitchen/chat` validates a maximum of six measured recipe records, known
IDs, finite nutrient/ingredient quantities and a bounded context. No arbitrary
tool calls, URLs or application mutations are accepted from the model. Model
output is plain text with known recipe IDs and short suggested follow-ups. Unknown
IDs, numeric prose claims, unsafe advice and malformed responses fall back to the
measured local reply. Displayed nutrition always comes from the app's ingredient
engine, with prices deferred to the actual catalogue/plan checks.

The existing Groq text model (`openai/gpt-oss-20b`, low reasoning effort) can add
explanations and conversational suggestions around the retrieved recipes. Inputs
are bounded to 18,000 characters plus the system prompt, with a 1,000-token output
limit. It shares the existing daily allowance and minute spacing with other AI
imports, so a conversation can show **on device** while AI is limited, unavailable
or offline. This is visibly distinguished from an **AI** reply. Same-origin/token
admission and a bounded per-client request rate protect the endpoint. No new paid
service, fallback, dependency, environment variable or credential is added.

Current free-model/rate references checked on 13 October 2026:

- https://console.groq.com/docs/model/openai/gpt-oss-20b
- https://console.groq.com/docs/rate-limits

Provider fixtures test the full HTTP adapter; this workspace has no live Groq key,
so live response quality is not claimed as measured here.

## Appearance

Navy and soft blue is the new default, following the user's preference. More →
Colour palette also offers terracotta and slate independently of light/dark/device
appearance. Navigation, cards, buttons, dialogs, focus rings, food illustration
backgrounds, manifest theme colours and the app icon use the new palette. Palettes
persist in reloads/backups and never modify meals, quantities or goals. The shell
cache and CSS version are v31.

Validation covers real recipe retrieval, follow-up constraints, per-portion zero
fat limits, read-only context, strict diet preservation, known-ID/provider-output
validation, shared limits, safe storage routing, cancelled requests and drafts,
stale recipes, kilogram batch handoffs and reviewed plan actions. Chromium checks
cover actual no-key conversations, a separately labelled provider fixture, privacy
toggles, pantry coverage, reload, 320/390/1440 widths in all palettes/light/dark,
installed offline follow-ups and unchanged plan/stock/diary/spending.
