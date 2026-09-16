import { createHash } from "crypto";

export function normalizeSecret(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(normalizeSecret(value)).digest("hex");
}
