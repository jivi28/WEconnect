"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ScoredEvent } from "@/lib/types";
import { fmt } from "@/lib/format";

export function CompareView({ events }: { events: ScoredEvent[] }) {
  const [aId, setAId] = useState(events[0]?.event_id ?? "");
  const [bId, setBId] = useState(events[1]?.event_id ?? "");

  const a = events.find((e) => e.event_id === aId);
  const b = events.find((e) => e.event_id === bId);

  const data =
    a && b
      ? [
          { metric: "ROI", [a.name]: a.roi, [b.name]: b.roi },
          { metric: "New users", [a.name]: a.new_users, [b.name]: b.new_users },
          {
            metric: "Avg connections",
            [a.name]: Number(fmt(a.avg_connections)),
            [b.name]: Number(fmt(b.avg_connections)),
          },
          {
            metric: "Avg simulations",
            [a.name]: Number(fmt(a.avg_simulations)),
            [b.name]: Number(fmt(b.avg_simulations)),
          },
        ]
      : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-50">Compare events</h2>
      <div className="grid grid-cols-2 gap-2">
        <Picker value={aId} onChange={setAId} events={events} />
        <Picker value={bId} onChange={setBId} events={events} />
      </div>

      {a && b && (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8 }}>
              <XAxis dataKey="metric" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <ReTooltip contentStyle={{ background: "#171717", border: "1px solid #333" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={a.name} fill="#cc0000" radius={[3, 3, 0, 0]} />
              <Bar dataKey={b.name} fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Picker({
  value,
  onChange,
  events,
}: {
  value: string;
  onChange: (v: string) => void;
  events: ScoredEvent[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded bg-neutral-800 px-2 py-2 text-sm text-neutral-100"
    >
      {events.map((e) => (
        <option key={e.event_id} value={e.event_id}>
          {e.name}
        </option>
      ))}
    </select>
  );
}
