"use client";

import { ShowcaseStep } from "../types/showcase.types";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ShowcaseStepperProps {
  steps: ShowcaseStep[];
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  progressPercent: number;
}

export function ShowcaseStepper({
  steps,
  activeStepIndex,
  onSelectStep,
  isPlaying,
  onTogglePlay,
  onReset,
  progressPercent,
}: ShowcaseStepperProps) {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-2">
      {/* Pills Container (Horizontal scroll on mobile, flex on desktop) */}
      <div className="w-full md:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 scroll-smooth">
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all shrink-0 cursor-pointer flex items-center gap-2 overflow-hidden border ${
                isActive
                  ? /* Light Mode Active */
                    "bg-warm-espresso text-warm-cream border-warm-espresso shadow-sm " +
                    /* Dark Mode Active */
                    "dark:bg-linear-to-r dark:from-brand-indigo/30 dark:via-brand-cyan/20 dark:to-brand-indigo/30 dark:text-white dark:border-brand-cyan/50 dark:shadow-[0_0_18px_rgba(33,198,232,0.25)]"
                  : /* Inactive */
                    "bg-warm-cream/50 hover:bg-warm-cream text-warm-slate hover:text-warm-espresso border-warm-ice/60 " +
                    "dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:hover:text-zinc-100 dark:border-white/10"
              }`}
            >
              {/* Active Timer Progress Fill Bar */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 top-0 opacity-20 pointer-events-none transition-all duration-100
                    bg-warm-cream dark:bg-brand-cyan"
                  style={{ width: `${progressPercent}%` }}
                />
              )}

              <span className={`text-[10px] opacity-70 ${isActive ? "font-bold" : ""}`}>
                {step.stepNumber}
              </span>
              <span>{step.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* Control Buttons (Play/Pause, Reset) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer
            bg-warm-cream/70 border-warm-ice text-warm-espresso hover:bg-warm-cream
            dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 text-warm-espresso dark:text-brand-cyan" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-warm-espresso dark:text-brand-cyan fill-current" />
              <span>Auto-Play</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          aria-label="Restart walkthrough from step 1"
          className="p-1.5 rounded-full border transition-colors cursor-pointer
            bg-warm-cream/70 border-warm-ice text-warm-espresso hover:bg-warm-cream
            dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          title="Restart from step 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
