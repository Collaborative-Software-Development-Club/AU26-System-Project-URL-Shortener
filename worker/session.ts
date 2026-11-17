import { env } from "cloudflare:workers"
import { HTTPException } from "hono/http-exception"

const KEY = await crypto.subtle.importKey("raw", Uint8Array.fromBase64(env.KEY), { name: "HMAC", hash: "SHA-256" }, false, [ "sign" ])
const encoder = new TextEncoder()

export const generateToken = async (username: string, expiration: number): Promise<string> => {
  const payload = encoder.encode(JSON.stringify({ username, expiration }))
  const signature = await crypto.subtle.sign("HMAC", KEY, payload)
  return JSON.stringify({ username, expiration, signature: new Uint8Array(signature).toBase64() })
}

export const isValid = async (token: string): Promise<boolean> => {
  // Parse session cookie
  let data
  try {
    data = JSON.parse(token)
  } catch {
    throw new HTTPException(400)
  }
  if (
    typeof data !== "object"
    || !("username" in data)
    || typeof data.username !== "string"
    || !("expiration" in data)
    || typeof data.username !== "number"
    || !("signature" in data)
    || typeof data.username !== "string"
  ) throw new HTTPException(400)

  let signature: Uint8Array
  try {
    signature = Uint8Array.fromBase64(data.signature)
  } catch {
    throw new HTTPException(400)
  }

  const payload = encoder.encode(JSON.stringify({ username: data.username, expiration: data.expiration }))
  return await crypto.subtle.verify("HMAC", KEY, signature, payload)
}