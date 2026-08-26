import React, { useState, useEffect } from 'react';
import { DebtItem, PaymentMethod } from '../types';
import { formatUGX } from '../utils/format';
import { X, DollarSign, Calendar, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem | null;
  onSaveRepayment: (debtId: string, amount: number, date: string, paymentMethod: PaymentMethod, notes: string) => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
  onSaveRepayment,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mobile Money Transfer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (debt) {
      const remaining = Math.max(0, debt.originalAmount - debt.repaidAmount);
      setAmount(remaining > 0 ? remaining : 0);
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('Mobile Money Transfer');
      setNotes('');
    }
  }, [debt, isOpen]);

  if (!isOpen || !debt) return null;

  const remainingBalance = Math.max(0, debt.originalAmount - debt.repaidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    onSaveRepayment(
      debt.id,
      Number(amount),
      date,
      paymentMethod,
      notes.trim()
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
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
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
                className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
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
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition shadow-md active:scale-95 flex items-center gap-1.5"
            >
              Log Payment ({formatUGX(amount)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
