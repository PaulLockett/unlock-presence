import { z } from "zod";

export const ContentTypeSchema = z.enum(["post", "thread", "article", "newsletter", "microsite", "email_sequence"]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const ContentStatusSchema = z.enum(["idea", "draft", "review", "approved", "scheduled", "published", "archived"]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ProducedBySchema = z.enum(["system", "human", "hybrid"]);
export type ProducedBy = z.infer<typeof ProducedBySchema>;

export const AnnotationTypeSchema = z.enum(["voice_alignment", "performance_insight", "strategic_guidance", "content_brief", "identity_signal"]);
export type AnnotationType = z.infer<typeof AnnotationTypeSchema>;

export const EngineSchema = z.enum(["E1", "E2", "E3", "E4"]);
export type Engine = z.infer<typeof EngineSchema>;

export const ContentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  contentGroupId: z.string().uuid(),
  version: z.number().int(),
  isCurrent: z.boolean(),
  type: ContentTypeSchema,
  status: ContentStatusSchema,
  title: z.string().nullable(),
  body: z.string().nullable(),
});
export type Content = z.infer<typeof ContentSchema>;
