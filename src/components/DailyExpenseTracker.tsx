import React, { useState } from 'react';
import { Expense, MonthlyBudget, Inflow, DebtItem } from '../types';
import { formatUGX } from '../utils/format';
import { normalizeMonthlySalary } from '../utils/salary';
import {
  calculateCashbookBalances,
  isBankToMobileTransfer,
  isWithdrawalEntry,
  isDirectDigitalEntry,
  isCashOnHandSpending,
  isSavingsEntry,
} from '../utils/cashbookHelpers';
import { 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Plus, 
  ShieldCheck, 
  Sliders, 
  Calculator,
  Banknote,
  Wallet,
  Smartphone,
  CreditCard,
  ArrowRightLeft,
  Landmark,
  ArrowRight,
  ArrowDownLeft
} from 'lucide-react';

interface DailyExpenseTrackerProps {
  expenses: Expense[];
  inflows?: Inflow[];
  debts?: DebtItem[];
  budget: MonthlyBudget;
  selectedMonth: string;
  onOpenExpenseModal: (mode?: 'spending' | 'transfer' | 'cashout' | 'savings') => void;
  onOpenInflowModal?: () => void;
  onUpdateBudgetSalary?: (salary: number, savingsTarget: number) => void;
}

export const DailyExpenseTracker: React.FC<DailyExpenseTrackerProps> = ({
  expenses,
  inflows = [],
  debts = [],
  budget,
  selectedMonth,
  onOpenExpenseModal,
  onOpenInflowModal,
  onUpdateBudgetSalary,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isEditingSalary, setIsEditingSalary] = useState(false);

  // Salary & Tax parameters (Gross: 500,000 | Local Tax: 15,000 | NSSF: 0 => Net: 485,000)
  const grossSalary = normalizeMonthlySalary(budget?.monthlySalary);
  const savingsTarget = budget?.savingsTarget ?? 20000;
  const localTax = budget?.localTax ?? 15000;
  const nssfDeduction = budget?.nssfDeduction ?? 0;

  const [inputSalary, setInputSalary] = useState(grossSalary);
  const [inputSavings, setInputSavings] = useState(savingsTarget);

  // Net Income calculation
  const netIncome = Math.max(0, grossSalary - nssfDeduction - localTax);
  const spendablePool = Math.max(0, netIncome - savingsTarget);
  
  // Daily allowance (30 days per month)
  const dailyAllowance = Math.round(spendablePool / 30);
  const dailySavingsTarget = Math.round(savingsTarget / 30);

  // Check if viewing All Months / All Time filter
  const isAllTime = selectedMonth === 'all';
  const recordedMonthsCount = isAllTime
    ? Math.max(1, new Set(expenses.map((e) => (e.date ? e.date.slice(0, 7) : '2026-08'))).size)
    : 1;

  // Comprehensive financial cashbook calculation including cash inflows and debt repayments
  const balances = calculateCashbookBalances(expenses, budget, recordedMonthsCount, inflows, debts);

  // Selected date expenses
  const selectedDayExpenses = expenses.filter((e) => e.date === selectedDate);
  const selectedDayNonSavings = selectedDayExpenses.filter(
    (e) => !e.isSavings && e.category !== 'Savings & Investments'
  );

  // Separate day's transfers, cashouts, direct digital deductions, and cash spendings
  const selectedDayTransfers = selectedDayExpenses.filter((e) => isBankToMobileTransfer(e));
  const selectedDayCashoutEntries = selectedDayNonSavings.filter((e) => isWithdrawalEntry(e));
  const selectedDayDirectDigitalEntries = selectedDayNonSavings.filter((e) => isDirectDigitalEntry(e));
  const selectedDayCashSpendingEntries = selectedDayNonSavings.filter((e) => isCashOnHandSpending(e));
  const selectedDaySavingsEntries = selectedDayExpenses.filter((e) => isSavingsEntry(e));

  // Totals for selected date
  const selectedDayTotalTransferredFromBank = selectedDayTransfers.reduce((sum, e) => sum + e.totalAmount, 0);
  const selectedDayTotalCashoutReceived = selectedDayCashoutEntries.reduce((sum, e) => sum + e.amount, 0);
  const selectedDaySpendingsFromCashout = selectedDayCashSpendingEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const selectedDayDirectDigitalSpent = selectedDayDirectDigitalEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const selectedDayMtnSavingsDeducted = selectedDaySavingsEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  // Remaining unspent cashout on selected date
  const remainingCashOnHand = selectedDayTotalCashoutReceived - selectedDaySpendingsFromCashout;
  const cashoutUsedPct = selectedDayTotalCashoutReceived > 0
    ? Math.min(100, Math.round((selectedDaySpendingsFromCashout / selectedDayTotalCashoutReceived) * 100))
    : 0;

  // Actual total spent on selected date (Direct digital + Cash spendings)
  const selectedDaySpent = selectedDayDirectDigitalSpent + selectedDaySpendingsFromCashout;
  const dailyBalance = dailyAllowance - selectedDaySpent;

  // Savings progress
  const currentSaved = balances.totalSavings;
  const effectiveSavingsTarget = isAllTime ? savingsTarget * recordedMonthsCount : savingsTarget;
  const savingsProgressPct = effectiveSavingsTarget > 0 ? Math.min(100, Math.round((currentSaved / effectiveSavingsTarget) * 100)) : 0;

  const handleSaveSalaryConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBudgetSalary) {
      onUpdateBudgetSalary(inputSalary, inputSavings);
    }
    setIsEditingSalary(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 mb-1">
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            Budget & Cash Engine
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Daily Budget & Salary Tracking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gross Salary: <strong className="text-slate-900 dark:text-white font-mono">{formatUGX(grossSalary)}</strong> • Tax: <strong className="text-slate-600 dark:text-slate-400 font-mono">-{formatUGX(localTax)}</strong> • Net Take-Home: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatUGX(netIncome)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenExpenseModal('transfer')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95 border border-slate-700 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Funds</span>
          </button>

          <button
            onClick={() => setIsEditingSalary(!isEditingSalary)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            {isEditingSalary ? 'Close Settings' : 'Salary Settings'}
          </button>
        </div>
      </div>

      {/* Salary & Savings Edit Drawer */}
      {isEditingSalary && (
        <form onSubmit={handleSaveSalaryConfig} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-emerald-500" />
            Configure Monthly Income & Savings Allocations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gross Monthly Salary (UGX)
              </label>
              <input
                type="number"
                min="50000"
                step="10000"
                value={inputSalary}
                onChange={(e) => setInputSalary(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: UGX 500,000 / month</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Monthly Savings (UGX)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={inputSavings}
                onChange={(e) => setInputSavings(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Monthly Target: UGX 20,000</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsEditingSalary(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </form>
      )}

      {/* Breakdown Grid: Salary vs Savings vs Daily Limit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Box 1: Gross Salary & Net Pay */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Monthly Salary
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatUGX(grossSalary)}
          </div>
          <div className="mt-2 text-[11px] space-y-1 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/60 pt-2 font-mono">
            <div className="flex justify-between">
              <span>Local Tax Deduction:</span>
              <span className="text-slate-600 dark:text-slate-400">-{formatUGX(localTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Net Take-Home:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatUGX(netIncome)}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Savings Goal & Target */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAllTime ? 'Total Savings (All Time)' : 'Monthly Savings Goal'}
            </span>
            <PiggyBank className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatUGX(currentSaved)}
            </span>
            {!isAllTime && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                / {formatUGX(savingsTarget)}
              </span>
            )}
          </div>

          {!isAllTime ? (
            <>
              {/* Savings Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                  style={{ width: `${Math.min(100, savingsProgressPct)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>
                  Progress: <strong className="font-bold text-slate-900 dark:text-white">{savingsProgressPct}%</strong>
                </span>
                <span>
                  {currentSaved >= savingsTarget ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                      Goal Met
                    </span>
                  ) : (
                    <span>Need {formatUGX(savingsTarget - currentSaved)}</span>
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Capital accumulated across all savings deposits.
            </div>
          )}
        </div>

        {/* Box 3: Daily Spending Limit */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recommended Daily Limit
            </span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatUGX(dailyAllowance)} <span className="text-xs font-normal text-slate-500">/ day</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Spendable Pool: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatUGX(spendablePool)}</strong> (Net minus Savings).
          </p>
        </div>
      </div>

      {/* 4-Channel Live Liquidity Strip (Bank, MTN MoMo, Airtel Money, Cash on Hand) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            🏦 Bank Balance
          </span>
          <span className="text-sm font-black font-mono text-slate-900 dark:text-white block mt-0.5">
            {formatUGX(balances.availableBankBalance)}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            📱 MTN MoMo
          </span>
          <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-300 block mt-0.5">
            {formatUGX(balances.availableMtnBalance)}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            🔴 Airtel Money
          </span>
          <span className="text-sm font-black font-mono text-rose-700 dark:text-rose-300 block mt-0.5">
            {formatUGX(balances.availableAirtelBalance)}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            💵 Cash on Hand
          </span>
          <span className={`text-sm font-black font-mono block mt-0.5 ${balances.availableCashOnHand >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {balances.availableCashOnHand >= 0 ? formatUGX(balances.availableCashOnHand) : `-${formatUGX(Math.abs(balances.availableCashOnHand))}`}
          </span>
        </div>
      </div>

      {/* Daily Expense Monitor for Selected Date */}
      <div className="bg-slate-50/60 dark:bg-slate-800/30 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Daily Ledger for:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none"
            />
            {selectedDate === todayStr && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                Today
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenExpenseModal('spending')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95 border border-slate-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Entry for {selectedDate === todayStr ? 'Today' : selectedDate}
            </button>
            <button
              onClick={() => onOpenExpenseModal('savings')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              <PiggyBank className="w-3.5 h-3.5" />
              Send MTN Saving
            </button>
          </div>
        </div>

        {/* Status Meter Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Daily Budget Limit
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {formatUGX(dailyAllowance)}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Daily Savings Sent
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {formatUGX(selectedDayMtnSavingsDeducted)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Target: {formatUGX(dailySavingsTarget)} / day
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Spent on {selectedDate}
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {formatUGX(selectedDaySpent)}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Daily Balance
              </span>
              {dailyBalance >= 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div className={`text-base font-extrabold font-mono mt-0.5 ${dailyBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {dailyBalance >= 0 ? `+${formatUGX(dailyBalance)}` : formatUGX(dailyBalance)}
            </div>
          </div>
        </div>

        {/* Expenses List for Selected Date */}
        {selectedDayExpenses.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Entries for {selectedDate} ({selectedDayExpenses.length}):
            </span>
            <div className="space-y-1.5">
              {selectedDayExpenses.map((e) => {
                const isTransfer = isBankToMobileTransfer(e);
                const isW = isWithdrawalEntry(e);
                const isDirect = isDirectDigitalEntry(e);
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{e.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {isTransfer ? 'Transfer' : isW ? 'Cashout' : isDirect ? 'Direct Digital' : e.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {e.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatUGX(e.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
