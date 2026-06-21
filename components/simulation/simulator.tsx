"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconArrowRight, IconCircleX } from "@tabler/icons-react";
import { Trophy } from "lucide-react";
import type {
  AIComponentSelection,
  SimulationComponent,
  SimulationData,
} from "@/lib/types";
import { ALL_COMPONENTS } from "@/lib/simulation/weComponentData";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { getWeekKey, getWeeklyProduct } from "@/lib/weekly/challenge";
import { awardWeeklyPoint } from "@/lib/weekly/scores";
import { TopBar } from "./top-bar";
import { IdeaInput } from "./idea-input";
import { PuzzleWorkspace } from "./puzzle-workspace";
import { FreeBuildWorkspace } from "./free-build-workspace";
import { ComponentModal3D } from "./ComponentModal3D";
import { GlassButton, GlassSVGFilter } from "./GlassButton";
import { WeLogo } from "./we-logo";
import { LeaderboardPanel, refreshLeaderboard } from "./leaderboard-panel";

type ChallengeToast =
  | { type: "awarded" }
  | { type: "already" }
  | { type: "signin" }
  | { type: "error"; message: string };

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
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("input");
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [expanded, setExpanded] = useState<SimulationComponent | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [serviceError, setServiceError] = useState(false);
  const [challengeToast, setChallengeToast] = useState<ChallengeToast | null>(null);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiRequest = useRef<AbortController | null>(null);
  /** Set while a weekly-challenge run is active; cleared for normal sims. */
  const challengeCtx = useRef<{
    weekKey: string;
    product: string;
    startedAt?: number;
  } | null>(null);
  const weeklyProduct = getWeeklyProduct();

  useEffect(() => {
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      aiRequest.current?.abort();
    };
  }, []);

  const handleSubmit = useCallback(
    async (idea: string, options?: { challenge?: boolean }) => {
    aiRequest.current?.abort();
    const controller = new AbortController();
    aiRequest.current = controller;
    challengeCtx.current = options?.challenge
      ? { weekKey: getWeekKey(), product: idea }
      : null;
    setExpanded(null);
    setSimulation(null);
    setErrorMessage("");
    setServiceError(false);
    setChallengeToast(null);
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
      // Start the solve clock now (after AI loading), for challenge runs.
      if (challengeCtx.current) challengeCtx.current.startedAt = Date.now();
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

  const handleWeeklyChallenge = useCallback(() => {
    handleSubmit(weeklyProduct, { challenge: true });
  }, [handleSubmit, weeklyProduct]);

  const handlePuzzleComplete = useCallback(async (mistakes: number) => {
    const ctx = challengeCtx.current;
    if (!ctx) return; // not a weekly-challenge run
    if (!user) {
      setChallengeToast({ type: "signin" });
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    const durationMs = Date.now() - (ctx.startedAt ?? Date.now());
    const result = await awardWeeklyPoint(
      supabase,
      user.id,
      ctx.weekKey,
      ctx.product,
      durationMs,
      mistakes,
    );
    if (result.status === "awarded") {
      setChallengeToast({ type: "awarded" });
      refreshLeaderboard();
    } else if (result.status === "already") {
      setChallengeToast({ type: "already" });
    } else {
      setChallengeToast({ type: "error", message: result.message });
    }
  }, [user]);

  const handleFreeBuild = useCallback(() => {
    aiRequest.current?.abort();
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    challengeCtx.current = null;
    setSimulation(null);
    setStep("freeloading");
    loadingTimer.current = setTimeout(() => {
      setStep("freebuild");
    }, 2200);
  }, []);

  const handleReset = useCallback(() => {
    aiRequest.current?.abort();
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    challengeCtx.current = null;
    setStep("input");
    setSimulation(null);
    setExpanded(null);
    setErrorMessage("");
    setServiceError(false);
    setChallengeToast(null);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
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
              className="absolute inset-0 flex"
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="min-w-0 flex-1 overflow-y-auto">
                <IdeaInput
                  onSubmit={handleSubmit}
                  onFreeBuild={handleFreeBuild}
                  onWeeklyChallenge={handleWeeklyChallenge}
                  weeklyProduct={weeklyProduct}
                />
              </div>
              <div className="hidden w-[320px] shrink-0 border-l border-line bg-canvas p-4 lg:flex">
                <LeaderboardPanel />
              </div>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div
              key="ai-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex bg-canvas"
            >
              <div className="hidden w-[340px] shrink-0 border-r border-line bg-panel md:block" />
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
                    className="mt-5 text-[13px] font-medium text-ink-muted"
                  >
                    Analysing your idea...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-1.5 text-[11px] text-ink-faint"
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
              className="idea-radial absolute inset-0 flex items-center justify-center"
            >
              <WeLogo size={54} className="animate-pulse" />
              <div className="pointer-events-none absolute inset-x-0 bottom-10 flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-ink-muted">
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
              <div className="w-full max-w-[480px] rounded-2xl border border-line bg-panel p-7 text-center shadow-xl">
                <IconCircleX className="mx-auto text-[#CC0000]" size={48} />
                <h2 className="mt-4 text-lg font-bold text-ink">
                  {serviceError
                    ? "Gemini is cooling down"
                    : "We can&apos;t build that yet"}
                </h2>
                <p className="mt-3 text-[13px] leading-[1.7] text-ink-muted">
                  {errorMessage}
                </p>
                {!serviceError && (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="text-xs font-medium text-ink-muted">
                      Suggested ideas you CAN build:
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {SUGGESTED_IDEAS.map((idea) => (
                        <button
                          key={idea}
                          type="button"
                          onClick={() => handleSubmit(idea)}
                          className="rounded-full border border-[#CC0000]/40 bg-[#fdecea] px-3 py-1.5 text-xs text-[#990000] hover:border-[#CC0000] hover:bg-[#fbe0dd]"
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
              <PuzzleWorkspace
                data={simulation}
                onExpand={setExpanded}
                onComplete={handlePuzzleComplete}
              />
              {challengeToast && (
                <ChallengeToastBanner
                  toast={challengeToast}
                  onDismiss={() => setChallengeToast(null)}
                />
              )}
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

const TOAST_COPY: Record<
  ChallengeToast["type"],
  { title: string; body: string; tone: "good" | "info" }
> = {
  awarded: {
    title: "Challenge complete — +1 point! 🏆",
    body: "Your point has been added to the leaderboard.",
    tone: "good",
  },
  already: {
    title: "Nicely done!",
    body: "You already earned this week's point — come back next week for a new product.",
    tone: "info",
  },
  signin: {
    title: "Sign in to score",
    body: "You solved it! Sign in from the start screen to earn weekly-challenge points.",
    tone: "info",
  },
  error: {
    title: "Couldn't save your point",
    body: "Your solution was correct, but saving the score failed. Please try again.",
    tone: "info",
  },
};

function ChallengeToastBanner({
  toast,
  onDismiss,
}: {
  toast: ChallengeToast;
  onDismiss: () => void;
}) {
  const copy = TOAST_COPY[toast.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      className="absolute bottom-6 left-1/2 z-20 flex w-[min(92vw,420px)] items-start gap-3 rounded-xl border border-we-red/40 bg-panel p-4 shadow-xl"
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          copy.tone === "good"
            ? "bg-we-red/15 text-we-red"
            : "bg-ink/5 text-ink-muted"
        }`}
      >
        <Trophy size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{copy.title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">
          {toast.type === "error" ? toast.message : copy.body}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md px-2 py-1 text-xs text-ink-faint hover:text-ink"
      >
        Dismiss
      </button>
    </motion.div>
  );
}
