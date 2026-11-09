Today and the food diary
=======================

Today is a day overview: every planned meal, with recipe/cooking actions and an
explicit way to record eating it. Simple and Full views use the same meal list.
Prepared meals remain visible. A diary entry can have a different amount or food
from the plan; its saved snapshot is shown separately and can be edited or removed.
Logging food never resizes the plan or deducts pantry stock.

Both screens render the same recorded-intake component from the same dated diary
summary and diary goals. This includes custom goals, extra snacks and missing
macro values. Planned totals are labelled and collapsed below the meals. Cooking
or planning food does not count as eating it.

The diary's selected date is also the day-overview date. Selecting a dated day in
Plan sets both screens to that date; selecting a diary date updates the overview
and the corresponding plan day when present. The date is visible, with a Today
shortcut. A chosen date survives reload on the same day; the UK calendar date
refreshes all three views after midnight or when the app resumes. Legacy undated
plans use their existing current-week interpretation without renaming stock keys.

An unplanned date shows no planned meals instead of clamping to another date.
Upcoming/finished plan notices are explicit; upcoming meals can be opened by
choice. Date-only changes are saved before changing the displayed data, and a
failed save restores the current date. New food records and diary copies save
their view-date preference in the same storage write as the recorded food.

`daily-overview-core.js` contains date mapping and the read-only meal/diary model.
`NutritionDiaryUI.summaryHtml` is shared by both screens. Browser coverage checks
2/1/1 portions, partial intake, custom goals, snacks, edits/removal, cooked meals,
matching dates, empty/future days, reload, save failure, midnight rollover and
phone layouts. Service-worker shell v62 caches the new module; no native rebuild
or account/configuration change is required.
