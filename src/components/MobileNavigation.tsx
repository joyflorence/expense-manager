import React from 'react';
import { BarChart3, Landmark, LayoutDashboard, Plus, Receipt } from 'lucide-react';
import { ViewTab } from './Navbar';

interface MobileNavigationProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onAddExpense: () => void;
}

const items: Array<{ tab: ViewTab; label: string; icon: typeof LayoutDashboard }> = [
  { tab: 'overview', label: 'Home', icon: LayoutDashboard },
  { tab: 'expenses', label: 'Activity', icon: Receipt },
  { tab: 'debts', label: 'Debts', icon: Landmark },
  { tab: 'analytics', label: 'Insights', icon: BarChart3 },
];

export function MobileNavigation({ currentTab, onTabChange, onAddExpense }: MobileNavigationProps) {
  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
        {items.slice(0, 2).map(({ tab, label, icon: Icon }) => (
          <button key={tab} type="button" onClick={() => onTabChange(tab)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${currentTab === tab ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <Icon className={`h-5 w-5 ${currentTab === tab ? 'stroke-[2.7]' : ''}`} />
            {label}
          </button>
        ))}
        <button type="button" onClick={onAddExpense} aria-label="Add transaction" className="-mt-7 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition active:scale-95">
          <Plus className="h-7 w-7 stroke-[3]" />
        </button>
        {items.slice(2).map(({ tab, label, icon: Icon }) => (
          <button key={tab} type="button" onClick={() => onTabChange(tab)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${currentTab === tab ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <Icon className={`h-5 w-5 ${currentTab === tab ? 'stroke-[2.7]' : ''}`} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
