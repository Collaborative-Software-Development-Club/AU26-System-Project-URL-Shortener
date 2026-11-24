import { Hono } from "hono";
import type { Env } from "../types.ts";
import { getSessionUserId } from "../session.ts"
import { HTTPException } from "hono/http-exception";

const protectedRoutes = new Hono<Env>();

protectedRoutes.use('*', async(c, next) => {
  // Validate session and set username
  const userId = await getSessionUserId(c)
  if (userId === null) throw new HTTPException(401)
  c.set("userId", userId)
  await next()
})

protectedRoutes.get("/urls", async (c) => {
  const result = await c.env.DB
    .prepare("SELECT id, url FROM links where owner = ?")
    .bind(c.get("userId"))
    .all();

  return c.json(result.results);
})


// app.patch("/urls/:code", async (c) => {

// })


// app.delete("/urls/:code", async (c) => {

// })

export default protectedRoutes;