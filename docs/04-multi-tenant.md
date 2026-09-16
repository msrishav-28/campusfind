# Multi-tenant

Campus is the tenant. Not the user. Not “CHRIST” as one bucket.

A lost umbrella on Hosur Road must not appear on the Kengeri football ground.

## Layers

```
Organization     CHRIST          later: another college
  Campus         kengeri | central | bgr | yeshwanthpur
    Place        Block IV, Devadan, …
    Item / Claim / Desk
```

- **Campus = tenant.** Pins, places, desk, near-me never leak.
- **Organization = branding / legal.** Only when a second university exists.
- **User ≠ tenant.** Membership is a join table.

## Isolation

Every campus-shaped row has `campus_id`.

Reads: `WHERE campus_id = $current`.
Writes: middleware sets campus from the URL. Ignore `campus_id` in the client body.

Supabase RLS example:

```sql
create policy items_campus on items
  for select using (
    campus_id = current_setting('app.campus_id')::uuid
  );
```

Anonymous found-post: session stamped with the campus of the URL they posted on.

`campus_members (user_id, campus_id, role)` — student | desk | admin.

## URL

v1: subpath.

- `campusfind.app/kengeri`
- `campusfind.app/kengeri/item/abc`

`/` redirects to last campus or `kengeri`.
Share links include the campus so WhatsApp cannot land on the wrong map.

v1.1 optional: `kengeri.campusfind.app`.
Custom domain only with an official partnership.

## Per campus vs global

**Per campus:** gazetteer, fence, items, claims, desk, subtitle, aliases.
**Global:** chrome, claim flow, users, OTP, photo pipeline, code.
**Per org (later):** logo, colour, legal footer.

A second CHRIST campus is a new row + a GeoJSON file. Not a fork.

## Do not build now

Self-serve “create your campus”, custom domains, per-campus databases, separate Vercel projects, sharding.

One project, one database, `campus_id` + RLS is enough for tens of campuses.

## Failure modes

- Forgetting `campus_id` on `claims` → RLS hole.
- Client-supplied campus on POST → spoofed pins.
- Reusing one gazetteer across campuses → “Block IV” on Central.
- Default `/` listing every campus → empty mega-map.
