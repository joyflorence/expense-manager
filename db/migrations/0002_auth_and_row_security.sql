-- Enable Neon Auth and Neon RLS in the Neon Console before applying this migration.
-- Use the Neon Auth JWKS URL in Neon Settings > RLS, then connect this app with
-- the `authenticated` database role connection string.
ALTER TABLE cashbook_records
  ADD COLUMN IF NOT EXISTS owner_user_id text;

ALTER TABLE cashbook_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cashbook_records_owner_only ON cashbook_records;
CREATE POLICY cashbook_records_owner_only ON cashbook_records
  FOR ALL
  USING (owner_user_id = auth.user_id())
  WITH CHECK (owner_user_id = auth.user_id());
