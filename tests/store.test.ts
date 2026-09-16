import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import {
  getOrCreateSession,
  createOtp,
  verifyOtp,
  createItem,
  listItems,
  getItem,
  patchItem,
  createClaim,
  updateClaimStatus,
  createReport,
  deskItems,
  setDeskStatus,
  expireItems,
} from "@/lib/store";
import { checkDeskPin } from "@/lib/http";

test("Store: getOrCreateSession creates and retrieves device sessions", async () => {
  const session1 = await getOrCreateSession("kengeri");
  assert.ok(session1.id);
  assert.equal(session1.campusSlug, "kengeri");
  assert.equal(session1.userId, null);

  // Calling with existing id returns same session and updates timestamp
  const session2 = await getOrCreateSession("kengeri", session1.id);
  assert.equal(session2.id, session1.id);
});

test("Store: createOtp and verifyOtp verify user identity and link session", async () => {
  const session = await getOrCreateSession("kengeri");
  const { challengeId, code } = await createOtp("student@christuniversity.in", session.id);

  assert.ok(challengeId);
  assert.equal(code.length, 6);

  // Wrong code fails
  const failed = await verifyOtp(challengeId, "000000");
  assert.equal(failed.ok, false);

  // Correct code succeeds and links user
  const success = await verifyOtp(challengeId, code);
  assert.equal(success.ok, true);
  assert.ok(success.userId);
  assert.equal(success.sessionId, session.id);
});

test("Store: createItem derives tags, hashes secret, and sanitizes output on getItem", async () => {
  const session = await getOrCreateSession("kengeri");
  const item = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "found",
    title: "Blue Milton water bottle",
    category: "bottle",
    lat: 12.8622,
    lng: 77.4379,
    placeId: "cafe4",
    placeLabel: "Block IV Cafeteria",
    secret: "Dent on the silver cap",
  });

  assert.ok(item.id);
  assert.equal(item.status, "open");
  assert.ok(item.secretHash, "Secret must be hashed");
  assert.notEqual(item.secretHash, "Dent on the silver cap", "Plain secret must never be stored");
  assert.ok(item.tags.includes("bottle"), "Derived tags must include category");
  assert.ok(item.tags.includes("milton"), "Derived tags must include title words");

  // Fetching via getItem sanitizes private fields
  const fetched = await getItem("kengeri", item.id);
  assert.ok(fetched);
  assert.equal((fetched as unknown as { secretHash?: string }).secretHash, undefined, "secretHash must be stripped");
  assert.equal((fetched as unknown as { posterSessionId?: string }).posterSessionId, undefined, "posterSessionId must be stripped");
});

test("Store: claim workflow tests secret verification and poster accept", async () => {
  const posterSession = await getOrCreateSession("kengeri");
  const item = await createItem({
    campusSlug: "kengeri",
    posterSessionId: posterSession.id,
    posterUserId: null,
    type: "found",
    title: "Silver MacBook Air charger",
    category: "other",
    lat: 12.86238,
    lng: 77.4377,
    placeId: "library",
    secret: "black tape on cable",
  });

  const claimantUserId = "user-claimant-123";

  // Claim with incorrect secret
  const wrongClaim = await createClaim("kengeri", item.id, claimantUserId, "yellow tape", "I left it there");
  assert.ok(wrongClaim);
  assert.equal(wrongClaim.secretAttemptOk, false);

  // Claim with matching secret
  const rightClaim = await createClaim("kengeri", item.id, claimantUserId, "Black Tape On Cable", "That is mine");
  assert.ok(rightClaim);
  assert.equal(rightClaim.secretAttemptOk, true);

  // Non-poster cannot accept claim
  const nonPoster = await getOrCreateSession("kengeri");
  const blocked = await updateClaimStatus("kengeri", rightClaim.id, "accepted", nonPoster.id);
  assert.equal(blocked, false);

  // Poster accepts claim -> item status becomes recovered
  const accepted = await updateClaimStatus("kengeri", rightClaim.id, "accepted", posterSession.id);
  assert.equal(accepted, true);

  const updatedItem = await getItem("kengeri", item.id);
  assert.equal(updatedItem?.status, "recovered");
});

test("Store: 3 distinct abuse reports hide an item", async () => {
  const session = await getOrCreateSession("kengeri");
  const item = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "found",
    title: "Questionable post for testing",
    category: "other",
    lat: 12.862,
    lng: 77.438,
  });

  const s1 = "session-reporter-1";
  const s2 = "session-reporter-2";
  const s3 = "session-reporter-3";

  await createReport("kengeri", item.id, s1, "spam");
  await createReport("kengeri", item.id, s1, "spam"); // duplicate session does not double count
  let check = await getItem("kengeri", item.id);
  assert.equal(check?.status, "open");

  await createReport("kengeri", item.id, s2, "spam");
  check = await getItem("kengeri", item.id);
  assert.equal(check?.status, "open");

  // Third distinct session reports
  await createReport("kengeri", item.id, s3, "spam");
  // Item must now be hidden and getItem must return null (fail closed)
  check = await getItem("kengeri", item.id);
  assert.equal(check, null, "Hidden item must not be visible to viewers");
});

