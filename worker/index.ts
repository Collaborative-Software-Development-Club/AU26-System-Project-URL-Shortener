import { Hono } from "hono"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// });

app.post("/api/shorten", async (c) => {
  const linkBody = await c.req.json<{ link: string }>()
  if (!linkBody || !linkBody.link) {
    return c.text("Invalid", 400)
  }

  console.log(linkBody.link)

  return c.text("Success", 200)
})

// Check database for URL
app.get("/1234567890", async (c) => {
  return c.redirect("https://google.com")
})

// Display SPA with not found page otherwise
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app