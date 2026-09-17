import { NextResponse } from "next/server";
import { campusOnboardSchema } from "@/lib/schemas";
import { registerCampus } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const adminKeyHeader = request.headers.get("x-admin-key");
    const configuredAdminKey = process.env.ADMIN_KEY;

    const json = await request.json();
    const parsed = campusOnboardSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const { slug, name, institutionType, city, contactEmail, contactPhone, deskPin, lat, lng, fenceM } = parsed.data;

    // Enforce institutional verification: either valid admin key OR verified academic email domain
    const emailLower = contactEmail.toLowerCase().trim();
    const isAcademicEmail =
      emailLower.endsWith(".edu") ||
      emailLower.endsWith(".edu.in") ||
      emailLower.endsWith(".ac.in") ||
      emailLower.endsWith(".res.in") ||
      emailLower.endsWith(".org");

    const hasAdminKey = Boolean(configuredAdminKey && adminKeyHeader === configuredAdminKey);

    if (configuredAdminKey && !hasAdminKey && !isAcademicEmail) {
      return NextResponse.json(
        {
          error:
            "Institutional verification required. Please provide an authorized institutional email (.edu, .edu.in, .ac.in) or administrator key.",
        },
        { status: 403 }
      );
    }

    const result = await registerCampus({
      slug,
      name,
      institutionType,
      city,
      contactEmail,
      contactPhone,
      deskPin,
      centroid: { lat, lng },
      fenceM,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message || "Could not register campus" }, { status: 409 });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Institution application submitted successfully. Workspace partition will be active upon review.",
        campus: {
          slug: result.campus?.slug,
          name: result.campus?.name,
          status: result.campus?.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process campus registration", details: String(error) },
      { status: 500 }
    );
  }
}
