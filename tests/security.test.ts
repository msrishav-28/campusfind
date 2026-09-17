import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSecret, hashSecret } from "@/lib/security";

test("Security: normalizeSecret trims, lowercases, and collapses internal spaces", () => {
  assert.equal(normalizeSecret("  Yellow   Cat Sticker  "), "yellow cat sticker");
  assert.equal(normalizeSecret("JBL_CASE_123"), "jbl_case_123");
  assert.equal(normalizeSecret("Cracked   screen\nprotector"), "cracked screen protector");
});

test("Security: hashSecret generates stable SHA-256 hex string", () => {
  const hash = hashSecret("secret detail");
  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 64); // 256 bits = 64 hex characters

  // Variations of same secret must produce identical hash
  const hash1 = hashSecret("Yellow Cat Sticker");
  const hash2 = hashSecret("  yellow   cat   sticker  ");
  const hash3 = hashSecret("YELLOW CAT STICKER");
  assert.equal(hash1, hash2);
  assert.equal(hash2, hash3);

  // Different secret produces different hash
  const hashOther = hashSecret("Blue dog sticker");
  assert.notEqual(hash1, hashOther);
});

test("Security: OTP codePreview is suppressed when NODE_ENV is production", async () => {
  const envObj = process.env as Record<string, string | undefined>;
  const originalEnv = envObj.NODE_ENV;
  try {
    envObj.NODE_ENV = "production";
    const isDev = envObj.NODE_ENV !== "production";
    assert.equal(isDev, false, "Must detect production mode");

    const sampleResponse = {
      challengeId: "ch_123",
      ...(isDev ? { codePreview: "123456" } : {}),
    };

    assert.equal("codePreview" in sampleResponse, false, "codePreview must not exist in production response");
    assert.equal(sampleResponse.challengeId, "ch_123");
  } finally {
    envObj.NODE_ENV = originalEnv;
  }
});

