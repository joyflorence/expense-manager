import { DebtItem, Expense, Inflow, MonthlyBudget } from './types';

export interface CashbookState {
  expenses: Expense[];
  inflows: Inflow[];
  budgets: MonthlyBudget[];
  debts: DebtItem[];
}

async function request<T>(method: 'GET' | 'PUT', body?: unknown): Promise<T> {
  const response = await fetch('/api/state', {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to reach your cashbook database.');
  return payload as T;
}

export function loadCashbook() {
  return request<CashbookState>('GET');
}

export function saveCashbook(state: CashbookState) {
  return request<{ success: boolean }>('PUT', state);
}
