import React, { useEffect, useRef, useState } from 'react';
import { Expense, PaymentMethod, DateFilterState } from './types';
import { Navbar } from './components/Navbar';
import { ExpenseView } from './components/ExpenseView';
import { ExpenseModal } from './components/ExpenseModal';
import { ExportImportModal } from './components/ExportImportModal';
import { deleteExpense, loadExpenses, saveExpense } from './api';
import { supabase, useSupabaseSession } from './auth';
import { AuthPage } from './components/AuthPage';

const localDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const currentDate = () => localDateString(new Date());
const currentMonth = () => currentDate().slice(0, 7);

export default function App() {
  const session = useSupabaseSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading');
  const [syncError, setSyncError] = useState<string | null>(null);
  const previousExpenses = useRef<Expense[] | null>(null);
  const syncQueue = useRef(Promise.resolve());

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('omnitrack_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [dateFilter, setDateFilter] = useState<DateFilterState>(() => {
    const storedMonth = localStorage.getItem('omnitrack_selected_month') || 'all';
    const savedMonth = storedMonth === 'all' || /^\d{4}-(0[1-9]|1[0-2])$/.test(storedMonth) ? storedMonth : 'all';
    const today = currentDate();
    return {
      mode: savedMonth === 'all' ? 'all' : 'month',
      selectedMonth: savedMonth === 'all' ? currentMonth() : savedMonth,
      selectedDay: today,
      startDate: `${today.slice(0, 7)}-01`,
      endDate: today,
    };
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('omnitrack_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => current === message ? null : current);
    }, 3500);
  };

  useEffect(() => {
    if (!session.data) {
      setExpenses([]);
      setIsLoaded(false);
      setSyncStatus('loading');
      setSyncError(null);
      previousExpenses.current = null;
      return;
    }

    let cancelled = false;
    setIsLoaded(false);
    setSyncStatus('loading');
    setSyncError(null);
    void loadExpenses()
      .then((loadedExpenses) => {
        if (cancelled) return;
        setExpenses(loadedExpenses);
        previousExpenses.current = loadedExpenses;
        setIsLoaded(true);
        setSyncStatus('saved');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Could not load expenses.';
        setSyncError(message);
        setSyncStatus('error');
        showToast(message);
      });

    return () => {
      cancelled = true;
    };
  }, [session.data]);

  useEffect(() => {
    if (!isLoaded || !session.data) return;
    const previous = previousExpenses.current;
    if (!previous) {
      previousExpenses.current = expenses;
      return;
    }

    const previousById = new Map(previous.map((expense) => [expense.id, expense]));
    const currentIds = new Set(expenses.map((expense) => expense.id));
    const changed = expenses.filter((expense) => (
      !previousById.has(expense.id) ||
      JSON.stringify(expense) !== JSON.stringify(previousById.get(expense.id))
    ));
    const removed = previous.filter((expense) => !currentIds.has(expense.id));
    if (changed.length === 0 && removed.length === 0) return;

    setSyncStatus('saving');
    const operation = syncQueue.current
      .then(async () => {
        await Promise.all([
          ...changed.map((expense) => saveExpense(expense)),
          ...removed.map((expense) => deleteExpense(expense.id)),
        ]);
        previousExpenses.current = expenses;
        setSyncStatus('saved');
        setSyncError(null);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Could not save expense changes.';
        setSyncStatus('error');
        setSyncError(message);
        showToast(message);
      });
    syncQueue.current = operation;
  }, [expenses, isLoaded, session.data]);

  const handleDateFilterChange = (filter: DateFilterState) => {
    setDateFilter(filter);
    localStorage.setItem('omnitrack_selected_month', filter.mode === 'all' ? 'all' : filter.selectedMonth);
  };

  const filterByDate = (expenseDate: string) => {
    const today = currentDate();
    if (dateFilter.mode === 'all') return true;
    if (dateFilter.mode === 'month') return expenseDate.slice(0, 7) === dateFilter.selectedMonth;
    if (dateFilter.mode === 'day') return expenseDate === dateFilter.selectedDay;
    if (dateFilter.mode === 'today') return expenseDate === today;
    if (dateFilter.mode === 'range') {
      return (!dateFilter.startDate || expenseDate >= dateFilter.startDate) &&
        (!dateFilter.endDate || expenseDate <= dateFilter.endDate);
    }
    if (dateFilter.mode === 'this_week') {
      const current = new Date(`${today}T12:00:00`);
      const weekday = current.getDay() || 7;
      current.setDate(current.getDate() - weekday + 1);
      const monday = localDateString(current);
      current.setDate(current.getDate() + 6);
      const sunday = localDateString(current);
      return expenseDate >= monday && expenseDate <= sunday;
    }
    return true;
  };

  const filteredExpenses = expenses.filter((expense) => filterByDate(expense.date));
  const availableMonths = Array.from(new Set([
    currentMonth(),
    dateFilter.selectedMonth,
    ...expenses.map((expense) => expense.date.slice(0, 7)),
  ])).filter((month) => /^\d{4}-\d{2}$/.test(month)).sort().reverse();

  const handleSaveExpense = (
    expenseData: Omit<Expense, 'id'>,
    editingId?: string,
    separateTaxAmount = 0,
    separateTaxRate = 0
  ) => {
    if (
      !Number.isFinite(expenseData.amount) ||
      expenseData.amount <= 0 ||
      !Number.isFinite(separateTaxAmount) ||
      separateTaxAmount < 0 ||
      !Number.isFinite(separateTaxRate) ||
      separateTaxRate < 0 ||
      !Number.isFinite(expenseData.taxAmount) ||
      expenseData.taxAmount < 0 ||
      !Number.isFinite(expenseData.totalAmount) ||
      expenseData.totalAmount < expenseData.amount
    ) {
      showToast('Enter a valid positive amount and non-negative tax or fee.');
      return;
    }

    const expenseDate = expenseData.date || currentDate();
    const taxPaymentMethod: PaymentMethod = expenseData.deductionSource === 'bank_account'
      ? 'Bank Direct / Card Online'
      : expenseData.deductionSource === 'cash_on_hand'
        ? 'Cash'
        : 'Mobile Money Direct (Airtime/Data/Pay)';

    if (editingId) {
      const existingTax = expenses.find((expense) => expense.isTaxEntry && expense.parentExpenseId === editingId);
      const taxEntry: Expense | null = separateTaxAmount > 0
        ? {
            ...(existingTax || expenseData),
            id: existingTax?.id || crypto.randomUUID(),
            title: `${expenseData.title} - Tax / Fee`,
            amount: separateTaxAmount,
            taxAmount: 0,
            taxRate: separateTaxRate,
            totalAmount: separateTaxAmount,
            paymentMethod: taxPaymentMethod,
            category: 'Taxes & Fees',
            deductionSource: expenseData.deductionSource,
            isTaxDeductible: expenseData.isTaxDeductible,
            isSavings: false,
            isWithdrawal: false,
            isBankToMobileTransfer: false,
            transferRecipientType: undefined,
            sourceAccount: undefined,
            destinationAccount: undefined,
            transferFee: undefined,
            isTaxEntry: true,
            parentExpenseId: editingId,
            vendor: expenseData.vendor,
            date: expenseDate,
            notes: `Tax or fee recorded separately for ${expenseData.title}`,
          }
        : null;

      setExpenses((previous) => {
        const updated = previous
          .filter((expense) => taxEntry || !(expense.isTaxEntry && expense.parentExpenseId === editingId))
          .map((expense) => expense.id === editingId ? { ...expense, ...expenseData, date: expenseDate } : expense);
        if (!taxEntry) return updated;
        return updated.some((expense) => expense.id === taxEntry.id)
          ? updated.map((expense) => expense.id === taxEntry.id ? taxEntry : expense)
          : [taxEntry, ...updated];
      });
      showToast(`Expense "${expenseData.title}" updated.`);
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...expenseData,
        date: expenseDate,
      };
      const taxEntry: Expense | null = separateTaxAmount > 0
        ? {
            ...newExpense,
            id: crypto.randomUUID(),
            title: `${expenseData.title} - Tax / Fee`,
            amount: separateTaxAmount,
            taxAmount: 0,
            taxRate: separateTaxRate,
            totalAmount: separateTaxAmount,
            paymentMethod: taxPaymentMethod,
            category: 'Taxes & Fees',
            isSavings: false,
            isWithdrawal: false,
            isBankToMobileTransfer: false,
            sourceAccount: undefined,
            destinationAccount: undefined,
            transferRecipientType: undefined,
            transferFee: undefined,
            isTaxEntry: true,
            parentExpenseId: newExpense.id,
            notes: `Tax or fee recorded separately for ${expenseData.title}`,
          }
        : null;
      setExpenses((previous) => taxEntry ? [newExpense, taxEntry, ...previous] : [newExpense, ...previous]);
      showToast(`Expense "${expenseData.title}" recorded${taxEntry ? ' with separate tax or fee' : ''}.`);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((previous) => {
      const selected = previous.find((expense) => expense.id === expenseId);
      return previous.filter((expense) => (
        expense.id !== expenseId &&
        !(selected && !selected.isTaxEntry && expense.isTaxEntry && expense.parentExpenseId === expenseId)
      ));
    });
    showToast('Expense record deleted.');
  };

  const handleEditExpense = (expense: Expense) => {
    if (expense.isTaxEntry) {
      showToast('Edit this tax or fee through its linked expense.');
      return;
    }
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const downloadBackup = (records: Expense[], reason: 'clear') => {
    const backup = { app: 'Expense Manager', exportedAt: new Date().toISOString(), expenses: records };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expense_Manager_before_${reason}_${currentDate()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleClearData = () => {
    if (!window.confirm('Clear all expense and linked tax/fee records? A JSON backup will download first. Other legacy cashbook records will not be changed.')) return;
    downloadBackup(expenses, 'clear');
    setExpenses([]);
    showToast('Expense records cleared.');
  };

  const handleImportData = (data: { expenses: Expense[] }) => {
    setExpenses(data.expenses);
    showToast('Expense backup imported.');
  };

  const handleRefresh = async () => {
    setSyncStatus('loading');
    setSyncError(null);
    try {
      await syncQueue.current;
      const latestExpenses = await loadExpenses();
      previousExpenses.current = latestExpenses;
      setExpenses(latestExpenses);
      setIsLoaded(true);
      setSyncStatus('saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not refresh expenses.';
      setSyncError(message);
      setSyncStatus('error');
      showToast(message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showToast(`Could not sign out: ${error.message}`);
        return;
      }
      setExpenses([]);
      previousExpenses.current = null;
      setIsLoaded(false);
      setSyncStatus('loading');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected sign-out error.';
      showToast(`Could not sign out: ${message}`);
    }
  };

  if (session.isPending) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">Checking your session…</main>;
  }
  if (!session.data) return <AuthPage />;

  if (!isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="max-w-md space-y-4 text-center">
          <p className={syncStatus === 'error' ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}>
            {syncStatus === 'error' ? syncError : 'Loading your expense records…'}
          </p>
          {syncStatus === 'error' && (
            <button type="button" onClick={() => void handleRefresh()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              Try again
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        dateFilter={dateFilter}
        onDateFilterChange={handleDateFilterChange}
        availableMonths={availableMonths}
        onOpenExpenseModal={() => {
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onClearData={handleClearData}
        onRefresh={() => void handleRefresh()}
        onSignOut={() => void handleSignOut()}
        theme={theme}
        onToggleTheme={() => setTheme((previous) => previous === 'dark' ? 'light' : 'dark')}
      />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {syncStatus === 'error' && syncError && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <span>Could not sync expense changes: {syncError}</span>
            <button type="button" onClick={() => void handleRefresh()} className="font-semibold underline">Retry</button>
          </div>
        )}
        <ExpenseView
          expenses={filteredExpenses}
          onAddExpense={() => {
            setExpenseToEdit(null);
            setIsExpenseModalOpen(true);
          }}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-2 text-xs text-slate-500 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${syncStatus === 'error' ? 'bg-rose-500' : syncStatus === 'saving' ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
            {syncStatus === 'saving' ? 'Saving expenses…' : syncStatus === 'error' ? 'Sync issue' : 'Expenses synced'}
          </span>
          <span className="hidden sm:inline">Expense Manager</span>
        </div>
      </footer>

      {toastMessage && (
        <div role="status" className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-slate-700">
          {toastMessage}
        </div>
      )}

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        existingTaxAmount={
          expenseToEdit
            ? expenses.find((expense) => expense.isTaxEntry && expense.parentExpenseId === expenseToEdit.id)?.amount ?? expenseToEdit.taxAmount
            : 0
        }
        existingTaxRate={
          expenseToEdit
            ? expenses.find((expense) => expense.isTaxEntry && expense.parentExpenseId === expenseToEdit.id)?.taxRate ?? expenseToEdit.taxRate ?? 0
            : 0
        }
      />
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        onImportData={handleImportData}
      />
    </div>
  );
}
