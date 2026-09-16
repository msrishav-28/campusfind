export type ApiItem = {
  id: string;
  type: "lost" | "found";
  status: "open" | "pending_claim" | "recovered" | "expired" | "desk" | "hidden";
  title: string;
  category: string;
  tags: string[];
  photoPath: string | null;
  lat: number;
  lng: number;
  accuracyM: number | null;
  placeId: string | null;
  placeLabel: string | null;
  source: "gps_snap" | "gps_raw" | "picked" | "dragged";
  floor: number | null;
  note: string | null;
  claimCount: number;
  createdAt: string;
};
