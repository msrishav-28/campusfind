import { cookies } from "next/headers";
import { getOrCreateSession } from "@/lib/store";
import { isCampusApproved } from "@/lib/campus";

export const SESSION_COOKIE = "cf_session";

export async function requireSession(campusSlug: string) {
  const cookieStore = await cookies();
  const current = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await getOrCreateSession(campusSlug, current);

  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return session;
}

export function assertCampus(campusSlug: string): boolean {
  return isCampusApproved(campusSlug);
}

export function checkDeskPin(pin: string | null): boolean {
  const configured = process.env.DESK_PIN || "1234";
  return Boolean(pin && pin === configured);
}
