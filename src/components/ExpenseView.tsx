import React, { useMemo, useState } from 'react';
import { Expense, ExpenseCategory, PurposeType } from '../types';
import { formatUGX } from '../utils/format';
import { CalendarDays, FileCheck, Plus, Receipt, Search, Trash2, Pencil, Tags } from 'lucide-react';

interface ExpenseViewProps {
  expenses: Expense[];
  onAddExpense: () => void;
  onAddTax: () => void;
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
  'Savings',
  'Investments',
  'Debt Repayment',
  'Savings & Investments',
  'Taxes & Fees',
  'Other',
];

const isTaxOrFeeRecord = (expense: Expense) => (
  expense.isTaxEntry === true || expense.category === 'Taxes & Fees'
);

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  expenses,
  onAddExpense,
  onAddTax,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [purposeFilter, setPurposeFilter] = useState<'all' | PurposeType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [recordType, setRecordType] = useState<'expenses' | 'taxes'>('expenses');

  const expenseRecords = useMemo(() => expenses.filter((expense) => !isTaxOrFeeRecord(expense)), [expenses]);
  const taxRecords = useMemo(() => expenses.filter(isTaxOrFeeRecord), [expenses]);
  const visibleRecords = recordType === 'expenses' ? expenseRecords : taxRecords;

  const filteredExpenses = useMemo(() => visibleRecords.filter((expense) => {
    if (recordType === 'expenses' && purposeFilter !== 'all' && expense.purpose !== purposeFilter) return false;
    if (recordType === 'expenses' && categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    if (dateFilter && expense.date !== dateFilter) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    return [
      expense.title,
      expense.vendor,
      expense.category,
      expense.notes,
      expense.categoryDetails?.savingsGoal,
      expense.categoryDetails?.destination,
      expense.categoryDetails?.investmentType,
      expense.categoryDetails?.provider,
      expense.categoryDetails?.payee,
      expense.categoryDetails?.reference,
    ].some((value) => value?.toLowerCase().includes(query));
  }), [visibleRecords, recordType, purposeFilter, categoryFilter, dateFilter, searchQuery]);

  const expenseCount = expenseRecords.length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const parentsWithSeparateTax = new Set(
    taxRecords.filter((expense) => expense.parentExpenseId).map((expense) => expense.parentExpenseId)
  );
  const totalTaxAndFees = taxRecords.reduce((sum, expense) => sum + expense.totalAmount, 0) +
    expenseRecords.reduce((sum, expense) => {
      if (parentsWithSeparateTax.has(expense.id)) return sum;
      return sum + (expense.taxAmount || 0);
    }, 0);

  const confirmDelete = (expense: Expense) => {
    const label = isTaxOrFeeRecord(expense) ? 'this tax or fee record' : 'this expense and its linked tax or fee';
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) onDeleteExpense(expense.id);
  };

  const getCategoryDetailsLabel = (expense: Expense) => {
    const details = expense.categoryDetails;
    if (!details) return '';
    if (expense.category === 'Savings') {
      return [
        details.savingsGoal && `Goal: ${details.savingsGoal}`,
        details.destination && `Saved to: ${details.destination}`,
      ].filter(Boolean).join(' · ');
    }
    if (expense.category === 'Investments') {
      return [
        details.investmentType,
        details.provider && `Provider: ${details.provider}`,
      ].filter(Boolean).join(' · ');
    }
    if (expense.category === 'Debt Repayment') {
      return [
        details.payee && `Paid to: ${details.payee}`,
        details.reference && `Ref: ${details.reference}`,
      ].filter(Boolean).join(' · ');
    }
    return '';
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
          onClick={recordType === 'expenses' ? onAddExpense : onAddTax}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          {recordType === 'expenses' ? 'Record expense' : 'Record tax / fee'}
        </button>
      </header>

      <section aria-label="Expense summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total outflow', value: formatUGX(totalExpenses), caption: 'Expenses including separate fees', icon: Receipt, color: 'bg-[#e7efe8] text-[#426b52] dark:bg-emerald-950/60 dark:text-emerald-300' },
          { label: 'Expenses recorded', value: expenseCount.toLocaleString(), caption: 'In the selected period', icon: CalendarDays, color: 'bg-[#e6edf0] text-[#55717b] dark:bg-sky-950/50 dark:text-sky-300' },
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

      <section aria-label="Expense and tax record sections" className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {([
          { id: 'expenses', label: 'Expenses', count: expenseRecords.length, icon: Receipt },
          { id: 'taxes', label: 'Taxes & fees', count: taxRecords.length, icon: Tags },
        ] as const).map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setRecordType(id)}
            aria-pressed={recordType === id}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              recordType === id
                ? 'border-emerald-700 text-emerald-800 dark:border-emerald-500 dark:text-emerald-300'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{count}</span>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                {recordType === 'expenses' ? 'Expense records' : 'Tax & fee records'}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{filteredExpenses.length} records shown</p>
            </div>
            {recordType === 'expenses' && (
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
            )}
          </div>

          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${recordType === 'expenses' ? 'lg:grid-cols-12' : 'lg:grid-cols-8'}`}>
            <label className={`relative sm:col-span-2 ${recordType === 'expenses' ? 'lg:col-span-6' : 'lg:col-span-5'}`}>
              <span className="sr-only">Search {recordType === 'expenses' ? 'expenses' : 'tax and fee records'}</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={recordType === 'expenses' ? 'Search expenses, payees or notes' : 'Search tax and fee records'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            {recordType === 'expenses' && (
              <label className="sm:col-span-1 lg:col-span-3">
                <span className="sr-only">Filter by category</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <option value="all">All categories</option>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
            )}
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
              {visibleRecords.length === 0
                ? recordType === 'expenses' ? 'No expenses recorded yet' : 'No tax or fee records yet'
                : `No matching ${recordType === 'expenses' ? 'expenses' : 'tax or fee records'}`}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {visibleRecords.length === 0
                ? recordType === 'expenses'
                  ? 'Record your first expense to start building a clear picture of your spending.'
                  : 'Record a tax or fee payment here on its own, or add it alongside an expense.'
                : 'Try changing your search or filters.'}
            </p>
            {recordType === 'expenses' && expenseRecords.length === 0 && (
              <button type="button" onClick={onAddExpense} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                <Plus className="h-4 w-4" />
                Record expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full ${recordType === 'expenses' ? 'min-w-[760px]' : 'min-w-[680px]'} border-collapse text-left`}>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                  {recordType === 'expenses' ? (
                    <>
                      <th className="px-4 py-3.5">Related expense</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Date &amp; payment</th>
                      <th className="px-4 py-3.5 text-right">Amount</th>
                      <th className="px-4 py-3.5 text-right">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3.5">Tax or fee</th>
                      <th className="px-4 py-3.5">Expense</th>
                      <th className="px-4 py-3.5">Date &amp; payment</th>
                      <th className="px-4 py-3.5 text-right">Amount</th>
                    </>
                  )}
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950 dark:text-white">
                        {recordType === 'taxes' ? `Tax / fee · ${expense.title.replace(' - Tax / Fee', '')}` : expense.title}
                      </div>
                      {recordType === 'expenses' && expense.vendor && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{expense.vendor}</div>}
                      {recordType === 'expenses' && getCategoryDetailsLabel(expense) && (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getCategoryDetailsLabel(expense)}</div>
                      )}
                      {recordType === 'expenses' && expense.notes && <div className="mt-1 max-w-sm truncate text-xs text-slate-500 dark:text-slate-400">{expense.notes}</div>}
                      {recordType === 'expenses' && expense.isTaxDeductible && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <FileCheck className="h-3.5 w-3.5" /> Tax-deductible
                        </span>
                      )}
                      {recordType === 'taxes' && expense.categoryDetails?.taxFeeType && (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {expense.categoryDetails.taxFeeType}
                          {expense.categoryDetails.reference && ` · Ref: ${expense.categoryDetails.reference}`}
                        </div>
                      )}
                      {recordType === 'taxes' && expense.vendor && (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paid to: {expense.vendor}</div>
                      )}
                    </td>
                    {recordType === 'taxes' ? (
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {expense.parentExpenseId
                          ? expenses.find((parent) => parent.id === expense.parentExpenseId)?.title || expense.title.replace(' - Tax / Fee', '')
                          : 'Independent payment'}
                      </td>
                    ) : (
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {expense.category}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="block font-medium text-slate-700 dark:text-slate-300">{expense.date}</span>
                      <span className="mt-1 block">{expense.paymentMethod}</span>
                      {recordType === 'expenses' && <span className="mt-1 block capitalize">{expense.purpose}</span>}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{formatUGX(expense.amount)}</td>
                    {recordType === 'expenses' && (
                      <td className="px-4 py-4 text-right font-mono text-xs font-semibold text-slate-950 dark:text-white">{formatUGX(expense.totalAmount)}</td>
                    )}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(recordType === 'expenses' || !expense.parentExpenseId) && (
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
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Total shown</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-950 dark:text-white">
                    {formatUGX(filteredExpenses.reduce((sum, expense) => sum + expense.totalAmount, 0))}
                  </td>
                  {recordType === 'expenses' && <td />}
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
