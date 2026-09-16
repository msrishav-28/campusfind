import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { otpVerifySchema } from "@/lib/schemas";
import { SESSION_COOKIE } from "@/lib/http";
import { verifyOtp } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await verifyOtp(parsed.data.challengeId, parsed.data.code);
  if (!result.ok || !result.sessionId) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, result.sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return NextResponse.json({ ok: true, userId: result.userId });
}
