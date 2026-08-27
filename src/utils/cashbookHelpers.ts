import { Expense, MonthlyBudget, Inflow, DebtItem, AccountType } from '../types';
import { normalizeMonthlySalary } from './salary';

/**
 * Check if an expense entry is a Bank to Mobile Money transfer or internal account transfer
 */
export function isBankToMobileTransfer(e: Expense): boolean {
  if (e.sourceAccount && e.destinationAccount) return true;
  if (e.isBankToMobileTransfer) return true;
  if (
    e.paymentMethod === 'Bank to Mobile Transfer (Bank-to-Wallet)' ||
    e.paymentMethod === 'Mobile Money to Mobile Money Transfer' ||
    e.paymentMethod === 'MTN to Airtel Transfer' ||
    e.paymentMethod === 'Airtel to MTN Transfer'
  ) return true;
  if (
    e.category === 'Bank to Mobile Transfer' ||
    e.category === 'Bank to Mobile Money Transfer' ||
    e.category === 'Mobile Money to Mobile Money Transfer' ||
    e.category === 'Internal Account Transfer'
  ) return true;
  const title = (e.title || '').toLowerCase();
  const notes = (e.notes || '').toLowerCase();
  return (
    title.includes('bank to mobile') ||
    title.includes('bank to momo') ||
    title.includes('push to momo') ||
    title.includes('bank-to-wallet') ||
    title.includes('bank to airtel') ||
    title.includes('bank to mtn') ||
    title.includes('mtn to airtel') ||
    title.includes('airtel to mtn') ||
    title.includes('momo to momo') ||
    notes.includes('bank to mobile') ||
    notes.includes('momo transfer')
  );
}

export function isInternalTransfer(e: Expense): boolean {
  if (e.transferRecipientType === 'third_party') return false;
  if (e.sourceAccount && e.destinationAccount) return e.sourceAccount !== e.destinationAccount;
  return isBankToMobileTransfer(e) && e.transferRecipientType !== 'third_party';
}

/**
 * Check if an expense is an internal transfer to oneself (Own MoMo Wallet or between accounts)
 */
export function isSelfBankToMobileTransfer(e: Expense): boolean {
  return isInternalTransfer(e);
}

/**
 * Check if a transfer is sent to a third party (friend, family, vendor, landlord, employee, contractor)
 * which makes it a direct EXPENSE rather than an internal balance shift.
 */
export function isThirdPartyTransferExpense(e: Expense): boolean {
  if (e.transferRecipientType === 'third_party') return true;
  if (
    (e.paymentMethod === 'Mobile Money Transfer' || e.paymentMethod === 'Bank Transfer') &&
    e.transferRecipientType !== 'self' &&
    e.category !== 'Bank to Mobile Transfer' &&
    e.category !== 'Mobile Money to Mobile Money Transfer'
  ) {
    return true;
  }
  return false;
}

/**
 * Check if an expense entry is a Cash Withdrawal / Cashout
 */
export function isWithdrawalEntry(e: Expense): boolean {
  if (isSelfBankToMobileTransfer(e)) return false;
  if (e.isSavings) return false;
  if (e.isWithdrawal) return true;
  if (
    e.paymentMethod === 'Mobile Money Cashout' ||
    e.paymentMethod === 'Debit Card / ATM Cashout' ||
    e.paymentMethod === 'Mobile Money Withdrawal' ||
    e.paymentMethod === 'Equity Bank Withdrawal' ||
    e.paymentMethod === 'Agent Withdrawal'
  ) {
    return true;
  }
  const title = (e.title || '').toLowerCase();
  return (
    (title.includes('cashout') || title.includes('atm withdrawal') || title.includes('agent withdrawal')) &&
    !title.includes('bank to mobile')
  );
}

/**
 * Check if an expense entry is a direct Mobile Money or Bank deduction (Airtime, Data, Bills, Third-Party Transfers)
 */
