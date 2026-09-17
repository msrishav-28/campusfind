# 16 — Remaining backlog for engineering

Written 17 Sep 2026 from the product conversation.
Pick from this file. Do not invent a parallel roadmap.

Code snapshot this was checked against: `8dd8da0` (`feat(tenant): institutional onboarding…`). Re-check boxes when you ship.

Related specs: [00-locks](00-locks.md), [03-location](03-location.md), [04-capture-interpret](04-capture-interpret.md), [05-matching](05-matching.md), [08-photos-pwa](08-photos-pwa.md), [09-trust-ops](09-trust-ops.md), [11-models-modal](11-models-modal.md), [13-build-sequence](13-build-sequence.md).

---

## Already in the repo (do not rebuild)

Treat these as done unless a bug says otherwise.

- `app/[campus]` routing, `/kengeri` home
- MapLibre map + bottom nav (Map / List / + / Mine / Help)
- Report sheet: camera + Web Speech + place snap
- `lib/location.ts` 40 m snap / 120 m suggest / fence
- List, item permalink, claim + secret hash, Mine, Desk PIN
- Place + tag match, top 3, campus slug isolation
- Abuse hide at 3 reports, 14-day expire function, seed pins
- Interpret **stub** that returns transcript (correct: post must work if models are down)

---

## P0 — before real students use it

A pin that dies on refresh is not a launch.

### P0.1 Persist to Postgres, not `data/runtime/db.json`

`lib/store.ts` writes a local JSON file. Fine on a laptop. On Vercel the disk is ephemeral or per-instance. Pins will vanish or fork.

- Keep the current store function names.
- Swap the body to Supabase (service role on the server only).
- Anon client must not see `secret_hash`, `poster_session_id`, `poster_user_id`.
- Storage path: `campuses/{slug}/items/{id}.jpg`
- Every query filters `campus_id` / `campusSlug` from the **URL**, never from the body.

Done when: post on phone A, refresh, open permalink on phone B, pin is still there after a new deploy.

### P0.2 Walk Kengeri and lock the gazetteer

`data/kengeri/places.json` coordinates are not door-truth until someone stands there.

- Saturday walk: gate, parking, Block I–IV doors, both cafeterias, library, workshop, Central, Devadan, Christ Hall, football, basketball, chapel, open-air.
- Replace lat/lng. Confirm aliases students actually say (`blk 4`, `lib`).
- Confirm Block I security as desk. Write that on Help.

Done when: standing at Block IV cafe door, snap says Block IV cafeteria.

### P0.3 Photos that actually stick

- Client: `capture="environment"`, longest edge 1600px, JPEG ~0.8, ≤2MB
- Strip EXIF client + server
- Persist `photoPath`, show on pin sheet and list thumb
- OG image on `/kengeri/item/[id]` so WhatsApp shows the photo
- ID cards: banner “Cover the register number.” Do not OCR digits into tags.

Done when: a found bottle photo survives refresh and appears in the WhatsApp preview.

### P0.4 Phone definition of done (Block IV cafeteria)

On a mid-range Android, no account:

1. Map in under 3 seconds
2. Found: photo + spoken sentence + snapped place
3. WhatsApp link opens that pin
4. Second phone claims with private detail
5. Poster accepts from Mine
6. Gemini / interpret down: post still succeeds

If this fails, do not add features.

### P0.5 Freeze public `/onboard`

Self-serve campus signup was **not** a v1 lock. A default “Admin Block / Central Library” gazetteer creates empty wrong maps.

- Keep `campusSlug` isolation (good).
- `/onboard` and `POST /api/campuses/onboard` behind `ADMIN_KEY` or delete from the student nav.
- Second campus = walk + `places.json` + `status=live`. Not a form.

### P0.6 OTP and desk PIN are private

- Do not return the OTP code in a production JSON body.
- Send SMS / email, or print the code only in server logs in `NODE_ENV=development`.
- Desk PIN from env / `campus_members`, not a guessable default `1234` in the client.

### P0.7 Expiry cron actually runs

- Expire route must call `expireItems()`.
- Vercel cron `0 2 * * *` Asia/Kolkata with `CRON_SECRET`.
- Expired pins leave the default map; desk can still receive them.

### P0.8 Honest copy

Footer / Help: student-run Kengeri tool. Not official university records. Not “enterprise multi-tenant infrastructure.” Not “GPS-level room accuracy.”

Blast: photo + sentence + pin. Do not lead with AI.

---

## P1 — v1.1 after the map has real pins

### P1.1 Card writer (mymind)

Photo + transcript → JSON chips: title, category, color, brand, tags, distinctive, place_guess, redact.

- `POST /api/interpret` server-only. Never Gemini from the browser.
- Timeout 4s. On fail, keep transcript as title, category `other`.
- Patch the item only if the user has not already edited.
- v1: Gemini Flash if `GEMINI_API_KEY` is set.
- Move to Qwen2.5-VL-7B 4-bit / Qwen3-VL-4B on Modal L4 only if Gemini quota or policy hurts.

