"use client";

import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import type {
  SimulationComponent,
  SimulationData,
  SimulationProcessStep,
} from "@/lib/types";
import { ALL_COMPONENTS } from "@/lib/simulation/weComponentData";
import type { SavedSimulation } from "@/lib/simulation/completions";

const MODE_LABEL: Record<SavedSimulation["mode"], string> = {
  guided: "Guided",
  challenge: "Weekly challenge",
  free: "Free build",
};

/** Normalize a saved build into an ordered list of components to display. */
function readBuild(saved: SavedSimulation): {
  components: { component: SimulationComponent; label?: string }[];
  processSteps: SimulationProcessStep[];
} {
  if (saved.mode === "free") {
    const ids = (saved.data as { componentIds?: string[] } | null)?.componentIds ?? [];
    const components = ids
      .map((id) => ALL_COMPONENTS.find((c) => c.id === id))
      .filter((c): c is SimulationComponent => Boolean(c))
      .map((component) => ({ component }));
    return { components, processSteps: [] };
  }
  const sim = saved.data as SimulationData | null;
  const components = (sim?.steps ?? []).map((step) => ({
    component: step.component,
    label: step.slotLabel,
  }));
  return { components, processSteps: sim?.processSteps ?? [] };
}

export function SimulationViewer({
  saved,
  onClose,
}: {
  saved: SavedSimulation | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {saved && <ViewerInner saved={saved} onClose={onClose} />}
    </AnimatePresence>
  );
}

function ViewerInner({
  saved,
  onClose,
}: {
  saved: SavedSimulation;
  onClose: () => void;
}) {
  const { components, processSteps } = readBuild(saved);
  const when = new Date(saved.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-we-red/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-we-red uppercase">
                {MODE_LABEL[saved.mode]}
              </span>
              <span className="text-[11px] text-ink-faint">{when}</span>
            </div>
            <h2 className="mt-1.5 truncate text-lg font-bold text-ink">
              {saved.title || saved.product || "Saved simulation"}
            </h2>
            <p className="text-[12px] text-ink-muted">
              {components.length} component{components.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-card-hover hover:text-ink"
          >
            <IconX size={18} />
          </button>
        </header>

        <div className="we-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {components.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-faint">
              This saved build has no component data.
            </p>
          ) : (
            <div className="flex flex-wrap items-stretch gap-3">
              {components.map(({ component, label }, i) => (
                <Fragment key={`${component.id}-${i}`}>
                  {i > 0 && (
                    <div className="flex items-center self-center">
                      <IconArrowRight size={20} color="#CC0000" opacity={0.6} />
                    </div>
                  )}
                  <div className="flex w-[180px] flex-col rounded-xl border border-line bg-card p-3">
                    {label && (
                      <span className="mb-1 text-[10px] font-semibold tracking-wide text-we-red uppercase">
                        {label}
                      </span>
                    )}
                    <span className="text-sm font-semibold leading-tight text-ink">
                      {component.name}
                    </span>
                    <span className="mt-1 text-[11px] text-ink-muted">
                      {component.category}
                    </span>
                    {component.partNumber && (
                      <span className="mt-auto pt-2 font-mono text-[10px] text-ink-faint">
                        {component.partNumber}
                      </span>
                    )}
                  </div>
                </Fragment>
              ))}
            </div>
          )}

          {processSteps.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Process
              </h3>
              <ol className="space-y-2">
                {processSteps.map((step) => (
                  <li key={step.id} className="rounded-lg bg-card px-3 py-2">
                    <p className="text-[13px] font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">
                      {step.explanation}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
