/*
To generate code:
1. INSERT a new row in links and return the id.
2. (Assuming 62 possible characters, and urlSpaceFactor=1000) take ceil(log_base_62(id * 1000)).
This is the number of characters the link code will have.
    id=1 --> 2-character code (Id's start at 1)
    id=2 --> 2-character code
    id=3 --> 2-character code
    id=4 --> 3-character code
    id=5 --> 3-character code
    ... and so on
3. Generate random link code until one is free.
*/

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE,
  description TEXT,
  owner INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_links_code ON links(code);
CREATE INDEX IF NOT EXISTS idx_links_owner ON links(owner);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expiration INTEGER -- Unix time
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

PRAGMA optimize;
