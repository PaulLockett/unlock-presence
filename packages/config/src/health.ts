import type { Context } from "hono";

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { ok: boolean; latencyMs: number }>;
  uptime: number;
  component: string;
}

const startTime = Date.now();

/**
 * Creates a Hono route handler that reports service health.
 * Each check runs in parallel with a timeout. If any check fails,
 * status degrades; if all fail, status is unhealthy.
 */
export function createHealthCheck(checks: HealthCheck[] = []) {
  return async (c: Context) => {
    const results: HealthStatus["checks"] = {};
    let failCount = 0;

    await Promise.all(
      checks.map(async ({ name, check }) => {
        const start = Date.now();
        try {
          const ok = await Promise.race([
            check(),
            new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 5000),
            ),
          ]);
          results[name] = { ok, latencyMs: Date.now() - start };
          if (!ok) failCount++;
        } catch {
          results[name] = { ok: false, latencyMs: Date.now() - start };
          failCount++;
        }
      }),
    );

    const status: HealthStatus = {
      status:
        failCount === 0
          ? "healthy"
          : failCount < checks.length
            ? "degraded"
            : "unhealthy",
      checks: results,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      component: process.env.COMPONENT ?? "unknown",
    };

    const httpStatus = status.status === "unhealthy" ? 503 : 200;
    return c.json(status, httpStatus);
  };
}
