import type { Client } from "@upstash/qstash";
import type { SseEvent } from "@presence-os/schemas";
import { publishEvent } from "@presence-os/message-bus";
import { sendEmail, type EmailInput } from "./email.js";
import { randomUUID } from "node:crypto";

export interface NotifyInput {
  tenantId: string;
  brandId?: string;
  notificationType: string;
  context: unknown;
  email?: Omit<EmailInput, "from">;
}

/**
 * Send a notification via SSE and optionally queue an email.
 * Combines both channels: real-time push + async email delivery.
 */
export async function sendNotification(
  qstashClient: Client,
  realtimeUrl: string,
  input: NotifyInput,
): Promise<{ sseDelivered: boolean; emailQueued: boolean }> {
  const event: SseEvent = {
    id: randomUUID(),
    type: "notification",
    tenantId: input.tenantId,
    brandId: input.brandId,
    timestamp: new Date().toISOString(),
    data: { notificationType: input.notificationType, context: input.context },
  };

  let sseDelivered = false;
  let emailQueued = false;

  try {
    await publishEvent(qstashClient, realtimeUrl, event);
    sseDelivered = true;
  } catch {
    // SSE delivery failed — continue to email
  }

  if (input.email) {
    const result = await sendEmail(input.email);
    emailQueued = result.queued;
  }

  return { sseDelivered, emailQueued };
}
