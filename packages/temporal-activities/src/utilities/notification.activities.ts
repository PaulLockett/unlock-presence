// U4: Notification — Cross-cutting notification infrastructure

export async function alert(_input: {
  tenantId: string;
  userId?: string;
  alertType: string;
  context: unknown;
}): Promise<{ delivered: boolean }> {
  throw new Error("Not implemented: U4.alert");
}

export async function notify(_input: {
  tenantId: string;
  userId?: string;
  notificationType: string;
  context: unknown;
}): Promise<{ queued: boolean }> {
  throw new Error("Not implemented: U4.notify");
}
