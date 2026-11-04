import { Hono } from "hono"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// })


// In all cases, frontend code is responsible for handling 400, 401, 403, 409 and 500 error codes, which will have no body.

/**
 * POST /api/shorten — Create a short code for a URL
 *
 * Request: multipart/form-data
 * - url (string): the URL to shorten
 *
 * Response: application/json
 * { code: string }
 */
app.post("/api/shorten", async (c) => {
  let request:{ url: string }
  try {
    request = await c.req.parseBody()
    if (typeof request?.url !== "string") throw new TypeError
  } catch (e) {
    return c.body(null, 400)
  }
  
  let id: number
  // Insert the URL into the database, and get the ID
  try {
    const initialInsert = await c.env.DB
      .prepare("INSERT INTO links (url) VALUES (?)")
      .bind(request.url.trim())
      .run()
    id = initialInsert.meta.last_row_id
  } catch (e) {
    return c.body(null, 500)
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
      if (!e.message.includes("SQLITE_CONSTRAINT_UNIQUE")) return c.body(null, 500)
    }
  }

  return c.json({ code })
})


/**
 * GET /api/hash-information — Information necessary to guess password as part of login process
 * 
 * Query parameters:
 * - username
 * 
 * Response: application/json (or 404 if user does not exist)
 * {
 *   salt: base64,  // Random. Usually 128 bits in length
 *   algorithm: string,  // Usually "SHA-256"
 *   iterations: number,  // Usually 500000
 *   length: number  // Usually 256 (bits)
 * }
 */
app.get("/api/hash-information", async (c) => {
  
})


/**
 * POST /api/login — Log in user, creating a new session
 *
 * Request: application/json
 * {
 *   username: string,
 *   hash: string  // PBKDF2 hash of password
 * }
 *
 * Response: HTTP 204 (403 would mean incorrect username or password)
 * 
 * Set Cookies:
 * - session: a token that proves the user is logged in
 *   { username: string, expiration: number, signature: string }
 */
app.post("/api/login", async (c) => {

})


/**
 * POST /api/create-account — Create a new user
 *
 * Request: application/json
 * {
 *   username: string,
 *   hash: base64,  // PBKDF2 hash of password
 *   hashInfo: {
 *     salt: base64,  // Random. Usually 128 bits in length
 *     algorithm: string,  // Usually "SHA-256"
 *     iterations: number,  // Usually 500000
 *     length: number  // Usually 256 (bits)
 *   }
 * }
 *
 * Response: HTTP 204 (409 would mean username is taken)
 * 
 * Set Cookies:
 * - session: a token that proves the user is logged in
 *   { username: string, expiration: number, signature: string }
 */
app.post("/api/create-account", async (c) => {

})


/**
 * GET /api/urls — List all URLs that belong to logged-in user
 * 
 * Query parameters:
 * - page
 *
 * Response: application/json
 * { code: string, url: string, description: string | null, create_time: number }[]
 * - Sorted by create_time, descending
 * - Will return 50 per page
 */
app.get("/api/urls", async (c) => {

})


/**
 * PATCH /api/urls/{code} — Update a URL
 *
 * Request: application/json
 * { description?: string | null, url?: string }
 *
 * Response: HTTP 204
 */
app.patch("/api/urls/:code", async (c) => {

})


/**
 * DELETE /api/urls/{code} — Delete a URL
 *
 * Response: HTTP 204
 */
app.delete("/api/urls/:code", async (c) => {

})


/**
 * GET /{code} — Redirect to original URL
 *
 * Response: HTTP 302
 * If URL is not found, will redirect to SPA instead of returning 404
 */
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
