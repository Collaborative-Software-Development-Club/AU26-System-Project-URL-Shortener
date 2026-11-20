import assert from "node:assert/strict"
import { randomBytes, randomUUID } from "node:crypto"
import { test } from "node:test"

const args = process.argv.slice(2)
if (args.length !== 1 || !/^[0-9]+$/.test(args[0]) || Number(args[0]) < 1 || Number(args[0]) > 65535) {
  console.error("Usage: npm run test:api -- <port> (integer 1–65535)")
  process.exit(2)
}
const origin = `http://localhost:${Number(args[0])}`
const unique = () => `api-test-${randomUUID()}`
const credentials = (overrides = {}) => ({
  username: unique(),
  hash: randomBytes(32).toString("base64"),
  salt: randomBytes(16).toString("base64"),
  ...overrides
})

// Never follow redirects: destinations are untrusted and may not be local.
// Read the body inside the timeout, and reject every 5xx before route assertions.
async function request(path, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...options,
    redirect: "manual",
    signal: AbortSignal.timeout(5000)
  })
  const body = await response.text()
  assert.ok(response.status < 500, `${options.method ?? "GET"} ${path}: unexpected HTTP ${response.status}`)
  return { status: response.status, headers: response.headers, body }
}

function status(response, expected) {
  assert.equal(response.status, expected, `Expected HTTP ${expected}, received ${response.status}`)
  if (expected === 204) assert.equal(response.body, "", "204 must have no response body")
}

function json(response) {
  assert.match(response.headers.get("content-type") ?? "", /^application\/json(?:;|$)/i)
  const value = JSON.parse(response.body)
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value))
  return value
}

const postJSON = (path, value) => request(path, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value)
})
const create = (value) => postJSON("/api/create-account", value)
const login = ({ username, hash }) => postJSON("/api/login", { username, hash })
const hashInfo = (username) => request(`/api/hash-information?${new URLSearchParams({ username })}`)

function cookies(response) {
  return response.headers.getSetCookie().map((header) => {
    const [pair, ...attributes] = header.split(";")
    const index = pair.indexOf("=")
    return {
      name: pair.slice(0, index),
      value: pair.slice(index + 1),
      attributes: Object.fromEntries(attributes.map((attribute) => {
        const [key, ...value] = attribute.trim().split("=")
        return [key.toLowerCase(), value.join("=")]
      }))
    }
  })
}

function expiry(cookie) {
  if ("max-age" in cookie.attributes) return Date.now() + Number(cookie.attributes["max-age"]) * 1000
  return Date.parse(cookie.attributes.expires)
}

function sessionCookies(response) {
  const all = cookies(response)
  for (const name of ["__Host-session", "logged-in"]) {
    assert.equal(all.filter((cookie) => cookie.name === name).length, 1, `Expected one ${name} cookie`)
  }
  const session = all.find((cookie) => cookie.name === "__Host-session")
  const indicator = all.find((cookie) => cookie.name === "logged-in")
  assert.ok(session.value.length > 0)
  // Required by the browser's __Host- cookie prefix semantics.
  assert.ok("secure" in session.attributes)
  assert.equal(session.attributes.path, "/")
  assert.ok(!("domain" in session.attributes))
  assert.equal(indicator.value, "")
  assert.ok(!("httponly" in indicator.attributes))
  assert.ok(expiry(indicator) > Date.now(), "logged-in cookie must expire in the future")
  assert.ok(expiry(indicator) < expiry(session), "logged-in must expire before session")
}

function noSession(response) {
  assert.ok(!cookies(response).some((cookie) => cookie.name === "__Host-session" && cookie.value),
    "Rejected request must not grant a session")
}

// Fixture creation tolerates a successful but wrong status so independent login,
// lookup and duplicate-account checks still run. Dedicated tests enforce 204.
async function account(overrides) {
  const value = credentials(overrides)
  const response = await create(value)
  assert.ok(response.status >= 200 && response.status < 300, `Account fixture failed: HTTP ${response.status}`)
  return { value, response }
}

async function shorten(value) {
  const body = new FormData()
  body.append("url", value)
  return request("/api/shorten", { method: "POST", body })
}

async function codeFor(url) {
  const response = await shorten(url)
  assert.ok(response.status >= 200 && response.status < 300)
  const { code } = json(response)
  assert.equal(typeof code, "string")
  assert.ok(code.length > 0)
  return code
}

// Fail fast for an unavailable server, without filling the report with timeouts.
try {
  await fetch(`${origin}/api/hash-information?username=${unique()}`, {
    redirect: "manual", signal: AbortSignal.timeout(5000)
  }).then((response) => response.body?.cancel())
} catch (error) {
  console.error(`Cannot reach local API at ${origin}: ${error.message}`)
  process.exit(1)
}

