import { proxyActivities } from "@temporalio/workflow";
import type { knowledgeEngine } from "@presence-os/temporal-activities/engines";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _knowledge = proxyActivities<typeof knowledgeEngine>({
  taskQueue: "knowledge-engine",
  startToCloseTimeout: "2m",
});
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "2m",
});
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function multiBrandBatch(_input: { tenantId: string; brandIds: string[] }): Promise<{ results: Record<string, unknown> }> {
  throw new Error("Not implemented: presence.multiBrandBatch");
}
