import { proxyActivities } from "@temporalio/workflow";
import type { identityEngine } from "@presence-os/temporal-activities/engines";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _identity = proxyActivities<typeof identityEngine>({
  taskQueue: "identity-engine",
  startToCloseTimeout: "2m",
});
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function userCorrection(_input: { tenantId: string; brandId: string; correction: unknown }): Promise<{ updated: boolean }> {
  throw new Error("Not implemented: presence.userCorrection");
}
