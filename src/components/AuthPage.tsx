import React, { useState } from 'react';
import { LockKeyhole, Mail, UserRound, Wallet } from 'lucide-react';
import { authClient, authConfigError } from '../auth';

export function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentOrigin = window.location.origin;

  const formatAuthError = (error: { message?: string; status?: number; statusCode?: number }) => {
    const message = error.message || 'Unable to continue.';
    const status = error.status || error.statusCode;
    if (message.toLowerCase().includes('invalid origin')) {
      return `${message}${status ? ` (HTTP ${status})` : ''} Add ${currentOrigin} in Neon Console > Auth > Configuration > Domains.`;
    }
    return `${message}${status ? ` (HTTP ${status})` : ''}`;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (authConfigError) {
      setMessage(authConfigError);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password });
      if (result.error) {
        const authError = result.error as { message?: string; status?: number; statusCode?: number };
        setMessage(formatAuthError(authError));
      }
      else if (mode === 'sign-up') setMessage('Account created. Check your email if verification is enabled.');
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message.toLowerCase().includes('invalid origin')
          ? `Unable to reach Neon Auth: ${error.message} Add ${currentOrigin} in Neon Console > Auth > Configuration > Domains.`
          : `Unable to reach Neon Auth: ${error.message}`
        : 'Unable to reach Neon Auth. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-3"><Wallet className="h-6 w-6 text-emerald-400" /></div>
          <div><h1 className="font-bold">OmniTrack Cash</h1><p className="text-xs text-slate-400">Your private cashbook</p></div>
        </div>
        <div className="grid grid-cols-2 rounded-xl bg-slate-800 p-1 text-sm">
          {(['sign-in', 'sign-up'] as const).map((item) => <button key={item} type="button" onClick={() => { setMode(item); setMessage(''); }} className={`rounded-lg py-2 ${mode === item ? 'bg-emerald-500 font-bold text-slate-950' : 'text-slate-300'}`}>{item === 'sign-in' ? 'Sign in' : 'Create account'}</button>)}
        </div>
        {mode === 'sign-up' && <label className="block text-sm font-medium">Name<div className="relative mt-2"><UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 outline-none focus:border-emerald-500" /></div></label>}
        <label className="block text-sm font-medium">Email<div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 outline-none focus:border-emerald-500" /></div></label>
        <label className="block text-sm font-medium">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 outline-none focus:border-emerald-500" /></div></label>
        {(authConfigError || message) && <p className="text-xs text-rose-400">{authConfigError || message}</p>}
        <button disabled={isSubmitting} className="w-full rounded-xl bg-emerald-500 py-2.5 font-bold text-slate-950 disabled:opacity-60">{isSubmitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
      </form>
    </main>
  );
}
