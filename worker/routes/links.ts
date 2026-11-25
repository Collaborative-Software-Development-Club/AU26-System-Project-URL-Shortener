import { Hono } from "hono"
import type { Env } from "../types.ts"
import { encode } from "../short-code-generation.ts"
import { getSessionUserId } from "../session.ts"
import { zValidator } from "@hono/zod-validator"
import { ShortenRequestSchema } from "../../shared/schema.ts"


const links = new Hono<Env>()


  .post("/shorten", zValidator('form', ShortenRequestSchema) ,async (c) => {

    const request = c.req.valid('form');

    const insertResult = await c.env.DB
      .prepare("INSERT INTO links (url, owner) VALUES (?, ?)")
      .bind(request.url, await getSessionUserId(c))
      .run()

    const id = insertResult.meta.last_row_id
    const code = await encode(id)

    c.executionCtx.waitUntil(
      c.env.DB
        .prepare("UPDATE links SET code = ? WHERE id = ?")
        .bind(code, id)
        .run()
    ) // Insert generated code into database
    // Must be done on seperate database call because code depends on ID

    return c.json({ code })
  })


  .get("/count/:code", async (c) => {

    const code = c.req.param("code");

    const result = await c.env.ANALYTICS_SQL.query<{ count: number }>({
      query: `SELECT COUNT(*) AS count FROM events.analyticsEngine."${c.env.ANALYTICS_DATASET}" WHERE index1 = $code AND timestamp >= $start`,
      params: {
        start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // last 30 days
        code
      }
    })

    return c.json({ count: result.data[0]?.count ?? 0 })
  })

export default links
