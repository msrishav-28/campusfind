import { kengeriCampus } from "@/lib/kengeri";

type Place = (typeof kengeriCampus.places)[number];

export type PlaceResolution = {
  place: Place | null;
  source: "gps_snap" | "gps_raw";
  offCampus: boolean;
  suggest: boolean;
  distanceM: number | null;
};

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolvePlace(lat: number, lng: number): PlaceResolution {
  const offCampus =
    haversineMeters(lat, lng, kengeriCampus.centroid.lat, kengeriCampus.centroid.lng) > kengeriCampus.fence_m;

  const ranked = kengeriCampus.places
    .map((place) => ({ place, d: haversineMeters(lat, lng, place.lat, place.lng) }))
    .sort((a, b) => a.d - b.d);

  const nearest = ranked[0];
  if (!nearest) {
    return { place: null, source: "gps_raw", offCampus, suggest: false, distanceM: null };
  }

  if (nearest.d < 40) {
    return { place: nearest.place, source: "gps_snap", offCampus, suggest: false, distanceM: nearest.d };
  }

  if (nearest.d < 120) {
    return { place: nearest.place, source: "gps_raw", offCampus, suggest: true, distanceM: nearest.d };
  }

  return { place: null, source: "gps_raw", offCampus, suggest: false, distanceM: nearest.d };
}