export function isDirectDigitalEntry(e: Expense): boolean {
  if (isSelfBankToMobileTransfer(e)) return false;
  if (isWithdrawalEntry(e)) return false;
  if (e.isSavings || e.category === 'Savings & Investments') return false;

  return (
    e.deductionSource === 'mobile_money_bank' ||
    e.deductionSource === 'mobile_money' ||
    e.deductionSource === 'bank_account' ||
    e.paymentMethod === 'Mobile Money Direct (Airtime/Data/Pay)' ||
    e.paymentMethod === 'Bank Direct / Card Online' ||
    e.paymentMethod === 'Mobile Money Transfer' ||
    e.paymentMethod === 'Bank Transfer' ||
    e.category === 'Airtime, Data & Minutes' ||
    (isBankToMobileTransfer(e) && e.transferRecipientType === 'third_party') ||
    (e.title &&
      (e.title.toLowerCase().includes('airtime') ||
        e.title.toLowerCase().includes('data bundle') ||
        e.title.toLowerCase().includes('yaka') ||
        e.title.toLowerCase().includes('minutes')))
  );
}

/**
 * Check if an expense entry is paid from Cash on Hand (pocket drawer)
 */
export function isCashOnHandSpending(e: Expense): boolean {
  if (isSelfBankToMobileTransfer(e)) return false;
  if (isWithdrawalEntry(e)) return false;
  if (e.isSavings || e.category === 'Savings & Investments') return false;
  if (isDirectDigitalEntry(e)) return false;
  return true;
}

/**
 * Check if an expense is a savings contribution
 */
export function isSavingsEntry(e: Expense): boolean {
  return !!e.isSavings || e.category === 'Savings & Investments';
}

export function getExpenseSourceAccount(e: Expense): AccountType {
  if (e.sourceAccount) return e.sourceAccount;
  if (e.deductionSource === 'bank_account') return 'bank_account';
  if (e.deductionSource === 'airtel_mobile_money') return 'airtel_mobile_money';
  if (e.deductionSource === 'mtn_mobile_money') return 'mtn_mobile_money';
  if (e.deductionSource === 'cash_on_hand') return 'cash_on_hand';
  
  const text = `${e.title || ''} ${e.paymentMethod || ''} ${e.category || ''}`.toLowerCase();
  if (text.includes('airtel to mtn') || (text.includes('airtel') && text.includes('transfer') && !text.includes('bank to airtel') && !text.includes('mtn to airtel'))) {
    return 'airtel_mobile_money';
  }
  if (text.includes('mtn to airtel') || (text.includes('mtn') && text.includes('transfer') && !text.includes('bank to mtn') && !text.includes('airtel to mtn'))) {
    return 'mtn_mobile_money';
  }
  if (text.includes('bank') || e.paymentMethod === 'Bank Direct / Card Online' || e.paymentMethod === 'Bank Transfer' || e.paymentMethod === 'Bank to Mobile Transfer (Bank-to-Wallet)') {
    return 'bank_account';
  }
  if (text.includes('airtel')) return 'airtel_mobile_money';
  if (text.includes('mtn') || text.includes('momo')) return 'mtn_mobile_money';
  if (isCashOnHandSpending(e)) return 'cash_on_hand';
  return 'bank_account';
}

export function getExpenseDestinationAccount(e: Expense): AccountType {
  if (e.destinationAccount) return e.destinationAccount;
  const text = `${e.title || ''} ${e.recipientMobileNetwork || ''} ${e.paymentMethod || ''} ${e.category || ''}`.toLowerCase();
  if (text.includes('airtel') || text.includes('*185#') || text.includes('to airtel')) return 'airtel_mobile_money';
  if (text.includes('mtn') || text.includes('*165#') || text.includes('momo') || text.includes('to mtn')) return 'mtn_mobile_money';
  if (text.includes('bank') || text.includes('equity') || text.includes('stanbic') || text.includes('centenary')) return 'bank_account';
  return 'mtn_mobile_money';
}

export interface CashbookBalances {
  recordedMonthsCount: number;
  grossSalary: number;
  localTax: number;
  nssfDeduction: number;
  netIncome: number; // Baseline Net Income

  // Inflows
  totalBankInflows: number; // Logged Bank Inflows OR baseline net income
  totalMoMoInflows: number; // Combined Mobile Money Inflows
  totalMtnInflows: number; // MTN specific Inflows
  totalAirtelInflows: number; // Airtel specific Inflows
  totalCashInflows: number; // Cash Drawer Inflows
  totalCombinedInflow: number; // Bank + MoMo + Cash Inflow + Debt Repayments Received
  totalLoggedGrossInflow: number; // Gross Inflows before taxes
  totalLoggedNetInflow: number; // Net Inflows received
  totalInflowsLogged: number; // Alias for totalLoggedNetInflow
  totalInflowTaxDeducted: number; // Withholding / PAYE deducted at source

