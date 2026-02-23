import { proxyActivities } from "@temporalio/workflow";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function degrade(_input: { tenantId: string; brandId: string; workflowId: string; reason: string }): Promise<{ degraded: boolean; handedBackTo: "presence" }> {
  throw new Error("Not implemented: automation.degrade");
}