test("create-account: documented success status and empty body", async () => {
  status(await create(credentials()), 204)
})
test("create-account: session cookies", async () => {
  sessionCookies((await account()).response)
})
test("login: documented success status and empty body", async () => {
  const { value } = await account()
  status(await login(value), 204)
})
test("login: session cookies", async () => {
  const { value } = await account()
  sessionCookies(await login(value))
})
test("hash-information: exact salt round trip", async () => {
  const { value } = await account()
  const response = await hashInfo(value.username)
  status(response, 200)
  assert.equal(json(response).salt, value.salt)
})
test("create-account: duplicate cannot overwrite credentials or salt", async () => {
  const { value } = await account()
  const replacement = credentials({ username: value.username })
  const response = await create(replacement)
  status(response, 409)
  noSession(response)
  assert.equal(json(await hashInfo(value.username)).salt, value.salt)
  status(await login(replacement), 401)
  status(await login(value), 204)
})
test("create-account: concurrent duplicate requests create exactly one account", async () => {
  const value = credentials()
  const responses = await Promise.all([create(value), create(value)])
  assert.deepEqual(responses.map((response) => response.status).sort((a, b) => a - b), [204, 409])
  assert.equal(json(await hashInfo(value.username)).salt, value.salt)
})
test("login: incorrect password", async () => {
  const { value } = await account()
  const response = await login({ ...value, hash: randomBytes(32).toString("base64") })
  status(response, 401)
  noSession(response)
})
test("login: unknown username", async () => {
  const response = await login(credentials())
  status(response, 401)
  noSession(response)
})
test("hash-information: missing username", async () => {
  status(await request("/api/hash-information"), 400)
})
for (const username of [unique(), "' OR 1=1 --", "../../etc/passwd", "<script>alert(1)</script>", "__proto__", "a\0b"]) {
  test(`hash-information: unknown literal ${JSON.stringify(username)}`, async () => {
    status(await hashInfo(username), 404)
  })
}

for (const route of ["/api/login", "/api/create-account"]) {
  for (const value of [null, [], "text", 42, true, {}]) {
    test(`${route}: invalid JSON shape ${JSON.stringify(value)}`, async () => {
      const response = await postJSON(route, value)
      status(response, 400)
      noSession(response)
    })
  }
  const fields = route.endsWith("create-account") ? ["username", "hash", "salt"] : ["username", "hash"]
  for (const field of fields) {
    for (const invalid of [undefined, null, false, 123, [], {}, ["text"]]) {
      test(`${route}: ${field} rejects ${JSON.stringify(invalid)}`, async () => {
        const response = await postJSON(route, credentials({ [field]: invalid }))
        status(response, 400)
        noSession(response)
      })
    }
  }
  for (const body of ["", "{", "{\"username\":", "{\"hash\": NaN}", "{} trailing", "{\"username\":\"\u0000\"}"]) {
    test(`${route}: malformed JSON ${JSON.stringify(body)}`, async () => {
      status(await request(route, { method: "POST", headers: { "Content-Type": "application/json" }, body }), 400)
    })
  }
  for (const field of fields.filter((field) => field !== "username")) {
    for (const invalid of ["!!!", "SGVsbG8_", "A", "AA=A", "====", "💥", "YWJj\0"]) {
      test(`${route}: ${field} rejects invalid base64 ${JSON.stringify(invalid)}`, async () => {
        // A real username ensures login cannot bypass validation via unknown-user lookup.
        const { value } = await account()
        const response = await postJSON(route, { ...value, username: route.endsWith("create-account") ? unique() : value.username, [field]: invalid })
        status(response, 400)
        noSession(response)
      })
    }
  }
}

for (const route of ["/api/login", "/api/create-account"]) {
  for (const bytes of [0, 1, 16, 31, 33, 48]) {
    test(`${route}: reject hash decoding to ${bytes} bytes (requires 32)`, async () => {
      // Use an existing account so login reaches password validation.
      const { value } = await account()
      const response = await postJSON(route, {
        ...value,
        username: route.endsWith("create-account") ? unique() : value.username,
        hash: randomBytes(bytes).toString("base64")
      })
      status(response, 400)
      noSession(response)
    })
  }
}

