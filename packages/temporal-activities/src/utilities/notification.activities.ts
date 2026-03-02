// U4: Notification — Cross-cutting notification infrastructure

import { createQStashClient } from "@presence-os/message-bus";
import { sendAlert } from "@presence-os/notification";
import { sendNotification } from "@presence-os/notification";

const getQStashClient = () => createQStashClient();
const getRealtimeUrl = () => process.env.REALTIME_SERVICE_URL ?? "http://localhost:8001";

export async function alert(input: {
  tenantId: string;
  brandId?: string;
  alertType: string;
  context: unknown;
}): Promise<{ delivered: boolean }> {
  return sendAlert(getQStashClient(), getRealtimeUrl(), input);
}

export async function notify(input: {
  tenantId: string;
  brandId?: string;
  notificationType: string;
  context: unknown;
  email?: { to: string; subject: string; html: string };
}): Promise<{ queued: boolean }> {
  const result = await sendNotification(getQStashClient(), getRealtimeUrl(), input);
  return { queued: result.sseDelivered || result.emailQueued };
}
