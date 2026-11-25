import { Hono } from "hono"
import type { Env } from "../types.ts"
import { getSessionUserId } from "../session.ts"
import { HTTPException } from "hono/http-exception"
import { zValidator } from "@hono/zod-validator"
import { UrlsQuerySchema } from "../../shared/schema.ts"

const protectedRoutes = new Hono<Env>()

  .use('*', async (c, next) => {
    // Validate session and set username
    const userId = await getSessionUserId(c)
    if (userId === null) throw new HTTPException(401)
    c.set("userId", userId)
    await next()
  })

  .get("/urls", zValidator("query", UrlsQuerySchema), async (c) => {
    
    const { page } = c.req.valid("query"); 

    const result = await c.env.DB
      .prepare("SELECT url, code, description, create_time FROM links WHERE owner = ? ORDER BY create_time DESC LIMIT 50 OFFSET ?")
      .bind(c.get("userId"), page * 50)
      .all()

    return c.json({ urls: result.results })
  })


// protectedRoutes.patch("/urls/:code", async (c) => {

// })


// protectedRoutes.delete("/urls/:code", async (c) => {

// })

export default protectedRoutes