-- Future PostgreSQL adapter target. This migration does not switch the runtime
-- away from SQLite. Never expose authoritative snapshots through the Data API.
BEGIN;
CREATE SCHEMA IF NOT EXISTS modern_risk;
CREATE TABLE modern_risk.rooms (
 code text PRIMARY KEY,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision > 0),
 data jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE modern_risk.resolutions (
 room text NOT NULL REFERENCES modern_risk.rooms(code),
 round integer NOT NULL CHECK(round > 0),
 result jsonb NOT NULL,
 PRIMARY KEY(room, round)
);
ALTER TABLE modern_risk.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE modern_risk.resolutions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA modern_risk FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA modern_risk FROM PUBLIC;
-- A dedicated backend role must be granted access out-of-band. No anon/authenticated
-- grants: client reads must pass through the server's per-player projection.
COMMIT;
