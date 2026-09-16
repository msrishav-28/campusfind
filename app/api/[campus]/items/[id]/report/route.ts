import { NextResponse } from "next/server";
import { assertCampus, requireSession } from "@/lib/http";
import { reportSchema } from "@/lib/schemas";
import { createReport } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ campus: string; id: string }> }) {
  const { campus, id } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const session = await requireSession(campus);
  const ok = await createReport(campus, id, session.id, parsed.data.reason);
  if (!ok) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
