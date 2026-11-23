import { Context, Hono } from "hono"
import { HTTPException } from "hono/http-exception"

import { encode, decode, InvalidCodeError } from "./short-code-generation.ts"
import { clearSessionCookies, hmacSha256, setSessionCookies } from "./session.ts"
import { response404 } from "./reponses/not-found.ts"
import redirects from "./routes/redirects.ts"
import auth from "./routes/auth.ts"
import links from "./routes/links.ts"
import { logger } from "hono/logger"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// })


// Display SPA with not found page otherwise

app.use(logger());

app.route('/api', auth);
app.route('/api', links);
app.route('/', redirects);
app.get("*", response404)


export default app
