# CSD System Project: URL Shortener

## Style guidelines

- Double quotes only!
- No semicolons!
- 2 spaces indent!

## Development instructions

- Don't make any changes via the cloudflare dashboard! These will be erased the next time you deploy. Instead, edit `wrangler.jsonc`.

## login protocol (here for now)

```
Create account:
Client generates PBKDF2 hash from password with webcrypto api, salt = random 128 bits, hash algorithm=sha256, iterations=500000, length=256
Client sends username and PBKDF2 hash to server, also hashInformation = { salt, hashAlgorithm, iterations, length }
Server takes sha256 of the PBKDF2 hash, stores that along with username and hashInformation in database


Login:
Client requests username, server returns passwordInformation
Client performs hash, sends to server
Server takes sha256 of PBKDF2, checks for match and grants access
```