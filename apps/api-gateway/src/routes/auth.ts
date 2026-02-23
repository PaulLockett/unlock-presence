import { Hono } from "hono";

const auth = new Hono();

auth.get("/callback/:platform", (c) => {
  return c.json({ error: "Not Implemented", message: "OAuth callback not yet implemented" }, 501);
});

export { auth };
