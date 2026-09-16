# Locks — do not reopen in a PR

If you need to change one of these, write it in the PR description and get a product yes first.

| Lock | Value |
|---|---|
| Pilot UI | Kengeri only. One map on screen. |
| Tenant | `campus_id` on every campus-scoped row. Org layer later. |
| Home | Live map. Not a landing page. |
| Capture | Photo + hold-to-talk. Chips to correct. No 7-field form. |
| Auth view / found post | Device session. No login. |
| Auth claim / notify | Phone OTP or campus email. |
| Location | GPS → fence → snap → drag → floor chip + note. |
| Indoor | Floor + ≤40 char note. Not room-level GPS. |
| Matching | Retrieve 3. Human confirms. Never auto-close. Never show a % badge. |
| Private detail | Hashed. Never on the pin. Never sent to a model. Never embedded. |
| Unclaimed | 14 days → expired → Block I desk. |
| 3D nav | Separate app. Share `place_id` only. |
| Distribution | WhatsApp permalink + PWA. |
| Models | Card may use Gemini. Match uses SigLIP 2 when ready. Found post must succeed if every model is down. |
| Maps vendor | MapLibre + OSM. No Google Maps JS bill. |
| Scope | Not city-wide. Not self-serve tenants. Not a chatbot interview. Not native apps in v1. Not points. Not beacons. |

## Accuracy honesty

Show `±Xm` from `Geolocation.accuracy`. Never print “GPS-level room accuracy.” Indoor GPS is a building + floor chip.

## Found is easier than lost

Found: 15–20 seconds, no account.
Lost: may search first; posting lost can wait for a session if you must, but prefer the same sheet.
