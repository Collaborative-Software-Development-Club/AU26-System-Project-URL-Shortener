import { Hono } from "hono";
import { requireAuth } from "../middleware/require-auth.ts";
import type { Env } from "../types.ts";

const protectedRoutes = new Hono<Env>();

protectedRoutes.use('*', requireAuth);

protectedRoutes.get("/urls", async (c) => {
  const user = c.get("user");

  const result = await c.env.DB
    .prepare("SELECT id, url, code FROM links where owner = ?")
    .bind(user.id)
    .all();

  return c.json(result.results);
})


// app.patch("/urls/:code", async (c) => {

// })


// app.delete("/urls/:code", async (c) => {

// })

export default protectedRoutes;