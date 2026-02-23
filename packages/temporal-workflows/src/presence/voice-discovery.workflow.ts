import { proxyActivities } from "@temporalio/workflow";
import type { identityEngine } from "@presence-os/temporal-activities/engines";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _identity = proxyActivities<typeof identityEngine>({
  taskQueue: "identity-engine",
  startToCloseTimeout: "5m",
});
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function voiceDiscovery(_input: { tenantId: string; brandId: string; samples: unknown[] }): Promise<{ voiceModel: unknown }> {
  throw new Error("Not implemented: presence.voiceDiscovery");
}
