import { proxyActivities } from "@temporalio/workflow";
import type { serviceAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _service = proxyActivities<typeof serviceAccess>({
  taskQueue: "service-access",
  startToCloseTimeout: "30s",
});

export async function billing(_input: { tenantId: string; action: "upgrade" | "downgrade" | "cancel"; planId?: string }): Promise<{ success: boolean; newPlan?: string }> {
  throw new Error("Not implemented: account.billing");
}
