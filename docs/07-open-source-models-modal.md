# Open-source vision / language models and Modal

Research date: 16 September 2026.

Lost-and-found is two jobs. Do not run one 70B VLM for both.

1. **Match** — dual encoder (pixels ↔ text).
2. **Card** — small VLM writes JSON from photo + transcript.
3. **Voice fallback** — Whisper only when Web Speech fails.

## Matcher (put on Modal first)

**`google/siglip2-base-patch16-224`** (or `siglip2-large-patch16-384`)

- Built for retrieval, not chat.
- ~400M params. Fits on a T4 (16 GB).
- Embed the found photo. Embed the lost description (and photo if any). Cosine + place + 14-day filters.

Do not use a VLM hidden state as the matcher.

## Card writer

| Model | Notes | VRAM | License |
|---|---|---|---|
| Qwen2.5-VL-7B-Instruct | Best default; brand OCR; JSON | ~8–10 GB 4-bit | Apache 2.0 (7B) |
| Qwen3-VL-4B-Instruct | Smaller, faster cold start | ~6–8 GB | Qwen / Apache-class |
| Qwen3.5-9B (vision) | Strong local pick ~6.6 GB Q4 | 8–12 GB | Apache 2.0 |
| InternVL3-8B | MIT, scene reasoning | ~9–11 GB 4-bit | MIT |
| Gemma 3 4B / 12B | Easy tooling | 4–10 GB | Gemma terms |

Ship 4-bit Qwen2.5-VL-7B on an L4, or 4B if cold start hurts.

Skip on Modal: Llama 4 Scout (~60 GB Q4), InternVL3-78B, Qwen-VL-72B.

Tiny caption models (SmolVLM, Moondream) are too weak for “JBL vs Sony on a dirty case.”

## Voice fallback

`faster-whisper` large-v3-turbo on the same T4. Not on every post.

## Modal layout

```
/embed       SigLIP 2    gpu="T4"   keep scale-to-zero; optional daytime warm
/interpret   Qwen-VL     gpu="L4"   async after the pin is live
/transcribe  Whisper     gpu="T4"   rare
```

Weights on a Modal Volume so cold start does not re-download 15 GB.

### GPU list prices (Modal, 2026)

| GPU | ~$/hr | Use |
|---|---|---|
| T4 | 0.59 | SigLIP 2 + Whisper |
| L4 | 0.80 | Qwen-VL 4B/7B 4-bit |
| L40S | 1.95 | Only if you insist on 27B |

Starter plan includes monthly free compute credits. Leaving an L4 warm 24/7 is how the bill explodes. Scale to zero.

Kengeri volume (tens of posts/day) is cents if functions sleep. Do not start on A100/H100.

## When to use Modal vs Gemini

| | Gemini Flash free | Modal + open weights |
|---|---|---|
| Card | Excellent, less ops | Good at 7B; you own the prompt |
| Match | Still want an embedder | SigLIP 2 is the right tool |
| Privacy | Free tier may train | Images stay on your volume |
| 40 posts/day | $0 | ~$2–5/mo if scale-to-zero |
| GPU left hot | — | Hundreds/month |

Path:

1. Gemini Flash for the card. Web Speech on device.
2. SigLIP 2 on Modal T4 for match (v1.1).
3. Move `/interpret` to Qwen-VL only if Gemini quota or policy hurts.
4. Fine-tune nothing until hundreds of real campus photos exist.

Hugging Face Inference API is not the production runtime. Use HF to **download weights onto a Modal volume**.

## Serve

- Embedder: `transformers` + FastAPI on Modal.
- VLM: vLLM or LMDeploy.
- Pattern: one Modal app, three functions, one volume.
