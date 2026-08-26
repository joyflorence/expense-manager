import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

type Event = {
  httpMethod: string;
  path: string;
  rawPath?: string;
    const requestPath = event.rawPath || event.path || '';
    const route = requestPath.replace(/^.*\/\.netlify\/functions\/api\/?/, '').replace(/^\/api\/?/, '').replace(/^\//, '').replace(/\/$/, '');
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

function getSql(event: Event) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  const token = event.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Unauthorized');
  return neon(process.env.DATABASE_URL, { authToken: token });
}

function parseBody(event: Event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new Error('Request body must be valid JSON.');
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
  if (kind === 'debt') {
    if (record.dueDate !== undefined) dateSchema.parse(record.dueDate);
    const originalAmount = Number(record.originalAmount);
    const repaidAmount = typeof record.repaidAmount === 'number' ? record.repaidAmount : 0;
    if (repaidAmount < 0 || repaidAmount > originalAmount) throw new Error('Repayment cannot exceed the debt amount.');
    const repayments = Array.isArray(record.repayments) ? record.repayments : [];
    for (const repayment of repayments) {
      if (!repayment || typeof repayment !== 'object') throw new Error('Invalid repayment record.');
      dateSchema.parse((repayment as Record<string, unknown>).date);
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
    const sql = getSql(event);
    const route = event.path.replace(/^.*\/.netlify\/functions\/api\/?/, '').replace(/^\/api\/?/, '').replace(/^\//, '');

    if (event.httpMethod === 'GET' && (route === '' || route === 'state')) {
      const rows = await sql`SELECT kind, record FROM cashbook_records ORDER BY occurred_on DESC NULLS LAST, created_at DESC`;
      const state = { expenses: [] as unknown[], inflows: [] as unknown[], budgets: [] as unknown[], debts: [] as unknown[] };
      for (const row of rows as Array<{ kind: RecordKind; record: unknown }>) {
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
        await sql.query('DELETE FROM cashbook_records WHERE kind = $1 AND record->>\'month\' = $2', [kind, String(record.month)]);
      }
      await sql.query(
        'INSERT INTO cashbook_records (id, kind, occurred_on, month_key, owner_user_id, record) VALUES ($1, $2, $3, $4, auth.user_id(), $5::jsonb) ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, occurred_on = EXCLUDED.occurred_on, month_key = EXCLUDED.month_key, record = EXCLUDED.record, updated_at = now()',
        [row.id, kind, row.occurredOn, row.month, JSON.stringify(row.record)],
      );
      return json(200, { success: true });
    }

    if (event.httpMethod === 'DELETE' && route === 'records') {
      const body = parseBody(event) as { kind?: RecordKind; id?: string };
      if (!body.kind || !kinds.includes(body.kind) || !body.id) return json(400, { error: 'Invalid record deletion request.' });
      if (body.kind === 'budget') {
        await sql.query('DELETE FROM cashbook_records WHERE kind = $1 AND record->>\'month\' = $2', [body.kind, body.id]);
      } else {
        await sql.query('DELETE FROM cashbook_records WHERE id = $1 AND owner_user_id = auth.user_id()', [body.id]);
      }
      return json(200, { success: true });
    }

    return json(404, { error: 'API route not found.' });
    return json(404, { error: `API route not found: ${event.httpMethod} ${requestPath}` });
  } catch (error) {
    console.error('Cashbook API error:', error);
    return json(500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
};
