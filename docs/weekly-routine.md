# Weekly shopping and cooking routine

Open **More → Weekly routine**, or **Choose meals & routine** on Today.

1. Choose your shopping day and the time you want to choose meals. Select batch
   cooking, fresh cooking or a mix; batch/mixed routines also have a prep day/time.
   Check the time zone, especially before adding phone reminders.
2. Choose styles for the active breakfast, lunch, dinner and snack slots.
   **Mostly this style** strongly favours suitable matches; **Mix with other meals**
   gives them a smaller preference. **Keep my specific meal choice** preserves
   an existing exact daily choice. A new style replaces only that slot's old daily
   rule. **Planner chooses** clears that slot's daily/style preference.
3. **Save choices & fit my plan** checks a new plan against the existing budget,
   targets, equipment, diet, pantry and kept/cooked meals. **Save routine only**
   leaves the current meals in place until you fit the plan. Failed or cancelled
   fits keep the previous meals; the saved routine remains available.

On the shopping day, Today prompts you to choose meals before shopping. On the
prep day, it offers the saved plan's prep centre. Soft preferences allow other
recipes when needed for the hard checks, and Plan's check details show actual
matching counts. They do not guarantee every meal can be a burrito, for example.
The existing **Prefer fresh recipes each week** control still uses archived plans
to rotate suitable meals. A routine does not replace meals automatically each week.

## Phone alerts

Choose **Add weekly calendar reminders**, then add the downloaded `.ics` events
to a calendar that sends alerts on your phone. Check the event times and alerts
there. Downloading the file alone does not enable notifications. The file includes
a weekly shopping/meal-choice event and, for batch/mixed cooking, a prep event.
They repeat for 52 weeks at local times, including daylight-saving changes.

On iPhone, open the calendar file in an app that supports adding calendar events.
Google Calendar supports importing `.ics` on a computer; events then sync to the
phone's selected calendar. Phone/calendar notification settings control delivery.
Delivery to a physical phone has not been independently verified by the app.

Changing or disabling an app routine cannot edit events already imported into
your calendar. Remove the old events before adding replacements, and renew them
after the year ends. Event identifiers are stable to help calendars identify the
same routine, but import/update behaviour varies between calendar apps.

This release uses calendar alerts. It does not register native web-push
subscriptions or add a paid background service. The current free web service can
sleep and has no reliable always-running reminder scheduler. Calendar events can
alert while Meal Planner is closed without relying on that service staying awake.

## Kitchen assistant

The assistant also understands requests such as:

> I shop on Saturday at 9am and meal prep Sunday at 10am. Mostly burritos for lunch
> and curry for dinner.

This saves the routine and meal preferences. Add “Make a plan for 7 days, under
1600 calories, 150g protein and £45 weekly budget” to fit the plan in the same
conversation. Explicit numbers are preserved and checked by the normal planner;
soft styles do not become exclusive recipe restrictions. Other daily meal choices
and kept/cooked meals remain protected. Phone reminders still require the
one-time calendar setup.

## Data and implementation

The routine, preferences and calendar download fingerprint live in the existing
device state and backups. The fingerprint records a download, not confirmed
calendar installation or alert permission. Calendar descriptions contain only meal
styles and an app link; diary, macro targets and pantry contents are omitted.
Preference/category data is sent with a plan request, alongside the normal
planning settings. Calendar generation and routine parsing run on the device.

`weekly-routine-core.js` handles dated prompts, natural-language routine choices,
time zones and RFC 5545 exports. `weekly-routine-ui.js` handles saving and calendar
downloads. `meal-preferences-core.js` supplies shared style matching and ranking.
Preferences also keep matching candidates in the bounded recipe selection.
