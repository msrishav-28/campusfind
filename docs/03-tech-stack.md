# Tech stack

Chosen so one person can ship a map-first PWA on Vercel without waiting on 3D nav or a custom backend.

## V1 application

| Layer | Choice | Role |
|---|---|---|
| App | Next.js (App Router) + TypeScript | Routes, PWA shell, API, SSR for `/kengeri/item/[id]` |
| UI | Tailwind CSS + Lucide | Sheets, chips, 44px targets |
| Map | MapLibre GL JS + our GeoJSON | OSM/standard tiles; campus footprints and pins |
| Fallback map | Leaflet | If WebGL is flaky on old campus Androids |
| Data | Supabase Postgres | places, items, claims, sessions |
| Files | Supabase Storage | Photos; strip EXIF on upload |
| Auth | Anonymous cookie → phone OTP | See/post found with no login |
| Host | Vercel + Supabase | |
| Analytics | PostHog or Plausible | Post time, GPS grant, voice used, match tap |
| PWA | Manifest + SW for shell only | Tiles stay network-first |

## V1.1 / optional AI

| Layer | Choice |
|---|---|
| Voice (default) | Web Speech API on the phone |
| Voice fallback | Groq Whisper or faster-whisper on Modal T4 |
| Card / JSON tags | Gemini Flash (AI Studio free) first |
| Card if self-hosted | Qwen2.5-VL-7B or Qwen3-VL-4B on Modal L4 |
| Match embeddings | SigLIP 2 on Modal T4 |

See [07-open-source-models-modal.md](07-open-source-models-modal.md).

## Rejected for v1

Vite-only SPA (weak share URLs), Firebase, Mongo, Google Maps JS bill, Three.js / campus-nav-3d in this repo, NextAuth Google-only, a Python matching microservice, Prisma *and* Drizzle (pick one).

## Runtime

```
Phone
  → Next.js on Vercel
       /kengeri          map + sheet
       /kengeri/item/id  share target
       /api/*            session, create, claim
  → Supabase
       Postgres + RLS
       Storage
  → Modal (v1.1, optional)
       /embed     SigLIP 2
       /interpret Qwen-VL or skipped if Gemini
       /transcribe Whisper
```

Client never holds the service role key. Create-item is not blocked on a cold GPU.

## Env

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE
NEXT_PUBLIC_CAMPUS=kengeri
GEMINI_API_KEY          # optional
MODAL_EMBED_URL         # optional
```

Expiry: Vercel cron daily, `open` → `expired` at 14 days.
