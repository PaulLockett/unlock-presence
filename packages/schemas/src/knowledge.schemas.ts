import { z } from "zod";

export const ConfidenceLevelSchema = z.enum(["low", "medium", "high", "validated"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const KnowledgeSourceTypeSchema = z.enum(["book", "article", "url", "upload"]);
export type KnowledgeSourceType = z.infer<typeof KnowledgeSourceTypeSchema>;

export const KnowledgeFrameworkSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  confidenceScore: z.number(),
  confidenceLevel: ConfidenceLevelSchema,
  tags: z.array(z.string()).nullable(),
});
export type KnowledgeFramework = z.infer<typeof KnowledgeFrameworkSchema>;
