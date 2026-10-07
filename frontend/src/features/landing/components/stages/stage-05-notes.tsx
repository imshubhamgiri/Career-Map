"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { FileText, Edit3, Save, Lightbulb, AlertTriangle, Camera, Check } from "lucide-react";

export function StageNotes() {
  const [isEditing, setIsEditing] = useState(false);
  const [userNote, setUserNote] = useState(
    "My Note: If l_max <= r_max, calculate water at left and increment. Don't overcomplicate with a stack!"
  );

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-3.5">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-warm-ice/40 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-warm-cream dark:bg-white/10 text-warm-espresso dark:text-brand-cyan">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-warm-espresso dark:text-zinc-100 flex items-center gap-2">
              <span>Revision Notes: 42. Trapping Rain Water</span>
            </div>
          </div>
        </div>

        {/* Edit / Save Notes button */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer
            bg-warm-espresso text-warm-cream hover:bg-[#381f00]
            dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          {isEditing ? (
            <>
              <Save className="w-3 h-3" />
              <span>Save</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3 h-3" />
              <span>Edit Notes</span>
            </>
          )}
        </button>
      </div>

      {/* Section 1: Generated Approach Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3.5 rounded-2xl border space-y-2.5 shadow-xs
          bg-white border-warm-ice dark:bg-black/90 dark:border-white/15"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-warm-espresso dark:text-zinc-100 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Why this approach? (Never hit your head revising)</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
            Time: O(N) · Space: O(1)
          </span>
        </div>

        <p className="text-xs leading-relaxed text-warm-slate dark:text-zinc-300">
          Water above any bar is trapped by the <strong>shorter</strong> of the two boundary heights. Instead of storing prefix and suffix maximum arrays, we use two pointers converging from left and right.
        </p>

        <div className="p-2 rounded-xl bg-warm-cream/60 dark:bg-white/5 border border-warm-ice/50 dark:border-white/5 text-[11px] text-warm-espresso dark:text-zinc-300 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <span>
            <strong>Key Gotcha:</strong> Always advance the pointer pointing to the smaller boundary so the bounded water calculation stays accurate.
          </span>
        </div>
      </motion.div>

      {/* Section 2: User Personal Notes */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-3.5 rounded-2xl border space-y-2
          bg-warm-cream/70 border-warm-ice text-warm-espresso
          dark:bg-[#0c101d] dark:border-white/10 dark:text-zinc-200"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-warm-espresso dark:text-white">
            Your Personal Notes:
          </span>
          <span className="text-[10px] text-warm-slate dark:text-zinc-400">
            {isEditing ? "Editing mode" : "Saved ✓"}
          </span>
        </div>

        {isEditing ? (
          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            rows={2}
            className="w-full p-2 text-xs rounded-lg border font-sans bg-white border-warm-ice dark:bg-black dark:border-white/20 text-warm-espresso dark:text-white focus:outline-hidden"
          />
        ) : (
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/60 border border-warm-ice/60 dark:border-white/5 text-xs text-warm-espresso dark:text-zinc-200 italic font-mono">
            &quot;{userNote}&quot;
          </div>
        )}
      </motion.div>

      {/* Extra upcoming feature badge */}
      <div className="flex items-center justify-between text-[11px] px-1 text-warm-slate dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-warm-espresso dark:text-brand-cyan" />
          <span>Snap photo of notebook notes</span>
        </span>
        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
