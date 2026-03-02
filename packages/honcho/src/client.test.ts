import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHonchoClient } from "../src/client.js";

vi.mock("@honcho-ai/sdk", () => ({
  Honcho: vi.fn().mockImplementation((opts: Record<string, unknown>) => ({
    _opts: opts,
  })),
}));

describe("createHonchoClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates client with explicit options", () => {
    const client = createHonchoClient({
      apiKey: "test-key",
      workspaceId: "ws-123",
    });
    expect(client).toBeDefined();
    expect((client as unknown as { _opts: Record<string, unknown> })._opts.apiKey).toBe("test-key");
    expect((client as unknown as { _opts: Record<string, unknown> })._opts.workspaceId).toBe("ws-123");
  });

  it("falls back to environment variables", () => {
    process.env.HONCHO_API_KEY = "env-key";
    process.env.HONCHO_WORKSPACE_ID = "env-ws";
    const client = createHonchoClient();
    expect(client).toBeDefined();
    expect((client as unknown as { _opts: Record<string, unknown> })._opts.apiKey).toBe("env-key");
    expect((client as unknown as { _opts: Record<string, unknown> })._opts.workspaceId).toBe("env-ws");
  });

  it("defaults workspaceId to 'default' when not provided", () => {
    process.env.HONCHO_API_KEY = "key";
    delete process.env.HONCHO_WORKSPACE_ID;
    const client = createHonchoClient();
    expect((client as unknown as { _opts: Record<string, unknown> })._opts.workspaceId).toBe("default");
  });

  it("throws when no API key is available", () => {
    delete process.env.HONCHO_API_KEY;
    expect(() => createHonchoClient()).toThrow("HONCHO_API_KEY is required");
  });
});
