import { proxyActivities, defineSignal } from "@temporalio/workflow";
import type { ContentApprovalInput } from "@presence-os/schemas";
import type { contentEngine } from "@presence-os/temporal-activities/engines";
import type { contentProcessAccess } from "@presence-os/temporal-activities/resource-access";

export const approvalResponseSignal = defineSignal<[{ approved: boolean; feedback?: string }]>("approval.response");

// Cross-component activity proxies — each dispatches to the owning worker's task queue
const _contentProcess = proxyActivities<typeof contentProcessAccess>({
  taskQueue: "content-process-access",
  startToCloseTimeout: "30s",
});
const _content = proxyActivities<typeof contentEngine>({
  taskQueue: "content-engine",
  startToCloseTimeout: "2m",
});

export async function contentApproval(_input: ContentApprovalInput): Promise<{ status: "approved" | "revised" | "rejected" }> {
  throw new Error("Not implemented: presence.contentApproval");
}
