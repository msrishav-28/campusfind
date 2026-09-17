import { NextResponse } from "next/server";
import { otpStartSchema } from "@/lib/schemas";
import { requireSession } from "@/lib/http";
import { createOtp } from "@/lib/store";
import { isSupabaseConfigured, supabaseAuth } from "@/lib/db/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = otpStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await requireSession("kengeri");
  const target = parsed.data.email ?? parsed.data.phone;
  if (!target || !target.includes("@")) {
    return NextResponse.json(
      { error: "Please enter your campus email address. Verification codes are delivered via email." },
      { status: 400 }
    );
  }

  const email = target.trim().toLowerCase();

  // Send via Supabase Auth if configured
  if (isSupabaseConfigured()) {
    const supaRes = await supabaseAuth.sendEmailOtp(email);
    if (!supaRes.ok) {
      return NextResponse.json({ error: supaRes.error || "Failed to deliver email verification code" }, { status: 500 });
    }
  }

  const challenge = await createOtp(email, session.id);
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.log(`[DEV OTP] Target email: ${email}, Code: ${challenge.code}`);
  }

  return NextResponse.json({
    challengeId: challenge.challengeId,
    email,
    ...(isDev ? { codePreview: challenge.code } : {}),
  });
}