Contract: see [04-capture-interpret.md](04-capture-interpret.md).

### P1.2 Match embeddings (SigLIP 2)

Current rank is place + tag Jaccard + time. Good interim.

- Embed the **photo** (else caption) with `google/siglip2-base-patch16-224` on Modal T4, scale to zero.
- Store one vector. Never embed the private detail.
- Score: `3*same_place + 2*near150m + 1.5*jaccard + 2.5*cosine + 0.5*time_decay`
- UI: max 3, no % badge, never auto-`pending_claim`.

### P1.3 Voice fallback

Web Speech first (`en-IN`). Type box always visible (iOS + canteen noise).
Whisper (Groq or Modal T4) only on explicit retry.

### P1.4 PWA polish

- Manifest, 192/512 icons, theme `#0B3D2E`
- Service worker: **shell only**. Do not cache map tiles long-term.
- Add-to-home after the **second** visit, not first paint.

### P1.5 Analytics

PostHog or Plausible custom events from [12-analytics-metrics.md](12-analytics-metrics.md).

Targets: median found-post < 30s, ≥95% have coords, ≥80% have a photo. Ignore lifetime “items reported.”

---

## P2 — v2 only after Kengeri has volume

Do not start these to avoid P0.

- Notify when a likely match appears (needs OTP identity)
- Real desk role in `campus_members`, not only a shared PIN
- Building footprints / “Open in campus-nav-3d” via `place_id` only
- Door QR → prefilled place
- Second CHRIST campus after a walk (`/central`), still one map on screen
- Optional indoor layer later (`source=beacon|wifi_rtt|qr`) — plug-in, not a rewrite

campus-nav-3d stays a **different app**.

---

## Student contributions (in-product)

Students help with **named truth**, not radio maps.

### In scope

| Action | How |
|---|---|
| Found pin | Already the product. No extra UI. |
| Confirm snap | “That’s right” |
| Wrong place | Pick from ~6 nearby chips |
| Floor + ≤40 char note | Already specified on the report sheet |
| Add a spot | Name + pin + floor → `places.status=pending`. Human approve. Never live-raw. |
| Launch seed | Club plants 15–20 dummy found photos week 1, `is_seed` or description `seed`, delete after |

Rate limit add-spot. Session cookie is enough in v1.

### Out of scope for contributors

Beacon walks, Wi-Fi fingerprints, “calibrate GPS,” 12-field building surveys, unpaid desk duty, self-serve new campuses.

### Code contributors

Useful PRs: photo pipeline, iOS voice fallback, desk UI, tests, gazetteer walk diffs.
Not useful: indoor-positioning engines, chatbot interviewer, points.

---

## GPS / indoor — engineering rule

Phone GNSS is not a room sensor. Open-sky phones are ~3–8 m. Indoors they are tens of metres or a jump to the courtyard. RTK / open GNSS libs need sky + a base. They do not see through Block IV.

Room-level **is** possible with BLE, Wi-Fi RTT, UWB, visual SLAM. Those need campus hardware, calibration, and phones that support them. Not a v1 dependency.

**Ship:** GPS → fence → snap / suggest → drag → floor chip + note. Show `±Xm` from `Geolocation.accuracy`. Never market “GPS room accuracy.”

If infrastructure appears later, add another `source`. Do not block found posts on it.

---

## Models / Modal — order of work

1. Ship with interpret stub (done).
2. Gemini card if key present.
3. SigLIP 2 embed + top 3.
4. Whisper retry.
5. Replace Gemini with Qwen-VL only if needed.

Do not run Llama 4 Scout or 70B VLMs. Do not use VLM hidden states as the matcher.
Do not block a found post on a cold GPU.

---

## Help / blast copy to implement

WhatsApp:

```
Lost something on campus? Pin it on the map instead of the group.

CampusFind — Kengeri
Photo + a sentence + a pin. That's it.

<url>/kengeri
```

In-app:

- GPS denied: “Pick a place. You can still post.”
- Off campus: “You look outside Kengeri. Pick a campus place anyway?”
- Snap: “Looks like Block IV cafeteria · ±14 m” [That’s it] [Change]
- ID: “Cover the number on the card before you post.”
- Model down: no toast required.

Meet copy on claim: Block IV cafe / Block I lobby / gate — public.

---

## Explicitly out of scope (close the PR)

- Chatbot interview
- Native App Store / Play app
- Points, leaderboards
- Beacons as a launch requirement
- 3D map inside this repo
- City-wide or mega-map of all campuses
- Auto-close a claim from a model score
- Google Maps JS bill
- Per-campus Vercel projects
- Client-supplied `campus_id`

---

## Suggested ticket order this week

1. Store interface + Supabase
2. Photo upload + EXIF + OG
3. Walk + commit `places.json`
4. Cron + OTP hardening
5. Hide `/onboard` from students
6. Block IV two-phone demo
7. Then P1.1 interpret

Owner: whoever is holding the phone at cafeteria. That demo is the sprint goal.
