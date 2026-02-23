import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Encrypt an OAuth token for secure storage.
 * Uses AES-256-GCM with a random IV. Output format: base64(iv + ciphertext + tag).
 */
export function encryptToken(plaintext: string, secret: string): string {
  const key = normalizeKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt an OAuth token from storage.
 */
export function decryptToken(ciphertext: string, secret: string): string {
  const key = normalizeKey(secret);
  const buf = Buffer.from(ciphertext, "base64");

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf-8");
}

/**
 * Normalize a secret string to a 32-byte key via SHA-256.
 */
function normalizeKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}
