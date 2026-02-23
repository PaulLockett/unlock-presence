import type { JwtClaims, BrandPermission } from "@presence-os/schemas";

export function hasRole(claims: JwtClaims, role: string): boolean {
  return claims.role === role;
}

export function isOwner(claims: JwtClaims): boolean {
  return claims.role === "owner";
}

export function hasBrandPermission(
  claims: JwtClaims,
  brandId: string,
  permission: BrandPermission,
): boolean {
  if (isOwner(claims)) return true;
  const perms = claims.brand_permissions?.[brandId];
  return perms?.includes(permission) ?? false;
}

export function getBrandsWithPermission(
  claims: JwtClaims,
  permission: BrandPermission,
): string[] {
  if (isOwner(claims)) return []; // Owner has implicit access to all
  if (!claims.brand_permissions) return [];
  return Object.entries(claims.brand_permissions)
    .filter(([_, perms]) => perms.includes(permission))
    .map(([brandId]) => brandId);
}
