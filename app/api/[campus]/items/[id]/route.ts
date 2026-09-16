import { NextResponse } from "next/server";
import { assertCampus, requireSession } from "@/lib/http";
import { getItem, patchItem } from "@/lib/store";
import { ITEM_CATEGORIES } from "@/lib/types";

export async function GET(_: Request, context: { params: Promise<{ campus: string; id: string }> }) {
  const { campus, id } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const item = await getItem(campus, id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(request: Request, context: { params: Promise<{ campus: string; id: string }> }) {
  const { campus, id } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const session = await requireSession(campus);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const patch = {
    title: typeof body.title === "string" ? body.title : undefined,
    category:
      typeof body.category === "string" && (ITEM_CATEGORIES as readonly string[]).includes(body.category)
        ? (body.category as (typeof ITEM_CATEGORIES)[number])
        : undefined,
    note: typeof body.note === "string" ? body.note.slice(0, 40) : body.note === null ? null : undefined,
    floor: typeof body.floor === "number" ? body.floor : body.floor === null ? null : undefined,
    placeId: typeof body.placeId === "string" ? body.placeId : body.placeId === null ? null : undefined,
    placeLabel: typeof body.placeLabel === "string" ? body.placeLabel : body.placeLabel === null ? null : undefined,
    lat: typeof body.lat === "number" ? body.lat : undefined,
    lng: typeof body.lng === "number" ? body.lng : undefined,
    source:
      body.source === "gps_snap" || body.source === "gps_raw" || body.source === "picked" || body.source === "dragged"
        ? (body.source as "gps_snap" | "gps_raw" | "picked" | "dragged")
        : undefined,
  };

  const item = await patchItem(campus, id, session.id, patch);
  if (!item) {
    return NextResponse.json({ error: "Cannot update this item" }, { status: 403 });
  }

  return NextResponse.json({ item });
}
