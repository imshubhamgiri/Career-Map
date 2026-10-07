"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Github, CheckCircle2, ShieldCheck, GitBranch, ArrowRight, ToggleRight } from "lucide-react";

export function StageConfigGitHub() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-4">
      {/* Settings Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-warm-ice/40 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-warm-cream dark:bg-white/10 text-warm-espresso dark:text-brand-cyan">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-warm-espresso dark:text-zinc-100 flex items-center gap-2">
              <span>GitHub Auto-Sync</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/20">
                100% Optional
              </span>
            </div>
          </div>
        </div>

        {/* Toggle switch simulation */}
        <button
          onClick={() => setEnabled(!enabled)}
          className="flex items-center gap-1.5 text-xs font-semibold text-warm-espresso dark:text-zinc-200 cursor-pointer"
        >
          <span>Auto-Push:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              enabled
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {enabled ? "ENABLED" : "DISABLED"}
          </span>
        </button>
      </div>

      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 rounded-2xl border space-y-3.5 shadow-xs
          bg-white border-warm-ice dark:bg-black/90 dark:border-white/15"
      >
        <p className="text-xs text-warm-slate dark:text-zinc-400">
          If you want your solutions backed up to GitHub automatically, configure your repo below. If not, you can leave this blank!
        </p>

        {/* Form fields mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* GitHub Repo */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-warm-espresso dark:text-zinc-300">
              Repository Name
            </label>
            <div className="p-2.5 rounded-xl border font-mono text-xs flex items-center justify-between
              bg-warm-cream/60 border-warm-ice text-warm-espresso
              dark:bg-[#0c101b] dark:border-white/10 dark:text-zinc-200"
            >
              <span>username/dsa-solutions</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>

          {/* Branch */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-warm-espresso dark:text-zinc-300">
              Default Branch
            </label>
            <div className="p-2.5 rounded-xl border font-mono text-xs flex items-center justify-between
              bg-warm-cream/60 border-warm-ice text-warm-espresso
              dark:bg-[#0c101b] dark:border-white/10 dark:text-zinc-200"
            >
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-warm-slate dark:text-zinc-400" />
                <span>main</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Verified</span>
            </div>
          </div>
        </div>

        {/* Live confirmation notice */}
        <div className="p-3 rounded-xl border text-xs flex items-center justify-between
          bg-warm-cream/80 border-warm-ice text-warm-espresso
          dark:bg-[#090d18] dark:border-white/10 dark:text-zinc-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected: Solutions will push to <strong>dsa-solutions/main</strong></span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            Ready
          </span>
        </div>
      </motion.div>
    </div>
  );
}
