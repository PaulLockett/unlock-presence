import { Hono } from "hono";

const workflows = new Hono();

// POST /api/v1/workflows/start
workflows.post("/start", (c) => {
  return c.json({ error: "Not Implemented", message: "Workflow start not yet implemented" }, 501);
});

// GET /api/v1/workflows/:id/status
workflows.get("/:id/status", (c) => {
  return c.json({ error: "Not Implemented", message: "Workflow status not yet implemented" }, 501);
});

// POST /api/v1/workflows/:id/signal
workflows.post("/:id/signal", (c) => {
  return c.json({ error: "Not Implemented", message: "Workflow signal not yet implemented" }, 501);
});

export { workflows };
