import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createQStashClient } from "./client.js";

vi.mock("@upstash/qstash", () => ({
  Client: vi.fn().mockImplementation((opts: Record<string, unknown>) => ({
    _opts: opts,
  })),
}));

describe("createQStashClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates client with explicit token", () => {
    const client = createQStashClient("test-token");
    expect(client).toBeDefined();
    expect((client as unknown as { _opts: Record<string, unknown> })._opts.token).toBe("test-token");
  });

  it("falls back to QSTASH_TOKEN env var", () => {
    process.env.QSTASH_TOKEN = "env-token";
    const client = createQStashClient();
    expect((client as unknown as { _opts: Record<string, unknown> })._opts.token).toBe("env-token");
  });

  it("throws when no token is available", () => {
    delete process.env.QSTASH_TOKEN;
    expect(() => createQStashClient()).toThrow("QSTASH_TOKEN is required");
  });
});
