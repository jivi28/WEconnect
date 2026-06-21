"use client";

import { RotateCcw, Target } from "lucide-react";
import { GlassButton } from "./GlassButton";

export function TopBar({
  showReset,
  onReset,
  simulationCount,
}: {
  showReset: boolean;
  onReset: () => void;
  /** Guided simulations the signed-in account has completed. null = signed out / unknown. */
  simulationCount?: number | null;
}) {
  const hasCount = typeof simulationCount === "number";

  // Nothing to show (signed out, no reset) — collapse the bar so the simulator
  // content fills the space upward.
  if (!hasCount && !showReset) return null;

  return (
    <header
      className="flex h-[52px] shrink-0 items-center justify-end gap-3 bg-panel px-6"
      style={{ borderBottom: "1px solid #CC0000" }}
    >
      {hasCount && <SimCountBadge count={simulationCount as number} />}

      {showReset && (
        <GlassButton onClick={onReset} className="!rounded-xl !px-5 !py-2.5 !text-sm">
          <span className="flex items-center gap-2">
            <RotateCcw size={16} />
            Reset
          </span>
        </GlassButton>
      )}
    </header>
  );
}

/** Compact "N simulations" badge — reused on the start screen and the workspace bar. */
export function SimCountBadge({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2"
      title="Simulations you've completed"
    >
      <Target size={16} className="shrink-0 text-we-red" />
      <span className="text-base font-bold leading-none text-ink">{count}</span>
      <span className="text-[13px] text-ink-muted">
        {count === 1 ? "simulation" : "simulations"}
      </span>
    </div>
  );
}
