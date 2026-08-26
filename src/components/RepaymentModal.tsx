import React, { useState, useEffect } from 'react';
import { AccountType, DebtItem, PaymentMethod } from '../types';
import { formatUGX } from '../utils/format';
import { X, DollarSign, Calendar, CreditCard, ArrowRight, CheckCircle2, Landmark, Smartphone, Banknote } from 'lucide-react';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem | null;
  onSaveRepayment: (
    debtId: string,
    amount: number,
    date: string,
    paymentMethod: PaymentMethod,
    notes: string,
    account: AccountType
  ) => void;
}

const ACCOUNT_OPTIONS: Array<{ id: AccountType; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'bank_account', label: 'Bank Account', sub: 'Stanbic / Equity / Centenary', icon: Landmark },
  { id: 'mtn_mobile_money', label: 'MTN MoMo', sub: 'MTN Wallet (*165#)', icon: Smartphone },
  { id: 'airtel_mobile_money', label: 'Airtel Money', sub: 'Airtel Wallet (*185#)', icon: Smartphone },
  { id: 'cash_on_hand', label: 'Cash on Hand', sub: 'Physical Cash Drawer', icon: Banknote },
];

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
  onSaveRepayment,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState<AccountType>('mtn_mobile_money');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mobile Money Transfer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (debt) {
      const remaining = Math.max(0, debt.originalAmount - debt.repaidAmount);
      setAmount(remaining > 0 ? remaining : 0);
      setDate(new Date().toISOString().slice(0, 10));
      setAccount('mtn_mobile_money');
      setPaymentMethod('Mobile Money Transfer');
      setNotes('');
    }
  }, [debt, isOpen]);

  if (!isOpen || !debt) return null;

  const remainingBalance = Math.max(0, debt.originalAmount - debt.repaidAmount);

  const handleAccountChange = (acct: AccountType) => {
    setAccount(acct);
    if (acct === 'bank_account') {
      setPaymentMethod('Bank Transfer');
    } else if (acct === 'cash_on_hand') {
      setPaymentMethod('Cash');
    } else if (acct === 'airtel_mobile_money') {
      setPaymentMethod('Airtel to MTN Transfer');
    } else {
      setPaymentMethod('Mobile Money Transfer');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    onSaveRepayment(
      debt.id,
      Number(amount),
      date,
      paymentMethod,
      notes.trim(),
      account
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {debt.type === 'borrowed' ? 'Record Debt Repayment' : 'Record Money Collected / Recovered'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              For: <strong className="text-slate-700 dark:text-slate-200">{debt.title}</strong> ({debt.counterpartyName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Summary Banner */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs shrink-0">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase">
              Original Amount
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white font-mono">
              {formatUGX(debt.originalAmount)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase">
              Remaining Balance
            </span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {formatUGX(remainingBalance)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          {/* Repayment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Payment Amount (UGX) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(remainingBalance)}
                className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Pay Full Balance ({formatUGX(remainingBalance)})
              </button>
            </div>
            <input
              type="number"
              required
              min="1000"
              max={debt.originalAmount * 2}
              step="1000"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Account Selection Card */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {debt.type === 'borrowed' ? 'Deduct Payment From Account *' : 'Deposit Collected Money Into *'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = account === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleAccountChange(opt.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block leading-tight truncate">{opt.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight truncate">{opt.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {debt.type === 'borrowed'
                ? 'Payment will be deducted from this account balance in your cashbook.'
                : 'Collected repayment will be added to this account balance in your cashbook.'}
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Mobile Money Transfer">Mobile Money Transfer</option>
              <option value="Mobile Money Withdrawal">Mobile Money Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash Handover</option>
              <option value="Equity Bank Withdrawal">Equity Agent Cash</option>
              <option value="Agent Withdrawal">Agent Cash</option>
              <option value="Credit/Debit Card">Card Payment</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Receipt #4829 / MoMo Ref..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              Log Payment ({formatUGX(amount)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
