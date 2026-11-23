import type { Context } from "hono"
import type { Env } from "../types.ts"

export async function response404(c: Context<Env>) {
  // This works with vite dev but does not return 404 for invalid codes
  if (import.meta.env.DEV) return c.env.ASSETS.fetch(c.req.raw)
  // This does not work with vite dev but returns 404
  const assetResponse = await c.env.ASSETS.fetch(new URL("/", c.req.url))
  return new Response(assetResponse.body, {
    status: 404,
    headers: assetResponse.headers
  })
}