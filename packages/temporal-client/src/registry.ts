import { TASK_QUEUES, type TaskQueue } from "./task-queues.js";

/**
 * Component types in the layered architecture.
 * - manager: Runs Temporal workflows (orchestration), dispatches activities to other queues
 * - engine: Runs Temporal activities (business logic)
 * - resource-access: Runs Temporal activities (data access)
 */
export type ComponentType = "manager" | "engine" | "resource-access";

export interface ComponentConfig {
  taskQueue: TaskQueue;
  type: ComponentType;
  /**
   * For managers: sub-path under @presence-os/temporal-workflows (e.g. "presence")
   * For engines/RA: null (no workflows)
   */
  workflowSubpath: string | null;
  /**
   * For engines/RA: module path to import activities from
   * For managers: null (managers orchestrate, they don't execute activities locally)
   */
  activityModule: string | null;
  /**
   * Named export within the activity module to use.
   * e.g. "contentEngine" from "@presence-os/temporal-activities/engines"
   */
  activityExport: string | null;
}

export const COMPONENTS: Record<string, ComponentConfig> = {
  "presence-manager": {
    taskQueue: TASK_QUEUES.PRESENCE_MANAGER,
    type: "manager",
    workflowSubpath: "presence",
    activityModule: null,
    activityExport: null,
  },
  "process-manager": {
    taskQueue: TASK_QUEUES.PROCESS_MANAGER,
    type: "manager",
    workflowSubpath: "automation",
    activityModule: null,
    activityExport: null,
  },
  "tenant-manager": {
    taskQueue: TASK_QUEUES.TENANT_MANAGER,
    type: "manager",
    workflowSubpath: "account",
    activityModule: null,
    activityExport: null,
  },
  "content-engine": {
    taskQueue: TASK_QUEUES.CONTENT_ENGINE,
    type: "engine",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/engines",
    activityExport: "contentEngine",
  },
  "identity-engine": {
    taskQueue: TASK_QUEUES.IDENTITY_ENGINE,
    type: "engine",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/engines",
    activityExport: "identityEngine",
  },
  "analytics-engine": {
    taskQueue: TASK_QUEUES.ANALYTICS_ENGINE,
    type: "engine",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/engines",
    activityExport: "analyticsEngine",
  },
  "knowledge-engine": {
    taskQueue: TASK_QUEUES.KNOWLEDGE_ENGINE,
    type: "engine",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/engines",
    activityExport: "knowledgeEngine",
  },
  "channel-access": {
    taskQueue: TASK_QUEUES.CHANNEL_ACCESS,
    type: "resource-access",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/resource-access",
    activityExport: "channelAccess",
  },
  "service-access": {
    taskQueue: TASK_QUEUES.SERVICE_ACCESS,
    type: "resource-access",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/resource-access",
    activityExport: "serviceAccess",
  },
  "content-process-access": {
    taskQueue: TASK_QUEUES.CONTENT_PROCESS_ACCESS,
    type: "resource-access",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/resource-access",
    activityExport: "contentProcessAccess",
  },
  "perf-knowledge-access": {
    taskQueue: TASK_QUEUES.PERF_KNOWLEDGE_ACCESS,
    type: "resource-access",
    workflowSubpath: null,
    activityModule: "@presence-os/temporal-activities/resource-access",
    activityExport: "perfKnowledgeAccess",
  },
} as const;

export const VALID_COMPONENTS = Object.keys(COMPONENTS);
