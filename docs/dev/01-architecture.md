# Architecture

## Runtime

```
Phone (Chrome / Android / iOS Safari)
  → Next.js App Router on Vercel
       /kengeri                 map home
       /kengeri/list
       /kengeri/item/[id]       WhatsApp share target (SSR or OG)
       /kengeri/me
       /kengeri/report          same sheet as bottom-sheet +
       /kengeri/desk
       /about
       /api/*                   session, items, claims, interpret proxy
  → Supabase
       Postgres + RLS
       Storage  campuses/{campus_id}/items/{id}.jpg
  → Optional
       Gemini Flash            /api/interpret
       Modal T4                /embed SigLIP 2
       Modal L4                Qwen-VL if Gemini is dropped
       Groq or Modal           Whisper fallback
```

Client holds the Supabase **anon** key only. Service role stays on the server. Never trust `campus_id` from the request body.

## Why this split

- Vercel for the PWA and share URLs.
- Supabase so we do not write auth, storage, or Postgres ourselves.
- Modal only when we need an embedding GPU. Scale to zero.
- Interpret is **async after the pin is live**. Cold start must not block a found post.

## Packages (intended)

- `next` App Router, TypeScript
- `tailwindcss`, `lucide-react`
- `maplibre-gl` (Leaflet fallback if WebGL dies on old Androids)
- `@supabase/supabase-js`, `@supabase/ssr`
- `zod` on every API body
- `exifr` or equivalent to strip GPS from photos on the server as a second pass
- client compress before upload (target longest edge 1600px, ≤2MB JPEG)
- `web-speech` via `window.SpeechRecognition` / `webkitSpeechRecognition`

Pick **one** of Drizzle or Prisma. Do not add both.

## Rejected

Vite-only SPA (weak share URLs), Firebase, Mongo, Google Maps JS, Three.js in this repo, NextAuth-Google-only gate, a custom Python matching service for v1, per-campus Vercel projects.
