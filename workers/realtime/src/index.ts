import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { handleTenantEvents, handleBrandEvents } from "./sse.js";

const app = new Hono();

// Health check
app.get("/health", (c) => c.json({ status: "ok", service: "realtime-sse" }));

// SSE endpoints
app.get("/events/:tenantId", handleTenantEvents);
app.get("/events/:tenantId/:brandId", handleBrandEvents);

const port = parseInt(process.env.PORT ?? "8001", 10);
console.log(`Realtime SSE server starting on port ${port}`);
serve({ fetch: app.fetch, port });
