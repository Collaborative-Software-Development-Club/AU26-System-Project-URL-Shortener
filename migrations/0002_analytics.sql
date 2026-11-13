CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY,
  link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
  access_time INTEGER NOT NULL DEFAULT (unixepoch()), -- Unix time in seconds
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  latitude REAL,
  longitude REAL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics(link_id); -- Fast analytics lookup
CREATE INDEX IF NOT EXISTS idx_analytics_access_time ON analytics(access_time); -- Fast analytics lookup by time

pragma optimize;