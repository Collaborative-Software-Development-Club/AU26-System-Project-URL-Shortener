import { Hono } from "hono"
import type { Env } from "../types.ts"
import { HTTPException } from "hono/http-exception"
import { clearSessionCookies, key, setSessionCookies } from "../session.ts"

const auth = new Hono<Env>()

auth.get("/hash-information", async (c) => {
  const username = c.req.query("username")
  if (username === undefined) throw new HTTPException(400)

  // Get salt from database
  const dbResponse = await c.env.DB
    .prepare("SELECT salt FROM users WHERE username = ?")
    .bind(username)
    .first<{ salt: string }>()
  if (dbResponse === null) throw new HTTPException(404)

  return c.json({ salt: dbResponse.salt })
})


auth.post("/login", async (c) => {
  // Process user input
  let request
  try { request = await c.req.json<unknown>() }
  catch (e) { throw new HTTPException(400) }
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

  // Get hash, id from database
  const dbResponse = await c.env.DB
    .prepare("SELECT id, hash FROM users WHERE username = ?")
    .bind(request.username)
    .first<{ id: number, hash: number[] }>()
  if (dbResponse === null) throw new HTTPException(401)

  // Verify hash is valid
  let valid
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      new Uint8Array(dbResponse.hash),
      Uint8Array.fromBase64(request.hash)
    )
  } catch { throw new HTTPException(400) }
  if (!valid) throw new HTTPException(401)

  // Authentication granted
  await setSessionCookies(c, dbResponse.id)
  return c.body(null, 204)
})


// TODO: fix issue. register accepts wrong length salts or empty
auth.post("/create-account", async (c) => {
  // Process user input
  let request
  try { request = await c.req.json<unknown>() }
  catch (e) { throw new HTTPException(400) }
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
  try { Uint8Array.fromBase64(request.salt) }
  catch (e) { throw new HTTPException(400) }

  // Create HMAC-SHA256 hash
  let hashIn
  try { hashIn = Uint8Array.fromBase64(request.hash) }
  catch (e) { throw new HTTPException(400) }
  if (hashIn.byteLength !== 32) throw new HTTPException(400)
  const hashBits = await crypto.subtle.sign(
    "HMAC",
    key,
    hashIn
  )

  // Insert account into DB
  let dbResult
  try {
    dbResult = await c.env.DB
      .prepare("INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)")
      .bind(request.username, new Uint8Array(hashBits), request.salt)
      .run()
  } catch (e: any) {
    // User already exists: return 409
    throw e.message.includes("UNIQUE constraint failed") ? new HTTPException(409) : e
  }

  // Success
  await setSessionCookies(c, dbResult.meta.last_row_id)
  return c.body(null, 204)
})


auth.post("/logout", async (c) => {
  clearSessionCookies(c)
  return c.body(null, 204)
})

export default auth