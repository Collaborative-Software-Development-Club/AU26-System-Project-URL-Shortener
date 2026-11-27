import { Hono } from "hono"
import type { Env } from "../types.ts"
import { InvalidCodeError } from "../short-code-generation.ts"
import response404 from "../reponses/not-found.ts"
import { ShortCodeParamsSchema } from "../../shared/schema.ts"

const redirects = new Hono<Env>()


  .get("/:code", async (c) => {

    const parsed = ShortCodeParamsSchema.safeParse(c.req.param())
    if (!parsed.success) return response404(c)

    const { code } = parsed.data

    try {

      const result = await c.env.DB
        .prepare("SELECT url FROM links WHERE code = ?")
        .bind(code)
        .first<{ url: string }>()

      if (!result) throw new InvalidCodeError()

      c.env.ANALYTICS.writeDataPoint({
        "indexes": [String(code)],
        "blobs": [
          c.req.header("CF-Connecting-IP") ?? "",
          c.req.header("User-Agent") ?? "",
          c.req.header("Referer") ?? "",
          String(c.req.raw.cf?.country ?? ""),
          String(c.req.raw.cf?.city ?? "")
        ],
        "doubles": [
          Number(c.req.raw.cf?.latitude ?? 0),
          Number(c.req.raw.cf?.longitude ?? 0)
        ]
      })

      return c.redirect(result.url)

    } catch (e) {
      if (e instanceof InvalidCodeError) return response404(c)
      throw e
    }
  })

export default redirects