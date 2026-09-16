# Models and Modal

Research snapshot: 16 Sep 2026. Details in [../07-open-source-models-modal.md](../07-open-source-models-modal.md).

## Jobs

| Job | Model | Where |
|---|---|---|
| Transcript | Web Speech | Phone |
| Transcript fallback | faster-whisper / Groq Whisper | Modal T4 or Groq |
| Card JSON | Gemini Flash | Vercel → Google |
| Card JSON fallback | Qwen2.5-VL-7B 4-bit or Qwen3-VL-4B | Modal L4 |
| Match embed | SigLIP 2 `google/siglip2-base-patch16-224` | Modal T4 |

Do not run Llama 4 Scout or 70B VLMs. Do not use VLM hidden states as the matcher.

## Modal

```
/embed       SigLIP 2    gpu="T4"   scale to zero
/interpret   Qwen-VL     gpu="L4"   async only
/transcribe  Whisper     gpu="T4"   on retry
```

Weights on a Modal Volume. Starter credits exist; a hot L4 24/7 is how the bill dies.

Kengeri volume (tens of posts/day) is cents if functions sleep.

## Order of work

1. Ship v1 with no model.
2. Gemini interpret if key present.
3. SigLIP 2 embed + top-3.
4. Whisper retry.
5. Replace Gemini only if needed.

## Licenses to watch

- Qwen2.5-VL-7B: Apache 2.0
- InternVL3-8B: MIT
- SigLIP 2: Google open weights
- Gemma: Gemma terms
- Llama 4: community licence — avoid unless you need it
