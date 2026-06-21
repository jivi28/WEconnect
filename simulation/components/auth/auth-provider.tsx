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
  /** Role from `profiles` ('student' | 'educator' | 'wurth_employee'), null until loaded. */
  profileRole: string | null;
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
  const [profileRole, setProfileRole] = useState<string | null>(null);

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

  // Shared session bridge: when embedded in the WEconnect app (iframe), the
  // parent posts its Supabase session so the simulator plays as the same logged-in
  // user — no separate signup. We adopt it via setSession; localStorage can't be
  // shared cross-origin (parent :5173, simulator :3001), so postMessage is required.
  useEffect(() => {
    if (!supabase || typeof window === "undefined" || window.parent === window) {
      return;
    }

    async function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.type !== "wc-session") return;
      const { access_token, refresh_token } = data;
      if (!access_token || !refresh_token) return;
      await supabase!.auth.setSession({ access_token, refresh_token });
    }

    window.addEventListener("message", onMessage);
    // Tell the parent we're ready to receive the session.
    window.parent.postMessage({ type: "wc-ready" }, "*");

    return () => window.removeEventListener("message", onMessage);
  }, [supabase]);

  // Pull the viewer's own name + role from `profiles` (own row is readable under RLS).
  useEffect(() => {
    if (!supabase || !user) {
      setProfileName(null);
      setProfileRole(null);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .maybeSingle()
      .then(
        ({
          data,
        }: {
          data: { name: string | null; role: string | null } | null;
        }) => {
          if (!active) return;
          setProfileName(data?.name?.trim() || emailPrefix(user));
          setProfileRole(data?.role ?? null);
        },
      );
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
      profileRole,
      signIn,
      signOut,
    }),
    [ready, configured, user, profileName, profileRole, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
