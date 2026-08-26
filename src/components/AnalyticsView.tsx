import React, { useRef } from 'react';
import { Expense, MonthlyBudget, Inflow } from '../types';
import { formatUGX } from '../utils/format';
import {
  calculateCashbookBalances,
  isBankToMobileTransfer,
  isWithdrawalEntry,
  isDirectDigitalEntry,
  isCashOnHandSpending,
  isSavingsEntry,
} from '../utils/cashbookHelpers';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  DollarSign, 
  CheckCircle2, 
  FileCheck, 
  Printer, 
  FileSpreadsheet, 
  Banknote, 
  Wallet, 
  Smartphone, 
  Landmark, 
  PiggyBank,
  ArrowRightLeft,
  ArrowDownLeft
} from 'lucide-react';

interface AnalyticsViewProps {
  expenses: Expense[];
  inflows?: Inflow[];
  budget: MonthlyBudget;
  selectedMonth: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Airtime, Data & Minutes': '#0284c7', // Sky Blue
  'Software & Tools': '#6366f1', // Indigo
  'Office Supplies': '#3b82f6', // Blue
  'Dining & Meals': '#f59e0b', // Amber
  'Travel & Commute': '#8b5cf6', // Purple
  'Client Expenses': '#ec4899', // Pink
  'Groceries': '#10b981', // Emerald
  'Utilities & Bills': '#06b6d4', // Cyan
  'Health & Wellness': '#14b8a6', // Teal
  'Subscriptions': '#f97316', // Orange
  'Shopping & Personal': '#e11d48', // Rose
  'Savings & Investments': '#10b981', // Emerald
  'Bank to Mobile Transfer': '#6366f1', // Indigo
  'Salary Inflow': '#10b981',
  'Cashout Inflow': '#f59e0b',
  'Other': '#64748b', // Slate
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  expenses,
  inflows = [],
  budget,
  selectedMonth,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Scope month count
  const isAllTime = selectedMonth === 'all';
  const recordedMonthsCount = isAllTime
    ? Math.max(1, new Set(expenses.map((e) => (e.date ? e.date.slice(0, 7) : '2026-08'))).size)
    : 1;

  // Master Financial Balances
  const balances = calculateCashbookBalances(expenses, budget, recordedMonthsCount, inflows);

  // Gross Salary, Local Tax & Net Income Baseline
  const grossSalary = (budget?.monthlySalary ?? 500000) * recordedMonthsCount;
  const localTax = (budget?.localTax !== undefined ? budget.localTax : 15000) * recordedMonthsCount;
  const nssfDeduction = (budget?.nssfDeduction !== undefined ? budget.nssfDeduction : 0) * recordedMonthsCount;

  // Cashout breakdown
  const cashoutEntries = expenses.filter((e) => isWithdrawalEntry(e));
  const momoCashouts = cashoutEntries
    .filter((e) => e.paymentMethod === 'Mobile Money Cashout' || e.paymentMethod === 'Mobile Money Withdrawal' || (e.title && e.title.toLowerCase().includes('momo')))
    .reduce((sum, e) => sum + e.amount, 0);

  const cardCashouts = cashoutEntries
    .filter((e) => e.paymentMethod === 'Debit Card / ATM Cashout' || (e.title && (e.title.toLowerCase().includes('card') || e.title.toLowerCase().includes('debit'))))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCashoutTaxes = cashoutEntries.reduce((sum, e) => sum + (e.taxAmount || 0), 0);

  const targetSavingsValue = (budget?.savingsTarget || 20000) * recordedMonthsCount;

  // Tax Deductibles for URA
  const workExpenses = expenses.filter((e) => e.purpose === 'work' && !e.isSavings && !isWithdrawalEntry(e) && !isBankToMobileTransfer(e));
  const personalExpenses = expenses.filter((e) => e.purpose === 'personal' && !e.isSavings && !isWithdrawalEntry(e) && !isBankToMobileTransfer(e));

  const workSpend = workExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const personalSpend = personalExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  const deductibleTax = workExpenses
    .filter((e) => e.isTaxDeductible)
    .reduce((sum, e) => sum + e.taxAmount, 0);
  const totalTaxesPaid = expenses.reduce((sum, e) => sum + e.taxAmount, 0);

