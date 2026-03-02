// U2: Scheduling — Temporal Schedule management

import { Client, ScheduleOverlapPolicy } from "@temporalio/client";
import { TASK_QUEUES } from "./task-queues.js";

export interface ScheduleConfig {
  scheduleId: string;
  workflowType: string;
  taskQueue: string;
  cronExpression: string;
  args: unknown[];
  overlapPolicy?: "SKIP" | "BUFFER_ONE" | "BUFFER_ALL" | "CANCEL_OTHER" | "TERMINATE_OTHER";
}

const OVERLAP_MAP: Record<string, ScheduleOverlapPolicy> = {
  SKIP: ScheduleOverlapPolicy.SKIP,
  BUFFER_ONE: ScheduleOverlapPolicy.BUFFER_ONE,
  BUFFER_ALL: ScheduleOverlapPolicy.BUFFER_ALL,
  CANCEL_OTHER: ScheduleOverlapPolicy.CANCEL_OTHER,
  TERMINATE_OTHER: ScheduleOverlapPolicy.TERMINATE_OTHER,
};

export async function createSchedule(
  client: Client,
  config: ScheduleConfig,
): Promise<void> {
  await client.schedule.create({
    scheduleId: config.scheduleId,
    spec: {
      cronExpressions: [config.cronExpression],
    },
    action: {
      type: "startWorkflow",
      workflowType: config.workflowType,
      taskQueue: config.taskQueue,
      args: config.args,
    },
    policies: {
      overlap: config.overlapPolicy
        ? OVERLAP_MAP[config.overlapPolicy] ?? ScheduleOverlapPolicy.SKIP
        : ScheduleOverlapPolicy.SKIP,
    },
  });
}

export async function pauseSchedule(
  client: Client,
  scheduleId: string,
): Promise<void> {
  const handle = client.schedule.getHandle(scheduleId);
  await handle.pause();
}

export async function resumeSchedule(
  client: Client,
  scheduleId: string,
): Promise<void> {
  const handle = client.schedule.getHandle(scheduleId);
  await handle.unpause();
}

export async function deleteSchedule(
  client: Client,
  scheduleId: string,
): Promise<void> {
  const handle = client.schedule.getHandle(scheduleId);
  await handle.delete();
}

export async function listSchedules(
  client: Client,
): Promise<Array<{ scheduleId: string }>> {
  const schedules: Array<{ scheduleId: string }> = [];
  for await (const schedule of client.schedule.list()) {
    schedules.push({ scheduleId: schedule.scheduleId });
  }
  return schedules;
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
