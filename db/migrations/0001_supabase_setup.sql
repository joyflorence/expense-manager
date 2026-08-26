-- ==============================================================================
-- OmniTrack Cashbook: Supabase Schema & Row-Level Security Setup
-- Run this script once in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Create the cashbook_records table
CREATE TABLE IF NOT EXISTS public.cashbook_records (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('expense', 'inflow', 'budget', 'debt', 'transfer')),
  occurred_on date,
  month_key text,
  record jsonb NOT NULL,
  owner_user_id text NOT NULL DEFAULT (auth.uid())::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS cashbook_records_kind_date_idx
  ON public.cashbook_records (kind, occurred_on DESC);

CREATE INDEX IF NOT EXISTS cashbook_records_month_idx
  ON public.cashbook_records (month_key);

CREATE INDEX IF NOT EXISTS cashbook_records_owner_kind_month_idx
  ON public.cashbook_records (owner_user_id, kind, month_key);

-- 3. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.set_cashbook_record_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cashbook_records_updated_at ON public.cashbook_records;
CREATE TRIGGER cashbook_records_updated_at
  BEFORE UPDATE ON public.cashbook_records
  FOR EACH ROW EXECUTE FUNCTION public.set_cashbook_record_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.cashbook_records ENABLE ROW LEVEL SECURITY;

-- 5. Create policy: Users can only read, insert, update, and delete their own records
DROP POLICY IF EXISTS "Users can only access their own cashbook records" ON public.cashbook_records;
CREATE POLICY "Users can only access their own cashbook records"
  ON public.cashbook_records
  FOR ALL
  TO authenticated
  USING (owner_user_id = (auth.uid())::text)
  WITH CHECK (owner_user_id = (auth.uid())::text);
