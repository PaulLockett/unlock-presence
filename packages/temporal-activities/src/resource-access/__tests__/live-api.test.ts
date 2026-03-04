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
 * All tests are created as it.todo() — visible but disabled.
 * They will be unlocked (converted to it()) at the staging → main PR
 * when real credentials are available.
 *
 * Env vars:
 *   X_BEARER_TOKEN         — X OAuth 2.0 user-context bearer token
 *   LINKEDIN_ACCESS_TOKEN  — LinkedIn OAuth 2.0 access token
 *   LINKEDIN_ACCOUNT_URN   — Author URN (e.g., urn:li:person:abc)
 *   LINKEDIN_TEST_POST_URN — Existing post URN for contract tests
 *   SUBSTACK_TOKEN         — Base64-encoded cookies JSON { token, publicationUrl }
 */
import { describe, it } from "vitest";

// --- X / Twitter ---

const X_TOKEN = process.env.X_BEARER_TOKEN;
const xTests = X_TOKEN ? describe : describe.skip;

xTests("X Adapter — Smoke", () => {
  it.todo("verifies auth by fetching /2/users/me");
});

xTests("X Adapter — Contract: getMetrics", () => {
  it.todo("returns metrics with expected shape for known tweet ID");
});

// --- LinkedIn ---

const LI_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LI_URN = process.env.LINKEDIN_ACCOUNT_URN;
const LI_POST = process.env.LINKEDIN_TEST_POST_URN;
const liTests = LI_TOKEN && LI_URN ? describe : describe.skip;

liTests("LinkedIn Adapter — Smoke", () => {
  it.todo("verifies auth by fetching /rest/me");
});

const liContractTests = LI_TOKEN && LI_URN && LI_POST ? describe : describe.skip;

liContractTests("LinkedIn Adapter — Contract: getMetrics", () => {
  it.todo("returns metrics with expected shape for known post URN");
});

// --- Substack ---

const SS_TOKEN = process.env.SUBSTACK_TOKEN;
const ssTests = SS_TOKEN ? describe : describe.skip;

ssTests("Substack Adapter — Smoke", () => {
  it.todo("verifies auth by fetching own profile");
});

ssTests("Substack Adapter — Contract: getMetrics", () => {
  it.todo("returns zero-value metrics with _note explaining unavailability");
});
