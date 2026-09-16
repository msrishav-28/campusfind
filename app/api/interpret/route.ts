import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const transcript = typeof body.transcript === "string" ? body.transcript : "";

  return NextResponse.json({
    title: transcript.trim() || "Found item",
    category: "other",
    color: null,
    brand: null,
    tags: transcript ? transcript.toLowerCase().split(/\s+/).slice(0, 5) : [],
    distinctive: null,
    place_guess: null,
    floor_guess: null,
    redact: false,
  });
}
