"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, GitCommit, FileCode, CheckCircle2, AlertCircle, Clock, BookOpen, Sparkles, Save } from "lucide-react";
import type { RoadmapProblemItem } from "../types";

interface RevisionNotesDrawerProps {
  problem: RoadmapProblemItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes?: (problemId: string, notes: string) => void;
}

export function RevisionNotesDrawer({
  problem,
  isOpen,
  onClose,
  onSaveNotes,
}: RevisionNotesDrawerProps) {
  const [personalNotes, setPersonalNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (problem) {
      const stored = localStorage.getItem(`notes_${problem.problemId}`);
      setPersonalNotes(stored || problem.userNotes || "");
      setSavedSuccess(false);
    }
  }, [problem]);

  if (!isOpen || !problem) return null;

  const handleSave = () => {
    localStorage.setItem(`notes_${problem.problemId}`, personalNotes);
    if (onSaveNotes) {
      onSaveNotes(problem.problemId, personalNotes);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-dark-card border-l border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto transition-colors duration-200">
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-start justify-between">
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded-md border font-semibold ${getDifficultyBadge(
                    problem.originalDifficulty
                  )}`}
                >
                  {problem.originalDifficulty}
                </span>
                <span className="text-xs text-[#666d7c] dark:text-[#8c96aa] font-medium">
                  {problem.topic}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0e121c] dark:text-[#edf0f9] tracking-tight">
                {problem.originalTitle}
              </h2>
              {problem.originalUrl && (
                <a
                  href={problem.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-indigo-light dark:text-brand-cyan hover:underline pt-0.5"
                >
                  <span>Open on LeetCode</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#666d7c] dark:text-[#8c96aa] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6 flex-1">
            {/* Complexity & Status Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-light-surface dark:bg-dark-surface p-3.5 rounded-xl border border-zinc-200/50 dark:border-white/5">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#666d7c] dark:text-[#8c96aa]">
                  Time Complexity
                </div>
                <div className="text-sm font-semibold text-[#0e121c] dark:text-[#edf0f9] mt-1 font-mono">
                  {problem.timeComplexity || "O(n)"}
                </div>
              </div>

              <div className="bg-light-surface dark:bg-dark-surface p-3.5 rounded-xl border border-zinc-200/50 dark:border-white/5">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#666d7c] dark:text-[#8c96aa]">
                  Space Complexity
                </div>
                <div className="text-sm font-semibold text-[#0e121c] dark:text-[#edf0f9] mt-1 font-mono">
                  {problem.spaceComplexity || "O(1)"}
                </div>
              </div>
            </div>

            {/* GitHub Sync Status Card */}
            <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-zinc-200/50 dark:border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#0e121c] dark:text-[#edf0f9]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span className="text-xs font-semibold text-[#0e121c] dark:text-[#edf0f9]">
                    GitHub Sync Status
                  </span>
                </div>

                {problem.githubSyncStatus === "SYNCED" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Synced
                  </span>
                ) : problem.githubSyncStatus === "PENDING" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#666d7c] dark:text-[#8c96aa] bg-zinc-200/50 dark:bg-white/5 px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Not synced yet
                  </span>
                )}
              </div>

              {problem.githubRepo && (
                <div className="text-xs space-y-1 text-[#666d7c] dark:text-[#8c96aa] pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono text-[11px] truncate">
                      {problem.githubRepo}/{problem.githubFilePath || "solution.py"}
                    </span>
                  </div>
                  {problem.githubCommitSha && (
                    <div className="flex items-center gap-1.5 truncate">
                      <GitCommit className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono text-[11px]">
                        Commit: {problem.githubCommitSha}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Notes / Optimal Pattern */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-indigo-light dark:text-brand-cyan">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Revision Blueprint</span>
              </div>
              <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-zinc-200/50 dark:border-white/5 text-xs leading-relaxed text-[#0e121c] dark:text-[#edf0f9] whitespace-pre-line font-sans">
                {problem.aiNotes ||
                  "No automated AI notes generated for this problem yet. Notes are generated automatically when a solution is submitted via the Career OS extension."}
              </div>
            </div>

            {/* Code Solution snippet if available */}
            {problem.code && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#0e121c] dark:text-[#edf0f9] flex items-center justify-between">
                  <span>Last Solved Code ({problem.language || "Python"})</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-zinc-950 text-zinc-200 text-xs font-mono overflow-x-auto border border-white/5 leading-relaxed">
                  <code>{problem.code}</code>
                </pre>
              </div>
            )}

            {/* User Personal Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0e121c] dark:text-[#edf0f9] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-indigo-light dark:text-brand-indigo" />
                  <span>My Personal Notes & Pitfalls</span>
                </label>
                {savedSuccess && (
                  <span className="text-[11px] text-emerald-500 font-medium animate-in fade-in">
                    Notes saved!
                  </span>
                )}
              </div>
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Write your quick recall notes, tricky edge cases, or revision tips here..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-dark-bg text-[#0e121c] dark:text-[#edf0f9] placeholder:text-[#666d7c]/60 dark:placeholder:text-[#8c96aa]/60 focus:outline-none focus:ring-1 focus:ring-brand-indigo-light dark:focus:ring-brand-cyan resize-none"
              />
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-indigo-light hover:bg-[#4b55dc] dark:bg-brand-indigo dark:hover:bg-[#6c72e8] text-white rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