for (const length of [64, 65, 1024, 65536]) {
  test(`create-account: reject username length ${length}`, async () => {
    status(await create(credentials({ username: "x".repeat(length) })), 400)
  })
}
test("create-account: accept 63-character username", async () => {
  status(await create(credentials({ username: unique().padEnd(63, "x") })), 204)
})
for (const suffix of ["' OR '1'='1", "<&>\"", " +&?=#%", "用户é😀"]) {
  test(`account: username treated literally ${JSON.stringify(suffix)}`, async () => {
    const { value } = await account({ username: unique().slice(0, 30) + suffix })
    assert.equal(json(await hashInfo(value.username)).salt, value.salt)
    status(await login(value), 204)
  })
}
for (const bytes of [44, 45, 47]) {
  // 60 characters with/without padding, and 63 with optional padding omitted.
  const encoded = randomBytes(bytes).toString("base64")
  const salt = bytes === 47 ? encoded.replace(/=+$/, "") : encoded
  test(`create-account: accept and preserve ${salt.length}-character salt (${bytes} bytes)`, async () => {
    const { value, response } = await account({ salt })
    status(response, 204)
    assert.equal(json(await hashInfo(value.username)).salt, value.salt)
  })
}
for (const length of [64, 68, 1024]) {
  test(`create-account: reject ${length}-character base64 salt`, async () => {
    const response = await create(credentials({ salt: randomBytes(length / 4 * 3).toString("base64") }))
    status(response, 400)
    noSession(response)
  })
}

for (const url of [
  "https://example.com/",
  "http://example.com:8080/path?q=a%20b&other=x#fragment",
  "https://example.com/%E2%9C%93?q=%27%20OR%201%3D1--",
  "https://example.com/?x=%3Cscript%3E&y=%00&z=%0D%0AInjected%3Ayes",
  "https://example.com/" + "a".repeat(979)
]) {
  test(`shorten/redirect: exact round trip (${url.length} characters)`, async () => {
    const code = await codeFor(url)
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(`/${encodeURIComponent(code)}`)
      status(response, 302)
      assert.equal(response.headers.get("location"), url)
    }
  })
}
test("shorten: independent links retain their own destinations", async () => {
  const urls = [0, 1, 2].map((i) => `https://example.com/${unique()}/${i}`)
  const codes = []
  for (const url of urls) codes.push(await codeFor(url))
  assert.equal(new Set(codes).size, urls.length)
  for (const [i, code] of codes.entries()) {
    const response = await request(`/${encodeURIComponent(code)}`)
    status(response, 302)
    assert.equal(response.headers.get("location"), urls[i])
  }
})
for (const length of [1000, 1001, 65536]) {
  test(`shorten: reject URL length ${length}`, async () => {
    status(await shorten("https://example.com/" + "x".repeat(length - 20)), 400)
  })
}
test("shorten: missing url", async () => {
  status(await request("/api/shorten", { method: "POST", body: new FormData() }), 400)
})
test("shorten: file instead of string", async () => {
  status(await shorten(new Blob(["https://example.com/"])), 400)
})
test("shorten: malformed multipart boundary", async () => {
  status(await request("/api/shorten", {
    method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=missing" }, body: "invalid"
  }), 400)
})

for (const path of ["/invalid!", "/%00", "/%E2%98%83", "/%27%20OR%201=1--", "/%0D%0AX-Test:yes", `/${"a".repeat(256)}`, "/missing/nested/path"]) {
  test(`redirect/fallback: nonexistent path ${path}`, async () => {
    const response = await request(path)
    status(response, 404)
    assert.equal(response.headers.get("location"), null)
    assert.match(response.headers.get("content-type") ?? "", /^text\/html(?:;|$)/i)
    assert.match(response.body, /<(?:!doctype\s+html|html)\b/i, "Not-found response must serve the SPA")
  })
}

for (const authenticated of [false, true]) {
  test(`logout: ${authenticated ? "with session" : "without session"}, repeatable and clears cookies`, async () => {
    const headers = {}
    if (authenticated) {
      const { response } = await account()
      headers.Cookie = cookies(response).map(({ name, value }) => `${name}=${value}`).join("; ")
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request("/api/logout", { method: "POST", headers })
      status(response, 204)
      for (const name of ["__Host-session", "logged-in"]) {
        const cookie = cookies(response).find((cookie) => cookie.name === name)
        assert.ok(cookie, `Missing deletion cookie for ${name}`)
        assert.equal(cookie.value, "")
        assert.ok(expiry(cookie) <= Date.now(), `${name} must expire immediately`)
        assert.equal(cookie.attributes.path, "/")
        if (name === "__Host-session") {
          assert.ok("secure" in cookie.attributes)
          assert.ok(!("domain" in cookie.attributes))
        }
      }
    }
  })
}

for (const route of ["GET /api/urls", "PATCH /api/urls/:code", "DELETE /api/urls/:code"]) {
  test(route, { skip: "Empty handler in worker/index.ts; outside implemented-route scope" }, () => {})
}
