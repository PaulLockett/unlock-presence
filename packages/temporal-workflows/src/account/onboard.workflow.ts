import { proxyActivities } from "@temporalio/workflow";
import type { OnboardInput } from "@presence-os/schemas";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";
import type { serviceAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});
const _service = proxyActivities<typeof serviceAccess>({
  taskQueue: "service-access",
  startToCloseTimeout: "2m",
});

export async function onboard(_input: OnboardInput): Promise<{ tenantId: string; brandId: string }> {
  throw new Error("Not implemented: account.onboard");
}
