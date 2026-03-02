import { describe, it, expect, vi } from "vitest";
import { publishEvent } from "./publish.js";
import type { Client } from "@upstash/qstash";
import type { SseEvent } from "@presence-os/schemas";

function mockQStashClient() {
  return {
    publishJSON: vi.fn().mockResolvedValue({ messageId: "msg-123" }),
  } as unknown as Client;
}

function mockEvent(overrides?: Partial<SseEvent>): SseEvent {
  return {
    id: "evt-1",
    type: "content.published",
    tenantId: "tenant-1",
    brandId: "brand-1",
    payload: { contentId: "c1" },
    timestamp: new Date().toISOString(),
    ...overrides,
  } as SseEvent;
}

describe("publishEvent", () => {
  it("publishes event to realtime webhook URL", async () => {
    const client = mockQStashClient();
    const event = mockEvent();

    const result = await publishEvent(client, "https://realtime.example.com", event);

    expect(result.messageId).toBe("msg-123");
    expect((client as any).publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://realtime.example.com/webhook/events",
        body: { event },
      }),
    );
  });

  it("includes tenant and brand headers", async () => {
    const client = mockQStashClient();
    const event = mockEvent({ tenantId: "t1", brandId: "b1" });

    await publishEvent(client, "https://rt.example.com", event);

    expect((client as any).publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Tenant-Id": "t1",
          "X-Brand-Id": "b1",
        }),
      }),
    );
  });

  it("defaults to 3 retries", async () => {
    const client = mockQStashClient();
    await publishEvent(client, "https://rt.example.com", mockEvent());

    expect((client as any).publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({ retries: 3 }),
    );
  });

  it("applies custom retries and delay", async () => {
    const client = mockQStashClient();
    await publishEvent(client, "https://rt.example.com", mockEvent(), {
      retries: 5,
      delaySec: 30,
    });

    expect((client as any).publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({ retries: 5, delay: 30 }),
    );
  });
});
