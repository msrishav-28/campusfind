import { NextResponse } from "next/server";
import { otpStartSchema } from "@/lib/schemas";
import { requireSession } from "@/lib/http";
import { createOtp } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = otpStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await requireSession("kengeri");
  const target = parsed.data.phone ?? parsed.data.email;
  if (!target) {
    return NextResponse.json({ error: "Phone or email required" }, { status: 400 });
  }

  const challenge = await createOtp(target, session.id);
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.log(`[DEV OTP] Target: ${target}, Code: ${challenge.code}`);
  }

  return NextResponse.json({
    challengeId: challenge.challengeId,
    ...(isDev ? { codePreview: challenge.code } : {}),
  });
}
