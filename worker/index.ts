import { Hono } from "hono"

const app = new Hono()

app.post("/api/shorten", async (c) => {
  const linkBody = await c.req.json<{ link: string }>();
  if (!linkBody || !linkBody.link) {
    return c.text("Invalid", 400);
  }

  console.log(linkBody.link);

  return c.text("Success", 200);
});

app.get("/:path", async (c) => {
  return c.redirect("https://google.com");
});

export default app