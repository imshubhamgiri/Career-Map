"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Link2, FileUp, Sparkles, Check, ArrowRight } from "lucide-react";

export function StageIngest() {
  const [tab, setTab] = useState<"url" | "pdf">("url");

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-4">
      {/* Import Source Selector (URL vs PDF) */}
      <div className="flex items-center justify-between pb-2 border-b border-[#AEC4D4]/40 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("url")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === "url"
                ? "bg-[#4D2A00] text-[#FCF0DA] dark:bg-white dark:text-black shadow-xs"
                : "bg-white/60 text-[#757D6F] hover:text-[#4D2A00] dark:bg-white/5 dark:text-zinc-400"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Roadmap / Sheet URL</span>
          </button>
          <button
            onClick={() => setTab("pdf")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === "pdf"
                ? "bg-[#4D2A00] text-[#FCF0DA] dark:bg-white dark:text-black shadow-xs"
                : "bg-white/60 text-[#757D6F] hover:text-[#4D2A00] dark:bg-white/5 dark:text-zinc-400"
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <Check className="w-3 h-3" />
          Ready to parse
        </span>
      </div>

      {/* Input box + Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xs
          bg-white border-[#AEC4D4] dark:bg-black/80 dark:border-white/15"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="font-mono text-xs sm:text-sm truncate text-[#4D2A00] dark:text-zinc-100 font-medium">
            {tab === "url"
              ? "https://takeuforward.org/strivers-a2z-dsa-course/"
              : "striver-dsa-sheet-2026.pdf"}
          </span>
        </div>

        {/* Submit / Parse Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-colors cursor-pointer
            bg-[#4D2A00] text-[#FCF0DA] hover:bg-[#381f00]
            dark:bg-brand-indigo dark:text-white dark:hover:bg-[#6c72e8]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Parse Roadmap</span>
        </motion.button>
      </motion.div>

      {/* Parsed Result Preview: List of Questions */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-[#4D2A00] dark:text-zinc-200">
            Parsed Questions (45 items found)
          </span>
          <span className="text-[11px] text-[#757D6F] dark:text-zinc-400">
            Grouped by topic
          </span>
        </div>

        {/* Question Item 1 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="p-3 rounded-xl border flex items-center justify-between
            bg-[#FCF0DA]/80 border-[#AEC4D4] dark:bg-[#0c101b] dark:border-white/10"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-5 h-5 rounded-full bg-white dark:bg-white/10 text-[10px] font-mono flex items-center justify-center font-bold text-[#4D2A00] dark:text-zinc-300">
              1
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#4D2A00] dark:text-zinc-100 truncate">
                Two Sum
              </div>
              <div className="text-[11px] text-[#757D6F] dark:text-zinc-400">
                Topic: Arrays &amp; Hashing
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Easy
          </span>
        </motion.div>

        {/* Question Item 2 (The featured problem) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="p-3 rounded-xl border flex items-center justify-between
            bg-white border-[#4D2A00]/40 shadow-xs
            dark:bg-gradient-to-r dark:from-[#0c101b] dark:to-[#121828] dark:border-brand-cyan/40"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-5 h-5 rounded-full bg-[#FCF0DA] dark:bg-brand-cyan/20 text-[10px] font-mono flex items-center justify-center font-bold text-[#4D2A00] dark:text-brand-cyan">
              2
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#4D2A00] dark:text-white truncate">
                Trapping Rain Water
              </div>
              <div className="text-[11px] text-[#757D6F] dark:text-zinc-400">
                Topic: Two Pointers / Arrays
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            Hard
          </span>
        </motion.div>

        {/* Question Item 3 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="p-3 rounded-xl border flex items-center justify-between
            bg-[#FCF0DA]/60 border-[#AEC4D4]/70 dark:bg-[#0c101b] dark:border-white/10"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-5 h-5 rounded-full bg-white dark:bg-white/10 text-[10px] font-mono flex items-center justify-center font-bold text-[#4D2A00] dark:text-zinc-300">
              3
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#4D2A00] dark:text-zinc-100 truncate">
                Reverse Linked List
              </div>
              <div className="text-[11px] text-[#757D6F] dark:text-zinc-400">
                Topic: Linked Lists
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Easy
          </span>
        </motion.div>
      </div>
    </div>
  );
}
