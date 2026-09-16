# Voice, vision, matching (mymind-style)

Fields exist in the database. They are not the UI.

mymind’s rule: save first, it files itself, search later by anything you remember (colour, object, brand, place).

CampusFind version:

- Snap + talk. “Black JBL neckband, outside Block IV cafe, scratch on the case.”
- Model writes the card: title, tags, colour, brand, place guess.
- Glance, fix one chip, post.
- Search the same way: “black headphones library.”

## Can lost ↔ found match?

Yes, as **retrieve three, human confirms**.

| Signal | Role |
|---|---|
| Opposite type | Hard filter |
| Same `campus_id` | Hard filter |
| Open + last 14 days | Hard filter |
| Same place or < ~150 m | Strong |
| Shared tags | Strong |
| Embedding cosine (photo↔photo or photo↔text) | Strong |
| Time proximity | Weak |
| Private detail | Never in the matcher |

Empty map → nothing to match. The model does not invent items.

## Free path (no Modal required)

- **Voice:** Web Speech API on Chrome/Android.
- **Card:** Gemini Flash / Flash-Lite, AI Studio free tier, JSON out.
- **Embed (interim):** Gemini embeddings or Cloudflare `bge` on the caption — until SigLIP 2 is on Modal.

If Gemini 429s: post raw transcript + photo. Tag later. Never block the found post.

## Interpret contract

`POST /api/interpret`

```json
{
  "photo": "<url or bytes>",
  "transcript": "black jbl neckband outside block four cafe",
  "campus_id": "kengeri",
  "lat": 12.8624,
  "lng": 77.4377
}
```

Returns JSON only. Place list in the prompt. ID-looking photo → `category: id_card`, `redact: true`, no register number in tags.

Private detail is never sent to the model, never embedded, never shown on the pin.

## Where it sits

| | When |
|---|---|
| Voice + Web Speech | v1, optional, zero API cost |
| Gemini tags on upload | v1.1 |
| Embed + three matches | v1.1 |
| Whisper canteen fallback | v1.1 / v2 |
| On-device VLM in the PWA | skip |
