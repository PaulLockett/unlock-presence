import type { Context } from "hono";
import { verifyJwt } from "./jwt.js";
import * as jose from "jose";
import { timingSafeEqual, createHash } from "node:crypto";

export interface AuthResult {
  userId: string;
  tenantId: string;
  role: string;
}

export interface AuthStrategy {
  authenticate(c: Context): Promise<AuthResult | null>;
}

/**
 * Supabase JWT strategy — verifies Bearer token with Supabase JWT secret.
 * Used by browser clients (C1, C2) with user sessions.
 */
export class SupabaseJwtStrategy implements AuthStrategy {
  async authenticate(c: Context): Promise<AuthResult | null> {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? "";
    if (!jwtSecret) return null;

    try {
      const claims = await verifyJwt(token, jwtSecret);
      return {
        userId: claims.sub,
        tenantId: claims.tenant_id,
        role: claims.role,
      };
    } catch {
      return null;
    }
  }
}

/**
 * API key strategy — checks X-API-Key header with constant-time comparison.
 * Used by external webhooks (C3 API Gateway).
 * Keys are stored as SHA-256 hashes in the database.
 */
export class ApiKeyStrategy implements AuthStrategy {
  private hashedKeys: Map<string, { tenantId: string; role: string }>;

  constructor(
    hashedKeys: Map<string, { tenantId: string; role: string }>,
  ) {
    this.hashedKeys = hashedKeys;
  }

  async authenticate(c: Context): Promise<AuthResult | null> {
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey) return null;

    const hash = createHash("sha256").update(apiKey).digest("hex");

    for (const [storedHash, meta] of this.hashedKeys) {
      if (constantTimeCompare(hash, storedHash)) {
        return {
          userId: "api-key",
          tenantId: meta.tenantId,
          role: meta.role,
        };
      }
    }
    return null;
  }
}

/**
 * QStash signature strategy — verifies Upstash-Signature header.
 * Used by the realtime service webhook endpoint.
 * Does NOT produce a user context — only verifies message authenticity.
 */
export class QStashSignatureStrategy implements AuthStrategy {
  async authenticate(c: Context): Promise<AuthResult | null> {
    const signature = c.req.header("Upstash-Signature");
    if (!signature) return null;

    const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY ?? "";
    const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY ?? "";
    if (!currentKey && !nextKey) return null;

    try {
      const body = await c.req.text();
      const isValid = await verifyQStashSignature(signature, body, currentKey, nextKey);
      if (!isValid) return null;

      return {
        userId: "qstash",
        tenantId: "system",
        role: "service",
      };
    } catch {
      return null;
    }
  }
}

/**
 * Service token strategy — verifies internally-signed JWTs.
 * Used for service-to-service calls within the platform.
 */
export class ServiceTokenStrategy implements AuthStrategy {
  async authenticate(c: Context): Promise<AuthResult | null> {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const secret = process.env.SERVICE_TOKEN_SECRET ?? "";
    if (!secret) return null;

    try {
      const encoder = new TextEncoder();
      const { payload } = await jose.jwtVerify(token, encoder.encode(secret), {
        issuer: "presence-os",
      });
      return {
        userId: (payload.sub as string) ?? "service",
        tenantId: (payload.tenant_id as string) ?? "system",
        role: "service",
      };
    } catch {
      return null;
    }
  }
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies a QStash webhook signature by checking the JWT against signing keys.
 * QStash signs webhooks as JWTs with the message body hash in the payload.
 */
async function verifyQStashSignature(
  signature: string,
  body: string,
  currentKey: string,
  nextKey: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const bodyHash = createHash("sha256").update(body).digest("base64url");

  for (const key of [currentKey, nextKey]) {
    if (!key) continue;
    try {
      const { payload } = await jose.jwtVerify(signature, encoder.encode(key));
      if (payload.body === bodyHash) return true;
    } catch {
      // Try next key
    }
  }
  return false;
}
