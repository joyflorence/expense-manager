import React, { useEffect, useState } from 'react';
import { AccountType, Expense, ExpenseCategory, ExpenseCategoryDetails, InvestmentType, PaymentMethod, PurposeType } from '../types';
import { X, Receipt } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id'>, editingId?: string, separateTaxAmount?: number, separateTaxRate?: number) => void;
  expenseToEdit?: Expense | null;
  existingTaxAmount?: number;
  existingTaxRate?: number;
}

const CATEGORIES: ExpenseCategory[] = [
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
  'Savings',
  'Investments',
  'Debt Repayment',
  'Savings & Investments',
  'Taxes & Fees',
  'Other',
];

const INVESTMENT_TYPES: InvestmentType[] = [
  'Stocks or shares',
  'Bonds or treasury bills',
  'Managed or unit trust fund',
  'Retirement contribution',
  'Real estate',
  'Business investment',
  'Other investment',
];

const PAYMENT_OPTIONS: Array<{ label: string; method: PaymentMethod; source: AccountType }> = [
  { label: 'Cash', method: 'Cash', source: 'cash_on_hand' },
  { label: 'MTN Mobile Money', method: 'Mobile Money Direct (Airtime/Data/Pay)', source: 'mtn_mobile_money' },
  { label: 'Airtel Money', method: 'Mobile Money Direct (Airtime/Data/Pay)', source: 'airtel_mobile_money' },
  { label: 'Bank account', method: 'Bank Direct / Card Online', source: 'bank_account' },
  { label: 'Credit or debit card', method: 'Credit/Debit Card', source: 'bank_account' },
];

