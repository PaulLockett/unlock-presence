import { Hono } from "hono";

const analytics = new Hono();

analytics.get("/export", (c) => {
  return c.json({ error: "Not Implemented", message: "Analytics export not yet implemented" }, 501);
});

export { analytics };
