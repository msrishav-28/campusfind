# CampusFind — Product & Build Plan
Version 1.1 · 16 September 2026  
Supersedes: CampusFind Kengeri V1 Plan (same day)  
Campus pilot: CHRIST (Deemed to be University), Bangalore Kengeri  
Surface: mobile-first PWA

---

## 0. One sentence

A campus map you pin in twenty seconds by snapping a photo and talking. GPS names the place. A free vision model files the card. When the other side exists, the same models propose a match. A person still proves ownership.

---

## 1. Why this exists

WhatsApp buries posts. The current CampusFind site is a brochure with a long form and the wrong Kengeri names. Found items are too slow to report, so nothing accumulates.

We are not building a form with AI sprinkled on it. We are building a **shared spatial memory**: photo + voice + pin.

Inspiration for capture: **mymind** — save first, it files itself, search later by anything you remember (colour, object, brand, place). Fields live in the database. They are not the UI.

---

## 2. Locked decisions

| Decision | Lock |
|---|---|
| Pilot campus | Kengeri only in the UI |
| Tenancy | `campus_id` on every campus-scoped row; org layer later |
| Home | Live map |
| Capture | Photo + hold-to-talk. Chips to correct. No 7-field form |
| Auth to view / post found | Device session |
| Auth to claim | Phone OTP or campus email |
| Location | GPS → fence → snap → drag → floor chip + note |
| Indoor | Floor + five words. Not room-level GPS |
| Matching | Retrieve 3, human confirms. Never auto-close |
| Models | Free: Web Speech + Gemini Flash + embeddings |
| Unclaimed | 14 days → Block I desk |
| 3D nav | Separate app; share `place_id` |
| Distribution | WhatsApp link + PWA |

---

## 3. Principles

1. Map is home.
2. Found is easier than lost.
3. Dump a photo and a sentence. The model writes the card.
4. GPS proposes. The student confirms.
5. Speak campus language.
6. One thumb, standing up.
7. Accuracy is shown, never faked.
8. Dead pins are worse than few pins.
9. Models suggest. People claim.
10. One codebase, many campuses. One map on screen.

---

## 4. Users and jobs

**Found** — scarce, 15–20 seconds. Snap, talk, go.  
**Lost** — anxious, will search or talk a last-seen pin.  
**Desk** — receives expired items. Light list in v1, real workflow in v2.

Jobs:

1. I picked this up. Park it on the map without typing.
2. I dropped something near Block III. See if anyone pinned it — or describe it out loud.
3. This looks like mine. Prove it without exposing my number.
4. Nobody claimed this. Hand it to a desk.
5. Share this pin into WhatsApp.

---

## 5. Version map

### V1 — make the pin real
Map, gazetteer, GPS snap, photo, **voice capture (Web Speech)**, session, share link, claim with private detail, 14-day expiry, abuse report, thin desk list.  
Model tags are **optional**: if Gemini is configured, fill the card; if it 429s, post raw transcript + photo anyway. Never block a found post on a cold API.

### V1.1 — file itself + retrieve
Gemini Flash vision tags on every upload. Embed caption+tags. “3 possible matches” on the pin. Whisper fallback when canteen noise kills Web Speech.

### V2 — only after v1 has volume
Push/notify on match. Desk as a real role. Better footprints, floor, Navigate into `campus-nav-3d`. Door QR. Second CHRIST campus (`/central`). Hygiene (ID blur, retention).

### Not this product
Chatbot interview, native apps, points, city-wide L&F, self-serve tenant signup, auto-approved claims, BLE beacons, 3D inside the L&F UI.

---

## 6. Capture (mymind-style)

Report sheet is one surface:

1. Lost | Found (two big cards).
2. Camera. Environment capture.
3. Hold-to-talk. Live transcript.
4. Model (or heuristics) paints a **card**: title, category, colour, brand, tags, distinctive, place guess.
5. Student fixes by talking again (“no, it’s blue”) or tapping a chip.
6. Location card: “Block IV cafeteria · ±14 m.” Confirm / drag / pick place.
7. Floor chip if the place has floors. Optional 40-char note.
8. Optional private detail — still typed or spoken (“sticker of a cat on the back”).
9. **Post on map.**

Required to post: title (can come from the model) + (coordinates or place).

Search is the same language: type or talk “black jbl near library.”

---

## 7. Voice and vision pipeline

```
mic  → Web Speech API (free, on device)
       └ on failure → Groq Whisper (free tier)

photo → Gemini Flash / Flash-Lite (AI Studio free)
       → JSON card
       → embed(caption + tags)
       → store on item

ID-looking photo → category=id_card, redact flag, do not OCR register number
EXIF stripped on the phone before upload
```

Interpret route: `POST /api/interpret` `{photo, transcript, campus_id, lat, lng}`  
Returns JSON only. Campus place list is in the prompt so “library” becomes `library` not a city library.

If the model is down: save transcript as title/description, category Other, post succeeds.

Quota honesty: Gemini free tier is enough for one campus (tens of posts/day). A national app is not. Queue retries. Do not make interpret synchronous-blocking.

---

## 8. Matching

Hard filters: opposite type, same campus, status open, last 14 days.

Then rank:

- same `place_id` or haversine < 150 m
- tag overlap
- embedding cosine
- time proximity (weak)

Show top 3. Poster and owner still use private detail to claim.

Private detail is never embedded, never sent to the model, never shown on the pin.

---

## 9. Location

Stack: raw GPS + accuracy → campus fence → nearest gazetteer → human confirm → floor + note.

