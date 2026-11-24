import { Hono } from "hono"
import type { Env } from "../types.ts"
import { HTTPException } from "hono/http-exception"
import { decode, encode, InvalidCodeError } from "../short-code-generation.ts"
import { getSessionUserId } from "../session.ts"

const links = new Hono<Env>()


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

  return c.json({ code: await encode(id) })
})


links.get("/count/:code", async (c) => {
  let id
  try {
    id = await decode(c.req.param("code"))
  } catch (e) {
    if (e instanceof InvalidCodeError) throw new HTTPException(404)
    throw e
  }

  const result = await c.env.ANALYTICS_SQL.query<{ count: number }>({
    query: `SELECT COUNT(*) AS count FROM events.analyticsEngine."${c.env.ANALYTICS_DATASET}" WHERE index1 = $code AND timestamp >= $start`,
    params: {
      start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // last 30 days
      code: id
    }
  })

  return c.json({ count: result.data[0]?.count ?? 0 })
})

export default links