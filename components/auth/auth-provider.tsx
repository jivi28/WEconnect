"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  ready: boolean;
  configured: boolean;
  user: User | null;
  /** Display name from the canonical `profiles` table (falls back to email prefix). */
  profileName: string | null;
  /** Sign in with email/password. Used only by the dev-only sign-in in development. */
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function emailPrefix(user: User | null): string | null {
  return user?.email?.split("@")[0] ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase();
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        setReady(true);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Pull the student's real name from `profiles` (own row is readable under RLS).
  useEffect(() => {
    if (!supabase || !user) {
      setProfileName(null);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { name: string | null } | null }) => {
        if (!active) return;
        setProfileName(data?.name?.trim() || emailPrefix(user));
      });
    return () => {
      active = false;
    };
  }, [supabase, user]);

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password) => {
      if (!supabase) return { ok: false, error: "Accounts are not configured." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured,
      user,
      profileName: profileName ?? emailPrefix(user),
      signIn,
      signOut,
    }),
    [ready, configured, user, profileName, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
