import React, { useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Landmark, LayoutDashboard, Receipt } from 'lucide-react';
import { ViewTab } from './Navbar';

interface SidebarNavigationProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const navItems: Array<{ tab: ViewTab; label: string; description: string; icon: typeof LayoutDashboard }> = [
  {
    tab: 'overview',
    label: 'Overview',
    description: 'Balances, daily cashflow, savings',
    icon: LayoutDashboard,
  },
  {
    tab: 'expenses',
    label: 'Cashbook Ledger',
    description: 'Expenses, transfers, cashouts',
    icon: Receipt,
  },
  {
    tab: 'debts',
    label: 'Debts',
    description: 'Borrowed, lent, repayments',
    icon: Landmark,
  },
  {
    tab: 'analytics',
    label: 'Reports',
    description: 'Statements and audit view',
    icon: BarChart3,
  },
];

export function SidebarNavigation({ currentTab, onTabChange }: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`hidden md:block shrink-0 transition-all duration-200 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="sticky top-32 space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Workspace</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">Cashbook</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav aria-label="Section navigation" className="space-y-1.5">
          {navItems.map(({ tab, label, description, icon: Icon }) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                title={isCollapsed ? label : undefined}
                className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-100'
                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-800/70 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                {!isCollapsed && (
                  <span className="min-w-0">
                    <span className="block text-sm font-black leading-tight">{label}</span>
                    <span className={`block truncate text-[11px] leading-tight ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>
                      {description}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
