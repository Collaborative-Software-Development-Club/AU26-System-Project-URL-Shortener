import { Hono } from "hono"
import { encode, decode } from "./codes-crypto.ts";

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// })


app.post("/api/shorten", async (c) => {
  const request = await c.req.parseBody<{ url: string }>();
  if (typeof request?.url !== "string") {
    return c.body(null, 400)
  }

  const insertResult = await c.env.DB
      .prepare("INSERT INTO links (url) VALUES (?)")
      .bind(request.url.trim())
      .run()
  const id = insertResult.meta.last_row_id;

  return c.json({ code: encode(id) })
})


app.get("/api/hash-information", async (c) => {

})


app.post("/api/login", async (c) => {

})


app.post("/api/create-account", async (c) => {

})


app.get("/api/urls", async (c) => {

})


app.patch("/api/urls/:code", async (c) => {

})


app.delete("/api/urls/:code", async (c) => {

})


app.get("/:code", async (c) => {
  const code = c.req.param("code")
  const id = decode(code);
  const result = await c.env.DB
    .prepare("SELECT url FROM links WHERE id = ?")
    .bind(id)
    .first<{ url: string }>()

  if (!result) {
    // TODO make this return 404
    return c.env.ASSETS.fetch(c.req.raw)
  }

  return c.redirect(result.url)
})


// Display SPA with not found page otherwise
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})


export default app
