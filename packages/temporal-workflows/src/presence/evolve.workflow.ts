import { proxyActivities } from "@temporalio/workflow";
import type { EvolveInput } from "@presence-os/schemas";
import type { identityEngine } from "@presence-os/temporal-activities/engines";
import type { knowledgeEngine } from "@presence-os/temporal-activities/engines";
import type { perfKnowledgeAccess } from "@presence-os/temporal-activities/resource-access";

const _identity = proxyActivities<typeof identityEngine>({
  taskQueue: "identity-engine",
  startToCloseTimeout: "5m",
});
const _knowledge = proxyActivities<typeof knowledgeEngine>({
  taskQueue: "knowledge-engine",
  startToCloseTimeout: "5m",
});
const _perfKnowledge = proxyActivities<typeof perfKnowledgeAccess>({
  taskQueue: "perf-knowledge-access",
  startToCloseTimeout: "30s",
});

export async function evolve(_input: EvolveInput): Promise<{ knowledgeUpdates: unknown[] }> {
  throw new Error("Not implemented: presence.evolve");
}
