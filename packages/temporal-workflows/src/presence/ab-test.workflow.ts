import { proxyActivities, defineSignal } from "@temporalio/workflow";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { analyticsEngine } from "@presence-os/temporal-activities/engines";
import type { perfKnowledgeAccess } from "@presence-os/temporal-activities/resource-access";

export const testEvaluateSignal = defineSignal("test.evaluate");

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "2m",
});
const _analytics = proxyActivities<typeof analyticsEngine>({
  taskQueue: "analytics-engine",
  startToCloseTimeout: "2m",
});
const _perfKnowledge = proxyActivities<typeof perfKnowledgeAccess>({
  taskQueue: "perf-knowledge-access",
  startToCloseTimeout: "30s",
});

export async function abTest(_input: { tenantId: string; brandId: string; testConfig: unknown }): Promise<{ testId: string; variants: unknown[] }> {
  throw new Error("Not implemented: presence.abTest");
}
