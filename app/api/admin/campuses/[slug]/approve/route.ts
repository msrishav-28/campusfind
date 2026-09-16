import { NextResponse } from "next/server";
import { approveCampus } from "@/lib/store";
import { addApprovedSlug } from "@/lib/campus";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const authHeader = request.headers.get("authorization") || request.headers.get("x-admin-key");
    const adminSecret = process.env.ADMIN_SECRET || process.env.DESK_PIN || "1234";

    if (authHeader && authHeader.replace(/^Bearer\s+/i, "") !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let deskPin: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.deskPin === "string") {
        deskPin = body.deskPin;
      }
    } catch {
      // Body is optional
    }

    const approved = await approveCampus(slug, deskPin);
    if (!approved) {
      return NextResponse.json(
        { error: `Campus '${slug}' not found or already approved` },
        { status: 404 }
      );
    }

    addApprovedSlug(slug);

    return NextResponse.json({
      ok: true,
      message: `Campus '${slug}' has been approved and activated.`,
      slug,
      status: "approved",
      workspaceUrl: `/${slug}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to approve campus", details: String(error) },
      { status: 500 }
    );
  }
}
