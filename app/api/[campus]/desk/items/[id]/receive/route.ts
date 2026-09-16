import { NextResponse } from "next/server";
import { assertCampus, checkDeskPin } from "@/lib/http";
import { setDeskStatus } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ campus: string; id: string }> }) {
  const { campus, id } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const pin = new URL(request.url).searchParams.get("pin");
  if (!checkDeskPin(pin)) {
    return NextResponse.json({ error: "Desk pin required" }, { status: 401 });
  }

  const ok = await setDeskStatus(campus, id, "desk");
  return NextResponse.json({ ok });
}
