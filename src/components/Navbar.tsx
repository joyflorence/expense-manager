import React, { useState } from 'react';
import { CalendarDays, Download, Moon, Plus, Receipt, RefreshCw, Sun, Trash2 } from 'lucide-react';
import { DateFilterMode, DateFilterState } from '../types';

export type ViewTab = 'overview' | 'expenses' | 'debts' | 'analytics';

interface NavbarProps {
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
  availableMonths: string[];
  onOpenExpenseModal: () => void;
  onOpenExportModal: () => void;
  onClearData: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dateFilter,
  onDateFilterChange,
  availableMonths,
  onOpenExpenseModal,
  onOpenExportModal,
  onClearData,
  onRefresh,
  onSignOut,
  theme,
  onToggleTheme,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setMode = (mode: DateFilterMode) => onDateFilterChange({ ...dateFilter, mode });
  const monthLabel = (month: string) => {
    const [year, value] = month.split('-').map(Number);
    return new Date(year, value - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  const refresh = () => {
    setIsRefreshing(true);
    onRefresh();
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 text-slate-900 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white dark:bg-emerald-600">
              <Receipt className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-slate-950 dark:text-white sm:text-base">Expense Manager</span>
              <span className="mt-0.5 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Personal expense tracker</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button type="button" onClick={refresh} aria-label="Refresh expenses" title="Refresh expenses" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={onOpenExportModal} aria-label="Export expenses" title="Export expenses" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
              <Download className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClearData} aria-label="Clear expense records" title="Clear expense records" className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 sm:flex">
              <Trash2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white sm:flex">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button type="button" onClick={onSignOut} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:inline-flex">
              Sign out
            </button>
            <button type="button" onClick={onOpenExpenseModal} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:min-h-10 sm:gap-2 sm:px-4 sm:text-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Record expense</span>
              <span className="sm:hidden">Record</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 py-2.5 dark:border-slate-800 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            Period
          </span>
          <select
            value={dateFilter.mode}
            onChange={(event) => setMode(event.target.value as DateFilterMode)}
            aria-label="Filter expenses by period"
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All time</option>
            <option value="month">Month</option>
            <option value="today">Today</option>
            <option value="day">Specific day</option>
            <option value="this_week">This week</option>
            <option value="range">Date range</option>
          </select>

          {dateFilter.mode === 'month' && (
            <select
              value={dateFilter.selectedMonth}
              onChange={(event) => onDateFilterChange({ ...dateFilter, selectedMonth: event.target.value })}
              aria-label="Select month"
              className="min-h-9 max-w-52 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {availableMonths.filter((month) => month !== 'all').map((month) => (
                <option key={month} value={month}>{monthLabel(month)}</option>
              ))}
            </select>
          )}

          {dateFilter.mode === 'day' && (
            <input
              type="date"
              value={dateFilter.selectedDay}
              onChange={(event) => onDateFilterChange({ ...dateFilter, selectedDay: event.target.value, mode: 'day' })}
              aria-label="Select date"
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          )}

          {dateFilter.mode === 'range' && (
            <>
              <input type="date" value={dateFilter.startDate} onChange={(event) => onDateFilterChange({ ...dateFilter, startDate: event.target.value })} aria-label="Start date" className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={dateFilter.endDate} onChange={(event) => onDateFilterChange({ ...dateFilter, endDate: event.target.value })} aria-label="End date" className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            </>
          )}
        </div>
      </div>
    </header>
  );
};
