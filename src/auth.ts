import { createClient, Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const authConfigError = !supabaseUrl || !supabaseAnonKey
  ? 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment and redeploy.'
  : /^https:\/\/YOUR-|^YOUR-/i.test(supabaseUrl) || /^YOUR-/i.test(supabaseAnonKey)
  ? 'Supabase is still using placeholder credentials. Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project keys.'
  : null;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setIsPending(false);
      }
    }).catch(() => {
      if (mounted) {
        setSession(null);
        setIsPending(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setIsPending(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { data: session, isPending };
}

