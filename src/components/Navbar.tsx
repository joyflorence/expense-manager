import React, { useState } from 'react';
import { 
  Wallet,
  Plus, 
  Calendar, 
  Download, 
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  ArrowDownLeft,
  CalendarDays,
  CalendarRange,
  Clock,
  ChevronDown
} from 'lucide-react';
import { DateFilterState, DateFilterMode } from '../types';

export type ViewTab = 'overview' | 'expenses' | 'debts' | 'analytics';

interface NavbarProps {
  onTabChange: (tab: ViewTab) => void;
  dateFilter: DateFilterState;
  onDateFilterChange: (filter: DateFilterState) => void;
  availableMonths: string[];
  onOpenExpenseModal: () => void;
  onOpenInflowModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenExportModal: () => void;
  onClearData: () => void;
  onResetData: () => void;
  onRefresh: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  hasAIKey?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onTabChange,
  dateFilter,
  onDateFilterChange,
  availableMonths,
  onOpenExpenseModal,
  onOpenInflowModal,
  onOpenBudgetModal,
  onOpenExportModal,
  onClearData,
  onResetData,
  onRefresh,
  theme,
  onToggleTheme,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const handleRefreshClick = () => {
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 600);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const setFilterMode = (mode: DateFilterMode) => {
    onDateFilterChange({
      ...dateFilter,
      mode,
      selectedDay: mode === 'today' ? todayStr : dateFilter.selectedDay || todayStr,
    });
    setIsFilterDropdownOpen(false);
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none shrink-0" onClick={() => onTabChange('overview')}>
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 font-bold shadow-xs">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
                OMNITRACK<span className="text-emerald-500">.CASH</span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-0.5 hidden sm:block">
                Cashbook & Financial Ledger
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Action: Log Inflow */}
            <button
              id="navbar-add-inflow-btn"
              onClick={onOpenInflowModal}
              title="Record Money Coming In"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-xs cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">+ Log Inflow</span>
              <span className="sm:hidden">+ Inflow</span>
            </button>

            {/* Quick Action: Add Expense */}
            <button
              id="navbar-add-expense-btn"
              onClick={onOpenExpenseModal}
              title="Record Expense, Transfer or Cashout"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition active:scale-95 border border-slate-700 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Log Expense</span>
              <span className="sm:hidden">Expense</span>
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefreshClick}
              title="Refresh Data"
              className="hidden sm:block p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="hidden sm:block p-2 text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Settings & Extra Controls */}
            <div className="hidden md:flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-0.5">
              <button
                onClick={onOpenBudgetModal}
                title="Monthly Budget & Salary Settings"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenExportModal}
                title="Export or Import Backup"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClearData}
                title="Clear All Data"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onResetData}
                title="Reset Default Ledger"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter & Range Toolbar */}
        <div className="py-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Mode Pill Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilter.mode === 'month'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilter.mode === 'today'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('day')}
              className={`hidden sm:flex px-3 py-1.5 rounded-lg font-bold transition items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilter.mode === 'day'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Specific Day</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('this_week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilter.mode === 'this_week'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>This Week</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('range')}
              className={`hidden sm:flex px-3 py-1.5 rounded-lg font-bold transition items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilter.mode === 'range'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Custom Range</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilter.mode === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>All Time</span>
            </button>
          </div>

          {/* Contextual Date Controls */}
          <div className="flex items-center gap-2">
            {dateFilter.mode === 'month' && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <select
                  value={dateFilter.selectedMonth}
                  onChange={(e) =>
                    onDateFilterChange({ ...dateFilter, selectedMonth: e.target.value })
                  }
                  className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {availableMonths.map((m) => {
                    if (m === 'all') return <option key="all" value="all">All Months</option>;
                    const [year, monthNum] = m.split('-');
                    const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{monthName}</option>;
                  })}
                </select>
              </div>
            )}

            {dateFilter.mode === 'day' && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                <input
                  type="date"
                  value={dateFilter.selectedDay || todayStr}
                  onChange={(e) =>
                    onDateFilterChange({ ...dateFilter, selectedDay: e.target.value })
                  }
                  className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {dateFilter.mode === 'today' && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1">
                📅 {todayStr}
              </span>
            )}

            {dateFilter.mode === 'range' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
                  <span className="text-slate-400 text-[10px] font-bold">FROM:</span>
                  <input
                    type="date"
                    value={dateFilter.startDate || `${todayStr.slice(0, 7)}-01`}
                    onChange={(e) =>
                      onDateFilterChange({ ...dateFilter, startDate: e.target.value })
                    }
                    className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
                  <span className="text-slate-400 text-[10px] font-bold">TO:</span>
                  <input
                    type="date"
                    value={dateFilter.endDate || todayStr}
                    onChange={(e) =>
                      onDateFilterChange({ ...dateFilter, endDate: e.target.value })
                    }
                    className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
