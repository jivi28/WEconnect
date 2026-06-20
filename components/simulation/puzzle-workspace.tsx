"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  IconActivity,
  IconArrowRight,
  IconArrowsMaximize,
  IconBolt,
  IconCheck,
  IconCornerDownRight,
  IconCpu,
  IconDeviceMobile,
  IconFilter,
  IconLock,
  IconPlug,
  IconRoute,
  IconShield,
  IconTemperature,
  type Icon,
} from "@tabler/icons-react";
import type {
  SimulationComponent,
  SimulationData,
  SimulationProcessStep,
  SimulationStep,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ComponentLibrary } from "./component-library";
import { ComponentViewer3D } from "./ComponentViewer3D";
import { CategoryIcon } from "./category-icon";
import { MovingDashedBorder } from "./moving-dashed-border";
import { ProductConceptDrawing } from "./product-concept-drawing";

const SLOT_ICONS: Record<string, Icon> = {
  activity: IconActivity,
  bolt: IconBolt,
  cpu: IconCpu,
  device: IconDeviceMobile,
  filter: IconFilter,
  plug: IconPlug,
  shield: IconShield,
  temperature: IconTemperature,
};

export function PuzzleWorkspace({
  data,
  onExpand,
  onComplete,
}: {
  data: SimulationData;
  onExpand: (component: SimulationComponent) => void;
  onComplete?: () => void;
}) {
  const [selected, setSelected] = useState<SimulationComponent | null>(null);
  const [placed, setPlaced] = useState<Record<number, SimulationComponent>>({});
  const [wrongSlot, setWrongSlot] = useState<number | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const celebrated = useRef(false);
  const placedCount = Object.keys(placed).length;
  const complete = placedCount === data.steps.length;
  const usedIds = new Set(Object.values(placed).map((component) => component.id));

  useEffect(() => {
    if (!complete || celebrated.current) return;
    celebrated.current = true;
    onComplete?.();
    const timer = setTimeout(() => {
      const rect = revealRef.current?.getBoundingClientRect();
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#CC0000", "#ffffff", "#1a1a1a"],
        origin: rect
          ? {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            }
          : { x: 0.75, y: 0.5 },
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [complete]);

  useEffect(() => {
    return () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    };
  }, []);

  function place(step: SimulationStep, component = selected) {
    if (!component) return;
    if (component.id !== step.component.id) {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      setWrongSlot(step.slotNumber);
      wrongTimer.current = setTimeout(() => setWrongSlot(null), 650);
      return;
    }
    setPlaced((current) => {
      if (current[step.slotNumber]) return current;
      return { ...current, [step.slotNumber]: component };
    });
    setSelected(null);
  }

  type StoryItem =
    | { kind: "component"; step: SimulationStep }
    | { kind: "process"; step: SimulationProcessStep };
  const storyItems: StoryItem[] = [];
  const appendProcesses = (position: number) => {
    (data.processSteps ?? [])
      .filter((process) => process.insertAfterComponent === position)
      .forEach((process) => storyItems.push({ kind: "process", step: process }));
  };
  appendProcesses(0);
  data.steps.forEach((step, index) => {
    storyItems.push({ kind: "component", step });
    appendProcesses(index + 1);
  });

  const rows: StoryItem[][] = [];
  for (let i = 0; i < storyItems.length; i += 4) {
    rows.push(storyItems.slice(i, i + 4));
  }

  return (
    <div className="flex h-full min-h-0 bg-[#F5F5F5]">
      <ComponentLibrary
        components={data.steps.map((step) => step.component)}
        selected={selected}
        usedIds={usedIds}
        onSelect={setSelected}
        onExpand={onExpand}
      />

      <main className="simulation-grid flex min-w-0 flex-1 flex-col text-[#1a1a1a]">
        <header className="shrink-0 border-b border-[#dedede] bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between px-6 py-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#CC0000] uppercase">Guided assembly</p>
              <h2 className="mt-1 text-base font-semibold tracking-tight">{data.productName}</h2>
              <p className="mt-0.5 text-[10px] text-[#888]">
                Place matching components in any order
              </p>
            </div>
            <span className="rounded-full border border-[#ddd] bg-white px-3 py-1.5 text-xs font-medium text-[#666] shadow-sm">
              {placedCount} / {data.steps.length} placed
            </span>
          </div>
          <div className="h-1 bg-[#eee]">
            <motion.div
              className="h-full bg-[#CC0000]"
              animate={{ width: `${(placedCount / data.steps.length) * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </header>

        <div className="we-scroll min-h-0 flex-1 overflow-auto px-10 py-8">
          <div className="mx-auto flex w-max min-w-full flex-col items-center gap-8">
            {rows.map((row, rowIndex) => {
              const lastRow = rowIndex === rows.length - 1;
              return (
                <div key={`row-${rowIndex}`} className="relative flex items-center gap-4">
                  {row.map((item, index) => (
                    <div
                      key={item.kind === "component" ? `component-${item.step.slotNumber}` : item.step.id}
                      className="flex items-center gap-4"
                    >
                      {item.kind === "component" ? (
                        <PuzzleSlot
                          step={item.step}
                          selected={selected}
                          placed={placed[item.step.slotNumber]}
                          wrong={wrongSlot === item.step.slotNumber}
                          onPlace={() => place(item.step)}
                          onDropComponent={(componentId) => {
                            const component = data.steps.find(
                              ({ component: candidate }) => candidate.id === componentId,
                            )?.component;
                            place(item.step, component);
                          }}
                          onExpand={onExpand}
                        />
                      ) : (
                        <ProcessCard step={item.step} />
                      )}
                      {(index < row.length - 1 || lastRow) && (
                        <IconArrowRight
                          className="-translate-y-7"
                          size={24}
                          color="#CC0000"
                          opacity={0.62}
                        />
                      )}
                    </div>
                  ))}
                  {lastRow && (
                    <RevealCard
                      ref={revealRef}
                      complete={complete}
                      productName={data.productName}
                      illustrationPlan={data.illustrationPlan}
                    />
                  )}
                  {!lastRow && (
                    <IconCornerDownRight
                      className="absolute -right-10 -bottom-9"
                      size={28}
                      color="#CC0000"
                      opacity={0.6}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProcessCard({ step }: { step: SimulationProcessStep }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex h-[256px] w-[210px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-[#dfcdae] bg-[#fff8ea] shadow-[0_14px_32px_rgba(0,0,0,0.07)]"
    >
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-[#eadcc6] px-4 text-[#9b1c1c]">
        <IconRoute className="shrink-0" size={17} />
        <span className="leading-none text-[9px] font-bold tracking-[0.14em] uppercase">
          System story
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        <h3 className="line-clamp-3 text-[13px] font-semibold leading-[1.3] text-[#2b241c]">
          {step.title}
        </h3>
        <p className="mt-2 line-clamp-7 text-[10px] leading-[1.5] text-[#6d6255]">
          {step.explanation}
        </p>
      </div>
      <p className="shrink-0 border-t border-[#eadcc6] px-4 py-2 text-[9px] leading-none text-[#9a8d7c]">
        Context only · no component needed
      </p>
    </motion.article>
  );
}

function PuzzleSlot({
  step,
  selected,
  placed,
  wrong,
  onPlace,
  onDropComponent,
  onExpand,
}: {
  step: SimulationStep;
  selected: SimulationComponent | null;
  placed?: SimulationComponent;
  wrong: boolean;
  onPlace: () => void;
  onDropComponent: (componentId: string) => void;
  onExpand: (component: SimulationComponent) => void;
}) {
  const SlotIcon = SLOT_ICONS[step.slotIcon] ?? IconCpu;

  if (placed) {
    const hasModel = placed.has3DModel && placed.modelPath;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
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
                  modelPath={placed.modelPath!}
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
                aria-label={`Expand ${placed.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onExpand(placed);
                }}
                className="absolute top-2 right-2 rounded-lg bg-white/85 p-1.5 text-[#444] opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              >
                <IconArrowsMaximize size={15} />
              </button>
            </div>
            <div className="relative mt-2 flex min-h-[48px] items-center justify-center rounded-xl border border-[#ddd] bg-white px-5 pr-9 text-center shadow-sm">
              <span className="line-clamp-3 break-words text-xs leading-tight font-semibold">
                {placed.name}
              </span>
              <IconCheck size={15} className="absolute right-3 text-[#CC0000]" />
            </div>
          </>
        ) : (
          <>
            <div className="shiny-red-frame relative flex h-[200px] items-center justify-center rounded-[20px] bg-white px-4 text-center shadow-[0_14px_32px_rgba(0,0,0,0.09)]">
              <CategoryIcon
                category={placed.category}
                size={40}
                className="border-0 bg-transparent text-[#777]"
              />
              <IconCheck className="absolute top-3 right-3 text-[#CC0000]" size={15} />
            </div>
            <div className="mt-2 flex min-h-[48px] items-center justify-center rounded-xl border border-[#ddd] bg-white px-5 text-center shadow-sm">
              <span className="line-clamp-3 break-words text-xs leading-tight font-semibold">
                {placed.name}
              </span>
            </div>
          </>
        )}
      </motion.div>
    );
  }

  return (
    // One-shot "square being formed" entrance on a wrapper, staggered per slot
    // (plays once when the workspace mounts). The shake stays on the inner
    // button so the CSS transform animation doesn't fight framer-motion's.
    <motion.div
      initial={{ opacity: 0, scale: 0.5, clipPath: "inset(42% 42% 42% 42%)" }}
      animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" }}
      transition={{
        delay: 0.25 + (step.slotNumber - 1) * 0.09,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const componentId =
          event.dataTransfer.getData("application/x-we-component") ||
          event.dataTransfer.getData("text/plain");
        if (componentId) onDropComponent(componentId);
      }}
      className="h-[256px] w-[210px] shrink-0"
    >
      <button
        type="button"
        aria-label={`Place selected component in ${step.slotLabel}`}
        onClick={onPlace}
        className={cn(
          "placement-target relative h-[200px] w-[210px] rounded-[20px] text-[#777] transition-colors",
          selected && "placement-target-ready cursor-pointer text-[#CC0000]",
          !selected && "cursor-default",
          wrong && "slot-wrong border-[#ff4444] bg-[#fff8f8]",
        )}
      >
        <MovingDashedBorder active={!!selected} />
        <span className="absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full border border-[#ddd] bg-white text-[10px] font-semibold text-[#aaa] shadow-sm">
          {String(step.slotNumber).padStart(2, "0")}
        </span>
        <SlotIcon className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-current opacity-45" size={30} />
        <span className="absolute right-2 bottom-3 left-2 text-center text-[11px] font-medium text-[#999]">
          {step.slotLabel}
        </span>
      </button>
    </motion.div>
  );
}

