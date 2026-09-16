import { NextResponse } from "next/server";
import { assertCampus, requireSession } from "@/lib/http";
import { claimSchema } from "@/lib/schemas";
import { createClaim } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ campus: string; id: string }> }) {
  const { campus, id } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const session = await requireSession(campus);
  if (!session.userId) {
    return NextResponse.json({ error: "OTP required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid claim" }, { status: 400 });
  }

  const claim = await createClaim(campus, id, session.userId, parsed.data.secret ?? null, parsed.data.message ?? null);
  if (!claim) {
    return NextResponse.json({ error: "Item unavailable" }, { status: 400 });
  }

  return NextResponse.json({ claim });
}
