# Meal Planner on iPhone

This is a SwiftUI iPhone shell (iOS 17+) around the existing Meal Planner. It uses
persistent on-device WebKit storage and an HTTPS connection to the existing
Render backend. No password or server API key is compiled into the app. Recipe
and supermarket links open outside the trusted app origin. Camera permission is
requested only for a user-initiated scan or recording. Backup, calendar and CSV
exports use the iOS share sheet; printing uses the iOS print dialog.

The app still needs Render for planning, prices and AI. It is **not** a new
fully on-device planner. WebKit camera, video selection, offline caching and
real-device installation need physical iPhone checks; simulator tests establish
compilation and basic shell behavior only.

## 1. Move existing data before switching

Safari and the iPhone app have separate storage. On the current website, open
**More → Back up my kitchen → Download backup**, save the JSON to Files, and keep it.
After installing, sign in and open **More → Settings → Data & app details → Import backup**. Check your
plan, pantry, food diary, receipt prices and recipes before removing anything.
Do not delete the existing installation or clear Safari data before checking.

## 2. Enable private access in Render

After saving the backup, open the existing `meal-planner` service in Render →
Environment. Add `PRIVATE_APP_PASSWORD` with a unique password of 16–256
characters, using Render's secure form. Save/redeploy. The startup log confirms `Private app access enabled.` once active. **Do not put the password
in GitHub, this file, a build artifact or chat.** The initial code release does
not set a password or lock out existing users automatically.

With the variable set, unauthenticated visitors cannot open the planner, its
assets, recipe library or API. `/health` returns minimal readiness only. Signed
sessions use a Secure, HttpOnly, SameSite=Strict host cookie, expire after 30 days,
and become invalid when the password changes. Guesses are rate-limited. Sign out
from the native Kitchen controls menu to delete the phone's session cookie.
The same private sign-in works in Safari when you need to recover a backup.

Private access is **not** a network firewall: the login endpoint remains reachable
on the internet. It protects service access, not source-code confidentiality;
this repository and recipe sources remain public. Previously cached app files
and your own on-device records can remain available offline. Use the iPhone lock
for device privacy. Changing the password revokes server access, not local files
already saved by a person you previously gave access to. Share the password only
with people you intend to invite. Removing the environment variable restores
public access.

## 3. Free personal installation from Windows

This matches AppealMax's checked-in Sideloadly route. It is **not TestFlight**.

1. Open [iPhone Build](https://github.com/kpulawski2/meal-planner/actions/workflows/ios-build.yml)
   and choose the latest successful run for `main`.
2. Download **MealPlanner-iPhone-unsigned** under Artifacts. Extract the ZIP to
   obtain **MealPlanner.ipa**. Do not rename the artifact ZIP to IPA.
3. Install Sideloadly from <https://sideloadly.io/> and follow its official Windows
   prerequisites. Connect the unlocked iPhone by USB and trust the computer.
4. Select the phone in Sideloadly, choose the IPA and sign using your Apple
   Account in Sideloadly's own flow. Never share Apple credentials in chat.
5. Follow iOS's developer-trust/Developer Mode prompts if requested, then open
   Meal Planner and enter the private-app password.

Free signing normally needs renewal after seven days and has Apple account/app
limits. Follow Sideloadly's current supported refresh requirements. Keep the same
account, signing options and bundle identifier (`com.kpulawski2.MealPlanner`)
for updates. Install over the existing app rather than deleting it; keep a backup.
An unsigned IPA cannot be installed by tapping it in Safari or Files. A GitHub
push does not install an update on the phone. Artifacts expire after 14 days;
use Run workflow on `main` to make a new build when needed.

## TestFlight later

TestFlight needs an active paid Apple Developer Program membership, an App Store
Connect record for this bundle identifier and Apple distribution signing. No
TestFlight upload or membership purchase happens in this change. Do not treat the
unsigned CI artifact as a TestFlight-ready signed build.

On a Mac with Xcode and membership: `brew install xcodegen`, `cd ios`,
`xcodegen generate`, open `MealPlanner.xcodeproj`, select your developer team,
archive the Release scheme for a physical iOS destination, then validate and
upload using Xcode Organizer/App Store Connect. Complete Apple's beta review and
invite testers; an app that mainly hosts a website can face review requirements,
so approval is not promised. TestFlight builds also expire and need maintenance.

## Device acceptance checks

- Sign in; quit/reopen and verify session and saved plan persist.
- Restore Safari's backup and compare meals, portions, pantry and diary.
- Change day in Today and Plan; check both stay in sync.
- Export a new backup to Files and restore it without changing amounts.
- Scan a barcode after allowing Camera; test denial and re-enabling in Settings.
- Select a recipe video from Files/Photos and test an external recipe link.
- Export CSV/calendar and print a shopping list.
- Test offline after a signed-in load and reconnect; do not assume first launch
  works offline.
- Sign out; confirm API calls require login again. Verify anonymous Safari
  access to `/`, `/recipe-library.json` and `/api/catalog/stores` is blocked.
