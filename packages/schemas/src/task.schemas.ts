import { z } from "zod";

export const TaskTypeSchema = z.enum(["content_review", "voice_approval", "input_needed", "scheduling", "analysis"]);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const TaskStatusSchema = z.enum(["open", "in_progress", "completed", "rejected"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.enum(["urgent", "high", "normal", "low"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const ResponseTypeSchema = z.enum(["approval", "rejection", "revision", "text_input", "voice_input", "selection"]);
export type ResponseType = z.infer<typeof ResponseTypeSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  type: TaskTypeSchema,
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  workflowId: z.string().nullable(),
  workflowSignal: z.string().nullable(),
});
export type Task = z.infer<typeof TaskSchema>;