test("Store: desk status workflow and desk PIN verification", async () => {
  // Test PIN helper
  assert.equal(checkDeskPin("1234"), true);
  assert.equal(checkDeskPin("wrong-pin"), false);
  assert.equal(checkDeskPin(null), false);

  const session = await getOrCreateSession("kengeri");
  const item = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "found",
    title: "Unclaimed umbrella for desk intake",
    category: "umbrella",
    lat: 12.863,
    lng: 77.438,
  });

  // Check in to desk
  const received = await setDeskStatus("kengeri", item.id, "desk");
  assert.equal(received, true);

  const deskList = await deskItems("kengeri");
  const found = deskList.find((it) => it.id === item.id);
  assert.ok(found);
  assert.equal(found.status, "desk");

  // Return to student
  const returned = await setDeskStatus("kengeri", item.id, "recovered");
  assert.equal(returned, true);

  const fetched = await getItem("kengeri", item.id);
  assert.equal(fetched?.status, "recovered");
});

test("Store: match ranking links candidate lost and found items", async () => {
  const session = await getOrCreateSession("kengeri");

  // Create lost item at library
  const lost = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "lost",
    title: "Black Titan chronograph watch",
    category: "other",
    lat: 12.86238,
    lng: 77.43770,
    placeId: "library",
    placeLabel: "Campus Library",
  });

  // Create found item at same place with overlapping category and title tokens
  const found = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "found",
    title: "Titan watch found in library study hall",
    category: "other",
    lat: 12.86238,
    lng: 77.43770,
    placeId: "library",
    placeLabel: "Campus Library",
  });

  // Verify lost item now has found item in matches
  const fetchedLost = await getItem("kengeri", lost.id);
  assert.ok(fetchedLost);
  assert.ok(fetchedLost.matches.some((m) => m.id === found.id), "Matching found item must be suggested");

  // Verify found item has lost item in matches
  const fetchedFound = await getItem("kengeri", found.id);
  assert.ok(fetchedFound);
  assert.ok(fetchedFound.matches.some((m) => m.id === lost.id), "Matching lost item must be suggested");
});

test("Store: expireItems moves 14-day expired items to expired status", async () => {
  const session = await getOrCreateSession("kengeri");

  const item = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "found",
    title: "Keys found 15 days ago",
    category: "keys",
    lat: 12.8625,
    lng: 77.4375,
  });

  // Manually backdate expiresAt in db.json to simulate 14+ days passing
  const dbPath = path.join(process.cwd(), "data/runtime/db.json");
  const raw = await readFile(dbPath, "utf8");
  const db = JSON.parse(raw);
  const target = db.items.find((it: { id: string }) => it.id === item.id);
  assert.ok(target);
  target.expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await writeFile(dbPath, JSON.stringify(db, null, 2));

  // Run expiry batch
  const expiredCount = await expireItems();
  assert.ok(expiredCount >= 1);

  // Item status must now be 'expired'
  const fetched = await getItem("kengeri", item.id);
  assert.ok(fetched);
  assert.equal(fetched.status, "expired");
});

test("Store: listItems filters by query string, type, and proximity", async () => {
  const session = await getOrCreateSession("kengeri");

  const created = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "lost",
    title: "Scientific Calculator FX-991EX",
    category: "other",
    lat: 12.86335,
    lng: 77.43770,
    placeId: "block1",
    placeLabel: "Block I",
  });

  // Query by word match
  const resultsByQuery = await listItems({ campusSlug: "kengeri", q: "scientific" });
  assert.ok(resultsByQuery.some((it) => it.id === created.id));

  // Filter by type
  const lostOnly = await listItems({ campusSlug: "kengeri", type: "lost" });
  assert.ok(lostOnly.every((it) => it.type === "lost"));

  // Proximity filter: within 50m of Block I
  const nearBlock1 = await listItems({
    campusSlug: "kengeri",
    near: { lat: 12.86335, lng: 77.43770, radiusM: 50 },
  });
  assert.ok(nearBlock1.some((it) => it.id === created.id));

  // Proximity filter: far away (e.g. 500m away, 10m radius) should exclude it
  const farAway = await listItems({
    campusSlug: "kengeri",
    near: { lat: 12.8614, lng: 77.4379, radiusM: 20 },
  });
  assert.ok(!farAway.some((it) => it.id === created.id));
});

test("Store: patchItem permits poster session to update mutable fields", async () => {
  const session = await getOrCreateSession("kengeri");

  const item = await createItem({
    campusSlug: "kengeri",
    posterSessionId: session.id,
    posterUserId: null,
    type: "found",
    title: "Black umbrella",
    category: "umbrella",
    lat: 12.8624,
    lng: 77.4378,
  });

  // Unauthorized session cannot edit
  const intruder = await getOrCreateSession("kengeri");
  const failedPatch = await patchItem("kengeri", item.id, intruder.id, {
    note: "Malicious update",
  });
  assert.equal(failedPatch, null);

  // Poster session can update
  const successPatch = await patchItem("kengeri", item.id, session.id, {
    title: "Black umbrella with curved wooden handle",
    floor: 2,
    note: "Kept beside room 204",
  });
  assert.ok(successPatch);
  assert.equal(successPatch.title, "Black umbrella with curved wooden handle");
  assert.equal(successPatch.floor, 2);
  assert.equal(successPatch.note, "Kept beside room 204");
});


