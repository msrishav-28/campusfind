import test from "node:test";
import assert from "node:assert/strict";
import { haversineMeters, resolvePlace } from "@/lib/location";
import { kengeriCampus } from "@/lib/kengeri";

test("Location: haversineMeters calculates distance accurately", () => {
  // Same point distance must be 0
  const d0 = haversineMeters(12.86285, 77.43812, 12.86285, 77.43812);
  assert.equal(Math.round(d0), 0);

  // Distance between Block I (12.86335, 77.43770) and Block IV (12.86240, 77.43785) is ~107m
  const d1 = haversineMeters(12.86335, 77.4377, 12.8624, 77.43785);
  assert.ok(d1 > 100 && d1 < 115, `Expected ~107m, got ${d1}`);
});

test("Location: resolvePlace snaps to nearest building if under 40 meters", () => {
  // Stand 15 meters from Block IV Cafeteria (12.86220, 77.43795)
  const lat = 12.86225;
  const lng = 77.43795;
  const res = resolvePlace(lat, lng);

  assert.equal(res.source, "gps_snap");
  assert.equal(res.place?.id, "cafe4");
  assert.equal(res.offCampus, false);
  assert.equal(res.suggest, false);
  assert.ok(res.distanceM !== null && res.distanceM < 40);
});

test("Location: resolvePlace suggests building if between 40m and 120m", () => {
  // Stand ~55m south of Football grounds (open space towards southern boundary)
  const ground = kengeriCampus.places.find((p) => p.id === "football")!;
  const lat = ground.lat - 0.0005; // ~55m south
  const lng = ground.lng;
  const res = resolvePlace(lat, lng);

  assert.equal(res.source, "gps_raw");
  assert.equal(res.suggest, true);
  assert.ok(res.place !== null);
  assert.equal(res.place.id, "football");
  assert.ok(res.distanceM !== null && res.distanceM >= 40 && res.distanceM <= 120);
});

test("Location: resolvePlace marks offCampus when outside 700m fence", () => {
  // Bangalore City Railway Station (~18 km away from Kengeri)
  const cityLat = 12.9781;
  const cityLng = 77.5696;
  const res = resolvePlace(cityLat, cityLng);

  assert.equal(res.offCampus, true);
  assert.equal(res.source, "gps_raw");
  assert.equal(res.place, null);
});
