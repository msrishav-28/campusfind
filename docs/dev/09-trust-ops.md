# Trust and ops

## Trust rules

- No public phone, email, or register number on a pin.
- Private detail hashed (`sha256` of normalised string). Compare only on the server.
- Meet at public campus spots (cafeteria, gate, Block I lobby). Copy on the claim sheet.
- Abuse: `POST .../report`. Hide at 3 distinct sessions.
- Student-run framing until a written MoU. Footer: not official university records.
- Free Gemini may train on prompts. Do not send readable ID faces if avoidable.
- Desk is a drop point, not a registrar product, until staff agree.

## Expiry

Daily Vercel cron `0 2 * * *` Asia/Kolkata.

```
open AND now() > expires_at  →  expired
```

Expired items leave the default map. Desk list can still receive them (`desk`).

## Rate limits

| action | limit |
|---|---|
| create item | 10 / session / hour |
| interpret | 20 / session / hour |
| claim | 8 / user / hour |
| report | 15 / session / day |
| OTP start | 5 / phone / hour |

## Env

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE
NEXT_PUBLIC_CAMPUS=kengeri
GEMINI_API_KEY=
MODAL_EMBED_URL=
MODAL_EMBED_SECRET=
GROQ_API_KEY=
DESK_PIN=
NEXT_PUBLIC_MAP_STYLE=         # optional MapLibre style URL
```

## Security copy (Help)

CampusFind is run by students for Kengeri. Pins are not a police report. Do not post ID numbers. Meet in public. After 14 days unclaimed found items can go to Block I security.
