import { describe, it, expect, afterEach } from "vitest";
import { Hono } from "hono";
import { createHealthCheck, type HealthStatus } from "./health.js";

function buildApp(checks: Parameters<typeof createHealthCheck>[0]) {
  const app = new Hono();
  app.get("/health", createHealthCheck(checks));
  return app;
}

async function fetchHealth(
  app: Hono,
): Promise<{ status: number; body: HealthStatus }> {
  const res = await app.request("/health");
  const body = (await res.json()) as HealthStatus;
  return { status: res.status, body };
}

describe("createHealthCheck", () => {
  const originalEnv = process.env.COMPONENT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.COMPONENT;
    } else {
      process.env.COMPONENT = originalEnv;
    }
  });

  it("returns healthy with no checks", async () => {
    const app = buildApp([]);
    const { status, body } = await fetchHealth(app);

    expect(status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks).toEqual({});
    expect(typeof body.uptime).toBe("number");
  });

  it("returns healthy when all checks pass", async () => {
    const app = buildApp([
      { name: "db", check: async () => true },
      { name: "redis", check: async () => true },
    ]);
    const { status, body } = await fetchHealth(app);

    expect(status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.db.ok).toBe(true);
    expect(body.checks.redis.ok).toBe(true);
  });

  it("returns degraded when some checks fail", async () => {
    const app = buildApp([
      { name: "db", check: async () => true },
      { name: "redis", check: async () => false },
    ]);
    const { status, body } = await fetchHealth(app);

    expect(status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.checks.db.ok).toBe(true);
    expect(body.checks.redis.ok).toBe(false);
  });

  it("returns unhealthy (503) when all checks fail", async () => {
    const app = buildApp([
      { name: "db", check: async () => false },
      { name: "redis", check: async () => false },
    ]);
    const { status, body } = await fetchHealth(app);

    expect(status).toBe(503);
    expect(body.status).toBe("unhealthy");
  });

  it("handles check exceptions as failures", async () => {
    const app = buildApp([
      {
        name: "db",
        check: async () => {
          throw new Error("connection refused");
        },
      },
    ]);
    const { status, body } = await fetchHealth(app);

    expect(status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.db.ok).toBe(false);
  });

  it("records latency for each check", async () => {
    const app = buildApp([
      {
        name: "slow",
        check: () =>
          new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 50)),
      },
    ]);
    const { body } = await fetchHealth(app);

    expect(body.checks.slow.ok).toBe(true);
    expect(body.checks.slow.latencyMs).toBeGreaterThanOrEqual(40);
  });

  it("reads component from COMPONENT env var", async () => {
    process.env.COMPONENT = "api-gateway";
    const app = buildApp([]);
    const { body } = await fetchHealth(app);

    expect(body.component).toBe("api-gateway");
  });

  it("defaults component to 'unknown'", async () => {
    delete process.env.COMPONENT;
    const app = buildApp([]);
    const { body } = await fetchHealth(app);

    expect(body.component).toBe("unknown");
  });
});
