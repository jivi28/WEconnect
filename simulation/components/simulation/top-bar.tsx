"use client";

import { RotateCcw } from "lucide-react";
import { WeLogo } from "./we-logo";
import { GlassButton } from "./GlassButton";

export function TopBar({
  showReset,
  onReset,
}: {
  showReset: boolean;
  onReset: () => void;
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
