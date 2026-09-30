import { Hono } from "hono";

const app = new Hono();

app.get("/api/", (c) => {
  return c.json({
    name: "Clouflare"
  });
});

export default app;