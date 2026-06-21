"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconArrowRight, IconCircleX } from "@tabler/icons-react";
import type {
  AIComponentSelection,
  SimulationComponent,
  SimulationData,
} from "@/lib/types";
import { ALL_COMPONENTS } from "@/lib/simulation/weComponentData";
import { TopBar } from "./top-bar";
import { IdeaInput } from "./idea-input";
import { PuzzleWorkspace } from "./puzzle-workspace";
import { FreeBuildWorkspace } from "./free-build-workspace";
import { ComponentModal3D } from "./ComponentModal3D";
import { GlassButton, GlassSVGFilter } from "./GlassButton";
import { ShaderAnimation } from "./shader-animation";
import { WeLogo } from "./we-logo";

type Step =
  | "input"
  | "loading"
  | "freeloading"
  | "workspace"
  | "freebuild"
  | "error";

const SUGGESTED_IDEAS = [
  "USB-C Charger",
  "Solar Inverter",
  "Smart Home Hub",
  "Motor Drive",
] as const;

function productTitle(idea: string) {
  return idea.trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function iconKey(icon: string) {
  return icon.replace(/^ti-/, "").replace(/^icon-/, "").toLowerCase();
}

export function Simulator() {
  const [step, setStep] = useState<Step>("input");
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [expanded, setExpanded] = useState<SimulationComponent | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [serviceError, setServiceError] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      aiRequest.current?.abort();
    };
  }, []);

  const handleSubmit = useCallback(async (idea: string) => {
    aiRequest.current?.abort();
    const controller = new AbortController();
    aiRequest.current = controller;
    setExpanded(null);
    setSimulation(null);
    setErrorMessage("");
    setServiceError(false);
    setStep("loading");

    try {
      const response = await fetch("/api/simulation/select", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productIdea: idea }),
        signal: controller.signal,
      });
      const result = (await response.json()) as AIComponentSelection & {
        errorCode?: string;
      };
      if (controller.signal.aborted) return;

      if (!response.ok) {
        setServiceError(true);
        setErrorMessage(
          result.errorMessage ??
            "The AI service is temporarily unavailable. Please try again shortly.",
        );
        setStep("error");
        return;
      }

      const validatedSteps = (Array.isArray(result.steps) ? result.steps : [])
        .filter((selectionStep) => {
          const found = ALL_COMPONENTS.find(
            (component) => component.id === selectionStep.componentId,
          );
          if (!found) {
            console.warn(
              "AI returned unknown component id:",
              selectionStep.componentId,
            );
            return false;
          }
          return true;
        })
        .sort((a, b) => a.slotNumber - b.slotNumber);

      if (!result.canBuild || validatedSteps.length < 3) {
        setServiceError(false);
        setErrorMessage(
          result.errorMessage ??
            "The available EMC catalogue cannot form a meaningful version of that product yet. Try a power-conversion or connected-electronics idea instead.",
        );
        setStep("error");
        return;
      }

      const steps = validatedSteps.map((selectionStep, index) => {
        const component = ALL_COMPONENTS.find(
          (candidate) => candidate.id === selectionStep.componentId,
        )!;
        return {
          slotNumber: index + 1,
          slotLabel: selectionStep.slotLabel,
          slotIcon: iconKey(selectionStep.slotIcon),
          component: {
            ...component,
            hint: selectionStep.learnerTip,
          },
        };
      });

      const processSteps = (result.processSteps ?? []).map(
        (processStep, index) => ({
          id: `process-${index + 1}`,
          insertAfterComponent: processStep.insertAfterComponent,
          title: processStep.title,
          explanation: processStep.explanation,
        }),
      );

      setSimulation({
        productName: productTitle(idea),
        steps,
        processSteps,
        illustrationPlan: result.illustrationPlan,
      });
      setStep("workspace");
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Component selection request failed:", error);
      setServiceError(true);
      setErrorMessage(
        "We could not analyse your idea right now. Check the AI configuration and try again in a moment.",
      );
      setStep("error");
    }
  }, []);

  const handleFreeBuild = useCallback(() => {
    aiRequest.current?.abort();
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setSimulation(null);
    setStep("freeloading");
    loadingTimer.current = setTimeout(() => {
      setStep("freebuild");
    }, 2200);
  }, []);

  const handleReset = useCallback(() => {
    aiRequest.current?.abort();
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    setStep("input");
    setSimulation(null);
    setExpanded(null);
    setErrorMessage("");
    setServiceError(false);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0d0d0d]">
      <GlassSVGFilter />
      <TopBar
        showReset={step === "workspace" || step === "freebuild"}
        onReset={handleReset}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              className="absolute inset-0 flex flex-col"
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <IdeaInput onSubmit={handleSubmit} onFreeBuild={handleFreeBuild} />
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div
              key="ai-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex bg-[#141414]"
            >
              <div className="hidden w-[340px] shrink-0 border-r border-[#2a2a2a] bg-[#141414] md:block" />
              <div className="simulation-grid flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <WeLogo size={54} />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5 text-[13px] font-medium text-[#777]"
                  >
                    Analysing your idea...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-1.5 text-[11px] text-[#999]"
                  >
                    Scanning 76 Würth Elektronik components
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {step === "freeloading" && (
            <motion.div
              key="free-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black"
            >
              <ShaderAnimation />
              <div className="pointer-events-none absolute inset-x-0 bottom-10 flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#CC0000]" />
                  Assembling your workspace...
                </div>
              </div>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="idea-radial absolute inset-0 flex items-center justify-center p-6"
            >
              <div className="w-full max-w-[480px] rounded-2xl border border-[#2a2a2a] bg-[#141414] p-7 text-center shadow-2xl">
                <IconCircleX className="mx-auto text-[#CC0000]" size={48} />
                <h2 className="mt-4 text-lg font-bold text-white">
                  {serviceError
                    ? "Gemini is cooling down"
                    : "We can&apos;t build that yet"}
                </h2>
                <p className="mt-3 text-[13px] leading-[1.7] text-[#aaa]">
                  {errorMessage}
                </p>
                {!serviceError && (
                  <div className="mt-6 border-t border-[#2a2a2a] pt-5">
                    <p className="text-xs font-medium text-[#888]">
                      Suggested ideas you CAN build:
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {SUGGESTED_IDEAS.map((idea) => (
                        <button
                          key={idea}
                          type="button"
                          onClick={() => handleSubmit(idea)}
                          className="rounded-full border border-[#CC0000]/50 bg-[#1a0000] px-3 py-1.5 text-xs text-[#ffb3b3] hover:border-[#CC0000] hover:text-white"
                        >
                          {idea}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <GlassButton
                  onClick={handleReset}
                  className="mx-auto mt-6 !rounded-xl !px-5 !py-2.5 !text-sm"
                >
                  <span className="flex items-center gap-2">
                    Try a different idea
                    <IconArrowRight size={15} />
                  </span>
                </GlassButton>
              </div>
            </motion.div>
          )}

          {step === "workspace" && simulation && (
            <motion.div
              key="workspace"
              className="absolute inset-0"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <PuzzleWorkspace data={simulation} onExpand={setExpanded} />
            </motion.div>
          )}

          {step === "freebuild" && (
            <motion.div
              key="freebuild"
              className="absolute inset-0"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <FreeBuildWorkspace onExpand={setExpanded} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ComponentModal3D
        component={expanded}
        mode={step === "freebuild" ? "freebuild" : "guided"}
        productName={simulation?.productName}
        onClose={() => setExpanded(null)}
      />
    </div>
  );
}
