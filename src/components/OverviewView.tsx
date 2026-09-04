import React, { useState } from 'react';
import { Expense, MonthlyBudget, PurposeType, DebtItem, Inflow } from '../types';
import { formatUGX } from '../utils/format';
import { normalizeMonthlySalary } from '../utils/salary';
import { DailyExpenseTracker } from './DailyExpenseTracker';
import {
  calculateCashbookBalances,
  isBankToMobileTransfer,
  isSelfBankToMobileTransfer,
  isThirdPartyTransferExpense,
  isWithdrawalEntry,
  isDirectDigitalEntry,
  isCashOnHandSpending,
  isSavingsEntry,
  getExpenseSourceAccount,
  getExpenseDestinationAccount,
} from '../utils/cashbookHelpers';
import { 
  DollarSign, 
  Receipt, 
  Plus, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  Edit3, 
  Trash2, 
  Landmark, 
  PiggyBank, 
  Banknote, 
  Wallet, 
  Smartphone, 
  CreditCard,
  CheckCircle2,
  ArrowDownLeft,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRightLeft,
  ArrowRight,
  Users
} from 'lucide-react';

interface OverviewViewProps {
  expenses: Expense[];
  inflows?: Inflow[];
  debts?: DebtItem[];
  budget: MonthlyBudget;
  selectedMonth: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenExpenseModal: (mode?: 'spending' | 'transfer' | 'cashout' | 'savings') => void;
  onOpenInflowModal: () => void;
  onEditInflow?: (inflow: Inflow) => void;
  onDeleteInflow?: (inflowId: string) => void;
  onNavigateToTab: (tab: 'expenses' | 'debts' | 'analytics') => void;
  onUpdateBudgetSalary?: (salary: number, savingsTarget: number) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  expenses,
  inflows = [],
  debts,
  budget,
  selectedMonth,
  onEditExpense,
  onDeleteExpense,
  onOpenExpenseModal,
  onOpenInflowModal,
  onEditInflow,
  onDeleteInflow,
  onNavigateToTab,
  onUpdateBudgetSalary,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'inflows' | 'transfers' | 'cashouts' | 'direct_digital' | 'cash_spending' | 'savings'>('all');

  // Month count calculation for all-time view
  const isAllTime = selectedMonth === 'all';
  const recordedMonthsCount = isAllTime
    ? Math.max(1, new Set(expenses.map((e) => (e.date ? e.date.slice(0, 7) : '2026-08'))).size)
    : 1;

  // Master Financial Balances (including tracked Cash Inflows and Debt Repayments)
  const balances = calculateCashbookBalances(expenses, budget, recordedMonthsCount, inflows, debts);

  // Grouped transaction lists
  const bankToMobileEntries = balances.bankToMobileEntries;
  const cashoutEntries = expenses.filter((e) => isWithdrawalEntry(e));
  const directDigitalEntries = expenses.filter((e) => isDirectDigitalEntry(e));
  const cashSpendingEntries = expenses.filter((e) => isCashOnHandSpending(e));
  const savingsEntries = expenses.filter((e) => isSavingsEntry(e));

  const totalTaxIncurred = expenses.reduce((sum, e) => sum + e.taxAmount, 0);
  const targetSavingsValue = (budget?.savingsTarget || 20000) * recordedMonthsCount;
  const savingsPct = targetSavingsValue > 0 ? Math.min(100, Math.round((balances.totalSavings / targetSavingsValue) * 100)) : 0;

  // Tax Deductions for Work
  const workExpenses = expenses.filter((e) => e.purpose === 'work' && !e.isSavings && !isWithdrawalEntry(e) && !isSelfBankToMobileTransfer(e));
  const deductibleTaxes = workExpenses
    .filter((e) => e.isTaxDeductible)
    .reduce((sum, e) => sum + e.taxAmount, 0);

  // Debts & Liabilities calculation
  const debtItems = debts || [];
  const activeBorrowed = debtItems
    .filter((d) => d.type === 'borrowed' && d.status !== 'fully_repaid')
    .reduce((sum, d) => sum + Math.max(0, d.originalAmount - d.repaidAmount), 0);
  const activeLent = debtItems
    .filter((d) => d.type === 'lent' && !d.isGiftOrRemittance && d.status !== 'fully_repaid')
    .reduce((sum, d) => sum + Math.max(0, d.originalAmount - d.repaidAmount), 0);
  const salaryVal = normalizeMonthlySalary(budget?.monthlySalary);
  const dtiRatio = salaryVal > 0 ? (activeBorrowed / salaryVal) * 100 : 0;

