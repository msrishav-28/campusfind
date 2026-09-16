import test from "node:test";
import assert from "node:assert/strict";
import { createItemSchema, claimSchema, otpStartSchema, otpVerifySchema, reportSchema } from "@/lib/schemas";

test("Schemas: createItemSchema validates required and optional fields", () => {
  const valid = {
    type: "found",
    title: "Black umbrella at library",
    category: "umbrella",
    lat: 12.8624,
    lng: 77.4378,
    accuracyM: 14,
    placeId: "library",
    placeLabel: "Campus Library",
    source: "gps_snap",
    floor: 2,
    note: "Second floor study table",
  };

  const parsed = createItemSchema.safeParse(valid);
  assert.equal(parsed.success, true);

  // Missing title fails
  const missingTitle = { ...valid, title: "   " };
  assert.equal(createItemSchema.safeParse(missingTitle).success, false);

  // Note exceeding 40 characters fails
  const longNote = { ...valid, note: "This note is way too long and definitely exceeds forty characters" };
  assert.equal(createItemSchema.safeParse(longNote).success, false);

  // Negative accuracy fails
  const negAcc = { ...valid, accuracyM: -5 };
  assert.equal(createItemSchema.safeParse(negAcc).success, false);
});

test("Schemas: otpStartSchema accepts phone or email", () => {
  assert.equal(otpStartSchema.safeParse({ phone: "9876543210" }).success, true);
  assert.equal(otpStartSchema.safeParse({ email: "student@christuniversity.in" }).success, true);
  assert.equal(otpStartSchema.safeParse({ email: "not-an-email" }).success, false);
  assert.equal(otpStartSchema.safeParse({}).success, false);
});

test("Schemas: otpVerifySchema validates challengeId and 6-digit code format", () => {
  const valid = {
    challengeId: "123e4567-e89b-12d3-a456-426614174000",
    code: "583921",
  };
  assert.equal(otpVerifySchema.safeParse(valid).success, true);

  // Invalid code length
  assert.equal(otpVerifySchema.safeParse({ ...valid, code: "123" }).success, false);
  // Non-numeric code
  assert.equal(otpVerifySchema.safeParse({ ...valid, code: "abcdef" }).success, false);
  // Non-UUID challengeId
  assert.equal(otpVerifySchema.safeParse({ ...valid, challengeId: "not-a-uuid" }).success, false);
});

test("Schemas: reportSchema validates acceptable reasons", () => {
  assert.equal(reportSchema.safeParse({ reason: "spam" }).success, true);
  assert.equal(reportSchema.safeParse({ reason: "inappropriate" }).success, true);
  assert.equal(reportSchema.safeParse({ reason: "wrong" }).success, true);
  assert.equal(reportSchema.safeParse({ reason: "other" }).success, true);
  assert.equal(reportSchema.safeParse({ reason: "illegal_reason" }).success, false);
});

test("Schemas: claimSchema validates optional secret and bounded message", () => {
  assert.equal(claimSchema.safeParse({ secret: "cat sticker", message: "Left on 2nd table" }).success, true);
  assert.equal(claimSchema.safeParse({}).success, true);
  // Message > 200 chars fails
  const longMsg = "x".repeat(205);
  assert.equal(claimSchema.safeParse({ message: longMsg }).success, false);
});
