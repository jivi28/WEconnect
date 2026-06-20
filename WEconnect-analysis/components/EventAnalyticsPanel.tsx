"use client";

import { useState } from "react";
import type { ScoredEvent, FunnelStep } from "@/lib/types";
import { buildFunnel } from "@/lib/roi";
import { fmt, fmtEuro, TIER_COLOR } from "@/lib/format";
import { RoiBadge, LowDataBadge } from "./RoiBadge";

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-neutral-50">{value}</div>
      {hint && <div className="text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function Funnel({ steps, color }: { steps: FunnelStep[]; color: string }) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-neutral-300">{s.label}</span>
            <span className="text-neutral-400">
              <span className="font-semibold text-neutral-100">{s.value}</span>
              {i > 0 && (
                <span className="ml-1 text-neutral-500">({pct(s.conversion)} of prev)</span>
              )}
            </span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded bg-neutral-800">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${Math.max(2, s.ofSignups * 100)}%`,
                backgroundColor: color,
                opacity: 1 - i * 0.22,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function downloadCsv(e: ScoredEvent) {
  const rows = [
    ["metric", "value"],
    ["event", e.name],
    ["city", e.city ?? ""],
    ["country", e.country ?? ""],
    ["roi_score", String(e.roi)],
    ["new_users", String(e.new_users)],
    ["avg_connections", fmt(e.avg_connections)],
    ["avg_simulations", fmt(e.avg_simulations)],
    ["users_connected", String(e.users_connected)],
    ["users_simulated", String(e.users_simulated)],
    ["total_connections", String(e.total_connections)],
    ["total_simulations", String(e.total_simulations)],
    ["cost_eur", e.cost != null ? String(e.cost) : ""],
    ["value_per_euro", e.valuePerEuro != null ? String(e.valuePerEuro) : ""],
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.name.replace(/\s+/g, "_")}_roi.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EventAnalyticsPanel({ event }: { event: ScoredEvent }) {
  const [generated, setGenerated] = useState(false);
  const funnel = buildFunnel(event);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold text-neutral-50">{event.name}</h2>
          <RoiBadge roi={event.roi} tier={event.tier} />
        </div>
        <p className="text-sm text-neutral-400">
          {event.city}, {event.country}
          {event.start_date ? ` · ${event.start_date}` : ""}
        </p>
        {event.lowData && (
          <div className="mt-2">
            <LowDataBadge confidence={event.confidence} sampleSize={event.new_users} />
          </div>
        )}
      </div>

      {!generated ? (
        <button
          onClick={() => setGenerated(true)}
          className="w-full rounded-lg bg-wurth-red px-4 py-2.5 font-semibold text-white transition hover:brightness-110"
        >
          Generate event analytics
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="New users" value={String(event.new_users)} hint="joined via this event" />
            <Metric label="Avg connections" value={fmt(event.avg_connections)} hint="per attendee" />
            <Metric label="Avg simulations" value={fmt(event.avg_simulations)} hint="per attendee" />
            <Metric
              label="Cost-adj. ROI"
              value={event.valuePerEuro != null ? `${event.valuePerEuro}` : "—"}
              hint={event.cost != null ? `value / ${fmtEuro(event.cost)}` : "no cost set"}
            />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-200">
                Engagement funnel
              </h3>
              <span className="text-xs text-neutral-500">
                {pct(funnel[funnel.length - 1].ofSignups)} reached the end
              </span>
            </div>
            <Funnel steps={funnel} color={TIER_COLOR[event.tier]} />
          </div>

          <button
            onClick={() => downloadCsv(event)}
            className="w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Export report (CSV)
          </button>
        </>
      )}
    </div>
  );
}
