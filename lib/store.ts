import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  ITEM_CATEGORIES,
  type ClaimRecord,
  type DeviceSession,
  type ItemRecord,
  type PersistedDb,
  type ReportReason,
  type UserRecord,
  type CampusRecord,
  type CampusPlace,
  type InstitutionType,
} from "@/lib/types";
import { hashSecret } from "@/lib/security";
import { hoursBetween, nowIso, plusDaysIso } from "@/lib/time";
import { haversineMeters } from "@/lib/location";
import { kengeriCampus } from "@/lib/kengeri";

const DB_PATH = path.join(process.cwd(), "data/runtime/db.json");

const EMPTY_DB: PersistedDb = {
  sessions: [],
  users: [],
  otpChallenges: [],
  items: [],
  claims: [],
  reports: [],
  campuses: [],
};

type NewItemInput = {
  campusSlug: string;
  posterSessionId: string;
  posterUserId: string | null;
  type: "lost" | "found";
  title: string;
  category: (typeof ITEM_CATEGORIES)[number];
  transcript?: string | null;
  lat: number;
  lng: number;
  accuracyM?: number | null;
  placeId?: string | null;
  placeLabel?: string | null;
  source?: "gps_snap" | "gps_raw" | "picked" | "dragged";
  floor?: number | null;
  note?: string | null;
  secret?: string | null;
  photoPath?: string | null;
  tags?: string[];
  color?: string | null;
  brand?: string | null;
};

async function loadDb(): Promise<PersistedDb> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as PersistedDb;
    return {
      ...EMPTY_DB,
      ...parsed,
      campuses: parsed.campuses ?? [],
      items: [...(parsed.items ?? []), ...seedItems(parsed.items ?? [])],
    };
  } catch {
    return { ...EMPTY_DB, campuses: [], items: seedItems([]) };
  }
}

async function saveDb(db: PersistedDb): Promise<void> {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function seedItems(existing: ItemRecord[]): ItemRecord[] {
  if (existing.length > 0) {
    return [];
  }

  const now = nowIso();
  const make = (
    type: "lost" | "found",
    title: string,
    placeId: string,
    category: (typeof ITEM_CATEGORIES)[number]
  ): ItemRecord | null => {
    const place = kengeriCampus.places.find((p) => p.id === placeId);
    if (!place) {
      return null;
    }

    return {
      id: randomUUID(),
      campusSlug: "kengeri",
      type,
      status: "open",
      title,
      category,
      color: null,
      brand: null,
      tags: [title.toLowerCase()],
      caption: null,
      description: "seed",
      distinctive: null,
      photoPath: null,
      lat: place.lat,
      lng: place.lng,
      accuracyM: 12,
      placeId: place.id,
      placeLabel: place.name,
      source: "picked",
      floor: null,
      note: null,
      secretHash: null,
      posterSessionId: "seed",
      posterUserId: null,
      claimCount: 0,
      matchIds: [],
      expiresAt: plusDaysIso(now, 14),
      createdAt: now,
      updatedAt: now,
    };
  };

  return [
    make("found", "Blue water bottle", "cafe4", "bottle"),
    make("found", "Black umbrella", "library", "umbrella"),
    make("lost", "Brown wallet", "block1", "wallet"),
    make("lost", "White earphones", "block4", "earphones"),
  ].filter((v): v is ItemRecord => v !== null);
}

function sanitizeItem(item: ItemRecord): Omit<ItemRecord, "secretHash" | "posterSessionId" | "posterUserId"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { secretHash, posterSessionId, posterUserId, ...rest } = item;
  return rest;
}

