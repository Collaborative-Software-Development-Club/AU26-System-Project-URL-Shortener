-- Migration number: 0001   2026-10-30T04:59:37.535Z

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE, -- Index automatically created due to UNIQUE
  hash BLOB NOT NULL, -- SHA-256 hash of PBKDF2 hash supplied by client
  salt TEXT NOT NULL -- base64
) STRICT;

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY, -- Code determined from ID and vice versa
  url TEXT NOT NULL,
  description TEXT,
  create_time INTEGER NOT NULL DEFAULT (unixepoch()), -- Unix time in seconds
  owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
  browser_token TEXT -- For not-logged-in users, so if they create an account AFTER creating a url, ownership can be transferred to new account
) STRICT;
CREATE INDEX IF NOT EXISTS idx_links_owner_create_time ON links(owner, create_time DESC); -- Fast link lookup by owner (My Links page)

PRAGMA optimize;