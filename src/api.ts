import { DebtItem, Expense, Inflow, MonthlyBudget } from './types';
import { supabase } from './auth';

export interface CashbookState {
  expenses: Expense[];
  inflows: Inflow[];
  budgets: MonthlyBudget[];
  debts: DebtItem[];
}

export type RecordKind = 'expense' | 'inflow' | 'budget' | 'debt' | 'transfer';

export async function loadCashbook(): Promise<CashbookState> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const { data: rows, error } = await supabase
    .from('cashbook_records')
    .select('kind, record')
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

  const state: CashbookState = { expenses: [], inflows: [], budgets: [], debts: [] };
  for (const row of (rows || []) as Array<{ kind: RecordKind; record: unknown }>) {
    const target = `${row.kind === 'transfer' ? 'expense' : row.kind}s` as keyof CashbookState;
    if (Array.isArray(state[target])) {
      (state[target] as unknown[]).push(row.record);
    }
  }
  return state;
}

export async function saveRecord(kind: 'expense' | 'inflow' | 'budget' | 'debt', record: unknown): Promise<{ success: boolean }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const rec = record as Record<string, unknown>;
  const id = typeof rec.id === 'string' && rec.id ? rec.id : crypto.randomUUID();
  const dateField = kind === 'debt' ? 'issueDate' : kind === 'budget' ? 'month' : 'date';
  const dateValue = typeof rec[dateField] === 'string' ? (rec[dateField] as string) : null;
  const occurredOn = dateValue && /^\d{4}-\d{2}-\d{2}/.test(dateValue) ? dateValue.slice(0, 10) : null;
  const month = kind === 'budget' ? dateValue : occurredOn ? occurredOn.slice(0, 7) : null;
  const recordWithId = { ...rec, id };

  const actualKind: RecordKind =
    kind === 'expense' && rec.isBankToMobileTransfer === true && rec.transferRecipientType !== 'third_party'
      ? 'transfer'
      : kind;

  if (actualKind === 'budget') {
    await supabase
      .from('cashbook_records')
      .delete()
      .eq('kind', 'budget')
      .eq('month_key', month);

    const { error } = await supabase
      .from('cashbook_records')
      .insert({
        id,
        kind: 'budget',
        occurred_on: occurredOn,
        month_key: month,
        record: recordWithId,
      });

    if (error) throw new Error(`Failed to save budget: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('cashbook_records')
      .upsert(
        {
          id,
          kind: actualKind,
          occurred_on: occurredOn,
          month_key: month,
          record: recordWithId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) throw new Error(`Failed to save record: ${error.message}`);
  }

  return { success: true };
}

export async function deleteRecord(kind: 'expense' | 'inflow' | 'budget' | 'debt', id: string): Promise<{ success: boolean }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (kind === 'budget') {
    const { error } = await supabase
      .from('cashbook_records')
      .delete()
      .eq('kind', 'budget')
      .eq('month_key', id);
    if (error) throw new Error(`Failed to delete budget: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('cashbook_records')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete record: ${error.message}`);
  }

  return { success: true };
}
