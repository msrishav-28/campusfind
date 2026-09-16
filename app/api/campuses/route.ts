import { NextResponse } from "next/server";
import { listAllApprovedCampuses } from "@/lib/campus";

export async function GET() {
  const campuses = await listAllApprovedCampuses();
  return NextResponse.json({ campuses });
}
