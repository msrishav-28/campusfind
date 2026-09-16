import { NextResponse } from "next/server";
import { expireItems } from "@/lib/store";

export async function GET() {
  const count = await expireItems();
  return NextResponse.json({ expired: count });
}
