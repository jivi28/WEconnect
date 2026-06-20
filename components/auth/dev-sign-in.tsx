"use client";

import { useState } from "react";
import { Loader2, LogOut, Wrench } from "lucide-react";
import { useAuth } from "./auth-provider";

/**
 * Dev-only sign-in / sign-out. In production the simulator assumes a shared Supabase
 * session from the parent app, so this never renders (gated on NODE_ENV). It only
 * exists so the standalone repo can test switching accounts. Sign-in only — no sign-up.
 */
export function DevSignIn() {
  const { ready, configured, user, profileName, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NODE_ENV !== "development") return null;
  if (!configured || !ready) return null;

  // Signed in → offer a sign-out so you can switch accounts while testing.
  if (user) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-line bg-[#161616] px-3 py-1.5 text-[11px] text-[#888] shadow-lg">
        <Wrench size={12} />
        <span className="max-w-[140px] truncate text-ink">{profileName}</span>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[#aaa] transition-colors hover:border-we-red hover:text-white"
        >
          <LogOut size={11} /> Sign out
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else setOpen(false);
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open ? (
        <form
          onSubmit={submit}
          className="w-64 rounded-xl border border-line bg-[#161616] p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#888]">
            <Wrench size={12} /> Dev sign-in (local only)
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="mb-2 w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-ink outline-none focus:border-we-red"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="mb-2 w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-ink outline-none focus:border-we-red"
          />
          {error && <p className="mb-2 text-[11px] text-we-red">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-we-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#b30000] disabled:opacity-50"
            >
              {busy && <Loader2 size={13} className="animate-spin" />}
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-line px-2.5 py-1.5 text-xs text-[#888] hover:text-white"
            >
              ✕
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-[#161616] px-3 py-1.5 text-[11px] text-[#888] shadow-lg hover:text-white"
        >
          <Wrench size={12} /> Dev sign-in
        </button>
      )}
    </div>
  );
}