const RevealCard = motion.create(
  ({ complete, productName, illustrationPlan, ref }: { complete: boolean; productName: string; illustrationPlan: SimulationData["illustrationPlan"]; ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className="h-[256px] w-[210px] shrink-0 text-center">
      <motion.div
        animate={
          complete
            ? { borderColor: "#CC0000", scale: [1, 1.08, 1] }
            : { borderColor: "#cccccc", scale: 1 }
        }
        transition={{ duration: complete ? 0.4 : 0.3, ease: "easeInOut" }}
        className={cn(
          "relative h-[200px] w-[210px] overflow-hidden rounded-[20px] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.09)]",
          complete ? "border" : "border-2 border-dashed",
        )}
      >
        {complete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.45 }}
            className="h-full w-full"
          >
            <ProductConceptDrawing
              productName={productName}
              plan={illustrationPlan}
            />
          </motion.div>
        ) : (
          <motion.div exit={{ opacity: 0 }} className="flex h-full flex-col items-center justify-center gap-3 text-[#bbb]">
            <IconLock size={30} />
            <span className="text-[11px] font-medium">Complete to unlock</span>
          </motion.div>
        )}
      </motion.div>
      {complete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <p className="mt-2 text-[13px] font-semibold text-[#CC0000]">{productName}</p>
          <p className="text-[10px] text-[#888]">
            System complete · concept drawing
          </p>
        </motion.div>
      )}
    </div>
  ),
);
