import { NextResponse } from "next/server";
import { expireItems } from "@/lib/store";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;

  if (!cronSecret && !adminKey) {
    return true; // Unrestricted in dev/test if no secrets configured
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const adminHeader = request.headers.get("x-admin-key");
  if (adminHeader && adminKey && adminHeader === adminKey) {
    return true;
  }

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && ((cronSecret && querySecret === cronSecret) || (adminKey && querySecret === adminKey))) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await expireItems();
  return NextResponse.json({ ok: true, expired: count, timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await expireItems();
  return NextResponse.json({ ok: true, expired: count, timestamp: new Date().toISOString() });
}
