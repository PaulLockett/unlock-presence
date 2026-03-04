/**
 * Live Integration Tests for Platform Adapters
 *
 * Two tiers:
 * - Smoke: Auth verification only (cheapest — 1 GET, no writes)
 * - Contract: Minimal data fetch + response shape validation
 *
 * All tests gated on env vars — no key = skip, not fail.
 * No write tests — posting creates real content and costs quota.
 *
 * Env vars:
 *   X_BEARER_TOKEN         — X OAuth 2.0 user-context bearer token
 *   X_TEST_TWEET_ID        — A known tweet ID for contract test (metrics shape)
 *   SUBSTACK_TOKEN         — Base64-encoded JSON { token, publicationUrl }
 *
 * LinkedIn tests remain as it.todo() — no API key available.
 */
import { describe, it, expect } from "vitest";
import { xAdapter } from "../adapters/x.adapter.js";
import { substackAdapter } from "../adapters/substack.adapter.js";

// --- X / Twitter ---

const X_TOKEN = process.env.X_BEARER_TOKEN;
const X_TWEET_ID = process.env.X_TEST_TWEET_ID;
const xTests = X_TOKEN ? describe : describe.skip;

xTests("X Adapter — Smoke", () => {
  it("verifies auth by fetching /2/users/me", async () => {
    const res = await fetch("https://api.x.com/2/users/me", {
      headers: { Authorization: `Bearer ${X_TOKEN}` },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { id: string; username: string } };
    expect(json.data).toHaveProperty("id");
    expect(json.data).toHaveProperty("username");
  });
});

const xContractTests = X_TOKEN && X_TWEET_ID ? describe : describe.skip;

xContractTests("X Adapter — Contract: getMetrics", () => {
  it("returns metrics with expected shape for known tweet ID", async () => {
    const metrics = await xAdapter.getMetrics({
      accessToken: X_TOKEN!,
      accountId: "",
      platformPostIds: [X_TWEET_ID!],
      platform: "x",
    });

    expect(metrics).toHaveLength(1);
    const m = metrics[0];
    expect(m).toMatchObject({
      contentId: X_TWEET_ID,
      impressions: expect.any(Number),
      engagements: expect.any(Number),
      clicks: expect.any(Number),
      reach: expect.any(Number),
      engagementRate: expect.any(Number),
    });
    expect(m.rawPlatformData).toBeDefined();
    expect(m.rawPlatformData).toHaveProperty("impression_count");
    expect(m.rawPlatformData).toHaveProperty("like_count");
  });
});

// --- LinkedIn (no API key — all tests remain as todo) ---

describe.skip("LinkedIn Adapter — Smoke", () => {
  it.todo("verifies auth by fetching /rest/me");
});

describe.skip("LinkedIn Adapter — Contract: getMetrics", () => {
  it.todo("returns metrics with expected shape for known post URN");
});

// --- Substack ---

const SS_TOKEN = process.env.SUBSTACK_TOKEN;
const ssTests = SS_TOKEN ? describe : describe.skip;

ssTests("Substack Adapter — Smoke", () => {
  it("verifies auth by fetching own profile", async () => {
    // Parse credentials the same way the adapter does
    const creds = JSON.parse(Buffer.from(SS_TOKEN!, "base64").toString("utf-8"));
    expect(creds).toHaveProperty("token");
    expect(creds).toHaveProperty("publicationUrl");

    // Import SubstackClient directly — testConnectivity is the cheapest call
    const { SubstackClient } = await import("substack-api");
    const client = new SubstackClient(creds);
    const connected = await client.testConnectivity();
    expect(connected).toBe(true);
  });
});

ssTests("Substack Adapter — Contract: getMetrics", () => {
  it("returns zero-value metrics with _note explaining unavailability", async () => {
    const metrics = await substackAdapter.getMetrics({
      accessToken: SS_TOKEN!,
      accountId: "",
      platformPostIds: ["fake-note-123"],
      platform: "substack",
    });

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      contentId: "fake-note-123",
      impressions: 0,
      engagements: 0,
      clicks: 0,
      reach: 0,
      engagementRate: 0,
    });
    expect(metrics[0].rawPlatformData).toHaveProperty("_note");
  });
});
