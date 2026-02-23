import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { ConnectionManager } from "./connections.js";
import { handleTenantEvents, handleBrandEvents } from "./sse.js";
import { handleWebhookEvent } from "./webhook.js";
import { qstashMiddleware } from "@presence-os/auth";

const app = new Hono();
const connectionManager = new ConnectionManager();

// Health check
app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "realtime-sse",
    connections: connectionManager.size,
  }),
);

// QStash webhook — receives pushed events and broadcasts to SSE clients
app.post("/webhook/events", qstashMiddleware(), (c) => handleWebhookEvent(c, connectionManager));

// SSE endpoints — clients connect here and receive events via the connection manager
app.get("/events/:tenantId", (c) => handleTenantEvents(c, connectionManager));
app.get("/events/:tenantId/:brandId", (c) => handleBrandEvents(c, connectionManager));

const port = parseInt(process.env.PORT ?? "8001", 10);
console.log(`Realtime SSE server starting on port ${port}`);
serve({ fetch: app.fetch, port });
