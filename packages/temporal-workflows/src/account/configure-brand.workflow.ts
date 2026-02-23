import { proxyActivities } from "@temporalio/workflow";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";
import type { channelAccess } from "@presence-os/temporal-activities/resource-access";

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});
const _channel = proxyActivities<typeof channelAccess>({
  taskQueue: "channel-access",
  startToCloseTimeout: "2m",
});

export async function configureBrand(_input: { tenantId: string; brandConfig: unknown }): Promise<{ brandId: string; channelsConnected: string[] }> {
  throw new Error("Not implemented: account.configureBrand");
}
