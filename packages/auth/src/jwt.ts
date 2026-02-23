import * as jose from "jose";
import type { JwtClaims } from "@presence-os/schemas";

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtClaims> {
  const encoder = new TextEncoder();
  const { payload } = await jose.jwtVerify(token, encoder.encode(secret));
  return payload as unknown as JwtClaims;
}

export function decodeJwt(token: string): JwtClaims {
  const payload = jose.decodeJwt(token);
  return payload as unknown as JwtClaims;
}

/**
 * Sign a JWT for service-to-service communication.
 */
export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string = "1h",
): Promise<string> {
  const encoder = new TextEncoder();
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("presence-os")
    .setExpirationTime(expiresIn)
    .sign(encoder.encode(secret));
}
