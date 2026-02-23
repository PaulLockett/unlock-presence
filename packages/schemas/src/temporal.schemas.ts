import { z } from "zod";

// Workflow input/output types for typed Temporal contracts

export const WorkflowStartInputSchema = z.object({
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  workflowType: z.string(),
  params: z.record(z.unknown()).optional(),
});
export type WorkflowStartInput = z.infer<typeof WorkflowStartInputSchema>;

export const WorkflowStatusSchema = z.object({
  workflowId: z.string(),
  runId: z.string(),
  status: z.enum(["running", "completed", "failed", "cancelled", "terminated"]),
  result: z.unknown().optional(),
});
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

// M1 workflow-specific I/O stubs
export const OperateInputSchema = z.object({
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  input: z.unknown(),
});
export type OperateInput = z.infer<typeof OperateInputSchema>;

export const EvolveInputSchema = z.object({
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  trigger: z.enum(["scheduled", "book_upload"]),
});
export type EvolveInput = z.infer<typeof EvolveInputSchema>;

export const ContentApprovalInputSchema = z.object({
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  contentId: z.string().uuid(),
});
export type ContentApprovalInput = z.infer<typeof ContentApprovalInputSchema>;

export const CampaignInputSchema = z.object({
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  campaignConfig: z.record(z.unknown()),
});
export type CampaignInput = z.infer<typeof CampaignInputSchema>;

// M2 workflow-specific I/O stubs
export const ExecuteInputSchema = z.object({
  tenantId: z.string().uuid(),
  brandId: z.string().uuid(),
  workflowId: z.string(),
  workflowDef: z.record(z.unknown()),
});
export type ExecuteInput = z.infer<typeof ExecuteInputSchema>;

// M3 workflow-specific I/O stubs
export const OnboardInputSchema = z.object({
  email: z.string().email(),
  plan: z.string(),
  paymentMethod: z.record(z.unknown()).optional(),
});
export type OnboardInput = z.infer<typeof OnboardInputSchema>;
