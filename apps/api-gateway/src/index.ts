import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { workflows } from "./routes/workflows.js";
import { webhooks } from "./routes/webhooks.js";
import { content } from "./routes/content.js";
import { analytics } from "./routes/analytics.js";
import { auth } from "./routes/auth.js";

const app = new Hono();

// Health check
app.get("/health", (c) => c.json({ status: "ok", service: "api-gateway" }));

// API routes
app.route("/api/v1/workflows", workflows);
app.route("/api/v1/webhooks", webhooks);
app.route("/api/v1/content", content);
app.route("/api/v1/analytics", analytics);
app.route("/api/v1/auth", auth);

const port = parseInt(process.env.PORT ?? "8000", 10);
console.log(`API Gateway starting on port ${port}`);
serve({ fetch: app.fetch, port });
