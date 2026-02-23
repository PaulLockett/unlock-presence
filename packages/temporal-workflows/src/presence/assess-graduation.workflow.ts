import { proxyActivities, defineSignal } from "@temporalio/workflow";
import type { analyticsEngine } from "@presence-os/temporal-activities/engines";
import type { perfKnowledgeAccess } from "@presence-os/temporal-activities/resource-access";

export const graduationApproveSignal = defineSignal("graduation.approve");
export const graduationRejectSignal = defineSignal("graduation.reject");

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _analytics = proxyActivities<typeof analyticsEngine>({
  taskQueue: "analytics-engine",
  startToCloseTimeout: "2m",
});
const _perfKnowledge = proxyActivities<typeof perfKnowledgeAccess>({
  taskQueue: "perf-knowledge-access",
  startToCloseTimeout: "30s",
});

export async function assessGraduation(_input: { tenantId: string; brandId: string; workflowId: string }): Promise<{ ready: boolean; proposal?: unknown }> {
  throw new Error("Not implemented: presence.assessGraduation");
}
