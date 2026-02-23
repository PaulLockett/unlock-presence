import { z } from "zod";

export const PlatformSchema = z.enum(["x", "linkedin", "substack", "email", "internal"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const PlanTierSchema = z.enum(["free", "starter", "pro", "enterprise"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const AutonomyLevelSchema = z.enum(["manual", "suggest", "draft", "autonomous"]);
export type AutonomyLevel = z.infer<typeof AutonomyLevelSchema>;

export const GrowthStageSchema = z.enum(["launch", "growth", "mature"]);
export type GrowthStage = z.infer<typeof GrowthStageSchema>;

export const TeamRoleSchema = z.enum(["owner", "operator", "viewer", "api"]);
export type TeamRole = z.infer<typeof TeamRoleSchema>;

export const BrandSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  autonomyLevel: AutonomyLevelSchema,
  growthStage: GrowthStageSchema,
  contentPillars: z.array(z.string()).nullable(),
});
export type Brand = z.infer<typeof BrandSchema>;
