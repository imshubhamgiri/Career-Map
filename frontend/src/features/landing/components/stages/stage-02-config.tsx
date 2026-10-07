"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { KeyRound, Copy, Check, Chrome, ArrowRight, ShieldCheck } from "lucide-react";

export function StageConfig() {
  const [copied, setCopied] = useState(true);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-4">
      {/* Step 1: Generate API Key from Settings */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl border space-y-2.5 shadow-xs
          bg-white border-warm-ice dark:bg-black/80 dark:border-white/15"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-warm-cream text-warm-espresso dark:bg-brand-indigo/20 dark:text-brand-cyan text-[11px] font-bold flex items-center justify-center font-mono">
              A
            </span>
            <span className="text-xs sm:text-sm font-bold text-warm-espresso dark:text-zinc-100">
              Inside Career OS Settings: Generate API Key
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Generated in 1 Click
          </span>
        </div>

        {/* API Key Box */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border font-mono text-xs
          bg-warm-cream/60 border-warm-ice text-warm-espresso
          dark:bg-[#0c101b] dark:border-white/10 dark:text-zinc-200"
        >
          <span className="tracking-wider select-all truncate">
            cos_live_9f8a2e7c41b89d002f5a
          </span>
          <button
            onClick={() => setCopied(!copied)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0
              bg-warm-espresso text-warm-cream hover:bg-[#381f00]
              dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Visual Downward Flow Arrow */}
      <div className="flex justify-center -my-2 text-warm-slate dark:text-zinc-400">
        <ArrowRight className="w-4 h-4 rotate-90" />
      </div>

      {/* Step 2: Chrome Extension Popup Mock */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-4 rounded-2xl border space-y-3 relative overflow-hidden
          bg-warm-cream/80 border-warm-ice text-warm-espresso shadow-xs
          dark:bg-linear-to-b dark:from-[#0c101d] dark:to-black dark:border-white/15 dark:text-zinc-100"
      >
        {/* Extension Popup Title Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-warm-ice/40 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-warm-espresso text-warm-cream dark:bg-white/10 dark:text-white text-[11px] font-bold flex items-center justify-center font-mono">
              B
            </span>
            <div className="flex items-center gap-1.5">
              <Chrome className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-warm-espresso dark:text-zinc-100">
                Career OS Chrome Extension
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        </div>

        {/* Paste Key into Extension */}
        <div className="space-y-1.5 text-xs">
          <label className="text-[11px] font-semibold text-warm-slate dark:text-zinc-400">
            Paste API Key:
          </label>
          <div className="p-2 rounded-lg border font-mono text-xs flex items-center justify-between
            bg-white border-warm-ice text-warm-espresso
            dark:bg-black/90 dark:border-white/10 dark:text-zinc-200"
          >
            <span className="truncate">cos_live_9f8a2e7c41b89d...</span>
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </div>
        </div>

        <div className="text-[11px] text-warm-slate dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
          <span>✓</span>
          <span>Done! Now open LeetCode and solve any problem—the extension tracks everything.</span>
        </div>
      </motion.div>
    </div>
  );
}
