"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Clock } from "lucide-react";
import type { Roadmap } from "../types";

interface RoadmapCardProps {
  roadmap: Roadmap;
}

export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  const solved = roadmap.solvedProblems ?? 0;
  const total = roadmap.totalProblems ?? 0;
  const percentage =
    total > 0
      ? Math.round((solved / total) * 1000) / 10
      : roadmap.progressPercentage ?? 0;

  const formattedDate = new Date(roadmap.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs hover:border-[#5963e8]/40 dark:hover:border-[#7c82f4]/40 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f0f3f6] dark:bg-[#131822] text-[#5963e8] dark:text-[#21c6e8] border border-zinc-200/60 dark:border-white/5 font-semibold">
            {roadmap.sourceType || "CURATED"}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-[#666d7c] dark:text-[#8c96aa]">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Roadmap Title */}
        <h3 className="text-xl font-bold text-[#0e121c] dark:text-[#edf0f9] tracking-tight group-hover:text-[#5963e8] dark:group-hover:text-[#21c6e8] transition-colors">
          {roadmap.title}
        </h3>

        {/* Problems & Progress */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#666d7c] dark:text-[#8c96aa]">
              {total > 0 ? `${solved} of ${total} problems solved` : "Progress"}
            </span>
            <span className="font-semibold text-[#0e121c] dark:text-[#edf0f9]">
              {percentage}%
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-[#f0f3f6] dark:bg-[#1f2533] overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#5963e8] to-[#21c6e8] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(percentage > 0 ? 3 : 0, percentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
        <span className="text-xs text-[#666d7c] dark:text-[#8c96aa] flex items-center gap-1">
          {percentage === 100 ? (
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> In progress
            </span>
          )}
        </span>

        <Link
          href={`/dashboard/roadmap/${roadmap.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5963e8] dark:text-[#21c6e8] group-hover:translate-x-0.5 transition-transform"
        >
          <span>Open Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
