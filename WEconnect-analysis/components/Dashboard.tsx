"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ScoredEvent, RoiWeights } from "@/lib/types";
import { DEFAULT_WEIGHTS, aggregateRegions } from "@/lib/roi";
import { KpiCards } from "./KpiCards";
import { RoiWeightSliders } from "./RoiWeightSliders";
import { Leaderboard } from "./Leaderboard";
import { EventAnalyticsPanel } from "./EventAnalyticsPanel";
import { RegionAnalyticsPanel } from "./RegionAnalyticsPanel";
import { CompareView } from "./CompareView";

// Leaflet touches `window`, so the map must be client-only.
const EuropeMap = dynamic(() => import("./EuropeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-neutral-500">
      Loading map…
    </div>
  ),
});

type Selection =
  | { kind: "none" }
  | { kind: "event"; id: string }
  | { kind: "region"; name: string }
  | { kind: "compare" };

export function Dashboard() {
  const [events, setEvents] = useState<ScoredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mock, setMock] = useState(false);

  const [weights, setWeights] = useState<RoiWeights>(DEFAULT_WEIGHTS);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [types, setTypes] = useState<string[]>([]); // empty = all types
  const [selection, setSelection] = useState<Selection>({ kind: "none" });

  // Refetch (debounced) whenever weights/filters change.
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({
        wU: String(weights.users),
        wC: String(weights.connections),
        wS: String(weights.simulations),
      });
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (types.length) p.set("types", types.join(","));

      setLoading(true);
      fetch(`/api/events?${p}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setEvents(d.events);
          setMock(Boolean(d.mock));
          setError(null);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [weights, from, to, types]);

  const regions = useMemo(() => aggregateRegions(events), [events]);
  const selectedEvent =
    selection.kind === "event"
      ? events.find((e) => e.event_id === selection.id) ?? null
      : null;
  const selectedRegion =
    selection.kind === "region"
      ? regions.find((r) => r.region === selection.name) ?? null
      : null;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
        <div>
          <h1 className="text-lg font-bold">
            WE<span className="text-wurth-red">connect</span> · Event ROI
          </h1>
          <p className="text-xs text-neutral-500">
            Würth Electronics student-connection analytics
          </p>
        </div>
        {mock && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">
            Demo data (no Supabase) — synthesized engagement
          </span>
        )}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setSelection({ kind: "compare" })}
            className={`rounded-lg px-3 py-1.5 ${
              selection.kind === "compare"
                ? "bg-wurth-red text-white"
                : "border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => setSelection({ kind: "none" })}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:bg-neutral-800"
          >
            Overview
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_400px]">
        {/* Map + KPIs */}
        <div className="flex flex-col overflow-hidden">
          <div className="p-4">
            <KpiCards events={events} regions={regions} />
          </div>
          <div className="relative flex-1">
            {error && (
              <div className="absolute inset-x-0 top-0 z-[1000] bg-red-900/80 px-4 py-2 text-sm">
                {error} — did you run <code>npm run seed</code> and set Supabase keys?
              </div>
            )}
            <EuropeMap
              events={events}
              regions={regions}
              selectedEventId={selectedEvent?.event_id ?? null}
              onSelectEvent={(id) => setSelection({ kind: "event", id })}
              onSelectRegion={(name) => setSelection({ kind: "region", name })}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4 overflow-y-auto border-l border-neutral-800 p-4">
          <RoiWeightSliders
            weights={weights}
            onChange={setWeights}
            from={from}
            to={to}
            onDateChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
            types={types}
            onTypesChange={setTypes}
          />

          {loading && <p className="text-sm text-neutral-500">Updating…</p>}

          {selection.kind === "compare" && events.length >= 2 && (
            <CompareView events={events} />
          )}

          {selectedEvent && (
            <EventAnalyticsPanel key={selectedEvent.event_id} event={selectedEvent} />
          )}

          {selectedRegion && (
            <RegionAnalyticsPanel
              region={selectedRegion}
              onSelectEvent={(id) => setSelection({ kind: "event", id })}
            />
          )}

          {selection.kind === "none" && !loading && (
            <Leaderboard
              events={events}
              onSelect={(id) => setSelection({ kind: "event", id })}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
