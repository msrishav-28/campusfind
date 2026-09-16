import { NextResponse } from "next/server";
import { getCampus } from "@/lib/campus";

export async function GET(
  _request: Request,
  context: { params: Promise<{ campus: string }> }
) {
  const { campus } = await context.params;
  const campusData = await getCampus(campus);
  if (!campusData) {
    return NextResponse.json({ error: "Campus not found" }, { status: 404 });
  }

  return NextResponse.json({
    campus: campusData.campus,
    name: campusData.name,
    centroid: campusData.centroid,
    fence_m: campusData.fence_m,
    places: campusData.places,
  });
}
