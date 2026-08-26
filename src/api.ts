import { DebtItem, Expense, Inflow, MonthlyBudget } from './types';
import { authClient } from './auth';

export interface CashbookState {
  expenses: Expense[];
  inflows: Inflow[];
  budgets: MonthlyBudget[];
  debts: DebtItem[];
}

async function request<T>(method: 'GET' | 'PUT' | 'DELETE', body?: unknown, path = '/api/state'): Promise<T> {
  const token = await authClient.getJWTToken?.();
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
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
  return request<CashbookState>('GET');
}

export type RecordKind = 'expense' | 'inflow' | 'budget' | 'debt';

export function saveRecord(kind: RecordKind, record: unknown) {
  return request<{ success: boolean }>('PUT', { kind, record }, '/api/records');
}

export function deleteRecord(kind: RecordKind, id: string) {
  return request<{ success: boolean }>('DELETE', { kind, id }, '/api/records');
}
