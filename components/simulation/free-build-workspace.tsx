"use client";

import { Fragment, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  IconArrowRight,
  IconArrowsMaximize,
  IconPlus,
  IconRotateClockwise,
  IconTrash,
} from "@tabler/icons-react";
import type { SimulationComponent } from "@/lib/types";
import { ALL_COMPONENTS } from "@/lib/simulation/weComponentData";
import { canConnect, sharedConnections } from "@/data/components";
import { cn } from "@/lib/utils";
import { ComponentLibrary } from "./component-library";
import { ComponentViewer3D } from "./ComponentViewer3D";
import { MovingDashedBorder } from "./moving-dashed-border";

const EMPTY = new Set<string>();

/**
 * Idea-agnostic "Free Build" mode. The full WEComponents/ catalogue is on the
 * left; the canvas is an open process chain. A part can be added only if it
 * shares a generic connection type (power / signal / ground) with the part
 * before it — so a sensible process assembles step by step without a target
 * product being defined up front.
 */
export function FreeBuildWorkspace({
  onExpand,
}: {
  onExpand: (component: SimulationComponent) => void;
}) {
  const [selected, setSelected] = useState<SimulationComponent | null>(null);
  const [chain, setChain] = useState<SimulationComponent[]>([]);
  const [wrong, setWrong] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashWrong(message: string) {
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setWrong(true);
    setReason(message);
    wrongTimer.current = setTimeout(() => setWrong(false), 320);
  }

  function add(component = selected) {
    if (!component) return;
    const last = chain[chain.length - 1];
    if (last && !canConnect(last.category, component.category)) {
      flashWrong(
        `${component.name} can't connect to ${last.name} — they share no power, signal or ground line.`,
      );
      return;
    }
    setChain((current) => [...current, component]);
    setSelected(null);
    setReason(null);
  }

  function undo() {
    setChain((current) => current.slice(0, -1));
    setReason(null);
  }

  function clear() {
    setChain([]);
    setSelected(null);
    setReason(null);
  }

  return (
    <div className="flex h-full min-h-0 bg-[#F5F5F5]">
      <ComponentLibrary
        components={ALL_COMPONENTS}
        selected={selected}
        usedIds={EMPTY}
        onSelect={setSelected}
        onExpand={onExpand}
        disableUsed={false}
        mode="freebuild"
      />

      <main className="flex min-w-0 flex-1 flex-col text-[#1a1a1a]">
        <header className="shrink-0 border-b border-[#dedede] bg-white/90 px-6 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Free build</h2>
              <p className="mt-1 text-xs text-[#777]">
                Add any part that shares a connection (power · signal · ground)
                with the one before it.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-[#ddd] bg-white px-3 py-1.5 text-xs font-medium text-[#666] shadow-sm">
                {chain.length} placed
              </span>
              <button
                type="button"
                onClick={undo}
                disabled={chain.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-medium text-[#555] transition-colors hover:border-[#CC0000] hover:text-[#CC0000] disabled:pointer-events-none disabled:opacity-40"
              >
                <IconRotateClockwise size={15} /> Undo
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={chain.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-medium text-[#555] transition-colors hover:border-[#CC0000] hover:text-[#CC0000] disabled:pointer-events-none disabled:opacity-40"
              >
                <IconTrash size={15} /> Clear
              </button>
            </div>
          </div>
        </header>

        <div className="simulation-grid we-scroll flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto p-10">
          {chain.length === 0 && !selected && (
            <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-[#888]">
              Pick a component on the left, then drop it here to start your
              process. There&apos;s no wrong destination — only connections that
              fit.
            </p>
          )}

          <div className="flex w-full max-w-full flex-wrap items-start justify-start gap-4">
            {chain.map((component, index) => {
              const prev = chain[index - 1];
              const link = prev
                ? sharedConnections(prev.category, component.category)[0]
                : null;
              return (
                <Fragment key={`${component.id}-${index}`}>
                  {index > 0 && <Connector label={link} />}
                  <PlacedCard component={component} onExpand={onExpand} />
                </Fragment>
              );
            })}

            {chain.length > 0 && <Connector label={null} dim />}

            {/* One-shot "square being formed" entrance, plays once on mount.
                Wrapper keeps framer-motion's transform off the inner button so
                the slot-wrong shake still works. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, clipPath: "inset(42% 42% 42% 42%)" }}
              animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-[256px] w-[210px] shrink-0"
            >
              <button
                type="button"
                onClick={() => add()}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const componentId =
                    event.dataTransfer.getData("application/x-we-component") ||
                    event.dataTransfer.getData("text/plain");
                  const component = ALL_COMPONENTS.find(
                    (candidate) => candidate.id === componentId,
                  );
                  add(component);
                }}
                className={cn(
                  "placement-target flex h-[200px] w-[210px] flex-col items-center justify-center gap-2 rounded-[20px] transition-colors",
                  selected
                    ? "placement-target-ready cursor-pointer text-[#CC0000]"
                    : "text-[#bbb]",
                  wrong && "slot-wrong border-[#ff4444] bg-[#fff8f8]",
                )}
              >
                <MovingDashedBorder active={!!selected} />
                <IconPlus size={30} />
                <span className="px-2 text-center text-[11px] font-medium text-current">
                  {selected ? "Place here" : "Add component"}
                </span>
              </button>
            </motion.div>
          </div>

          {reason && (
            <motion.p
              key={reason}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 max-w-lg rounded-xl border border-[#CC0000]/20 bg-white/80 px-4 py-2.5 text-center text-xs text-[#CC0000] shadow-sm"
            >
              {reason}
            </motion.p>
          )}
        </div>
      </main>
    </div>
  );
}

function Connector({ label, dim }: { label: string | null; dim?: boolean }) {
  return (
    <div className="mt-[88px] flex flex-col items-center">
      <IconArrowRight size={24} color="#CC0000" opacity={dim ? 0.35 : 0.7} />
      {label && (
        <span className="mt-1 text-[9px] font-medium tracking-wide text-[#CC0000] uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

function PlacedCard({
  component,
  onExpand,
}: {
  component: SimulationComponent;
  onExpand: (component: SimulationComponent) => void;
}) {
  const hasModel = component.has3DModel && component.modelPath;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, clipPath: "inset(42% 42% 42% 42%)" }}
      animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-[256px] w-[210px] shrink-0"
    >
      {hasModel ? (
        <>
          <div className="shiny-red-frame relative h-[200px] overflow-hidden rounded-[20px] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.09)]">
            <div
              className="h-full overflow-hidden rounded-[19px]"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <ComponentViewer3D
                modelPath={component.modelPath!}
                height={200}
                autoRotate={false}
                enableZoom={false}
                enablePan={false}
                enableRotate
                cameraPosition={[1.5, 1, 1.5]}
                fov={45}
                normalizeTo={1.7}
                fitMode="bounding-sphere"
              />
            </div>
            <button
              type="button"
              aria-label={`Expand ${component.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onExpand(component);
              }}
              className="absolute top-2 right-2 rounded-lg bg-white/85 p-1.5 text-[#444] opacity-0 shadow-md transition-opacity group-hover:opacity-100"
            >
              <IconArrowsMaximize size={15} />
            </button>
          </div>
          <div className="mt-2 flex min-h-[48px] items-center justify-center rounded-xl border border-[#ddd] bg-white px-5 text-center shadow-sm">
            <span className="line-clamp-3 break-words text-xs leading-tight font-semibold">
              {component.name}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="shiny-red-frame flex h-[200px] items-center justify-center rounded-[20px] bg-white px-4 text-center shadow-[0_14px_32px_rgba(0,0,0,0.09)]" />
          <div className="mt-2 flex min-h-[48px] items-center justify-center rounded-xl border border-[#ddd] bg-white px-5 text-center shadow-sm">
            <span className="line-clamp-3 text-xs leading-tight font-semibold">
              {component.name}
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}
