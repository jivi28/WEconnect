"use client";

import type { ScoredEvent } from "@/lib/types";
import { TIER_COLOR } from "@/lib/format";

export function Leaderboard({
  events,
  onSelect,
}: {
  events: ScoredEvent[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-neutral-300">
        Event leaderboard
      </h3>
      <ol className="space-y-1">
        {events.map((e, i) => (
          <li key={e.event_id}>
            <button
              onClick={() => onSelect(e.event_id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-neutral-800/60"
            >
              <span className="w-5 text-right text-xs text-neutral-500">{i + 1}</span>
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: TIER_COLOR[e.tier] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">
                {e.name}
                {e.lowData && (
                  <span className="ml-1 text-amber-400" title="Low data — ROI dampened">
                    ⚠
                  </span>
                )}
                <span className="block text-xs text-neutral-500">
                  {e.city}, {e.country}
                </span>
              </span>
              <span className="text-sm font-bold text-neutral-100">{e.roi}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
