import type { DeviceSession, ItemRecord } from "@/lib/types";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function supabaseFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; count?: number | null }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { data: null, error: "Supabase not configured" };
  }

  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);
  headers.set("Content-Type", "application/json");

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      return { data: null, error: `Supabase error (${res.status}): ${errText}` };
    }

    if (res.status === 204) {
      return { data: null, error: null };
    }

    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Network failure" };
  }
}

// Map database column names (snake_case) to typescript types (camelCase)
export function mapItemFromDb(row: Record<string, unknown>): ItemRecord {
  return {
    id: String(row.id),
    campusSlug: String(row.campus_slug),
    type: row.type as ItemRecord["type"],
    status: row.status as ItemRecord["status"],
    title: String(row.title),
    category: row.category as ItemRecord["category"],
    color: (row.color as string) || null,
    brand: (row.brand as string) || null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    caption: (row.caption as string) || null,
    description: (row.description as string) || null,
    distinctive: (row.distinctive as string) || null,
    photoPath: (row.photo_path as string) || null,
    lat: Number(row.lat),
    lng: Number(row.lng),
    accuracyM: row.accuracy_m !== null && row.accuracy_m !== undefined ? Number(row.accuracy_m) : null,
    placeId: (row.place_id as string) || null,
    placeLabel: (row.place_label as string) || null,
    source: row.source as ItemRecord["source"],
    floor: row.floor !== null && row.floor !== undefined ? Number(row.floor) : null,
    note: (row.note as string) || null,
    secretHash: (row.secret_hash as string) || null,
    posterSessionId: String(row.poster_session_id),
    posterUserId: (row.poster_user_id as string) || null,
    claimCount: Number(row.claim_count || 0),
    matchIds: Array.isArray(row.match_ids) ? (row.match_ids as string[]) : [],
    expiresAt: String(row.expires_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapItemToDb(item: ItemRecord): Record<string, unknown> {
  return {
    id: item.id,
    campus_slug: item.campusSlug,
    type: item.type,
    status: item.status,
    title: item.title,
    category: item.category,
    color: item.color,
    brand: item.brand,
    tags: item.tags,
    caption: item.caption,
    description: item.description,
    distinctive: item.distinctive,
    photo_path: item.photoPath,
    lat: item.lat,
    lng: item.lng,
    accuracy_m: item.accuracyM,
    place_id: item.placeId,
    place_label: item.placeLabel,
    source: item.source,
    floor: item.floor,
    note: item.note,
    secret_hash: item.secretHash,
    poster_session_id: item.posterSessionId,
    poster_user_id: item.posterUserId,
    claim_count: item.claimCount,
    match_ids: item.matchIds,
    expires_at: item.expiresAt,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export const supabaseDb = {
  async getSession(id: string): Promise<DeviceSession | null> {
    const res = await supabaseFetch<Record<string, unknown>[]>(`sessions?id=eq.${encodeURIComponent(id)}&limit=1`);
    if (!res.data || res.data.length === 0) return null;
    const row = res.data[0];
    return {
      id: String(row.id),
      userId: (row.user_id as string) || null,
      campusSlug: String(row.campus_slug),
      createdAt: String(row.created_at),
      lastSeenAt: String(row.last_seen_at),
    };
  },

  async saveSession(session: DeviceSession): Promise<void> {
    await supabaseFetch("sessions", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        id: session.id,
        user_id: session.userId,
        campus_slug: session.campusSlug,
        created_at: session.createdAt,
        last_seen_at: session.lastSeenAt,
      }),
    });
  },

  async insertItem(item: ItemRecord): Promise<void> {
    await supabaseFetch("items", {
      method: "POST",
      body: JSON.stringify(mapItemToDb(item)),
    });
  },

  async updateItem(id: string, updates: Partial<ItemRecord>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.tags) dbUpdates.tags = updates.tags;
    if (updates.matchIds) dbUpdates.match_ids = updates.matchIds;
    if (updates.claimCount !== undefined) dbUpdates.claim_count = updates.claimCount;
    if (updates.updatedAt) dbUpdates.updated_at = updates.updatedAt;

    await supabaseFetch(`items?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(dbUpdates),
    });
  },

  async getItem(campusSlug: string, id: string): Promise<ItemRecord | null> {
    const res = await supabaseFetch<Record<string, unknown>[]>(
      `items?campus_slug=eq.${encodeURIComponent(campusSlug)}&id=eq.${encodeURIComponent(id)}&limit=1`
    );
    if (!res.data || res.data.length === 0) return null;
    return mapItemFromDb(res.data[0]);
  },

  async listItems(campusSlug: string, type?: string, status?: string): Promise<ItemRecord[]> {
    let query = `items?campus_slug=eq.${encodeURIComponent(campusSlug)}&order=created_at.desc`;
    if (type) query += `&type=eq.${encodeURIComponent(type)}`;
    if (status) {
      query += `&status=eq.${encodeURIComponent(status)}`;
    } else {
      query += `&status=neq.hidden`;
    }

    const res = await supabaseFetch<Record<string, unknown>[]>(query);
    if (!res.data) return [];
    return res.data.map(mapItemFromDb);
  },

  async uploadPhoto(campusSlug: string, photoId: string, bytes: Buffer, contentType: string): Promise<string | null> {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    const path = `campuses/${campusSlug}/items/${photoId}.jpg`;
    const url = `${SUPABASE_URL}/storage/v1/object/campuses/${path}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: new Uint8Array(bytes),
      });

      if (!res.ok) return null;
      return `${SUPABASE_URL}/storage/v1/object/public/campuses/${path}`;
    } catch {
      return null;
    }
  },
};
