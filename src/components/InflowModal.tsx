import React, { useState, useEffect } from 'react';
import { Inflow, InflowCategory, InflowDestination } from '../types';
import { formatUGX } from '../utils/format';
import { 
  X, 
  ArrowDownLeft, 
  Landmark, 
  Smartphone, 
  Banknote, 
  Building2, 
  User, 
  DollarSign, 
  Calendar, 
  FileCheck, 
  CheckCircle2,
  Briefcase,
  Gift,
  HandCoins,
  ShieldCheck,
  TrendingUp,
  Tag,
  Hash
} from 'lucide-react';

interface InflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inflowData: Omit<Inflow, 'id'>, editingId?: string) => void;
  inflowToEdit?: Inflow | null;
  selectedMonth: string;
}

const INFLOW_CATEGORIES: InflowCategory[] = [
  'Salary & Wages',
  'Freelance & Gigs',
  'Business & Sales',
  'Client Payment',
  'Mobile Money Received',
  'Bank Deposit & Wire',
  'Gift & Support',
  'Debt Repayment Received',
  'Rental & Investment',
  'Refund & Reimbursement',
  'Side Hustle',
  'Other Inflow',
];

const UGANDA_BANKS = [
  'Equity Bank Uganda',
  'Stanbic Bank Uganda',
  'Centenary Bank',
  'Absa Bank Uganda',
  'DFCU Bank',
  'Standard Chartered Uganda',
  'PostBank Uganda',
  'KCB Bank Uganda',
  'Diamond Trust Bank (DTB)',
  'Other Bank',
];

const MOBILE_NETWORKS = [
  'MTN Mobile Money (*165#)',
  'Airtel Money (*185#)',
  'Other Mobile Wallet',
];

const QUICK_INFLOW_PRESETS = [
  {
    label: '💼 Monthly Salary',
    title: 'Monthly Salary / Payroll',
    category: 'Salary & Wages' as InflowCategory,
    destination: 'bank_account' as InflowDestination,
    source: 'Employer / Company',
    taxEstimate: 15000,
    icon: Briefcase,
  },
  {
    label: '💻 Client Payment',
    title: 'Client Project Payment',
    category: 'Client Payment' as InflowCategory,
    destination: 'bank_account' as InflowDestination,
    source: 'Client / Business',
    taxEstimate: 0,
    icon: Building2,
  },
  {
    label: '📱 MoMo Received',
    title: 'Mobile Money Received',
    category: 'Mobile Money Received' as InflowCategory,
    destination: 'mobile_money' as InflowDestination,
    source: 'Sender / Client',
    taxEstimate: 0,
    icon: Smartphone,
  },
  {
    label: '🏦 Bank Deposit',
    title: 'Direct Bank Wire / Deposit',
    category: 'Bank Deposit & Wire' as InflowCategory,
    destination: 'bank_account' as InflowDestination,
    source: 'Bank Account Deposit',
    taxEstimate: 0,
    icon: Landmark,
  },
  {
    label: '💵 Cash Received',
    title: 'Cash Payment / Sales',
    category: 'Business & Sales' as InflowCategory,
    destination: 'cash_on_hand' as InflowDestination,
    source: 'Customer / Buyer',
    taxEstimate: 0,
    icon: Banknote,
  },
  {
    label: '🎁 Family Gift / Support',
    title: 'Gift / Upkeep Received',
    category: 'Gift & Support' as InflowCategory,
    destination: 'mobile_money' as InflowDestination,
    source: 'Family / Friend',
    taxEstimate: 0,
    icon: Gift,
  },
  {
    label: '🤝 Debt Repaid to Me',
    title: 'Loan / Debt Repayment Received',
    category: 'Debt Repayment Received' as InflowCategory,
    destination: 'mobile_money' as InflowDestination,
    source: 'Borrower',
    taxEstimate: 0,
    icon: HandCoins,
  },
];

