import { Hono } from 'hono'

const app = new Hono()

app.get('/:code', (c) => {
    return c.redirect('https://google.com/search?q=The%20Ohio%20State%20University', 302);
})

export default app