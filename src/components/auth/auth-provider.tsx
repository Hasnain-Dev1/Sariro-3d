'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/* ===============================================================
   AuthProvider — wraps the app, exposes useAuth() hook.
   - Listens to Supabase auth state changes
   - Fetches the user's profile row from public.profiles
   - Exposes: user, session, profile, loading, signIn, signUp, signOut
=============================================================== */

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  provider: string | null;
  role: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  profile_completed: boolean;
  is_student: boolean;
  is_teacher: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  is_seller: boolean;
  is_hr: boolean;
  /* When true, an admin has locked this user's name — they can't change it
     themselves from Settings. Optional so older cached sessions / pre-migration
     rows default to editable. */
  name_locked?: boolean;
  /* New fields added in v1.0 batch-management migration */
  timezone?: string | null;
  track?: string | null;
  current_cohort_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'student' | 'teacher' | 'seller' | 'hr' | 'admin' | 'super_admin';

/**
 * Returns the user's highest-priority role.
 * Prefers the new `role` column (set by v1.0 migration backfill);
 * falls back to legacy booleans for older sessions.
 */
export function getRole(profile: Profile | null): UserRole {
  if (!profile) return 'student';
  // Prefer the new `role` column
  if (profile.role === 'super_admin' || profile.is_super_admin) return 'super_admin';
  if (profile.role === 'admin' || profile.is_admin) return 'admin';
  if (profile.role === 'hr') return 'hr';
  if (profile.role === 'seller') return 'seller';
  if (profile.role === 'teacher' || profile.is_teacher) return 'teacher';
  return 'student';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('[auth] profile fetch error:', error.message);
        // Profile row not created yet — the SQL trigger should have created it,
        // but if schema isn't applied yet, we'll just have null profile.
        return null;
      }
      setProfile(data as Profile);
      return data as Profile;
    } catch (err) {
      console.warn('[auth] profile fetch exception:', err);
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, [supabase]);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setLoading(false));
        } else {
          // Defer setState via microtask to satisfy react-hooks/set-state-in-effect lint
          Promise.resolve().then(() => setLoading(false));
        }
      }).catch((err) => {
        console.warn('[auth] getSession error:', err);
        Promise.resolve().then(() => setLoading(false));
      });

      // Listen for auth changes
      const result = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            await fetchProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
          Promise.resolve().then(() => setLoading(false));
        }
      );
      subscription = result.data?.subscription ?? null;
    } catch (err) {
      console.warn('[auth] setup error:', err);
      Promise.resolve().then(() => setLoading(false));
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (err) {
        console.warn('[auth] unsubscribe error:', err);
      }
    };
  }, [supabase, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}