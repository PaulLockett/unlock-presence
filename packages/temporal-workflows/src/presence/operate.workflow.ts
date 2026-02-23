import { proxyActivities } from "@temporalio/workflow";
import type { OperateInput } from "@presence-os/schemas";
import type { knowledgeEngine } from "@presence-os/temporal-activities/engines";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { identityEngine } from "@presence-os/temporal-activities/engines";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";
import type { channelAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _knowledge = proxyActivities<typeof knowledgeEngine>({
  taskQueue: "knowledge-engine",
  startToCloseTimeout: "2m",
});
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "2m",
});
const _identity = proxyActivities<typeof identityEngine>({
  taskQueue: "identity-engine",
  startToCloseTimeout: "2m",
});
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});
const _channel = proxyActivities<typeof channelAccess>({
  taskQueue: "channel-access",
  startToCloseTimeout: "2m",
});

export async function operate(_input: OperateInput): Promise<{ tasks: unknown[]; content?: unknown[] }> {
  throw new Error("Not implemented: presence.operate");
}
