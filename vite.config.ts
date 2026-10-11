import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { cloudflare } from "@cloudflare/vite-plugin"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { matchRoutes, type RouteObject } from "react-router-dom"

// https://vite.dev/config/
export default defineConfig({
  // fix so that the vite-react-ssg plugin works on the dev server
  plugins: [
    {
      name: "frontend-page-fallback",
      enforce: "pre",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (req.url && (req.method === "GET" || req.method === "HEAD")) {
              const url = new URL(req.url, "http://localhost")
              if (!req.headers.accept?.includes("text/html")) {
                next()
                return
              }

              const { routes } = await server.ssrLoadModule("/src/routes.tsx") as { routes: RouteObject[] }

              if (matchRoutes(routes, url.pathname)) {
                const template = await readFile(resolve(server.config.root, "index.html"), "utf-8")
                const html = await server.transformIndexHtml(req.url, template)
                res.statusCode = 200
                res.setHeader("Content-Type", "text/html; charset=utf-8")
                res.end(req.method === "HEAD" ? undefined : html)
                return
              }
            }

            next()
          } catch (error) {
            next(error)
          }
        })
      }
    },
    react(),
    cloudflare()
  ],
})
