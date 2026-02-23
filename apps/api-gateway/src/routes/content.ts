import { Hono } from "hono";

const content = new Hono();

content.post("/submit", (c) => {
  return c.json({ error: "Not Implemented", message: "Content submission not yet implemented" }, 501);
});

export { content };
