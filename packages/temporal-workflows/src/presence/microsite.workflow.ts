import { proxyActivities } from "@temporalio/workflow";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { serviceAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "5m",
});
const _service = proxyActivities<typeof serviceAccess>({
  taskQueue: "service-access",
  startToCloseTimeout: "2m",
});

export async function micrositeGeneration(_input: { tenantId: string; brandId: string; micrositeConfig: unknown }): Promise<{ deploymentUrl: string }> {
  throw new Error("Not implemented: presence.micrositeGeneration");
}
