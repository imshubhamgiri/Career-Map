"use client";

import Link from "next/link";
import { Compass, Plus, ArrowRight, Sparkles } from "lucide-react";

export function EmptyRoadmaps() {
  return (
    <div className="bg-white dark:bg-[#10131c] rounded-3xl p-8 sm:p-14 border border-dashed border-zinc-300 dark:border-white/10 text-center max-w-2xl mx-auto my-6 shadow-xs animate-in fade-in duration-300">
      {/* Icon with subtle halo */}
      <div className="w-16 h-16 rounded-2xl bg-[#5963e8]/10 dark:bg-[#7c82f4]/15 border border-[#5963e8]/20 dark:border-[#7c82f4]/25 flex items-center justify-center mx-auto text-[#5963e8] dark:text-[#21c6e8]">
        <Compass className="w-8 h-8" />
      </div>

      {/* Copy */}
      <h3 className="text-2xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9] mt-6">
        No roadmaps imported yet
      </h3>

      <p className="text-sm text-[#666d7c] dark:text-[#8c96aa] mt-2.5 max-w-md mx-auto leading-relaxed">
        Import your first career roadmap or DSA curriculum to start tracking problem progress,
        managing topics, and syncing your solutions to GitHub.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
        <Link
          href="/dashboard/import"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#5963e8] hover:bg-[#4b55dc] dark:bg-[#7c82f4] dark:hover:bg-[#6c72e8] text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Import a roadmap</span>
        </Link>

        <Link
          href="/dashboard/roadmap/sample-neetcode-150"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-white/10 bg-[#f0f3f6] dark:bg-[#131822] hover:bg-zinc-200/60 dark:hover:bg-white/10 text-[#0e121c] dark:text-[#edf0f9] transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#5963e8] dark:text-[#21c6e8]" />
          <span>Explore NeetCode 150</span>
        </Link>
      </div>

      {/* Helper Footer */}
      <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-white/5 flex items-center justify-center gap-2 text-xs text-[#666d7c] dark:text-[#8c96aa]">
        <span>Supports Google Sheets, Google Docs, PDFs, or raw URLs</span>
      </div>
    </div>
  );
}
