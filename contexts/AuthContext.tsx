import { supabase } from '@/lib/supabase/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isInvalidRefreshTokenError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /invalid refresh token|refresh token not found/i.test(msg);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearInvalidSession = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore — we're clearing a bad session
    }
    setSession(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
    } catch (e) {
      if (isInvalidRefreshTokenError(e)) {
        await clearInvalidSession();
      } else {
        setSession(null);
        setUser(null);
      }
    }
  }, [clearInvalidSession]);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useSession must be used within AuthProvider');
  return ctx;
}

export function useUser() {
  const { user } = useSession();
  return user;
}
