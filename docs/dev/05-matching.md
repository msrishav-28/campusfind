# Matching

Matching is retrieval. It is not ownership.

## When it runs

After an item is inserted or interpret/embed finishes. Recompute the top-3 for that item and for opposite-type open neighbours.

Show “3 possible matches” on the item sheet and on Mine. Tapping a match opens the other pin. Claim still uses private detail.

## Hard filters

```
other.campus_id = item.campus_id
other.type != item.type
other.status = 'open'
other.created_at >= now() - 14 days
other.id != item.id
```

## Rank (higher is better)

```
score =
  3.0 * same_place_id
+ 2.0 * (haversine_m < 150)
+ 1.5 * jaccard(tags)
+ 2.5 * cosine(embedding_a, embedding_b)   // if both exist
+ 0.5 * time_decay                          // closer in hours
```

`time_decay` = max(0, 1 - hours_apart / 336).

If no embeddings yet, rank on place + tags only.

## Embeddings

Preferred: SigLIP 2 on the **photo** and on the caption text. Store one vector per item (image vector if photo exists, else text).

Interim without Modal: embed `caption + tags.join(' ')` with Gemini embed or Cloudflare bge. Worse on “same black wallet, different scratch.” Replace with SigLIP 2.

Never embed the private detail.

## UI rules

- Max 3.
- No confidence percentage.
- Empty state: hide the block.
- Do not auto-set `pending_claim`.

## What will fail

Generic black umbrellas, night photos, two similar ID holders. Show both. Private detail sorts it.
