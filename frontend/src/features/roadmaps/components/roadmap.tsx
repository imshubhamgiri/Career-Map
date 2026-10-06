"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Check,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { RoadmapDetail, RoadmapProblemItem, ProgressStatus } from "../types";
import { RevisionNotesDrawer } from "./revision-notes-drawer";

interface RoadmapProps {
  roadmap: RoadmapDetail;
}

export function  RoadmapView({ roadmap: initialRoadmap }: RoadmapProps) {
  const [roadmap, setRoadmap] = useState<RoadmapDetail>(initialRoadmap);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    [roadmap.topics[0]?.topic || ""]: true,
    [roadmap.topics[1]?.topic || ""]: false,
  });
  const [activeDrawerProblem, setActiveDrawerProblem] = useState<RoadmapProblemItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SOLVED" | "UNSOLVED">("ALL");

  // Dynamic greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  const handleOpenNotes = (problem: RoadmapProblemItem) => {
    setActiveDrawerProblem(problem);
    setIsDrawerOpen(true);
  };

  // Toggle problem solve state optimistically
  const toggleProblemStatus = (problemId: string) => {
    setRoadmap((prev) => {
      let solvedCountDelta = 0;
      const updatedTopics = prev.topics.map((t) => {
        const updatedProblems = t.problems.map((p) => {
          if (p.problemId === problemId) {
            const nextStatus: ProgressStatus = p.status === "SOLVED" ? "NOT_STARTED" : "SOLVED";
            if (nextStatus === "SOLVED") solvedCountDelta += 1;
            else solvedCountDelta -= 1;

            return {
              ...p,
              status: nextStatus,
              solvedAt: nextStatus === "SOLVED" ? new Date().toISOString() : null,
              githubSyncStatus: nextStatus === "SOLVED" ? (p.githubSyncStatus || "SYNCED") : null,
            };
          }
          return p;
        });

        const solved = updatedProblems.filter((p) => p.status === "SOLVED").length;
        const total = updatedProblems.length;
        return {
          ...t,
          problems: updatedProblems,
          solved,
          progressPercentage: total > 0 ? Math.round((solved / total) * 1000) / 10 : 0,
        };
      });

      const totalSolved = Math.max(0, prev.solvedProblems + solvedCountDelta);
      const totalProblems = prev.totalProblems;

      return {
        ...prev,
        solvedProblems: totalSolved,
        progressPercentage:
          totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 1000) / 10 : 0,
        topics: updatedTopics,
      };
    });
  };

  // Find next problems for the "Today's Queue" card
  const queueProblems = useMemo(() => {
    const list: RoadmapProblemItem[] = [];
    for (const topic of roadmap.topics) {
      for (const p of topic.problems) {
        if (p.status !== "SOLVED") {
          list.push(p);
          if (list.length >= 2) return list;
        }
      }
    }
    return list;
  }, [roadmap]);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case "EASY":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "HARD":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Top Section: Greeting & Active Roadmap */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
            {greeting}.
          </h1>
          <p className="text-sm text-[#666d7c] dark:text-[#8c96aa]">
            Keep the momentum going.{" "}
            {queueProblems.length > 0 ? (
              <span>{queueProblems.length} problems left in today&apos;s queue.</span>
            ) : (
              <span>All queue problems completed for today!</span>
            )}
          </p>

          {/* Active Roadmap Pill */}
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#f0f3f6] dark:bg-[#131822] text-[#0e121c] dark:text-[#edf0f9] border border-zinc-200/80 dark:border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#14a0bc] dark:bg-[#21c6e8]" />
              <span className="text-[#666d7c] dark:text-[#8c96aa]">Active roadmap:</span>
              <span className="font-semibold">{roadmap.title}</span>
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 transition-colors"
          >
            Switch roadmap
          </Link>
        </div>
      </div>

      {/* 2. Metrics & Today's Queue Row (Matching Figma Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Metric 1: Problems Solved */}
        <div className="md:col-span-3 bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#666d7c] dark:text-[#8c96aa] font-semibold">
            Problems Solved
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
              {roadmap.solvedProblems}
            </span>
            <span className="text-sm font-medium text-[#666d7c] dark:text-[#8c96aa]">
              / {roadmap.totalProblems} solved
            </span>
          </div>
          <div className="mt-4 text-xs text-[#666d7c] dark:text-[#8c96aa]">
            Targeting consistency across topic trees
          </div>
        </div>

        {/* Metric 2: Overall Progress */}
        <div className="md:col-span-4 bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#666d7c] dark:text-[#8c96aa] font-semibold">
            Overall Progress
          </div>
          <div className="mt-4">
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
              {roadmap.progressPercentage}%
            </div>
            {/* Segmented brand progress bar */}
            <div className="h-2 w-full rounded-full bg-[#f0f3f6] dark:bg-[#1f2533] overflow-hidden mt-4">
              <div
                className="h-full bg-gradient-to-r from-[#5963e8] via-[#a575f9] to-[#21c6e8] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, roadmap.progressPercentage))}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-[#666d7c] dark:text-[#8c96aa]">
            <span>Roadmap Completion</span>
            <span className="font-mono text-[#5963e8] dark:text-[#21c6e8]">
              {roadmap.totalProblems - roadmap.solvedProblems} left
            </span>
          </div>
        </div>

        {/* Metric 3: Today's Queue Card (Highlighted Figma Card) */}
        <div className="md:col-span-5 bg-[#f0f3f6]/90 dark:bg-[#131822] rounded-2xl p-6 border border-[#5963e8]/20 dark:border-[#21c6e8]/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#5963e8] dark:text-[#21c6e8] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Today&apos;s Queue
            </span>
            <span className="text-xs text-[#666d7c] dark:text-[#8c96aa]">
              {queueProblems.length} problems left
            </span>
          </div>

          <div className="my-3">
            <h3 className="text-2xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
              {queueProblems.length > 0
                ? `${queueProblems.length} problems left`
                : "Queue Cleared!"}
            </h3>
            <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] truncate mt-1">
              {queueProblems.length > 0
                ? queueProblems.map((p) => p.originalTitle).join(" • ")
                : "Great job! You have completed all scheduled problems for today."}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#666d7c] dark:text-[#8c96aa]">
              Keep streak alive
            </span>
            {queueProblems.length > 0 && (
              <button
                onClick={() => {
                  const target = queueProblems[0];
                  if (target) {
                    if (target.originalUrl) {
                      window.open(target.originalUrl, "_blank");
                    } else {
                      handleOpenNotes(target);
                    }
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#5963e8] hover:bg-[#4b55dc] dark:bg-[#7c82f4] dark:hover:bg-[#6c72e8] text-white transition-all shadow-xs cursor-pointer"
              >
                <span>Solve next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Topic Breakdown Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/60 dark:border-white/5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0e121c] dark:text-[#edf0f9] tracking-tight">
              Topic breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#666d7c] dark:text-[#8c96aa] mt-0.5">
              Track topics and problems across this roadmap.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#f0f3f6] dark:bg-[#10131c] p-1 rounded-xl border border-zinc-200/60 dark:border-white/5 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white dark:bg-white/10 text-[#0e121c] dark:text-[#edf0f9] shadow-xs"
                  : "text-[#666d7c] dark:text-[#8c96aa]"
              }`}
            >
              All ({roadmap.totalProblems})
            </button>
            <button
              onClick={() => setStatusFilter("SOLVED")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === "SOLVED"
                  ? "bg-white dark:bg-white/10 text-[#0e121c] dark:text-[#edf0f9] shadow-xs"
                  : "text-[#666d7c] dark:text-[#8c96aa]"
              }`}
            >
              Solved ({roadmap.solvedProblems})
            </button>
            <button
              onClick={() => setStatusFilter("UNSOLVED")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === "UNSOLVED"
                  ? "bg-white dark:bg-white/10 text-[#0e121c] dark:text-[#edf0f9] shadow-xs"
                  : "text-[#666d7c] dark:text-[#8c96aa]"
              }`}
            >
              Unsolved ({roadmap.totalProblems - roadmap.solvedProblems})
            </button>
          </div>
        </div>

        {/* Topics Accordion List */}
        <div className="space-y-4">
          {roadmap.topics.map((topicGroup) => {
            const isExpanded = expandedTopics[topicGroup.topic] ?? false;
            const filteredProblems = topicGroup.problems.filter((p) => {
              if (statusFilter === "SOLVED") return p.status === "SOLVED";
              if (statusFilter === "UNSOLVED") return p.status !== "SOLVED";
              return true;
            });

            if (statusFilter !== "ALL" && filteredProblems.length === 0) {
              return null;
            }

            return (
              <div
                key={topicGroup.topic}
                className="bg-white dark:bg-[#10131c] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs transition-colors duration-200"
              >
                {/* Topic Header */}
                <div
                  onClick={() => toggleTopic(topicGroup.topic)}
                  className="px-6 py-4.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base sm:text-lg text-[#0e121c] dark:text-[#edf0f9]">
                      {topicGroup.topic}
                    </span>
                    <span className="text-xs text-[#666d7c] dark:text-[#8c96aa]">
                      ({topicGroup.solved}/{topicGroup.total})
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Mini topic progress bar */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-[#f0f3f6] dark:bg-[#1f2533] overflow-hidden">
                        <div
                          className="h-full bg-[#5963e8] dark:bg-[#7c82f4] rounded-full"
                          style={{ width: `${topicGroup.progressPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-[#666d7c] dark:text-[#8c96aa]">
                        {topicGroup.progressPercentage}%
                      </span>
                    </div>

                    <button
                      className="p-1 rounded-lg text-[#666d7c] dark:text-[#8c96aa]"
                      aria-label="Toggle topic accordion"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress underline accent in topic header */}
                <div className="h-[2px] w-full bg-zinc-100 dark:bg-white/5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#5963e8] to-[#21c6e8] transition-all duration-300"
                    style={{ width: `${topicGroup.progressPercentage}%` }}
                  />
                </div>

                {/* Problems Table / List */}
                {isExpanded && (
                  <div className="divide-y divide-zinc-100 dark:divide-white/5">
                    {filteredProblems.map((problem) => {
                      const isSolved = problem.status === "SOLVED";
                      const isAttempted = problem.status === "ATTEMPTED";

                      return (
                        <div
                          key={problem.problemId}
                          className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-white/[0.015] transition-colors group"
                        >
                          {/* Left: Status Icon & Title */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Status Icon */}
                            <button
                              onClick={() => toggleProblemStatus(problem.problemId)}
                              title={isSolved ? "Mark as unsolved" : "Mark as solved"}
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isSolved
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : isAttempted
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : "border border-zinc-300 dark:border-white/20 text-transparent hover:border-zinc-400 dark:hover:border-white/40"
                              }`}
                            >
                              {isSolved ? (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : isAttempted ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : (
                                <Circle className="w-2.5 h-2.5 fill-current" />
                              )}
                            </button>

                            {/* Title with link */}
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`text-sm font-medium tracking-tight truncate ${
                                  isSolved
                                    ? "text-[#0e121c] dark:text-[#edf0f9]"
                                    : "text-[#0e121c] dark:text-[#edf0f9]"
                                }`}
                              >
                                {problem.originalTitle}
                              </span>

                              {problem.originalUrl && (
                                <a
                                  href={problem.originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#666d7c] dark:text-[#8c96aa] hover:text-[#5963e8] dark:hover:text-[#21c6e8] transition-colors"
                                  title="Open in LeetCode"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Right Controls: Difficulty + GitHub Sync + Notes Button + Action Button */}
                          <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-9 sm:pl-0">
                            {/* Difficulty Tag */}
                            <span
                              className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded-md border font-medium ${getDifficultyBadge(
                                problem.originalDifficulty
                              )}`}
                            >
                              {problem.originalDifficulty}
                            </span>

                            {/* GitHub Sync Status Icon (dull at start when not synced, as requested!) */}
                            <div
                              title={
                                problem.githubSyncStatus === "SYNCED"
                                  ? `Synced to GitHub: ${problem.githubRepo || "Repo"}`
                                  : problem.githubSyncStatus === "PENDING"
                                  ? "Sync in progress..."
                                  : "GitHub: Not synced yet"
                              }
                              className="relative flex items-center justify-center cursor-help"
                            >
                              <svg
                                className={`w-4 h-4 transition-all ${
                                  problem.githubSyncStatus === "SYNCED"
                                    ? "text-[#14a0bc] dark:text-[#21c6e8] opacity-100"
                                    : problem.githubSyncStatus === "PENDING"
                                    ? "text-amber-500 animate-pulse opacity-90"
                                    : "text-zinc-400 dark:text-zinc-600 opacity-30 hover:opacity-60"
                                }`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                              </svg>
                            </div>

                            {/* Notes Button (Opens Revision Drawer, as requested!) */}
                            <button
                              onClick={() => handleOpenNotes(problem)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200/60 dark:border-white/5 transition-colors cursor-pointer"
                              title="Open AI revision blueprint and personal notes"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#5963e8] dark:text-[#7c82f4]" />
                              <span>Notes</span>
                            </button>

                            {/* Action / Solve Button (Matching Figma Button Style) */}
                            {isSolved ? (
                              <button
                                onClick={() => toggleProblemStatus(problem.problemId)}
                                className="px-3.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-white/10 text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer min-w-[70px]"
                              >
                                Solved
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (problem.originalUrl) {
                                    window.open(problem.originalUrl, "_blank");
                                  }
                                  toggleProblemStatus(problem.problemId);
                                }}
                                className="px-3.5 py-1 rounded-lg text-xs font-medium bg-[#5963e8] hover:bg-[#4b55dc] dark:bg-[#7c82f4] dark:hover:bg-[#6c72e8] text-white transition-all shadow-xs cursor-pointer min-w-[70px]"
                              >
                                Solve
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Revision Notes Drawer */}
      <RevisionNotesDrawer
        problem={activeDrawerProblem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaveNotes={(problemId, notes) => {
          setRoadmap((prev) => ({
            ...prev,
            topics: prev.topics.map((t) => ({
              ...t,
              problems: t.problems.map((p) =>
                p.problemId === problemId ? { ...p, userNotes: notes } : p
              ),
            })),
          }));
        }}
      />
    </div>
  );
}
