import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Plus, Receipt, ArrowDownLeft, LogOut } from 'lucide-react';
import { Expense, MonthlyBudget, DebtItem, Inflow, PaymentMethod } from './types';
import { INITIAL_EXPENSES, INITIAL_BUDGETS, INITIAL_DEBTS, INITIAL_INFLOWS } from './data/mockData';
import { Navbar, ViewTab } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { ExpenseView } from './components/ExpenseView';
import { AnalyticsView } from './components/AnalyticsView';
import { DebtView } from './components/DebtView';
import { ExpenseModal } from './components/ExpenseModal';
import { InflowModal } from './components/InflowModal';
import { BudgetModal } from './components/BudgetModal';
import { DebtModal } from './components/DebtModal';
import { RepaymentModal } from './components/RepaymentModal';
import { ExportImportModal } from './components/ExportImportModal';
import { CashbookState, loadCashbook, saveRecord, deleteRecord, RecordKind } from './api';
import { authClient } from './auth';
import { AuthPage } from './components/AuthPage';

export default function App() {
  const session = authClient.useSession();
  // Financial Cashbook State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inflows, setInflows] = useState<Inflow[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading');
  const [syncError, setSyncError] = useState<string | null>(null);
  const previousRecords = useRef<CashbookState | null>(null);
  const syncQueue = useRef(Promise.resolve());

  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');

  // Theme state logic (Dark vs Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('omnitrack_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('omnitrack_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return localStorage.getItem('omnitrack_selected_month') || 'all';
  });

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseModalInitialMode, setExpenseModalInitialMode] = useState<'spending' | 'transfer' | 'cashout' | 'savings' | undefined>(undefined);

  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [inflowToEdit, setInflowToEdit] = useState<Inflow | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtItem | null>(null);

  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [debtForRepayment, setDebtForRepayment] = useState<DebtItem | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const downloadBackup = (reason: 'clear' | 'reset') => {
    const backup = { app: 'OmniTrack Cashbook', exportedAt: new Date().toISOString(), expenses, inflows, budgets, debts };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `OmniTrack_before_${reason}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
  const isPositiveAmount = (value: number) => Number.isFinite(value) && value > 0;

  const applyRemoteState = (state: CashbookState) => {
    setExpenses(state.expenses || []);
    setInflows(state.inflows || []);
    setBudgets(state.budgets || []);
    setDebts(state.debts || []);
  };

  useEffect(() => {
    if (!session.data) {
      setIsLoaded(false);
      previousRecords.current = null;
      return;
    }
    let cancelled = false;
    setIsLoaded(false);
    setSyncStatus('loading');
    setSyncError(null);
    void loadCashbook()
      .then((state) => {
        if (cancelled) return;
        applyRemoteState(state);
        previousRecords.current = state;
        setIsLoaded(true);
        setSyncStatus('saved');
        setSyncError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setIsLoaded(false);
        setSyncStatus('error');
        const message = error instanceof Error ? error.message : 'Could not connect to the cashbook database.';
        setSyncError(message);
        showToast(message);
      });
    return () => {
      cancelled = true;
    };
  }, [session.data]);

  useEffect(() => {
    if (!isLoaded || !session.data) return;
    const current: CashbookState = { expenses, inflows, budgets, debts };
    const previous = previousRecords.current;
    if (!previous) {
      previousRecords.current = current;
      return;
    }

    const groups: Array<[RecordKind, Array<{ id?: string }>, Array<{ id?: string }>]> = [
      ['expense', current.expenses, previous.expenses],
      ['inflow', current.inflows, previous.inflows],
      ['budget', current.budgets.map((budget) => ({ ...budget, id: budget.month })), previous.budgets.map((budget) => ({ ...budget, id: budget.month }))],
      ['debt', current.debts, previous.debts],
    ];
    const writes: Promise<unknown>[] = [];
    for (const [kind, currentRecords, previousRecordsForKind] of groups) {
      const previousById = new Map(previousRecordsForKind.map((record) => [record.id, record]));
      for (const record of currentRecords) {
        if (record.id && JSON.stringify(record) !== JSON.stringify(previousById.get(record.id))) {
          writes.push(saveRecord(kind, record));
        }
      }
      const currentIds = new Set(currentRecords.map((record) => record.id));
      for (const record of previousRecordsForKind) {
        if (record.id && !currentIds.has(record.id)) writes.push(deleteRecord(kind, record.id));
      }
    }
    if (writes.length === 0) return;
    setSyncStatus('saving');
    syncQueue.current = syncQueue.current
      .catch(() => undefined)
      .then(() => Promise.all(writes))
      .then(() => {
        previousRecords.current = current;
        setSyncStatus('saved');
      })
      .catch(() => setSyncStatus('error'));
  }, [isLoaded, session.data, expenses, inflows, budgets, debts]);

  useEffect(() => {
    localStorage.setItem('omnitrack_selected_month', selectedMonth);
  }, [selectedMonth]);

  // Refresh data handler
  const handleRefresh = () => {
    setSyncStatus('loading');
    setSyncError(null);
    void loadCashbook()
      .then((state) => {
        applyRemoteState(state);
        previousRecords.current = state;
        setIsLoaded(true);
        setSyncStatus('saved');
        setSyncError(null);
        showToast(`Data Synced! ${state.expenses.length} transactions, ${state.inflows.length} inflows loaded.`);
      })
      .catch((error) => {
        setSyncStatus('error');
        const message = error instanceof Error ? error.message : 'Could not refresh from Neon.';
        setSyncError(message);
        showToast(message);
      });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    setIsLoaded(false);
    setExpenses([]);
    setInflows([]);
    setBudgets([]);
    setDebts([]);
    previousRecords.current = null;
  };

  const handleRetrySync = () => {
    handleRefresh();
  };

  // Derived available months list
  const availableMonths = [
    'all',
    ...Array.from(
      new Set([
        ...expenses.map((e) => (e.date ? e.date.slice(0, 7) : '2026-08')),
        ...inflows.map((i) => (i.date ? i.date.slice(0, 7) : '2026-08')),
        ...budgets.map((b) => b.month),
        '2026-07',
        '2026-08',
      ])
    ).filter((m) => m && m.length === 7 && m !== 'all').sort().reverse(),
  ];

  // Current month filtered data
  const currentMonthExpenses = selectedMonth === 'all'
    ? expenses
    : expenses.filter((e) => {
        const d = e.date;
        if (!d) return true;
        return d.slice(0, 7) === selectedMonth;
      });

  const currentMonthInflows = selectedMonth === 'all'
    ? inflows
    : inflows.filter((i) => {
        const d = i.date;
        if (!d) return true;
        return d.slice(0, 7) === selectedMonth;
      });

  const currentBudget =
    budgets.find((b) => b.month === selectedMonth) || {
      month: selectedMonth === 'all' ? '2026-08' : selectedMonth,
      workBudget: 200000,
      personalBudget: 200000,
      monthlySalary: 500000,
      savingsTarget: 20000,
      localTax: 15000,
      nssfDeduction: 0,
    };

  // Inflow handlers
  const handleSaveInflow = (inflowData: Omit<Inflow, 'id'>, editingId?: string) => {
    if (!isPositiveAmount(inflowData.amount) || (inflowData.taxDeduction || 0) < 0 || inflowData.netAmount < 0) {
      showToast('Enter a valid positive inflow amount and non-negative deductions.');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const infDate = inflowData.date || todayStr;

    if (editingId) {
      setInflows((prev) => {
        const updated = prev.map((i) => (i.id === editingId ? { ...i, ...inflowData, date: infDate } : i));
        return updated;
      });
      showToast(`Inflow "${inflowData.title}" updated!`);
    } else {
      const newInflow: Inflow = {
        id: createId('inf'),
        ...inflowData,
        date: infDate,
      };
      setInflows((prev) => {
        const updated = [newInflow, ...prev];
        return updated;
      });
      showToast(`Cash Inflow "${inflowData.title}" (+${inflowData.amount.toLocaleString()} UGX) logged!`);
    }

    const targetMonth = infDate.slice(0, 7);
    if (targetMonth && targetMonth.length === 7 && selectedMonth !== 'all' && selectedMonth !== targetMonth) {
      setSelectedMonth(targetMonth);
    }
    setInflowToEdit(null);
  };

  const handleDeleteInflow = (inflowId: string) => {
    if (!window.confirm('Delete this inflow record? This cannot be undone.')) return;
    setInflows((prev) => {
      const updated = prev.filter((i) => i.id !== inflowId);
      return updated;
    });
    showToast('Inflow record deleted');
  };

  // Expense handlers
  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>, editingId?: string) => {
    if (!isPositiveAmount(expenseData.amount) || expenseData.taxAmount < 0 || expenseData.totalAmount < expenseData.amount) {
      showToast('Enter a valid positive amount and non-negative fee or tax.');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const expDate = expenseData.date || todayStr;

    if (editingId) {
      setExpenses((prev) => {
        const updated = prev.map((e) => (e.id === editingId ? { ...e, ...expenseData, date: expDate } : e));
        return updated;
      });
      showToast(`Transaction "${expenseData.title}" updated!`);
    } else {
      const newExpense: Expense = {
        id: createId('exp'),
        ...expenseData,
        date: expDate,
      };
      setExpenses((prev) => {
        const updated = [newExpense, ...prev];
        return updated;
      });
      showToast(`Transaction "${expenseData.title}" logged successfully!`);
    }

    // Auto-switch view month if expense date is in a different month
    const targetMonth = expDate.slice(0, 7);
    if (targetMonth && targetMonth.length === 7 && selectedMonth !== 'all' && selectedMonth !== targetMonth) {
      setSelectedMonth(targetMonth);
    }
    setExpenseToEdit(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== expenseId);
      return updated;
    });
    showToast('Transaction deleted');
  };

  // Budget handler
  const handleSaveBudget = (updatedBudget: MonthlyBudget) => {
    if (updatedBudget.workBudget < 0 || updatedBudget.personalBudget < 0 || (updatedBudget.monthlySalary || 0) < 0 || (updatedBudget.savingsTarget || 0) < 0) {
      showToast('Budget amounts cannot be negative.');
      return;
    }
    setBudgets((prev) => {
      const exists = prev.some((b) => b.month === updatedBudget.month);
      if (exists) {
        return prev.map((b) => (b.month === updatedBudget.month ? updatedBudget : b));
      }
      return [...prev, updatedBudget];
    });
    showToast('Salary and financial targets saved!');
  };

  const handleUpdateBudgetSalary = (salary: number, savingsTarget: number) => {
    const targetMonth = selectedMonth === 'all' ? '2026-08' : selectedMonth;
    setBudgets((prev) => {
      const existing = prev.find((b) => b.month === targetMonth);
      if (existing) {
        return prev.map((b) =>
          b.month === targetMonth
            ? { ...b, monthlySalary: salary, savingsTarget }
            : b
        );
      } else {
        return [
          ...prev,
          {
            month: targetMonth,
            workBudget: 200000,
            personalBudget: 200000,
            monthlySalary: salary,
            savingsTarget,
            localTax: 15000,
            nssfDeduction: 0,
          },
        ];
      }
    });
    showToast(`Salary set to ${salary.toLocaleString()} UGX & Target Savings set to ${savingsTarget.toLocaleString()} UGX`);
  };

  // Debt & Loan Handlers
  const handleSaveDebt = (debtData: Omit<DebtItem, 'id' | 'repaidAmount' | 'status' | 'repayments'>) => {
    if (!isPositiveAmount(debtData.originalAmount)) {
      showToast('Enter a valid positive debt amount.');
      return;
    }
    if (debtToEdit) {
      setDebts((prev) =>
        prev.map((d) =>
          d.id === debtToEdit.id
            ? {
                ...d,
                ...debtData,
                status:
                  d.repaidAmount >= debtData.originalAmount
                    ? 'fully_repaid'
                    : debtData.isGiftOrRemittance
                    ? 'forgiven_gift'
                    : 'active',
              }
            : d
        )
      );
      showToast(`Updated debt/transfer record "${debtData.title}"`);
    } else {
      const newDebt: DebtItem = {
        ...debtData,
        id: createId('debt'),
        repaidAmount: 0,
        status: debtData.isGiftOrRemittance ? 'forgiven_gift' : 'active',
        repayments: [],
      };
      setDebts((prev) => [newDebt, ...prev]);
      showToast(`Added new debt/transfer record "${debtData.title}"`);
    }
  };

  const handleDeleteDebt = (debtId: string) => {
    if (!window.confirm('Delete this debt record and its repayment history? This cannot be undone.')) return;
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    showToast('Deleted debt/transfer record');
  };

  const handleSaveRepayment = (
    debtId: string,
    amount: number,
    date: string,
    paymentMethod: PaymentMethod | undefined,
    notes: string
  ) => {
    const debt = debts.find((item) => item.id === debtId);
    if (!debt || !isPositiveAmount(amount) || amount > Math.max(0, debt.originalAmount - debt.repaidAmount)) {
      showToast('Repayment must be positive and cannot exceed the remaining balance.');
      return;
    }
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const newRepaidAmount = d.repaidAmount + amount;
        const isSettled = newRepaidAmount >= d.originalAmount;
        const newRepayments = [
          ...(d.repayments || []),
          {
            id: createId('rep'),
            amount,
            date,
            paymentMethod,
            notes,
          },
        ];

        return {
          ...d,
          repaidAmount: newRepaidAmount,
          status: isSettled ? 'fully_repaid' : 'partially_repaid',
          repayments: newRepayments,
        };
      })
    );
    showToast(`Logged payment of ${amount.toLocaleString()} UGX`);
  };

  const handleToggleFullyRepaid = (debtId: string) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const currentlyRepaid = d.status === 'fully_repaid' || d.repaidAmount >= d.originalAmount;
        return {
          ...d,
          repaidAmount: currentlyRepaid ? 0 : d.originalAmount,
          status: currentlyRepaid ? 'active' : 'fully_repaid',
        };
      })
    );
    showToast('Updated repayment status');
  };

  // Clear all data for clean slate
  const handleClearData = () => {
    if (!window.confirm('Clear all expenses, inflows, budgets, debts, and repayment history from Neon? A JSON backup will download before deletion.')) return;
    downloadBackup('clear');
    setExpenses([]);
    setInflows([]);
    setBudgets([]);
    setDebts([]);
    showToast('Cleared all cashbook transactions and debt registers.');
  };

  // Reset clean baseline data
  const handleResetData = () => {
    if (!window.confirm('Reset this cashbook to the app baseline, replacing your expenses, inflows, budgets, debts, and repayment history? A JSON backup will download first.')) return;
    downloadBackup('reset');
    setExpenses(INITIAL_EXPENSES);
    setInflows(INITIAL_INFLOWS);
    setBudgets(INITIAL_BUDGETS);
    setDebts(INITIAL_DEBTS);
    showToast('Clean cashbook slate ready for your entries.');
  };

  // Import JSON backup
  const handleImportData = (data: { expenses: Expense[]; inflows?: Inflow[]; budgets: MonthlyBudget[]; debts?: DebtItem[] }) => {
    if (data.expenses) setExpenses(data.expenses);
    if (data.inflows) setInflows(data.inflows);
    if (data.budgets) setBudgets(data.budgets);
    if (data.debts) setDebts(data.debts);
  };

  if (session.isPending) {
    return <main className="min-h-screen bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300 grid place-items-center">Checking your session…</main>;
  }

  if (!session.data) return <AuthPage />;

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 grid place-items-center p-5">
        <div className="max-w-md space-y-4 text-center">
          <p className={syncStatus === 'error' ? 'text-rose-400' : 'text-slate-300'}>
            {syncStatus === 'error' ? 'Could not load your cashbook from Neon.' : 'Loading your cashbook…'}
          </p>
          {syncStatus === 'error' && (
            <>
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-left text-xs text-rose-200 break-words">{syncError || 'The cashbook API did not return a reason.'}</p>
              <p className="text-left text-xs text-slate-400">Confirm `DATABASE_URL` uses Neon’s authenticated connection string and run migrations 0001 through 0004 on the same branch.</p>
              <button type="button" onClick={handleRefresh} className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950">
                Retry loading cashbook
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        availableMonths={availableMonths}
        onOpenExpenseModal={() => {
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenInflowModal={() => {
          setInflowToEdit(null);
          setIsInflowModalOpen(true);
        }}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onClearData={handleClearData}
        onResetData={handleResetData}
        onRefresh={handleRefresh}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {currentTab === 'overview' && (
          <OverviewView
            expenses={currentMonthExpenses}
            inflows={currentMonthInflows}
            debts={debts}
            budget={currentBudget}
            selectedMonth={selectedMonth}
            onEditExpense={(expense) => {
              setExpenseToEdit(expense);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onOpenExpenseModal={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenInflowModal={() => {
              setInflowToEdit(null);
              setIsInflowModalOpen(true);
            }}
            onEditInflow={(inflow) => {
              setInflowToEdit(inflow);
              setIsInflowModalOpen(true);
            }}
            onDeleteInflow={handleDeleteInflow}
            onNavigateToTab={setCurrentTab}
            onUpdateBudgetSalary={handleUpdateBudgetSalary}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpenseView
            expenses={currentMonthExpenses}
            onAddExpense={() => {
              setExpenseToEdit(null);
              setExpenseModalInitialMode('spending');
              setIsExpenseModalOpen(true);
            }}
            onOpenTransferModal={() => {
              setExpenseToEdit(null);
              setExpenseModalInitialMode('transfer');
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(exp) => {
              setExpenseToEdit(exp);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {currentTab === 'debts' && (
          <DebtView
            debts={debts}
            monthlySalary={currentBudget.monthlySalary || 500000}
            onOpenDebtModal={() => {
              setDebtToEdit(null);
              setIsDebtModalOpen(true);
            }}
            onEditDebt={(debt) => {
              setDebtToEdit(debt);
              setIsDebtModalOpen(true);
            }}
            onDeleteDebt={handleDeleteDebt}
            onOpenRepaymentModal={(debt) => {
              setDebtForRepayment(debt);
              setIsRepaymentModalOpen(true);
            }}
            onToggleFullyRepaid={handleToggleFullyRepaid}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            expenses={currentMonthExpenses}
            inflows={currentMonthInflows}
            budget={currentBudget}
            selectedMonth={selectedMonth}
          />
        )}
      </main>

      {/* Footer Status Bar with Quick Action */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 px-4 py-2 text-[11px] text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={syncStatus === 'error' ? handleRetrySync : undefined}
            className={`flex items-center gap-1.5 font-semibold ${syncStatus === 'error' ? 'text-rose-600 dark:text-rose-400 underline cursor-pointer' : 'text-emerald-600 dark:text-emerald-400'}`}
          >
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'error' ? 'bg-rose-500' : syncStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {syncStatus === 'saving' ? 'SAVING TO NEON…' : syncStatus === 'error' ? 'SYNC FAILED — RETRY' : 'SAVED TO NEON'}
          </button>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">FISCAL RECONCILIATION: ENABLED</span>
        </div>

        {/* Instant Quick-Action Log Expense Button with CSS-only Tooltip */}
        <div className="relative group flex items-center">
          <button
            id="footer-quick-expense-btn"
            onClick={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <Receipt className="w-3.5 h-3.5" />
            <span>Quick Add Expense</span>
          </button>

          {/* Lightweight CSS-Only Tooltip */}
          <div
            id="footer-quick-expense-tooltip"
            role="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-sans font-medium rounded-md shadow-lg whitespace-nowrap pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 border border-slate-700/80 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900 dark:after:border-t-slate-800"
          >
            Click to instantly log a new expense
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500">INFLOW & OUTFLOW TRACKER</span>
          <button onClick={() => void handleSignOut()} className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold" title="Sign out">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
          <span className="text-slate-600 dark:text-slate-400 font-semibold">OMNITRACK.CASH V2.4.0</span>
        </div>
      </footer>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseModalInitialMode(undefined);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        selectedMonth={selectedMonth}
        initialMode={expenseModalInitialMode}
      />

      <InflowModal
        isOpen={isInflowModalOpen}
        onClose={() => setIsInflowModalOpen(false)}
        onSave={handleSaveInflow}
        inflowToEdit={inflowToEdit}
        selectedMonth={selectedMonth}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSaveBudget={handleSaveBudget}
        currentBudget={currentBudget}
        selectedMonth={selectedMonth}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSave={handleSaveDebt}
        debtToEdit={debtToEdit}
      />

      <RepaymentModal
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        onSaveRepayment={handleSaveRepayment}
        debt={debtForRepayment}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        inflows={inflows}
        budgets={budgets}
        debts={debts}
        onImportData={handleImportData}
      />
    </div>
  );
}