Write the **exact lat/lng**. Label with the place name.  
Snap < 40 m, suggest 40–120 m, else “unnamed spot on campus.”  
Off campus (> ~700 m from centroid): banner, still allow picking a place.

Kengeri centroid: Plus Code VC7Q+75 ≈ 12.86285, 77.43812.

Gazetteer v1: Main gate, parking, Block I–IV, Central Block, Campus Library, Block I cafe, Block IV cafe, workshop, Devadan Hall, Christ Hall, football, basketball, chapel, open auditorium.

Walk the campus and lock coordinates at each door. Aliases on every place (`blk 4`, `lib`, `boys hostel`).

---

## 10. Multi-tenant

Campus is the tenant, not the user and not “CHRIST.”

```
organizations     (later)
  campuses        kengeri | central | bgr
    places
    items / claims / reports / desk
```

- URL: `/kengeri`, `/kengeri/item/abc`. `/` redirects to last campus or kengeri.
- RLS: `campus_id` from middleware, never from the client body.
- Users are global; `campus_members` assigns role per campus.
- No mega-map of all campuses.
- Second campus = walk + GeoJSON + `status=live`. Same code.
- Second university = org branding + legal. That is after v2.

Storage: `campuses/{campus_id}/items/{id}.jpg`

---

## 11. Information architecture

```
/kengeri                  Map
/kengeri/list
/kengeri/item/[id]        Share target
/kengeri/me
/kengeri/report
/kengeri/desk
/about
```

Nav: Map · List · + · Mine · Help

---

## 12. Trust

No public phone or register number.  
Strip EXIF.  
ID: cover the number; model must not index the number.  
Private detail hashed.  
Meet at public spots only.  
Abuse report + hide threshold.  
Photos frozen 90 days after close.  
Student-run framing until a MoU.  
Free Gemini tier may train on prompts — never send readable ID faces if we can avoid it.

---

## 13. Data model (additive)

`organizations`  
`campuses (org_id, slug, centroid, fence_m, status)`  
`places (campus_id, slug, name, kind, aliases[], lat, lng, floors[], parent_id, geojson)`  
`users`, `device_sessions`, `campus_members`  
`items`: type, status, title, category, tags[], caption,  
photo, lat/lng/accuracy, place_id, floor, note, source,  
embedding vector, secret_hash, poster ids, expires_at, share_code  
`claims`, `reports`

---

## 14. Stack

| Layer | Choice |
|---|---|
| App | Next.js App Router + TypeScript |
| UI | Tailwind + Lucide |
| Map | MapLibre GL (Leaflet fallback) + GeoJSON |
| Data | Supabase Postgres + RLS |
| Files | Supabase Storage |
| Auth | Anon session → OTP |
| Voice | Web Speech; Groq Whisper fallback |
| Vision / JSON card | Gemini Flash (AI Studio free) |
| Embeddings | Gemini embed or Cloudflare bge-base |
| Host | Vercel + daily cron for expiry |
| Analytics | PostHog: post time, GPS grant, voice used, model used, match tap |

No custom Python service. No Three.js in this repo. No Google Maps bill.

---

## 15. Metrics

V1: median found-post < 30s; ≥95% coords; ≥80% photo; found posts/weekday 8–15; open pins 20–60; voice used on ≥50% of found posts once shipped.

V1.1: % posts with model tags; match-list impressions; claims that started from a match card.

Ignore lifetime “items reported” and public accuracy badges.

---

## 16. Rollout

A. Walk Kengeri, lock gazetteer, seed 15–20 pins.  
B. Engineering + hostels only. Watch voice fail rate and GPS deny.  
C. All Kengeri WhatsApp groups. Share link is the unit of spread.  
D. Desk QR if security agrees.  
E. Second campus only after Kengeri is alive.

Blast copy: pin + photo + voice, not “AI-powered.”

---

## 17. Build sequence

**Week 0** Walk. `data/kengeri/places.geojson`. Security copy.  
**Week 1** Next.js PWA, map, snap, report sheet with photo + Web Speech, seed items, campus path `/kengeri`.  
**Week 2** Supabase, photos, EXIF strip, session, permalinks, `campus_id` RLS.  
**Week 3** Claims, expiry cron, share card, abuse. Optional `/api/interpret` if key present.  
**Week 4** Desk list, rate limits, analytics, Phase B.

**Then v1.1** Gemini tags + embeddings + match list + Whisper fallback.  
**Then v2** notify, desk workflow, footprints/nav link, door QR, `/central`.

---

## 18. Definition of done (v1)

On mid-range Android at Block IV cafeteria:

1. Map visible in under 3 seconds.
2. Found post with photo + spoken sentence + snapped place, no account.
3. WhatsApp link opens that pin.
4. Second student claims with private detail.
5. Pin leaves open after 14 days.
6. If Gemini is unset or down, the post still succeeds.

---

## 19. Risks

| Risk | Mitigation |
|---|---|
| Empty map | Walk-seed; one-school launch |
| Model 429 / outage | Post without tags |
| Web Speech fails in canteen | Show transcript, allow type, later Whisper |
| Wrong place names | Walk + aliases |
| Fake claims | Private detail + accept |
| ID photos | Redact flag, no OCR of numbers |
| Cross-campus leak | RLS, campus in URL, ignore client campus_id |
| Scope into 3D / chatbot | Written non-goal |

---

## 20. Next action

App Router. First route `/kengeri`. Gazetteer in `data/kengeri/`. Map + photo + hold-to-talk sheet against seed data. Then Supabase. Then interpret route.