  // Internal Transfers
  bankToMobileEntries: Expense[];
  totalBankToMobileTransferred: number; // Total transferred out of Bank (+ fees) -> Deducted from Bank
  totalBankToMobileReceivedInMoMo: number; // Principal amount credited to MoMo Wallet
  bankToMtn: number; // Principal credited to MTN from Bank
  bankToAirtel: number; // Principal credited to Airtel from Bank
  totalMtnReceived: number;
  totalAirtelReceived: number;
  mtnToAirtelPrincipal: number; // Principal credited to Airtel from MTN
  mtnToAirtelTotalDeducted: number; // Principal + Fee deducted from MTN
  airtelToMtnPrincipal: number; // Principal credited to MTN from Airtel
  airtelToMtnTotalDeducted: number; // Principal + Fee deducted from Airtel
  totalMtnToAirtelTransferred: number;
  totalAirtelToMtnTransferred: number;
  mtnToBankPrincipal: number;
  mtnToBankTotalDeducted: number;
  airtelToBankPrincipal: number;
  airtelToBankTotalDeducted: number;
  totalMoMoToBankReceived: number;

  // Direct Bank Spendings / ATM cashouts (paid directly from bank)
  directBankSpendings: number;
  atmCashouts: number;

  // Mobile Money Inflows and Outflows
  momoDirectSpendings: number; // Combined airtime, data, utilities, third party transfers
  mtnSpent: number; // Direct spending from MTN
  airtelSpent: number; // Direct spending from Airtel
  momoCashouts: number; // Combined MoMo agent withdrawals to cash drawer
  mtnCashouts: number; // Agent cashouts from MTN
  airtelCashouts: number; // Agent cashouts from Airtel

  // Cash on Hand Inflow and Outflows
  totalCashoutsReceived: number; // All cashouts (ATM + MoMo) credited to physical cash drawer
  totalCashSpendings: number; // Physical cash spent on groceries, food, transport

  // Savings
  totalSavings: number;

  // Debt Repayments Paid (Liabilities Outflow) & Received (Assets Collected)
  totalDebtRepaymentsPaid: number;
  bankDebtRepaymentsPaid: number;
  momoDebtRepaymentsPaid: number;
  mtnDebtRepaymentsPaid: number;
  airtelDebtRepaymentsPaid: number;
  cashDebtRepaymentsPaid: number;

  totalDebtRepaymentsReceived: number;
  bankDebtRepaymentsReceived: number;
  momoDebtRepaymentsReceived: number;
  mtnDebtRepaymentsReceived: number;
  airtelDebtRepaymentsReceived: number;
  cashDebtRepaymentsReceived: number;

  // Outflows & Net Cashflow
  totalCombinedOutflows: number; // All real expenses, debt repayments & transaction fees spent
  netCashflow: number; // Inflows - Outflows

  // Final Available Balances
  availableBankBalance: number; // Overall money available in the bank
  availableMobileMoneyBalance: number; // Combined money available in Mobile Money wallets
  availableMtnBalance: number; // Money available in MTN MoMo wallet
  availableAirtelBalance: number; // Money available in Airtel Money wallet
  availableCashOnHand: number; // Money in pocket cash drawer
  totalCombinedNetWorth: number; // Bank + MoMo + Cash
}

/**
 * Master Financial Calculator for Cashbook, Bank Balance, MoMo Wallet, Cash Drawer, Inflows, and Debt Payments
 */
