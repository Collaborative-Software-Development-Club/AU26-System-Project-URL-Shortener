import { Hono } from "hono"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// });

function generateCode() {
  return Math.random().toString(36).substr(2, 9);
}

app.post("/api/shorten", async (c) => {
  const linkBody = await c.req.json<{ link: string }>()
  if (!linkBody || !linkBody.link) {
    return c.text("Invalid", 400)
  }

  const link = linkBody.link;
  const code = generateCode();

  const result = await c.env.DB
    .prepare('INSERT INTO links (code, url) VALUES (?, ?)')
    .bind(code, link)
    .run();

  return c.json({
    id: result.meta.last_row_id,
    code,
    url: link
  }, 200);

})

// Check database for URL
app.get("/:code", async (c) => {
  const code = c.req.param("code");
  const result = await c.env.DB
    .prepare('SELECT url FROM links WHERE code = ?')
    .bind(code)
    .first<{ url: string }>();

  if (!result) {
    return c.text("Not Found", 404);
  }

  return c.redirect(result.url);
})

// Display SPA with not found page otherwise
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app