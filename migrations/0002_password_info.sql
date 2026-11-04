-- Migration number: 0002   2026-11-03T04:59:37.535Z

ALTER TABLE users ADD COLUMN hash_info TEXT NOT NULL; -- { salt, hashAlgorithm, iterations, length }