export function calculateCashbookBalances(
  expenses: Expense[],
  budget: MonthlyBudget,
  recordedMonthsCount = 1,
  inflows: Inflow[] = [],
  debts: DebtItem[] = []
): CashbookBalances {
  const grossSalary = normalizeMonthlySalary(budget?.monthlySalary) * recordedMonthsCount;
  const localTax = (budget?.localTax !== undefined ? budget.localTax : 15000) * recordedMonthsCount;
  const nssfDeduction = (budget?.nssfDeduction !== undefined ? budget.nssfDeduction : 0) * recordedMonthsCount;
  const netIncome = Math.max(0, grossSalary - nssfDeduction - localTax);

  // 0. Process Cash Inflows (When money comes into accounts)
  const bankInflowEntries = inflows.filter((i) => i.destinationAccount === 'bank_account');
  const momoInflowEntries = inflows.filter((i) => i.destinationAccount === 'mobile_money' || i.destinationAccount === 'mtn_mobile_money' || i.destinationAccount === 'airtel_mobile_money');
  const mtnInflowEntries = inflows.filter((i) => i.destinationAccount === 'mtn_mobile_money' || (i.destinationAccount === 'mobile_money' && !i.destinationNetwork?.toLowerCase().includes('airtel')));
  const airtelInflowEntries = inflows.filter((i) => i.destinationAccount === 'airtel_mobile_money' || (i.destinationAccount === 'mobile_money' && i.destinationNetwork?.toLowerCase().includes('airtel')));
  const cashInflowEntries = inflows.filter((i) => i.destinationAccount === 'cash_on_hand');

  const loggedBankInflows = bankInflowEntries.reduce((sum, i) => sum + i.netAmount, 0);
  const loggedMoMoInflows = momoInflowEntries.reduce((sum, i) => sum + i.netAmount, 0);
  const loggedMtnInflows = mtnInflowEntries.reduce((sum, i) => sum + i.netAmount, 0);
  const loggedAirtelInflows = airtelInflowEntries.reduce((sum, i) => sum + i.netAmount, 0);
  const loggedCashInflows = cashInflowEntries.reduce((sum, i) => sum + i.netAmount, 0);

  const totalLoggedGrossInflow = inflows.reduce((sum, i) => sum + i.amount, 0);
  const totalLoggedNetInflow = inflows.reduce((sum, i) => sum + i.netAmount, 0);
  const totalInflowTaxDeducted = inflows.reduce((sum, i) => sum + (i.taxDeduction || 0), 0);

  // If user has recorded bank inflows, use logged bank inflows; otherwise fallback to baseline net salary
  const totalBankInflows = bankInflowEntries.length > 0 ? loggedBankInflows : netIncome;
  const totalMoMoInflows = loggedMoMoInflows;
  const totalMtnInflows = loggedMtnInflows;
  const totalAirtelInflows = loggedAirtelInflows;
  const totalCashInflows = loggedCashInflows;

  // 1. Process Debt Repayments
  // A. Borrowed debts: Repayments made (Money leaving account to repay someone)
  let bankDebtRepaymentsPaid = 0;
  let mtnDebtRepaymentsPaid = 0;
  let airtelDebtRepaymentsPaid = 0;
  let cashDebtRepaymentsPaid = 0;

  // B. Lent debts: Repayments collected (Money entering account from borrower)
  let bankDebtRepaymentsReceived = 0;
  let mtnDebtRepaymentsReceived = 0;
  let airtelDebtRepaymentsReceived = 0;
  let cashDebtRepaymentsReceived = 0;

  for (const debt of debts) {
    for (const rep of debt.repayments || []) {
      const amount = Number(rep.amount) || 0;
      if (amount <= 0) continue;

      const acct: AccountType = rep.account || (
        rep.paymentMethod === 'Bank Transfer' || rep.paymentMethod === 'Bank Direct / Card Online'
          ? 'bank_account'
          : rep.paymentMethod === 'Cash' || rep.paymentMethod === 'Cash on Hand (From Cashout)'
          ? 'cash_on_hand'
          : rep.paymentMethod === 'Airtel to MTN Transfer'
          ? 'airtel_mobile_money'
          : 'mtn_mobile_money'
      );

      if (debt.type === 'borrowed') {
        if (acct === 'bank_account') bankDebtRepaymentsPaid += amount;
        else if (acct === 'airtel_mobile_money') airtelDebtRepaymentsPaid += amount;
        else if (acct === 'cash_on_hand') cashDebtRepaymentsPaid += amount;
        else mtnDebtRepaymentsPaid += amount;
      } else if (debt.type === 'lent') {
        if (acct === 'bank_account') bankDebtRepaymentsReceived += amount;
        else if (acct === 'airtel_mobile_money') airtelDebtRepaymentsReceived += amount;
        else if (acct === 'cash_on_hand') cashDebtRepaymentsReceived += amount;
        else mtnDebtRepaymentsReceived += amount;
      }
    }
  }

  const momoDebtRepaymentsPaid = mtnDebtRepaymentsPaid + airtelDebtRepaymentsPaid;
  const totalDebtRepaymentsPaid = bankDebtRepaymentsPaid + momoDebtRepaymentsPaid + cashDebtRepaymentsPaid;

  const momoDebtRepaymentsReceived = mtnDebtRepaymentsReceived + airtelDebtRepaymentsReceived;
  const totalDebtRepaymentsReceived = bankDebtRepaymentsReceived + momoDebtRepaymentsReceived + cashDebtRepaymentsReceived;

  const totalCombinedInflow = totalBankInflows + totalMoMoInflows + totalCashInflows + totalDebtRepaymentsReceived;

  // 2. Internal Transfers (Bank to Mobile Money, MoMo to MoMo, MoMo to Bank)
  const selfInternalTransfers = expenses.filter((e) => isInternalTransfer(e));
  
  // Bank to Mobile Transfers
  const bankTransferEntries = selfInternalTransfers.filter(
    (e) => getExpenseSourceAccount(e) === 'bank_account' && getExpenseDestinationAccount(e) !== 'bank_account'
  );
  const totalBankToMobileTransferred = bankTransferEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalBankToMobileReceivedInMoMo = bankTransferEntries.reduce((sum, e) => sum + e.amount, 0);

  const bankToMtnEntries = bankTransferEntries.filter(
    (e) => getExpenseDestinationAccount(e) === 'mtn_mobile_money'
  );
  const bankToMtn = bankToMtnEntries.reduce((sum, e) => sum + e.amount, 0);

  const bankToAirtelEntries = bankTransferEntries.filter(
    (e) => getExpenseDestinationAccount(e) === 'airtel_mobile_money'
  );
  const bankToAirtel = bankToAirtelEntries.reduce((sum, e) => sum + e.amount, 0);

  // MoMo to MoMo Transfers
  const mtnToAirtelEntries = selfInternalTransfers.filter(
    (e) => getExpenseSourceAccount(e) === 'mtn_mobile_money' && getExpenseDestinationAccount(e) === 'airtel_mobile_money'
  );
  const mtnToAirtelPrincipal = mtnToAirtelEntries.reduce((sum, e) => sum + e.amount, 0);
  const mtnToAirtelTotalDeducted = mtnToAirtelEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  const airtelToMtnEntries = selfInternalTransfers.filter(
    (e) => getExpenseSourceAccount(e) === 'airtel_mobile_money' && getExpenseDestinationAccount(e) === 'mtn_mobile_money'
  );
  const airtelToMtnPrincipal = airtelToMtnEntries.reduce((sum, e) => sum + e.amount, 0);
  const airtelToMtnTotalDeducted = airtelToMtnEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  // MoMo to Bank Transfers (Wallet to Bank Deposit)
  const mtnToBankEntries = selfInternalTransfers.filter(
    (e) => getExpenseSourceAccount(e) === 'mtn_mobile_money' && getExpenseDestinationAccount(e) === 'bank_account'
  );
  const mtnToBankPrincipal = mtnToBankEntries.reduce((sum, e) => sum + e.amount, 0);
  const mtnToBankTotalDeducted = mtnToBankEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  const airtelToBankEntries = selfInternalTransfers.filter(
    (e) => getExpenseSourceAccount(e) === 'airtel_mobile_money' && getExpenseDestinationAccount(e) === 'bank_account'
  );
  const airtelToBankPrincipal = airtelToBankEntries.reduce((sum, e) => sum + e.amount, 0);
  const airtelToBankTotalDeducted = airtelToBankEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  const totalMoMoToBankReceived = mtnToBankPrincipal + airtelToBankPrincipal;

  const totalMtnReceived = bankToMtn + airtelToMtnPrincipal;
  const totalAirtelReceived = bankToAirtel + mtnToAirtelPrincipal;

  // 3. Direct Bank Spendings & ATM Card Cashouts
  const directBankEntries = expenses.filter(
    (e) =>
      !isInternalTransfer(e) &&
      !isSavingsEntry(e) &&
      !isWithdrawalEntry(e) &&
      (getExpenseSourceAccount(e) === 'bank_account' ||
        (isBankToMobileTransfer(e) && e.transferRecipientType === 'third_party' && (e.sourceAccount === 'bank_account' || !e.sourceAccount)))
  );
  const directBankSpendings = directBankEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  const atmCashoutEntries = expenses.filter(
    (e) =>
      isWithdrawalEntry(e) &&
      (e.deductionSource === 'bank_account' ||
        e.paymentMethod === 'Debit Card / ATM Cashout' ||
        e.paymentMethod === 'Equity Bank Withdrawal' ||
        (e.title && e.title.toLowerCase().includes('atm')))
  );
  const atmCashouts = atmCashoutEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  // 4. Mobile Money Outflows (Direct airtime/data/bills, Third-Party MoMo Transfers & MoMo cashouts)
  const momoDirectEntries = expenses.filter((e) => {
    if (isInternalTransfer(e) || isWithdrawalEntry(e) || isSavingsEntry(e)) return false;
    if (getExpenseSourceAccount(e) === 'bank_account' || isCashOnHandSpending(e)) return false;
    return (
      getExpenseSourceAccount(e) === 'mtn_mobile_money' ||
      getExpenseSourceAccount(e) === 'airtel_mobile_money' ||
      e.deductionSource === 'mobile_money_bank' ||
      e.deductionSource === 'mobile_money' ||
      e.paymentMethod === 'Mobile Money Direct (Airtime/Data/Pay)' ||
      e.paymentMethod === 'Mobile Money Transfer' ||
      e.category === 'Airtime, Data & Minutes' ||
      e.category === 'Utilities & Bills'
    );
  });
  const momoDirectSpendings = momoDirectEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  const momoCashoutEntries = expenses.filter(
    (e) =>
      isWithdrawalEntry(e) &&
      (getExpenseSourceAccount(e) === 'mtn_mobile_money' ||
        getExpenseSourceAccount(e) === 'airtel_mobile_money' ||
        e.paymentMethod === 'Mobile Money Cashout' ||
        e.paymentMethod === 'Mobile Money Withdrawal' ||
        (!e.paymentMethod.includes('ATM') && !e.paymentMethod.includes('Equity Bank') && e.paymentMethod !== 'Agent Withdrawal'))
  );
  const momoCashouts = momoCashoutEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const bankCashouts = expenses.filter((e) => isWithdrawalEntry(e) && getExpenseSourceAccount(e) === 'bank_account').reduce((sum, e) => sum + e.totalAmount, 0);

  // 5. Cash Drawer Inflow & Outflow
  const allCashoutEntries = expenses.filter((e) => isWithdrawalEntry(e));
  const totalCashoutsReceived = allCashoutEntries.reduce((sum, e) => sum + e.amount, 0);

  const cashSpendingEntries = expenses.filter((e) => isCashOnHandSpending(e));
  const totalCashSpendings = cashSpendingEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  // 6. Savings
  const savingsEntries = expenses.filter((e) => isSavingsEntry(e));
  const totalSavings = savingsEntries.reduce(
    (sum, e) => sum + Math.max(0, e.amount - (e.taxAmount || 0)),
    0
  );

  // 7. Wallet Spendings breakdown
  const mtnSpent = momoDirectEntries.filter((e) => getExpenseSourceAccount(e) === 'mtn_mobile_money').reduce((sum, e) => sum + e.totalAmount, 0);
  const airtelSpent = momoDirectEntries.filter((e) => getExpenseSourceAccount(e) === 'airtel_mobile_money').reduce((sum, e) => sum + e.totalAmount, 0);
  const mtnCashouts = momoCashoutEntries.filter((e) => getExpenseSourceAccount(e) === 'mtn_mobile_money').reduce((sum, e) => sum + e.totalAmount, 0);
  const airtelCashouts = momoCashoutEntries.filter((e) => getExpenseSourceAccount(e) === 'airtel_mobile_money').reduce((sum, e) => sum + e.totalAmount, 0);

  // 8. Final Available Balances
  // Bank Balance = Inflows + Debt Repayments Collected + MoMo to Bank In - Transfers Out - Direct Bank Spends - ATM Cashouts - Debt Repayments Paid
  const availableBankBalance = totalBankInflows + bankDebtRepaymentsReceived + totalMoMoToBankReceived - totalBankToMobileTransferred - directBankSpendings - bankCashouts - bankDebtRepaymentsPaid;

  // MTN MoMo Balance = Inflows + Debt Repayments Collected + Bank In + Airtel In - MoMo Spends - MoMo Cashouts - Transfers to Airtel - Transfers to Bank - Debt Repayments Paid
  const availableMtnBalance = totalMtnInflows + mtnDebtRepaymentsReceived + bankToMtn + airtelToMtnPrincipal - mtnSpent - mtnCashouts - mtnToAirtelTotalDeducted - mtnToBankTotalDeducted - mtnDebtRepaymentsPaid;

  // Airtel Money Balance = Inflows + Debt Repayments Collected + Bank In + MTN In - MoMo Spends - MoMo Cashouts - Transfers to MTN - Transfers to Bank - Debt Repayments Paid
  const availableAirtelBalance = totalAirtelInflows + airtelDebtRepaymentsReceived + bankToAirtel + mtnToAirtelPrincipal - airtelSpent - airtelCashouts - airtelToMtnTotalDeducted - airtelToBankTotalDeducted - airtelDebtRepaymentsPaid;

  const availableMobileMoneyBalance = availableMtnBalance + availableAirtelBalance;

  // Cash on Hand Drawer = Inflows + Debt Repayments Collected + Cashouts Received - Cash Spent - Debt Repayments Paid
  const availableCashOnHand = totalCashInflows + cashDebtRepaymentsReceived + totalCashoutsReceived - totalCashSpendings - cashDebtRepaymentsPaid;

  // Total Outflows (Direct Bank spend + MoMo spend + Cash spend + Transfer fees + Cashout fees + Debt Repayments Paid)
  const transferFees = selfInternalTransfers.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const cashoutFees = allCashoutEntries.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const totalCombinedOutflows = directBankSpendings + momoDirectSpendings + totalCashSpendings + transferFees + cashoutFees + totalDebtRepaymentsPaid;

  const netCashflow = totalCombinedInflow - totalCombinedOutflows;

  // Total Liquid Net Worth
  const totalCombinedNetWorth = availableBankBalance + availableMobileMoneyBalance + availableCashOnHand;

  return {
    recordedMonthsCount,
    grossSalary,
    localTax,
    nssfDeduction,
    netIncome,
    inflowEntries: inflows,
    totalBankInflows,
    totalMoMoInflows,
    totalMobileMoneyInflows: totalMoMoInflows,
    totalMtnInflows,
    totalAirtelInflows,
    totalCashInflows,
    totalCombinedInflow,
    totalLoggedGrossInflow,
    totalLoggedNetInflow,
    totalInflowsLogged: totalLoggedNetInflow,
    totalInflowTaxDeducted,
    bankToMobileEntries: selfInternalTransfers,
    totalBankToMobileTransferred,
    totalBankToMobileReceivedInMoMo,
    bankToMtn,
    bankToAirtel,
    totalMtnReceived,
    totalAirtelReceived,
    mtnToAirtelPrincipal,
    mtnToAirtelTotalDeducted,
    airtelToMtnPrincipal,
    airtelToMtnTotalDeducted,
    totalMtnToAirtelTransferred: mtnToAirtelPrincipal,
    totalAirtelToMtnTransferred: airtelToMtnPrincipal,
    mtnToBankPrincipal,
    mtnToBankTotalDeducted,
    airtelToBankPrincipal,
    airtelToBankTotalDeducted,
    totalMoMoToBankReceived,
    directBankSpendings,
    atmCashouts,
    momoDirectSpendings,
    mtnSpent,
    airtelSpent,
    momoCashouts,
    mtnCashouts,
    airtelCashouts,
    totalCashoutsReceived,
    totalCashSpendings,
    totalSavings,
    totalDebtRepaymentsPaid,
    bankDebtRepaymentsPaid,
    momoDebtRepaymentsPaid,
    mtnDebtRepaymentsPaid,
    airtelDebtRepaymentsPaid,
    cashDebtRepaymentsPaid,
    totalDebtRepaymentsReceived,
    bankDebtRepaymentsReceived,
    momoDebtRepaymentsReceived,
    mtnDebtRepaymentsReceived,
    airtelDebtRepaymentsReceived,
    cashDebtRepaymentsReceived,
    totalCombinedOutflows,
    netCashflow,
    availableBankBalance,
    availableMobileMoneyBalance,
    availableMtnBalance,
    availableAirtelBalance,
    availableCashOnHand,
    totalCombinedNetWorth,
  };
}
