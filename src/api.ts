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

async function getAuthToken(): Promise<string | null> {
  try {
    const client = authClient as Record<string, unknown>;
    // 1. Try authClient.token() - official Neon SDK / Better Auth method
    if (typeof client.token === 'function') {
      const res = await (client.token as () => Promise<unknown>)();
      if (typeof res === 'string' && res) return res;
      const resObj = res as { data?: { token?: string }; token?: string } | null;
      if (resObj?.data?.token && typeof resObj.data.token === 'string') return resObj.data.token;
      if (resObj?.token && typeof resObj.token === 'string') return resObj.token;
    }
    // 2. Try authClient.getJWTToken()
    if (typeof client.getJWTToken === 'function') {
      const token = await (client.getJWTToken as () => Promise<unknown>)();
      if (typeof token === 'string' && token) return token;
      if (token && typeof token === 'object') {
        const tokenObj = token as { token?: string; data?: { token?: string } };
        if (typeof tokenObj.token === 'string') return tokenObj.token;
        if (typeof tokenObj.data?.token === 'string') return tokenObj.data.token;
      }
    }
    // 3. Try authClient.getSession()
    if (typeof client.getSession === 'function') {
      const session = await (client.getSession as () => Promise<unknown>)();
      const sessObj = session as { data?: { session?: { token?: string }; token?: string } } | null;
      if (sessObj?.data?.session?.token && typeof sessObj.data.session.token === 'string') {
        return sessObj.data.session.token;
      }
      if (sessObj?.data?.token && typeof sessObj.data.token === 'string') {
        return sessObj.data.token;
      }
    }
  } catch (error) {
    console.warn('Unable to retrieve auth token from authClient:', error);
  }
  return null;
}

async function request<T>({ method, path, body }: RequestOptions): Promise<T> {
  const httpMethod = String(method || '').toUpperCase();
  if (httpMethod !== 'GET' && httpMethod !== 'PUT' && httpMethod !== 'DELETE' && httpMethod !== 'POST') {
    throw new Error(`Invalid cashbook HTTP method: ${String(method)}`);
  }
  const token = await getAuthToken();
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const requestInit: RequestInit = {
    method: httpMethod,
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
  if (!response.ok) throw new Error(payload.error || `Cashbook request ${httpMethod} ${path} returned HTTP ${response.status}.`);
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
