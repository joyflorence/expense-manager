import React, { useMemo, useState } from 'react';
import { Expense, ExpenseCategory, PurposeType } from '../types';
import { formatUGX } from '../utils/format';
import { CalendarDays, FileCheck, Plus, Receipt, Search, Trash2, Pencil, Tags } from 'lucide-react';

interface ExpenseViewProps {
  expenses: Expense[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Family Support & Upkeep',
  'Airtime, Data & Minutes',
  'Software & Tools',
  'Office Supplies',
  'Dining & Meals',
  'Travel & Commute',
  'Client Expenses',
  'Groceries',
  'Utilities & Bills',
  'Health & Wellness',
  'Subscriptions',
  'Shopping & Personal',
  'Taxes & Fees',
  'Other',
];

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [purposeFilter, setPurposeFilter] = useState<'all' | PurposeType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    if (purposeFilter !== 'all' && expense.purpose !== purposeFilter) return false;
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    if (dateFilter && expense.date !== dateFilter) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    return [
      expense.title,
      expense.vendor,
      expense.category,
      expense.notes,
    ].some((value) => value?.toLowerCase().includes(query));
  }), [expenses, purposeFilter, categoryFilter, dateFilter, searchQuery]);

  const expenseCount = expenses.filter((expense) => !expense.isTaxEntry).length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const totalTaxAndFees = expenses.reduce((sum, expense) => (
    sum + (expense.isTaxEntry ? expense.amount : expense.taxAmount || 0)
  ), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.reduce((sum, expense) => (
    sum + (expense.date.slice(0, 7) === currentMonth && !expense.isTaxEntry ? expense.amount : 0)
  ), 0);

  const confirmDelete = (expense: Expense) => {
    const label = expense.isTaxEntry ? 'this tax or fee record' : 'this expense and its linked tax or fee';
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) onDeleteExpense(expense.id);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-4">
      <header className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">Expense tracking</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Expenses</h1>
            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500 dark:text-slate-400">
              A simple record of your spending. Taxes and fees are kept separate.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddExpense}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Record expense
        </button>
      </header>

      <section aria-label="Expense summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total expenses', value: formatUGX(totalExpenses), caption: `${expenseCount} ${expenseCount === 1 ? 'expense' : 'expenses'}`, icon: Receipt, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
          { label: 'This month', value: formatUGX(monthExpenses), caption: 'Expense amount this month', icon: CalendarDays, color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' },
          { label: 'Taxes & fees', value: formatUGX(totalTaxAndFees), caption: 'Tracked separately', icon: Tags, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
        ].map(({ label, value, caption, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-mono text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caption}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Expense records</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{filteredExpenses.length} records shown</p>
            </div>
            <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {([
                { value: 'all', label: 'All' },
                { value: 'personal', label: 'Personal' },
                { value: 'work', label: 'Work' },
              ] as const).map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setPurposeFilter(filter.value)}
                  aria-pressed={purposeFilter === filter.value}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    purposeFilter === filter.value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <label className="relative sm:col-span-2 lg:col-span-6">
              <span className="sr-only">Search expenses</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search expenses, payees or notes"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="sm:col-span-1 lg:col-span-3">
              <span className="sr-only">Filter by category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <option value="all">All categories</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="sm:col-span-1 lg:col-span-3">
              <span className="sr-only">Filter by date</span>
              <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </label>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="space-y-3 px-6 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Receipt className="h-6 w-6" />
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {expenses.length === 0 ? 'No expenses recorded yet' : 'No matching expenses'}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {expenses.length === 0
                ? 'Record your first expense to start building a clear picture of your spending.'
                : 'Try changing your search or filters.'}
            </p>
            {expenses.length === 0 && (
              <button type="button" onClick={onAddExpense} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                <Plus className="h-4 w-4" />
                Record expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                  <th className="px-4 py-3.5">Expense</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Date &amp; payment</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-right">Tax / fee</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950 dark:text-white">
                        {expense.isTaxEntry ? `Tax / fee · ${expense.title.replace(/ - Tax \\/ Fee$/, '')}` : expense.title}
                      </div>
                      {expense.vendor && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{expense.vendor}</div>}
                      {expense.notes && <div className="mt-1 max-w-sm truncate text-xs text-slate-500 dark:text-slate-400">{expense.notes}</div>}
                      {expense.isTaxDeductible && !expense.isTaxEntry && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <FileCheck className="h-3.5 w-3.5" /> Tax-deductible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {expense.isTaxEntry ? 'Taxes & Fees' : expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="block font-medium text-slate-700 dark:text-slate-300">{expense.date}</span>
                      <span className="mt-1 block">{expense.paymentMethod}</span>
                      <span className="mt-1 block capitalize">{expense.purpose}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{formatUGX(expense.amount)}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-amber-700 dark:text-amber-300">
                      {expense.isTaxEntry ? 'Separate record' : expense.taxAmount > 0 ? formatUGX(expense.taxAmount) : '—'}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-semibold text-slate-950 dark:text-white">{formatUGX(expense.totalAmount)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!expense.isTaxEntry && (
                          <button type="button" onClick={() => onEditExpense(expense)} aria-label={`Edit ${expense.title}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button type="button" onClick={() => confirmDelete(expense)} aria-label={`Delete ${expense.title}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/60">
                  <td colSpan={5} className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Total shown</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-950 dark:text-white">
                    {formatUGX(filteredExpenses.reduce((sum, expense) => sum + expense.totalAmount, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
