# Categories, claims, copy

## Categories (v1 enum)

`id_card`, `card`, `phone`, `earphones`, `bottle`, `umbrella`, `bag`, `wallet`, `keys`, `book`, `bottle_other`, `apparel`, `other`

Chips, not a long select. Interpret must map to this list. Unknown → `other`.

## Item status

`open` → `pending_claim` (optional; you may skip and keep open until accept) → `recovered`
`open` → `expired` (cron) → `desk` (received) → `recovered`
`open` → `hidden` (abuse)

v1 may skip `pending_claim` and keep the pin visible until accept.

## Claim flow

1. Viewer taps Claim.
2. If no session user: OTP.
3. If item has `secret_hash`: type or speak the detail. Server compares hash.
4. If match: create claim `accepted` immediately **or** `pending` for poster confirm. Prefer **poster confirm** even on hash match (one extra tap, fewer wrong handoffs).
5. If no secret on item: claimant writes “how I know.” Poster accepts from Mine.
6. Copy: meet at Block IV cafe / Block I lobby / gate — public.

Wrong secret: do not reveal whether a secret exists. Generic “Didn’t match. Try again or message the poster via accept flow.”

## WhatsApp blast (Kengeri)

```
Lost something on campus? Pin it on the map instead of the group.

CampusFind — Kengeri
Photo + a sentence + a pin. That’s it.

<url>/kengeri
```

Do not lead with AI.

## In-app microcopy

- GPS denied: “Pick a place. You can still post.”
- Off campus: “You look outside Kengeri. Pick a campus place anyway?”
- Snap: “Looks like Block IV cafeteria · ±14 m” [That’s it] [Change]
- Model down: no toast required. Title stays as spoken.
- ID: “Cover the number on the card before you post.”

## Seed pins (launch)

Walk-seed 15–20 **found** pins with real photos of dummy objects you control (a bottle at cafe4, an umbrella at library). Mark them `seed` in description or a `is_seed` flag so you can delete after week 1. Empty maps kill the WhatsApp drop.
