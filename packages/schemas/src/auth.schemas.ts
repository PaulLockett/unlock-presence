import { z } from "zod";

export const JwtClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  tenant_id: z.string().uuid(),
  role: z.enum(["owner", "operator", "viewer", "api"]),
  brand_permissions: z.record(z.string().uuid(), z.array(z.string())).optional(),
  aud: z.string(),
  exp: z.number(),
});
export type JwtClaims = z.infer<typeof JwtClaimsSchema>;

export const BrandPermissionSchema = z.enum(["read", "write", "approve", "publish", "configure"]);
export type BrandPermission = z.infer<typeof BrandPermissionSchema>;
