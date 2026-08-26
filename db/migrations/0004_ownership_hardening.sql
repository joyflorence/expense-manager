-- Existing rows created before authentication have no safe user owner. Review
-- and assign those rows to the correct user before making owner_user_id NOT NULL.
-- Inspect them first with: SELECT id, kind, record FROM cashbook_records
-- WHERE owner_user_id IS NULL;
CREATE INDEX IF NOT EXISTS cashbook_records_owner_kind_month_idx
  ON cashbook_records (owner_user_id, kind, month_key);

ALTER TABLE cashbook_records
  DROP CONSTRAINT IF EXISTS cashbook_records_owner_required;

ALTER TABLE cashbook_records
  ADD CONSTRAINT cashbook_records_owner_required
  CHECK (owner_user_id IS NOT NULL) NOT VALID;

ALTER TABLE cashbook_records
  DROP POLICY IF EXISTS cashbook_records_owner_only ON cashbook_records;

CREATE POLICY cashbook_records_owner_only ON cashbook_records
  FOR ALL
  USING (owner_user_id IS NOT NULL AND owner_user_id = auth.user_id())
  WITH CHECK (owner_user_id IS NOT NULL AND owner_user_id = auth.user_id());