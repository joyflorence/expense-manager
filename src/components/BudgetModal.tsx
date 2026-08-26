import React, { useState, useEffect } from 'react';
import { MonthlyBudget } from '../types';
import { X, SlidersHorizontal } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBudget: (updatedBudget: MonthlyBudget) => void;
  currentBudget: MonthlyBudget;
  selectedMonth: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSaveBudget,
  currentBudget,
  selectedMonth,
}) => {
  const [workBudget, setWorkBudget] = useState(200000);
  const [personalBudget, setPersonalBudget] = useState(200000);
  const [monthlySalary, setMonthlySalary] = useState(500000);
  const [savingsTarget, setSavingsTarget] = useState(20000);
  const [localTax, setLocalTax] = useState(15000);
  const [nssfDeduction, setNssfDeduction] = useState(0);

  useEffect(() => {
    if (currentBudget) {
      setWorkBudget(currentBudget.workBudget);
      setPersonalBudget(currentBudget.personalBudget);
      setMonthlySalary(currentBudget.monthlySalary ?? 500000);
      setSavingsTarget(currentBudget.savingsTarget ?? 20000);
      setLocalTax(currentBudget.localTax ?? 15000);
      setNssfDeduction(currentBudget.nssfDeduction ?? 0);
    }
  }, [currentBudget, isOpen]);

  if (!isOpen) return null;

  const netSalary = Math.max(0, monthlySalary - nssfDeduction - localTax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBudget({
      month: selectedMonth,
      workBudget: Number(workBudget) || 0,
      personalBudget: Number(personalBudget) || 0,
      monthlySalary: Number(monthlySalary) || 0,
      savingsTarget: Number(savingsTarget) || 0,
      localTax: Number(localTax) || 0,
      nssfDeduction: Number(nssfDeduction) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
            Monthly Salary, Taxes & Budget ({selectedMonth})
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gross Monthly Salary (UGX)
            </label>
            <input
              type="number"
              min="0"
              required
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold font-mono"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Default baseline: UGX 500,000</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Local Tax / Deduction (UGX)
              </label>
              <input
                type="number"
                min="0"
                required
                value={localTax}
                onChange={(e) => setLocalTax(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-rose-600 dark:text-rose-400 font-bold font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Fixed tax: UGX 15,000</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NSSF Contribution (UGX)
              </label>
              <input
                type="number"
                min="0"
                required
                value={nssfDeduction}
                onChange={(e) => setNssfDeduction(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Currently UGX 0 (No NSSF)</p>
            </div>
          </div>

          {/* Net Take-Home Salary Banner */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                Net Take-Home Income (Gross - Tax)
              </span>
              <span className="text-[10px] text-slate-500">
                500,000 - 15,000 local tax
              </span>
            </div>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              UGX {netSalary.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Savings Target (UGX)
            </label>
            <input
              type="number"
              min="0"
              required
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold font-mono"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Target savings reserved before daily spending limit</p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Work Expenditure Budget (UGX)
            </label>
            <input
              type="number"
              min="0"
              required
              value={workBudget}
              onChange={(e) => setWorkBudget(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Personal Expenditure Budget (UGX)
            </label>
            <input
              type="number"
              min="0"
              required
              value={personalBudget}
              onChange={(e) => setPersonalBudget(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold font-mono"
            />
          </div>

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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition"
            >
              Save Budget & Salary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
