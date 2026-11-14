Current and next-week plans
===========================

Plan → Plan next week prepares a future week without archiving the current one.
Repeat week copies every day's recipe IDs and exact household portions, including
personal cereal recipes and extras. The copy is saved as next week and can be
edited. Choose new meals opens a separate next-week setup instead. An existing
next week opens for editing and is never silently overwritten.

This week / Next week controls in Plan and Shopping select the displayed plan.
Meals, goals, budget, supermarket, portions, locks, shopping checks, drafts, prep
checks, cooked slots and plan IDs travel together. Pantry, leftovers, diary,
recipes, prices and stock transaction history stay shared. Saved food exclusions
and equipment preferences carry between plans. Copying checks current recipe
readiness and food/equipment preferences before committing.

Today, Diary and Pantry navigation return to the current plan. Reopening the app
also shows the current plan; next-week edits and checks remain saved. On the next
plan's start date, a saved nonempty next week becomes current automatically during
startup, navigation or the existing midnight/resume refresh. The previous plan
is archived once. Advance purchases, checked items and next-week preparation are
retained. An unfinished empty next-week draft does not replace the current plan.

Future shopping and planner inputs reserve pantry ingredients needed by uncooked
current meals. Soon-expiring stock is reserved first, and anything expiring before
the next plan starts is excluded from future availability. Prepared leftovers are
not assumed to cover both weeks. These are planning estimates; real pantry stock
is never deducted by copying or switching. Cooking and reviewed purchases retain
the existing measured stock transactions and undo checks.

`plan-workspace-core.js` snapshots only plan-specific fields and the ledger's plan
ID/cooked map. Global transaction history and sequence IDs are never swapped or
reset. UI transitions write local storage before replacing live state, invalidate
old quote/planner requests and preserve the previous view on failure. Both weeks
are included in the existing full-state backup. No new service or native rebuild
is needed. Service-worker shell v64 includes both workspace modules.