  // Category Breakdown Data (excluding cashouts, transfers and pure savings)
  const categoryMap: Record<string, number> = {};
  const allSpendingEntries = expenses.filter((e) => !isWithdrawalEntry(e) && !isBankToMobileTransfer(e) && !e.isSavings && e.category !== 'Savings & Investments');
  allSpendingEntries.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.totalAmount;
  });

  const categoryPieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }));

  // Cashbook Flow Comparison Data
  const cashbookFlowData = [
    { name: 'Net Salary', Amount: balances.netIncome, fill: '#10b981' },
    ...(balances.totalInflowsLogged > 0 ? [{ name: 'Inflows', Amount: balances.totalInflowsLogged, fill: '#059669' }] : []),
    { name: 'Bank ➔ MoMo', Amount: balances.totalBankToMobileTransferred, fill: '#6366f1' },
    { name: 'Bank Balance', Amount: balances.availableBankBalance, fill: '#047857' },
    { name: 'MoMo Wallet', Amount: balances.availableMobileMoneyBalance, fill: '#0284c7' },
    { name: 'Cashouts', Amount: balances.totalCashoutsReceived, fill: '#f59e0b' },
    { name: 'Cash Drawer', Amount: Math.max(0, balances.availableCashOnHand), fill: '#06b6d4' },
    { name: 'Total Savings', Amount: balances.totalSavings, fill: '#8b5cf6' },
  ];

  // Purpose distribution data
  const purposeData = [
    { name: 'Work / Business Spending', amount: workSpend, fill: '#6366f1' },
    { name: 'Personal & Lifestyle', amount: personalSpend, fill: '#10b981' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/30 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Monthly Cashbook & Fiscal Audit
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Monthly Cashbook Report & Statements
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            End-of-month financial reconciliation for <strong>{selectedMonth === 'all' ? 'All Months (All-Time)' : selectedMonth}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-extrabold rounded-xl transition shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print / Save Monthly Report
          </button>
        </div>
      </div>

      {/* Main End-of-Month Cashbook Statement Card */}
      <div ref={reportRef} className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Official Monthly Cashbook Statement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Period: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedMonth === 'all' ? 'Consolidated All-Time' : selectedMonth}</span> • Currency: Uganda Shillings (UGX)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              ✓ Cashbook Reconciled
            </span>
          </div>
        </div>

        {/* 4 Core Summary KPI Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Available Money in Bank (Deducted by transfers) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                1. Available in Bank
              </span>
              <Landmark className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {formatUGX(balances.availableBankBalance)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Net {formatUGX(balances.netIncome)} less {formatUGX(balances.totalBankToMobileTransferred)} transferred
            </div>
          </div>

          {/* Card 2: Mobile Money Wallet */}
          <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">
                2. Mobile Money Wallet
              </span>
              <Smartphone className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {formatUGX(balances.availableMobileMoneyBalance)}
            </div>
            <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-1">
              +{formatUGX(balances.totalBankToMobileReceivedInMoMo)} received from Bank
            </div>
          </div>

          {/* Card 3: Cashouts Inflow */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                3. Cashouts to Pocket
              </span>
              <Banknote className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-900 dark:text-amber-300 mt-1">
              {formatUGX(balances.totalCashoutsReceived)}
            </div>
            <div className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-1 flex gap-2">
              <span>📱 MoMo: {formatUGX(momoCashouts)}</span>
              <span>💳 Card: {formatUGX(cardCashouts)}</span>
            </div>
          </div>

          {/* Card 4: Closing Cash on Hand */}
          <div className={`p-4 rounded-xl border ${
            balances.availableCashOnHand >= 0
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                4. Cash on Hand Drawer
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold font-mono mt-1">
              {balances.availableCashOnHand >= 0 ? formatUGX(balances.availableCashOnHand) : `Deficit -${formatUGX(Math.abs(balances.availableCashOnHand))}`}
            </div>
            <div className="text-[11px] mt-1 opacity-80">
              {balances.availableCashOnHand >= 0 ? 'Remaining in pocket drawer' : 'Spending exceeded cashouts'}
            </div>
          </div>

        </div>

        {/* Financial Flow Rules & Summary Table */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            End-of-Month Cashbook Ledger Reconciliation
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-3 font-semibold">Ledger Item</th>
                  <th className="py-2 px-3 font-semibold">Accounting Rule</th>
                  <th className="py-2 px-3 font-semibold text-right">Amount (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">Gross Monthly Salary</td>
                  <td className="py-2 px-3 text-slate-500">Base earnings before deductions</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{formatUGX(grossSalary)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-rose-500">Less Local Tax Deduction</td>
                  <td className="py-2 px-3 text-slate-500">Local tax statutory deduction</td>
                  <td className="py-2 px-3 text-right text-rose-500">-{formatUGX(localTax)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">NSSF Deduction</td>
                  <td className="py-2 px-3 text-slate-500">Current status: No NSSF deduction</td>
                  <td className="py-2 px-3 text-right text-slate-400">UGX 0</td>
                </tr>
                <tr className="bg-slate-100/60 dark:bg-slate-800/80 font-bold">
                  <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">Net Take-Home Income (Bank Inflow)</td>
                  <td className="py-2 px-3 text-slate-500">Gross less local tax (Credited to Bank Account)</td>
                  <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatUGX(balances.netIncome)}</td>
                </tr>
                {balances.totalInflowsLogged > 0 && (
                  <tr className="bg-emerald-50/60 dark:bg-emerald-950/30 font-bold">
                    <td className="py-2 px-3 text-emerald-700 dark:text-emerald-300">+ Tracked Cash Inflows (Money In)</td>
                    <td className="py-2 px-3 text-slate-500">Credited directly to Bank, MoMo, or Cash Drawer</td>
                    <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-300">+{formatUGX(balances.totalInflowsLogged)}</td>
                  </tr>
                )}
                <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold">
                  <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">Less Bank ➔ Mobile Transfers</td>
                  <td className="py-2 px-3 text-slate-500">Deducted from Bank Account → Credited into Mobile Money Wallet</td>
                  <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400">-{formatUGX(balances.totalBankToMobileTransferred)}</td>
                </tr>
                <tr className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40">
                  <td className="py-2 px-3 font-bold text-emerald-700 dark:text-emerald-300">Available in Bank Account</td>
                  <td className="py-2 px-3 text-slate-500">Net salary remaining in Bank after transfers & direct card debits</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300">{formatUGX(balances.availableBankBalance)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 font-medium">Mobile Money Received from Bank</td>
                  <td className="py-2 px-3 text-slate-500">Credited into MoMo (Airtime, Data, Bills pool)</td>
                  <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400">+{formatUGX(balances.totalBankToMobileReceivedInMoMo)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">Less Airtime, Data, Minutes & Direct Bills</td>
                  <td className="py-2 px-3 text-slate-500">Deducted directly from Mobile Money / Bank</td>
                  <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400">-{formatUGX(balances.momoDirectSpendings)}</td>
                </tr>
                <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                  <td className="py-2 px-3 font-bold text-amber-900 dark:text-amber-300">Cash Received from Cashouts</td>
                  <td className="py-2 px-3 text-slate-500">Inflow available in pocket cash drawer</td>
                  <td className="py-2 px-3 text-right font-bold text-amber-900 dark:text-amber-300">+{formatUGX(balances.totalCashoutsReceived)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Less Cash Spendings Made</td>
                  <td className="py-2 px-3 text-slate-500">Deducted directly from Cashout, NOT bank money</td>
                  <td className="py-2 px-3 text-right text-rose-600 dark:text-rose-400">-{formatUGX(balances.totalCashSpendings)}</td>
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-200">
                  <td className="py-2.5 px-3">Ending Cash on Hand Drawer Balance</td>
                  <td className="py-2.5 px-3">Unspent cash remaining in pocket</td>
                  <td className="py-2.5 px-3 text-right">{formatUGX(balances.availableCashOnHand)}</td>
                </tr>
                <tr className="bg-emerald-100/50 dark:bg-emerald-900/30 font-bold text-emerald-800 dark:text-emerald-300">
                  <td className="py-2.5 px-3">Total Monthly Savings (Net of Tax Involved)</td>
                  <td className="py-2.5 px-3">Savings Target: {formatUGX(targetSavingsValue)}</td>
                  <td className="py-2.5 px-3 text-right">{formatUGX(balances.totalSavings)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Pacing Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Cashbook Flow Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-500" />
              Cashbook Flow Stages (Salary vs Transfers vs MoMo vs Cashout vs Drawer)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashbookFlowData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: any) => formatUGX(val)}
                />
                <Bar dataKey="Amount" radius={[6, 6, 0, 0]}>
                  {cashbookFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expense Breakdown by Category */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-500" />
              Spending Distribution by Category
            </h3>
          </div>
          {categoryPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No spending logged for this month.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => formatUGX(val)}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Work vs Personal Purpose Allocation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              Expenditure Purpose: Work vs Personal
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purposeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: any) => formatUGX(val)}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Tax Deductibles & Fiscal Compliance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              Taxes Incurred & Deductible Audit
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Eligible Work Tax Deductibles</span>
                <span className="text-[10px] text-slate-500">Business expenses claimable for URA tax relief</span>
              </div>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                {formatUGX(deductibleTax)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Cashout Taxes (Mobile Money Excise)</span>
                <span className="text-[10px] text-slate-500">0.5% Excise tax on mobile withdrawals</span>
              </div>
              <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                {formatUGX(totalCashoutTaxes)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Total Taxes & Transfer Fees Incurred</span>
                <span className="text-[10px] text-slate-500">Sum of VAT, WHT, Transfer Fees, and Mobile Money taxes</span>
              </div>
              <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                {formatUGX(totalTaxesPaid)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
