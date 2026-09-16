# CampusFind

Map-first lost & found for **CHRIST (Deemed to be University), Bangalore Kengeri**.

Snap a photo. Talk. Drop a pin. GPS names the place. A model files the card. When both a lost and a found pin exist, models propose a match. A person still proves ownership.

This repo currently holds **product and research docs**. App code comes next (`/kengeri` PWA).

## Read in this order

1. [docs/01-plan.md](docs/01-plan.md) — locked v1.1 plan (source of truth)
2. [docs/02-product.md](docs/02-product.md) — why scratch, jobs, principles
3. [docs/03-tech-stack.md](docs/03-tech-stack.md) — Next.js / Supabase / MapLibre
4. [docs/04-multi-tenant.md](docs/04-multi-tenant.md) — campus is the tenant
5. [docs/05-v2.md](docs/05-v2.md) — what v2 is for, and what it is not
6. [docs/06-voice-vision-matching.md](docs/06-voice-vision-matching.md) — mymind capture + free models
7. [docs/07-open-source-models-modal.md](docs/07-open-source-models-modal.md) — SigLIP 2, Qwen VL, Modal GPUs
8. [docs/08-kengeri-places.md](docs/08-kengeri-places.md) — gazetteer to walk and lock

Archive: [docs/archive/v1-plan.md](docs/archive/v1-plan.md)

## One-sentence product

A campus map you pin in twenty seconds by snapping a photo and talking.

## Locked defaults

| | |
|---|---|
| Pilot UI | Kengeri only |
| Home | Live map, not a landing page |
| Capture | Photo + hold-to-talk |
| Auth | None to view or post found; OTP to claim |
| Match | Top 3, human confirms |
| Unclaimed | 14 days → Block I desk |
| 3D nav | Separate repo; share `place_id` |

## Status

Docs only. Next: Next.js App Router, first route `/kengeri`, gazetteer in `data/kengeri/`.

Student-run tool. Not an official university records system until a MoU exists.
