import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export type Event = {
  httpMethod: string;
  path: string;
  rawPath?: string;
  headers: Record<string, string | undefined>;
  body: string | null;
};

const kinds = ['expense', 'inflow', 'budget', 'debt', 'transfer'] as const;
type RecordKind = (typeof kinds)[number];

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD.').refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Date must be a real calendar date.');
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM.');
const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

function getSupabase(event: Event) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new ApiError(500, 'Supabase credentials (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured on the server.');
  }
  const token = event.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw new ApiError(401, 'Unauthorized');

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function parseBody(event: Event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON.');
  }
}

function normaliseRows(kind: RecordKind, records: Array<Record<string, unknown>>) {
  return records.map((record) => {
    const id = typeof record.id === 'string' && record.id ? record.id : randomUUID();
    const dateField = kind === 'debt' ? 'issueDate' : kind === 'budget' ? 'month' : 'date';
    const dateValue = typeof record[dateField] === 'string' ? record[dateField] as string : null;
    const occurredOn = dateValue && /^\d{4}-\d{2}-\d{2}/.test(dateValue) ? dateValue.slice(0, 10) : null;
    const month = kind === 'budget'
      ? dateValue
      : occurredOn ? occurredOn.slice(0, 7) : null;
    return { id, occurredOn, month, record: { ...record, id } };
  });
}

