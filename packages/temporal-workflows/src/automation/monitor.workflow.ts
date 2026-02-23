import { proxyActivities } from "@temporalio/workflow";
import type { analyticsEngine } from "@presence-os/temporal-activities/engines";
import type { perfKnowledgeAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _analytics = proxyActivities<typeof analyticsEngine>({
  taskQueue: "analytics-engine",
  startToCloseTimeout: "2m",
});
const _perfKnowledge = proxyActivities<typeof perfKnowledgeAccess>({
  taskQueue: "perf-knowledge-access",
  startToCloseTimeout: "30s",
});

export async function monitor(_input: { tenantId: string; brandId: string; workflowId: string }): Promise<{ status: string; metrics: unknown }> {
  throw new Error("Not implemented: automation.monitor");
}
