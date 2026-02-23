// U2: Scheduling — Temporal Schedule management stubs

import type { Client } from "@temporalio/client";
import { TASK_QUEUES } from "./task-queues.js";

export interface ScheduleConfig {
  scheduleId: string;
  workflowType: string;
  taskQueue: string;
  cronExpression: string;
  args: unknown[];
  overlapPolicy?: "SKIP" | "BUFFER_ONE" | "BUFFER_ALL" | "CANCEL_OTHER" | "TERMINATE_OTHER";
}

export async function createSchedule(
  _client: Client,
  _config: ScheduleConfig,
): Promise<void> {
  throw new Error("Not implemented: createSchedule");
}

export async function pauseSchedule(
  _client: Client,
  _scheduleId: string,
): Promise<void> {
  throw new Error("Not implemented: pauseSchedule");
}

export async function deleteSchedule(
  _client: Client,
  _scheduleId: string,
): Promise<void> {
  throw new Error("Not implemented: deleteSchedule");
}

// Default schedules for a brand (created during onboarding)
export function getDefaultBrandSchedules(tenantId: string, brandId: string): ScheduleConfig[] {
  return [
    {
      scheduleId: `${tenantId}-${brandId}-daily-harvest`,
      workflowType: "presence.operate",
      taskQueue: TASK_QUEUES.PRESENCE_MANAGER,
      cronExpression: "0 6 * * *",
      args: [{ tenantId, brandId, input: { type: "daily_harvest" } }],
      overlapPolicy: "SKIP",
    },
    {
      scheduleId: `${tenantId}-${brandId}-weekly-graduation`,
      workflowType: "presence.assessGraduation",
      taskQueue: TASK_QUEUES.PRESENCE_MANAGER,
      cronExpression: "0 9 * * 1",
      args: [{ tenantId, brandId, workflowId: "weekly-assessment" }],
      overlapPolicy: "SKIP",
    },
    {
      scheduleId: `${tenantId}-${brandId}-monthly-evolve`,
      workflowType: "presence.evolve",
      taskQueue: TASK_QUEUES.PRESENCE_MANAGER,
      cronExpression: "0 8 1 * *",
      args: [{ tenantId, brandId, trigger: "scheduled" }],
      overlapPolicy: "SKIP",
    },
  ];
}
