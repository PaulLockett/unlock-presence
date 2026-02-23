import { proxyActivities } from "@temporalio/workflow";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function workflowCreation(_input: { tenantId: string; brandId: string; workflowDef: unknown }): Promise<{ workflowId: string; status: "experimental" }> {
  throw new Error("Not implemented: presence.workflowCreation");
}
