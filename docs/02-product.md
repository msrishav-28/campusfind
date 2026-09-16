# CampusFind — Kengeri Map Edition
Product brief · mobile-first lost & found for CHRIST (Deemed to be University), Bangalore Kengeri Campus

## Job to be done
A student is walking between Block III and the cafeteria. They either just dropped something or just picked something up. They have 20 seconds and one thumb. The product must finish the report before the next class bell.

## What’s wrong with the current site
The live app (`campusfind-ai-ten.vercel.app`) is a marketing landing page with a modal form.

| Current | Problem on the go |
|---|---|
| Hero + stats + “How it works” first | Nobody reads this while holding a wet umbrella |
| Location = dropdown (Library, Block A/B/C) | Kengeri is Block I–IV, Devadan, Christ Hall — names are wrong |
| No map, no GPS | “Library” is a 2-floor building. Pin is a bench |
| 7 required fields before a photo is even obvious | Friction kills posts. No posts = dead network |
| Login in the header | Reporting a found bottle should not need an account |
| List-only browse | Spatial memory is how students search (“near Block IV cafe”) |

## Product principles
1. **Map is home.** Not a landing page.
2. **Photo + pin + 3 words.** Everything else is optional.
3. **GPS proposes, student confirms.** Snap to nearest named place. Allow drag.
4. **Campus language.** Block I, Block IV library, Devadan Hall — not “Main Block”.
5. **Found is the growth loop.** Make returning something faster than handing it to security and forgetting.
6. **One-hand, standing up.** 44px+ targets. Bottom nav. Camera `capture=environment`.

## Core loop
```
Snap photo → GPS snaps to building → Post pin
        ↓
Owner sees pin on map / “near me”
        ↓
Claim with private detail (sticker, name inside)
        ↓
Meet at the pin. Mark recovered.
```

## Location model (GPS-level, campus-aware)
Store all four, never just a dropdown:

- `lat`, `lng` (from Geolocation API, `enableHighAccuracy`)
- `accuracy_m`
- `place_id` (snapped building / landmark)
- `place_label` + optional `floor` + `note` (“2nd floor corridor, near water cooler”)

Snap rule: nearest of the Kengeri gazetteer within 40 m. If farther, keep raw GPS and show “87 m from Block III”.

Gazetteer v1: Block I–IV, Central Block, Campus Library, both cafeterias, Devadan Hall, Christ Hall, workshop, football grounds, basketball courts, main parking, main gate, chapel, open auditorium.

Accuracy honesty: show `±Xm` on the pin. Do not pretend indoor GPS is room-level. Floor is a chip, not a GPS claim.

## Screens (v1)
1. **Map** — lost = red pins, found = green, you = blue accuracy halo. Filters: All / Lost / Found / Near me.
2. **Report sheet** — Lost | Found, camera, auto place, name, category, private detail.
3. **List** — same data, newest / nearest.
4. **Detail** — photo, place, claim.
5. **Mine** — this device’s posts (until real auth).

Out of v1: marketing stats, long “how it works” above the fold, email/password before first post.

## Trust (keep it light)
- Private detail is never shown on the public pin.
- Claim = type the detail. Reporter accepts.
- After 14 days, pin fades to “unclaimed” and can be handed to campus security desk (Block I).

## Build path
- **Now:** docs in this repo; next is the `/kengeri` PWA.
- **Then:** official campus basemap overlay (from `campus-nav-3d` building graph), floor chips, push on match.
- **Later:** indoor BLE / Wi-Fi RTT only if security and hostel staff will maintain beacons. GPS + snap is enough for 90% of items.

## Success metrics
- Time to first successful post < 30 seconds
- % of posts with coordinates (target 95%)
- % of posts with photo (target 80%)
- Recovery rate within 72 hours
- Found posts per day (leading indicator)

## Non-goals
- City-wide lost & found
- Desktop-first admin chrome on the student surface
- Forcing Google login to view the map
