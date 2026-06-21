"use client";

import { useCallback, useEffect, useState } from "react";
import { Library, Loader2, Trophy, Wrench, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import {
  fetchLibrary,
  type SavedSimulation,
  type SimulationMode,
} from "@/lib/simulation/completions";

const REFRESH_EVENT = "wc:refresh-library";

/** Tell the panel to re-pull saved builds (call right after a completion). */
export function refreshLibrary() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}

const MODE_META: Record<
  SimulationMode,
  { label: string; Icon: typeof Wrench }
> = {
  guided: { label: "Guided", Icon: Sparkles },
  challenge: { label: "Challenge", Icon: Trophy },
  free: { label: "Free build", Icon: Wrench },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function LibraryPanel({
  onOpen,
}: {
  onOpen: (saved: SavedSimulation) => void;
}) {
  const { configured, ready, user } = useAuth();
  const [rows, setRows] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      setRows(await fetchLibrary(supabase, user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
  }, [load]);

  if (!configured) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-3 text-ink">
        <Library size={15} className="text-we-red" />
        <span className="text-sm font-semibold">My Library</span>
        {rows.length > 0 && (
          <span className="ml-auto text-[11px] text-ink-faint">{rows.length}</span>
        )}
      </div>

      <div className="we-scroll min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
        {!ready || loading ? (
          <div className="flex justify-center py-8 text-ink-faint">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : !user ? (
          <p className="px-3 py-8 text-center text-xs text-ink-faint">
            Sign in to save your builds and revisit them here.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-ink-faint">
            No saved builds yet — finish a simulation and it lands here.
          </p>
        ) : (
          rows.map((row) => {
            const meta = MODE_META[row.mode] ?? MODE_META.guided;
            const Icon = meta.Icon;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onOpen(row)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-card-hover"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-we-red/10 text-we-red">
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {row.title || row.product || "Simulation"}
                  </p>
                  <p className="text-[10px] text-ink-faint">
                    {meta.label} · {formatDate(row.created_at)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
