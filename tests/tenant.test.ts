import test from "node:test";
import assert from "node:assert/strict";
import {
  registerCampus,
  approveCampus,
  getCampusRecord,
  createItem,
  listItems,
  getItem,
  deskItems,
  getOrCreateSession,
} from "@/lib/store";
import { isCampusApproved, getCampus, addApprovedSlug } from "@/lib/campus";
import { resolvePlace } from "@/lib/location";

test("Multi-Tenant: Register and approve institutional campus", async () => {
  const testSlug = `test-univ-${Date.now()}`;
  const regResult = await registerCampus({
    name: "Apex University of Science",
    slug: testSlug,
    institutionType: "university",
    city: "Bengaluru",
    contactEmail: "admin@apex.edu.in",
    contactPhone: "+919876543210",
    centerLat: 12.9716,
    centerLng: 77.5946,
    initialPlaces: [
      {
        id: "apex-block-a",
        name: "Block A - Academic Complex",
        kind: "block",
        lat: 12.9716,
        lng: 77.5946,
        aliases: ["academic block", "main foyer"],
        floors: [0, 1, 2],
      },
    ],
  });

  assert.equal(regResult.ok, true);
  assert.ok(regResult.campus);
  assert.equal(regResult.campus.slug, testSlug);
  assert.equal(regResult.campus.status, "pending_approval");

  // Before approval, isCampusApproved returns false
  assert.equal(isCampusApproved(testSlug), false);

  // Duplicate registration must fail
  const dupResult = await registerCampus({
    name: "Apex University Duplicate",
    slug: testSlug,
    institutionType: "university",
    city: "Bengaluru",
    contactEmail: "admin2@apex.edu.in",
    contactPhone: "+919876543211",
    centerLat: 12.9716,
    centerLng: 77.5946,
  });
  assert.equal(dupResult.ok, false);
  assert.equal(dupResult.message, "Campus slug already registered");

  // Approve campus
  const approved = await approveCampus(testSlug);
  assert.equal(approved, true);
  addApprovedSlug(testSlug);

  // Post approval verification
  assert.equal(isCampusApproved(testSlug), true);

  const campusRecord = await getCampusRecord(testSlug);
  assert.ok(campusRecord);
  assert.equal(campusRecord.status, "approved");

  const campusConfig = await getCampus(testSlug);
  assert.ok(campusConfig);
  assert.equal(campusConfig.campus, testSlug);
  assert.equal(campusConfig.name, "Apex University of Science");
  assert.equal(campusConfig.places.length, 1);
  assert.equal(campusConfig.places[0].id, "apex-block-a");
});

test("Multi-Tenant: Strict data partition between campuses", async () => {
  const campusA = `univ-a-${Date.now()}`;
  const campusB = `univ-b-${Date.now()}`;

  // Register and approve both campuses
  await registerCampus({
    name: "University Alpha",
    slug: campusA,
    institutionType: "university",
    city: "Bengaluru",
    contactEmail: "alpha@univ.edu",
    contactPhone: "+919000000001",
    centerLat: 12.9000,
    centerLng: 77.5000,
  });
  await approveCampus(campusA);
  addApprovedSlug(campusA);

  await registerCampus({
    name: "University Beta",
    slug: campusB,
    institutionType: "university",
    city: "Bengaluru",
    contactEmail: "beta@univ.edu",
    contactPhone: "+919000000002",
    centerLat: 12.8000,
    centerLng: 77.4000,
  });
  await approveCampus(campusB);
  addApprovedSlug(campusB);

  const sessionA = await getOrCreateSession(campusA);
  const sessionB = await getOrCreateSession(campusB);

  // Create Item in Alpha
  const itemAlpha = await createItem({
    campusSlug: campusA,
    posterSessionId: sessionA.id,
    posterUserId: null,
    type: "found",
    title: "Alpha Silver Key Ring",
    category: "keys",
    lat: 12.9001,
    lng: 77.5001,
  });

  // Create Item in Beta
  const itemBeta = await createItem({
    campusSlug: campusB,
    posterSessionId: sessionB.id,
    posterUserId: null,
    type: "found",
    title: "Beta Black Laptop Charger",
    category: "other",
    lat: 12.8001,
    lng: 77.4001,
  });

  // 1. Cross-campus list isolation
  const listAlpha = await listItems({ campusSlug: campusA });
  const listBeta = await listItems({ campusSlug: campusB });

  assert.ok(listAlpha.some((it) => it.id === itemAlpha.id));
  assert.ok(!listAlpha.some((it) => it.id === itemBeta.id), "Campus Alpha list must not contain Beta items");

  assert.ok(listBeta.some((it) => it.id === itemBeta.id));
  assert.ok(!listBeta.some((it) => it.id === itemAlpha.id), "Campus Beta list must not contain Alpha items");

  // 2. Direct getItem isolation
  const fetchedAlphaFromBeta = await getItem(campusB, itemAlpha.id);
  assert.equal(fetchedAlphaFromBeta, null, "Querying Alpha item under Beta tenant scope must return null");

  const fetchedBetaFromAlpha = await getItem(campusA, itemBeta.id);
  assert.equal(fetchedBetaFromAlpha, null, "Querying Beta item under Alpha tenant scope must return null");

  // 3. Desk query isolation
  const deskAlpha = await deskItems(campusA);
  const deskBeta = await deskItems(campusB);
  assert.ok(!deskAlpha.some((it) => it.campusSlug === campusB));
  assert.ok(!deskBeta.some((it) => it.campusSlug === campusA));
});

