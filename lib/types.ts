export const ITEM_CATEGORIES = [
  "id_card",
  "card",
  "phone",
  "earphones",
  "bottle",
  "umbrella",
  "bag",
  "wallet",
  "keys",
  "book",
  "bottle_other",
  "apparel",
  "other",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type ItemType = "lost" | "found";
export type ItemStatus = "open" | "pending_claim" | "recovered" | "expired" | "desk" | "hidden";
export type LocationSource = "gps_snap" | "gps_raw" | "picked" | "dragged";

export type DeviceSession = {
  id: string;
  userId: string | null;
  campusSlug: string;
  createdAt: string;
  lastSeenAt: string;
};

export type UserRecord = {
  id: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

export type OtpChallenge = {
  id: string;
  target: string;
  code: string;
  sessionId: string;
  createdAt: string;
};

export type ItemRecord = {
  id: string;
  campusSlug: string;
  type: ItemType;
  status: ItemStatus;
  title: string;
  category: ItemCategory;
  color: string | null;
  brand: string | null;
  tags: string[];
  caption: string | null;
  description: string | null;
  distinctive: string | null;
  photoPath: string | null;
  lat: number;
  lng: number;
  accuracyM: number | null;
  placeId: string | null;
  placeLabel: string | null;
  source: LocationSource;
  floor: number | null;
  note: string | null;
  secretHash: string | null;
  posterSessionId: string;
  posterUserId: string | null;
  claimCount: number;
  matchIds: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ClaimStatus = "pending" | "accepted" | "rejected";

export type ClaimRecord = {
  id: string;
  campusSlug: string;
  itemId: string;
  claimantUserId: string;
  message: string | null;
  secretAttemptOk: boolean;
  status: ClaimStatus;
  createdAt: string;
};

export type ReportReason = "spam" | "inappropriate" | "wrong" | "other";

export type ReportRecord = {
  id: string;
  campusSlug: string;
  itemId: string;
  sessionId: string;
  reason: ReportReason;
  createdAt: string;
};

export type PersistedDb = {
  sessions: DeviceSession[];
  users: UserRecord[];
  otpChallenges: OtpChallenge[];
  items: ItemRecord[];
  claims: ClaimRecord[];
  reports: ReportRecord[];
};
