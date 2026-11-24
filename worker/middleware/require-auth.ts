import { HTTPException } from "hono/http-exception";
import { validateSession } from "../session.ts";
import type { Env } from "../types.ts";
import { createMiddleware } from "hono/factory";

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const user = await validateSession(c);
  if (!user) throw new HTTPException(401);

  c.set("user", user);
  await next();
});