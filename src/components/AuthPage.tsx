import React, { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Receipt, UserRound } from 'lucide-react';
import { supabase, authConfigError } from '../auth';

function ExpenseIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[min(26rem,42vh)]" aria-label="Expense tracking dashboard illustration" role="img">
      <div className="absolute -left-8 top-12 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute -right-4 bottom-8 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="relative rounded-[1.4rem] border border-white/15 bg-white/[0.08] p-[clamp(0.3rem,1.1vh,1rem)] shadow-2xl shadow-emerald-950/30 backdrop-blur-sm">
        <div className="rounded-xl border border-slate-200/80 bg-white p-[clamp(0.5rem,1.5vh,1.25rem)] text-slate-900 shadow-xl sm:rounded-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[clamp(0.45rem,1.2vh,0.75rem)] font-medium text-slate-500">Spending overview</p>
              <p className="mt-0.5 text-[clamp(0.58rem,2vh,1.25rem)] font-semibold tracking-tight">UGX 842,500</p>
              <p className="mt-0.5 text-[clamp(0.45rem,1.2vh,0.75rem)] text-slate-500">Expenses this month</p>
            </div>
            <span className="flex h-[clamp(1.25rem,4vh,2.5rem)] w-[clamp(1.25rem,4vh,2.5rem)] items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Receipt className="h-1/2 w-1/2" />
            </span>
          </div>

          <svg viewBox="0 0 420 150" className="mt-[clamp(0.25rem,1.2vh,0.75rem)] h-auto w-full" aria-hidden="true">
            <defs>
              <linearGradient id="spending-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity=".22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[25, 65, 105, 145].map((y) => (
              <line key={y} x1="12" x2="408" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />
            ))}
            <path d="M12 116 C48 106 54 74 94 82 S143 113 178 85 S232 39 265 59 S318 100 350 57 S388 42 408 24 L408 145 L12 145Z" fill="url(#spending-area)" />
            <path d="M12 116 C48 106 54 74 94 82 S143 113 178 85 S232 39 265 59 S318 100 350 57 S388 42 408 24" fill="none" stroke="#059669" strokeLinecap="round" strokeWidth="4" />
            <circle cx="265" cy="59" r="5" fill="#059669" stroke="white" strokeWidth="3" />
            <circle cx="408" cy="24" r="5" fill="#059669" stroke="white" strokeWidth="3" />
          </svg>

          <div className="mt-1 space-y-[clamp(0.15rem,0.6vh,0.5rem)]">
            {[
              { label: 'Groceries', detail: 'Today · Personal', amount: 'UGX 48,000', icon: 'G', color: 'bg-amber-100 text-amber-700' },
              { label: 'Transport', detail: 'Yesterday · Personal', amount: 'UGX 22,500', icon: 'T', color: 'bg-sky-100 text-sky-700' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-1 border-t border-slate-100 pt-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className={`flex h-[clamp(1rem,3.5vh,2rem)] w-[clamp(1rem,3.5vh,2rem)] shrink-0 items-center justify-center rounded-lg text-[clamp(0.45rem,1.4vh,0.875rem)] font-semibold ${item.color}`}>{item.icon}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[clamp(0.48rem,1.5vh,0.875rem)] font-semibold">{item.label}</span>
                    <span className="block truncate text-[clamp(0.4rem,1.2vh,0.75rem)] text-slate-500">{item.detail}</span>
                  </span>
                </div>
                <span className="whitespace-nowrap text-[clamp(0.42rem,1.25vh,0.875rem)] font-semibold">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-3 -left-1 flex items-center gap-1.5 rounded-xl border border-white/70 bg-white px-2 py-1.5 text-slate-900 shadow-xl sm:-left-4">
          <span className="flex h-[clamp(1rem,3.5vh,2rem)] w-[clamp(1rem,3.5vh,2rem)] items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Check className="h-3/5 w-3/5" />
          </span>
          <span>
            <span className="block text-[clamp(0.45rem,1.3vh,0.75rem)] font-semibold">Every expense, in one place</span>
            <span className="block text-[clamp(0.4rem,1.1vh,0.6875rem)] text-slate-500">Simple records. Clear spending.</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (authConfigError) {
      setMessage(authConfigError);
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) setMessage(error.message);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) {
          setMessage(error.message);
        } else if (data.user && !data.session) {
          setMessage('Account created. Check your email to confirm your account before signing in.');
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = 'w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:py-2.5';

  return (
    <main className="min-h-svh bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:h-svh lg:min-h-0 lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
      <section className="relative hidden min-h-0 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 px-8 py-4 text-white lg:flex lg:flex-col lg:justify-between xl:px-12 xl:py-5">
        <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -left-28 top-24 h-80 w-80 rounded-full border border-emerald-300/30" />
          <div className="absolute -left-12 top-40 h-64 w-64 rounded-full border border-emerald-300/20" />
          <div className="absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full border border-emerald-300/20" />
        </div>

        <a href="/" className="relative z-10 inline-flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-950/30">
            <Receipt className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide">Expense Manager</span>
            <span className="mt-0.5 block text-xs text-emerald-100/70">A clearer view of your spending</span>
          </span>
        </a>

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3 py-3 xl:gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Personal expense tracking</p>
            <h1 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Know where your money goes.
            </h1>
            <p className="max-w-md text-sm leading-6 text-emerald-50/75 xl:text-base">
              Keep your day-to-day expenses organized, searchable and easy to understand.
            </p>
          </div>
          <ExpenseIllustration />
        </div>

        <p className="relative z-10 text-xs text-emerald-100/50">Your personal workspace for expense records.</p>
      </section>

      <section className="flex min-h-svh flex-col px-5 py-6 sm:px-8 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-4 xl:px-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-4 lg:py-2">
          <a href="/" className="mb-6 inline-flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white dark:bg-emerald-600">
              <Receipt className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Expense Manager</span>
          </a>

          <div className="mb-5">
            <p className="mb-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">Welcome to Expense Manager</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {mode === 'sign-in' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-slate-500 dark:text-slate-400">
              {mode === 'sign-in'
                ? 'Access your expense records and spending history.'
                : 'Set up a private workspace for tracking expenses.'}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['sign-in', 'sign-up'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setMode(item); setMessage(''); }}
                className={`min-h-10 rounded-lg text-sm font-medium transition ${
                  mode === item
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {item === 'sign-in' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'sign-up' && (
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Name
                <span className="relative mt-2 block lg:mt-1.5">
                  <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClassName} placeholder="Your name" />
                </span>
              </label>
            )}

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email address
              <span className="relative mt-2 block lg:mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} placeholder="you@example.com" />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
              <span className="relative mt-2 block lg:mt-1.5">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  minLength={8}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClassName} pr-12`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {(authConfigError || message) && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300">
                {authConfigError || message}
              </p>
            )}

            <button
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500 lg:min-h-11"
            >
              {isSubmitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            Your expense records are private to your account.
          </p>
        </div>
      </section>
    </main>
  );
}
