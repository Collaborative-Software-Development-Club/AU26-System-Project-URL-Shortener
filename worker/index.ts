import { Hono } from "hono"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// })

/**
 * POST /api/shorten — Create a short code for a URL.
 *
 * Request: multipart/form-data
 * - url (string): the URL to shorten
 *
 * Response: application/json
 * - code (string): the identifier used for redirects
 */
app.post("/api/shorten", async (c) => {
  const request = await c.req.parseBody<{ url: string }>()

  let id: number
  // Insert the URL into the database, and get the ID
  try {
    const initialInsert = await c.env.DB
      .prepare("INSERT INTO links (url) VALUES (?)")
      .bind(request.url.trim())
      .run()
    id = initialInsert.meta.last_row_id
  } catch (e) {
    if (!(e instanceof Error)) throw e
    return c.text(e.message, 500)
  }

  // Generate a code where size depends on ID
  const numberOfCharacters = Math.ceil(Math.log2(id * 1000) / 6)
    // Math.log2(x) / 6 is effectively log_base_64(x)
    // The 1000 is the "space factor", where one of 1000 possible codes will be valid
  const randomBytes = new Uint8Array(Math.ceil(numberOfCharacters * 3/4))
  let code
  // Keep trying codes until one works
  while (true) {
    // Generate a random code
    crypto.getRandomValues(randomBytes)
    code = randomBytes.toBase64({ alphabet: "base64url" }).slice(0, numberOfCharacters)
    // Try inserting it into database
    try {
      await c.env.DB
        .prepare("UPDATE links SET code = ? WHERE id = ?")
        .bind(code, id)
        .run()
      break
    } catch (e) {
      if (!(e instanceof Error)) throw e
      if (!e.message.includes("SQLITE_CONSTRAINT_UNIQUE")) return c.text(e.message, 500)
    }
  }

  return c.json({ code })
})


// Check database for URL
app.get("/:code", async (c) => {
  const code = c.req.param("code")
  const result = await c.env.DB
    .prepare("SELECT url FROM links WHERE code = ?")
    .bind(code)
    .first<{ url: string }>()

  if (!result) {
    return c.env.ASSETS.fetch(c.req.raw)
  }

  return c.redirect(result.url)
})

// Display SPA with not found page otherwise
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
