import { proxyActivities, defineSignal } from "@temporalio/workflow";
import type { ExecuteInput } from "@presence-os/schemas";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { channelAccess } from "@presence-os/temporal-activities/resource-access";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

export const executionCancelSignal = defineSignal("execution.cancel");

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "2m",
});
const _channel = proxyActivities<typeof channelAccess>({
  taskQueue: "channel-access",
  startToCloseTimeout: "2m",
});
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function execute(_input: ExecuteInput): Promise<{ contentProduced: unknown[]; published: boolean }> {
  throw new Error("Not implemented: automation.execute");
}
