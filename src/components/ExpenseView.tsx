import React, { useState } from 'react';
import { AccountType, Expense, ExpenseCategory, PaymentMethod, PurposeType } from '../types';
import { formatUGX } from '../utils/format';
import {
  isBankToMobileTransfer,
  isSelfBankToMobileTransfer,
  isThirdPartyTransferExpense,
  isWithdrawalEntry,
  getExpenseSourceAccount,
  getExpenseDestinationAccount,
} from '../utils/cashbookHelpers';
import { 
  Receipt, 
  Plus, 
  Search, 
  DollarSign, 
  Briefcase, 
  User, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  FileCheck,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Smartphone,
  Landmark,
  Wallet,
  PiggyBank,
  Banknote,
  ArrowRightLeft,
  Users
} from 'lucide-react';

interface ExpenseViewProps {
  expenses: Expense[];
  onAddExpense: () => void;
  onOpenTransferModal?: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  expenses,
  onAddExpense,
  onOpenTransferModal,
  onEditExpense,
  onDeleteExpense,
}) => {
  const accountLabel = (account?: AccountType) => ({
    bank_account: 'Bank Account',
    mtn_mobile_money: 'MTN Mobile Money',
    airtel_mobile_money: 'Airtel Money',
    mobile_money: 'Mobile Money',
    cash_on_hand: 'Cash on Hand',
  }[account || 'cash_on_hand']);
  const [purposeFilter, setPurposeFilter] = useState<'all' | PurposeType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [taxDeductibleOnly, setTaxDeductibleOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (purposeFilter !== 'all' && exp.purpose !== purposeFilter) return false;
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
    if (taxDeductibleOnly && !exp.isTaxDeductible) return false;
    if (dateFilter && exp.date !== dateFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q);
      const matchVendor = exp.vendor?.toLowerCase().includes(q);
      const matchCat = exp.category.toLowerCase().includes(q);
      const matchNotes = exp.notes?.toLowerCase().includes(q);
      const matchBank = exp.sourceBank?.toLowerCase().includes(q);
      const matchNetwork = exp.recipientMobileNetwork?.toLowerCase().includes(q);
      const matchPhone = exp.recipientPhone?.toLowerCase().includes(q);
      const matchRecipient = exp.recipientName?.toLowerCase().includes(q);
      if (!matchTitle && !matchVendor && !matchCat && !matchNotes && !matchBank && !matchNetwork && !matchPhone && !matchRecipient) return false;
    }
    return true;
  });

  // Calculate stats
  const totalSpend = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalTaxIncurred = expenses.reduce((sum, e) => sum + e.taxAmount, 0);

  const totalTransferred = expenses
    .filter((e) => isSelfBankToMobileTransfer(e))
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const totalSavings = expenses
    .filter((e) => e.isSavings || e.category === 'Savings & Investments')
    .reduce((sum, e) => sum + Math.max(0, e.amount - (e.taxAmount || 0)), 0);

  const workExpenses = expenses.filter((e) => e.purpose === 'work' && !isSelfBankToMobileTransfer(e));
  const personalExpenses = expenses.filter((e) => e.purpose === 'personal' && !isSelfBankToMobileTransfer(e));
  
  const workTotal = workExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const personalTotal = personalExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const deductibleTaxes = workExpenses
    .filter((e) => e.isTaxDeductible)
    .reduce((sum, e) => sum + e.taxAmount, 0);

  const categoriesList: ExpenseCategory[] = [
    'Bank to Mobile Transfer',
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
    'Savings & Investments',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-500" />
            Cashbook Ledger & Transactions
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Track daily spendings, bank-to-mobile transfers, vendor records, payment methods, and taxes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenTransferModal && (
            <button
              onClick={onOpenTransferModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-95 border border-slate-700 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Funds
            </button>
          )}

          <button
            onClick={onAddExpense}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Activity</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatUGX(totalSpend)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {expenses.length} entries logged
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" /> Transfers
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatUGX(totalTransferred)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Transferred liquidity
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <PiggyBank className="w-3.5 h-3.5 text-emerald-500" /> Savings Logged
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatUGX(totalSavings)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Deposited to savings
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fees & Taxes</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatUGX(totalTaxIncurred)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Incurred transfer/tax fees
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Work Deductible</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatUGX(deductibleTaxes)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Tax write-off
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Purpose Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setPurposeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                purposeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Entries ({expenses.length})
            </button>
            <button
              onClick={() => setPurposeFilter('work')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                purposeFilter === 'work'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Work Purpose ({formatUGX(workTotal)})
            </button>
            <button
              onClick={() => setPurposeFilter('personal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                purposeFilter === 'personal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Personal Purpose ({formatUGX(personalTotal)})
            </button>
          </div>

          {/* Tax Deductible Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={taxDeductibleOnly}
              onChange={(e) => setTaxDeductibleOnly(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <FileCheck className="w-4 h-4 text-emerald-500" />
            Tax-Deductible Work Expenses Only
          </label>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search transaction title, bank, mobile network, vendor or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Category: All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter transactions by date"
              className="w-full py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Expense Table / Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No ledger entries found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log your daily spending, bank-to-mobile transfers, or cash withdrawals.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {onOpenTransferModal && (
              <button
                onClick={onOpenTransferModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-xl shadow-sm hover:bg-indigo-500"
              >
                Transfer Bank ➔ MoMo
              </button>
            )}
            <button
              onClick={onAddExpense}
              className="px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-sm hover:bg-emerald-500"
            >
              Log New Transaction
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Transaction & Entity</th>
                  <th className="py-3 px-4">Type / Purpose</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Channel / Date</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Fee / Tax</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Title & Entity */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {exp.title}
                      </div>
                      {(() => {
                        const srcAcct = getExpenseSourceAccount(exp);
                        const destAcct = getExpenseDestinationAccount(exp);
                        const srcLabel = srcAcct === 'bank_account'
                          ? (exp.sourceBank ? exp.sourceBank.split(' ')[0] : 'Bank')
                          : srcAcct === 'airtel_mobile_money'
                          ? 'Airtel Money'
                          : srcAcct === 'cash_on_hand'
                          ? 'Cash on Hand'
                          : 'MTN MoMo';
                        const destLabel = destAcct === 'bank_account'
                          ? (exp.sourceBank ? exp.sourceBank.split(' ')[0] : 'Bank')
                          : destAcct === 'airtel_mobile_money'
                          ? 'Airtel Money'
                          : 'MTN MoMo';

                        if (isThirdPartyTransferExpense(exp)) {
                          return (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              <span>{srcLabel} ➔ To: {exp.recipientName || 'Third Party'}</span>
                              {exp.recipientPhone && (
                                <span className="text-slate-400 font-normal">({exp.recipientPhone})</span>
                              )}
                            </div>
                          );
                        }
                        if (isSelfBankToMobileTransfer(exp)) {
                          return (
                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 mt-0.5">
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>{srcLabel} ➔ {destLabel}</span>
                              {exp.recipientPhone && (
                                <span className="text-slate-400 font-normal">({exp.recipientPhone})</span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {exp.vendor && !isBankToMobileTransfer(exp) && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {exp.vendor}
                        </div>
                      )}
                      {exp.referenceNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {exp.referenceNumber}
                        </div>
                      )}
                      {exp.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                          "{exp.notes}"
                        </div>
                      )}
                    </td>

                    {/* Purpose / Type */}
                    <td className="py-3.5 px-4">
                      {isSelfBankToMobileTransfer(exp) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-500 text-white shadow-sm">
                          <ArrowRightLeft className="w-2.5 h-2.5" /> Transfer (Self)
                        </span>
                      ) : isThirdPartyTransferExpense(exp) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-500 text-white shadow-sm">
                          <Users className="w-2.5 h-2.5" /> Transfer Expense
                        </span>
                      ) : exp.isSavings || exp.category === 'Savings & Investments' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500 text-white shadow-sm">
                          <PiggyBank className="w-2.5 h-2.5" /> Savings Sent
                        </span>
                      ) : isWithdrawalEntry(exp) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-500 text-slate-950 shadow-sm">
                          <Banknote className="w-2.5 h-2.5" /> Cash Withdrawal
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            exp.purpose === 'work'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {exp.purpose === 'work' ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {exp.purpose}
                        </span>
                      )}
                      {exp.isTaxDeductible && !exp.isSavings && !isWithdrawalEntry(exp) && !isSelfBankToMobileTransfer(exp) && (
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                          <FileCheck className="w-3 h-3" /> Tax Deductible
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-1 rounded-md font-medium ${
                        isSelfBankToMobileTransfer(exp)
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                          : isThirdPartyTransferExpense(exp)
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold'
                          : exp.isSavings || exp.category === 'Savings & Investments'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {exp.category}
                      </span>
                    </td>

                    {/* Payment Method / Channel */}
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        {isBankToMobileTransfer(exp) ? (
                          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        ) : exp.paymentMethod.includes('Mobile Money') ? (
                          <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : exp.paymentMethod.includes('Equity') || exp.paymentMethod.includes('Bank') ? (
                          <Landmark className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        ) : exp.paymentMethod.includes('Agent') ? (
                          <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[140px]">{exp.paymentMethod}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {exp.date}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Deducted from: {isSelfBankToMobileTransfer(exp)
                          ? accountLabel(exp.sourceAccount || 'bank_account')
                          : accountLabel(exp.deductionSource)}
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {formatUGX(exp.amount)}
                    </td>

                    {/* Tax Incurred / Transfer Fee */}
                    <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400 font-mono text-xs">
                      {formatUGX(exp.taxAmount)}
                      {isBankToMobileTransfer(exp) ? (
                        <span className="text-[10px] text-slate-400 ml-1 font-sans">(Bank Fee)</span>
                      ) : exp.taxRate !== undefined && (
                        <span className="text-[10px] text-slate-400 ml-1 font-sans">({exp.taxRate}%)</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-bold text-xs text-slate-900 dark:text-white font-mono">
                      {formatUGX(exp.totalAmount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit Transaction"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
