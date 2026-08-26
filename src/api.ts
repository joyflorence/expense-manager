import { DebtItem, Expense, Inflow, MonthlyBudget } from './types';
import { authClient } from './auth';

export interface CashbookState {
  expenses: Expense[];
  inflows: Inflow[];
  budgets: MonthlyBudget[];
  debts: DebtItem[];
}

type RequestOptions = {
  method: 'GET' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
};

async function request<T>({ method, path, body }: RequestOptions): Promise<T> {
  if (method !== 'GET' && method !== 'PUT' && method !== 'DELETE') {
    throw new Error(`Invalid cashbook HTTP method: ${String(method)}`);
  }
  const token = await authClient.getJWTToken?.();
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const requestInit: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  const response = await window.fetch(path, requestInit);
  const responseText = await response.text();
  let payload: { error?: string } = {};
  try {
    payload = JSON.parse(responseText) as { error?: string };
  } catch {
  }
  if (!response.ok) throw new Error(payload.error || `Cashbook request ${method} ${path} returned HTTP ${response.status}.`);
  return payload as T;
}

export function loadCashbook() {
  return request<CashbookState>({ method: 'GET', path: '/api/state' });
}

export type RecordKind = 'expense' | 'inflow' | 'budget' | 'debt';

export function saveRecord(kind: RecordKind, record: unknown) {
  return request<{ success: boolean }>({ method: 'PUT', path: '/api/records', body: { kind, record } });
}

export function deleteRecord(kind: RecordKind, id: string) {
  return request<{ success: boolean }>({ method: 'DELETE', path: '/api/records', body: { kind, id } });
}
