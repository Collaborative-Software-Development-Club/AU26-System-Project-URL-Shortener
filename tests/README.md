# Live backend contract tests

Start a local development instance with its database migrations applied and a
valid local `KEY`, then run (Node.js 22 or newer):

```sh
npm run test:api -- 5173
```

Replace `5173` with the running instance's port. The suite targets
`http://localhost:<port>` and uses Node's built-in test runner and fetch. Using
`localhost` supports development servers listening on IPv6 loopback (`::1`),
where connecting directly to IPv4 `127.0.0.1` would be refused. It does
not start a server, reset a database, or contact redirect destinations. A failed
assertion, network error, timeout, or **any 5xx response** fails the run. Invalid
CLI arguments exit with code 2; test failures exit nonzero. Requests have a
five-second timeout. Tests run sequentially except the explicit duplicate race.
Rate limiting is outside this suite's scope; use an instance without rate limits.

Use a disposable local database: tests create uniquely named accounts and links.
They deliberately leave fixtures behind because the API has no account deletion
route and URL deletion is not implemented. No credentials or secret configuration
are read from disk. Hashes and salts are randomly generated base64 test values.

The source of expected behavior is [api.md](../api.md), with the explicit testing
requirement that 500 is a failure overriding the document's blanket allowance.
The suite covers the implemented routes in [index.ts](../worker/index.ts):

| Route | Checks |
| --- | --- |
| `POST /api/shorten` | Multipart shape, file input, malformed multipart, 999/1000/1001-character boundary, large inputs, independent link destinations |
| `GET /api/hash-information` | Required username, missing users, exact salt round trip, query escaping and injection-like strings |
| `POST /api/create-account` | 204, cookies, duplicate accounts and races, credential integrity, username and salt length boundaries, JSON shapes, field types, malformed JSON, invalid base64, exactly 32-byte hashes |
| `POST /api/login` | 204, cookies, correct/incorrect credentials, missing users, JSON and base64 validation, exactly 32-byte hashes |
| `POST /api/logout` | 204, deletion cookies, authenticated and anonymous requests, repeat requests |
| `GET /:code` and fallback | 302 and exact Location, repeated redirects, invalid codes, 404 HTML SPA |

The three empty URL-management handlers are explicitly skipped. Their auth,
ownership, pagination and mutation contracts need tests when implemented.

Contract ambiguities are intentionally not turned into invented requirements:
the document does not specify allowed URL schemes, URL normalization, minimum
string lengths, duplicate-field handling, unknown JSON fields, a fixed decoded salt
length, or status codes for unsupported methods/media types. Boundary lengths use
ASCII to avoid assuming how Unicode characters are counted. Injection-like
usernames are literal strings, not inherently invalid usernames. Encoded URL
payloads must survive redirects without being decoded into header delimiters.
The suite checks observable cookies, not a particular token format or signature
algorithm. Server-side session revocation cannot be checked until a protected
route exists.

Account fixtures accept any 2xx so a wrong success status does not prevent
independent lookup/login checks. Dedicated tests still require the documented
204 for account creation and login. A fixture failure is a test failure, never a
skip. Current implementation defects are expected to produce a red test run;
do not change expectations merely to match the implementation.
