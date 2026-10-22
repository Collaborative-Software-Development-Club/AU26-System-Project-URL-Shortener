import { Hono } from "hono"

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.post("/api/shorten", async (c) => {
  const linkBody = await c.req.json<{ link: string }>();
  if (!linkBody || !linkBody.link) {
    return c.text("Invalid", 400);
  }

  console.log(linkBody.link);

  return c.text("Success", 200);
})

// Check database for URL
app.get("/1234567890", async (c) => {
  return c.redirect("https://google.com")
})

// Return not found page otherwise
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
})

export default app