import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Hash an API key for storage using SHA-256.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key against a set of stored hashes.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateApiKey(
  key: string,
  hashedKeys: string[],
): boolean {
  const hash = createHash("sha256").update(key).digest("hex");
  const hashBuf = Buffer.from(hash);

  for (const stored of hashedKeys) {
    if (stored.length === hash.length) {
      const storedBuf = Buffer.from(stored);
      if (timingSafeEqual(hashBuf, storedBuf)) return true;
    }
  }
  return false;
}
