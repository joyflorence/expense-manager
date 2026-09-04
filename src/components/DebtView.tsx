import React, { useState } from 'react';
import { AccountType, DebtItem, DebtStatus, MonthlyBudget } from '../types';
import { formatUGX } from '../utils/format';
import { DEFAULT_MONTHLY_SALARY, normalizeMonthlySalary } from '../utils/salary';
import {
  Landmark,
  HeartHandshake,
  Plus,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Gift,
  UserCheck,
  Edit3,
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Ban,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Smartphone,
  Zap
} from 'lucide-react';

interface DebtViewProps {
  debts: DebtItem[];
  monthlySalary?: number;
  onOpenDebtModal: () => void;
  onEditDebt: (debt: DebtItem) => void;
  onDeleteDebt: (debtId: string) => void;
  onOpenRepaymentModal: (debt: DebtItem) => void;
  onToggleFullyRepaid: (debtId: string) => void;
  onRefresh?: () => void;
}

export const DebtView: React.FC<DebtViewProps> = ({
  debts,
  monthlySalary = DEFAULT_MONTHLY_SALARY,
  onOpenDebtModal,
  onEditDebt,
  onDeleteDebt,
  onOpenRepaymentModal,
  onToggleFullyRepaid,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'borrowed' | 'lent' | 'gifts'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'repaid'>('all');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRepaymentsId, setExpandedRepaymentsId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const accountLabel = (account: AccountType = 'mtn_mobile_money') => ({
    bank_account: 'Bank Account',
    mtn_mobile_money: 'MTN MoMo Wallet',
    airtel_mobile_money: 'Airtel Money Wallet',
    cash_on_hand: 'Cash on Hand',
    mobile_money: 'Mobile Money Wallet',
  }[account] || 'MTN MoMo Wallet');

  // Calculate Metrics
  const borrowedDebts = debts.filter((d) => d.type === 'borrowed');
  const lentDebts = debts.filter((d) => d.type === 'lent');

  // Total active liabilities (Money I Owe remaining)
  const totalBorrowedActive = borrowedDebts
    .filter((d) => d.status !== 'fully_repaid' && d.status !== 'forgiven_gift')
    .reduce((sum, d) => sum + Math.max(0, d.originalAmount - d.repaidAmount), 0);

  // Total active receivables (Money lent to friends/relatives that is expected back)
  const totalLentActive = lentDebts
    .filter((d) => d.status !== 'fully_repaid' && d.status !== 'forgiven_gift' && !d.isGiftOrRemittance)
    .reduce((sum, d) => sum + Math.max(0, d.originalAmount - d.repaidAmount), 0);

  // Total money sent as family support / non-refundable gifts
  const totalGiftsSent = debts
    .filter((d) => d.isGiftOrRemittance || d.status === 'forgiven_gift')
    .reduce((sum, d) => sum + d.originalAmount, 0);

  // Check overdue debts
  const overdueBorrowedCount = borrowedDebts.filter(
    (d) => d.status !== 'fully_repaid' && d.dueDate && d.dueDate < todayStr
  ).length;

  // Calculate Debt-to-Salary Ratio (%)
  const effectiveMonthlySalary = normalizeMonthlySalary(monthlySalary);
  const debtToSalaryRatio = effectiveMonthlySalary > 0 ? (totalBorrowedActive / effectiveMonthlySalary) * 100 : 0;

  // Determine Borrowing Position & Recommendation
  let borrowingStatus: 'safe' | 'caution' | 'critical' = 'safe';
  let borrowingTitle = 'SAFE BORROWING CAPACITY';
  let borrowingAdvice = 'Your debt position is low. You have capacity to borrow if needed, but maintain disciplined repayments.';

  if (overdueBorrowedCount > 0 || debtToSalaryRatio > 60) {
    borrowingStatus = 'critical';
    borrowingTitle = 'CRITICAL WARNING: DO NOT BORROW RIGHT NOW!';
    borrowingAdvice = `You currently hold high debt burdens (${debtToSalaryRatio.toFixed(0)}% of monthly salary) or overdue liabilities. We strongly advise HALTING all new borrowing until existing debts are cleared.`;
  } else if (debtToSalaryRatio > 30) {
    borrowingStatus = 'caution';
    borrowingTitle = 'MODERATE BORROWING POSITION (CAUTION)';
    borrowingAdvice = `Your active debts represent ${debtToSalaryRatio.toFixed(0)}% of your monthly salary. Avoid taking on non-essential new borrowings.`;
  }

  // Calculate Multi-Channel Repayments Deduction Breakdown
  const repaymentsChannelBreakdown = debts.reduce(
    (acc, d) => {
      if (d.type === 'borrowed') {
        for (const rep of d.repayments || []) {
          const amt = Number(rep.amount) || 0;
          const acct = rep.account || (
            rep.paymentMethod?.toLowerCase().includes('airtel') ? 'airtel_mobile_money'
            : rep.paymentMethod?.toLowerCase().includes('bank') ? 'bank_account'
            : rep.paymentMethod?.toLowerCase().includes('cash') ? 'cash_on_hand'
            : 'mtn_mobile_money'
          );
          if (acct === 'bank_account') acc.bank += amt;
          else if (acct === 'airtel_mobile_money') acc.airtel += amt;
          else if (acct === 'cash_on_hand') acc.cash += amt;
          else acc.mtn += amt;
          acc.total += amt;
        }
      }
      return acc;
    },
    { bank: 0, airtel: 0, mtn: 0, cash: 0, total: 0 }
  );

  // Filtered Debts List
  const filteredDebts = debts.filter((debt) => {
    // Type Filter
    if (filterType === 'borrowed' && debt.type !== 'borrowed') return false;
    if (filterType === 'lent' && (debt.type !== 'lent' || debt.isGiftOrRemittance)) return false;
    if (filterType === 'gifts' && !debt.isGiftOrRemittance && debt.status !== 'forgiven_gift') return false;

    // Status Filter
    const isOverdue = debt.status !== 'fully_repaid' && debt.dueDate && debt.dueDate < todayStr;
    if (statusFilter === 'active' && debt.status === 'fully_repaid') return false;
    if (statusFilter === 'overdue' && !isOverdue) return false;
    if (statusFilter === 'repaid' && debt.status !== 'fully_repaid') return false;

    // Relationship Filter
    if (relationshipFilter !== 'all' && debt.relationship !== relationshipFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = debt.title.toLowerCase().includes(q);
      const matchName = debt.counterpartyName.toLowerCase().includes(q);
      const matchNotes = (debt.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchName && !matchNotes) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-amber-500" />
            Debts, Borrowing Position & Transfers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track borrowings, monitor when NOT to borrow, and keep records of money sent to friends & family
          </p>
        </div>

        <button
          onClick={onOpenDebtModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition rounded-xl shadow-xs active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Debt / Loan</span>
        </button>
      </div>

      {/* Borrowing Position & Safety Indicator Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 border ${
              borrowingStatus === 'critical'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : borrowingStatus === 'caution'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}>
              {borrowingStatus === 'critical' ? (
                <Ban className="w-6 h-6 text-rose-400" />
              ) : borrowingStatus === 'caution' ? (
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  borrowingStatus === 'critical'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : borrowingStatus === 'caution'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                }`}>
                  {borrowingTitle}
                </span>

                <span className="text-xs font-medium text-slate-400">
                  DTI: <strong className="text-slate-200 font-mono">{debtToSalaryRatio.toFixed(1)}%</strong> of Monthly Salary ({formatUGX(effectiveMonthlySalary)})
                </span>
              </div>

              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                {borrowingAdvice}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shrink-0 flex items-center justify-around md:justify-end gap-4 text-center md:text-right">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Active Debt
              </span>
              <span className="text-base font-black text-rose-400 font-mono">
                {formatUGX(totalBorrowedActive)}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Overdue Loans
              </span>
              <span className={`text-base font-black font-mono ${overdueBorrowedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {overdueBorrowedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active Debt Liabilities (I Owe) */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Liabilities (I Owe)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatUGX(totalBorrowedActive)}
          </div>
          <p className="text-[10px] text-slate-400">
            {borrowedDebts.length} active borrowing entries
          </p>
        </div>

        {/* Money Lent Out to Friends/Relatives */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Money Lent (Receivable)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatUGX(totalLentActive)}
          </div>
          <p className="text-[10px] text-slate-400">
            {lentDebts.filter((d) => !d.isGiftOrRemittance).length} loans expected back
          </p>
        </div>

        {/* Net Debt Balance */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Net Borrowing Position</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-lg sm:text-xl font-black font-mono ${totalLentActive - totalBorrowedActive >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatUGX(totalLentActive - totalBorrowedActive)}
          </div>
          <p className="text-[10px] text-slate-400">
            Receivables minus Liabilities
          </p>
        </div>

        {/* Family Support & Gifts Sent */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Family Support / Gifts</span>
            <Gift className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {formatUGX(totalGiftsSent)}
          </div>
          <p className="text-[10px] text-slate-400">
            Non-refundable family support
          </p>
        </div>
      </div>

      {/* Multi-Channel Debt Repayment Deductions Strip */}
      {repaymentsChannelBreakdown.total > 0 && (
        <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-2xl border border-slate-800 text-white space-y-2">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 font-sans">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Debt Repayments Deduction Audit (Where Money Left)</span>
            </span>
            <span className="font-mono font-bold text-emerald-400">
              Total Repaid: {formatUGX(repaymentsChannelBreakdown.total)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-800/70 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">🏦 From Bank</span>
              <span className="font-bold text-slate-200 block mt-0.5">{formatUGX(repaymentsChannelBreakdown.bank)}</span>
            </div>
            <div className="p-2 bg-slate-800/70 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-rose-400 uppercase block font-sans">🔴 From Airtel Money</span>
              <span className="font-bold text-rose-300 block mt-0.5">{formatUGX(repaymentsChannelBreakdown.airtel)}</span>
            </div>
            <div className="p-2 bg-slate-800/70 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-amber-400 uppercase block font-sans">📱 From MTN MoMo</span>
              <span className="font-bold text-amber-300 block mt-0.5">{formatUGX(repaymentsChannelBreakdown.mtn)}</span>
            </div>
            <div className="p-2 bg-slate-800/70 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-emerald-400 uppercase block font-sans">💵 From Cash Drawer</span>
              <span className="font-bold text-emerald-300 block mt-0.5">{formatUGX(repaymentsChannelBreakdown.cash)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Entries ({debts.length})
            </button>
            <button
              onClick={() => setFilterType('borrowed')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'borrowed'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              I Owe (Borrowings)
            </button>
            <button
              onClick={() => setFilterType('lent')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'lent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Lent to Friends
            </button>
            <button
              onClick={() => setFilterType('gifts')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'gifts'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              Family Support
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search debtor or bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
            Filters:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Pending Balance)</option>
            <option value="overdue">Overdue Only</option>
            <option value="repaid">Fully Repaid / Settled</option>
          </select>

          <select
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Providers / Relationships</option>
            <option value="mobile_money">📱 Mobile Money & Telcos (MTN, Airtel)</option>
            <option value="friend">Friends</option>
            <option value="relative">Relatives / Family</option>
            <option value="bank_financial">Banks / Financial Institutions</option>
            <option value="colleague">Workmates</option>
            <option value="business">Business Partners</option>
          </select>
        </div>
      </div>

      {/* Debts & Loans List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No debt or transfer records found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Record borrowings, bank loans, or transfers sent to relatives to keep your fiscal ledger updated.
            </p>
            <button
              onClick={onOpenDebtModal}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-500 transition shadow-md"
            >
              Add First Entry
            </button>
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const isFullyRepaid = debt.status === 'fully_repaid' || debt.repaidAmount >= debt.originalAmount;
            const isGift = debt.isGiftOrRemittance || debt.status === 'forgiven_gift';
            const remainingBalance = Math.max(0, debt.originalAmount - debt.repaidAmount);
            const isOverdue = !isFullyRepaid && debt.dueDate && debt.dueDate < todayStr;
            const pctRepaid = debt.originalAmount > 0
              ? Math.min(100, Math.round((debt.repaidAmount / debt.originalAmount) * 100))
              : 0;

            const isRepaymentsExpanded = expandedRepaymentsId === debt.id;

            return (
              <div
                key={debt.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-sm transition space-y-3 relative overflow-hidden ${
                  isOverdue
                    ? 'border-rose-400/60 dark:border-rose-500/40 bg-rose-500/5'
                    : isFullyRepaid
                    ? 'border-emerald-300 dark:border-emerald-800/60 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Badges, Counterparty, Title */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {/* Debt Type Badge */}
                      {debt.type === 'borrowed' ? (
                        <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Landmark className="w-3 h-3 text-amber-500" />
                          LIABILITY (I OWE)
                        </span>
                      ) : isGift ? (
                        <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Gift className="w-3 h-3 text-purple-500" />
                          FAMILY SUPPORT GIFT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <HeartHandshake className="w-3 h-3 text-emerald-500" />
                          LENT OUT (RECEIVABLE)
                        </span>
                      )}

                      {/* Relationship Badge */}
                      {debt.relationship === 'mobile_money' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-bold text-[10px] uppercase flex items-center gap-1">
                          <Smartphone className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                          Mobile Money
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px] uppercase">
                          {debt.relationship.replace('_', ' ')}
                        </span>
                      )}

                      {/* Overdue / Completed Badge */}
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          OVERDUE
                        </span>
                      )}

                      {isFullyRepaid && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          SETTLED
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 mt-1">
                      {debt.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {debt.type === 'borrowed' ? 'Lender' : 'Recipient'}: <strong className="text-slate-800 dark:text-slate-200">{debt.counterpartyName}</strong>
                      {debt.interestRate ? ` • ${debt.interestRate}% Interest/Fee` : ''}
                      {debt.dueDate ? ` • Due: ${debt.dueDate}` : ''}
                    </p>
                  </div>

                  {debt.type === 'borrowed' && (
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 sm:basis-full sm:order-last">
                      Received into: {accountLabel(debt.receivedAccount)}
                    </p>
                  )}

                  {/* Financial Balance Summary */}
                  <div className="sm:text-right shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      {isGift ? 'Gift Amount' : 'Remaining Balance'}
                    </span>
                    <span className={`text-xl font-black font-mono block ${
                      isGift
                        ? 'text-purple-600 dark:text-purple-400'
                        : debt.type === 'borrowed'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isGift ? formatUGX(debt.originalAmount) : formatUGX(remainingBalance)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Orig: {formatUGX(debt.originalAmount)} • Repaid: {formatUGX(debt.repaidAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar (if not gift) */}
                {!isGift && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Repayment Progress</span>
                      <span>{pctRepaid}% Repaid</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div
                        className={`h-full transition-all duration-300 ${
                          pctRepaid >= 100
                            ? 'bg-emerald-500'
                            : debt.type === 'borrowed'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pctRepaid}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                {debt.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                    "{debt.notes}"
                  </p>
                )}

                {/* Repayments History Accordion */}
                {debt.repayments && debt.repayments.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                    <button
                      onClick={() =>
                        setExpandedRepaymentsId(isRepaymentsExpanded ? null : debt.id)
                      }
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 flex items-center gap-1 transition"
                    >
                      {isRepaymentsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{debt.repayments.length} Payment Log(s) recorded</span>
                    </button>

                    {isRepaymentsExpanded && (
                      <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-500/40">
                        {debt.repayments.map((rep) => (
                          <div key={rep.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-medium">{rep.date}</span>
                              {rep.account && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  {rep.account === 'bank_account'
                                    ? '🏦 Bank'
                                    : rep.account === 'airtel_mobile_money'
                                    ? '🔴 Airtel'
                                    : rep.account === 'cash_on_hand'
                                    ? '💵 Cash'
                                    : '📱 MTN MoMo'}
                                </span>
                              )}
                              {rep.paymentMethod && <span className="text-[10px] text-slate-400">({rep.paymentMethod})</span>}
                              {rep.notes && <span className="text-[10px] text-slate-500 italic max-w-[150px] truncate">"{rep.notes}"</span>}
                            </div>
                            <span className={`font-extrabold font-mono shrink-0 ${debt.type === 'borrowed' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {debt.type === 'borrowed' ? '-' : '+'}{formatUGX(rep.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {!isGift && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenRepaymentModal(debt)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{debt.type === 'borrowed' ? 'Log Repayment' : 'Log Collection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFullyRepaid(debt.id)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition"
                      >
                        {isFullyRepaid ? 'Mark Unpaid' : 'Mark Fully Repaid'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => onEditDebt(debt)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteDebt(debt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
