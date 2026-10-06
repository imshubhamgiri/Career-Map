"use client";

import Link from "next/link";
import { Sparkles, GitBranch, Terminal, ShieldCheck, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Brand Kicker & Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#f0f3f6] dark:bg-[#131822] text-[#5963e8] dark:text-[#21c6e8] border border-zinc-200/80 dark:border-white/10">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About Career OS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
          Your career, with a system.
        </h1>
        <p className="text-sm sm:text-base text-[#666d7c] dark:text-[#8c96aa] leading-relaxed">
          Career OS is an intentional developer workspace designed to streamline technical interview
          prep, roadmap execution, and automated code artifact synchronization.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#5963e8]/10 text-[#5963e8] dark:text-[#21c6e8] flex items-center justify-center font-mono font-bold">
            [01]
          </div>
          <h3 className="font-bold text-base text-[#0e121c] dark:text-[#edf0f9]">
            Intelligent Ingestion
          </h3>
          <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] leading-relaxed">
            Import any Google Sheet, Notion page, or PDF roadmap. Our LLM pipeline extracts problem
            entities, canonicalizes LeetCode slugs, and organizes them into topic breakdown trees.
          </p>
        </div>

        <div className="bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#21c6e8]/10 text-[#14a0bc] dark:text-[#21c6e8] flex items-center justify-center font-mono font-bold">
            <GitBranch className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#0e121c] dark:text-[#edf0f9]">
            Automated GitHub Sync
          </h3>
          <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] leading-relaxed">
            Every problem solved via our browser extension is annotated with time/space complexity,
            step-by-step comments, and pushed straight to your configured GitHub repository.
          </p>
        </div>

        <div className="bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#a575f9]/10 text-[#a575f9] flex items-center justify-center font-mono font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#0e121c] dark:text-[#edf0f9]">
            Daily Practice Queue
          </h3>
          <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] leading-relaxed">
            Never wonder what problem to solve next. Career OS calculates your learning velocity and
            surfaces the optimal next questions to build momentum without cognitive overload.
          </p>
        </div>

        <div className="bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-mono font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#0e121c] dark:text-[#edf0f9]">
            Revision Blueprints
          </h3>
          <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] leading-relaxed">
            Keep concise algorithmic blueprints, edge case warnings, and personal notes alongside
            each problem for quick recall before technical phone screens.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 flex items-center justify-between border-t border-zinc-200 dark:border-white/10">
        <span className="text-xs text-[#666d7c] dark:text-[#8c96aa]">
          Ready to jump back into practice?
        </span>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#5963e8] hover:bg-[#4b55dc] dark:bg-[#7c82f4] dark:hover:bg-[#6c72e8] text-white shadow-xs transition-all"
        >
          <span>Go to Roadmaps</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
