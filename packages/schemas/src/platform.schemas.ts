import { z } from "zod";

export const PlatformPostResultSchema = z.object({
  platformPostId: z.string(),
  url: z.string().url().optional(),
  publishedAt: z.string().datetime(),
});
export type PlatformPostResult = z.infer<typeof PlatformPostResultSchema>;

export const PlatformMetricsSchema = z.object({
  impressions: z.number().int(),
  engagements: z.number().int(),
  clicks: z.number().int(),
  reach: z.number().int(),
  rawData: z.record(z.unknown()),
});
export type PlatformMetrics = z.infer<typeof PlatformMetricsSchema>;
