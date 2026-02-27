import { describe, it, expect } from "vitest";
import { hashApiKey, validateApiKey } from "./api-keys.js";

describe("hashApiKey", () => {
  it("produces a hex SHA-256 hash", () => {
    const hash = hashApiKey("my-api-key");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashApiKey("key-1")).toBe(hashApiKey("key-1"));
  });

  it("produces different hashes for different keys", () => {
    expect(hashApiKey("key-1")).not.toBe(hashApiKey("key-2"));
  });
});

describe("validateApiKey", () => {
  it("validates a key against its stored hash", () => {
    const hash = hashApiKey("secret-key");
    expect(validateApiKey("secret-key", [hash])).toBe(true);
  });

  it("rejects an incorrect key", () => {
    const hash = hashApiKey("correct-key");
    expect(validateApiKey("wrong-key", [hash])).toBe(false);
  });

  it("matches against any hash in the list", () => {
    const hashes = [hashApiKey("key-a"), hashApiKey("key-b"), hashApiKey("key-c")];
    expect(validateApiKey("key-b", hashes)).toBe(true);
  });

  it("returns false for empty hash list", () => {
    expect(validateApiKey("any-key", [])).toBe(false);
  });
});
