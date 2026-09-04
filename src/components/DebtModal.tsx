import React, { useState, useEffect } from 'react';
import { AccountType, DebtItem, DebtType, DebtPartyRelationship, PurposeType } from '../types';
import { X, Landmark, User, HeartHandshake, ShieldAlert, Calendar, DollarSign, FileText, Smartphone, Zap } from 'lucide-react';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<DebtItem, 'id' | 'repaidAmount' | 'status' | 'repayments'>) => void;
  debtToEdit?: DebtItem | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  onSave,
  debtToEdit,
}) => {
  const [type, setType] = useState<DebtType>('borrowed');
  const [title, setTitle] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [relationship, setRelationship] = useState<DebtPartyRelationship>('friend');
  const [receivedAccount, setReceivedAccount] = useState<AccountType>('mtn_mobile_money');
  const [originalAmount, setOriginalAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>('');
  const [purpose, setPurpose] = useState<PurposeType>('personal');
  const [isGiftOrRemittance, setIsGiftOrRemittance] = useState<boolean>(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (debtToEdit) {
      setType(debtToEdit.type);
      setTitle(debtToEdit.title);
      setCounterpartyName(debtToEdit.counterpartyName);
      setRelationship(debtToEdit.relationship);
      setReceivedAccount(debtToEdit.receivedAccount || 'mtn_mobile_money');
      setOriginalAmount(debtToEdit.originalAmount);
      setInterestRate(debtToEdit.interestRate || 0);
      setIssueDate(debtToEdit.issueDate || new Date().toISOString().slice(0, 10));
      setDueDate(debtToEdit.dueDate || '');
      setPurpose(debtToEdit.purpose || 'personal');
      setIsGiftOrRemittance(!!debtToEdit.isGiftOrRemittance);
      setNotes(debtToEdit.notes || '');
    } else {
      setType('borrowed');
      setTitle('');
      setCounterpartyName('');
      setRelationship('friend');
      setReceivedAccount('mtn_mobile_money');
      setOriginalAmount(0);
      setInterestRate(0);
      setIssueDate(new Date().toISOString().slice(0, 10));
      setDueDate('');
      setPurpose('personal');
      setIsGiftOrRemittance(false);
      setNotes('');
    }
  }, [debtToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !counterpartyName.trim() || originalAmount <= 0) return;

    onSave({
      title: title.trim(),
      type,
      counterpartyName: counterpartyName.trim(),
      relationship,
      receivedAccount: type === 'borrowed' ? receivedAccount : undefined,
      originalAmount: Number(originalAmount),
      interestRate: Number(interestRate) || 0,
      issueDate,
      dueDate: dueDate || undefined,
      purpose,
      isGiftOrRemittance: type === 'lent' ? isGiftOrRemittance : false,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${type === 'borrowed' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
              {type === 'borrowed' ? <Landmark className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {debtToEdit ? 'Edit Debt / Transfer' : 'Record New Debt or Transfer'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track borrowings position, loans, and money sent to friends or family
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          {/* Debt Category / Type Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('borrowed');
                  setIsGiftOrRemittance(false);
                }}
                className={`p-3 rounded-xl border text-left font-bold transition flex flex-col gap-1 ${
                  type === 'borrowed'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold">
                  <Landmark className="w-4 h-4 text-amber-500" />
                  Money I Borrowed (I Owe)
                </span>
                <span className="text-[10px] opacity-80">
                  Liabilities, bank loans, or borrowing position from friends
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType('lent')}
                className={`p-3 rounded-xl border text-left font-bold transition flex flex-col gap-1 ${
                  type === 'lent'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold">
                  <HeartHandshake className="w-4 h-4 text-emerald-500" />
                  Money I Lent / Sent Out
                </span>
                <span className="text-[10px] opacity-80">
                  Loans to friends, relatives, or family support transfers
                </span>
              </button>
            </div>
          </div>

          {/* Quick Mobile Borrowing Options (MTN & Airtel) */}
          {type === 'borrowed' && (
            <div className="bg-amber-500/10 dark:bg-amber-500/15 p-3 rounded-xl border border-amber-300 dark:border-amber-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Quick Mobile Borrowing Presets (MTN & Airtel)
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Click a platform to auto-fill Lender, Category, Title & typical fee rate:
              </p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {/* MTN MoKash */}
                <button
                  type="button"
                  onClick={() => {
                    setTitle('MTN MoKash Loan');
                    setCounterpartyName('MTN Uganda / MoKash (NCBA)');
                    setRelationship('mobile_money');
                    setReceivedAccount('mtn_mobile_money');
                    setInterestRate(9);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/50 text-amber-950 dark:text-amber-100 hover:bg-amber-300 dark:hover:bg-amber-800 font-bold text-[11px] transition flex items-center gap-1 border border-amber-400 dark:border-amber-700 active:scale-95"
                >
                  <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
                  MTN MoKash (9%)
                </button>

                {/* MTN MoMo Advance */}
                <button
                  type="button"
                  onClick={() => {
                    setTitle('MTN MoMo Advance Overdraft');
                    setCounterpartyName('MTN MoMo Uganda');
                    setRelationship('mobile_money');
                    setReceivedAccount('mtn_mobile_money');
                    setInterestRate(5);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/50 text-amber-950 dark:text-amber-100 hover:bg-amber-300 dark:hover:bg-amber-800 font-bold text-[11px] transition flex items-center gap-1 border border-amber-400 dark:border-amber-700 active:scale-95"
                >
                  MTN MoMo Advance
                </button>

                {/* MTN XtraTime */}
                <button
                  type="button"
                  onClick={() => {
                    setTitle('MTN XtraTime Airtime Loan');
                    setCounterpartyName('MTN Uganda');
                    setRelationship('mobile_money');
                    setReceivedAccount('mtn_mobile_money');
                    setInterestRate(15);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/50 text-amber-950 dark:text-amber-100 hover:bg-amber-300 dark:hover:bg-amber-800 font-bold text-[11px] transition flex items-center gap-1 border border-amber-400 dark:border-amber-700 active:scale-95"
                >
                  MTN XtraTime (Airtime)
                </button>

                {/* Airtel Wewole */}
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Airtel Wewole Loan');
                    setCounterpartyName('Airtel Uganda / Wewole (Jumo)');
                    setRelationship('mobile_money');
                    setReceivedAccount('airtel_mobile_money');
                    setInterestRate(10);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-200/80 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 hover:bg-rose-300 dark:hover:bg-rose-900 font-bold text-[11px] transition flex items-center gap-1 border border-rose-400 dark:border-rose-800 active:scale-95"
                >
                  <Zap className="w-3 h-3 text-rose-600 dark:text-rose-400 fill-rose-500" />
                  Airtel Wewole (10%)
                </button>

                {/* Airtel Money Overdraft */}
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Airtel Money Overdraft');
                    setCounterpartyName('Airtel Money Uganda');
                    setRelationship('mobile_money');
                    setReceivedAccount('airtel_mobile_money');
                    setInterestRate(5);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-200/80 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 hover:bg-rose-300 dark:hover:bg-rose-900 font-bold text-[11px] transition flex items-center gap-1 border border-rose-400 dark:border-rose-800 active:scale-95"
                >
                  Airtel Money Overdraft
                </button>

                {/* Airtel Kopa Airtime */}
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Airtel Kopa Airtime / Data');
                    setCounterpartyName('Airtel Uganda');
                    setRelationship('mobile_money');
                    setReceivedAccount('airtel_mobile_money');
                    setInterestRate(15);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-200/80 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 hover:bg-rose-300 dark:hover:bg-rose-900 font-bold text-[11px] transition flex items-center gap-1 border border-rose-400 dark:border-rose-800 active:scale-95"
                >
                  Airtel Kopa Airtime
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Title / Description Label *
            </label>
            <input
              type="text"
              required
              placeholder={type === 'borrowed' ? 'e.g., Emergency Car Repair Loan / MTN MoKash' : 'e.g., Tuition Support for Brother David'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Counterparty & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'borrowed' ? 'Lender / Institution Name *' : 'Recipient / Borrower Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={type === 'borrowed' ? 'e.g., MTN MoKash / Equity Bank / Mark' : 'e.g., Uncle Joseph / Sarah'}
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Relationship / Provider
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as DebtPartyRelationship)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="mobile_money">📱 Mobile Money & Telco (MTN, Airtel)</option>
                <option value="friend">Friend</option>
                <option value="relative">Relative / Family</option>
                <option value="bank_financial">Bank / Microfinance</option>
                <option value="colleague">Colleague / Workmate</option>
                <option value="business">Business Partner / Supplier</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {type === 'borrowed' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Money Received Into *
              </label>
              <select
                value={receivedAccount}
                onChange={(e) => setReceivedAccount(e.target.value as AccountType)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="mtn_mobile_money">MTN MoMo Wallet</option>
                <option value="airtel_mobile_money">Airtel Money Wallet</option>
                <option value="bank_account">Bank Account</option>
                <option value="cash_on_hand">Cash on Hand</option>
              </select>
              <p className="mt-1 text-[10px] text-amber-800 dark:text-amber-300">
                Only the unpaid borrowed balance is added here; repayments remove it as you clear the debt.
              </p>
            </div>
          )}

          {/* Amount & Interest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Principal Amount (UGX) *
              </label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="e.g. 500000"
                value={originalAmount || ''}
                onChange={(e) => setOriginalAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Interest Rate / Fee % (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={interestRate || ''}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expected Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Purpose & Gift Checkbox */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purpose Context
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="purpose"
                    value="personal"
                    checked={purpose === 'personal'}
                    onChange={() => setPurpose('personal')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  Personal
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="purpose"
                    value="work"
                    checked={purpose === 'work'}
                    onChange={() => setPurpose('work')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  Work / Business
                </label>
              </div>
            </div>

            {type === 'lent' && (
              <label className="flex items-center gap-2 cursor-pointer bg-emerald-500/10 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                <input
                  type="checkbox"
                  checked={isGiftOrRemittance}
                  onChange={(e) => setIsGiftOrRemittance(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Family Support / Gift (Not Expected Back)
                </span>
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Terms
            </label>
            <textarea
              rows={2}
              placeholder="Add terms, phone number, mobile money reference, or reason..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition shadow-md active:scale-95"
            >
              {debtToEdit ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
