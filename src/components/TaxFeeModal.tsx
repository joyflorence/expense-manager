import React, { useEffect, useState } from 'react';
import { AccountType, Expense, PaymentMethod, TaxFeeType } from '../types';
import { Receipt, X } from 'lucide-react';

interface TaxFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<Expense, 'id'>, editingId?: string) => void;
  recordToEdit?: Expense | null;
}

const TAX_FEE_TYPES: TaxFeeType[] = [
  'Income tax',
  'Withholding tax',
  'Value added tax',
  'Local tax',
  'Bank charge',
  'Bank transfer fee',
  'Mobile money charge',
  'Mobile money transfer fee',
  'License or permit',
  'Other tax or fee',
];

const PAYMENT_OPTIONS: Array<{ label: string; method: PaymentMethod; source: AccountType }> = [
  { label: 'Cash', method: 'Cash', source: 'cash_on_hand' },
  { label: 'MTN Mobile Money', method: 'Mobile Money Direct (Airtime/Data/Pay)', source: 'mtn_mobile_money' },
  { label: 'Airtel Money', method: 'Mobile Money Direct (Airtime/Data/Pay)', source: 'airtel_mobile_money' },
  { label: 'Bank account', method: 'Bank Direct / Card Online', source: 'bank_account' },
  { label: 'Credit or debit card', method: 'Credit/Debit Card', source: 'bank_account' },
];

const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const TaxFeeModal: React.FC<TaxFeeModalProps> = ({ isOpen, onClose, onSave, recordToEdit }) => {
  const [title, setTitle] = useState('');
  const [taxFeeType, setTaxFeeType] = useState<TaxFeeType>('Other tax or fee');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(localDate);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [deductionSource, setDeductionSource] = useState<AccountType>('cash_on_hand');
  const [payee, setPayee] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (recordToEdit) {
      const selectedMethod = PAYMENT_OPTIONS.find((option) => (
        option.method === recordToEdit.paymentMethod && option.source === recordToEdit.deductionSource
      ));
      setTitle(recordToEdit.title.replace(' - Tax / Fee', ''));
      setTaxFeeType(recordToEdit.categoryDetails?.taxFeeType || 'Other tax or fee');
      setAmount(String(recordToEdit.amount));
      setDate(recordToEdit.date);
      setPaymentMethod(selectedMethod?.method || recordToEdit.paymentMethod);
      setDeductionSource(selectedMethod?.source || recordToEdit.deductionSource || 'cash_on_hand');
      setPayee(recordToEdit.vendor || '');
      setReference(recordToEdit.categoryDetails?.reference || '');
      setNotes(recordToEdit.notes || '');
      return;
    }

    setTitle('');
    setTaxFeeType('Other tax or fee');
    setAmount('');
    setDate(localDate());
    setPaymentMethod('Cash');
    setDeductionSource('cash_on_hand');
    setPayee('');
    setReference('');
    setNotes('');
  }, [isOpen, recordToEdit]);

  if (!isOpen) return null;

  const amountValue = Number(amount);
  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200';

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !Number.isFinite(amountValue) || amountValue <= 0 || !date) return;

    onSave({
      title: title.trim(),
      amount: amountValue,
      taxAmount: 0,
      totalAmount: amountValue,
      purpose: 'personal',
      category: 'Taxes & Fees',
      paymentMethod,
      date,
      isTaxDeductible: false,
      deductionSource,
      isSavings: false,
      isWithdrawal: false,
      isBankToMobileTransfer: false,
      isTaxEntry: true,
      vendor: payee.trim() || undefined,
      notes: notes.trim() || undefined,
      categoryDetails: {
        taxFeeType,
        reference: reference.trim() || undefined,
      },
    }, recordToEdit?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <div className="my-auto flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Receipt className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-slate-950 dark:text-white">
                {recordToEdit ? 'Edit tax or fee' : 'Record tax or fee'}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                Record only the tax or fee incurred. No expense or transfer amount is needed.
              </span>
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close tax or fee form" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="tax-fee-description" className={labelClass}>Tax or fee description</label>
              <input id="tax-fee-description" required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="e.g. Bank transfer fee" />
            </div>
            <div>
              <label htmlFor="tax-fee-type" className={labelClass}>Type</label>
              <select id="tax-fee-type" value={taxFeeType} onChange={(event) => setTaxFeeType(event.target.value as TaxFeeType)} className={fieldClass}>
                {TAX_FEE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tax-fee-amount" className={labelClass}>Tax or fee amount (UGX)</label>
              <input id="tax-fee-amount" required type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${fieldClass} font-mono`} placeholder="0" />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Enter just the tax/fee amount, not the transfer amount.</p>
            </div>
            <div>
              <label htmlFor="tax-fee-date" className={labelClass}>Date incurred / paid</label>
              <input id="tax-fee-date" required type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="tax-fee-payment" className={labelClass}>Payment method</label>
              <select
                id="tax-fee-payment"
                value={`${paymentMethod}|${deductionSource}`}
                onChange={(event) => {
                  const [method, source] = event.target.value.split('|') as [PaymentMethod, AccountType];
                  setPaymentMethod(method);
                  setDeductionSource(source);
                }}
                className={fieldClass}
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={`${option.method}|${option.source}`} value={`${option.method}|${option.source}`}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tax-fee-payee" className={labelClass}>Paid to (optional)</label>
              <input id="tax-fee-payee" value={payee} onChange={(event) => setPayee(event.target.value)} className={fieldClass} placeholder="Authority or service provider" />
            </div>
            <div>
              <label htmlFor="tax-fee-reference" className={labelClass}>Reference (optional)</label>
              <input id="tax-fee-reference" value={reference} onChange={(event) => setReference(event.target.value)} className={fieldClass} placeholder="Receipt or transaction number" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tax-fee-notes" className={labelClass}>Notes (optional)</label>
              <textarea id="tax-fee-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass} resize-y`} placeholder="Add any useful details" />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className="min-h-10 rounded-xl px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" className="min-h-10 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              {recordToEdit ? 'Save changes' : 'Save tax or fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