test("Multi-Tenant: Match proposal isolation across tenants", async () => {
  const tenantX = `univ-x-${Date.now()}`;
  const tenantY = `univ-y-${Date.now()}`;

  await registerCampus({
    name: "Institute X",
    slug: tenantX,
    institutionType: "college",
    city: "Bengaluru",
    contactEmail: "x@inst.edu",
    contactPhone: "+919111111111",
    centerLat: 12.9500,
    centerLng: 77.5500,
  });
  await approveCampus(tenantX);
  addApprovedSlug(tenantX);

  await registerCampus({
    name: "Institute Y",
    slug: tenantY,
    institutionType: "college",
    city: "Bengaluru",
    contactEmail: "y@inst.edu",
    contactPhone: "+919222222222",
    centerLat: 12.9500,
    centerLng: 77.5500,
  });
  await approveCampus(tenantY);
  addApprovedSlug(tenantY);

  const sessionX = await getOrCreateSession(tenantX);
  const sessionY = await getOrCreateSession(tenantY);

  // Lost item in Tenant X
  const lostX = await createItem({
    campusSlug: tenantX,
    posterSessionId: sessionX.id,
    posterUserId: null,
    type: "lost",
    title: "AirPods Pro White Case",
    category: "earphones",
    lat: 12.9501,
    lng: 77.5501,
  });

  // Found identical item in Tenant Y (different campus, exact same coords and title)
  const foundY = await createItem({
    campusSlug: tenantY,
    posterSessionId: sessionY.id,
    posterUserId: null,
    type: "found",
    title: "AirPods Pro White Case",
    category: "earphones",
    lat: 12.9501,
    lng: 77.5501,
  });

  // Found matching item in Tenant X (same campus)
  const foundX = await createItem({
    campusSlug: tenantX,
    posterSessionId: sessionX.id,
    posterUserId: null,
    type: "found",
    title: "AirPods Pro White Case",
    category: "earphones",
    lat: 12.9501,
    lng: 77.5501,
  });

  // Fetch updated items
  const updatedLostX = await getItem(tenantX, lostX.id);
  assert.ok(updatedLostX);

  const candidateIds = updatedLostX.matches.map((m) => m.id);

  // Must propose match with foundX from Tenant X
  assert.ok(
    candidateIds.includes(foundX.id),
    "Items in same tenant with matching parameters must produce match proposal"
  );

  // Must NEVER propose match with foundY from Tenant Y
  assert.ok(
    !candidateIds.includes(foundY.id),
    "Items across differing tenants must never be matched"
  );
});

test("Multi-Tenant: Gazetteer resolution with tenant-specific places", async () => {
  const customCampus = {
    campus: "custom-school",
    name: "St. Xavier's Academy",
    centroid: { lat: 12.9352, lng: 77.6245 },
    fence_m: 600,
    places: [
      {
        id: "xavier-science-lab",
        name: "Father Joseph Science Block",
        kind: "block" as const,
        lat: 12.9352,
        lng: 77.6245,
        aliases: ["physics lab", "bio lab"],
        floors: [0, 1],
      },
    ],
  };

  // 10 meters from Science Block in Custom Campus
  const snapResult = resolvePlace(12.93525, 77.62455, customCampus);
  assert.ok(snapResult.place);
  assert.equal(snapResult.place.id, "xavier-science-lab");
  assert.equal(snapResult.source, "gps_snap");
  assert.equal(snapResult.place.name, "Father Joseph Science Block");
});
