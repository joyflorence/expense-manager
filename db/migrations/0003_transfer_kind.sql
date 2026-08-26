ALTER TABLE cashbook_records
  DROP CONSTRAINT IF EXISTS cashbook_records_kind_check;

ALTER TABLE cashbook_records
  ADD CONSTRAINT cashbook_records_kind_check
  CHECK (kind IN ('expense', 'inflow', 'budget', 'debt', 'transfer'));