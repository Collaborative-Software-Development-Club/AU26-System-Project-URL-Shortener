import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

import { encode, decode, InvalidCodeError } from "./short-code-generation.ts"
import { clearSessionCookies, hmacSha256, setSessionCookies } from "./session.ts"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// })


app.post("/api/shorten", async (c) => {
  const request = await c.req.parseBody()
  if (typeof request?.url !== "string") {
    throw new HTTPException(400)
  }

  const insertResult = await c.env.DB
    .prepare("INSERT INTO links (url) VALUES (?)")
    .bind(request.url.trim())
    .run()
  const id = insertResult.meta.last_row_id

  return c.json({ code: await encode(id) })
})


app.get("/api/hash-information", async (c) => {
  const username = c.req.query("username")
  if (username === undefined) throw new HTTPException(400)
  
  // Get salt from database
  const dbResponse = await c.env.DB
    .prepare("SELECT salt FROM users WHERE username = ?")
    .bind(username)
    .first<{ salt: string }>()
  if (dbResponse === null) {
    throw new HTTPException(404)
  }

  return c.json({ salt: dbResponse.salt })

})


app.post("/api/login", async (c) => {
  const request = await c.req.json<unknown>()
  if (
    // Verify request according to API
    typeof request !== "object"
    || request === null
    || !("username" in request)
    || typeof request.username !== "string"
    || request.username.length >= 64
    || !("hash" in request)
    || typeof request.hash !== "string"
    || request.hash.length >= 64
  ) throw new HTTPException(400)

  // Get hash from database
  const dbResponse = await c.env.DB
    .prepare("SELECT hash FROM users WHERE username = ?")
    .bind(request.username)
    .first<{ hash: Uint8Array }>()
  if (dbResponse === null) {
    throw new HTTPException(401)
  }

  // Generate hash from user input
  const userHash = await hmacSha256(request.hash)
  if (userHash.byteLength !== 32) throw new HTTPException(400)

  // Check equality
  for (let i = 0; i < userHash.length; i++) {
    if (userHash[i] !== dbResponse.hash[i]) throw new HTTPException(401)
  }

  // Authentication granted
  await setSessionCookies(c, request.username)
  return c.body(null, 200)
})


app.post("/api/create-account", async (c) => {
  const request = await c.req.json<unknown>()
  if (
    // Verify request according to API
    typeof request !== "object"
    || request === null
    || !("username" in request)
    || typeof request.username !== "string"
    || request.username.length >= 64
    || !("hash" in request)
    || typeof request.hash !== "string"
    || request.hash.length >= 64
    || !("salt" in request)
    || typeof request.salt !== "string"
    || request.salt.length >= 64
  ) throw new HTTPException(400)

  try {
    await c.env.DB
      .prepare("INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)")
      .bind(request.username, await hmacSha256(request.hash), request.salt)
      .run()
  } catch (e: any) {
    // User already exists: return 409
    throw e.message.includes("UNIQUE constraint failed") ? new HTTPException(409) : e
  }

  // Success
  await setSessionCookies(c, request.username)
  return c.body(null, 201)
})


app.post("/api/logout", async (c) => {
  clearSessionCookies(c)
  return c.body(null, 204)
})


app.get("/api/urls", async (c) => {

})


app.patch("/api/urls/:code", async (c) => {

})


app.delete("/api/urls/:code", async (c) => {

})


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

    return c.redirect(result.url)

  } catch (e) {
    if (e instanceof InvalidCodeError) {
      c.status(404)
      return c.env.ASSETS.fetch(c.req.raw)
    }
    throw e
  }
})


// Display SPA with not found page otherwise
app.get("*", async (c) => {
  c.status(404)
  return c.env.ASSETS.fetch(c.req.raw)
})


export default app
