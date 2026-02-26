import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken } from "./oauth.js";

const TEST_SECRET = "my-encryption-secret";

describe("encryptToken / decryptToken round-trip", () => {
  it("encrypts and decrypts back to original", () => {
    const token = "ya29.a0AfB_byBz...long-oauth-token";
    const encrypted = encryptToken(token, TEST_SECRET);
    const decrypted = decryptToken(encrypted, TEST_SECRET);
    expect(decrypted).toBe(token);
  });

  it("produces base64 output", () => {
    const encrypted = encryptToken("test", TEST_SECRET);
    expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    // Should be valid base64
    expect(Buffer.from(encrypted, "base64").toString("base64")).toBe(encrypted);
  });

  it("produces different ciphertexts for the same input (random IV)", () => {
    const a = encryptToken("same-token", TEST_SECRET);
    const b = encryptToken("same-token", TEST_SECRET);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with a different secret", () => {
    const encrypted = encryptToken("my-token", TEST_SECRET);
    expect(() => decryptToken(encrypted, "wrong-secret")).toThrow();
  });

  it("handles empty strings", () => {
    const encrypted = encryptToken("", TEST_SECRET);
    expect(decryptToken(encrypted, TEST_SECRET)).toBe("");
  });

  it("handles unicode content", () => {
    const token = "tøken-with-üñíçödé-🔑";
    const encrypted = encryptToken(token, TEST_SECRET);
    expect(decryptToken(encrypted, TEST_SECRET)).toBe(token);
  });
});
