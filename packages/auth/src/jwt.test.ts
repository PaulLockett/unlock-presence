import { describe, it, expect } from "vitest";
import { signJwt, verifyJwt, decodeJwt } from "./jwt.js";

const TEST_SECRET = "test-secret-at-least-32-chars-long!!";
const TEST_USER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const TEST_TENANT_ID = "b1ffcd00-ad1c-5fg9-cc7e-7ccace491b22";

describe("signJwt / verifyJwt round-trip", () => {
  it("produces a token that verifyJwt accepts", async () => {
    const payload = { sub: TEST_USER_ID, tenant_id: TEST_TENANT_ID, role: "owner" };
    const token = await signJwt(payload, TEST_SECRET);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const claims = await verifyJwt(token, TEST_SECRET);
    expect(claims.sub).toBe(TEST_USER_ID);
    expect(claims.tenant_id).toBe(TEST_TENANT_ID);
    expect(claims.role).toBe("owner");
    expect(claims.iss).toBe("presence-os");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signJwt({ sub: TEST_USER_ID }, TEST_SECRET);
    await expect(verifyJwt(token, "wrong-secret")).rejects.toThrow();
  });

  it("sets expiration time", async () => {
    const token = await signJwt({ sub: TEST_USER_ID }, TEST_SECRET, "2h");
    const claims = await verifyJwt(token, TEST_SECRET);
    expect(claims.exp).toBeDefined();
    const twoHoursFromNow = Math.floor(Date.now() / 1000) + 7200;
    expect(claims.exp).toBeGreaterThan(twoHoursFromNow - 10);
    expect(claims.exp).toBeLessThan(twoHoursFromNow + 10);
  });
});

describe("decodeJwt", () => {
  it("decodes without verifying", async () => {
    const token = await signJwt(
      { sub: TEST_USER_ID, tenant_id: TEST_TENANT_ID, role: "viewer" },
      TEST_SECRET,
    );
    const claims = decodeJwt(token);
    expect(claims.sub).toBe(TEST_USER_ID);
    expect(claims.tenant_id).toBe(TEST_TENANT_ID);
  });

  it("throws on malformed tokens", () => {
    expect(() => decodeJwt("not-a-jwt")).toThrow();
  });
});
