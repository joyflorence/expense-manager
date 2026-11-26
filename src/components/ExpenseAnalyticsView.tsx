import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CalendarDays, Receipt, Tags, TrendingUp } from 'lucide-react';
import { Expense } from '../types';
import { formatUGX } from '../utils/format';

interface ExpenseAnalyticsViewProps {
  expenses: Expense[];
  allExpenses: Expense[];
  comparisonMonth?: string;
}

const localDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMonth = (month: string) => {
  const [year, value] = month.split('-').map(Number);
  return new Date(year, value - 1, 1).toLocaleDateString(undefined, { month: 'short' });
};

const CHART_GREEN = '#477a62';

export const ExpenseAnalyticsView: React.FC<ExpenseAnalyticsViewProps> = ({ expenses, allExpenses, comparisonMonth }) => {
  const expenseRecords = useMemo(() => expenses.filter((expense) => !expense.isTaxEntry), [expenses]);
  const totalOutflow = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.totalAmount, 0),
    [expenses]
  );
  const totalTaxAndFees = useMemo(() => {
    const parentsWithSeparateTax = new Set(
      expenses.filter((expense) => expense.isTaxEntry && expense.parentExpenseId).map((expense) => expense.parentExpenseId)
    );
    return expenses.reduce((sum, expense) => {
      if (expense.isTaxEntry) return sum + expense.amount;
      if (parentsWithSeparateTax.has(expense.id)) return sum;
      return sum + (expense.taxAmount || 0);
    }, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const expense of expenseRecords) {
      totals.set(expense.category, (totals.get(expense.category) || 0) + expense.totalAmount);
    }
    return Array.from(totals, ([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value);
  }, [expenseRecords]);

  const trendData = useMemo(() => {
    const today = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
      return localDateString(monthDate);
    });
    const monthlyTotals = new Map(months.map((month) => [month, 0]));
    for (const expense of allExpenses) {
      const month = expense.date.slice(0, 7);
      if (!monthlyTotals.has(month)) continue;
      monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + expense.totalAmount);
    }
    return months.map((month) => ({
      month: formatMonth(month),
      amount: monthlyTotals.get(month) || 0,
    }));
  }, [allExpenses]);

  const topCategory = categoryData[0];
  const maxCategoryValue = topCategory?.value || 1;
  const averageSpend = expenseRecords.length ? totalOutflow / expenseRecords.length : 0;
  const monthComparison = useMemo(() => {
    if (!comparisonMonth) return null;
    const [year, month] = comparisonMonth.split('-').map(Number);
    const previousMonth = localDateString(new Date(year, month - 2, 1));
    const isCurrentMonth = comparisonMonth === localDateString(new Date());
    const selectedMonthEndDay = new Date(year, month, 0).getDate();
    const periodEndDay = isCurrentMonth ? new Date().getDate() : selectedMonthEndDay;
    const previousMonthEndDay = Math.min(periodEndDay, new Date(year, month - 1, 0).getDate());
    const periodEnd = String(periodEndDay).padStart(2, '0');
    const previousPeriodEnd = String(previousMonthEndDay).padStart(2, '0');
    const previousTotal = allExpenses
      .filter((expense) => expense.date >= `${previousMonth}-01` && expense.date <= `${previousMonth}-${previousPeriodEnd}`)
      .reduce((sum, expense) => sum + expense.totalAmount, 0);
    const currentTotal = allExpenses
      .filter((expense) => expense.date >= `${comparisonMonth}-01` && expense.date <= `${comparisonMonth}-${periodEnd}`)
      .reduce((sum, expense) => sum + expense.totalAmount, 0);
    const difference = currentTotal - previousTotal;
    const percentage = previousTotal > 0 ? (difference / previousTotal) * 100 : null;
    const periodLabel = isCurrentMonth ? 'month to date' : formatMonth(comparisonMonth);
    return {
      label: percentage === null ? 'No baseline' : `${difference > 0 ? '+' : ''}${percentage.toFixed(1)}%`,
      caption: previousTotal > 0
        ? `${difference >= 0 ? 'More' : 'Less'} than ${formatMonth(previousMonth)} (${formatUGX(Math.abs(difference))}, same period)`
        : `No records for the same period last month`,
      isIncrease: difference > 0,
      periodLabel,
    };
  }, [allExpenses, comparisonMonth]);
  const cards = [
    {
      label: 'Total outflow',
      value: formatUGX(totalOutflow),
      caption: 'Expenses and recorded fees',
      icon: Activity,
      iconClass: 'bg-[#e7efe8] text-[#426b52] dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      label: 'Expense records',
      value: expenseRecords.length.toLocaleString(),
      caption: 'In this selected period',
      icon: Receipt,
      iconClass: 'bg-[#f0ede2] text-[#82754c] dark:bg-amber-950/40 dark:text-amber-200',
    },
    {
      label: 'Average per expense',
      value: formatUGX(averageSpend),
      caption: 'Includes any linked fees',
      icon: TrendingUp,
      iconClass: 'bg-[#e6edf0] text-[#55717b] dark:bg-sky-950/50 dark:text-sky-300',
    },
    {
      label: 'Taxes & fees',
      value: formatUGX(totalTaxAndFees),
      caption: 'Kept separate from spending',
      icon: Tags,
      iconClass: 'bg-[#f2e9dc] text-[#9a6b3f] dark:bg-orange-950/40 dark:text-orange-200',
    },
    ...(monthComparison ? [{
      label: 'Month-on-month change',
      value: monthComparison.label,
      caption: `${monthComparison.caption} · ${monthComparison.periodLabel}`,
      icon: TrendingUp,
      iconClass: monthComparison.isIncrease
        ? 'bg-[#f3e8df] text-[#9b5b36] dark:bg-orange-950/40 dark:text-orange-200'
        : 'bg-[#e7efe8] text-[#426b52] dark:bg-emerald-950/60 dark:text-emerald-300',
    }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#53715e] dark:text-emerald-400">Spending insights</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Expense analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Understand where your spending goes and how it changes over time.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:self-auto">
          <CalendarDays className="h-4 w-4 text-[#53715e] dark:text-emerald-400" />
          {expenseRecords.length} {expenseRecords.length === 1 ? 'expense' : 'expenses'} in selected period
        </div>
      </header>

      <section aria-label="Expense analytics summary" className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${comparisonMonth ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
        {cards.map(({ label, value, caption, icon: Icon, iconClass }) => (
          <article key={label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 truncate font-mono text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caption}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:col-span-3">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Monthly spending trend</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total outflow over the last six months</p>
          </div>
          <div className="h-64 w-full" role="img" aria-label="Bar chart showing monthly expense totals for the last six months">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e7e5df" strokeDasharray="3 5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#787b73', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tick={{ fill: '#787b73', fontSize: 11 }}
                  tickFormatter={(value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}m` : `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: '#f4f3ee' }}
                  formatter={(value) => [formatUGX(Number(value) || 0), 'Total outflow']}
                  contentStyle={{ borderRadius: 12, borderColor: '#e7e5df', fontSize: 12 }}
                />
                <Bar dataKey="amount" fill={CHART_GREEN} radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:col-span-2">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Spending by category</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Based on expenses in the selected period</p>
          </div>
          {categoryData.length === 0 ? (
            <div className="grid min-h-52 place-items-center rounded-xl bg-stone-50 px-5 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              Category insights will appear after you record expenses.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryData.slice(0, 6).map(({ name, value }) => (
                <div key={name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">{name}</span>
                    <span className="shrink-0 font-mono text-slate-600 dark:text-slate-400">{formatUGX(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-[#66866c] dark:bg-emerald-600" style={{ width: `${Math.max(3, (value / maxCategoryValue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {topCategory && (
            <div className="mt-5 rounded-xl border border-[#e1e9df] bg-[#f5f8f3] p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#53715e] dark:text-emerald-400">Top category</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{topCategory.name}</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{formatUGX(topCategory.value)} spent in this period</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
