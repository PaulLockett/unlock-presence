import { z } from "zod";

export const SseEventTypeSchema = z.enum([
  "task_created", "task_updated", "task_completed", "task_failed",
  "content_drafted", "content_revised", "content_approved", "content_scheduled", "content_published", "content_failed",
  "workflow_started", "workflow_completed", "workflow_failed", "workflow_graduation_proposed", "workflow_graduation_applied",
  "knowledge_updated", "knowledge_conflict_detected",
  "alert", "notification",
  "heartbeat", "error",
]);
export type SseEventType = z.infer<typeof SseEventTypeSchema>;

export const SseEventSchema = z.object({
  id: z.string(),
  type: SseEventTypeSchema,
  tenantId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  data: z.unknown(),
});
export type SseEvent = z.infer<typeof SseEventSchema>;
