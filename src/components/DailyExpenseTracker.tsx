import React, { useState } from 'react';
import { Expense, MonthlyBudget, Inflow } from '../types';
import { formatUGX } from '../utils/format';
import {
  calculateCashbookBalances,
  isBankToMobileTransfer,
  isWithdrawalEntry,
  isDirectDigitalEntry,
  isCashOnHandSpending,
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
  budget: MonthlyBudget;
  selectedMonth: string;
  onOpenExpenseModal: (mode?: 'spending' | 'transfer' | 'cashout' | 'savings') => void;
  onOpenInflowModal?: () => void;
  onUpdateBudgetSalary?: (salary: number, savingsTarget: number) => void;
}

export const DailyExpenseTracker: React.FC<DailyExpenseTrackerProps> = ({
  expenses,
  inflows = [],
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
  const grossSalary = budget?.monthlySalary ?? 500000;
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

  // Check if viewing All Months / All Time filter
  const isAllTime = selectedMonth === 'all';
  const recordedMonthsCount = isAllTime
    ? Math.max(1, new Set(expenses.map((e) => (e.date ? e.date.slice(0, 7) : '2026-08'))).size)
    : 1;

  // Comprehensive financial cashbook calculation including cash inflows
  const balances = calculateCashbookBalances(expenses, budget, recordedMonthsCount, inflows);

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

  // Totals for selected date
  const selectedDayTotalTransferredFromBank = selectedDayTransfers.reduce((sum, e) => sum + e.totalAmount, 0);
  const selectedDayTotalCashoutReceived = selectedDayCashoutEntries.reduce((sum, e) => sum + e.amount, 0);
  const selectedDaySpendingsFromCashout = selectedDayCashSpendingEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const selectedDayDirectDigitalSpent = selectedDayDirectDigitalEntries.reduce((sum, e) => sum + e.totalAmount, 0);

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-1">
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            Bank, Mobile Money & Cashbook Engine
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Daily Expense & Cashbook Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gross Salary <strong className="text-slate-900 dark:text-white font-mono">{formatUGX(grossSalary)}</strong> less <strong className="text-rose-500 font-mono">{formatUGX(localTax)}</strong> tax = <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatUGX(netIncome)} Net Bank Inflow</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenExpenseModal('transfer')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-sm active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Bank ➔ Mobile</span>
          </button>

          <button
            onClick={() => setIsEditingSalary(!isEditingSalary)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            {isEditingSalary ? 'Close Setup' : 'Configure Salary'}
          </button>
        </div>
      </div>

      {/* Salary & Savings Edit Drawer */}
      {isEditingSalary && (
        <form onSubmit={handleSaveSalaryConfig} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
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
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm"
            >
              Apply Income & Savings
            </button>
          </div>
        </form>
      )}

      {/* Breakdown Grid: Salary & Net vs Savings Goal vs Daily Allowance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Box 1: Gross Salary & Net Pay */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Monthly Salary
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatUGX(grossSalary)}
          </div>
          <div className="mt-2 text-[11px] space-y-1 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/60 pt-2 font-mono">
            <div className="flex justify-between">
              <span>Local Tax Deduction:</span>
              <span className="text-rose-500">-{formatUGX(localTax)}</span>
            </div>
            <div className="flex justify-between">
              <span>NSSF Deduction:</span>
              <span className="text-slate-400">UGX 0 (No NSSF)</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Net Take-Home:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatUGX(netIncome)}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Savings Goal & Target */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {isAllTime ? 'Total Savings (All Time)' : 'Monthly Savings Goal'}
            </span>
            <PiggyBank className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
              {formatUGX(currentSaved)}
            </span>
            {!isAllTime && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                / target {formatUGX(savingsTarget)}
              </span>
            )}
          </div>

          {!isAllTime ? (
            <>
              {/* Savings Progress Bar */}
              <div className="w-full bg-emerald-200 dark:bg-emerald-950 h-2.5 rounded-full mt-3 overflow-hidden border border-emerald-300 dark:border-emerald-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    savingsProgressPct >= 100 ? 'bg-emerald-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, savingsProgressPct)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <span>
                  Goal: <strong className="font-extrabold">{savingsProgressPct}%</strong> {currentSaved > 0 ? '(Saved)' : '(UGX 0)'}
                </span>
                <span>
                  {currentSaved >= savingsTarget ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                      Goal Met! 🎉
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 font-bold">
                      {currentSaved === 0
                        ? `Target: ${formatUGX(savingsTarget)}`
                        : `Need ${formatUGX(savingsTarget - currentSaved)}`}
                    </span>
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Overall capital accumulated across all logged savings deposits.
            </div>
          )}
        </div>

        {/* Box 3: Daily Spending Limit */}
        <div className="bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950/40 dark:to-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
              Recommended Daily Limit
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-indigo-900 dark:text-indigo-200 font-mono">
            {formatUGX(dailyAllowance)} <span className="text-xs font-normal text-slate-500">/ day</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Spendable Pool: <strong className="text-slate-700 dark:text-slate-300">{formatUGX(spendablePool)}</strong> (Net {formatUGX(netIncome)} - Savings {formatUGX(savingsTarget)}).
          </p>
        </div>
      </div>

      {/* Cashbook Ledger Balance Reconciler with 4 Liquid Channels */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-emerald-400">
              Cashbook Flow & Balance Engine ({selectedMonth === 'all' ? 'All-Time' : selectedMonth})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Transfers deduct from Bank & credit Mobile Money • Cash spendings deduct from Cashout Drawer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {/* Card 1: Available Bank Money (Deducted by transfers to Mobile Money) */}
          <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Available in Bank
              </span>
              <Landmark className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-base font-black font-mono text-emerald-400 block mt-1">
              {formatUGX(balances.availableBankBalance)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Net {formatUGX(balances.netIncome)} start
            </span>
            {balances.totalBankToMobileTransferred > 0 && (
              <span className="text-[10px] text-indigo-400 font-medium block mt-0.5">
                -{formatUGX(balances.totalBankToMobileTransferred)} transferred to MoMo
              </span>
            )}
          </div>

          {/* Card 2: Bank to Mobile Transfers & MoMo Wallet Pool */}
          <div className="p-3 bg-slate-800/90 rounded-xl border border-indigo-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                2. Mobile Money Wallet
              </span>
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-base font-black font-mono text-indigo-300 block mt-1">
              {formatUGX(balances.availableMobileMoneyBalance)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              +{formatUGX(balances.totalBankToMobileReceivedInMoMo)} received from Bank
            </span>
            {balances.momoDirectSpendings > 0 && (
              <span className="text-[10px] text-rose-400 font-medium block mt-0.5">
                -{formatUGX(balances.momoDirectSpendings)} airtime/data/bills
              </span>
            )}
          </div>

          {/* Card 3: Cashouts Taken to Pocket */}
          <div className="p-3 bg-slate-800/90 rounded-xl border border-amber-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                3. Cashouts to Pocket
              </span>
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-base font-black font-mono text-amber-400 block mt-1">
              {formatUGX(balances.totalCashoutsReceived)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Physical cash received
            </span>
          </div>

          {/* Card 4: Remaining Cash on Hand Drawer */}
          <div className={`p-3 rounded-xl border ${
            balances.availableCashOnHand >= 0
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-300">
                4. Cash on Hand Drawer
              </span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-base font-black font-mono block mt-1">
              {balances.availableCashOnHand >= 0 ? formatUGX(balances.availableCashOnHand) : `Deficit: -${formatUGX(Math.abs(balances.availableCashOnHand))}`}
            </span>
            <span className="text-[10px] block mt-0.5 opacity-80">
              Spent in Cash: {formatUGX(balances.totalCashSpendings)}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Expense Monitor for Selected Date */}
      <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Daily Cashbook for:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {selectedDate === todayStr && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-500/20">
                Today
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenExpenseModal('transfer')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-sm active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transfer Bank ➔ Mobile
            </button>

            <button
              onClick={() => onOpenExpenseModal('spending')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Entry for {selectedDate === todayStr ? 'Today' : selectedDate}
            </button>
          </div>
        </div>

        {/* Bank to Mobile Transfers on Selected Date Card */}
        {selectedDayTotalTransferredFromBank > 0 && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50/70 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                    Bank to Mobile Transfer Log ({selectedDate})
                  </h4>
                  <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 font-medium">
                    Funds transferred from Bank Account and added into Mobile Money Wallet
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-200 text-indigo-950 dark:bg-indigo-900 dark:text-indigo-200 shadow-sm font-mono">
                {formatUGX(selectedDayTotalTransferredFromBank)} Transferred
              </span>
            </div>

            <div className="space-y-1.5">
              {selectedDayTransfers.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">{t.title}</span>
                    {t.sourceBank && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                        {t.sourceBank} ➔ {t.recipientMobileNetwork || 'MoMo'}
                      </span>
                    )}
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-300 block">
                      {formatUGX(t.amount)}
                    </span>
                    {t.taxAmount > 0 && (
                      <span className="text-[10px] text-slate-500">
                        Fee: {formatUGX(t.taxAmount)} (Total deducted: {formatUGX(t.totalAmount)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Cash Withdrawal & Used Money Tracker Card */}
        {selectedDayTotalCashoutReceived > 0 && (
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/70 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                    Daily Cashout & Cash Drawer
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                    Cashouts from Bank/MoMo • Cash spendings deducted from pocket drawer on {selectedDate}
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-200 shadow-sm">
                {cashoutUsedPct}% Cashout Used
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-sm">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 block uppercase tracking-wider">
                  Cashout Inflow Received
                </span>
                <span className="text-base font-black text-amber-900 dark:text-amber-200 font-mono mt-0.5 block">
                  {formatUGX(selectedDayTotalCashoutReceived)}
                </span>
              </div>

              <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-sm">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase tracking-wider">
                  Cash Spendings (-Deducted)
                </span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
                  -{formatUGX(selectedDaySpendingsFromCashout)}
                </span>
                <span className="text-[10px] text-rose-500/80 block mt-0.5">{selectedDayCashSpendingEntries.length} items logged</span>
              </div>

              <div className={`p-3 rounded-xl border shadow-sm ${
                remainingCashOnHand >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}>
                <span className="text-[10px] font-bold block uppercase tracking-wider">
                  Remaining Cash on Hand
                </span>
                <span className="text-base font-black font-mono mt-0.5 block">
                  {remainingCashOnHand >= 0 ? formatUGX(remainingCashOnHand) : `Over by ${formatUGX(Math.abs(remainingCashOnHand))}`}
                </span>
                <span className="text-[10px] block mt-0.5 opacity-90">
                  {remainingCashOnHand >= 0 ? 'Remaining in pocket' : 'Exceeded cashout!'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="w-full bg-amber-200 dark:bg-amber-950 h-2.5 rounded-full overflow-hidden border border-amber-300 dark:border-amber-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remainingCashOnHand >= 0 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, cashoutUsedPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-amber-900 dark:text-amber-200 font-semibold">
                <span>Deducted {formatUGX(selectedDaySpendingsFromCashout)} from cashout</span>
                <span>
                  {remainingCashOnHand >= 0
                    ? `${formatUGX(remainingCashOnHand)} cash on hand remaining`
                    : `Exceeded cashout by ${formatUGX(Math.abs(remainingCashOnHand))}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Meter Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Daily Budget Limit
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {formatUGX(dailyAllowance)}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Spent on {selectedDate}
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {formatUGX(selectedDaySpent)}
            </span>
            {selectedDayDirectDigitalSpent > 0 && (
              <span className="text-[10px] text-indigo-500 block mt-0.5">
                (Airtime/Data Direct: {formatUGX(selectedDayDirectDigitalSpent)})
              </span>
            )}
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            dailyBalance >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Daily Balance Remaining
              </span>
              {dailyBalance >= 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div className="text-base font-extrabold font-mono mt-0.5">
              {dailyBalance >= 0 ? `+${formatUGX(dailyBalance)}` : formatUGX(dailyBalance)}
            </div>
          </div>
        </div>

        {/* Message Banner */}
        <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
          dailyBalance >= 0
            ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            : 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
        }`}>
          {dailyBalance >= 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Great job!</strong> You are <strong className="font-mono">{formatUGX(dailyBalance)}</strong> under your daily limit. Your <strong>{formatUGX(savingsTarget)}</strong> monthly savings goal is fully protected.
              </span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                <strong>Over Daily Allowance!</strong> You spent <strong className="font-mono">{formatUGX(Math.abs(dailyBalance))}</strong> over today's recommended limit. Try to save on non-essential purchases tomorrow to stay on target!
              </span>
            </>
          )}
        </div>

        {/* Expenses List for Selected Date */}
        {selectedDayExpenses.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Financial Logs for {selectedDate} ({selectedDayExpenses.length}):
            </span>
            <div className="space-y-1.5">
              {selectedDayExpenses.map((e) => {
                const isTransfer = isBankToMobileTransfer(e);
                const isW = isWithdrawalEntry(e);
                const isDirect = isDirectDigitalEntry(e);
                return (
                  <div
                    key={e.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isTransfer
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/70'
                        : isW
                        ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                        : e.isSavings
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                        : isDirect
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{e.title}</span>
                      {isTransfer ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold flex items-center gap-1 shadow-sm">
                          <ArrowRightLeft className="w-3 h-3" /> Bank ➔ Mobile Transfer
                        </span>
                      ) : isW ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center gap-1 shadow-sm">
                          <Banknote className="w-3 h-3" /> Cashout Received
                        </span>
                      ) : isDirect ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold flex items-center gap-1 shadow-sm">
                          <Smartphone className="w-3 h-3" /> Deducted from MoMo/Bank
                        </span>
                      ) : selectedDayTotalCashoutReceived > 0 && !e.isSavings ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                          Deducted from Cashout
                        </span>
                      ) : null}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {e.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`font-bold block ${isTransfer ? 'text-indigo-600 dark:text-indigo-400' : isW ? 'text-amber-700 dark:text-amber-300' : isDirect ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                        {formatUGX(e.totalAmount)}
                      </span>
                      {e.taxAmount > 0 && (
                        <span className="text-[10px] text-amber-500 block">Fee/Tax: {formatUGX(e.taxAmount)}</span>
                      )}
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
