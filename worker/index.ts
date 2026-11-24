import { Hono } from "hono"
import { logger } from "hono/logger"

import response404 from "./reponses/not-found.ts"
import redirects from "./routes/redirects.ts"
import auth from "./routes/auth.ts"
import links from "./routes/links.ts"
import protectedRoutes from "./routes/protected.ts"

const app = new Hono<{ Bindings: CloudflareBindings }>()

// // To test whether a certain request invokes the worker
// app.use("*", async (c, next) => {
//   console.log("worker request", c.req.method, c.req.path)
//   await next()
// })


if (import.meta.env.DEV) app.use(logger())

app.route('/api', auth)
app.route('/api', links)
app.route('/api/user', protectedRoutes) // TODO either update this path in api docs, or revert to /api
app.route('/', redirects)
app.get("*", response404)


export default app
