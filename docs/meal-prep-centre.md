# Prep centre and recorded-date reminders

The Plan tab has a **Prep centre** with a selectable first plan day and a
one-to-fourteen-day window. It groups repeated recipes and sums household
portions across that window. Existing cooked portions and matching leftovers
are allocated once across the whole plan before a window is selected. This
prevents a later session from claiming the same leftovers again.

Each recipe shows scaled ingredient quantities, full-batch rounding, the plan
slots it will cover and the original recipe timing. Chilling/freezing/slow-cooking
recipes appear earlier; smoothie bowls are marked for fresh preparation. This
is a prep order, not a guaranteed finish-time scheduler. Recipe timings are
estimates and can change with batch size, appliance capacity and food size.
Missing quantities, methods and equipment stay visible for review.

**Cooking mode** uses the session's remaining portions rather than the household
default. Smoothie bowls use the first uncovered meal's portions because they
should be made fresh. Full-batch recipes preserve their entire ingredient batch.
Opening cooking mode does not consume stock or log intake.

**Record prepared batch** opens the existing cooking confirmation for the first
uncovered slot. Its uncovered portions are kept separate from already reserved
leftovers; all other portions in the session are prefilled as extras. The user
reviews storage, an optional expiry and missing stock before confirmation.
Confirmation deducts raw ingredients once, records only that first slot's
prepared portions, and saves extras as matching leftovers for later meals.
The existing **Use leftovers** and Undo controls remain in charge of serving
and restoring stock. More than 100 extra portions requires a smaller session.
Smoothie bowls are recorded individually through the plan.

The read-only session is recomputed before actions. A changed plan, recipe,
stock or session scope requires reopening the session; the cooking confirmation
also retains its existing revision protection. Incomplete or incompatible
recipes cannot bypass normal recipe readiness and appliance checks.

**Ingredients organised** is a preparation checklist, independent of the
cooking ledger. Its saved signature includes the plan, recipe, methods,
equipment, slots and quantities. Changes invalidate an earlier checkmark.
**Save checklist** downloads a text file with days, portions, timings and
measured ingredients. The combined ingredient list is labelled partial when
quantities are missing; it is a preparation list rather than a purchase quote.

Recipe details add portion shortcuts for one portion, the household, the
original recipe batch and three days of household portions. The three-day
shortcut is limited to browsing; it is omitted when editing a planned slot.
Shortcuts update the existing ingredient/nutrition preview and do not
automatically change plans, shopping, pantry or diary entries.

Home and Pantry show **Use soon & check dates**. The card highlights positive
stock with dates passed, invalid dates, dates due within three days, and cooked
leftovers without a date. It uses the Europe/London calendar, validates real
ISO dates and does not infer a shelf life or claim food is safe. Undated pantry
items are not all promoted as urgent. **Review dates** uses the existing expiry
validation and saves changes without creating purchases or intake records.
Expired or invalid stock remains excluded under the existing pantry rules.

Session scope and checklist choices use the existing local `prepPlan` state.
Backups preserve them automatically. The older prep checklist data remains
intact. There is no account, server reminder, background notification or
automatic consumption record.
