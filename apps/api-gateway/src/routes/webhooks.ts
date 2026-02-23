import { Hono } from "hono";

const webhooks = new Hono();

webhooks.post("/stripe", (c) => {
  return c.json({ error: "Not Implemented", message: "Stripe webhook not yet implemented" }, 501);
});

webhooks.post("/x", (c) => {
  return c.json({ error: "Not Implemented", message: "X webhook not yet implemented" }, 501);
});

webhooks.post("/linkedin", (c) => {
  return c.json({ error: "Not Implemented", message: "LinkedIn webhook not yet implemented" }, 501);
});

export { webhooks };
