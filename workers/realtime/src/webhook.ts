import type { Context } from "hono";
import { SseEventSchema } from "@presence-os/schemas";
import type { ConnectionManager } from "./connections.js";

/**
 * Handle QStash webhook POST delivering an SSE event.
 * Auth is handled by qstashMiddleware before this handler runs.
 */
export async function handleWebhookEvent(
  c: Context,
  connectionManager: ConnectionManager,
): Promise<Response> {
  try {
    const body = await c.req.json();
    const parsed = SseEventSchema.safeParse(body.event);

    if (!parsed.success) {
      return c.json({ error: "Invalid event payload", issues: parsed.error.issues }, 400);
    }

    const event = parsed.data;
    const delivered = await connectionManager.broadcast(event);

    return c.json({ delivered, eventId: event.id });
  } catch {
    return c.json({ error: "Failed to process webhook" }, 500);
  }
}
