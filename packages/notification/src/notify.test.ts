import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendNotification } from "./notify.js";
import type { Client } from "@upstash/qstash";

const mockPublishEvent = vi.fn();
vi.mock("@presence-os/message-bus", () => ({
  publishEvent: (...args: unknown[]) => mockPublishEvent(...args),
}));

const mockResendSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

function mockQStash() {
  return {} as Client;
}

describe("sendNotification", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockPublishEvent.mockReset().mockResolvedValue({ messageId: "msg-1" });
    mockResendSend.mockReset().mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("sends SSE notification without email", async () => {
    const result = await sendNotification(mockQStash(), "https://rt.example.com", {
      tenantId: "t1",
      notificationType: "task.assigned",
      context: { taskId: "task-1" },
    });
    expect(result.sseDelivered).toBe(true);
    expect(result.emailQueued).toBe(false);
  });

  it("sends both SSE and email when email provided", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const result = await sendNotification(mockQStash(), "https://rt.example.com", {
      tenantId: "t1",
      notificationType: "task.assigned",
      context: {},
      email: {
        to: "user@example.com",
        subject: "New Task",
        html: "<p>Assigned</p>",
      },
    });
    expect(result.sseDelivered).toBe(true);
    expect(result.emailQueued).toBe(true);
  });

  it("continues to email if SSE fails", async () => {
    process.env.RESEND_API_KEY = "re_test";
    mockPublishEvent.mockRejectedValueOnce(new Error("network"));

    const result = await sendNotification(mockQStash(), "https://rt.example.com", {
      tenantId: "t1",
      notificationType: "error",
      context: {},
      email: {
        to: "admin@example.com",
        subject: "Alert",
        html: "<p>Error</p>",
      },
    });
    expect(result.sseDelivered).toBe(false);
    expect(result.emailQueued).toBe(true);
  });
});