const TAX_PRESETS = [
  { label: 'No tax', rate: 0 },
  { label: '0.5%', rate: 0.5 },
  { label: '6%', rate: 6 },
  { label: '18%', rate: 18 },
];

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  existingTaxAmount = 0,
  existingTaxRate = 0,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [purpose, setPurpose] = useState<PurposeType>('personal');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [deductionSource, setDeductionSource] = useState<AccountType>('cash_on_hand');
  const [date, setDate] = useState(getLocalDate);
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState<ExpenseCategoryDetails>({});

  useEffect(() => {
    if (!isOpen) return;
    if (expenseToEdit) {
      const selectedPayment = PAYMENT_OPTIONS.find((option) => option.method === expenseToEdit.paymentMethod && option.source === expenseToEdit.deductionSource);
      setTitle(expenseToEdit.title);
      setAmount(String(expenseToEdit.amount));
      setTaxAmount(String(existingTaxAmount || expenseToEdit.taxAmount || ''));
      setTaxRate(existingTaxRate || expenseToEdit.taxRate || 0);
      setPurpose(expenseToEdit.purpose);
      setCategory(CATEGORIES.includes(expenseToEdit.category) ? expenseToEdit.category : 'Other');
      setPaymentMethod(selectedPayment?.method || expenseToEdit.paymentMethod);
      setDeductionSource(selectedPayment?.source || expenseToEdit.deductionSource || 'cash_on_hand');
      setDate(expenseToEdit.date);
      setVendor(expenseToEdit.vendor || '');
      setNotes(expenseToEdit.notes || '');
      setIsTaxDeductible(expenseToEdit.isTaxDeductible);
      setCategoryDetails(expenseToEdit.categoryDetails || {});
      return;
    }

    setTitle('');
    setAmount('');
    setTaxAmount('');
    setTaxRate(0);
    setPurpose('personal');
    setCategory('Other');
    setPaymentMethod('Cash');
    setDeductionSource('cash_on_hand');
    setDate(getLocalDate());
    setVendor('');
    setNotes('');
    setIsTaxDeductible(false);
    setCategoryDetails({});
  }, [isOpen, expenseToEdit, existingTaxAmount, existingTaxRate]);

  if (!isOpen) return null;

  const amountValue = Number(amount) || 0;
  const taxValue = Number(taxAmount) || 0;

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const parsedAmount = Number(value);
    if (Number.isFinite(parsedAmount) && parsedAmount >= 0 && taxRate > 0) {
      setTaxAmount(((parsedAmount * taxRate) / 100).toFixed(0));
    }
  };

  const handlePreset = (rate: number) => {
    setTaxRate(rate);
    setTaxAmount(rate > 0 ? ((amountValue * rate) / 100).toFixed(0) : '');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !Number.isFinite(amountValue) || amountValue <= 0 || !date) return;

    const categoryDetailsForSave: ExpenseCategoryDetails | undefined = category === 'Savings'
      ? {
          savingsGoal: categoryDetails.savingsGoal?.trim() || undefined,
          destination: categoryDetails.destination?.trim() || undefined,
        }
      : category === 'Investments'
        ? {
            investmentType: categoryDetails.investmentType,
            provider: categoryDetails.provider?.trim() || undefined,
          }
        : category === 'Debt Repayment'
          ? {
              payee: categoryDetails.payee?.trim() || undefined,
              reference: categoryDetails.reference?.trim() || undefined,
            }
          : undefined;

    onSave({
      title: title.trim(),
      amount: amountValue,
      taxAmount: 0,
      totalAmount: amountValue,
      purpose,
      category,
      paymentMethod,
      date,
      isTaxDeductible: purpose === 'work' && isTaxDeductible,
      deductionSource,
      isSavings: false,
      isWithdrawal: false,
      isBankToMobileTransfer: false,
      isTaxEntry: false,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
      categoryDetails: categoryDetailsForSave,
    }, expenseToEdit?.id, taxValue, taxRate);
    onClose();
  };

  const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
  const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <div className="my-auto flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Receipt className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                {expenseToEdit ? 'Edit expense' : 'Record an expense'}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                Taxes and fees are recorded separately.
              </span>
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close expense form" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <div>
            <label htmlFor="expense-title" className={labelClassName}>Expense description</label>
            <input id="expense-title" required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClassName} placeholder="e.g. Groceries, transport, internet bill" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expense-amount" className={labelClassName}>Amount (UGX)</label>
              <input id="expense-amount" required type="number" min="1" step="1" value={amount} onChange={(event) => handleAmountChange(event.target.value)} className={`${fieldClassName} font-mono`} placeholder="0" />
            </div>
            <div>
              <label htmlFor="expense-date" className={labelClassName}>Date</label>
              <input id="expense-date" required type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClassName} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expense-category" className={labelClassName}>Category</label>
              <select id="expense-category" value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)} className={fieldClassName}>
                {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="expense-payment" className={labelClassName}>Payment method</label>
              <select
                id="expense-payment"
                value={`${paymentMethod}|${deductionSource}`}
                onChange={(event) => {
                  const [method, source] = event.target.value.split('|') as [PaymentMethod, AccountType];
                  setPaymentMethod(method);
                  setDeductionSource(source);
                }}
                className={fieldClassName}
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={`${option.method}|${option.source}`} value={`${option.method}|${option.source}`}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {category === 'Savings' && (
            <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-2">
              <div>
                <label htmlFor="expense-savings-goal" className={labelClassName}>Savings goal (optional)</label>
                <input
                  id="expense-savings-goal"
                  value={categoryDetails.savingsGoal || ''}
                  onChange={(event) => setCategoryDetails((details) => ({ ...details, savingsGoal: event.target.value || undefined }))}
                  className={fieldClassName}
                  placeholder="e.g. Emergency fund"
                />
              </div>
              <div>
                <label htmlFor="expense-savings-destination" className={labelClassName}>Where saved (optional)</label>
                <input
                  id="expense-savings-destination"
                  value={categoryDetails.destination || ''}
                  onChange={(event) => setCategoryDetails((details) => ({ ...details, destination: event.target.value || undefined }))}
                  className={fieldClassName}
                  placeholder="e.g. Savings account"
                />
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 sm:col-span-2">Recorded as money set aside, not as income or an account balance.</p>
            </section>
          )}

          {category === 'Investments' && (
            <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-2">
              <div>
                <label htmlFor="expense-investment-type" className={labelClassName}>Investment type</label>
                <select
                  id="expense-investment-type"
                  value={categoryDetails.investmentType || ''}
                  onChange={(event) => setCategoryDetails((details) => ({
                    ...details,
                    investmentType: (event.target.value || undefined) as InvestmentType | undefined,
                  }))}
                  className={fieldClassName}
                >
                  <option value="">Select type (optional)</option>
                  {INVESTMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="expense-investment-provider" className={labelClassName}>Provider or platform (optional)</label>
                <input
                  id="expense-investment-provider"
                  value={categoryDetails.provider || ''}
                  onChange={(event) => setCategoryDetails((details) => ({ ...details, provider: event.target.value || undefined }))}
                  className={fieldClassName}
                  placeholder="Broker, fund or platform"
                />
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 sm:col-span-2">This records the amount contributed; it does not track investment value or returns.</p>
            </section>
          )}

          {category === 'Debt Repayment' && (
            <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-2">
              <div>
                <label htmlFor="expense-debt-payee" className={labelClassName}>Lender or payee (optional)</label>
                <input
                  id="expense-debt-payee"
                  value={categoryDetails.payee || ''}
                  onChange={(event) => setCategoryDetails((details) => ({ ...details, payee: event.target.value || undefined }))}
                  className={fieldClassName}
                  placeholder="Person or institution repaid"
                />
              </div>
              <div>
                <label htmlFor="expense-debt-reference" className={labelClassName}>Loan reference (optional)</label>
                <input
                  id="expense-debt-reference"
                  value={categoryDetails.reference || ''}
                  onChange={(event) => setCategoryDetails((details) => ({ ...details, reference: event.target.value || undefined }))}
                  className={fieldClassName}
                  placeholder="Account or payment reference"
                />
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 sm:col-span-2">Use the amount paid for this repayment. Outstanding balances are not calculated.</p>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className={labelClassName}>Purpose</legend>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'personal', label: 'Personal' },
                  { value: 'work', label: 'Work' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={purpose === option.value}
                    onClick={() => {
                      setPurpose(option.value);
                      if (option.value === 'personal') setIsTaxDeductible(false);
                    }}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-medium transition ${
                      purpose === option.value
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="expense-vendor" className={labelClassName}>Payee (optional)</label>
              <input id="expense-vendor" value={vendor} onChange={(event) => setVendor(event.target.value)} className={fieldClassName} placeholder="Store, service or person" />
            </div>
          </div>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <div>
              <label htmlFor="expense-tax" className={labelClassName}>Tax or fee (optional)</label>
              <p className="mb-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Saved as a separate record and not added to the expense amount.
              </p>
              <div className="flex flex-wrap gap-2">
                {TAX_PRESETS.map((preset) => (
                  <button
                    key={preset.rate}
                    type="button"
                    onClick={() => handlePreset(preset.rate)}
                    aria-pressed={taxRate === preset.rate}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      taxRate === preset.rate
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input id="expense-tax" type="number" min="0" step="1" value={taxAmount} onChange={(event) => setTaxAmount(event.target.value)} className={`${fieldClassName} mt-3 font-mono`} placeholder="Tax or fee amount (UGX)" />
            </div>
          </section>

          {purpose === 'work' && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={isTaxDeductible} onChange={(event) => setIsTaxDeductible(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
              <span>
                <span className="block font-medium">Tax-deductible work expense</span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Mark this expense for your records.</span>
              </span>
            </label>
          )}

          <div>
            <label htmlFor="expense-notes" className={labelClassName}>Notes (optional)</label>
            <textarea id="expense-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClassName} resize-y`} placeholder="Add any useful details" />
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:-mx-6 sm:-mb-6 sm:px-6">
            <div className="min-w-0">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Expense amount</span>
              <span className="font-mono text-base font-semibold text-slate-950 dark:text-white">
                UGX {amountValue.toLocaleString()}
              </span>
              {taxValue > 0 && (
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  + UGX {taxValue.toLocaleString()} tax/fee separately
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={onClose} className="min-h-10 rounded-xl px-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" className="min-h-10 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                {expenseToEdit ? 'Save changes' : 'Save expense'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
