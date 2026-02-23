import { z } from "zod";

export const AbTestStatusSchema = z.enum(["draft", "running", "concluded"]);
export type AbTestStatus = z.infer<typeof AbTestStatusSchema>;

export const AuditActionSchema = z.enum(["create", "update", "delete", "publish", "approve", "reject", "connect", "disconnect", "graduate", "degrade"]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const ContentPerformanceSchema = z.object({
  contentId: z.string().uuid(),
  platform: z.string(),
  impressions: z.number().int(),
  engagements: z.number().int(),
  clicks: z.number().int(),
  reach: z.number().int(),
  engagementRate: z.number(),
  measuredAt: z.string().datetime(),
});
export type ContentPerformance = z.infer<typeof ContentPerformanceSchema>;
