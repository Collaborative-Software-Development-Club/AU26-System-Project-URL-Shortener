import { Hono } from "hono"
import type { Env } from "../types.ts"
import { HTTPException } from "hono/http-exception"
import { clearSessionCookies, key, setSessionCookies } from "../session.ts"
import { zValidator } from "@hono/zod-validator"
import { CreateAccountRequestSchema, HashInformationQuerySchema, LoginRequestSchema } from "../../shared/schema.ts"

const auth = new Hono<Env>()
  .get("/hash-information", zValidator('query', HashInformationQuerySchema), async (c) => {
    const { username } = c.req.valid('query');
    // Get salt from database
    const dbResponse = await c.env.DB
      .prepare("SELECT salt FROM users WHERE username = ?")
      .bind(username)
      .first<{ salt: string }>()
    if (dbResponse === null) throw new HTTPException(404)

    return c.json({ salt: dbResponse.salt })
  })
  .post("/login", zValidator('json', LoginRequestSchema), async (c) => {
    // Process user input
    const request = c.req.valid('json');

    // Get sha256 hash, id from database
    const dbResponse = await c.env.DB
      .prepare("SELECT id, hash FROM users WHERE username = ?")
      .bind(request.username)
      .first<{ id: number, hash: number[] }>()
    if (dbResponse === null) throw new HTTPException(401)

    if (
      !await crypto.subtle.verify(
        "HMAC",
        key,
        new Uint8Array(dbResponse.hash),
        request.hash
      )
    ) throw new HTTPException(401)

    // Authentication granted
    await setSessionCookies(c, dbResponse.id)
    return c.body(null, 204)
  })

  
  .post("/create-account", zValidator('json', CreateAccountRequestSchema), async (c) => {
    // Process user input
    const request = c.req.valid('json');
    // Create HMAC-SHA256 hash
    const hashBits = await crypto.subtle.sign(
      "HMAC",
      key,
      request.hash
    )

    // Insert account into DB
    const dbResult = await c.env.DB
      .prepare("INSERT INTO users (username, hash, salt) VALUES (?, ?, ?) ON CONFLICT DO NOTHING RETURNING id")
      .bind(request.username, new Uint8Array(hashBits), request.salt)
      .first<{ id: number }>()
    if (dbResult === null) throw new HTTPException(409) // User already exists

    // Success
    await setSessionCookies(c, dbResult.id)
    return c.body(null, 204)
  })


  .post("/logout", (c) => {
    clearSessionCookies(c)
    return c.body(null, 204)
  })

export default auth