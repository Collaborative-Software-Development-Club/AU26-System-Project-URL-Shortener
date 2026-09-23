import { Hono } from 'hono'

const app = new Hono()

app.get('/:code', (c) => {
    return c.redirect('https://google.com/search?q=The%20Ohio%20State%20University', 302);
})

app.post("/api/create-link", async (c) => {
    const body = await c.req.json<{ url: string }>();
    if (!body) return c.status(400);
    if (!body.url) return c.status(400);

    const { url } = body;

    console.log(url);
});

export default app