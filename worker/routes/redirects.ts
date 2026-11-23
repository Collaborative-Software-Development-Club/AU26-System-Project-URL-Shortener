import { Hono } from "hono";
import type { Env } from "../types.ts";
import { decode, InvalidCodeError } from "../short-code-generation.ts";
import { response404 } from "../reponses/not-found.ts";

const redirects = new Hono<Env>();


redirects.get("/:code", async (c) => {
  try {
    const code = c.req.param("code")
    const id = await decode(code)

    const result = await c.env.DB
      .prepare("SELECT url FROM links WHERE id = ?")
      .bind(id)
      .first<{ url: string }>()

    if (!result) throw new InvalidCodeError();

    c.env.ANALYTICS.writeDataPoint({
      "indexes": [String(id)],
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
    });

    return c.redirect(result.url)

  } catch (e) {
    if (e instanceof InvalidCodeError) return response404(c)
  }
})

export default redirects;