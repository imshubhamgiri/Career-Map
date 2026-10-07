"use client";

import React from "react";
import { motion } from "motion/react";
import { Github, ExternalLink, FileCode, CheckCircle2, BookOpen, GitCommit } from "lucide-react";

export function StageGitPush() {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#AEC4D4]/40 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FCF0DA] dark:bg-white/10 text-[#4D2A00] dark:text-brand-cyan">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#4D2A00] dark:text-zinc-100 flex items-center gap-2">
              <span>Code Pushed &amp; Linked to Question</span>
            </div>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Git Synced
        </span>
      </div>

      {/* Career OS Problem Row with Direct GitHub Link */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 rounded-2xl border space-y-3.5 shadow-xs
          bg-white border-[#AEC4D4] dark:bg-black/90 dark:border-white/15"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              ✓
            </span>
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#4D2A00] dark:text-white flex items-center gap-2">
                <span>42. Trapping Rain Water</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold">
                  Hard
                </span>
              </div>
              <span className="text-[11px] text-[#757D6F] dark:text-zinc-400">
                Topic: Two Pointers · Solved just now
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FCF0DA] text-[#4D2A00] border border-[#AEC4D4] dark:bg-white/10 dark:text-zinc-300">
            Solved on LeetCode
          </span>
        </div>

        {/* Direct Action Links on the Question Card */}
        <div className="space-y-2 pt-1 text-xs">
          {/* GitHub direct code link */}
          <div className="p-3 rounded-xl border flex items-center justify-between
            bg-[#FCF0DA]/80 border-[#AEC4D4] text-[#4D2A00]
            dark:bg-[#0c101d] dark:border-white/10 dark:text-zinc-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Github className="w-4 h-4 text-[#4D2A00] dark:text-white shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-xs block text-[#4D2A00] dark:text-white">
                  GitHub Solution File:
                </span>
                <span className="font-mono text-[11px] text-[#757D6F] dark:text-zinc-400 truncate block">
                  github.com/user/dsa-solutions/.../0042-trapping-rain-water.py
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 bg-[#4D2A00] text-[#FCF0DA] dark:bg-brand-indigo dark:text-white shrink-0">
              <span>View Code</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>

          {/* Notes link */}
          <div className="p-2.5 rounded-xl border flex items-center justify-between
            bg-white/60 border-[#AEC4D4]/60 text-[#757D6F]
            dark:bg-black/60 dark:border-white/5 dark:text-zinc-300"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4D2A00] dark:text-brand-cyan" />
              <span className="text-xs font-semibold text-[#4D2A00] dark:text-zinc-200">
                Approach Notes &amp; Revision Guide
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#757D6F] dark:text-zinc-400">
              Saved in Career OS Vault ✓
            </span>
          </div>
        </div>

        {/* Helpful text */}
        <p className="text-[11px] text-[#757D6F] dark:text-zinc-400 text-center pt-1">
          No more searching through GitHub commits or old files. Everything is linked right on the question.
        </p>
      </motion.div>
    </div>
  );
}
