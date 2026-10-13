# Clearer everyday screens

Today now starts with planned nutrition and meals. A saved plan does not show
the large plan-creation banner. The planned-day selector supports both weeks;
changing the displayed day does not change any meals or targets.

Meal cards show **View recipe** and **Log eaten**. **Meal options** opens Keep,
Swap, household portions, ingredient cost and the existing cooking/leftover
reviews. Kept and cooked/served status remains visible on the card. Recording
cooking and logging intake remain separate actions with their existing reviews.

The food diary starts with calories logged today. **View diary & change date**
opens date controls, logged entries and recent-food shortcuts. Kitchen chat is a
compact shortcut; active cooking progress/timers and use-soon food remain visible.
Budget and plan checks stay available in an expandable section.

Plan keeps **Tailor my plan** prominent. **Plan options** groups budget fitting,
plan explanations and weekly check-ins. Meal-prep tools and saved routines are
in their own expandable section. One-day/all-day views remain available.

Recipes use search, a collection selector and a scrollable category row.
**Filters & sort** groups protein, equipment, time, style, suitability and sorting.
Its summary shows the active count even when closed; Reset filters clears those
filters and returns sorting to Recommended. Add recipe groups Create and Import.
Small screens use a readable single-column recipe list with compact illustrations.
Source credits, incomplete nutrition and appliance/batch requirements are retained.

More groups My kitchen and Kitchen tools into simple rows. Appearance and backups
expand on demand. Settings groups food/cooking preferences and equipment; first
setup still opens food preferences. Open sections remain open through normal
rerenders within the current session, including equipment changes and diary date
navigation. These view states are kept in memory and do not modify backups,
food data or planning constraints. Reload starts these sections closed again.

The navy and soft-blue default and all light/dark palettes are retained.
Service-worker/CSS version is v32. No dependencies, AI requests or environment
configuration changed.

Validation uses the existing Node/Python suites and real Chromium at 320, 390
and 1440 pixels in light/dark modes. Browser checks cover both weeks, reviewed
meal actions, diary navigation, disclosure retention, recipe collection/search/
filters/sorting/reset, appearance/equipment changes, keyboard focus, protected
plan/stock/intake/spending, and installed offline access.
