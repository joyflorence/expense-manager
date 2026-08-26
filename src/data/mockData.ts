import { Expense, MonthlyBudget, DebtItem, Inflow } from '../types';

export const INITIAL_BUDGETS: MonthlyBudget[] = [
  {
    month: '2026-08',
    workBudget: 200000,
    personalBudget: 200000,
    monthlySalary: 500000,
    savingsTarget: 20000,
    localTax: 15000,
    nssfDeduction: 0,
  },
];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_INFLOWS: Inflow[] = [];

export const INITIAL_DEBTS: DebtItem[] = [];

