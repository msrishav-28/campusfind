# Photos and PWA

## Photos

Client before upload:

- `capture="environment"`
- Compress: longest edge 1600px, JPEG quality ~0.8, max 2MB
- Strip EXIF on client if the library allows; strip again on server

Server:

- Accept jpeg/png/webp/heic if you can decode HEIC; otherwise convert on client
- Reject > 8MB pre-compress
- Path: `campuses/{campus_slug}/items/{item_id}.jpg`
- Public read for open items (needed for WhatsApp preview) OR signed URLs + OG renderer. Prefer public thumb + private original if you have time; v1 public is acceptable if IDs are redacted.
- Retention: delete or freeze 90 days after `recovered` / `expired` / `hidden`. Cron.

ID cards: if interpret sets `redact`, show a banner “Cover the register number” and do not OCR digits into tags. Optional blur overlay in v2.

## PWA

- `manifest.webmanifest`: name CampusFind, short_name CampusFind, display standalone, theme campus green `#0B3D2E`
- Icons 192 / 512
- Service worker: **shell only**. Do not cache map tiles long-term (stale campus).
- Prompt “Add to Home Screen” after the second successful visit, not on first paint.
- `apple-mobile-web-app-capable` for iOS.

## Share

WhatsApp opens `/kengeri/item/[id]`. Must work without the PWA installed. SSR or at least correct OG tags.
