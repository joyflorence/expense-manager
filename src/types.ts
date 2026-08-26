export type PurposeType = 'work' | 'personal';
export type AccountType = 'bank_account' | 'mtn_mobile_money' | 'airtel_mobile_money' | 'cash_on_hand' | 'mobile_money';

export type DateFilterMode = 'all' | 'month' | 'day' | 'range' | 'today' | 'this_week';

export interface DateFilterState {
  mode: DateFilterMode;
  selectedMonth: string; // 'YYYY-MM' or 'all'
  selectedDay: string; // 'YYYY-MM-DD'
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
}

export type InflowCategory =
  | 'Salary & Wages'
  | 'Freelance & Gigs'
  | 'Business & Sales'
  | 'Client Payment'
  | 'Mobile Money Received'
  | 'Bank Deposit & Wire'
  | 'Gift & Support'
  | 'Debt Repayment Received'
  | 'Rental & Investment'
  | 'Refund & Reimbursement'
  | 'Side Hustle'
  | 'Other Inflow';

export type InflowDestination = AccountType;

export interface Inflow {
  id: string;
  title: string;
  amount: number; // Gross amount received
  taxDeduction?: number; // PAYE / WHT / local taxes deducted at source (if any)
  netAmount: number; // amount - (taxDeduction || 0)
  destinationAccount: InflowDestination;
  destinationBank?: string; // e.g. Equity Bank Uganda, Stanbic, Centenary, DFCU, Absa, etc.
  destinationNetwork?: string; // e.g. MTN Mobile Money (*165#), Airtel Money (*185#)
  category: InflowCategory;
  payerSource?: string; // Person, company, client, relative or platform who paid
  date: string; // YYYY-MM-DD
  referenceNumber?: string; // Transaction reference, Bank slip or MoMo SMS code
  notes?: string;
}

export type ExpenseCategory =
  | 'Bank to Mobile Transfer'
  | 'Bank to Mobile Money Transfer'
  | 'Mobile Money to Mobile Money Transfer'
  | 'Internal Account Transfer'
  | 'Family Support & Upkeep'
  | 'Airtime, Data & Minutes'
  | 'Software & Tools'
  | 'Office Supplies'
  | 'Dining & Meals'
  | 'Travel & Commute'
  | 'Client Expenses'
  | 'Groceries'
  | 'Utilities & Bills'
  | 'Health & Wellness'
  | 'Subscriptions'
  | 'Shopping & Personal'
  | 'Savings & Investments'
  | 'Salary Inflow'
  | 'Cashout Inflow'
  | 'Other';

export type PaymentMethod =
  | 'Bank to Mobile Transfer (Bank-to-Wallet)'
  | 'Mobile Money to Mobile Money Transfer'
  | 'MTN to Airtel Transfer'
  | 'Airtel to MTN Transfer'
  | 'Mobile Money Direct (Airtime/Data/Pay)'
  | 'Bank Direct / Card Online'
  | 'Mobile Money Cashout'
  | 'Debit Card / ATM Cashout'
  | 'Mobile Money Withdrawal'
  | 'Equity Bank Withdrawal'
  | 'Agent Withdrawal'
  | 'Cash on Hand (From Cashout)'
  | 'Mobile Money Transfer'
  | 'Bank Transfer'
  | 'Cash'
  | 'Credit/Debit Card';

export interface Expense {
  id: string;
  title: string;
  amount: number; // Subtotal before tax
  taxAmount: number; // Tax / Transfer Fee amount in currency
  taxRate?: number; // Tax percentage (e.g. 0.5% or 0)
  totalAmount: number; // total = amount + taxAmount
  purpose: PurposeType;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  isTaxDeductible: boolean;
  deductionSource?: AccountType; // Where spending is deducted from
  isSavings?: boolean; // True if this entry is a deposit into savings / savings goal contribution
  isWithdrawal?: boolean; // True if this entry represents a cash withdrawal / cashout
  isBankToMobileTransfer?: boolean; // True if this entry is a money transfer from bank to mobile wallet
  transferRecipientType?: 'self' | 'third_party'; // 'self' = Own MoMo Wallet, 'third_party' = Someone Else (Logged as Expense)
  recipientName?: string; // Recipient person, business or vendor name if sending to someone else
  sourceBank?: string; // e.g. Equity Bank, Stanbic Bank, Centenary Bank, DFCU, Absa, PostBank
  recipientMobileNetwork?: string; // e.g. MTN Mobile Money, Airtel Money
  recipientPhone?: string; // Phone number or MoMo account
  transferFee?: number; // Bank transfer transaction charge
  sourceAccount?: AccountType; // Account money leaves for an internal transfer
  destinationAccount?: AccountType; // Account money enters for an internal transfer
  referenceNumber?: string; // Bank / MoMo reference or transaction ID
  vendor?: string;
  notes?: string;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM format, e.g. '2026-08'
  workBudget: number;
  personalBudget: number;
  monthlySalary?: number; // Gross salary in UGX, e.g. 500000
  savingsTarget?: number; // Target monthly savings in UGX, e.g. 20000
  localTax?: number; // Local tax deduction in UGX, default: 15000
  nssfDeduction?: number; // NSSF contribution in UGX, default: 0
}

export type DebtType = 'borrowed' | 'lent'; // 'borrowed' = Money I owe, 'lent' = Money I lent or sent to friend/relative

export type DebtPartyRelationship = 'mobile_money' | 'bank_financial' | 'friend' | 'relative' | 'colleague' | 'business' | 'other';

export type DebtStatus = 'active' | 'partially_repaid' | 'fully_repaid' | 'overdue' | 'forgiven_gift';

export interface DebtRepayment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  account?: AccountType; // Where repayment was deducted from (borrowed) or deposited into (lent)
  referenceNumber?: string;
  notes?: string;
}

export interface DebtItem {
  id: string;
  title: string;
  type: DebtType;
  counterpartyName: string;
  relationship: DebtPartyRelationship;
  originalAmount: number;
  repaidAmount: number;
  interestRate?: number; // annual % or fee rate
  dueDate?: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
  status: DebtStatus;
  purpose: PurposeType;
  isGiftOrRemittance?: boolean; // True if money was sent as family support / gift not expected back
  notes?: string;
  repayments: DebtRepayment[];
}

