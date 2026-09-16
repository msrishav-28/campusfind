import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { assertCampus, requireSession } from "@/lib/http";
import { createItem, listItems } from "@/lib/store";
import { createItemSchema } from "@/lib/schemas";
import { resolvePlace } from "@/lib/location";

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function persistPhoto(campus: string, photo: File): Promise<string> {
  const maxBytes = 8 * 1024 * 1024;
  if (photo.size > maxBytes) {
    throw new Error("Photo exceeds 8MB");
  }

  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const photoId = randomUUID();
  const relative = `campuses/${campus}/items/${photoId}.${ext}`;
  const absolute = path.join(process.cwd(), "public", relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  const bytes = Buffer.from(await photo.arrayBuffer());
  await writeFile(absolute, bytes);
  return `/${relative}`;
}

export async function GET(request: Request, context: { params: Promise<{ campus: string }> }) {
  const { campus } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q") ?? undefined;
  const near = url.searchParams.get("near");
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  const items = await listItems({
    campusSlug: campus,
    type: type === "lost" || type === "found" ? type : undefined,
    status: status === "open" || status === "pending_claim" || status === "recovered" || status === "expired" || status === "desk" || status === "hidden" ? status : undefined,
    q,
    near: near === "1" && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, radiusM: 150 } : undefined,
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request, context: { params: Promise<{ campus: string }> }) {
  const { campus } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const session = await requireSession(campus);

  let photoPath: string | null = null;
  let payload: Record<string, unknown>;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
      photoPath = await persistPhoto(campus, photo);
    }

    const lat = parseNumber(form.get("lat"));
    const lng = parseNumber(form.get("lng"));
    const note = typeof form.get("note") === "string" ? form.get("note") : null;

    const placeResolved = lat !== null && lng !== null ? resolvePlace(lat, lng) : null;

    payload = {
      type: form.get("type"),
      title: form.get("title") || form.get("transcript") || "Found item",
      category: form.get("category") || "other",
      lat,
      lng,
      accuracyM: parseNumber(form.get("accuracy_m")),
      placeId: form.get("place_id") || placeResolved?.place?.id || null,
      placeLabel: form.get("place_label") || placeResolved?.place?.name || null,
      source: form.get("source") || placeResolved?.source || "gps_raw",
      floor: parseNumber(form.get("floor")),
      note: typeof note === "string" ? note.slice(0, 40) : null,
      transcript: form.get("transcript"),
      secret: form.get("secret"),
      photoPath,
      tags: [],
    };
  } else {
    payload = await request.json().catch(() => ({}));
  }

  const parsed = createItemSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid item payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const item = await createItem({
    ...parsed.data,
    campusSlug: campus,
    posterSessionId: session.id,
    posterUserId: session.userId,
  });

  return NextResponse.json({ itemId: item.id, item });
}
