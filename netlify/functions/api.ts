import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

type Event = {
  httpMethod: string;
  path: string;
  headers: Record<string, string | undefined>;
  body: string | null;
};

const kinds = ['expense', 'inflow', 'budget', 'debt'] as const;
type RecordKind = (typeof kinds)[number];

const stateSchema = z.object({
  expenses: z.array(z.object({ id: z.string().optional(), date: z.string() }).passthrough()),
  inflows: z.array(z.object({ id: z.string().optional(), date: z.string() }).passthrough()),
  budgets: z.array(z.object({ month: z.string() }).passthrough()),
  debts: z.array(z.object({ id: z.string().optional(), issueDate: z.string() }).passthrough()),
});

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  return neon(process.env.DATABASE_URL);
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

export const handler = async (event: Event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { Allow: 'GET, PUT, OPTIONS' }, body: '' };
  }
  try {
    const sql = getSql();
    const route = event.path.replace(/^.*\/.netlify\/functions\/api\/?/, '').replace(/^\/api\/?/, '').replace(/^\//, '');

    if (event.httpMethod === 'GET' && (route === '' || route === 'state')) {
      const rows = await sql`SELECT kind, record FROM cashbook_records ORDER BY occurred_on DESC NULLS LAST, created_at DESC`;
      const state = { expenses: [] as unknown[], inflows: [] as unknown[], budgets: [] as unknown[], debts: [] as unknown[] };
      for (const row of rows as Array<{ kind: RecordKind; record: unknown }>) {
        const target = `${row.kind}s` as keyof typeof state;
        state[target].push(row.record);
      }
      return json(200, state);
    }

    if (event.httpMethod === 'PUT' && (route === '' || route === 'state')) {
      const parsed = stateSchema.safeParse(parseBody(event));
      if (!parsed.success) return json(400, { error: 'Invalid cashbook data.', details: parsed.error.flatten() });

      const state = parsed.data;
      const groups: Array<[RecordKind, Array<Record<string, unknown>>]> = [
        ['expense', state.expenses],
        ['inflow', state.inflows],
        ['budget', state.budgets],
        ['debt', state.debts],
      ];
      await sql`DELETE FROM cashbook_records`;
      for (const [kind, records] of groups) {
        for (const row of normaliseRows(kind, records)) {
          await sql.query(
            'INSERT INTO cashbook_records (id, kind, occurred_on, month_key, record) VALUES ($1, $2, $3, $4, $5::jsonb)',
            [row.id, kind, row.occurredOn, row.month, JSON.stringify(row.record)],
          );
        }
      }
      return json(200, { success: true });
    }

    return json(404, { error: 'API route not found.' });
  } catch (error) {
    console.error('Cashbook API error:', error);
    return json(500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
};
