import { proxyActivities, defineSignal } from "@temporalio/workflow";
import type { CampaignInput } from "@presence-os/schemas";
import type { knowledgeEngine } from "@presence-os/temporal-activities/engines";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

export const campaignPauseSignal = defineSignal("campaign.pause");
export const campaignResumeSignal = defineSignal("campaign.resume");

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _knowledge = proxyActivities<typeof knowledgeEngine>({
  taskQueue: "knowledge-engine",
  startToCloseTimeout: "2m",
});
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "2m",
});
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});

export async function campaign(_input: CampaignInput): Promise<{ campaignId: string; contentPlan: unknown[] }> {
  throw new Error("Not implemented: presence.campaign");
}
