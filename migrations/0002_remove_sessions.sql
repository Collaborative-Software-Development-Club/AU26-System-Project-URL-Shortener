-- Migration number: 0002 	 2026-11-03T02:21:57.410Z

DROP TABLE sessions; -- The session cookie will be the user id + expiration date, set with Hono's setSignedCookie, leaving it unnessecary to store sessions in the database

ALTER TABLE links ADD create_time INTEGER; -- Unix time in seconds