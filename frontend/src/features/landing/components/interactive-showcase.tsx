"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SHOWCASE_STEPS } from "../data/showcase-steps";
import { ShowcaseStepper } from "./showcase-stepper";
import { StageFrame } from "./stage-frame";
import { StageIngest } from "./stages/stage-01-ingest";
import { StageConfig } from "./stages/stage-02-config";
import { StageConfigGitHub } from "./stages/stage-03-extension";
import { StageSubmission } from "./stages/stage-04-submission";
import { StageNotes } from "./stages/stage-05-notes";
import { StageGitPush } from "./stages/stage-06-git-push";
import { StageMultiRoadmap } from "./stages/stage-07-trajectory";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export function InteractiveShowcase() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  // const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);

  const isHoveredRef = useRef(false);
  const activeStepIndexRef = useRef(activeStepIndex);
  const elapsedTimeMsRef = useRef(elapsedTimeMs);

  const currentStep = SHOWCASE_STEPS[activeStepIndex];


  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying) return;

    // activeStepIndexRef.current = activeStepIndex;
    // elapsedTimeMsRef.current = elapsedTimeMs;
    const intervalMs = 50;  

    const timer = setInterval(() => {
      // Pause progress if user is actively hovering over the stage
      if (isHoveredRef.current) return;

      const currentIndex = activeStepIndexRef.current;
      const currentDuration = SHOWCASE_STEPS[currentIndex].durationMs;
      const nextElapsedTime = elapsedTimeMsRef.current + intervalMs;
      
      if (nextElapsedTime >= currentDuration) {
        const nextIndex = (currentIndex + 1) % SHOWCASE_STEPS.length;
      
        activeStepIndexRef.current = nextIndex;
        elapsedTimeMsRef.current = 0;
      
        setActiveStepIndex(nextIndex);
        setElapsedTimeMs(0);
        return;
      }
      elapsedTimeMsRef.current = nextElapsedTime;
      setElapsedTimeMs(nextElapsedTime);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const progressPercent = (elapsedTimeMs / currentStep.durationMs) * 100;

  const handleSelectStep = useCallback((index: number) => {
    setActiveStepIndex(index);
    setElapsedTimeMs(0);
    activeStepIndexRef.current = index;
    elapsedTimeMsRef.current = 0;
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setActiveStepIndex(0);
    setElapsedTimeMs(0);
    activeStepIndexRef.current = 0;
    elapsedTimeMsRef.current = 0;
    setIsPlaying(true);
  }, []);

  // Determine window url and type for the active step
  const getWindowMetadata = () => {
    switch (currentStep.id) {
      case "ingest":
        return {
          windowType: "careeros" as const,
          url: "app.careeros.dev/dashboard/import",
        };
      case "config":
        return {
          windowType: "careeros" as const,
          url: "app.careeros.dev/dashboard/settings#api-keys",
        };
      case "github":
        return {
          windowType: "careeros" as const,
          url: "app.careeros.dev/dashboard/settings#github",
        };
      case "submission":
        return {
          windowType: "leetcode" as const,
          url: "leetcode.com/problems/trapping-rain-water",
        };
      case "notes":
        return {
          windowType: "careeros" as const,
          url: "app.careeros.dev/dashboard/notes/42-trapping-rain-water",
        };
      case "git-push":
        return {
          windowType: "careeros" as const,
          url: "app.careeros.dev/dashboard/roadmaps/striver-sde-sheet",
        };
      case "multi-roadmap":
        return {
          windowType: "careeros" as const,
          url: "app.careeros.dev/dashboard/roadmaps",
        };
      default:
        return {
          windowType: "careeros" as const,
          url: "app.careeros.dev/dashboard",
        };
    }
  };

  const { windowType, url } = getWindowMetadata();

  // Render the current stage component
  const renderStageComponent = () => {
    switch (currentStep.id) {
      case "ingest":
        return <StageIngest />;
      case "config":
        return <StageConfig />;
      case "github":
        return <StageConfigGitHub />;
      case "submission":
        return <StageSubmission />;
      case "notes":
        return <StageNotes />;
      case "git-push":
        return <StageGitPush />;
      case "multi-roadmap":
        return <StageMultiRoadmap />;
      default:
        return <StageIngest />;
    }
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 py-16 lg:py-24 relative overflow-hidden">
      {/* Decorative background radiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none rounded-full blur-[140px] -z-10
        /* Light mode warm glow */
        bg-gradient-to-tr from-[#FCF0DA] via-[#AEC4D4]/40 to-[#FCF0DA]
        /* Dark mode shiny black gradient */
        dark:bg-gradient-to-tr dark:from-brand-indigo/15 dark:via-brand-cyan/10 dark:to-transparent"
      />

      {/* Section Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold
          bg-[#FCF0DA] text-[#4D2A00] border border-[#AEC4D4] shadow-xs
          dark:bg-white/5 dark:text-brand-cyan dark:border-white/10 dark:shadow-[0_0_15px_rgba(33,198,232,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#4D2A00] dark:text-brand-cyan" />
          <span>HOW CAREER OS ACTUALLY WORKS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]
          text-[#4D2A00] dark:text-[#edf0f9]"
        >
          See the whole journey.
          <br />
          <span className="bg-gradient-to-r from-[#4D2A00] via-[#757D6F] to-[#4D2A00] dark:from-brand-indigo dark:via-brand-violet dark:to-brand-cyan bg-clip-text text-transparent">
            From roadmap to LeetCode solve and notes.
          </span>
        </h2>

        <p className="text-sm sm:text-base leading-relaxed text-[#757D6F] dark:text-[#8c96aa] max-w-2xl">
          No complicated setup or robotic buzzwords. Here is exactly how you import roadmaps, solve on LeetCode, and let Career OS track progress and generate your notes.
        </p>
      </div>

      {/* 7-Step Interactive Stepper Bar */}
      <div className="max-w-5xl mx-auto mb-8">
        <ShowcaseStepper
          steps={SHOWCASE_STEPS}
          activeStepIndex={activeStepIndex}
          onSelectStep={handleSelectStep}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          progressPercent={progressPercent}
        />
      </div>

      {/* Main Showcase Grid: Left Narrative + Right Stage Frame */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Narrative Card */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-5">
          <div className="rounded-3xl p-6 sm:p-7 border transition-all duration-300
            /* Light Mode Warm Editorial */
            bg-white/90 border-[#AEC4D4] text-[#4D2A00] shadow-sm
            /* Dark Mode Shiny Pitch Black */
            dark:bg-gradient-to-b dark:from-[#090c14] dark:to-black dark:border-white/10 dark:text-[#edf0f9] dark:shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
          >
            {/* Step pill */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md
                bg-[#FCF0DA] text-[#4D2A00] border border-[#AEC4D4]
                dark:bg-brand-indigo/20 dark:text-brand-cyan dark:border-brand-indigo/30"
              >
                STEP {currentStep.stepNumber}
              </span>
              <span className="text-xs font-mono text-[#757D6F] dark:text-zinc-400">
                / 07
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#4D2A00] dark:text-white leading-snug">
              {currentStep.title}
            </h3>

            {/* Description */}
            <p className="text-sm leading-relaxed text-[#757D6F] dark:text-[#8c96aa] mt-3">
              {currentStep.description}
            </p>

            {/* Feature Bullets (Takeaways) */}
            {currentStep.takeaways && (
              <div className="pt-4 border-t border-[#AEC4D4]/30 dark:border-white/10 mt-5 space-y-2.5">
                {currentStep.takeaways.map((takeaway, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs font-medium text-[#4D2A00] dark:text-zinc-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Step Switch Buttons */}
          <div className="flex items-center justify-between text-xs font-mono px-2">
            <button
              onClick={() =>
                handleSelectStep(
                  (activeStepIndex - 1 + SHOWCASE_STEPS.length) % SHOWCASE_STEPS.length
                )
              }
              className="text-[#757D6F] hover:text-[#4D2A00] dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              ← Previous Step
            </button>
            <button
              onClick={() =>
                handleSelectStep((activeStepIndex + 1) % SHOWCASE_STEPS.length)
              }
              className="text-[#4D2A00] font-bold dark:text-brand-cyan hover:underline transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column: The Simulated Stage Frame */}
        <div
          className="lg:col-span-7 w-full"
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
        >
          <StageFrame
            activeStepNumber={currentStep.stepNumber}
            badge={currentStep.badge}
            highlightTag={currentStep.highlightTag}
            windowType={windowType}
            windowUrl={url}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex items-center justify-center"
              >
                {renderStageComponent()}
              </motion.div>
            </AnimatePresence>
          </StageFrame>
        </div>
      </div>
    </section>
  );
}
