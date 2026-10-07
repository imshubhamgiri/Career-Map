"use client";

import React from "react";
import { Globe, Lock, Sparkles, CheckCircle2 } from "lucide-react";

interface StageFrameProps {
  children: React.ReactNode;
  activeStepNumber: string;
  badge: string;
  highlightTag?: string;
  windowType?: "careeros" | "leetcode";
  windowUrl?: string;
}

export function StageFrame({
  children,
  activeStepNumber,
  badge,
  highlightTag,
  windowType = "careeros",
  windowUrl = "app.careeros.dev/dashboard",
}: StageFrameProps) {
  const isLeetCode = windowType === "leetcode";

  return (
    <div className="w-full relative group">
      {/* Ambient background glows */}
      {/* Light Mode: Warm cream (#FCF0DA) and soft ice blue (#AEC4D4) */}
      <div className="absolute -inset-1.5 rounded-[30px] bg-linear-to-r from-warm-cream via-warm-ice/50 to-warm-cream blur-xl opacity-90 dark:hidden transition-all duration-700 pointer-events-none" />

      {/* Dark Mode: Shiny pitch black and brand glow */}
      <div className="absolute -inset-1.5 rounded-[30px] bg-linear-to-r from-brand-indigo/30 via-brand-cyan/25 to-brand-violet/30 blur-2xl opacity-0 dark:opacity-90 transition-all duration-700 pointer-events-none" />

      {/* Main Window Container */}
      <div
        className={`relative rounded-[26px] overflow-hidden transition-all duration-300 border ${
          isLeetCode
            ? /* LeetCode authentic dark chrome */
              "bg-[#1a1a1a] text-zinc-100 border-zinc-700 shadow-2xl"
            : /* Career OS window styling */
              "bg-warm-cream/30 text-warm-espresso border-warm-ice shadow-[0_15px_45px_rgba(77,42,0,0.06)] backdrop-blur-md " +
              "dark:bg-linear-to-b dark:from-[#0a0d16] dark:via-[#05070c] dark:to-black dark:text-[#edf0f9] dark:border-white/15 dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
        }`}
      >
        {/* Shiny top glass highlight line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-warm-espresso/25 to-transparent dark:via-white/35 pointer-events-none" />

        {/* Top Browser / Window Bar */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 border-b text-xs ${
            isLeetCode
              ? "bg-[#262626] border-zinc-800 text-zinc-300"
              : "bg-white/90 border-warm-ice/60 text-warm-espresso dark:bg-black/60 dark:border-white/10 dark:text-zinc-300"
          }`}
        >
          {/* Left: Window Dots + Simulated Browser Address */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-xs" />
            </div>

            {/* Simulated URL pill */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border max-w-[280px] truncate ${
                isLeetCode
                  ? "bg-[#1f1f1f] border-zinc-700/80 text-zinc-300"
                  : "bg-warm-cream/70 border-warm-ice text-warm-espresso dark:bg-white/5 dark:border-white/10 dark:text-zinc-300"
              }`}
            >
              <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{windowUrl}</span>
            </div>
          </div>

          {/* Right: Step Indicator Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {highlightTag && (
              <span
                className={`hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isLeetCode
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-warm-cream text-warm-espresso border-warm-ice dark:bg-brand-cyan/15 dark:text-brand-cyan dark:border-brand-cyan/30"
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {highlightTag}
              </span>
            )}

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isLeetCode
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-warm-espresso text-warm-cream border-warm-espresso dark:bg-white/10 dark:text-white dark:border-white/20"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Step {activeStepNumber}</span>
              <span className="opacity-40">·</span>
              <span>{badge}</span>
            </div>
          </div>
        </div>

        {/* Stage Content Area */}
        <div className="p-4 sm:p-6 min-h-[410px] sm:min-h-[440px] flex flex-col justify-center relative overflow-hidden">
          {children}
        </div>

        {/* Bottom Helper Bar (Simple human text) */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-t flex items-center justify-between text-xs ${
            isLeetCode
              ? "bg-[#202020] border-zinc-800 text-zinc-400"
              : "bg-white/80 border-warm-ice/40 text-warm-slate dark:bg-black/70 dark:border-white/5 dark:text-zinc-400"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-warm-espresso dark:text-zinc-200">
              {isLeetCode
                ? "LeetCode Active · Career OS Extension hooked"
                : "Career OS Workspace · Live sync enabled"}
            </span>
          </div>

          <span className="text-[11px] font-mono text-warm-slate dark:text-zinc-400">
            Automatic tracking
          </span>
        </div>
      </div>
    </div>
  );
}
