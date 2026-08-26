import React, { useState } from 'react';
import { Expense, MonthlyBudget, PurposeType, DebtItem, Inflow } from '../types';
import { formatUGX } from '../utils/format';
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

  // Master Financial Balances (including tracked Cash Inflows)
  const balances = calculateCashbookBalances(expenses, budget, recordedMonthsCount, inflows);

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
  const salaryVal = budget?.monthlySalary || 500000;
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
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" />
            Cashbook Overview & Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Monitor Bank funds, Bank ➔ Mobile transfers, Cashouts to pocket, and maintain your <strong className="text-emerald-600 dark:text-emerald-400 font-mono">UGX {targetSavingsValue.toLocaleString()}</strong> savings goal.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenInflowModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
            <span>+ Log Inflow</span>
          </button>

          <button
            onClick={() => onOpenExpenseModal('transfer')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Transfer Bank ➔ Mobile</span>
          </button>

          <button
            onClick={() => onOpenExpenseModal('spending')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 border border-slate-700"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Daily Expense & Salary Cashbook Engine */}
      <DailyExpenseTracker
        expenses={expenses}
        inflows={inflows}
        budget={budget}
        selectedMonth={selectedMonth}
        onOpenExpenseModal={onOpenExpenseModal}
        onOpenInflowModal={onOpenInflowModal}
        onUpdateBudgetSalary={onUpdateBudgetSalary}
      />

      {/* Inflows & Total Inflow Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-indigo-950 p-4 sm:p-5 rounded-2xl border border-emerald-500/40 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Tracked Cash Inflows (Money In)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {inflows.length} Record(s) Logged
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
              +{formatUGX(balances.totalInflowsLogged)}
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3 flex-wrap font-medium">
              <span>🏦 Bank Inflow: <strong className="font-mono text-white">{formatUGX(balances.totalBankInflows)}</strong></span>
              <span>📱 MoMo Inflow: <strong className="font-mono text-white">{formatUGX(balances.totalMobileMoneyInflows)}</strong></span>
              <span>💵 Cash Inflow: <strong className="font-mono text-white">{formatUGX(balances.totalCashInflows)}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => {
              setFilterType('inflows');
              const el = document.getElementById('cashbook-logs-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/10"
          >
            View Inflows
          </button>
          <button
            onClick={onOpenInflowModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl transition active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Log Cash In</span>
          </button>
        </div>
      </div>

      {/* Borrowing Position & Transfers Quick Status Banner */}
      <div
        onClick={() => onNavigateToTab('debts')}
        className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            dtiRatio > 60
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              : dtiRatio > 30
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
          }`}>
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Borrowing Position & Friend Transfers
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                dtiRatio > 60
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-300'
                  : dtiRatio > 30
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
              }`}>
                {dtiRatio > 60 ? 'DO NOT BORROW (HIGH RISK)' : dtiRatio > 30 ? 'CAUTION POSITION' : 'SAFE BORROWING CAPACITY'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active Debt: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatUGX(activeBorrowed)}</strong> ({dtiRatio.toFixed(0)}% of salary) • Money Lent to Friends: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatUGX(activeLent)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition shrink-0">
          <span>Manage Debts & Loans</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* 5 Core Cashbook Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        
        {/* Card 1: Available Money in Bank */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Available in Bank</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{formatUGX(balances.availableBankBalance)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Net salary less transfers & ATM cashouts
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Net: {formatUGX(balances.netIncome)}</span>
            <button 
              onClick={() => onOpenExpenseModal('transfer')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              Transfer <ArrowRightLeft className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Bank to Mobile Transfers (Pushed to MoMo) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Bank ➔ Mobile Transfers</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{formatUGX(balances.totalBankToMobileTransferred)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {bankToMobileEntries.length} transfer(s) deducted from Bank
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>MTN: {formatUGX(balances.availableMtnBalance)} | Airtel: {formatUGX(balances.availableAirtelBalance)}</span>
            <button 
              onClick={() => {
                setFilterType('transfers');
                const el = document.getElementById('cashbook-logs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              View Transfers
            </button>
          </div>
        </div>

        {/* Card 3: Cashouts Taken (Inflow to Drawer) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Cashouts Received</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{formatUGX(balances.totalCashoutsReceived)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {cashoutEntries.length} cashout withdrawal(s) logged
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Inflow to Drawer</span>
            <button 
              onClick={() => {
                setFilterType('cashouts');
                const el = document.getElementById('cashbook-logs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              Filter Logs
            </button>
          </div>
        </div>

        {/* Card 4: Cash on Hand Drawer Balance */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
          balances.availableCashOnHand >= 0
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${balances.availableCashOnHand >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
              Cash on Hand Drawer
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-mono ${balances.availableCashOnHand >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                {balances.availableCashOnHand >= 0 ? formatUGX(balances.availableCashOnHand) : `-${formatUGX(Math.abs(balances.availableCashOnHand))}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Spent in cash: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatUGX(balances.totalCashSpendings)}</strong>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{balances.availableCashOnHand >= 0 ? 'In pocket drawer' : 'Exceeded cashout'}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{cashSpendingEntries.length} cash spends</span>
          </div>
        </div>

        {/* Card 5: Total Savings & Progress */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-500/30 dark:border-emerald-800/60 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isAllTime ? 'Total Savings (All Time)' : 'Savings Logged'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{formatUGX(balances.totalSavings)}</span>
            </div>
            {!isAllTime && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden border border-slate-200 dark:border-slate-700/50">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, savingsPct)}%` }}
                />
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isAllTime ? 'Accumulated Net Capital' : `Target: ${formatUGX(targetSavingsValue)}`}
            </span>
            <button 
              onClick={() => onNavigateToTab('expenses')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              Savings Log <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Financial Logs & Cashflow Breakdown */}
      <div id="cashbook-logs-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Financial Transactions & Cashflow Logs (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            {/* Title & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  Financial Transactions & Cashflow Logs
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track cash inflows, Bank transfers, cashouts, direct spendings, and savings.
                </p>
              </div>

              {/* Filter Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto flex-wrap">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({expenses.length + inflows.length})
                </button>
                <button
                  onClick={() => setFilterType('inflows')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'inflows'
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  + Inflows ({inflows.length})
                </button>
                <button
                  onClick={() => setFilterType('transfers')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'transfers'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Transfers ({bankToMobileEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('cashouts')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'cashouts'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cashouts ({cashoutEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('direct_digital')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'direct_digital'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Digital ({directDigitalEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('cash_spending')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'cash_spending'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cash ({cashSpendingEntries.length})
                </button>
                <button
                  onClick={() => setFilterType('savings')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === 'savings'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
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
                  <ArrowDownLeft className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No cash inflows logged yet.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Record money coming into your Bank, Mobile Money, or Cash on hand.
                  </p>
                  <button
                    onClick={onOpenInflowModal}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-400 transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    Log First Inflow
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {inflows.map((inf) => (
                    <div
                      key={inf.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-400 transition"
                    >
                      <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0 font-bold">
                        <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-slate-100">
                            {inf.title}
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                            INFLOW (+)
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            {inf.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            Destination: {inf.destinationAccount}
                          </span>
                          {inf.sourceName && <span>• From: {inf.sourceName}</span>}
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
                          <span className="text-[10px] text-slate-400 block">
                            Credited to {inf.destinationAccount.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-emerald-200 dark:border-emerald-800 pl-1 ml-1">
                          {onEditInflow && (
                            <button
                              onClick={() => onEditInflow(inf)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition"
                              title="Edit Inflow"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteInflow && (
                            <button
                              onClick={() => onDeleteInflow(inf.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
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
                <Receipt className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {expenses.length > 0
                    ? `No entries matching the "${filterType}" filter.`
                    : 'Your cashbook is clean! No transactions recorded yet.'}
                </p>
                {expenses.length > 0 && filterType !== 'all' ? (
                  <button
                    onClick={() => setFilterType('all')}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:underline"
                  >
                    View All Entries
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Click the buttons below to log an inflow, transfer money from bank to mobile, log a cashout, or add an expense.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {displayedExpenses.slice(0, 10).map((exp) => {
                  const isTransfer = isBankToMobileTransfer(exp);
                  const isSelfTransfer = isSelfBankToMobileTransfer(exp);
                  const isThirdPartyTransfer = isThirdPartyTransferExpense(exp);
                  const isW = isWithdrawalEntry(exp);
                  const isDirect = isDirectDigitalEntry(exp);
                  return (
                    <div
                      key={exp.id}
                      className={`group flex items-start gap-3 p-3.5 rounded-xl border transition ${
                        isThirdPartyTransfer
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300'
                          : isSelfTransfer
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/90 dark:border-indigo-900/60 hover:border-indigo-400'
                          : isW
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-300'
                          : exp.isSavings
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-300'
                          : isDirect
                          ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/40 hover:border-indigo-300'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className={`mt-0.5 p-2 rounded-xl border shrink-0 ${
                        isThirdPartyTransfer
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : isSelfTransfer
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : isW
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          : exp.isSavings
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : isDirect
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}>
                        {isThirdPartyTransfer ? <Users className="w-4 h-4" /> : isSelfTransfer ? <ArrowRightLeft className="w-4 h-4" /> : isW ? <Banknote className="w-4 h-4" /> : exp.isSavings ? <PiggyBank className="w-4 h-4" /> : isDirect ? <Smartphone className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-slate-100">
                            {exp.title}
                          </span>

                          {isSelfTransfer ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider shadow-xs">
                              BANK ➔ MOMO (SELF)
                            </span>
                          ) : isThirdPartyTransfer ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider shadow-xs">
                              TRANSFER EXPENSE
                            </span>
                          ) : isW ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider">
                              CASHOUT INFLOW
                            </span>
                          ) : exp.isSavings ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase tracking-wider">
                              SAVINGS DEPOSIT
                            </span>
                          ) : isDirect ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500 text-white uppercase tracking-wider">
                              MOMO / BANK DIRECT
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                              CASH SPEND
                            </span>
                          )}

                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            exp.purpose === 'work'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {exp.purpose}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          {isThirdPartyTransfer ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              Recipient: {exp.recipientName || 'Third Party'} ({exp.recipientMobileNetwork || 'MoMo'})
                            </span>
                          ) : isSelfTransfer && exp.sourceBank ? (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {exp.sourceBank} ➔ {exp.recipientMobileNetwork || 'MoMo Wallet'}
                            </span>
                          ) : (
                            <span className="font-medium">{exp.category}</span>
                          )}
                          <span>•</span>
                          <span>{exp.paymentMethod}</span>
                          <span>•</span>
                          <span className="font-mono">{exp.date}</span>
                          {exp.taxAmount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
                                {isTransfer ? 'Transfer Fee: ' : 'Tax: '}{formatUGX(exp.taxAmount)}
                              </span>
                            </>
                          )}
                          {exp.recipientPhone && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600 dark:text-slate-300">
                                To: {exp.recipientPhone}
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
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : isW
                              ? 'text-amber-600 dark:text-amber-400'
                              : exp.isSavings
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {formatUGX(exp.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {isTransfer ? 'Deducted from Bank' : `Sub: ${formatUGX(exp.amount)}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1 ml-1">
                          <button
                            onClick={() => onEditExpense(exp)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                            title="Edit Transaction"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition"
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
              Record cash inflow, transfer, cashout, or daily expense
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenInflowModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3]" />
                Log Inflow
              </button>
              <button
                onClick={() => onOpenExpenseModal('transfer')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Transfer Bank ➔ Mobile
              </button>
              <button
                onClick={() => onOpenExpenseModal('spending')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Log Entry
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cashbook Balance Reconciliation & Flow Engine (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                Ledger Flow Reconciliation
              </h2>
              <button
                onClick={() => onNavigateToTab('analytics')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Full Statement <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              {/* 1. Net Income Take-Home into Bank */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block font-sans">Net Income Take-Home</span>
                  <span className="text-[10px] text-slate-500 font-sans">Salary less tax (Initial Bank Credit)</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatUGX(balances.netIncome)}
                </span>
              </div>

              {/* 2. Additional Inflows Tracked */}
              {balances.totalInflowsLogged > 0 && (
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 block font-sans">+ Cash Inflows Recorded</span>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-sans">Salary, Client, MoMo, Gift, Sales</span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatUGX(balances.totalInflowsLogged)}
                  </span>
                </div>
              )}

              {/* 3. Less Bank to Mobile Money Transfers */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 block font-sans">Less Bank ➔ Mobile Transfers</span>
                  <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-sans">Deducted from Available Bank Money</span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  -{formatUGX(balances.totalBankToMobileTransferred)}
                </span>
              </div>

              {/* 4. Available in Bank Account */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block font-sans">1. Available in Bank Account</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans">Bank balance after all transfers out</span>
                </div>
                <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                  {formatUGX(balances.availableBankBalance)}
                </span>
              </div>

              {/* 5. Mobile Money Wallet Pool */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/50 flex justify-between items-center">
                <div>
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block font-sans">2. Mobile Money Wallet</span>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-sans">Transfers in + Inflows minus direct bills</span>
                </div>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {formatUGX(balances.availableMobileMoneyBalance)}
                </span>
              </div>

              {/* 6. Cash Inflow into Drawer */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-300 block font-sans">Cashouts + Cash Inflows</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-sans">Available physical cash</span>
                </div>
                <span className="font-black text-amber-700 dark:text-amber-300 text-sm">
                  +{formatUGX(balances.totalCashoutsReceived + balances.totalCashInflows)}
                </span>
              </div>

              {/* 7. Less Cash Spendings */}
              <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-900 dark:text-rose-300 block font-sans">Less Cash Spendings</span>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-sans">Deducted from pocket drawer</span>
                </div>
                <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                  -{formatUGX(balances.totalCashSpendings)}
                </span>
              </div>

              {/* 8. Closing Cash on Hand Drawer */}
              <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 flex justify-between items-center shadow-sm">
                <div>
                  <span className="font-extrabold text-white block font-sans">3. Cash on Hand Drawer</span>
                  <span className="text-[10px] text-slate-400 font-sans">Remaining physical cash in pocket</span>
                </div>
                <span className="font-black text-emerald-400 text-sm">
                  {formatUGX(balances.availableCashOnHand)}
                </span>
              </div>

              {/* 9. Combined Total Net Worth */}
              <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl border border-indigo-800/60 flex justify-between items-center shadow-md">
                <div>
                  <span className="font-extrabold text-indigo-300 block font-sans">Total Liquid Net Worth</span>
                  <span className="text-[10px] text-slate-400 font-sans">Bank + MoMo Wallet + Cash Drawer</span>
                </div>
                <span className="font-black text-emerald-400 text-base">
                  {formatUGX(balances.totalCombinedNetWorth)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              View comprehensive cashflow statements
            </span>
            <button
              onClick={() => onNavigateToTab('analytics')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Monthly Statements
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
