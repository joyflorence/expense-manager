import React, { useState } from 'react';
import { Expense } from '../types';
import { X, Download, Upload } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onImportData: (data: { expenses: Expense[] }) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isAmount = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0
);

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  onImportData,
}) => {
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backup = {
      app: 'Expense Manager',
      exportedAt: new Date().toISOString(),
      expenses,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expense_Manager_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleImportSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const parsed: unknown = JSON.parse(importJson);
      const data = Array.isArray(parsed) ? { expenses: parsed } : parsed;
      if (!isRecord(data) || !Array.isArray(data.expenses)) {
        throw new Error('Invalid JSON backup file structure.');
      }

      const importedExpenses = data.expenses.map((value): Expense => {
        if (!isRecord(value) || typeof value.title !== 'string' || !isAmount(value.amount) || !isDate(value.date)) {
          throw new Error('Invalid expense record in backup.');
        }
        const taxAmount = typeof value.taxAmount === 'number' && Number.isFinite(value.taxAmount) && value.taxAmount >= 0
          ? value.taxAmount
          : 0;
        const totalAmount = typeof value.totalAmount === 'number' && Number.isFinite(value.totalAmount) && value.totalAmount >= value.amount
          ? value.totalAmount
          : value.amount + taxAmount;
        return {
          ...value,
          id: typeof value.id === 'string' && value.id ? value.id : crypto.randomUUID(),
          taxAmount,
          totalAmount,
        } as Expense;
      });

      onImportData({ expenses: importedExpenses });
      setImportStatus('Expense records imported successfully.');
      window.setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read the backup file.';
      setImportStatus(`Error: ${message}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setImportJson(reader.result);
      else setImportStatus('Error: Could not read the selected file.');
    };
    reader.onerror = () => setImportStatus('Error: Could not read the selected file.');
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="my-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <Download className="h-5 w-5 text-emerald-600" />
            Expense backup
          </h2>
          <button type="button" onClick={onClose} aria-label="Close backup dialog" className="rounded-lg p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-sm">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Download className="h-4 w-4 text-emerald-600" />
                Export expenses
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Download your expense records, including separately recorded taxes and fees, as a JSON backup.
              </p>
            </div>
            <button type="button" onClick={handleExportJSON} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              <Download className="h-4 w-4" />
              Download backup ({expenses.length} records)
            </button>
          </section>

          <form onSubmit={handleImportSubmit} className="space-y-3">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Upload className="h-4 w-4 text-sky-600" />
                Import expenses
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Importing replaces the expense records currently shown in your tracker.</p>
            </div>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              aria-label="Choose expense backup JSON file"
              className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300"
            />
            <textarea
              rows={5}
              placeholder="Or paste an expense backup in JSON format..."
              value={importJson}
              onChange={(event) => setImportJson(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            {importStatus && (
              <div role="status" className={`rounded-xl p-3 text-xs font-medium ${
                importStatus.startsWith('Error')
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              }`}>
                {importStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Close
              </button>
              <button type="submit" disabled={!importJson.trim()} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                Import expenses
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
