# Capture and interpret

mymind rule: dump photo + sentence. The model files the card. Fields are storage, not UI.

## Report sheet (one surface)

1. Lost | Found — two large cards.
2. Camera, `capture="environment"`, accept image/*.
3. Hold-to-talk. `SpeechRecognition` continuous=false, lang=`en-IN`.
4. Live transcript in the title slot.
5. Optional `/api/interpret` paints chips: title, category, color, brand, tags, distinctive, place_guess.
6. User fixes by talking again (“no, it’s blue”) or tapping a chip.
7. Location card from [03-location.md](03-location.md).
8. Floor chip if needed. Note ≤40 chars.
9. Private detail optional — typed or spoken, stored hashed only.
10. Post.

Required to insert: `title` (model or transcript or “Found item”) + (`lat/lng` or `place_id`).

If interpret fails or times out (> 4s): post anyway with transcript as title, category `other`.

## Web Speech

```
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
```

- iOS Safari support is uneven. Always keep a type box under the mic.
- Canteen noise: show “tap to type” after a failed result.
- Whisper (Groq or Modal) only on explicit retry, v1.1.

## Interpret contract

`POST /api/interpret` (server only, never call Gemini from the browser)

Request:

```json
{
  "photo_path": "campuses/kengeri/items/....jpg",
  "transcript": "black jbl neckband outside block four cafe",
  "campus_id": "<uuid or slug resolved server-side>",
  "lat": 12.8624,
  "lng": 77.4377
}
```

Response:

```json
{
  "title": "Black JBL neckband",
  "category": "earphones",
  "color": "black",
  "brand": "JBL",
  "tags": ["black", "jbl", "neckband", "earphones"],
  "distinctive": "scratch on the case",
  "place_guess": "cafe4",
  "floor_guess": null,
  "redact": false
}
```

JSON only. Campus place slugs listed in the system prompt.
If the photo looks like an ID card: `category: "id_card"`, `redact: true`, **do not** put a register number in tags or title.

System prompt sketch:

```
You tag a CHRIST Kengeri lost-and-found item.
Places: gate, parking, block1-4, central, library, cafe1, cafe4,
workshop, devadan, christ-hall, football, basketball, chapel, open-aud.
Return JSON keys: title, category, color, brand, tags, distinctive,
place_guess, floor_guess, redact.
If unsure, null. Never invent a register number from an ID photo.
```

## Timing

1. Upload photo + insert item (`status=open`).
2. Return item id to the client immediately.
3. Fire interpret + embed on a server job or `after()`.
4. Patch title/tags/embedding if the user has not already edited.

## Gemini vs Modal

v1: Gemini Flash if `GEMINI_API_KEY` is set.
v1.1 match: SigLIP 2 embed on Modal.
Move the card writer to Qwen-VL only if Gemini quota or policy hurts.
