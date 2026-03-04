import { describe, it, expect } from "vitest";
import {
  processBilling,
  deployAsset,
  VALID_BILLING_ACTIONS,
} from "./service.activities.js";

// --- processBilling ---

describe("processBilling", () => {
  it("succeeds for valid billing action", async () => {
    const result = await processBilling({
      tenantId: "t1",
      action: "create_subscription",
      params: { planId: "pro" },
    });

    expect(result.success).toBe(true);
    expect(result.subscriptionId).toMatch(/^sub_t1_/);
  });

  it("succeeds for all valid actions", async () => {
    for (const action of VALID_BILLING_ACTIONS) {
      const result = await processBilling({
        tenantId: "t1",
        action,
        params: {},
      });
      expect(result.success).toBe(true);
    }
  });

  it("throws for invalid billing action", async () => {
    await expect(
      processBilling({ tenantId: "t1", action: "refund", params: {} }),
    ).rejects.toThrow("Invalid billing action: refund");
  });
});

// --- deployAsset ---

describe("deployAsset", () => {
  it("returns URL containing tenant, brand, and artifact IDs", async () => {
    const result = await deployAsset({
      tenantId: "t1",
      brandId: "b1",
      artifactId: "art-123",
    });

    expect(result.deploymentUrl).toContain("t1");
    expect(result.deploymentUrl).toContain("b1");
    expect(result.deploymentUrl).toContain("art-123");
  });

  it("throws when missing required fields", async () => {
    await expect(
      deployAsset({ tenantId: "", brandId: "b1", artifactId: "art-1" }),
    ).rejects.toThrow("tenantId, brandId, and artifactId are required");
  });
});