export const InflowModal: React.FC<InflowModalProps> = ({
  isOpen,
  onClose,
  onSave,
  inflowToEdit,
  selectedMonth,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [taxDeduction, setTaxDeduction] = useState<number | ''>('');
  const [destinationAccount, setDestinationAccount] = useState<InflowDestination>('bank_account');
  const [destinationBank, setDestinationBank] = useState<string>('Equity Bank Uganda');
  const [destinationNetwork, setDestinationNetwork] = useState<string>('MTN Mobile Money (*165#)');
  const [category, setCategory] = useState<InflowCategory>('Salary & Wages');
  const [payerSource, setPayerSource] = useState('');
  const [date, setDate] = useState(todayStr);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (inflowToEdit) {
        setTitle(inflowToEdit.title || '');
        setAmount(inflowToEdit.amount || '');
        setTaxDeduction(inflowToEdit.taxDeduction || '');
        setDestinationAccount(inflowToEdit.destinationAccount || 'bank_account');
        setDestinationBank(inflowToEdit.destinationBank || 'Equity Bank Uganda');
        setDestinationNetwork(inflowToEdit.destinationNetwork || 'MTN Mobile Money (*165#)');
        setCategory(inflowToEdit.category || 'Salary & Wages');
        setPayerSource(inflowToEdit.payerSource || '');
        setDate(inflowToEdit.date || todayStr);
        setReferenceNumber(inflowToEdit.referenceNumber || '');
        setNotes(inflowToEdit.notes || '');
      } else {
        setTitle('');
        setAmount('');
        setTaxDeduction('');
        setDestinationAccount('bank_account');
        setDestinationBank('Equity Bank Uganda');
        setDestinationNetwork('MTN Mobile Money (*165#)');
        setCategory('Salary & Wages');
        setPayerSource('');
        
        if (selectedMonth && selectedMonth !== 'all') {
          const currentDay = new Date().getDate().toString().padStart(2, '0');
          setDate(`${selectedMonth}-${currentDay}`);
        } else {
          setDate(todayStr);
        }
        setReferenceNumber('');
        setNotes('');
      }
    }
  }, [isOpen, inflowToEdit, selectedMonth]);

  if (!isOpen) return null;

  const numAmount = typeof amount === 'number' ? amount : 0;
  const numTax = typeof taxDeduction === 'number' ? taxDeduction : 0;
  const netReceived = Math.max(0, numAmount - numTax);

  const applyPreset = (preset: typeof QUICK_INFLOW_PRESETS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setDestinationAccount(preset.destination);
    if (preset.source && !payerSource) {
      setPayerSource(preset.source);
    }
    if (preset.taxEstimate > 0 && !taxDeduction) {
      setTaxDeduction(preset.taxEstimate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title/description for this income.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid inflow amount greater than 0 UGX.');
      return;
    }
    if (numTax > numAmount) {
      setError('Tax/Withholding deduction cannot exceed the total gross amount.');
      return;
    }
    if (!date) {
      setError('Please select the date the funds were received.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        amount: numAmount,
        taxDeduction: numTax,
        netAmount: netReceived,
        destinationAccount,
        destinationBank: destinationAccount === 'bank_account' ? destinationBank : undefined,
        destinationNetwork: destinationAccount === 'mobile_money' ? destinationNetwork : undefined,
        category,
        payerSource: payerSource.trim() || undefined,
        date,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      inflowToEdit?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-500/5 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shadow-sm font-black">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {inflowToEdit ? 'Edit Cash Inflow' : 'Record Cash Inflow (Money In)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log money coming into your Bank, Mobile Money wallet, or cash drawer.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        {!inflowToEdit && (
          <div className="px-6 pt-4 pb-1 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Quick Inflow Presets</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {QUICK_INFLOW_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-95 shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Destination Account Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              1. Destination Account (Where Did Money Arrive?)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Bank Account */}
              <button
                type="button"
                onClick={() => setDestinationAccount('bank_account')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  destinationAccount === 'bank_account'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-500" />
                    Bank Account
                  </span>
                  {destinationAccount === 'bank_account' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <span className="text-[10px] opacity-80">Deposited into Equity/Stanbic/Centenary</span>
              </button>

              {/* Mobile Money */}
              <button
                type="button"
                onClick={() => setDestinationAccount('mobile_money')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  destinationAccount === 'mobile_money'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    Mobile Money
                  </span>
                  {destinationAccount === 'mobile_money' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <span className="text-[10px] opacity-80">Direct MTN MoMo or Airtel Money</span>
              </button>

              {/* Cash on Hand */}
              <button
                type="button"
                onClick={() => setDestinationAccount('cash_on_hand')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  destinationAccount === 'cash_on_hand'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    Cash on Hand
                  </span>
                  {destinationAccount === 'cash_on_hand' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <span className="text-[10px] opacity-80">Physical cash in drawer or pocket</span>
              </button>
            </div>
          </div>

          {/* Bank / Network Sub-Selector */}
          {destinationAccount === 'bank_account' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                Select Destination Bank
              </label>
              <select
                value={destinationBank}
                onChange={(e) => setDestinationBank(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {UGANDA_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {destinationAccount === 'mobile_money' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                Select Mobile Network Wallet
              </label>
              <select
                value={destinationNetwork}
                onChange={(e) => setDestinationNetwork(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {MOBILE_NETWORKS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Amount & Tax Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Gross Amount Received (UGX) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {numAmount > 0 ? formatUGX(numAmount) : 'Enter total amount before any deductions'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-rose-500" />
                Tax / PAYE / Local Tax Deducted (UGX)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 15000 (0 if none)"
                value={taxDeduction}
                onChange={(e) => setTaxDeduction(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {numTax > 0 ? `${formatUGX(numTax)} deducted at source` : 'Optional source tax / WHT / PAYE'}
              </span>
            </div>
          </div>

          {/* Net Amount Realized Banner */}
          {numAmount > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Net Amount Credited to {destinationAccount === 'bank_account' ? destinationBank : destinationAccount === 'mobile_money' ? destinationNetwork : 'Cash Drawer'}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Gross {formatUGX(numAmount)} - Tax {formatUGX(numTax)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatUGX(netReceived)}
                </span>
              </div>
            </div>
          )}

          {/* 3. Title & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Inflow Title / Description *
              </label>
              <input
                type="text"
                placeholder="e.g. August Salary, Client Web Design, MoMo from Uncle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Payer / Source Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Ltd, John Mukasa, Airtel MoMo"
                value={payerSource}
                onChange={(e) => setPayerSource(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 4. Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Income Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InflowCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {INFLOW_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date Received *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 5. Reference Number & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Transaction Ref / MoMo Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-892193 or MoMo SMS Code"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Memo (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Balance after bonus, invoice #104"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
              <span>{inflowToEdit ? 'Update Cash Inflow' : 'Record Cash Inflow'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
