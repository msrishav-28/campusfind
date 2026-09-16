# Data model

UUIDs for ids. Timestamps `timestamptz`. Soft deletes only if a legal hold appears; default is status transitions.

## organizations (later)

| column | notes |
|---|---|
| id | uuid |
| slug | `christ` |
| name | |
| created_at | |

v1 can hardcode one org row or omit the table and add it before a second university.

## campuses

| column | notes |
|---|---|
| id | uuid |
| org_id | nullable until org table exists |
| slug | `kengeri` unique |
| name | |
| subtitle | “CHRIST · Bangalore Kengeri” |
| plus_code | `VC7Q+75` |
| centroid_lat, centroid_lng | |
| fence_m | 700 default |
| status | `draft` \| `live` \| `paused` |
| desk_label | “Block I security desk” |
| created_at | |

## places

| column | notes |
|---|---|
| id | slug per campus, or uuid + slug |
| campus_id | required |
| slug | `block4`, unique per campus |
| name | “Block IV” |
| kind | `gate` `parking` `block` `indoor` `food` `hostel` `sport` `outdoor` `other` |
| aliases | `text[]` — `blk 4`, `lib` |
| lat, lng | door, walked |
| floors | `int[]` empty = outdoor |
| parent_id | library → block4 |
| geojson | optional footprint |
| sort | |

Seed from `data/kengeri/places.json`. Walk and replace coordinates before treating as truth.

## users

| column | notes |
|---|---|
| id | uuid |
| phone | unique, nullable |
| email | unique, nullable |
| created_at | |

Created on first OTP, not on first found post.

## device_sessions

| column | notes |
|---|---|
| id | uuid |
| user_id | nullable until OTP |
| campus_id | stamped from the URL they posted on |
| created_at, last_seen_at | |
| ua_hash | optional |

Cookie: httpOnly, secure, sameSite=lax, long-lived (90 days).

## campus_members

| column | notes |
|---|---|
| user_id, campus_id | pk |
| role | `student` \| `desk` \| `admin` |

## items

| column | notes |
|---|---|
| id | uuid |
| campus_id | required, from middleware |
| type | `lost` \| `found` |
| status | `open` \| `pending_claim` \| `recovered` \| `expired` \| `desk` \| `hidden` |
| title | required at post time (model or transcript) |
| category | see 15-claim-categories-copy |
| color, brand | nullable |
| tags | `text[]` |
| caption | one-line model or human |
| description | transcript leftover |
| distinctive | public-ish “scratch on case” — not the secret |
| photo_path | storage path |
| lat, lng | exact pin |
| accuracy_m | from Geolocation |
| place_id | nullable |
| place_label | denormalised for share cards |
| source | `gps_snap` \| `gps_raw` \| `picked` \| `dragged` |
| floor | nullable int |
| note | ≤40 chars |
| embedding | `vector` nullable — SigLIP 2 |
| secret_hash | sha256 of normalised private detail, nullable |
| poster_session_id | |
| poster_user_id | nullable |
| share_code | short public id for URLs if you do not want raw uuid |
| expires_at | created_at + 14 days |
| created_at, updated_at | |

## claims

| column | notes |
|---|---|
| id | |
| campus_id | |
| item_id | |
| claimant_user_id | OTP required |
| secret_attempt_ok | bool |
| status | `pending` \| `accepted` \| `rejected` |
| created_at | |

## reports (abuse)

| column | notes |
|---|---|
| id | |
| campus_id | |
| item_id | |
| session_id | |
| reason | `spam` `inappropriate` `wrong` `other` |
| created_at | |

Hide item when distinct reports ≥ 3 (tune after week 1).

## Indexes

- `items (campus_id, status, type, created_at desc)`
- `items (campus_id, place_id) where status = 'open'`
- `items using ivfflat (embedding vector_cosine_ops)` when pgvector is on
- `places (campus_id, slug)` unique
