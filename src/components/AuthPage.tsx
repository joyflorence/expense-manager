import React, { useState } from 'react';
import { LockKeyhole, Mail, UserRound, Wallet } from 'lucide-react';
import { supabase, authConfigError } from '../auth';

export function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        if (error) {
          setMessage(error.message);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });
        if (error) {
          setMessage(error.message);
        } else if (data.user && !data.session) {
          setMessage('Account created! Please check your email to confirm your account before signing in.');
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 grid place-items-center p-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-7 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-3"><Wallet className="h-6 w-6 text-emerald-400" /></div>
          <div><h1 className="font-bold">OmniTrack Cash</h1><p className="text-xs text-slate-500 dark:text-slate-400">Your private cashbook</p></div>
        </div>
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-sm">
          {(['sign-in', 'sign-up'] as const).map((item) => <button key={item} type="button" onClick={() => { setMode(item); setMessage(''); }} className={`rounded-lg py-2 ${mode === item ? 'bg-emerald-500 font-bold text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}>{item === 'sign-in' ? 'Sign in' : 'Create account'}</button>)}
        </div>
        {mode === 'sign-up' && <label className="block text-sm font-medium">Name<div className="relative mt-2"><UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div></label>}
        <label className="block text-sm font-medium">Email<div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div></label>
        <label className="block text-sm font-medium">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div></label>
        {(authConfigError || message) && <p className="text-xs text-rose-400">{authConfigError || message}</p>}
        <button disabled={isSubmitting} className="w-full rounded-xl bg-emerald-500 py-2.5 font-bold text-slate-950 disabled:opacity-60">{isSubmitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
      </form>
    </main>
  );
}
