import { NextResponse } from "next/server";
import { assertCampus, requireSession } from "@/lib/http";
import { updateClaimStatus } from "@/lib/store";

export async function POST(_: Request, context: { params: Promise<{ campus: string; id: string }> }) {
  const { campus, id } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const session = await requireSession(campus);
  const ok = await updateClaimStatus(campus, id, "accepted", session.id);
  if (!ok) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
