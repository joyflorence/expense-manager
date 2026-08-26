import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, PaymentMethod, PurposeType } from '../types';
import { formatUGX } from '../utils/format';
import { 
  X, 
  Receipt, 
  Briefcase, 
  User, 
  DollarSign, 
  Calculator, 
  FileCheck, 
  PiggyBank, 
  CheckCircle2, 
  Banknote,
  Smartphone,
  Wifi,
  Zap,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Landmark,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Users,
  UserCheck
} from 'lucide-react';

export type ExpenseModalMode = 'spending' | 'transfer' | 'cashout' | 'savings';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id'>, editingId?: string) => void;
  expenseToEdit?: Expense | null;
  selectedMonth: string;
  initialMode?: ExpenseModalMode;
}

const CATEGORIES: ExpenseCategory[] = [
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

const THIRD_PARTY_TRANSFER_CATEGORIES: ExpenseCategory[] = [
  'Family Support & Upkeep',
  'Utilities & Bills',
  'Client Expenses',
  'Groceries',
  'Dining & Meals',
  'Travel & Commute',
  'Shopping & Personal',
  'Software & Tools',
  'Office Supplies',
  'Health & Wellness',
  'Subscriptions',
  'Other',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Bank to Mobile Transfer (Bank-to-Wallet)',
  'Cash on Hand (From Cashout)',
  'Mobile Money Direct (Airtime/Data/Pay)',
  'Bank Direct / Card Online',
  'Mobile Money Cashout',
  'Debit Card / ATM Cashout',
  'Mobile Money Withdrawal',
  'Equity Bank Withdrawal',
  'Agent Withdrawal',
  'Mobile Money Transfer',
  'Bank Transfer',
  'Cash',
  'Credit/Debit Card',
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

const UGANDA_TAX_PRESETS = [
  { rate: 0.0, label: '0% (Airtime / Data / ATM / Cash Exempt)', code: '0%' },
  { rate: 0.5, label: '0.5% (MoMo / Agent Cashout & Send)', code: '0.5%' },
  { rate: 6.0, label: '6% (Uganda WHT Withholding Tax)', code: '6%' },
  { rate: 18.0, label: '18% (Uganda Standard VAT)', code: '18%' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  selectedMonth,
  initialMode = 'spending',
}) => {
  const [entryMode, setEntryMode] = useState<ExpenseModalMode>(initialMode);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [taxRate, setTaxRate] = useState<number>(0.0);
  const [taxAmount, setTaxAmount] = useState<number | ''>('');
  const [purpose, setPurpose] = useState<PurposeType>('personal');
  const [category, setCategory] = useState<ExpenseCategory>('Dining & Meals');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Hand (From Cashout)');
  const [deductionSource, setDeductionSource] = useState<'cash_on_hand' | 'mobile_money_bank' | 'bank_account' | 'mobile_money'>('cash_on_hand');
  const [date, setDate] = useState('');
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [cashoutSource, setCashoutSource] = useState<'momo' | 'card' | 'agent'>('momo');
  
  // Transfer configuration
  const [transferRecipientType, setTransferRecipientType] = useState<'self' | 'third_party'>('self');
  const [recipientName, setRecipientName] = useState<string>('');
  const [sourceBank, setSourceBank] = useState<string>('Equity Bank Uganda');
  const [recipientNetwork, setRecipientNetwork] = useState<string>('MTN Mobile Money (*165#)');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');

  // Auto tax recalculation when subtotal amount or rate changes
  const handleAmountChange = (newAmount: number) => {
    setAmount(newAmount);
    if (newAmount >= 0 && entryMode !== 'transfer') {
      const computedTax = parseFloat(((newAmount * taxRate) / 100).toFixed(2));
      setTaxAmount(computedTax);
    }
  };

  const handleTaxRateChange = (newRate: number) => {
    setTaxRate(newRate);
    if (typeof amount === 'number' && amount >= 0) {
      const computedTax = parseFloat(((amount * newRate) / 100).toFixed(2));
      setTaxAmount(computedTax);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (
      method === 'Mobile Money Direct (Airtime/Data/Pay)' ||
      method === 'Bank Direct / Card Online' ||
      method === 'Mobile Money Transfer' ||
      method === 'Bank Transfer'
    ) {
      setDeductionSource('mobile_money_bank');
      if (method === 'Mobile Money Transfer') {
        handleTaxRateChange(0.5);
      } else {
        handleTaxRateChange(0.0);
      }
    } else if (
      method === 'Mobile Money Cashout' ||
      method === 'Mobile Money Withdrawal' ||
      method === 'Equity Bank Withdrawal' ||
      method === 'Agent Withdrawal'
    ) {
      handleTaxRateChange(0.5);
    } else if (method === 'Debit Card / ATM Cashout' || method === 'Cash' || method === 'Cash on Hand (From Cashout)') {
      setDeductionSource('cash_on_hand');
      handleTaxRateChange(0.0);
    } else if (method === 'Credit/Debit Card') {
      handleTaxRateChange(18.0);
    }
  };

  const handleSelectCashoutSource = (src: 'momo' | 'card' | 'agent') => {
    setCashoutSource(src);
    if (src === 'momo') {
      setPaymentMethod('Mobile Money Cashout');
      if (!title || title === 'Debit Card ATM Cashout' || title === 'Bank Agent Cashout') {
        setTitle('Mobile Money Cashout');
      }
      handleTaxRateChange(0.5);
    } else if (src === 'card') {
      setPaymentMethod('Debit Card / ATM Cashout');
      if (!title || title === 'Mobile Money Cashout' || title === 'Bank Agent Cashout') {
        setTitle('Debit Card ATM Cashout');
      }
      handleTaxRateChange(0.0);
    } else {
      setPaymentMethod('Agent Withdrawal');
      if (!title || title === 'Mobile Money Cashout' || title === 'Debit Card ATM Cashout') {
        setTitle('Bank Agent Cashout');
      }
      handleTaxRateChange(0.5);
    }
  };

  // Quick Preset Helper for Common Expenses (Airtime, Data, Minutes, Utilities)
  const applyQuickPreset = (preset: 'mtn_airtime' | 'airtel_airtime' | 'mtn_data' | 'airtel_data' | 'yaka_power' | 'cash_spending') => {
    setEntryMode('spending');

    if (preset === 'mtn_airtime') {
      setTitle('MTN Airtime / Voice Minutes');
      setCategory('Airtime, Data & Minutes');
      setPaymentMethod('Mobile Money Direct (Airtime/Data/Pay)');
      setDeductionSource('mobile_money_bank');
      setVendor('MTN Uganda');
      handleTaxRateChange(0.0);
    } else if (preset === 'airtel_airtime') {
      setTitle('Airtel Airtime / Voice Minutes');
      setCategory('Airtime, Data & Minutes');
      setPaymentMethod('Mobile Money Direct (Airtime/Data/Pay)');
      setDeductionSource('mobile_money_bank');
      setVendor('Airtel Uganda');
      handleTaxRateChange(0.0);
    } else if (preset === 'mtn_data') {
      setTitle('MTN Data Internet Bundle');
      setCategory('Airtime, Data & Minutes');
      setPaymentMethod('Mobile Money Direct (Airtime/Data/Pay)');
      setDeductionSource('mobile_money_bank');
      setVendor('MTN Uganda');
      handleTaxRateChange(0.0);
    } else if (preset === 'airtel_data') {
      setTitle('Airtel Data Internet Bundle');
      setCategory('Airtime, Data & Minutes');
      setPaymentMethod('Mobile Money Direct (Airtime/Data/Pay)');
      setDeductionSource('mobile_money_bank');
      setVendor('Airtel Uganda');
      handleTaxRateChange(0.0);
    } else if (preset === 'yaka_power') {
      setTitle('Umeme / Yaka Electricity Token');
      setCategory('Utilities & Bills');
      setPaymentMethod('Mobile Money Direct (Airtime/Data/Pay)');
      setDeductionSource('mobile_money_bank');
      setVendor('Umeme / Yaka');
      handleTaxRateChange(0.0);
    } else if (preset === 'cash_spending') {
      setTitle('');
      setCategory('Dining & Meals');
      setPaymentMethod('Cash on Hand (From Cashout)');
      setDeductionSource('cash_on_hand');
      handleTaxRateChange(0.0);
    }
  };

  // Quick Preset Helper for Bank to Mobile Transfers
  const applyTransferPreset = (bank: string, net: string, defaultTitle: string) => {
    setEntryMode('transfer');
    setSourceBank(bank);
    setRecipientNetwork(net);
    setTitle(defaultTitle);
    if (transferRecipientType === 'self') {
      setCategory('Bank to Mobile Transfer');
    }
    setPaymentMethod('Bank to Mobile Transfer (Bank-to-Wallet)');
    setDeductionSource('bank_account');
    setTaxAmount(500); // Typical bank transfer fee
  };

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount);
      setTaxAmount(expenseToEdit.taxAmount);
      setTaxRate(expenseToEdit.taxRate ?? 0.0);
      setPurpose(expenseToEdit.purpose);
      setCategory(expenseToEdit.category);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setDeductionSource(
        expenseToEdit.deductionSource ||
        (expenseToEdit.paymentMethod === 'Mobile Money Direct (Airtime/Data/Pay)' ||
         expenseToEdit.paymentMethod === 'Bank Direct / Card Online' ||
         expenseToEdit.paymentMethod === 'Mobile Money Transfer' ||
         expenseToEdit.paymentMethod === 'Bank Transfer'
          ? 'mobile_money_bank'
          : 'cash_on_hand')
      );
      setDate(expenseToEdit.date);
      setIsTaxDeductible(expenseToEdit.isTaxDeductible);
      
      // Determine mode
      if (
        expenseToEdit.isBankToMobileTransfer ||
        expenseToEdit.paymentMethod === 'Bank to Mobile Transfer (Bank-to-Wallet)' ||
        expenseToEdit.category === 'Bank to Mobile Transfer' ||
        expenseToEdit.category === 'Bank to Mobile Money Transfer' ||
        expenseToEdit.title.toLowerCase().includes('bank to mobile') ||
        expenseToEdit.title.toLowerCase().includes('bank to momo')
      ) {
        setEntryMode('transfer');
        setTransferRecipientType(expenseToEdit.transferRecipientType || (expenseToEdit.recipientName ? 'third_party' : 'self'));
        setRecipientName(expenseToEdit.recipientName || '');
        setSourceBank(expenseToEdit.sourceBank || 'Equity Bank Uganda');
        setRecipientNetwork(expenseToEdit.recipientMobileNetwork || 'MTN Mobile Money (*165#)');
        setRecipientPhone(expenseToEdit.recipientPhone || '');
        setRefNumber(expenseToEdit.referenceNumber || '');
      } else if (expenseToEdit.isSavings || expenseToEdit.category === 'Savings & Investments') {
        setEntryMode('savings');
      } else if (
        expenseToEdit.isWithdrawal ||
        expenseToEdit.paymentMethod === 'Mobile Money Cashout' ||
        expenseToEdit.paymentMethod === 'Debit Card / ATM Cashout' ||
        expenseToEdit.paymentMethod === 'Mobile Money Withdrawal' ||
        expenseToEdit.paymentMethod === 'Equity Bank Withdrawal' ||
        expenseToEdit.paymentMethod === 'Agent Withdrawal'
      ) {
        setEntryMode('cashout');
        if (expenseToEdit.paymentMethod === 'Debit Card / ATM Cashout') {
          setCashoutSource('card');
        } else if (expenseToEdit.paymentMethod === 'Agent Withdrawal' || expenseToEdit.paymentMethod === 'Equity Bank Withdrawal') {
          setCashoutSource('agent');
        } else {
          setCashoutSource('momo');
        }
      } else {
        setEntryMode('spending');
        setRecipientName(expenseToEdit.recipientName || '');
        setRecipientPhone(expenseToEdit.recipientPhone || '');
      }

      setVendor(expenseToEdit.vendor || '');
      setNotes(expenseToEdit.notes || '');
    } else {
      setEntryMode(initialMode);
      setTitle('');
      setAmount('');
      setTaxRate(0.0);
      setTaxAmount(initialMode === 'transfer' ? 500 : 0);
      setPurpose('personal');
      setCategory(initialMode === 'transfer' ? 'Bank to Mobile Transfer' : initialMode === 'savings' ? 'Savings & Investments' : 'Dining & Meals');
      setPaymentMethod(
        initialMode === 'transfer'
          ? 'Bank to Mobile Transfer (Bank-to-Wallet)'
          : initialMode === 'cashout'
          ? 'Mobile Money Cashout'
          : 'Cash on Hand (From Cashout)'
      );
      setDeductionSource(initialMode === 'transfer' ? 'bank_account' : 'cash_on_hand');
      setDate(new Date().toISOString().slice(0, 10));
      setIsTaxDeductible(false);
      setCashoutSource('momo');
      setTransferRecipientType('self');
      setRecipientName('');
      setSourceBank('Equity Bank Uganda');
      setRecipientNetwork('MTN Mobile Money (*165#)');
      setRecipientPhone('');
      setRefNumber('');
      setVendor('');
      setNotes('');

      if (initialMode === 'transfer') {
        setTitle('Bank to MTN Mobile Money Transfer (Self)');
      }
    }
  }, [expenseToEdit, selectedMonth, isOpen, initialMode]);

  if (!isOpen) return null;

  const numAmount = typeof amount === 'number' ? amount : 0;
  const numTax = typeof taxAmount === 'number' ? taxAmount : 0;
  const totalAmount = parseFloat((numAmount + numTax).toFixed(2));
  const isThirdPartyTransfer = entryMode === 'transfer' && transferRecipientType === 'third_party';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numAmount < 0) return;

    const isTransfer = entryMode === 'transfer';
    const isSavings = entryMode === 'savings';
    const isWithdrawal = entryMode === 'cashout';

    onSave(
      {
        title: title.trim(),
        amount: numAmount,
        taxAmount: numTax,
        taxRate,
        totalAmount,
        purpose: isThirdPartyTransfer || entryMode === 'spending' ? purpose : 'personal',
        category: isThirdPartyTransfer
          ? category === 'Bank to Mobile Transfer' || category === 'Bank to Mobile Money Transfer'
            ? 'Family Support & Upkeep'
            : category
          : isTransfer
          ? 'Bank to Mobile Transfer'
          : isSavings
          ? 'Savings & Investments'
          : category,
        paymentMethod: isTransfer
          ? 'Bank to Mobile Transfer (Bank-to-Wallet)'
          : paymentMethod,
        deductionSource: isTransfer
          ? 'bank_account'
          : isSavings || isWithdrawal
          ? undefined
          : deductionSource,
        date: date || new Date().toISOString().slice(0, 10),
        isTaxDeductible: (purpose === 'work' && (entryMode === 'spending' || isThirdPartyTransfer)) ? isTaxDeductible : false,
        isSavings,
        isWithdrawal,
        isBankToMobileTransfer: isTransfer,
        transferRecipientType: isTransfer ? transferRecipientType : undefined,
        recipientName: recipientName.trim() || undefined,
        sourceBank: isTransfer ? sourceBank : undefined,
        recipientMobileNetwork: isTransfer ? recipientNetwork : undefined,
        recipientPhone: recipientPhone.trim() || undefined,
        referenceNumber: refNumber.trim() || undefined,
        transferFee: isTransfer ? numTax : undefined,
        vendor: isTransfer
          ? isThirdPartyTransfer
            ? `${sourceBank} → ${recipientName.trim() || recipientNetwork}`
            : `${sourceBank} → ${recipientNetwork}`
          : vendor.trim(),
        notes: notes.trim(),
      },
      expenseToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {entryMode === 'transfer' ? (
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Landmark className="w-5 h-5" />
                <ArrowRight className="w-4 h-4" />
                {transferRecipientType === 'third_party' ? <Users className="w-5 h-5 text-rose-500" /> : <Smartphone className="w-5 h-5 text-emerald-500" />}
              </div>
            ) : entryMode === 'savings' ? (
              <PiggyBank className="w-5 h-5 text-emerald-500" />
            ) : entryMode === 'cashout' ? (
              <Banknote className="w-5 h-5 text-amber-500" />
            ) : deductionSource === 'mobile_money_bank' ? (
              <Smartphone className="w-5 h-5 text-indigo-500" />
            ) : (
              <Receipt className="w-5 h-5 text-emerald-500" />
            )}
            <span>
              {expenseToEdit
                ? 'Edit Transaction Entry'
                : entryMode === 'transfer'
                ? transferRecipientType === 'third_party'
                  ? 'Transfer to Third-Party (Expense)'
                  : 'Transfer Bank to Own Mobile Money'
                : entryMode === 'savings'
                ? 'Deposit to Savings Goal'
                : entryMode === 'cashout'
                ? 'Log Cashout (ATM / Mobile Money)'
                : deductionSource === 'mobile_money_bank'
                ? 'Mobile Money / Bank Spending'
                : 'Cash on Hand Spending'}
            </span>
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          
          {/* CHOICE: 4 Core Entry Types */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Cashbook Entry Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              
              {/* 1. Spending Out */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('spending');
                  setCategory('Dining & Meals');
                  setPaymentMethod('Cash on Hand (From Cashout)');
                  setDeductionSource('cash_on_hand');
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                  entryMode === 'spending'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                Spending
              </button>

              {/* 2. Bank to Mobile Transfer */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('transfer');
                  setPaymentMethod('Bank to Mobile Transfer (Bank-to-Wallet)');
                  setDeductionSource('bank_account');
                  if (transferRecipientType === 'self') {
                    setCategory('Bank to Mobile Transfer');
                    if (!title || title.includes('Cashout') || title.includes('Savings')) {
                      setTitle('Bank to MTN Mobile Money Transfer (Self)');
                    }
                  } else {
                    setCategory('Family Support & Upkeep');
                    if (!title || title.includes('Cashout') || title.includes('Savings') || title.includes('(Self)')) {
                      setTitle(`Transfer to ${recipientName || 'Recipient'}`);
                    }
                  }
                  if (taxAmount === 0 || taxAmount === '') setTaxAmount(500);
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                  entryMode === 'transfer'
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Bank Transfer
              </button>

              {/* 3. Cashout In */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('cashout');
                  handleSelectCashoutSource('momo');
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                  entryMode === 'cashout'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                Cashout In
              </button>

              {/* 4. Savings */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('savings');
                  setCategory('Savings & Investments');
                  setPurpose('personal');
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                  entryMode === 'savings'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                Savings
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANK TO MOBILE TRANSFER SECTION */}
          {/* ========================================================================= */}
          {entryMode === 'transfer' && (
            <div className="space-y-3.5 p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 animate-in fade-in duration-200">
              
              {/* RECIPIENT TYPE TOGGLE: SELF vs THIRD PARTY */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                  Who is the money being transferred to?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* OPTION 1: TO MYSELF (Internal Liquidity Transfer) */}
                  <button
                    type="button"
                    onClick={() => {
                      setTransferRecipientType('self');
                      setCategory('Bank to Mobile Transfer');
                      setTitle(`${sourceBank.split(' ')[0]} to ${recipientNetwork.split(' ')[0]} MoMo (Self)`);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      transferRecipientType === 'self'
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white/60 dark:bg-slate-900/40 border-indigo-100 dark:border-indigo-900/40 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <span>To Myself (Own MoMo)</span>
                    </div>
                    <p className="text-[11px] opacity-80 leading-tight">
                      <strong>Internal Transfer</strong> • Moves money from Bank into your personal MoMo wallet for airtime, data & cashouts.
                    </p>
                  </button>

                  {/* OPTION 2: TO SOMEONE ELSE (Direct Expense) */}
                  <button
                    type="button"
                    onClick={() => {
                      setTransferRecipientType('third_party');
                      setCategory('Family Support & Upkeep');
                      setTitle(`Transfer to ${recipientName || 'Recipient'}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      transferRecipientType === 'third_party'
                        ? 'bg-white dark:bg-slate-900 border-rose-500 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white/60 dark:bg-slate-900/40 border-indigo-100 dark:border-indigo-900/40 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Users className="w-4 h-4 text-rose-500" />
                      <span>To Someone Else (Expense)</span>
                    </div>
                    <p className="text-[11px] opacity-80 leading-tight">
                      <strong>Direct Expense</strong> • Sending upkeep to family, paying landlord, supplier, colleague, or services.
                    </p>
                  </button>
                </div>
              </div>

              {/* Transfer Flow Visual Header */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Source Account</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{sourceBank.split(' ')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center px-2 py-1 bg-indigo-50 dark:bg-indigo-950 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      {transferRecipientType === 'third_party' ? 'Recipient' : 'Destination Wallet'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {transferRecipientType === 'third_party' 
                        ? recipientName || recipientNetwork.split(' ')[0]
                        : recipientNetwork.split(' ')[0]}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    transferRecipientType === 'third_party'
                      ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {transferRecipientType === 'third_party' ? <Users className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Quick Transfer Presets (for self or third party) */}
              <div>
                <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider block mb-1">
                  ⚡ Quick Transfer Shortcuts:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyTransferPreset('Equity Bank Uganda', 'MTN Mobile Money (*165#)', transferRecipientType === 'third_party' ? `Equity to MTN MoMo (${recipientName || 'Third Party'})` : 'Equity Bank to MTN MoMo Push')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                  >
                    🏦 Equity ➔ MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTransferPreset('Equity Bank Uganda', 'Airtel Money (*185#)', transferRecipientType === 'third_party' ? `Equity to Airtel Money (${recipientName || 'Third Party'})` : 'Equity Bank to Airtel Money Push')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                  >
                    🏦 Equity ➔ Airtel Money
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTransferPreset('Stanbic Bank Uganda', 'MTN Mobile Money (*165#)', transferRecipientType === 'third_party' ? `Stanbic to MTN MoMo (${recipientName || 'Third Party'})` : 'Stanbic FlexiPay to MTN MoMo')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                  >
                    🏦 Stanbic ➔ MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTransferPreset('Centenary Bank', 'Airtel Money (*185#)', transferRecipientType === 'third_party' ? `Centenary to Airtel (${recipientName || 'Third Party'})` : 'CenteMobile to Airtel Money')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                  >
                    🏦 Centenary ➔ Airtel
                  </button>
                </div>
              </div>

              {/* If Third-Party Transfer: Recipient Name & Expense Category */}
              {transferRecipientType === 'third_party' && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <Receipt className="w-4 h-4" />
                    <span>Third-Party Expense Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Recipient Name / Relation *
                      </label>
                      <input
                        type="text"
                        required={transferRecipientType === 'third_party'}
                        placeholder="e.g. Mother, Landlord, John Kamau, Contractor"
                        value={recipientName}
                        onChange={(e) => {
                          setRecipientName(e.target.value);
                          if (!title || title.startsWith('Transfer to')) {
                            setTitle(`Transfer to ${e.target.value || 'Recipient'}`);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Expense Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                      >
                        {THIRD_PARTY_TRANSFER_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Purpose Toggle: Work vs Personal */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Expense Purpose
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPurpose('personal');
                          setIsTaxDeductible(false);
                        }}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          purpose === 'personal'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Personal Expense
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPurpose('work');
                          setIsTaxDeductible(true);
                        }}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          purpose === 'work'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Work / Business
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank & Mobile Network Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-xs">
                    Source Bank Account
                  </label>
                  <select
                    value={sourceBank}
                    onChange={(e) => {
                      setSourceBank(e.target.value);
                      if (transferRecipientType === 'self') {
                        setTitle(`${e.target.value.split(' ')[0]} to Mobile Money Transfer (Self)`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    {UGANDA_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-xs">
                    Destination Mobile Network / Channel
                  </label>
                  <select
                    value={recipientNetwork}
                    onChange={(e) => setRecipientNetwork(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    {MOBILE_NETWORKS.map((net) => (
                      <option key={net} value={net}>{net}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipient Phone & Ref Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Recipient Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0772 123456 / 0701 654321"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Transaction Ref / SMS ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TX-982138 or MoMo Ref"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Accounting rule banner dynamically adapting to Self vs Third-Party */}
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                transferRecipientType === 'third_party'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                  : 'bg-indigo-100/70 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700/60 text-indigo-950 dark:text-indigo-200'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {transferRecipientType === 'third_party' ? (
                    <Receipt className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                  {transferRecipientType === 'third_party'
                    ? 'Third-Party Expense Accounting Rule'
                    : 'Bank Deduction & Wallet Inflow Rule'}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {transferRecipientType === 'third_party' ? (
                    <>
                      ✓ <strong>UGX {totalAmount.toLocaleString()}</strong> (Principal + Bank Fee) will be <strong>deducted from your Bank Account</strong> and <strong>logged as an Expense</strong> under <strong>{category}</strong>.<br />
                      ✓ This will count toward your monthly spending and budget tracking (NOT added to your personal MoMo wallet).
                    </>
                  ) : (
                    <>
                      ✓ <strong>UGX {totalAmount.toLocaleString()}</strong> will be <strong>deducted from your Overall Available Money in the Bank</strong> (Principal + transfer charge).<br />
                      ✓ <strong>UGX {numAmount.toLocaleString()}</strong> will be <strong>credited directly into your Mobile Money Wallet</strong> available for airtime, data bundles, and cashouts.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SPENDING SPECIFIC SECTION */}
          {/* ========================================================================= */}
          {entryMode === 'spending' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Where should this spending be deducted from?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeductionSource('cash_on_hand');
                    setPaymentMethod('Cash on Hand (From Cashout)');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    deductionSource === 'cash_on_hand'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Cash on Hand Drawer
                  </div>
                  <p className="text-[11px] opacity-80">
                    Deducted from physical cashout in pocket (e.g. meals, market, taxi)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeductionSource('mobile_money_bank');
                    setPaymentMethod('Mobile Money Direct (Airtime/Data/Pay)');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    deductionSource === 'mobile_money_bank'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    Mobile Money / Bank Pool
                  </div>
                  <p className="text-[11px] opacity-80">
                    Deducted from MoMo (Airtime, Data bundles, Voice minutes, Yaka)
                  </p>
                </button>
              </div>

              {/* Quick Presets for Airtime & Data */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  ⚡ Quick Presets (Airtime, Data, Minutes & Bills):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyQuickPreset('mtn_airtime')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition"
                  >
                    📱 MTN Airtime / Minutes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset('airtel_airtime')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 transition"
                  >
                    📱 Airtel Airtime / Minutes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset('mtn_data')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800 hover:bg-yellow-200 transition"
                  >
                    🌐 MTN Data Bundle
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset('airtel_data')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 hover:bg-red-200 transition"
                  >
                    🌐 Airtel Data Bundle
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset('yaka_power')}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition"
                  >
                    💡 Yaka Electricity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASHOUT SPECIFIC SECTION */}
          {/* ========================================================================= */}
          {entryMode === 'cashout' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cashout Source Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectCashoutSource('momo')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                    cashoutSource === 'momo'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-[11px]">📱 Mobile Money</span>
                  <span className="text-[10px] opacity-80">MTN / Airtel (0.5% tax)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCashoutSource('card')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                    cashoutSource === 'card'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-[11px]">💳 Debit Card / ATM</span>
                  <span className="text-[10px] opacity-80">Bank ATM (0% tax)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCashoutSource('agent')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                    cashoutSource === 'agent'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-[11px]">🏦 Bank Agent</span>
                  <span className="text-[10px] opacity-80">EquiDuuka / Agent</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Cashbook Flow Rule
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  This cashout total will be <strong>deducted from your digital funds</strong> and credited into your <strong>Cash on Hand Drawer</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SAVINGS SPECIFIC SECTION */}
          {/* ========================================================================= */}
          {entryMode === 'savings' && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Monthly Savings Goal Contribution
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                This deposit builds your Monthly Savings Goal! Savings are calculated <strong>minus any tax involved</strong> (Deposit Subtotal minus Tax).
              </p>
            </div>
          )}

          {/* Purpose Scope (Work vs Personal) */}
          {entryMode === 'spending' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Expense Purpose
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPurpose('work');
                    setIsTaxDeductible(true);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                    purpose === 'work'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Work Purpose
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPurpose('personal');
                    setIsTaxDeductible(false);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                    purpose === 'personal'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Personal Purpose
                </button>
              </div>
            </div>
          )}

          {/* Category Dropdown (if Spending) */}
          {entryMode === 'spending' && (
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                {CATEGORIES.filter((c) => c !== 'Bank to Mobile Transfer' && c !== 'Bank to Mobile Money Transfer').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              {entryMode === 'transfer'
                ? isThirdPartyTransfer
                  ? 'Transfer Title / Expense Description *'
                  : 'Transfer Description / Title *'
                : entryMode === 'savings'
                ? 'Savings Deposit Label *'
                : entryMode === 'cashout'
                ? 'Withdrawal Title / Source *'
                : 'What did you spend on? *'}
            </label>
            <input
              type="text"
              required
              placeholder={
                entryMode === 'transfer'
                  ? isThirdPartyTransfer
                    ? 'e.g., Transfer to Mother for upkeep, Rent to Landlord'
                    : 'e.g., Equity Bank to MTN MoMo Push (Self)'
                  : entryMode === 'savings'
                  ? 'e.g., Sacco Deposit, Fixed Deposit, Mobile Money Savings'
                  : entryMode === 'cashout'
                  ? 'e.g., MoMo Cash Withdrawal for Pocket Expenses'
                  : 'e.g., MTN Airtime 10,000, 5GB Monthly Data, Food at Cafe'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Amount Subtotal & Tax/Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {entryMode === 'transfer' ? 'Transfer Amount (UGX) *' : 'Subtotal Amount (UGX) *'}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {entryMode === 'transfer' ? 'Bank Transfer Fee / Charge' : 'Tax / Fee Incurred (UGX)'}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={taxAmount}
                onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-amber-600 dark:text-amber-400 font-bold focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Tax presets for spending and cashout */}
          {entryMode !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Uganda Tax Presets (%):
                </span>
                <span className="text-[10px] text-amber-500 font-medium">
                  0% Airtime/Data • 0.5% MoMo Send/Cashout
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {UGANDA_TAX_PRESETS.map((item) => (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => handleTaxRateChange(item.rate)}
                    title={item.label}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      taxRate === item.rate
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {item.code} {item.rate === 0.0 ? '(Exempt/Airtime)' : item.rate === 0.5 ? '(UG MoMo)' : item.rate === 18 ? '(VAT)' : item.rate === 6 ? '(WHT)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total / Net Calculated Banner */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/70 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs block">
                {entryMode === 'transfer'
                  ? isThirdPartyTransfer
                    ? 'Total Deducted from Bank as Expense (Principal + Fee):'
                    : 'Total Deducted from Bank (Principal + Fee):'
                  : entryMode === 'savings'
                  ? 'Net Savings Added (Subtotal - Tax):'
                  : 'Total Amount (Subtotal + Tax/Fee):'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {entryMode === 'transfer'
                  ? isThirdPartyTransfer
                    ? `Deducted from Bank Account → Logged as ${category} Expense`
                    : `Deducted from Bank Account → ${formatUGX(numAmount)} credited to MoMo Wallet`
                  : entryMode === 'cashout'
                  ? 'Deducted from Bank/MoMo → Added to Cash on Hand'
                  : deductionSource === 'mobile_money_bank'
                  ? 'Deducted directly from Mobile Money / Bank Digital Pool'
                  : 'Deducted from Cash on Hand (Cashout Drawer)'}
              </span>
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-base font-mono">
              {entryMode === 'savings' ? formatUGX(Math.max(0, numAmount - numTax)) : formatUGX(totalAmount)}
            </span>
          </div>

          {/* Date & Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            {entryMode !== 'transfer' && (
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Payee / Service Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. MTN Uganda, Airtel, Umeme, Supermarket"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Tax Deductible checkbox (for work spending or work third-party transfer) */}
          {((entryMode === 'spending' && purpose === 'work') || (isThirdPartyTransfer && purpose === 'work')) && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-emerald-900 dark:text-emerald-200 text-xs">
                <input
                  type="checkbox"
                  checked={isTaxDeductible}
                  onChange={(e) => setIsTaxDeductible(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <FileCheck className="w-4 h-4 text-emerald-500" />
                Tax Deductible Work Expense (URA Write-Off)
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Transaction Notes / Context
            </label>
            <input
              type="text"
              placeholder={
                entryMode === 'transfer'
                  ? isThirdPartyTransfer
                    ? 'e.g., Monthly upkeep remittance, school fees, rent deposit'
                    : 'e.g., Transfer for monthly airtime, data bundles & petty cash'
                  : 'e.g., Weekly 5GB data pack or airtime for client calls'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white font-semibold rounded-xl shadow-md transition ${
                entryMode === 'transfer'
                  ? isThirdPartyTransfer
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                  : entryMode === 'cashout'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : entryMode === 'savings'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {expenseToEdit 
                ? 'Save Changes' 
                : entryMode === 'transfer' 
                ? isThirdPartyTransfer
                  ? 'Log Transfer Expense'
                  : 'Execute Bank Transfer' 
                : 'Log Transaction'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
