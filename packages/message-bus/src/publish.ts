import type { Client } from "@upstash/qstash";
import type { SseEvent } from "@presence-os/schemas";
import type { PublishOptions } from "./types.js";

/**
 * Publish an SSE event via QStash to the realtime service.
 * QStash durably stores the message and pushes it via HTTP POST
 * to the realtime service's webhook endpoint with automatic retries.
 */
export async function publishEvent(
  client: Client,
  realtimeUrl: string,
  event: SseEvent,
  options?: PublishOptions,
): Promise<{ messageId: string }> {
  const targetUrl = `${realtimeUrl}/webhook/events`;

  const response = await client.publishJSON({
    url: targetUrl,
    body: { event },
    headers: {
      "X-Tenant-Id": event.tenantId,
      ...(event.brandId ? { "X-Brand-Id": event.brandId } : {}),
    },
    retries: options?.retries ?? 3,
    ...(options?.delaySec ? { delay: options.delaySec } : {}),
  });

  return { messageId: response.messageId };
}
