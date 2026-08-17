-- Creates the `dashboard` schema for the personal business dashboard app.
-- Warriors on the way continues to use the `public` schema unchanged.

CREATE SCHEMA IF NOT EXISTS dashboard;

-- Allow Supabase roles to use this schema.
GRANT USAGE ON SCHEMA dashboard TO anon, authenticated, service_role;

-- Future tables in this schema will inherit these default grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA dashboard
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA dashboard
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- Service role gets full access (used by server-side API routes).
ALTER DEFAULT PRIVILEGES IN SCHEMA dashboard
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA dashboard
  GRANT ALL ON SEQUENCES TO service_role;
