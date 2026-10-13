# Everyday shortcuts

## Pantry search and stock corrections

The Pantry screen has a search field for ingredients and purchased-pack names,
storage-location filters, and filters for recorded dates or empty items. It shows
40 matching items at a time, with more available on demand. Search is insensitive
to accents, including Polish ł. Filters only change the view; the recorded stock
and purchase history remain intact. Date filters use the planner's London calendar
and treat invalid dates as needing attention. Dates come from the user's records,
not inferred shelf lives.

**Update stock** edits the remaining quantity in its existing unit, storage place
and optional recorded expiry, with a reason such as usage outside the plan or a
stock correction. Quantity zero is valid. Moving storage does not extend the
expiry. Ingredient identity, units, source pack details and the amount paid stay
unchanged. Other purchases, cooking and food consumed still use their existing
separate confirmation flows.

Adjustments and removal of pantry items or cooked leftovers are recorded in
**Recent stock activity** with Undo. Removal keeps a snapshot and original row
position for restoration. Undo remains available only if the affected records
match the saved result; subsequent changes must be undone first. Original
purchase expenses remain counted when stock is adjusted or removed. Undoing a
purchase itself is still a distinct existing action. Editing checks the original
stock snapshot again before saving, and closed editors cannot apply stale data.

## Faster diary entry

**Log a recent food again** appears in the Food diary and its logging form. Up to
six recent distinct food definitions are shown as shortcuts; recent foods also
appear in the searchable selector. Each shortcut opens a review with the last
eaten amount, existing unit and the recorded food's nutrition snapshot. It does
not use a subsequently edited recipe or label. Different nutrient versions remain
distinct; identical food definitions use their latest recorded quantity.

Users choose the amount and date before adding a new entry. Planned-meal origin
references are not copied to this separate intake entry. Unknown macros remain
unknown and source/provenance stay with the recorded values. The UI asks users to
check current labels when they have changed. No stock is consumed automatically.

The diary has previous-day, Today and next-day controls alongside the date picker.
Navigation crosses month/leap-year/daylight-saving boundaries as calendar days,
without creating entries. Switching between food selection and manual label entry
retains the selected date.

## Kitchen assistant on phones

After interpretation, the assistant focuses and scrolls to its editable prep
details, making the result visible without returning to the question. Scrolling
respects reduced-motion settings. The existing explanation of what is sent for
AI interpretation is available in a compact details section. Recipe matching,
weight validation, safe storage guidance and explicit save/cook actions are
unchanged.

All improvements use existing on-device storage and work in the installed offline
app. No new dependencies, services, permissions or environment variables are
required. Stock history and food snapshots remain part of app backups. The shell
cache and stylesheet version are v30.

Validation covers expense preservation, recipe/stock identity, zero quantities,
invalid and stale edits, removal and exact restoration, blocked out-of-order Undo,
London date filters, historical food snapshots, missing macros, deliberate repeated
intake entries and calendar boundaries. Real Chromium checks cover search,
pagination, editing/Undo, reviewed food amounts/dates, reload, assistant focus,
320/390/1440 widths in both themes, and installed offline use.
