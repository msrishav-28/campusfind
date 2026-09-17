import { NextResponse } from "next/server";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/types";

type InterpretResponse = {
  title: string;
  category: ItemCategory;
  color: string | null;
  brand: string | null;
  tags: string[];
  distinctive: string | null;
  place_guess: string | null;
  floor_guess: number | null;
  redact: boolean;
};

function defaultFallback(transcript: string): InterpretResponse {
  const clean = transcript.trim();
  const words = clean ? clean.toLowerCase().split(/[\s,.-]+/).filter((w) => w.length > 2) : [];
  return {
    title: clean || "Found item",
    category: "other",
    color: null,
    brand: null,
    tags: words.slice(0, 5),
    distinctive: null,
    place_guess: null,
    floor_guess: null,
    redact: false,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const transcript = typeof body.transcript === "string" ? body.transcript : "";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(defaultFallback(transcript));
  }

  // 4-second timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const prompt = `You are the lost & found card writer for CHRIST University Bangalore Kengeri.
Transcript / description: "${transcript}"
Categories: ${ITEM_CATEGORIES.join(", ")}
Valid place IDs: gate, parking, block1, block2, block3, block4, central, library, cafe1, cafe4, workshop, devadan, christ-hall, football, basketball, chapel, open-aud.

Return a valid JSON object only (no markdown, no backticks) with this structure:
{
  "title": "Concise 2-5 word title e.g. Black Casio Calculator",
  "category": "one of the categories above",
  "color": "primary color string or null",
  "brand": "brand name or null",
  "tags": ["short", "keywords"],
  "distinctive": "any special mark or scratch or null",
  "place_guess": "place ID from above or null",
  "floor_guess": integer or null,
  "redact": boolean (true if ID card)
}
Never include student register numbers in tags or title.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 256,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(defaultFallback(transcript));
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json(defaultFallback(transcript));
    }

    const parsed = JSON.parse(rawText);
    const category = ITEM_CATEGORIES.includes(parsed.category) ? parsed.category : "other";

    return NextResponse.json({
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : (transcript.trim() || "Found item"),
      category,
      color: typeof parsed.color === "string" ? parsed.color : null,
      brand: typeof parsed.brand === "string" ? parsed.brand : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : defaultFallback(transcript).tags,
      distinctive: typeof parsed.distinctive === "string" ? parsed.distinctive : null,
      place_guess: typeof parsed.place_guess === "string" ? parsed.place_guess : null,
      floor_guess: typeof parsed.floor_guess === "number" ? parsed.floor_guess : null,
      redact: Boolean(parsed.redact),
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(defaultFallback(transcript));
  }
}
