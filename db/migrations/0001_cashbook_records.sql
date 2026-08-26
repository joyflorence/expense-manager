-- Run this once in Neon SQL Editor before the first Netlify deployment.
CREATE TABLE IF NOT EXISTS cashbook_records (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('expense', 'inflow', 'budget', 'debt', 'transfer')),
  occurred_on date,
  month_key text,
  record jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cashbook_records_kind_date_idx
  ON cashbook_records (kind, occurred_on DESC);
CREATE INDEX IF NOT EXISTS cashbook_records_month_idx
  ON cashbook_records (month_key);

CREATE OR REPLACE FUNCTION set_cashbook_record_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cashbook_records_updated_at ON cashbook_records;
CREATE TRIGGER cashbook_records_updated_at
  BEFORE UPDATE ON cashbook_records
  FOR EACH ROW EXECUTE FUNCTION set_cashbook_record_updated_at();
