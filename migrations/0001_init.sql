-- Migration number: 0001   2026-10-30T04:59:37.535Z

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL -- SHA-256 hash of PBKDF2 hash supplied by client
) STRICT;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username); -- Fast user lookup during login

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE, -- There will be a split second when the code is generating and not ready, so NOT NULL didn't work
  url TEXT NOT NULL,
  description TEXT,
  create_time INTEGER NOT NULL DEFAULT (unixepoch()), -- Unix time in seconds
  owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
  browser_token TEXT -- For not-logged-in users, so if they create an account AFTER creating a url, ownership can be transferred to new account
) STRICT;
CREATE INDEX IF NOT EXISTS idx_links_code ON links(code); -- Fast link lookup by code
CREATE INDEX IF NOT EXISTS idx_links_owner ON links(owner); -- Fast link lookup by owner (My Links page)

PRAGMA optimize;