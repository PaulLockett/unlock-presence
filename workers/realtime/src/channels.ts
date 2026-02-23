// Channel subscription management stub
// Will be backed by Redis pub/sub in production

export interface Subscription {
  tenantId: string;
  brandId?: string;
  connectionId: string;
}

const subscriptions = new Map<string, Subscription>();

export function subscribe(sub: Subscription): void {
  subscriptions.set(sub.connectionId, sub);
}

export function unsubscribe(connectionId: string): void {
  subscriptions.delete(connectionId);
}

export function getSubscriptions(tenantId: string, brandId?: string): Subscription[] {
  return Array.from(subscriptions.values()).filter(
    (s) => s.tenantId === tenantId && (!brandId || s.brandId === brandId),
  );
}
