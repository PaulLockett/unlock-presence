import { describe, it, expect, vi } from "vitest";
import { sendAlert } from "./alert.js";
import type { Client } from "@upstash/qstash";

vi.mock("@presence-os/message-bus", () => ({
  publishEvent: vi.fn().mockResolvedValue({ messageId: "msg-1" }),
}));

function mockQStash() {
  return {} as Client;
}

describe("sendAlert", () => {
  it("delivers an alert via SSE", async () => {
    const result = await sendAlert(mockQStash(), "https://rt.example.com", {
      tenantId: "t1",
      brandId: "b1",
      alertType: "content.flagged",
      context: { contentId: "c1" },
    });
    expect(result.delivered).toBe(true);
  });

  it("returns delivered: false on publish failure", async () => {
    const { publishEvent } = await import("@presence-os/message-bus");
    (publishEvent as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network"));

    const result = await sendAlert(mockQStash(), "https://rt.example.com", {
      tenantId: "t1",
      alertType: "error",
      context: {},
    });
    expect(result.delivered).toBe(false);
  });
});
