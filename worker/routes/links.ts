import { Context, Hono } from "hono"
import type { Env } from "../types.ts"
import { HTTPException } from "hono/http-exception"
import { encode } from "../short-code-generation.ts"
import { getSessionUserId } from "../session.ts"

const links = new Hono<Env>()

async function generateCodeToDB(c: Context<Env>, id: number, code: string) {
  await c.env.DB
    .prepare("UPDATE links SET code = ? WHERE id = ?")
    .bind(code, id)
    .run()
}

// TODO: reject on invalid url
links.post("/shorten", async (c) => {
  let request
  try { request = await c.req.parseBody() }
  catch (e) { throw new HTTPException(400) }
  if (typeof request.url !== "string" || request.url.length >= 1000) throw new HTTPException(400)

  const insertResult = await c.env.DB
    .prepare("INSERT INTO links (url, owner) VALUES (?, ?)")
    .bind(request.url.trim(), await getSessionUserId(c))
    .run()

  const id = insertResult.meta.last_row_id
  const code = await encode(id)

  c.executionCtx.waitUntil(generateCodeToDB(c, id, code))

  return c.json({ code })
})


links.get("/count/:code", async (c) => {

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