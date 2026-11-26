import { Expense } from './types';
import { supabase } from './auth';

export async function loadExpenses(): Promise<Expense[]> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const { data: rows, error } = await supabase
    .from('cashbook_records')
    .select('record')
    .eq('kind', 'expense')
    .order('occurred_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    if (
      error.code === '42P01' ||
      error.message?.includes('relation "public.cashbook_records" does not exist') ||
      error.message?.includes('does not exist')
    ) {
      throw new Error(
        'Table "cashbook_records" was not found in Supabase. Please open Supabase SQL Editor and run the SQL migration in db/migrations/0001_supabase_setup.sql.'
      );
    }
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return (rows || []).map((row) => row.record as Expense);
}

export async function saveExpense(expense: Expense): Promise<void> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const occurredOn = /^\d{4}-\d{2}-\d{2}/.test(expense.date) ? expense.date.slice(0, 10) : null;
  const { data: existingRecord, error: lookupError } = await supabase
    .from('cashbook_records')
    .select('kind')
    .eq('id', expense.id)
    .maybeSingle();

  if (lookupError) throw new Error(`Could not check the existing expense record: ${lookupError.message}`);
  if (existingRecord && existingRecord.kind !== 'expense') {
    throw new Error('This expense ID conflicts with a legacy non-expense record. The existing record was left unchanged.');
  }

  const recordValues = {
    occurred_on: occurredOn,
    month_key: occurredOn ? occurredOn.slice(0, 7) : null,
    record: expense,
    updated_at: new Date().toISOString(),
  };
  const result = existingRecord
    ? await supabase
        .from('cashbook_records')
        .update(recordValues)
        .eq('id', expense.id)
        .eq('kind', 'expense')
    : await supabase
        .from('cashbook_records')
        .insert({ id: expense.id, kind: 'expense', ...recordValues });

  if (result.error) throw new Error(`Failed to save expense: ${result.error.message}`);
}

export async function deleteExpense(id: string): Promise<void> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const { error } = await supabase
    .from('cashbook_records')
    .delete()
    .eq('kind', 'expense')
    .eq('id', id);

  if (error) throw new Error(`Failed to delete expense: ${error.message}`);
}
