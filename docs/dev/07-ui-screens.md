# UI screens

Mobile first. One thumb. 44px minimum targets. Bottom nav.

Nav: **Map · List · + · Mine · Help**

Safe areas: account for iOS home indicator. `+` opens the report sheet over the map.

## Map (`/kengeri`)

- Full-bleed MapLibre, campus padded to fence.
- Lost = red pin. Found = green pin. Device = blue halo sized to accuracy_m.
- Filters as chips on top: All / Lost / Found / Near me.
- Tapping a pin opens a 40% sheet: photo, title, place ±m, “View”.
- No hero, no stats, no “How it works” above the map.

Tiles: OSM standard or a light style. Overlay our place labels if tiles are wrong.

## Report sheet (`+` or `/kengeri/report`)

See [04-capture-interpret.md](04-capture-interpret.md).
Sheet, not a new marketing page. Can dismiss with a swipe.

## List (`/kengeri/list`)

Same filters. Sort: newest default, nearest if GPS on.
Row: 72px thumb, title, place, time ago, type chip.

## Item (`/kengeri/item/[id]`)

Share target. Photo, title, tags, place ±m, floor, note, created time.
Matches block (max 3).
Claim CTA if type found and viewer is not poster.
Poster sees pending claims.
Report link in overflow.

## Mine (`/kengeri/me`)

This session’s posts. After OTP, merge by user_id.
Status chips. Accept/reject claims.

## Desk (`/kengeri/desk`)

PIN or member role. List expired + desk items. Receive / returned.

## Help (`/kengeri` overflow or `/about`)

Short: how snap works, how claim works, “student-run, not official records,” campus switch later.
No multi-page marketing site.

## Copy rules

- “Pin it” not “Submit listing.”
- “±14 m” not “high accuracy GPS.”
- Blast and in-app: photo + voice + pin. Not “AI-powered.”