  // Filtered expenses list
  let displayedExpenses = expenses;
  if (filterType === 'transfers') {
    displayedExpenses = bankToMobileEntries;
  } else if (filterType === 'cashouts') {
    displayedExpenses = cashoutEntries;
  } else if (filterType === 'direct_digital') {
    displayedExpenses = directDigitalEntries;
  } else if (filterType === 'cash_spending') {
    displayedExpenses = cashSpendingEntries;
  } else if (filterType === 'savings') {
    displayedExpenses = savingsEntries;
  }

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            Cashbook Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of Bank, Mobile Money, Cash Drawer, Inflows, and Savings Target.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenInflowModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>+ Log Inflow</span>
          </button>

          <button
            onClick={() => onOpenExpenseModal('transfer')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 border border-slate-700 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Transfer Funds</span>
          </button>

          <button
            onClick={() => onOpenExpenseModal('spending')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 border border-slate-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Daily Expense & Salary Cashbook Engine */}
      <DailyExpenseTracker
        expenses={expenses}
        inflows={inflows}
        debts={debts}
        budget={budget}
        selectedMonth={selectedMonth}
        onOpenExpenseModal={onOpenExpenseModal}
        onOpenInflowModal={onOpenInflowModal}
        onUpdateBudgetSalary={onUpdateBudgetSalary}
      />

      {/* Inflows & Total Inflow Summary Card */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tracked Cash Inflows (Money In)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {inflows.length} Record(s)
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
              +{formatUGX(balances.totalInflowsLogged)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap font-medium">
              <span>🏦 Bank: <strong className="font-mono text-white">{formatUGX(balances.totalBankInflows)}</strong></span>
              <span>📱 MoMo: <strong className="font-mono text-white">{formatUGX(balances.totalMobileMoneyInflows)}</strong></span>
              <span>💵 Cash: <strong className="font-mono text-white">{formatUGX(balances.totalCashInflows)}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => {
              setFilterType('inflows');
              const el = document.getElementById('cashbook-logs-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700 cursor-pointer"
          >
            View Inflows
          </button>
          <button
            onClick={onOpenInflowModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition active:scale-95 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Log Cash In</span>
          </button>
        </div>
      </div>

      {/* Borrowing Position & Transfers Quick Status Banner */}
      <div
        onClick={() => onNavigateToTab('debts')}
        className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            dtiRatio > 60
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
              : dtiRatio > 30
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Debt Position & Loans
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                dtiRatio > 60
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                  : dtiRatio > 30
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
              }`}>
                {dtiRatio > 60 ? 'HIGH RISK' : dtiRatio > 30 ? 'CAUTION' : 'SAFE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active Debt: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatUGX(activeBorrowed)}</strong> • Lent to Friends: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatUGX(activeLent)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition shrink-0">
          <span>Manage Debts</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* 5 Core Cashbook Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Card 1: Available Money in Bank */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Bank Account</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{formatUGX(balances.availableBankBalance)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Net salary less transfers & cashouts
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Net: {formatUGX(balances.netIncome)}</span>
            <button 
              onClick={() => onOpenExpenseModal('transfer')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
            >
              Transfer <ArrowRightLeft className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Mobile Money Wallet Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Overall Wallet Balance</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{formatUGX(balances.availableMobileMoneyBalance)}</span>
            </div>
            <div className="mt-2 space-y-1 text-xs font-medium border-t border-slate-100 dark:border-slate-800/80 pt-2">
              <div className="flex justify-between items-center text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1 font-semibold">📱 MTN MoMo:</span>
                <span className="font-mono font-bold">{formatUGX(balances.availableMtnBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-700 dark:text-rose-300">
                <span className="flex items-center gap-1 font-semibold">🔴 Airtel Money:</span>
                <span className="font-mono font-bold">{formatUGX(balances.availableAirtelBalance)}</span>
              </div>
              {(balances.mtnWalletShortfall > 0 || balances.airtelWalletShortfall > 0) && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 px-2 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                  Wallet records need an opening/top-up inflow to fully match all-time deductions.
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>MTN + Airtel, including borrowed money received</span>
            <button 
              onClick={() => onOpenExpenseModal('transfer')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
            >
              Transfer <ArrowRightLeft className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Cashouts Taken (Inflow to Drawer) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Cashouts Taken</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{formatUGX(balances.totalCashoutsReceived)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {cashoutEntries.length} cashout withdrawal(s) logged
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Credited to Cash</span>
            <button 
              onClick={() => {
                setFilterType('cashouts');
                const el = document.getElementById('cashbook-logs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              Cashouts
            </button>
          </div>
        </div>

        {/* Card 4: Cash on Hand Drawer Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Cash on Hand
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-mono ${balances.availableCashOnHand >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                {balances.availableCashOnHand >= 0 ? formatUGX(balances.availableCashOnHand) : `-${formatUGX(Math.abs(balances.availableCashOnHand))}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Spent: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatUGX(balances.totalCashSpendings)}</strong>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{balances.availableCashOnHand >= 0 ? 'In pocket drawer' : 'Negative balance'}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{cashSpendingEntries.length} spends</span>
          </div>
        </div>

        {/* Card 5: Total Savings & Progress */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {isAllTime ? 'Total Savings' : 'Savings Goal'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{formatUGX(balances.totalSavings)}</span>
            </div>
            {!isAllTime && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200 dark:border-slate-700/50">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, savingsPct)}%` }}
                />
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isAllTime ? 'Accumulated' : `Target: ${formatUGX(targetSavingsValue)}`}
            </span>
            <button 
              onClick={() => onNavigateToTab('expenses')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
            >
              Savings Log <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4-CHANNEL LIQUIDITY & DEBT REPAYMENT FLOW ENGINE AUDIT TRACE */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-extrabold flex items-center gap-2 text-white">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Multi-Channel Liquidity & Transfer Trace</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live audit breakdown of money movement across Bank, Airtel, MTN, Cash Drawer, and Debt Deductions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenExpenseModal('transfer')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Funds</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* Channel 1: Bank Account */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between font-sans pb-2 border-b border-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-slate-200">
                <Landmark className="w-4 h-4 text-emerald-400" />
                🏦 Bank Account
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Main
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Baseline/Inflows:</span>
                <span className="text-emerald-400 font-bold">+{formatUGX(balances.totalBankInflows)}</span>
              </div>
              {balances.bankDebtRepaymentsReceived > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Debt Recovered In:</span>
                  <span className="text-emerald-400">+{formatUGX(balances.bankDebtRepaymentsReceived)}</span>
                </div>
              )}
              {balances.bankToAirtel > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>➔ Transferred to Airtel:</span>
                  <span>-{formatUGX(balances.bankToAirtel)}</span>
                </div>
              )}
              {balances.bankToMtn > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>➔ Transferred to MTN:</span>
                  <span>-{formatUGX(balances.bankToMtn)}</span>
                </div>
              )}
              {balances.bankDebtRepaymentsPaid > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>➔ Debt Repaid:</span>
                  <span>-{formatUGX(balances.bankDebtRepaymentsPaid)}</span>
                </div>
              )}
              {(balances.directBankSpendings > 0 || balances.atmCashouts > 0) && (
                <div className="flex justify-between text-slate-400">
                  <span>➔ Card & ATM Out:</span>
                  <span>-{formatUGX(balances.directBankSpendings + balances.atmCashouts)}</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans font-semibold">Available Bank:</span>
              <span className="font-bold text-white text-sm">{formatUGX(balances.availableBankBalance)}</span>
            </div>
          </div>

          {/* Channel 2: Airtel Money */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between font-sans pb-2 border-b border-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-rose-300">
                <Smartphone className="w-4 h-4 text-rose-400" />
                🔴 Airtel Money
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                *185#
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              {balances.totalAirtelInflows > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Inflows:</span>
                  <span className="text-emerald-400">+{formatUGX(balances.totalAirtelInflows)}</span>
                </div>
              )}
              {balances.bankToAirtel > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>+ From Bank:</span>
                  <span>+{formatUGX(balances.bankToAirtel)}</span>
                </div>
              )}
              {balances.mtnToAirtelPrincipal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>+ From MTN MoMo:</span>
                  <span>+{formatUGX(balances.mtnToAirtelPrincipal)}</span>
                </div>
              )}
              {balances.airtelToMtnTotalDeducted > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>➔ Transferred to MTN:</span>
                  <span>-{formatUGX(balances.airtelToMtnTotalDeducted)}</span>
                </div>
              )}
              {balances.airtelDebtRepaymentsPaid > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>➔ Debt Repaid:</span>
                  <span>-{formatUGX(balances.airtelDebtRepaymentsPaid)}</span>
                </div>
              )}
              {(balances.airtelSpent > 0 || balances.airtelCashouts > 0) && (
                <div className="flex justify-between text-slate-400">
                  <span>➔ Spends & Cashouts:</span>
                  <span>-{formatUGX(balances.airtelSpent + balances.airtelCashouts)}</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans font-semibold">Available Airtel:</span>
              <span className={`font-bold text-sm ${balances.availableAirtelBalance >= 0 ? 'text-rose-400' : 'text-rose-500'}`}>
                {balances.availableAirtelBalance >= 0 ? formatUGX(balances.availableAirtelBalance) : `-${formatUGX(Math.abs(balances.availableAirtelBalance))}`}
              </span>
            </div>
          </div>

          {/* Channel 3: MTN Mobile Money */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between font-sans pb-2 border-b border-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <Smartphone className="w-4 h-4 text-amber-400" />
                📱 MTN MoMo
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                *165#
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              {balances.totalMtnInflows > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Inflows:</span>
                  <span className="text-emerald-400">+{formatUGX(balances.totalMtnInflows)}</span>
                </div>
              )}
              {balances.bankToMtn > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>+ From Bank:</span>
                  <span>+{formatUGX(balances.bankToMtn)}</span>
                </div>
              )}
              {balances.airtelToMtnPrincipal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>+ From Airtel Money:</span>
                  <span>+{formatUGX(balances.airtelToMtnPrincipal)}</span>
                </div>
              )}
              {balances.mtnToAirtelTotalDeducted > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>➔ Transferred to Airtel:</span>
                  <span>-{formatUGX(balances.mtnToAirtelTotalDeducted)}</span>
                </div>
              )}
              {balances.mtnDebtRepaymentsPaid > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>➔ Debt Repaid:</span>
                  <span>-{formatUGX(balances.mtnDebtRepaymentsPaid)}</span>
                </div>
              )}
              {balances.mtnSavingsDeductions > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Savings Sent:</span>
                  <span>-{formatUGX(balances.mtnSavingsDeductions)}</span>
                </div>
              )}
              {(balances.mtnSpent > 0 || balances.mtnCashouts > 0) && (
                <div className="flex justify-between text-slate-400">
                  <span>➔ Spends & Cashouts:</span>
                  <span>-{formatUGX(balances.mtnSpent + balances.mtnCashouts)}</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans font-semibold">Available MTN:</span>
              <span className={`font-bold text-sm ${balances.availableMtnBalance >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                {balances.availableMtnBalance >= 0 ? formatUGX(balances.availableMtnBalance) : `-${formatUGX(Math.abs(balances.availableMtnBalance))}`}
              </span>
            </div>
          </div>

          {/* Channel 4: Cash on Hand Drawer */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between font-sans pb-2 border-b border-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-slate-200">
                <Banknote className="w-4 h-4 text-emerald-400" />
                💵 Cash on Hand
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                Drawer
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              {balances.totalCashInflows > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Inflows:</span>
                  <span className="text-emerald-400">+{formatUGX(balances.totalCashInflows)}</span>
                </div>
              )}
              {balances.totalCashoutsReceived > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>+ Cashouts Received:</span>
                  <span>+{formatUGX(balances.totalCashoutsReceived)}</span>
                </div>
              )}
              {balances.cashDebtRepaymentsPaid > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>➔ Debt Repaid:</span>
                  <span>-{formatUGX(balances.cashDebtRepaymentsPaid)}</span>
                </div>
              )}
              {balances.totalCashSpendings > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>➔ Cash Spent:</span>
                  <span>-{formatUGX(balances.totalCashSpendings)}</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans font-semibold">Available Cash:</span>
              <span className={`font-bold text-sm ${balances.availableCashOnHand >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {balances.availableCashOnHand >= 0 ? formatUGX(balances.availableCashOnHand) : `-${formatUGX(Math.abs(balances.availableCashOnHand))}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Financial Logs & Cashflow Breakdown */}
      <div id="cashbook-logs-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Financial Transactions & Cashflow Logs (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Title & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  Financial Transactions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track cash inflows, transfers, cashouts, and spending.
                </p>
              </div>

              {/* Filter Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto flex-wrap">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({expenses.length + inflows.length})
                </button>
                <button
                  onClick={() => setFilterType('inflows')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'inflows'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  + Inflows ({inflows.length})
                </button>
                <button
                  onClick={() => setFilterType('transfers')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'transfers'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Transfers ({bankToMobileEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('cashouts')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'cashouts'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cashouts ({cashoutEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('direct_digital')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'direct_digital'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Digital ({directDigitalEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('cash_spending')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'cash_spending'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cash ({cashSpendingEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('savings')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'savings'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Savings ({savingsEntries.length})
                </button>
              </div>
            </div>

            {/* Inflows Dedicated List View */}
            {filterType === 'inflows' ? (
              inflows.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <ArrowDownLeft className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No cash inflows logged for this period.
                  </p>
                  <button
                    onClick={onOpenInflowModal}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-500 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    Log First Inflow
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {inflows.map((inf) => (
                    <div
                      key={inf.id}
                      className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition"
                    >
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">
                        <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-slate-100">
                            {inf.title}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {inf.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            To: {inf.destinationAccount.replace('_', ' ')}
                          </span>
                          {(inf.payerSource || (inf as Record<string, unknown>).sourceName) && (
                            <span>• From: {inf.payerSource || (inf as Record<string, unknown>).sourceName as string}</span>
                          )}
                          <span>•</span>
                          <span className="font-mono">{inf.date}</span>
                          {inf.notes && <span className="italic">• "{inf.notes}"</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono">
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 block">
                            +{formatUGX(inf.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1 ml-1">
                          {onEditInflow && (
                            <button
                              onClick={() => onEditInflow(inf)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition cursor-pointer"
                              title="Edit Inflow"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteInflow && (
                            <button
                              onClick={() => onDeleteInflow(inf.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                              title="Delete Inflow"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : displayedExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Receipt className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {expenses.length > 0
                    ? `No entries matching the "${filterType}" filter.`
                    : 'No transactions recorded for this period.'}
                </p>
                {expenses.length > 0 && filterType !== 'all' ? (
                  <button
                    onClick={() => setFilterType('all')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:underline cursor-pointer"
                  >
                    View All Entries
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {displayedExpenses.slice(0, 10).map((exp) => {
                  const isTransfer = isBankToMobileTransfer(exp);
                  const isSelfTransfer = isSelfBankToMobileTransfer(exp);
                  const isThirdPartyTransfer = isThirdPartyTransferExpense(exp);
                  const isW = isWithdrawalEntry(exp);
                  const isDirect = isDirectDigitalEntry(exp);
                  return (
                    <div
                      key={exp.id}
                      className="group flex items-start gap-3 p-3 rounded-xl border bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      <div className="mt-0.5 p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                        {isThirdPartyTransfer ? <Users className="w-4 h-4" /> : isSelfTransfer ? <ArrowRightLeft className="w-4 h-4" /> : isW ? <Banknote className="w-4 h-4" /> : exp.isSavings ? <PiggyBank className="w-4 h-4" /> : isDirect ? <Smartphone className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-slate-100">
                            {exp.title}
                          </span>

                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {isSelfTransfer ? 'TRANSFER (SELF)' : isThirdPartyTransfer ? 'TRANSFER (EXPENSE)' : isW ? 'CASHOUT' : exp.isSavings ? 'SAVINGS' : exp.category}
                          </span>

                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {exp.purpose}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          {(() => {
                            const srcAcct = getExpenseSourceAccount(exp);
                            const destAcct = getExpenseDestinationAccount(exp);
                            const srcLabel = srcAcct === 'bank_account'
                              ? (exp.sourceBank ? exp.sourceBank.split(' ')[0] : '🏦 Bank')
                              : srcAcct === 'airtel_mobile_money'
                              ? '🔴 Airtel Money'
                              : srcAcct === 'cash_on_hand'
                              ? '💵 Cash'
                              : '📱 MTN MoMo';
                            const destLabel = destAcct === 'bank_account'
                              ? (exp.sourceBank ? exp.sourceBank.split(' ')[0] : '🏦 Bank')
                              : destAcct === 'airtel_mobile_money'
                              ? '🔴 Airtel Money'
                              : '📱 MTN MoMo';

                            if (isThirdPartyTransfer) {
                              return (
                                <span className="font-semibold text-rose-600 dark:text-rose-400">
                                  {srcLabel} ➔ To: {exp.recipientName || 'Third Party'}
                                </span>
                              );
                            }
                            if (isSelfTransfer) {
                              return (
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {srcLabel} ➔ {destLabel}
                                </span>
                              );
                            }
                            return (
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {srcLabel} • {exp.category}
                              </span>
                            );
                          })()}
                          <span>•</span>
                          <span>{exp.paymentMethod}</span>
                          <span>•</span>
                          <span className="font-mono">{exp.date}</span>
                          {exp.taxAmount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 dark:text-slate-400 font-mono">
                                Fee: {formatUGX(exp.taxAmount)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono">
                          <span className={`font-black text-sm block ${
                            isThirdPartyTransfer
                              ? 'text-rose-600 dark:text-rose-400'
                              : isSelfTransfer
                              ? 'text-slate-900 dark:text-white'
                              : isW
                              ? 'text-slate-900 dark:text-white'
                              : exp.isSavings
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {formatUGX(exp.totalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1 ml-1">
                          <button
                            onClick={() => onEditExpense(exp)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Quick transaction logging
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenInflowModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                Log Inflow
              </button>
              <button
                onClick={() => onOpenExpenseModal('transfer')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Transfer
              </button>
              <button
                onClick={() => onOpenExpenseModal('spending')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Log Expense
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cashbook Balance Reconciliation & Flow Engine (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Ledger Flow Statement
              </h2>
              <button
                onClick={() => onNavigateToTab('analytics')}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
              >
                Full Statement <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* 1. Net Income Take-Home */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block font-sans">Net Income Take-Home</span>
                  <span className="text-[10px] text-slate-500 font-sans">Salary less tax</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatUGX(balances.netIncome)}
                </span>
              </div>

              {/* 2. Additional Inflows Tracked */}
              {balances.totalInflowsLogged > 0 && (
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 block font-sans">+ Cash Inflows Recorded</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans">Salary, Client, MoMo, Sales</span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatUGX(balances.totalInflowsLogged)}
                  </span>
                </div>
              )}

              {/* 3. Debt Repayments Collected */}
              {balances.totalDebtRepaymentsReceived > 0 && (
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 block font-sans">+ Loan Collections</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans">Repayments received on loans lent</span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatUGX(balances.totalDebtRepaymentsReceived)}
                  </span>
                </div>
              )}

              {/* 4. Bank Account Balance */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block font-sans">1. Bank Account Balance</span>
                  <span className="text-[10px] text-slate-500 font-sans">After transfers and card spending</span>
                </div>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatUGX(balances.availableBankBalance)}
                </span>
              </div>

              {/* 5. Mobile Money Wallet Pool */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block font-sans">2. Overall Wallet Balance</span>
                    <span className="text-[10px] text-slate-500 font-sans">MTN + Airtel, including borrowed funds received</span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatUGX(balances.availableMobileMoneyBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                  <span className="text-amber-700 dark:text-amber-300 font-bold">MTN: {formatUGX(balances.availableMtnBalance)}</span>
                  <span className="text-rose-700 dark:text-rose-300 font-bold">Airtel: {formatUGX(balances.availableAirtelBalance)}</span>
                </div>
                {balances.mtnBorrowedFundsReceived + balances.airtelBorrowedFundsReceived > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300">
                    <span className="font-semibold">Borrowed into wallets</span>
                    <span className="font-mono font-bold">+{formatUGX(balances.mtnBorrowedFundsReceived + balances.airtelBorrowedFundsReceived)}</span>
                  </div>
                )}
              </div>

              {/* 6. Cash on Hand Drawer */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block font-sans">3. Cash on Hand Drawer</span>
                  <span className="text-[10px] text-slate-500 font-sans">Cashouts minus cash spends</span>
                </div>
                <span className={`font-black text-sm ${balances.availableCashOnHand >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatUGX(balances.availableCashOnHand)}
                </span>
              </div>

              {/* 7. Debt Repayments Paid */}
              {balances.totalDebtRepaymentsPaid > 0 && (
                <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-900/40 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-rose-950 dark:text-rose-200 block font-sans">Less Debt Repayments Paid</span>
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 font-sans">Deducted from accounts</span>
                  </div>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                    -{formatUGX(balances.totalDebtRepaymentsPaid)}
                  </span>
                </div>
              )}

              {/* 8. Combined Total Net Worth */}
              <div className="p-3 bg-slate-900 dark:bg-slate-950 text-white rounded-xl border border-slate-800 flex justify-between items-center shadow-xs">
                <div>
                  <span className="font-bold text-slate-200 block font-sans text-xs uppercase tracking-wider">Total Liquid Net Worth</span>
                  <span className="text-[10px] text-slate-400 font-sans">Bank + MoMo + Cash Drawer</span>
                </div>
                <span className="font-black text-emerald-400 text-base">
                  {formatUGX(balances.totalCombinedNetWorth)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Comprehensive analytics
            </span>
            <button
              onClick={() => onNavigateToTab('analytics')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Reports & Statements
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
