import React, { useState } from 'react';
import { 
  Wallet,
  Receipt, 
  BarChart3, 
  LayoutDashboard, 
  Plus, 
  Calendar, 
  Download, 
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  Landmark,
  Banknote,
  ArrowDownLeft
} from 'lucide-react';

export type ViewTab = 'overview' | 'expenses' | 'debts' | 'analytics';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
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
  currentTab,
  onTabChange,
  selectedMonth,
  onMonthChange,
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

  const handleRefreshClick = () => {
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 600);
  };

  return (
    <header className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Month Selector */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('overview')}>
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-900 border border-slate-700/80 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                  OMNITRACK<span className="text-emerald-500">.CASH</span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                  Cashbook & Financial Ledger
                </p>
              </div>
            </div>

            {/* Month dropdown & Refresh button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-sm text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700 transition">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(e.target.value)}
                  className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold focus:ring-0 focus:outline-none cursor-pointer pr-1"
                >
                  {availableMonths.map((m) => {
                    if (m === 'all') {
                      return (
                        <option key="all" value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                          All Months / All Time
                        </option>
                      );
                    }
                    const [year, monthNum] = m.split('-');
                    const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                    return (
                      <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                        {monthName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefreshClick}
                title="Refresh & Reload Data"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800/60 rounded-lg transition active:scale-95 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSpinning ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Action Buttons & Theme Switcher */}
          <div className="flex items-center gap-2">
            {/* Quick Action: Log Inflow */}
            <button
              id="navbar-add-inflow-btn"
              onClick={onOpenInflowModal}
              title="Record Money Coming In (Salary, Client, MoMo Inflow, Gift, Sales)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition active:scale-95 shadow-sm"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Log Inflow</span>
            </button>

            {/* Quick Action: Add Expense / Transaction */}
            <button
              id="navbar-add-expense-btn"
              onClick={onOpenExpenseModal}
              title="Record Expense, Transfer or Cashout"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition active:scale-95 border border-slate-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <Receipt className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>

            {/* Dark / Light Theme Toggle Switch */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-amber-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg transition active:scale-95 shadow-sm"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2 ml-1">
              <button
                onClick={onOpenBudgetModal}
                title="Edit Monthly Salary & Settings"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenExportModal}
                title="Export or Import Backup Data"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClearData}
                title="Clear All Data (Start Fresh for your own entries)"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onResetData}
                title="Reset Clean Ledger"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 border-t border-slate-200 dark:border-slate-800/80 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap text-xs font-semibold ${
              currentTab === 'overview'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-sm border border-slate-800 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Cashbook Overview
          </button>

          <button
            onClick={() => onTabChange('expenses')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap text-xs font-semibold ${
              currentTab === 'expenses'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-sm border border-slate-800 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Cashbook Ledger
          </button>

          <button
            onClick={() => onTabChange('debts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap text-xs font-semibold ${
              currentTab === 'debts'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-sm border border-slate-800 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Landmark className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Debts & Friend Transfers
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap text-xs font-semibold ${
              currentTab === 'analytics'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-sm border border-slate-800 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Reports & Statements
          </button>
        </div>
      </div>
    </header>
  );
};


