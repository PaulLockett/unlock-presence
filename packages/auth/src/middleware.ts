import type { Context, Next } from "hono";
import { verifyJwt } from "./jwt.js";

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized", message: "Missing bearer token", statusCode: 401 }, 401);
    }

    const token = authHeader.slice(7);
    const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? "";

    try {
      const claims = await verifyJwt(token, jwtSecret);
      c.set("claims", claims);
      c.set("tenantId", claims.tenant_id);
      c.set("userId", claims.sub);
      await next();
    } catch {
      return c.json({ error: "Unauthorized", message: "Invalid token", statusCode: 401 }, 401);
    }
  };
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const claims = c.get("claims");
    if (!claims || !roles.includes(claims.role)) {
      return c.json({ error: "Forbidden", message: "Insufficient permissions", statusCode: 403 }, 403);
    }
    await next();
  };
}
