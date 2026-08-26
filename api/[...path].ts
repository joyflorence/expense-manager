import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

type VercelRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  json: (body: unknown) => void;
  send: (body: string) => void;
};

const kinds = ['expense', 'inflow', 'budget', 'debt', 'transfer'] as const;
type RecordKind = (typeof kinds)[number];

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD.').refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Date must be a real calendar date.');
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM.');

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === target) {
      return Array.isArray(value) ? value[0] : value;
    }
  }
  return undefined;
}

function getSupabase(req: VercelRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured.');
  }
  const authHeader = getHeader(req.headers, 'authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Unauthorized');

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normaliseRows(kind: RecordKind, records: Array<Record<string, unknown>>) {
  return records.map((record) => {
    const id = typeof record.id === 'string' && record.id ? record.id : randomUUID();
    const dateField = kind === 'debt' ? 'issueDate' : kind === 'budget' ? 'month' : 'date';
    const dateValue = typeof record[dateField] === 'string' ? (record[dateField] as string) : null;
    const occurredOn = dateValue && /^\d{4}-\d{2}-\d{2}/.test(dateValue) ? dateValue.slice(0, 10) : null;
    const month = kind === 'budget' ? dateValue : occurredOn ? occurredOn.slice(0, 7) : null;
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

export default async function api(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
    return res.status(204).send('');
  }

  try {
    const supabase = getSupabase(req);
    const url = req.url || '/api';
    const route = url.replace(/^\/api\/?/, '').replace(/^\//, '').replace(/\/$/, '').split('?')[0];

    if (req.method === 'GET' && (route === '' || route === 'state')) {
      const { data: rows, error } = await supabase
        .from('cashbook_records')
        .select('kind, record')
        .order('occurred_on', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const state = { expenses: [] as unknown[], inflows: [] as unknown[], budgets: [] as unknown[], debts: [] as unknown[] };
      for (const row of (rows || []) as Array<{ kind: RecordKind; record: unknown }>) {
        const target = `${row.kind === 'transfer' ? 'expense' : row.kind}s` as keyof typeof state;
        state[target].push(row.record);
      }
      return res.status(200).json(state);
    }

    if (req.method === 'PUT' && route === 'records') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}) as { kind?: RecordKind; record?: Record<string, unknown> };
      if (!body.kind || !kinds.includes(body.kind) || !body.record || typeof body.record !== 'object') {
        return res.status(400).json({ error: 'Invalid record request.' });
      }
      const isTransfer = body.kind === 'expense' && body.record.isBankToMobileTransfer === true && body.record.transferRecipientType !== 'third_party';
      const kind = isTransfer ? 'transfer' : body.kind;
      const record = { ...body.record, id: typeof body.record.id === 'string' && body.record.id ? body.record.id : randomUUID() };

      try {
        validateRecord(kind, record);
      } catch (err) {
        return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid record.' });
      }

      const row = normaliseRows(kind, [record])[0];
      if (kind === 'budget') {
        await supabase.from('cashbook_records').delete().eq('kind', 'budget').eq('month_key', row.month);
        const { error: insertError } = await supabase.from('cashbook_records').insert({
          id: row.id,
          kind: 'budget',
          occurred_on: row.occurredOn,
          month_key: row.month,
          record: row.record,
        });
        if (insertError) return res.status(500).json({ error: insertError.message });
      } else {
        const { error: upsertError } = await supabase.from('cashbook_records').upsert(
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
        if (upsertError) return res.status(500).json({ error: upsertError.message });
      }
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE' && route === 'records') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}) as { kind?: RecordKind; id?: string };
      if (!body.kind || !kinds.includes(body.kind) || !body.id) {
        return res.status(400).json({ error: 'Invalid record deletion request.' });
      }
      if (body.kind === 'budget') {
        const { error } = await supabase.from('cashbook_records').delete().eq('kind', 'budget').eq('month_key', body.id);
        if (error) return res.status(500).json({ error: error.message });
      } else {
        const { error } = await supabase.from('cashbook_records').delete().eq('id', body.id);
        if (error) return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: `API route not found: ${req.method} ${url}` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    const status = msg === 'Unauthorized' ? 401 : 500;
    return res.status(status).json({ error: msg });
  }
}

export const config = {
  runtime: 'nodejs',
};

