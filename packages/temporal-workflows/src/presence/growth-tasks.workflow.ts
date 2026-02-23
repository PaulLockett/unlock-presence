import { proxyActivities } from "@temporalio/workflow";
import type { analyticsEngine } from "@presence-os/temporal-activities/engines";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _analytics = proxyActivities<typeof analyticsEngine>({
  taskQueue: "analytics-engine",
  startToCloseTimeout: "2m",
});
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function growthTasks(_input: { tenantId: string; brandId: string }): Promise<{ tasks: unknown[] }> {
  throw new Error("Not implemented: presence.growthTasks");
}
