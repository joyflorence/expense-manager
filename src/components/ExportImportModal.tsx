import React, { useState } from 'react';
import { Expense, MonthlyBudget, DebtItem, Inflow } from '../types';
import { X, Download, Upload } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  inflows?: Inflow[];
  budgets: MonthlyBudget[];
  debts?: DebtItem[];
  onImportData: (data: { expenses: Expense[]; inflows?: Inflow[]; budgets: MonthlyBudget[]; debts?: DebtItem[] }) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  inflows = [],
  budgets,
  debts = [],
  onImportData,
}) => {
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backupObj = {
      app: 'OmniTrack Cashbook',
      exportedAt: new Date().toISOString(),
      expenses,
      inflows,
      budgets,
      debts,
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OmniTrack_Cashbook_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.expenses && !Array.isArray(parsed) && !parsed.inflows) {
        throw new Error('Invalid JSON backup file structure.');
      }
      const importedExpenses = Array.isArray(parsed) ? parsed : (parsed.expenses || []);
      const importedInflows = parsed.inflows || [];
      const importedBudgets = parsed.budgets || budgets;
      const importedDebts = parsed.debts || debts;

      onImportData({
        expenses: importedExpenses,
        inflows: importedInflows,
        budgets: importedBudgets,
        debts: importedDebts,
      });
      setImportStatus('Cashbook & Inflow data successfully imported!');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" />
            Backup & Cashbook Data Import / Export
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs sm:text-sm overflow-y-auto flex-1">
          {/* Export section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Download className="w-4 h-4 text-emerald-500" />
              Export Cashbook Data Backup
            </h3>
            <p className="text-xs text-slate-500">
              Download your cash inflows, spending records, cashouts, salary settings, and debt registers as a JSON file.
            </p>
            <button
              onClick={handleExportJSON}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Backup JSON ({inflows.length} inflows, {expenses.length} transactions, {debts.length} debt items)
            </button>
          </div>

          {/* Import section */}
          <form onSubmit={handleImportSubmit} className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4 text-blue-500" />
              Import Cashbook Data Backup
            </h3>

            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
            />

            <textarea
              rows={4}
              placeholder="Or paste JSON backup content here..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
            />

            {importStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                importStatus.startsWith('Error') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {importStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!importJson.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl text-xs transition"
              >
                Import Data Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
