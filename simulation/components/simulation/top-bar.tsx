"use client";

import { RotateCcw, Target } from "lucide-react";
import { WeLogo } from "./we-logo";
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
  return (
    <header
      className="flex h-[76px] shrink-0 items-center justify-between bg-panel px-6"
      style={{ borderBottom: "1px solid #CC0000" }}
    >
      <div className="flex items-center gap-4">
        <WeLogo size={42} />
        <div className="flex flex-col leading-tight">
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            Innovation Simulator
          </h1>
          <p className="hidden text-[13px] text-ink-muted sm:block">
            Describe your idea. We&apos;ll find the components.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {typeof simulationCount === "number" && (
          <div
            className="flex items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2"
            title="Simulations you've completed"
          >
            <Target size={16} className="shrink-0 text-we-red" />
            <span className="text-base font-bold leading-none text-ink">
              {simulationCount}
            </span>
            <span className="hidden text-[13px] text-ink-muted sm:inline">
              {simulationCount === 1 ? "simulation" : "simulations"}
            </span>
          </div>
        )}

        {showReset && (
          <GlassButton onClick={onReset} className="!rounded-xl !px-5 !py-2.5 !text-sm">
            <span className="flex items-center gap-2">
              <RotateCcw size={16} />
              Reset
            </span>
          </GlassButton>
        )}
      </div>
    </header>
  );
}
