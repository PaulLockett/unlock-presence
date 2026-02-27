import { describe, it, expect, vi } from "vitest";
import {
  createSchedule,
  pauseSchedule,
  resumeSchedule,
  deleteSchedule,
  listSchedules,
  getDefaultBrandSchedules,
  type ScheduleConfig,
} from "./schedules.js";
import type { Client } from "@temporalio/client";

function mockClient() {
  const handle = {
    pause: vi.fn().mockResolvedValue(undefined),
    unpause: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  return {
    schedule: {
      create: vi.fn().mockResolvedValue(undefined),
      getHandle: vi.fn().mockReturnValue(handle),
      list: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { scheduleId: "sched-1" };
          yield { scheduleId: "sched-2" };
        },
      }),
    },
    _handle: handle,
  } as unknown as Client & { _handle: typeof handle };
}

describe("createSchedule", () => {
  it("creates a schedule with cron spec and default SKIP overlap", async () => {
    const client = mockClient();
    const config: ScheduleConfig = {
      scheduleId: "test-schedule",
      workflowType: "presence.operate",
      taskQueue: "presence-manager",
      cronExpression: "0 6 * * *",
      args: [{ tenantId: "t1" }],
    };

    await createSchedule(client as unknown as Client, config);

    expect((client as any).schedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleId: "test-schedule",
        spec: { cronExpressions: ["0 6 * * *"] },
        action: expect.objectContaining({
          type: "startWorkflow",
          workflowType: "presence.operate",
          taskQueue: "presence-manager",
        }),
      }),
    );
  });

  it("maps overlap policy string to Temporal enum", async () => {
    const client = mockClient();
    const config: ScheduleConfig = {
      scheduleId: "test",
      workflowType: "test",
      taskQueue: "test",
      cronExpression: "* * * * *",
      args: [],
      overlapPolicy: "BUFFER_ONE",
    };

    await createSchedule(client as unknown as Client, config);

    const call = (client as any).schedule.create.mock.calls[0][0];
    expect(call.policies.overlap).toBeDefined();
  });
});

describe("pauseSchedule", () => {
  it("gets handle and pauses", async () => {
    const client = mockClient();
    await pauseSchedule(client as unknown as Client, "sched-1");
    expect((client as any).schedule.getHandle).toHaveBeenCalledWith("sched-1");
    expect(client._handle.pause).toHaveBeenCalled();
  });
});

describe("resumeSchedule", () => {
  it("gets handle and unpauses", async () => {
    const client = mockClient();
    await resumeSchedule(client as unknown as Client, "sched-1");
    expect((client as any).schedule.getHandle).toHaveBeenCalledWith("sched-1");
    expect(client._handle.unpause).toHaveBeenCalled();
  });
});

describe("deleteSchedule", () => {
  it("gets handle and deletes", async () => {
    const client = mockClient();
    await deleteSchedule(client as unknown as Client, "sched-1");
    expect(client._handle.delete).toHaveBeenCalled();
  });
});

describe("listSchedules", () => {
  it("iterates all schedules", async () => {
    const client = mockClient();
    const result = await listSchedules(client as unknown as Client);
    expect(result).toEqual([
      { scheduleId: "sched-1" },
      { scheduleId: "sched-2" },
    ]);
  });
});

describe("getDefaultBrandSchedules", () => {
  it("returns 3 default schedules for a brand", () => {
    const schedules = getDefaultBrandSchedules("tenant-1", "brand-1");
    expect(schedules).toHaveLength(3);
  });

  it("uses tenant and brand IDs in schedule IDs", () => {
    const schedules = getDefaultBrandSchedules("t1", "b1");
    expect(schedules[0].scheduleId).toContain("t1");
    expect(schedules[0].scheduleId).toContain("b1");
  });

  it("includes daily harvest, weekly graduation, monthly evolve", () => {
    const schedules = getDefaultBrandSchedules("t1", "b1");
    const ids = schedules.map((s) => s.scheduleId);
    expect(ids.some((id) => id.includes("daily-harvest"))).toBe(true);
    expect(ids.some((id) => id.includes("weekly-graduation"))).toBe(true);
    expect(ids.some((id) => id.includes("monthly-evolve"))).toBe(true);
  });

  it("all schedules target PRESENCE_MANAGER task queue", () => {
    const schedules = getDefaultBrandSchedules("t1", "b1");
    for (const s of schedules) {
      expect(s.taskQueue).toBe("presence-manager");
    }
  });
});
