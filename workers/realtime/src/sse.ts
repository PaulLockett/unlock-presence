import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { ConnectionManager } from "./connections.js";

/**
 * SSE handler for tenant-level events.
 * Registers connection with the ConnectionManager; events arrive via webhook push.
 * Heartbeat keeps the connection alive every 30s.
 */
export function handleTenantEvents(c: Context, connectionManager: ConnectionManager) {
  const tenantId = c.req.param("tenantId");
  return streamSSE(c, async (stream) => {
    const conn = connectionManager.addConnection(tenantId, undefined, stream);
    try {
      await stream.writeSSE({
        event: "heartbeat",
        data: JSON.stringify({ tenantId, timestamp: new Date().toISOString() }),
      });
      while (true) {
        await stream.sleep(30000);
        await stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ tenantId, timestamp: new Date().toISOString() }),
        });
      }
    } finally {
      connectionManager.removeConnection(conn);
    }
  });
}

/**
 * SSE handler for brand-level events.
 * Only receives events matching this tenant + brand.
 */
export function handleBrandEvents(c: Context, connectionManager: ConnectionManager) {
  const tenantId = c.req.param("tenantId");
  const brandId = c.req.param("brandId");
  return streamSSE(c, async (stream) => {
    const conn = connectionManager.addConnection(tenantId, brandId, stream);
    try {
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
    } finally {
      connectionManager.removeConnection(conn);
    }
  });
}
