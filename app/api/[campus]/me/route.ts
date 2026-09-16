import { NextResponse } from "next/server";
import { assertCampus, requireSession } from "@/lib/http";
import { listClaimsForViewer, listMine } from "@/lib/store";

export async function GET(_: Request, context: { params: Promise<{ campus: string }> }) {
  const { campus } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const session = await requireSession(campus);
  const [items, claims] = await Promise.all([
    listMine(campus, session.id, session.userId),
    listClaimsForViewer(campus, session.id, session.userId),
  ]);

  return NextResponse.json({ items, claims, userId: session.userId });
}
