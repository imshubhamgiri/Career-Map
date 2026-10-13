"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useIngestPolling } from "../hooks/use-ingest-polling";
import type { IngestStatusResponse } from "../types";

export interface IngestProgressProps {
  roadmapId: string;
  initialTitle?: string;
  onCompleted?: (statusData: IngestStatusResponse) => void;
  onFailed?: (error: string) => void;
}

/**
 * Linear/Raycast-inspired real-time ingestion progress monitor.
 * Polls the lightweight backend ingestion status endpoint and triggers
 * onCompleted when the roadmap has finished processing.
 */
export function IngestProgress({
  roadmapId,
  initialTitle,
  onCompleted,
  onFailed,
}: IngestProgressProps) {
  const {
    statusData,
    status,
    isLoading,
    isPolling,
    error,
    attempts,
    refetch,
  } = useIngestPolling(roadmapId, {
    intervalMs: 2500,
    maxAttempts: 70, // ~3 minutes total tolerance
    onCompleted,
    onFailed,
  });

  const isFailed = status === "FAILED" || !!error;
  const failureReason =
    error ||
    statusData?.errorMessage ||
    "An unexpected error occurred during document parsing.";

  const title = statusData?.title || initialTitle || "DSA Roadmap";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-dark-card border border-zinc-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-3 pb-6 border-b border-zinc-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-light-surface dark:bg-dark-surface text-brand-indigo-light dark:text-brand-cyan border border-zinc-200/60 dark:border-white/5 font-semibold">
              {statusData?.sourceType || "CURRICULUM"}
            </span>

            {statusData?.sourceUrl && (
              <a
                href={statusData.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#666d7c] dark:text-[#8c96aa] hover:underline"
              >
                <span>Source Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              isFailed
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFailed ? "bg-rose-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            {isFailed ? "Failed" : "Processing"}
          </span>
        </div>

        {/* Status Content */}
        <div className="py-8 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
              {title}
            </h1>
            <p className="text-sm text-[#666d7c] dark:text-[#8c96aa] mt-2">
              {isFailed
                ? "We encountered an issue extracting problems from this resource."
                : "Your roadmap is being parsed and organized in the background."}
            </p>
          </div>

          {!isFailed ? (
            <div className="space-y-6">
              {/* Progress Shimmer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#666d7c] dark:text-[#8c96aa]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-indigo-light dark:text-brand-cyan animate-pulse" />
                    Extraction in progress...
                  </span>
                  <span className="font-mono text-[11px]">
                    {statusData?.problemCount && statusData.problemCount > 0
                      ? `${statusData.problemCount} problems found`
                      : attempts > 0
                      ? `syncing (${attempts})`
                      : "initializing worker..."}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-light-surface dark:bg-[#1f2533] overflow-hidden relative">
                  <div className="h-full bg-linear-to-r from-brand-indigo-light via-brand-violet to-brand-cyan rounded-full animate-pulse w-3/4 transition-all duration-700" />
                </div>
              </div>

              {/* Multi-stage Pipeline Display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0e121c] dark:text-[#edf0f9]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>1. Fetch Source</span>
                  </div>
                  <p className="text-[11px] text-[#666d7c] dark:text-[#8c96aa] mt-1">
                    Normalized document content
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-brand-indigo-light/30 dark:border-brand-indigo/30 bg-brand-indigo-light/5 dark:bg-brand-indigo/5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-indigo-light dark:text-brand-cyan">
                    <div className="w-3.5 h-3.5 border-2 border-brand-indigo-light border-t-transparent rounded-full animate-spin" />
                    <span>2. AI Analysis</span>
                  </div>
                  <p className="text-[11px] text-[#666d7c] dark:text-[#8c96aa] mt-1">
                    Extracting DSA problems & slugs
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] opacity-60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#666d7c] dark:text-[#8c96aa]">
                    <FileText className="w-4 h-4" />
                    <span>3. Categorize</span>
                  </div>
                  <p className="text-[11px] text-[#666d7c] dark:text-[#8c96aa] mt-1">
                    Build topic taxonomy tree
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] leading-relaxed pt-2">
                💡 This typically takes between 15 to 45 seconds depending on document length. This view automatically refreshes as soon as extraction finishes.
              </p>
            </div>
          ) : (
            /* Error & Retry State */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Extraction Failed</p>
                  <p className="leading-relaxed opacity-90">{failureReason}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={refetch}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-indigo-light dark:bg-brand-indigo text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Check</span>
                </button>

                <Link
                  href="/dashboard/import"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-dark-card hover:bg-zinc-50 dark:hover:bg-white/5 text-[#0e121c] dark:text-[#edf0f9] transition-colors"
                >
                  <span>Try Another URL</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
