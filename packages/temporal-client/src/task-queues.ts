export const TASK_QUEUES = {
  PRESENCE_MANAGER: "presence-manager",
  PROCESS_MANAGER: "process-manager",
  TENANT_MANAGER: "tenant-manager",
  CONTENT_ENGINE: "content-engine",
  IDENTITY_ENGINE: "identity-engine",
  ANALYTICS_ENGINE: "analytics-engine",
  KNOWLEDGE_ENGINE: "knowledge-engine",
  CHANNEL_ACCESS: "channel-access",
  SERVICE_ACCESS: "service-access",
  CONTENT_PROCESS_ACCESS: "content-process-access",
  PERF_KNOWLEDGE_ACCESS: "perf-knowledge-access",
} as const;

export type TaskQueue = (typeof TASK_QUEUES)[keyof typeof TASK_QUEUES];
