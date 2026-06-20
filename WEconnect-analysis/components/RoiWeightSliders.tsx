"use client";

import type { RoiWeights } from "@/lib/types";

export const EVENT_TYPES: { id: string; label: string }[] = [
  { id: "career", label: "Career / uni" },
  { id: "seminar", label: "Seminar" },
  { id: "exhibition", label: "Exhibition" },
  { id: "other", label: "Other" },
];

interface Props {
  weights: RoiWeights;
  onChange: (w: RoiWeights) => void;
  from: string;
  to: string;
  onDateChange: (from: string, to: string) => void;
  types: string[];
  onTypesChange: (types: string[]) => void;
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-wurth-red"
      />
    </label>
  );
}

export function RoiWeightSliders({
  weights,
  onChange,
  from,
  to,
  onDateChange,
  types,
  onTypesChange,
}: Props) {
  const toggle = (id: string) => {
    onTypesChange(
      types.includes(id) ? types.filter((t) => t !== id) : [...types, id]
    );
  };
  return (
    <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="text-sm font-semibold text-neutral-200">ROI weighting</div>
      <Slider
        label="New users"
        value={weights.users}
        onChange={(v) => onChange({ ...weights, users: v })}
      />
      <Slider
        label="Connections"
        value={weights.connections}
        onChange={(v) => onChange({ ...weights, connections: v })}
      />
      <Slider
        label="Simulations"
        value={weights.simulations}
        onChange={(v) => onChange({ ...weights, simulations: v })}
      />

      <div className="border-t border-neutral-800 pt-3">
        <div className="text-sm font-semibold text-neutral-200">Filters</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs text-neutral-400">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => onDateChange(e.target.value, to)}
              className="mt-1 w-full rounded bg-neutral-800 px-2 py-1 text-neutral-100"
            />
          </label>
          <label className="text-xs text-neutral-400">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => onDateChange(from, e.target.value)}
              className="mt-1 w-full rounded bg-neutral-800 px-2 py-1 text-neutral-100"
            />
          </label>
        </div>
        <div className="mt-3">
          <div className="text-xs text-neutral-400">Event types</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {EVENT_TYPES.map((t) => {
              const active = types.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`rounded-full px-2.5 py-1 text-xs transition ${
                    active
                      ? "bg-wurth-red text-white"
                      : "border border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
