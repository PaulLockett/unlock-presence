import type { Context } from "hono";
import { streamSSE } from "hono/streaming";

export function handleTenantEvents(c: Context) {
  const tenantId = c.req.param("tenantId");
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: "heartbeat",
      data: JSON.stringify({ tenantId, timestamp: new Date().toISOString() }),
    });
    // TODO: Subscribe to Redis pub/sub for tenant events
    // For now, keep connection alive with periodic heartbeat
    while (true) {
      await stream.sleep(30000);
      await stream.writeSSE({
        event: "heartbeat",
        data: JSON.stringify({ tenantId, timestamp: new Date().toISOString() }),
      });
    }
  });
}

export function handleBrandEvents(c: Context) {
  const tenantId = c.req.param("tenantId");
  const brandId = c.req.param("brandId");
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: "heartbeat",
      data: JSON.stringify({ tenantId, brandId, timestamp: new Date().toISOString() }),
    });
    while (true) {
      await stream.sleep(30000);
      await stream.writeSSE({
        event: "heartbeat",
        data: JSON.stringify({ tenantId, brandId, timestamp: new Date().toISOString() }),
      });
    }
  });
}
