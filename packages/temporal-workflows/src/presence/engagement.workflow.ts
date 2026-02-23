import { proxyActivities } from "@temporalio/workflow";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { channelAccess } from "@presence-os/temporal-activities/resource-access";
import type { perfKnowledgeAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "2m",
});
const _channel = proxyActivities<typeof channelAccess>({
  taskQueue: "channel-access",
  startToCloseTimeout: "2m",
});
const _perfKnowledge = proxyActivities<typeof perfKnowledgeAccess>({
  taskQueue: "perf-knowledge-access",
  startToCloseTimeout: "30s",
});

export async function engagementResponse(_input: { tenantId: string; brandId: string; engagementEvent: unknown }): Promise<{ response?: unknown; logged: boolean }> {
  throw new Error("Not implemented: presence.engagementResponse");
}
