import { Hono } from "hono"
import { encode, decode, InvalidCodeError } from "./codes-crypto.ts"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// })


app.post("/api/shorten", async (c) => {
  const request = await c.req.parseBody<{ url: string }>()
  if (typeof request?.url !== "string") {
    return c.body(null, 400)
  }

  const insertResult = await c.env.DB
    .prepare("INSERT INTO links (url) VALUES (?)")
    .bind(request.url.trim())
    .run()
  const id = insertResult.meta.last_row_id

  return c.json({ code: await encode(id) })
})


// app.get("/api/hash-information", async (c) => {

// })


// app.post("/api/login", async (c) => {

// })


// app.post("/api/create-account", async (c) => {

// })


// app.get("/api/urls", async (c) => {

// })


// app.patch("/api/urls/:code", async (c) => {

// })


// app.delete("/api/urls/:code", async (c) => {

// })


app.get("/:code", async (c) => {
  try {
    const code = c.req.param("code")
    const id = await decode(code)
    const result = await c.env.DB
      .prepare("SELECT url FROM links WHERE id = ?")
      .bind(id)
      .first<{ url: string }>()

    if (!result) {
      throw new InvalidCodeError
    }

    c.env.ANALYTICS.writeDataPoint({
      "indexes": [String(id)],
      "blobs": [
        c.req.header("CF-Connecting-IP") ?? "",
        c.req.header("User-Agent") ?? "",
        c.req.header("Referer") ?? "",
        String(c.req.raw.cf?.country ?? ""),
        String(c.req.raw.cf?.city ?? "")
      ],
      "doubles": [
        Number(c.req.raw.cf?.latitude ?? 0),
        Number(c.req.raw.cf?.longitude ?? 0)
      ]
    });

    return c.redirect(result.url)

  } catch (e) {
    if (e instanceof InvalidCodeError) {
      c.status(404)
      return c.env.ASSETS.fetch(c.req.raw)
    }
    throw e
  }
})

app.get("/api/count/:code", async (c) => {

  const code = c.req.param("code")
  const id = await decode(code)

  const result = await c.env.ANALYTICS_SQL.query<{ count: number }>({
    query: `SELECT COUNT(*) AS count FROM events.analyticsEngine."${c.env.ANALYTICS_DATASET}" WHERE index1 = $code AND timestamp >= $start`,
    params: {
      start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // last 30 days
      code: id
    }
  });

  return c.json({ count: result.data[0].count ?? 0 });
});

// Display SPA with not found page otherwise
app.get("*", async (c) => {
  c.status(404)
  return c.env.ASSETS.fetch(c.req.raw)
});


export default app
