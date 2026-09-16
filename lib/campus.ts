import { readFileSync, existsSync } from "fs";
import path from "path";
import kengeriRaw from "@/data/kengeri/places.json";
import { getCampusRecord, listCampuses } from "@/lib/store";
import type { CampusPlace } from "@/lib/types";

export type CampusConfig = {
  campus: string;
  name: string;
  plus_code?: string;
  centroid: {
    lat: number;
    lng: number;
  };
  fence_m: number;
  note?: string;
  places: CampusPlace[];
};

export const KENGERI_CAMPUS = kengeriRaw as unknown as CampusConfig;

const approvedSlugs = new Set<string>(["kengeri"]);

function refreshApprovedSlugsSync(): void {
  try {
    const dbPath = path.join(process.cwd(), "data/runtime/db.json");
    if (existsSync(dbPath)) {
      const raw = readFileSync(dbPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.campuses)) {
        for (const c of parsed.campuses) {
          if (c.status === "approved" && c.slug) {
            approvedSlugs.add(c.slug.toLowerCase().trim());
          }
        }
      }
    }
  } catch {
    // Ignore, keep existing in-memory set
  }
}

// Initial sync
refreshApprovedSlugsSync();

export function isCampusApproved(slug: string): boolean {
  const clean = slug.toLowerCase().trim();
  if (approvedSlugs.has(clean)) return true;
  refreshApprovedSlugsSync();
  return approvedSlugs.has(clean);
}

export function addApprovedSlug(slug: string): void {
  approvedSlugs.add(slug.toLowerCase().trim());
}

export async function getCampus(slug: string): Promise<CampusConfig | null> {
  const clean = slug.toLowerCase().trim();
  if (clean === "kengeri") {
    return KENGERI_CAMPUS;
  }

  const record = await getCampusRecord(clean);
  if (!record) {
    return null;
  }

  return {
    campus: record.slug,
    name: record.name,
    centroid: record.centroid,
    fence_m: record.fenceM,
    places: record.places,
  };
}

export async function listAllApprovedCampuses(): Promise<
  Array<{ slug: string; name: string; institutionType: string; city: string; placesCount: number }>
> {
  const dynamic = await listCampuses(false);
  const result = [
    {
      slug: "kengeri",
      name: "CHRIST (Deemed to be University), Bangalore Kengeri",
      institutionType: "university",
      city: "Bengaluru",
      placesCount: KENGERI_CAMPUS.places.length,
    },
    ...dynamic.map((c) => ({
      slug: c.slug,
      name: c.name,
      institutionType: c.institutionType,
      city: c.city,
      placesCount: c.places.length,
    })),
  ];

  return result;
}
