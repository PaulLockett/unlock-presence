import type { Context, Next } from "hono";
import {
  SupabaseJwtStrategy,
  QStashSignatureStrategy,
  type AuthStrategy,
  type AuthResult,
} from "./strategies.js";

/**
 * Composable auth middleware — tries strategies in order.
 * First strategy that returns a non-null result wins.
 * If no strategies provided, defaults to SupabaseJwtStrategy.
 */
export function authMiddleware(strategies?: AuthStrategy[]) {
  const strats = strategies ?? [new SupabaseJwtStrategy()];

  return async (c: Context, next: Next) => {
    let result: AuthResult | null = null;

    for (const strategy of strats) {
      result = await strategy.authenticate(c);
      if (result) break;
    }

    if (!result) {
      return c.json(
        { error: "Unauthorized", message: "No valid credentials", statusCode: 401 },
        401,
      );
    }

    c.set("claims", result);
    c.set("tenantId", result.tenantId);
    c.set("userId", result.userId);
    await next();
  };
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const claims = c.get("claims");
    if (!claims || !roles.includes(claims.role)) {
      return c.json(
        { error: "Forbidden", message: "Insufficient permissions", statusCode: 403 },
        403,
      );
    }
    await next();
  };
}

/**
 * Convenience middleware for QStash webhook endpoints.
 * Verifies the Upstash-Signature header. No user context — just message authenticity.
 */
export function qstashMiddleware() {
  const strategy = new QStashSignatureStrategy();

  return async (c: Context, next: Next) => {
    const result = await strategy.authenticate(c);
    if (!result) {
      return c.json(
        { error: "Unauthorized", message: "Invalid QStash signature", statusCode: 401 },
        401,
      );
    }
    c.set("claims", result);
    await next();
  };
}