function rankMatch(a: ItemRecord, b: ItemRecord): number {
  const samePlace = a.placeId && b.placeId && a.placeId === b.placeId ? 3 : 0;
  const nearDistance = haversineMeters(a.lat, a.lng, b.lat, b.lng) < 150 ? 2 : 0;
  const setA = new Set(a.tags.map((tag) => tag.toLowerCase()));
  const setB = new Set(b.tags.map((tag) => tag.toLowerCase()));
  const intersection = [...setA].filter((tag) => setB.has(tag)).length;
  const union = new Set([...setA, ...setB]).size || 1;
  const jaccard = 1.5 * (intersection / union);
  const timeDecay = 0.5 * Math.max(0, 1 - hoursBetween(a.createdAt, b.createdAt) / 336);

  return samePlace + nearDistance + jaccard + timeDecay;
}

function recomputeMatchesForItem(db: PersistedDb, itemId: string): void {
  const item = db.items.find((it) => it.id === itemId);
  if (!item) {
    return;
  }

  const now = Date.now();
  const candidates = db.items.filter((other) => {
    if (other.id === item.id) return false;
    if (other.campusSlug !== item.campusSlug) return false;
    if (other.type === item.type) return false;
    if (other.status !== "open") return false;
    return now - new Date(other.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000;
  });

  item.matchIds = candidates
    .map((candidate) => ({ id: candidate.id, score: rankMatch(item, candidate) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.id);
}

export async function getOrCreateSession(campusSlug: string, existingSessionId?: string): Promise<DeviceSession> {
  const db = await loadDb();
  const now = nowIso();

  let session = db.sessions.find((s) => s.id === existingSessionId);
  if (!session) {
    session = {
      id: randomUUID(),
      userId: null,
      campusSlug,
      createdAt: now,
      lastSeenAt: now,
    };
    db.sessions.push(session);
  } else {
    session.lastSeenAt = now;
  }

  await saveDb(db);
  return session;
}

export async function createOtp(target: string, sessionId: string): Promise<{ challengeId: string; code: string }> {
  const db = await loadDb();
  const challengeId = randomUUID();
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  db.otpChallenges.push({ id: challengeId, target, code, sessionId, createdAt: nowIso() });
  await saveDb(db);
  return { challengeId, code };
}

function getOrCreateUser(db: PersistedDb, target: string): UserRecord {
  const isEmail = target.includes("@");
  let user = db.users.find((u) => (isEmail ? u.email === target : u.phone === target));

  if (!user) {
    user = {
      id: randomUUID(),
      phone: isEmail ? null : target,
      email: isEmail ? target : null,
      createdAt: nowIso(),
    };
    db.users.push(user);
  }

  return user;
}

export async function verifyOtp(challengeId: string, code: string): Promise<{ ok: boolean; sessionId?: string; userId?: string }> {
  const db = await loadDb();
  const challenge = db.otpChallenges.find((ch) => ch.id === challengeId);
  if (!challenge || challenge.code !== code) {
    return { ok: false };
  }

  const session = db.sessions.find((s) => s.id === challenge.sessionId);
  if (!session) {
    return { ok: false };
  }

  const user = getOrCreateUser(db, challenge.target);
  session.userId = user.id;
  db.otpChallenges = db.otpChallenges.filter((ch) => ch.id !== challenge.id);
  await saveDb(db);
  return { ok: true, sessionId: session.id, userId: user.id };
}

export async function createItem(input: NewItemInput): Promise<ItemRecord> {
  const db = await loadDb();
  const now = nowIso();
  const words = input.title
    .toLowerCase()
    .split(/[\s,.-]+/)
    .filter((w) => w.length > 2);
  const derivedTags = Array.from(new Set([...(input.tags ?? []), input.category, ...words]));

  const item: ItemRecord = {
    id: randomUUID(),
    campusSlug: input.campusSlug,
    type: input.type,
    status: "open",
    title: input.title,
    category: input.category,
    color: input.color ?? null,
    brand: input.brand ?? null,
    tags: derivedTags,
    caption: null,
    description: input.transcript ?? null,
    distinctive: null,
    photoPath: input.photoPath ?? null,
    lat: input.lat,
    lng: input.lng,
    accuracyM: input.accuracyM ?? null,
    placeId: input.placeId ?? null,
    placeLabel: input.placeLabel ?? null,
    source: input.source ?? "gps_raw",
    floor: input.floor ?? null,
    note: input.note ?? null,
    secretHash: input.secret ? hashSecret(input.secret) : null,
    posterSessionId: input.posterSessionId,
    posterUserId: input.posterUserId,
    claimCount: 0,
    matchIds: [],
    expiresAt: plusDaysIso(now, 14),
    createdAt: now,
    updatedAt: now,
  };

  db.items.unshift(item);
  recomputeMatchesForItem(db, item.id);
  db.items
    .filter((other) => other.type !== item.type && other.campusSlug === item.campusSlug && other.status === "open")
    .forEach((other) => recomputeMatchesForItem(db, other.id));
  await saveDb(db);
  return item;
}

export type ItemFilters = {
  campusSlug: string;
  type?: "lost" | "found";
  status?: ItemRecord["status"];
  q?: string;
  near?: { lat: number; lng: number; radiusM: number };
};

export async function listItems(filters: ItemFilters): Promise<ReturnType<typeof sanitizeItem>[]> {
  const db = await loadDb();
  const q = filters.q?.trim().toLowerCase();

  const result = db.items
    .filter((item) => item.campusSlug === filters.campusSlug)
    .filter((item) => (filters.type ? item.type === filters.type : true))
    .filter((item) => (filters.status ? item.status === filters.status : ["open", "pending_claim", "recovered"].includes(item.status)))
    .filter((item) => {
      if (!q) return true;
      return [item.title, item.placeLabel ?? "", item.category, ...item.tags].join(" ").toLowerCase().includes(q);
    })
    .filter((item) => {
      if (!filters.near) return true;
      return haversineMeters(filters.near.lat, filters.near.lng, item.lat, item.lng) < filters.near.radiusM;
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map(sanitizeItem);

  return result;
}

export async function getItem(campusSlug: string, itemId: string): Promise<(ReturnType<typeof sanitizeItem> & { matches: ReturnType<typeof sanitizeItem>[] }) | null> {
  const db = await loadDb();
  const item = db.items.find((it) => it.campusSlug === campusSlug && it.id === itemId);
  if (!item || item.status === "hidden") {
    return null;
  }

  const matches = item.matchIds
    .map((id) => db.items.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is ItemRecord => Boolean(candidate))
    .map(sanitizeItem);

  return { ...sanitizeItem(item), matches };
}

export async function patchItem(
  campusSlug: string,
  itemId: string,
  posterSessionId: string,
  patch: Partial<Pick<ItemRecord, "title" | "category" | "note" | "floor" | "placeId" | "placeLabel" | "lat" | "lng" | "source">>
): Promise<ReturnType<typeof sanitizeItem> | null> {
  const db = await loadDb();
  const item = db.items.find((it) => it.id === itemId && it.campusSlug === campusSlug);
  if (!item || item.posterSessionId !== posterSessionId || item.status !== "open") {
    return null;
  }

  if (patch.title) item.title = patch.title;
  if (patch.category) item.category = patch.category;
  if (patch.note !== undefined) item.note = patch.note;
  if (patch.floor !== undefined) item.floor = patch.floor;
  if (patch.placeId !== undefined) item.placeId = patch.placeId;
  if (patch.placeLabel !== undefined) item.placeLabel = patch.placeLabel;
  if (patch.lat !== undefined) item.lat = patch.lat;
  if (patch.lng !== undefined) item.lng = patch.lng;
  if (patch.source !== undefined) item.source = patch.source;

  item.updatedAt = nowIso();
  recomputeMatchesForItem(db, item.id);
  await saveDb(db);
  return sanitizeItem(item);
}

export async function createReport(campusSlug: string, itemId: string, sessionId: string, reason: ReportReason): Promise<boolean> {
  const db = await loadDb();
  const item = db.items.find((it) => it.id === itemId && it.campusSlug === campusSlug);
  if (!item) {
    return false;
  }

  const exists = db.reports.find((rep) => rep.itemId === itemId && rep.sessionId === sessionId);
  if (exists) {
    return true;
  }

  db.reports.push({ id: randomUUID(), campusSlug, itemId, sessionId, reason, createdAt: nowIso() });
  const uniqueSessions = new Set(db.reports.filter((rep) => rep.itemId === itemId).map((rep) => rep.sessionId)).size;
  if (uniqueSessions >= 3) {
    item.status = "hidden";
  }

  item.updatedAt = nowIso();
  await saveDb(db);
  return true;
}

export async function createClaim(campusSlug: string, itemId: string, claimantUserId: string, secret: string | null, message: string | null): Promise<ClaimRecord | null> {
  const db = await loadDb();
  const item = db.items.find((it) => it.id === itemId && it.campusSlug === campusSlug);
  if (!item || item.status !== "open") {
    return null;
  }

  const attemptOk = item.secretHash ? Boolean(secret && hashSecret(secret) === item.secretHash) : false;
  const claim: ClaimRecord = {
    id: randomUUID(),
    campusSlug,
    itemId,
    claimantUserId,
    message,
    secretAttemptOk: attemptOk,
    status: "pending",
    createdAt: nowIso(),
  };

  db.claims.push(claim);
  item.claimCount += 1;
  await saveDb(db);
  return claim;
}

export async function updateClaimStatus(campusSlug: string, claimId: string, status: "accepted" | "rejected", actorSessionId: string): Promise<boolean> {
  const db = await loadDb();
  const claim = db.claims.find((c) => c.id === claimId && c.campusSlug === campusSlug);
  if (!claim) {
    return false;
  }

  const item = db.items.find((it) => it.id === claim.itemId && it.campusSlug === campusSlug);
  if (!item || item.posterSessionId !== actorSessionId) {
    return false;
  }

  claim.status = status;
  if (status === "accepted") {
    item.status = "recovered";
  }

  item.updatedAt = nowIso();
  await saveDb(db);
  return true;
}

export async function listClaimsForViewer(campusSlug: string, sessionId: string, userId: string | null): Promise<ClaimRecord[]> {
  const db = await loadDb();
  const ownItemIds = new Set(
    db.items
      .filter((it) => it.campusSlug === campusSlug)
      .filter((it) => it.posterSessionId === sessionId || (Boolean(userId) && it.posterUserId === userId))
      .map((it) => it.id)
  );

  return db.claims
    .filter((claim) => claim.campusSlug === campusSlug && ownItemIds.has(claim.itemId))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function listMine(campusSlug: string, sessionId: string, userId: string | null): Promise<ReturnType<typeof sanitizeItem>[]> {
  const db = await loadDb();
  return db.items
    .filter((item) => item.campusSlug === campusSlug)
    .filter((item) => item.posterSessionId === sessionId || (Boolean(userId) && item.posterUserId === userId))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map(sanitizeItem);
}

export async function deskItems(campusSlug: string): Promise<ReturnType<typeof sanitizeItem>[]> {
  const db = await loadDb();
  return db.items
    .filter((item) => item.campusSlug === campusSlug && ["expired", "desk"].includes(item.status))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map(sanitizeItem);
}

export async function setDeskStatus(campusSlug: string, itemId: string, status: "desk" | "recovered" | "hidden"): Promise<boolean> {
  const db = await loadDb();
  const item = db.items.find((it) => it.id === itemId && it.campusSlug === campusSlug);
  if (!item) return false;

  item.status = status;
  item.updatedAt = nowIso();
  await saveDb(db);
  return true;
}

export async function expireItems(): Promise<number> {
  const db = await loadDb();
  const now = Date.now();
  let count = 0;
  db.items.forEach((item) => {
    if (item.status === "open" && new Date(item.expiresAt).getTime() < now) {
      item.status = "expired";
      item.updatedAt = nowIso();
      count += 1;
    }
  });

  if (count > 0) {
    await saveDb(db);
  }

  return count;
}

export type NewCampusInput = {
  slug: string;
  name: string;
  institutionType: InstitutionType;
  city: string;
  contactEmail: string;
  contactPhone: string;
  deskPin?: string;
  centroid?: { lat: number; lng: number };
  centerLat?: number;
  centerLng?: number;
  fenceM?: number;
  places?: CampusPlace[];
  initialPlaces?: CampusPlace[];
};

export async function registerCampus(input: NewCampusInput): Promise<{ ok: boolean; message?: string; campus?: CampusRecord }> {
  const db = await loadDb();
  const slug = input.slug.toLowerCase().trim();
  if (slug === "kengeri" || db.campuses.some((c) => c.slug === slug)) {
    return { ok: false, message: "Campus slug already registered" };
  }

  const centroid = input.centroid ?? {
    lat: input.centerLat ?? 12.8615,
    lng: input.centerLng ?? 77.4385,
  };

  const placesList = (input.places && input.places.length > 0)
    ? input.places
    : (input as unknown as { initialPlaces?: CampusPlace[] }).initialPlaces;

  const defaultPlaces: CampusPlace[] = placesList && placesList.length > 0 ? placesList : [
    { id: "gate", name: "Main Gate", kind: "gate", aliases: ["entrance"], lat: centroid.lat, lng: centroid.lng, floors: [] },
    { id: "admin", name: "Administrative Block", kind: "block", aliases: ["admin office"], lat: centroid.lat + 0.0002, lng: centroid.lng, floors: [0, 1, 2] },
    { id: "library", name: "Central Library", kind: "indoor", aliases: ["library", "lib"], lat: centroid.lat + 0.0001, lng: centroid.lng + 0.0002, floors: [0, 1] },
    { id: "canteen", name: "Campus Cafeteria", kind: "food", aliases: ["canteen", "cafe", "mess"], lat: centroid.lat - 0.0001, lng: centroid.lng - 0.0001, floors: [0] },
    { id: "ground", name: "Sports Ground", kind: "sport", aliases: ["football ground", "sports"], lat: centroid.lat - 0.0003, lng: centroid.lng, floors: [] },
  ];

  const now = nowIso();
  const campus: CampusRecord = {
    slug,
    name: input.name.trim(),
    institutionType: input.institutionType,
    city: input.city.trim(),
    status: "pending_approval",
    contactEmail: input.contactEmail.trim().toLowerCase(),
    contactPhone: input.contactPhone.trim(),
    deskPin: input.deskPin || "1234",
    centroid,
    fenceM: input.fenceM ?? 700,
    places: defaultPlaces,
    createdAt: now,
    approvedAt: null,
  };

  db.campuses.push(campus);
  await saveDb(db);
  return { ok: true, campus };
}

export async function approveCampus(slug: string, deskPin?: string): Promise<boolean> {
  const db = await loadDb();
  const campus = db.campuses.find((c) => c.slug === slug.toLowerCase().trim());
  if (!campus) return false;

  campus.status = "approved";
  campus.approvedAt = nowIso();
  if (deskPin) {
    campus.deskPin = deskPin;
  }
  await saveDb(db);
  return true;
}

export async function getCampusRecord(slug: string): Promise<CampusRecord | null> {
  const db = await loadDb();
  const found = db.campuses.find((c) => c.slug === slug.toLowerCase().trim() && c.status === "approved");
  return found ?? null;
}

export async function listCampuses(includePending = false): Promise<CampusRecord[]> {
  const db = await loadDb();
  return db.campuses.filter((c) => includePending || c.status === "approved");
}

