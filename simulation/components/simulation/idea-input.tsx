"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Blocks, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_IDEAS } from "@/data/components";

export function IdeaInput({
  onSubmit,
  onFreeBuild,
}: {
  onSubmit: (idea: string) => void;
  onFreeBuild: () => void;
}) {
  const [idea, setIdea] = useState("");

  const canSubmit = idea.trim().length >= 2;

  function submit() {
    if (canSubmit) onSubmit(idea.trim());
  }

  return (
    <div className="idea-entry idea-radial flex flex-1 items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-ink-muted">
            <Sparkles size={13} className="text-we-red" />
            AI-assisted component discovery
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            What are you building?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
            Describe your project and we&apos;ll populate a workspace with the
            Würth Elektronik components that bring it to life.
          </p>
        </div>

        <div className="rounded-[8px] border border-line bg-panel p-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
          <Textarea
            autoFocus
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
            placeholder="e.g. A foldable electric scooter with regenerative braking and a phone app…"
            rows={4}
            className="border-0 bg-transparent text-base focus:ring-0"
          />

          <div className="flex flex-col gap-3 px-1 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_IDEAS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setIdea(example)}
                  className="rounded-full border border-line bg-card px-3 py-1 text-xs text-ink-muted transition-colors hover:border-we-red hover:text-ink"
                >
                  {example}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="self-start rounded-lg border border-[#e32929] bg-[#CC0000] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b30000] disabled:pointer-events-none disabled:opacity-40 sm:self-auto"
            >
              <span className="flex items-center gap-2">
                Simulate
                <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] text-ink-faint">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={onFreeBuild}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-card px-5 py-2.5 text-sm text-ink transition-colors hover:border-we-red"
        >
          <Blocks size={16} className="text-we-red" />
          Free build
          <span className="text-[11px] text-ink-muted">
            — open the full catalogue and connect any parts
          </span>
        </button>

        <p className="mt-3 text-center text-[11px] text-ink-faint">
          Tip: press ⌘/Ctrl + Enter to simulate
        </p>
      </motion.div>
    </div>
  );
}
