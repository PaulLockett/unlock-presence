import { proxyActivities } from "@temporalio/workflow";
import type { perfKnowledgeAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _perfKnowledge = proxyActivities<typeof perfKnowledgeAccess>({
  taskQueue: "perf-knowledge-access",
  startToCloseTimeout: "30s",
});

export async function crossBrandTransfer(_input: { tenantId: string; sourceBrandId: string; targetBrandId: string; frameworkIds: string[] }): Promise<{ transferred: string[] }> {
  throw new Error("Not implemented: presence.crossBrandTransfer");
}
