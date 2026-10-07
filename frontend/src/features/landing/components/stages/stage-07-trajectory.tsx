"use client";

import React from "react";
import { motion } from "motion/react";
import { Layers, CheckCircle2, Sparkles, BookOpen, ArrowRight } from "lucide-react";

export function StageMultiRoadmap() {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#AEC4D4]/40 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FCF0DA] dark:bg-white/10 text-[#4D2A00] dark:text-brand-cyan">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#4D2A00] dark:text-zinc-100 flex items-center gap-2">
              <span>Multiple Roadmaps · Unified Notes</span>
            </div>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 border border-emerald-500/20">
          <Sparkles className="w-3 h-3" />
          Sync Everywhere
        </span>
      </div>

      {/* Synchronized Roadmaps Display */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Roadmap 1 */}
        <div className="p-3.5 rounded-2xl border space-y-2
          bg-white border-[#AEC4D4] shadow-xs
          dark:bg-black/90 dark:border-white/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4D2A00] dark:text-white">
              Roadmap A: Striver&apos;s SDE Sheet
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              53% Done
            </span>
          </div>

          <div className="p-2.5 rounded-xl border flex items-center justify-between text-xs
            bg-[#FCF0DA]/60 border-[#AEC4D4]/60 text-[#4D2A00]
            dark:bg-[#0c101b] dark:border-white/10 dark:text-zinc-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">42. Trapping Rain Water</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Solved ✓
            </span>
          </div>
        </div>

        {/* Roadmap 2 */}
        <div className="p-3.5 rounded-2xl border space-y-2
          bg-white border-[#AEC4D4] shadow-xs
          dark:bg-black/90 dark:border-white/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4D2A00] dark:text-white">
              Roadmap B: NeetCode 150
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              18% Done
            </span>
          </div>

          <div className="p-2.5 rounded-xl border flex items-center justify-between text-xs
            bg-[#FCF0DA]/60 border-[#AEC4D4]/60 text-[#4D2A00]
            dark:bg-[#0c101b] dark:border-white/10 dark:text-zinc-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">42. Trapping Rain Water</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Solved ✓ (Synced)
            </span>
          </div>
        </div>

        {/* Synergy Explanation Toast */}
        <div className="p-3 rounded-xl border flex items-center justify-between text-xs
          bg-[#4D2A00] text-[#FCF0DA] border-[#4D2A00]
          dark:bg-gradient-to-r dark:from-brand-indigo/30 dark:via-brand-cyan/20 dark:to-transparent dark:border-brand-cyan/40 dark:text-white"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#FCF0DA] dark:text-brand-cyan shrink-0" />
            <div className="text-[11px]">
              <span className="font-bold block">One Problem, Shared Everywhere</span>
              <span className="opacity-90">Your notes &amp; GitHub links are shared across both roadmaps.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
