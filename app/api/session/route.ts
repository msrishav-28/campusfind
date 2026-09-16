import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http";

export async function GET() {
  const session = await requireSession("kengeri");
  return NextResponse.json({ sessionId: session.id, userId: session.userId });
}
