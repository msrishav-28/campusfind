import { NextResponse } from "next/server";
import { assertCampus, checkDeskPin } from "@/lib/http";
import { deskItems } from "@/lib/store";

export async function GET(request: Request, context: { params: Promise<{ campus: string }> }) {
  const { campus } = await context.params;
  if (!assertCampus(campus)) {
    return NextResponse.json({ error: "Unknown campus" }, { status: 404 });
  }

  const pin = new URL(request.url).searchParams.get("pin");
  if (!checkDeskPin(pin)) {
    return NextResponse.json({ error: "Desk pin required" }, { status: 401 });
  }

  const items = await deskItems(campus);
  return NextResponse.json({ items });
}
