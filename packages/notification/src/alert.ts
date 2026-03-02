import type { Client } from "@upstash/qstash";
import type { SseEvent } from "@presence-os/schemas";
import { publishEvent } from "@presence-os/message-bus";
import { randomUUID } from "node:crypto";

export interface AlertInput {
  tenantId: string;
  brandId?: string;
  alertType: string;
  context: unknown;
}

/**
 * Send a real-time alert via SSE.
 * Publishes an "alert" event through QStash to the realtime service.
 * No persistence — alerts are ephemeral push notifications.
 */
export async function sendAlert(
  qstashClient: Client,
  realtimeUrl: string,
  input: AlertInput,
): Promise<{ delivered: boolean }> {
  const event: SseEvent = {
    id: randomUUID(),
    type: "alert",
    tenantId: input.tenantId,
    brandId: input.brandId,
    timestamp: new Date().toISOString(),
    data: { alertType: input.alertType, context: input.context },
  };

  try {
    await publishEvent(qstashClient, realtimeUrl, event);
    return { delivered: true };
  } catch {
    return { delivered: false };
  }
}
