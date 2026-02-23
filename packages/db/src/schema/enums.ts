import { pgEnum } from "drizzle-orm/pg-core";

// R1: Brand & Account
export const planTierEnum = pgEnum("plan_tier", [
  "free",
  "starter",
  "pro",
  "enterprise",
]);

export const autonomyLevelEnum = pgEnum("autonomy_level", [
  "manual",
  "suggest",
  "draft",
  "autonomous",
]);

export const growthStageEnum = pgEnum("growth_stage", [
  "launch",
  "growth",
  "mature",
]);

export const teamRoleEnum = pgEnum("team_role", [
  "owner",
  "operator",
  "viewer",
  "api",
]);

// R2: Content
export const contentTypeEnum = pgEnum("content_type", [
  "post",
  "thread",
  "article",
  "newsletter",
  "microsite",
  "email_sequence",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "idea",
  "draft",
  "review",
  "approved",
  "scheduled",
  "published",
  "archived",
]);

export const platformEnum = pgEnum("platform", [
  "x",
  "linkedin",
  "substack",
  "email",
  "internal",
]);

export const producedByEnum = pgEnum("produced_by", [
  "system",
  "human",
  "hybrid",
]);

export const visibilityStateEnum = pgEnum("visibility_state", [
  "visible",
  "hidden",
  "archived",
]);

export const annotationTypeEnum = pgEnum("annotation_type", [
  "voice_alignment",
  "performance_insight",
  "strategic_guidance",
  "content_brief",
  "identity_signal",
]);

export const engineEnum = pgEnum("engine", ["E1", "E2", "E3", "E4"]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "active",
  "paused",
  "completed",
]);

export const templateScopeEnum = pgEnum("template_scope", [
  "system",
  "tenant",
  "brand",
]);

// R3: Tasks
export const taskTypeEnum = pgEnum("task_type", [
  "content_review",
  "voice_approval",
  "input_needed",
  "scheduling",
  "analysis",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "completed",
  "rejected",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "urgent",
  "high",
  "normal",
  "low",
]);

export const responseTypeEnum = pgEnum("response_type", [
  "approval",
  "rejection",
  "revision",
  "text_input",
  "voice_input",
  "selection",
]);

// R4: Knowledge
export const confidenceLevelEnum = pgEnum("confidence_level", [
  "low",
  "medium",
  "high",
  "validated",
]);

export const knowledgeSourceTypeEnum = pgEnum("knowledge_source_type", [
  "book",
  "article",
  "url",
  "upload",
]);

// R5: Performance
export const abTestStatusEnum = pgEnum("ab_test_status", [
  "draft",
  "running",
  "concluded",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "publish",
  "approve",
  "reject",
  "connect",
  "disconnect",
  "graduate",
  "degrade",
]);