function validateRecord(kind: RecordKind, record: Record<string, unknown>) {
  const dateField = kind === 'debt' ? 'issueDate' : kind === 'budget' ? 'month' : 'date';
  (kind === 'budget' ? monthSchema : dateSchema).parse(record[dateField]);
  const amountFields = kind === 'inflow' ? ['amount'] : kind === 'expense' || kind === 'transfer' ? ['amount', 'totalAmount'] : kind === 'debt' ? ['originalAmount'] : [];
  for (const field of amountFields) {
    const value = record[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error(`${field} must be a positive amount.`);
  }
  if (kind === 'inflow' && typeof record.taxDeduction === 'number' && record.taxDeduction < 0) throw new Error('taxDeduction cannot be negative.');
  if ((kind === 'expense' || kind === 'transfer') && typeof record.taxAmount === 'number' && record.taxAmount < 0) throw new Error('taxAmount cannot be negative.');
  if (kind === 'inflow') {
    const amount = Number(record.amount);
    const tax = Number(record.taxDeduction || 0);
    if (!Number.isFinite(tax) || tax < 0 || tax > amount || Number(record.netAmount) !== Number((amount - tax).toFixed(2))) throw new Error('Inflow amount, deduction, and net amount do not match.');
  }
  if (kind === 'expense' || kind === 'transfer') {
    const amount = Number(record.amount);
    const tax = Number(record.taxAmount || 0);
    if (!Number.isFinite(tax) || tax < 0 || Number(record.totalAmount) !== Number((amount + tax).toFixed(2))) throw new Error('Expense amount, fee, and total amount do not match.');
  }
  if (kind === 'debt') {
    if (record.dueDate && typeof record.dueDate === 'string' && record.dueDate.trim() !== '') {
      dateSchema.parse(record.dueDate);
    }
    const originalAmount = Number(record.originalAmount);
    const repaidAmount = typeof record.repaidAmount === 'number' ? record.repaidAmount : 0;
    if (repaidAmount < 0 || repaidAmount > originalAmount) throw new Error('Repayment cannot exceed the debt amount.');
    const repayments = Array.isArray(record.repayments) ? record.repayments : [];
    for (const repayment of repayments) {
      if (!repayment || typeof repayment !== 'object') throw new Error('Invalid repayment record.');
      const repaymentRecord = repayment as Record<string, unknown>;
      dateSchema.parse(repaymentRecord.date);
      if (typeof repaymentRecord.amount !== 'number' || !Number.isFinite(repaymentRecord.amount) || repaymentRecord.amount <= 0) throw new Error('Repayment amount must be positive.');
    }
    const repaymentTotal = repayments.reduce((sum, repayment) => sum + Number((repayment as Record<string, unknown>).amount || 0), 0);
    if (repaymentTotal > originalAmount) throw new Error('Repayments cannot exceed the debt amount.');
  }
}

function persistedKind(record: Record<string, unknown>): RecordKind {
  return record.isBankToMobileTransfer === true && record.transferRecipientType !== 'third_party' ? 'transfer' : 'expense';
}

export const handler = async (event: Event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { Allow: 'GET, PUT, DELETE, OPTIONS' }, body: '' };
  }
  try {
    const supabase = getSupabase(event);
    const requestPath = event.rawPath || event.path || '';
    const route = requestPath.replace(/^.*\/\.netlify\/functions\/api\/?/, '').replace(/^\/api\/?/, '').replace(/^\//, '').replace(/\/$/, '');

    if (event.httpMethod === 'GET' && (route === '' || route === 'state')) {
      const { data: rows, error } = await supabase
        .from('cashbook_records')
        .select('kind, record')
        .order('occurred_on', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw new ApiError(500, `Supabase query error: ${error.message}`);

      const state = { expenses: [] as unknown[], inflows: [] as unknown[], budgets: [] as unknown[], debts: [] as unknown[] };
      for (const row of (rows || []) as Array<{ kind: RecordKind; record: unknown }>) {
        const target = `${row.kind === 'transfer' ? 'expense' : row.kind}s` as keyof typeof state;
        state[target].push(row.record);
      }
      return json(200, state);
    }

    if (event.httpMethod === 'PUT' && route === 'records') {
      const body = parseBody(event) as { kind?: RecordKind; record?: Record<string, unknown> };
      if (!body.kind || !kinds.includes(body.kind) || !body.record || typeof body.record !== 'object') return json(400, { error: 'Invalid record request.' });
      const kind = body.kind === 'expense' ? persistedKind(body.record) : body.kind;
      const record = { ...body.record, id: typeof body.record.id === 'string' && body.record.id ? body.record.id : randomUUID() };
      try {
        validateRecord(kind, record);
      } catch (error) {
        return json(400, { error: error instanceof Error ? error.message : 'Invalid record.' });
      }
      const row = normaliseRows(kind, [record])[0];

      if (kind === 'budget') {
        await supabase
          .from('cashbook_records')
          .delete()
          .eq('kind', 'budget')
          .eq('month_key', row.month);

        const { error: insertError } = await supabase
          .from('cashbook_records')
          .insert({
            id: row.id,
            kind: 'budget',
            occurred_on: row.occurredOn,
            month_key: row.month,
            record: row.record,
          });

        if (insertError) throw new ApiError(500, insertError.message);
      } else {
        const { error: upsertError } = await supabase
          .from('cashbook_records')
          .upsert(
            {
              id: row.id,
              kind,
              occurred_on: row.occurredOn,
              month_key: row.month,
              record: row.record,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (upsertError) throw new ApiError(500, upsertError.message);
      }
      return json(200, { success: true });
    }

    if (event.httpMethod === 'DELETE' && route === 'records') {
      const body = parseBody(event) as { kind?: RecordKind; id?: string };
      if (!body.kind || !kinds.includes(body.kind) || !body.id) return json(400, { error: 'Invalid record deletion request.' });
      if (body.kind === 'budget') {
        const { error } = await supabase
          .from('cashbook_records')
          .delete()
          .eq('kind', 'budget')
          .eq('month_key', body.id);
        if (error) throw new ApiError(500, error.message);
      } else {
        const { error } = await supabase
          .from('cashbook_records')
          .delete()
          .eq('id', body.id);
        if (error) throw new ApiError(500, error.message);
      }
      return json(200, { success: true });
    }

    return json(404, { error: `API route not found: ${event.httpMethod} ${requestPath}` });
  } catch (error) {
    console.error('Cashbook API error:', error);
    if (error instanceof ApiError) return json(error.statusCode, { error: error.message });
    return json(500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
};

