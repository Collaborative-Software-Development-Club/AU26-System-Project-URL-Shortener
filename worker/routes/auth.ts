import { Hono } from "hono"
import type { Env } from "../types.ts"
import { HTTPException } from "hono/http-exception";
import { clearSessionCookies, hmacSha256, setSessionCookies } from "../session.ts";

const auth = new Hono<Env>();

auth.get("/api/hash-information", async (c) => {
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


auth.post("/api/login", async (c) => {
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

  // Get hash from database
  const dbResponse = await c.env.DB
    .prepare("SELECT hash FROM users WHERE username = ?")
    .bind(request.username)
    .first<{ hash: Uint8Array }>()
  if (dbResponse === null) throw new HTTPException(401)

  // Generate hash from user input
  const userHash = await hmacSha256(request.hash)

  // Check equality
  for (let i = 0; i < userHash.length; i++) {
    if (userHash[i] !== dbResponse.hash[i]) throw new HTTPException(401)
  }

  // Authentication granted
  await setSessionCookies(c, request.username)
  return c.body(null, 204)
})


auth.post("/api/create-account", async (c) => {
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
  return c.body(null, 204)
})


auth.post("/api/logout", async (c) => {
  clearSessionCookies(c)
  return c.body(null, 204)
})

export default auth;