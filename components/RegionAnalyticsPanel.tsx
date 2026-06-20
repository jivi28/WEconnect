"use client";

import type { RegionAnalytics } from "@/lib/types";
import { fmt } from "@/lib/format";
import { RoiBadge, LowDataBadge } from "./RoiBadge";
import { Leaderboard } from "./Leaderboard";

export function RegionAnalyticsPanel({
  region,
  onSelectEvent,
}: {
  region: RegionAnalytics;
  onSelectEvent: (id: string) => void;
}) {
  const avgConn =
    region.totalNewUsers > 0 ? region.totalConnections / region.totalNewUsers : 0;
  const avgSim =
    region.totalNewUsers > 0 ? region.totalSimulations / region.totalNewUsers : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-neutral-50">{region.region}</h2>
          <p className="text-sm text-neutral-400">
            {region.eventCount} event{region.eventCount === 1 ? "" : "s"}
          </p>
          {region.lowData && (
            <div className="mt-2">
              <LowDataBadge
                confidence={region.confidence}
                sampleSize={region.totalNewUsers}
              />
            </div>
          )}
        </div>
        <RoiBadge roi={region.roi} tier={region.tier} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="New users" value={region.totalNewUsers.toLocaleString()} />
        <Stat label="Avg connections" value={fmt(avgConn)} />
        <Stat label="Avg simulations" value={fmt(avgSim)} />
        <Stat label="Total simulations" value={region.totalSimulations.toLocaleString()} />
      </div>

      <Leaderboard events={region.events} onSelect={onSelectEvent} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-neutral-50">{value}</div>
    </div>
  );
}
