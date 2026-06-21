"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconArrowsMaximize, IconBox } from "@tabler/icons-react";
import type { SimulationComponent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "./category-icon";
import { ComponentViewer3D } from "./ComponentViewer3D";

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function ComponentLibrary({
  components,
  selected,
  usedIds,
  onSelect,
  onExpand,
  disableUsed = true,
  mode = "puzzle",
}: {
  components: SimulationComponent[];
  selected: SimulationComponent | null;
  usedIds: Set<string>;
  onSelect: (component: SimulationComponent) => void;
  onExpand: (component: SimulationComponent) => void;
  /** Grey out + disable already-placed parts (puzzle); off for Free Build. */
  disableUsed?: boolean;
  /**
   * Which data the hint box shows: "puzzle" → the `hint` (why it fits the
   * product); "freebuild" → the technical characteristics bullet list.
   */
  mode?: "puzzle" | "freebuild";
}) {
  const [shuffled] = useState(() => shuffle([...components]));
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Categories present in the current set, in first-seen order.
  const categories = Array.from(new Set(shuffled.map((c) => c.category)));

  const q = query.trim().toLowerCase();
  const visible = shuffled.filter((component) => {
    const matchesCategory =
      activeCategory === "All" || component.category === activeCategory;
    const matchesQuery = !q || component.name.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const isFreeBuild = mode === "freebuild";

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-r border-[#e2e2e2] bg-white shadow-[12px_0_30px_rgba(0,0,0,0.05)]">
      <header className="shrink-0 border-b border-[#e2e2e2] p-4">
        <h2 className="text-base font-semibold tracking-tight text-[#1a1a1a]">Components</h2>
        <p className="mt-1 text-xs text-[#888]">
          {isFreeBuild
            ? "Drag a part into the build area"
            : "Select a part for a helpful placement tip"}
        </p>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search components..."
          className="mt-3 w-full rounded-xl border border-[#ddd] bg-[#f6f6f6] px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#999] focus:border-[#CC0000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {["All", ...categories].map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full border border-[#ddd] px-2.5 py-1 text-[10px] font-medium transition-colors",
                  active
                    ? "border-[#CC0000] bg-[#CC0000] text-white"
                    : "bg-transparent text-[#555] hover:border-[#CC0000] hover:text-[#CC0000]",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </header>

      <div className="we-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {visible.length === 0 && (
          <p className="px-2 py-6 text-center text-[10px] text-[#666] italic">
            No components match.
          </p>
        )}
        {visible.map((component) => {
          const used = disableUsed && usedIds.has(component.id);
          const active = selected?.id === component.id;
          const Icon = getCategoryIcon(component.category);
          const hasModel = component.has3DModel && component.modelPath;

          return (
            <motion.div
              key={component.id}
              role="button"
              draggable={!used}
              tabIndex={used ? -1 : 0}
              aria-disabled={used}
              animate={{ scale: active ? 1.02 : 1 }}
              transition={{ duration: 0.18 }}
              onHoverStart={() => setHoveredId(component.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => {
                if (!used) {
                  onSelect(component);
                  onExpand(component);
                }
              }}
              onDragStartCapture={(event) => {
                if (used) {
                  event.preventDefault();
                  return;
                }
                onSelect(component);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", component.id);
                event.dataTransfer.setData("application/x-we-component", component.id);
              }}
              onKeyDown={(event) => {
                if (!used && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onSelect(component);
                }
              }}
              className={cn(
                "mb-2 flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition-colors shadow-sm",
                active
                  ? "border-[#CC0000] bg-[#fdecea]"
                  : "border-[#e2e2e2] hover:border-[#CC0000]",
                used && "pointer-events-none cursor-not-allowed opacity-30 grayscale",
              )}
            >
              <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl border border-[#e2e2e2] bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8),0_6px_18px_rgba(0,0,0,0.18)]">
                {hasModel ? (
                  <>
                    <ComponentViewer3D
                      modelPath={component.modelPath!}
                      height={104}
                      autoRotate
                      enableControls={false}
                      normalizeTo={1.7}
                      stopPointerPropagation={false}
                    />
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-[#CC0000] px-1.5 py-1 text-[9px] font-bold text-white shadow-lg">
                      <IconBox size={10} /> 3D
                    </span>
                    <button
                      type="button"
                      aria-label={`Expand ${component.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onExpand(component);
                      }}
                      className="absolute top-1.5 right-1.5 rounded-lg bg-black/65 p-1.5 text-white/75 transition-colors hover:text-white"
                    >
                      <IconArrowsMaximize size={15} />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Icon size={40} color="#555" strokeWidth={1.4} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm leading-snug font-semibold text-[#1a1a1a]">
                  {component.name}
                </p>
                <span className="mt-2 inline-flex rounded-full bg-[#CC0000] px-2 py-1 text-[10px] leading-none text-white">
                  {component.category}
                </span>
                <p className="mt-1.5 truncate font-mono text-[10px] text-[#777]">
                  {component.partNumber}
                </p>
                <motion.p
                  initial={false}
                  animate={{ opacity: hoveredId === component.id ? 1 : 0 }}
                  transition={{ duration: 0.16 }}
                  className="mt-2 text-[9px] font-medium text-[#777]"
                >
                  View details →
                </motion.p>
              </div>
            </motion.div>
          );
        })}
      </div>

    </aside>
  );
}
