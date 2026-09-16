# Multi-tenant (implementation)

See also [../04-multi-tenant.md](../04-multi-tenant.md).

## Middleware

```
pathname /kengeri/...  → campus_slug = kengeri
resolve campuses.slug where status = live
set header x-campus-id
```

`/` → last campus cookie or `kengeri`.
Unknown slug → 404, not the Kengeri map.

## Writes

Route handler loads campus from slug. Item insert uses that id. If the body contains another `campus_id`, drop it.

## Reads

Every query: `eq('campus_id', campus.id)`.

## Storage

`campuses/{slug}/items/{id}.jpg`
Never a flat `items/` bucket.

## Second campus

1. Walk, write `data/central/places.json`.
2. Insert `campuses` row `status=live`.
3. Seed places.
4. Route `/central` already works if pages live under `app/[campus]/`.

Prefer `app/[campus]/page.tsx` from day one even if only `kengeri` is live.

## Do not

Mega-map of all campuses. Client-supplied campus. Shared gazetteer. Separate databases.
