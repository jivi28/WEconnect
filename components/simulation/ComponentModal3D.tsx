"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconX } from "@tabler/icons-react";
import type { SimulationComponent } from "@/lib/types";
import { COMPONENT_CHARACTERISTICS } from "@/lib/simulation/componentCharacteristics";
import { ComponentViewer3D } from "./ComponentViewer3D";

export function ComponentModal3D({
  component,
  mode = "guided",
  productName,
  onClose,
}: {
  component: SimulationComponent | null;
  mode?: "guided" | "freebuild";
  productName?: string;
  onClose: () => void;
}) {
  const characteristics = component
    ? COMPONENT_CHARACTERISTICS[component.id] ?? []
    : [];

  useEffect(() => {
    if (!component) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [component, onClose]);

  return (
    <AnimatePresence>
      {component && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={`${component.name} details`}
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[88dvh] w-[min(760px,94vw)] flex-col overflow-hidden rounded-[24px] border border-[#dccfb8] bg-[#fff8ea] shadow-[0_28px_90px_rgba(0,0,0,0.35)]"
          >
            <button
              type="button"
              aria-label="Close component details"
              onClick={onClose}
              className="absolute top-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/55 bg-[linear-gradient(145deg,rgba(220,35,35,0.96),rgba(125,0,0,0.94))] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.5),0_10px_24px_rgba(120,0,0,0.32)] backdrop-blur-xl transition-colors hover:border-white/80"
            >
              <IconX className="relative z-10" size={23} stroke={2.2} />
            </button>
            <div className="relative h-[300px] shrink-0 border-b border-[#e0d5c2] bg-[#fffdf7]">
              <ComponentViewer3D
                modelPath={component.modelPath ?? "/models/cuboid.gltf"}
                height={300}
                autoRotate
                enableControls
                enableZoom
                enablePan
                enableRotate
                normalizeTo={1.45}
              />
              <p className="pointer-events-none absolute bottom-3 left-4 text-[10px] text-[#756c60]">
                Drag to rotate · scroll to zoom
              </p>
            </div>

            <div className="we-scroll min-h-0 flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-semibold leading-snug text-[#211d18]">
                {component.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#CC0000] px-2 py-1 text-[10px] text-white">
                  {component.category}
                </span>
                {component.subcategory && (
                  <span className="text-[11px] text-[#6f665b]">
                    {component.subcategory}
                  </span>
                )}
              </div>
              <p className="mt-2 font-mono text-[11px] text-[#7d7367]">
                {component.partNumber}
              </p>

              <div className="my-5 h-px bg-[#e0d5c2]" />

              {mode === "freebuild" ? (
                <section>
                  <h3 className="text-[10px] font-semibold tracking-[0.1em] text-[#756c60] uppercase">
                    Specifications
                  </h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[11px] leading-[1.7] text-[#554d44] marker:text-[#CC0000]">
                    {characteristics.map((characteristic) => (
                      <li key={characteristic}>{characteristic}</li>
                    ))}
                  </ul>
                </section>
              ) : (
                <section>
                  <h3 className="text-[10px] font-semibold tracking-[0.1em] text-[#756c60] uppercase">
                    Engineering tip for your {productName ?? "product"}
                  </h3>
                  <p className="mt-3 rounded-xl border border-[#e3d5bf] bg-white/65 p-4 text-[13px] leading-[1.75] text-[#403830] shadow-sm">
                    {component.hint}
                  </p>
                  <p className="mt-3 text-[10px] leading-relaxed text-[#85796b]">
                    Use the technical clue to decide where this belongs. The answer is intentionally not shown here.
                  </p>
                </section>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
