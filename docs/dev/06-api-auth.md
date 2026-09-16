# API and auth

All mutating routes read campus from the URL or a server-resolved slug. Ignore client `campus_id`.

## Session

- `GET /api/session` — create or refresh device cookie.
- Cookie name: `cf_session`. httpOnly.

Anonymous found posts attach `poster_session_id`.

## OTP

- `POST /api/auth/otp/start` `{ phone | email }`
- `POST /api/auth/otp/verify` `{ code }` → attach user_id to session.

Required before: create claim, accept claim, desk.

Supabase Auth phone/email is fine. Do not force Google.

## Items

- `GET /api/kengeri/items?type=&status=open&near=1&q=`
- `POST /api/kengeri/items` multipart: type, title?, category?, photo, lat, lng, accuracy_m, place_id, floor, note, transcript, secret?
- `GET /api/kengeri/items/:id`
- `PATCH /api/kengeri/items/:id` poster session only, while `open`
- `POST /api/kengeri/items/:id/report`

Rate limit POST items: 10 / session / hour (tune).

## Claims

- `POST /api/kengeri/items/:id/claims` `{ secret }` — claimant must have OTP.
- Compare `sha256(normalise(secret))` to `secret_hash`.
- If no secret was set on the item: claimant leaves a message; poster accepts from Mine.
- `POST /api/kengeri/claims/:id/accept` poster only.
- `POST /api/kengeri/claims/:id/reject`

On accept: `item.status = recovered`.

Normalise secret: trim, lower case, collapse whitespace.

## Interpret / embed

- `POST /api/interpret` server-to-server or after() from item create.
- `POST /api/embed` optional Modal proxy.

## Desk

- `GET /api/kengeri/desk/items` role desk|admin
- `POST /api/kengeri/desk/items/:id/receive` → status `desk`
- `POST /api/kengeri/desk/items/:id/return` → `recovered`
- `POST /api/kengeri/desk/items/:id/dispose` → `hidden` or a `disposed` status if you add it

v1 desk can be a shared PIN in env `DESK_PIN` if there is no staff user yet. Replace with `campus_members` as soon as one person will log in.

## RLS sketch

```sql
alter table items enable row level security;

create policy items_select_open on items
  for select using (
    campus_id = current_setting('request.jwt.claims', true)::json->>'campus_id'
    -- simpler v1: filter in the server and use service role only on the server
  );
```

Pragmatic v1: **all writes go through Next.js route handlers with the service role**. Anon client is read-only on `items` where `status in ('open','pending_claim','recovered')` and `campus_id` matches. Do not expose secret_hash to the anon select list.

Anon select columns: everything except `secret_hash`, `poster_session_id`, `poster_user_id`.

## Permalink

`https://<host>/kengeri/item/<id>`

OG title: `{Found|Lost}: {title} · {place_label}`. Image = photo. This is the WhatsApp unit.
