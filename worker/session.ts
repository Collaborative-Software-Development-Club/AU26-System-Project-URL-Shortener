// Helper functions related to session management

import { env } from "cloudflare:workers"
import type { Context } from "hono"
import { deleteCookie, getSignedCookie, setCookie, setSignedCookie } from "hono/cookie"
import { HTTPException } from "hono/http-exception"
import type { AuthUser, Env } from "./types.ts"

export const setSessionCookies = async (c: Context<Env>, username: string) => {
  await setSignedCookie( // This cookie provides proof that the user is logged in.
    c,
    "session", // Cookie name
    JSON.stringify({ // Cookie value
      username,
      expiration: Math.floor(Date.now() / 1000) + 2592000 // 30 days expiration
    }),
    Uint8Array.fromBase64(c.env.KEY), // Secret for signing
    { // Cookie options
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 31536000, // 1 year (session will expire long before then)
      prefix: "host"
    }
  )
  setCookie( // This cookie signals to the client that the user is logged in, as the client cannot access __Host-session
    c,
    "logged-in", // Cookie name
    "", // Cookie value
    { // Cookie options
      maxAge: 2588400, // 1 hour before __Host-session, so there is never a situation where client thinks it is not logged in but actually is
      sameSite: "Strict"
    }
  )
}

export const clearSessionCookies = async (c: Context) => {
  deleteCookie(
    c,
    "session", // Cookie name
    { // Cookie options
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 31536000, // 1 year (session will expire long before then)
      prefix: "host"
    }
  )
  deleteCookie(
    c,
    "logged-in", // Cookie name
    { // Cookie options
      maxAge: 2588400, // 1 hour before __Host-session, so there is never a situation where client thinks it is not logged in but actually is
      sameSite: "Strict"
    }
  )
}


export const key = await crypto.subtle.importKey(
  "raw",
  Uint8Array.fromBase64(env.KEY),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
)

// Base64In must be valid base64
export const hmacSha256 = async (base64In: string): Promise<Uint8Array> => {
  // Process user input
  let hashIn
  try { hashIn = Uint8Array.fromBase64(base64In) }
  catch (e) { throw new HTTPException(400) }
  if (hashIn.byteLength !== 32) throw new HTTPException(400)

  // Create HMAC-SHA256 hash
  const hashBits = await crypto.subtle.sign(
    "HMAC",
    key,
    hashIn
  )
  return new Uint8Array(hashBits)
}

function safeParse(str: string): Record<any, any> | null {
  try {
    return JSON.parse(str);
  } catch (_) {
    return null;
  }
}

export async function validateSession(c: Context<Env>): Promise<AuthUser | null> {
  const sessionCookie = await getSignedCookie(c, Uint8Array.fromBase64(c.env.KEY), 'session', 'host');
  if (!sessionCookie) {
    await clearSessionCookies(c);
    return null;
  }

  const session = safeParse(sessionCookie);
  if (!session || typeof session != 'object' || typeof session.username != 'string' || typeof session.expiration != 'number' || !Number.isFinite(session.expiration)) {
    await clearSessionCookies(c);
    return null;
  }

  const username = session.username;
  const expiration = session.expiration;

  if (expiration <= Math.floor(Date.now() / 1000)) {
    await clearSessionCookies(c);
    return null;
  }

  const user = await c.env.DB
    .prepare("SELECT id, username FROM users WHERE username = ?")
    .bind(username)
    .first<AuthUser>()

  if (user == null) {
    await clearSessionCookies(c);
  }

  return user;
}
