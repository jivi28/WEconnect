"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trophy, UserCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { fetchLeaderboard, type LeaderboardRow } from "@/lib/weekly/scores";

const REFRESH_EVENT = "wc:refresh-leaderboard";

/** Tell the panel to re-pull the board (call right after awarding a point). */
export function refreshLeaderboard() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}

/** ms → "2m 14s" / "45s" / "—". */
function formatMs(ms: number | null): string {
  if (ms == null || ms <= 0) return "—";
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, "0")}s`;
}

export function LeaderboardPanel() {
  const { configured } = useAuth();
  if (!configured) return null;

  return (
    <aside className="flex h-full w-full flex-col gap-3 overflow-hidden">
      <SignedInBadge />
      <Board />
    </aside>
  );
}

/* ------------------------------------------------------------------ */

function SignedInBadge() {
  const { ready, user, profileName } = useAuth();
  if (!ready || !user) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5">
      <UserCircle2 size={18} className="shrink-0 text-we-red" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{profileName}</p>
        <p className="text-[11px] text-ink-faint">Playing as you</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Board() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      setRows(await fetchLeaderboard(supabase));
    } catch {
      /* leave previous rows on transient error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Immediate local trigger (after the current user scores).
    const handler = () => load();
    window.addEventListener(REFRESH_EVENT, handler);

    // Live sync: refetch whenever anyone records a completion.
    const supabase = getSupabase();
    const channel = supabase
      ?.channel("wc-leaderboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wc_challenge_completions" },
        () => load(),
      )
      .subscribe();

    return () => {
      window.removeEventListener(REFRESH_EVENT, handler);
      if (channel) supabase?.removeChannel(channel);
    };
  }, [load, user]);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-3 text-ink">
        <Trophy size={15} className="text-we-red" />
        <span className="text-sm font-semibold">Weekly Leaderboard</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
        {loading ? (
          <div className="flex justify-center py-8 text-ink-faint">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-ink-faint">
            No points yet — be the first to win this week&apos;s challenge.
          </p>
        ) : (
          rows.map((row, i) => {
            const me = row.user_id === user?.id;
            return (
              <div
                key={row.user_id}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
                  me ? "bg-we-red/10 ring-1 ring-we-red/40" : ""
                }`}
              >
                <span
                  className={`w-5 text-center text-xs font-bold ${
                    i === 0
                      ? "text-yellow-400"
                      : i === 1
                        ? "text-zinc-300"
                        : i === 2
                          ? "text-amber-600"
                          : "text-ink-faint"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    {row.display_name}
                    {me && <span className="ml-1 text-[10px] text-we-red">(you)</span>}
                  </p>
                  <p className="text-[10px] text-ink-faint">
                    avg {formatMs(row.avg_ms)}
                    {row.total_mistakes > 0 && (
                      <span className="text-we-red/80">
                        {" · "}
                        {row.total_mistakes} misplacement
                        {row.total_mistakes === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {row.points}
                  <span className="ml-1 text-[10px] font-normal text-ink-faint">
                    pt{row.points === 1 ? "" : "s"}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-line bg-panel px-3.5 py-2.5">
        <p className="text-[11px] leading-snug text-ink-muted">
          <span className="font-semibold text-we-red">Climb the board</span> — top
          builders get noticed by{" "}
          <span className="font-semibold text-ink">Würth Elektronik</span> engineers
          &amp; recruiters. 🏆
        </p>
      </div>
    </div>
  );
}
