// Helper functions related to session management

import { env } from "cloudflare:workers"
import type { Context } from "hono"
import { deleteCookie, setCookie, setSignedCookie } from "hono/cookie"

export const setSessionCookies = async (c: Context, username: string) => {
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
  await setCookie( // This cookie signals to the client that the user is logged in, as the client cannot access __Host-session
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

export const hmacSha256 = async (base64In: string): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.fromBase64(env.KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [ "sign" ]
  )
  const hashBits = await crypto.subtle.sign(
    "HMAC",
    key,
    Uint8Array.fromBase64(base64In)
  )
  return new Uint8Array(hashBits)
}