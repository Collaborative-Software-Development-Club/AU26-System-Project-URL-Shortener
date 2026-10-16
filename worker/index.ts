import { Hono } from "hono"

const app = new Hono()

app.post("/api/shorten", async (c) => {
  const linkBody = await c.req.json<{ link: string }>();
  if (!linkBody || !linkBody.link) {
    return c.text("Invalid", 400);
  }

  console.log(linkBody.link);

  return c.text("Success", 200);
})
app.get("/", async () => {})
app.get("/login", async () => {})
app.get("/create-account", async () => {})

// Check database for URL

export default app