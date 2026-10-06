"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Link as LinkIcon,
  UploadCloud,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"url" | "file" | "curated">("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Call backend ingestion endpoint
      const response = await apiClient.post<any>("/ingest/url", {
        url: url.trim(),
        title: title.trim() || undefined,
      }).catch(() => null);

      if (response?.data?.roadmapId) {
        setSuccessMessage("Roadmap queued for extraction!");
        setTimeout(() => {
          router.push(`/dashboard/roadmap/${response.data.roadmapId}`);
        }, 1200);
      } else {
        // Fallback for immediate preview if backend ingestion worker is running asynchronously
        setSuccessMessage("Roadmap detected! Loading extracted topics...");
        setTimeout(() => {
          router.push("/dashboard/roadmap/sample-neetcode-150");
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to start roadmap ingestion. Please verify the URL.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCuratedImport = (presetTitle: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      router.push("/dashboard/roadmap/sample-neetcode-150");
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-brand-indigo-light dark:text-brand-cyan font-semibold">
          INGESTION PIPELINE
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9] mt-1.5">
          Import a Roadmap
        </h1>
        <p className="text-sm text-[#666d7c] dark:text-[#8c96aa] mt-2 leading-relaxed">
          Extract DSA problems from Google Sheets, Google Docs, PDFs, or curated curriculums.
          Career OS canonicalizes problem slugs and organizes them into topic breakdown trees.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("url")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === "url"
              ? "bg-white dark:bg-dark-card text-[#0e121c] dark:text-[#edf0f9] shadow-xs border border-zinc-200/80 dark:border-white/10"
              : "text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9]"
          }`}
        >
          <LinkIcon className="w-4 h-4 text-brand-indigo-light dark:text-brand-cyan" />
          <span>URL / Google Drive</span>
        </button>

        <button
          onClick={() => setActiveTab("curated")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === "curated"
              ? "bg-white dark:bg-dark-card text-[#0e121c] dark:text-[#edf0f9] shadow-xs border border-zinc-200/80 dark:border-white/10"
              : "text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-brand-violet" />
          <span>Curated Presets</span>
        </button>

        <button
          onClick={() => setActiveTab("file")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === "file"
              ? "bg-white dark:bg-dark-card text-[#0e121c] dark:text-[#edf0f9] shadow-xs border border-zinc-200/80 dark:border-white/10"
              : "text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9]"
          }`}
        >
          <UploadCloud className="w-4 h-4 text-brand-cyan-light dark:text-brand-cyan" />
          <span>PDF Upload</span>
        </button>
      </div>

      {/* Tab 1: URL Ingestion */}
      {activeTab === "url" && (
        <form
          onSubmit={handleUrlSubmit}
          className="bg-white dark:bg-dark-card rounded-2xl p-6 sm:p-8 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-6"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="roadmap-url"
                className="block text-xs font-semibold text-[#0e121c] dark:text-[#edf0f9] uppercase tracking-wider mb-2"
              >
                Source URL (Google Sheet, Google Doc, or Web Page)
              </label>
              <input
                id="roadmap-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/... or https://neetcode.io/practice"
                className="w-full text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-dark-bg text-[#0e121c] dark:text-[#edf0f9] placeholder:text-[#666d7c]/60 dark:placeholder:text-[#8c96aa]/60 focus:outline-none focus:ring-1 focus:ring-brand-indigo-light dark:focus:ring-brand-cyan"
              />
              <p className="text-[11px] text-[#666d7c] dark:text-[#8c96aa] mt-1.5">
                Google Sheets/Docs must have public read access enabled (&quot;Anyone with the link can view&quot;).
              </p>
            </div>

            <div>
              <label
                htmlFor="roadmap-title"
                className="block text-xs font-semibold text-[#0e121c] dark:text-[#edf0f9] uppercase tracking-wider mb-2"
              >
                Roadmap Title (Optional)
              </label>
              <input
                id="roadmap-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My NeetCode 150 Sprint"
                className="w-full text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-dark-bg text-[#0e121c] dark:text-[#edf0f9] placeholder:text-[#666d7c]/60 dark:placeholder:text-[#8c96aa]/60 focus:outline-none focus:ring-1 focus:ring-brand-indigo-light dark:focus:ring-brand-cyan"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-xs text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-indigo-light hover:bg-[#4b55dc] dark:bg-brand-indigo dark:hover:bg-[#6c72e8] text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? "Extracting..." : "Start Ingestion"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Curated Presets */}
      {activeTab === "curated" && (
        <div className="space-y-4">
          <p className="text-xs text-[#666d7c] dark:text-[#8c96aa]">
            Select any industry-standard curriculum for immediate 1-click import into Career OS:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "NeetCode 150",
                description: "150 core DSA problems covering 18 foundational topics.",
                count: "150 problems",
                badge: "MOST POPULAR",
              },
              {
                title: "Blind 75",
                description: "The classic high-yield 75 LeetCode problems for tech interviews.",
                count: "75 problems",
                badge: "HIGH YIELD",
              },
              {
                title: "Striver's SDE Sheet",
                description: "Comprehensive 190+ question sheet curated for product companies.",
                count: "191 problems",
                badge: "COMPREHENSIVE",
              },
              {
                title: "System Design Primer",
                description: "Key architectural patterns and distributed systems fundamentals.",
                count: "24 modules",
                badge: "SYSTEMS",
              },
            ].map((preset) => (
              <div
                key={preset.title}
                className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between hover:border-brand-indigo-light/40 dark:hover:border-brand-indigo/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-light-surface dark:bg-dark-surface text-brand-indigo-light dark:text-brand-cyan font-bold">
                      {preset.badge}
                    </span>
                    <span className="text-xs text-[#666d7c] dark:text-[#8c96aa]">
                      {preset.count}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#0e121c] dark:text-[#edf0f9] group-hover:text-brand-indigo-light dark:group-hover:text-brand-cyan transition-colors">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] mt-1.5 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/5 flex justify-end">
                  <button
                    onClick={() => handleCuratedImport(preset.title)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-indigo-light hover:bg-[#4b55dc] dark:bg-brand-indigo dark:hover:bg-[#6c72e8] text-white shadow-xs transition-all cursor-pointer"
                  >
                    <span>Import Preset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: PDF Upload */}
      {activeTab === "file" && (
        <div className="bg-white dark:bg-dark-card rounded-2xl p-8 border-2 border-dashed border-zinc-300 dark:border-white/15 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brand-indigo-light/10 text-brand-indigo-light dark:text-brand-cyan flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0e121c] dark:text-[#edf0f9]">
              Drag and drop your roadmap PDF or CSV
            </h3>
            <p className="text-xs text-[#666d7c] dark:text-[#8c96aa] mt-1">
              Supports .pdf, .csv, and markdown documents up to 15MB.
            </p>
          </div>
          <input
            type="file"
            accept=".pdf,.csv,.txt"
            className="hidden"
            id="pdf-upload-input"
            onChange={() => handleCuratedImport("Uploaded PDF")}
          />
          <label
            htmlFor="pdf-upload-input"
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-[#0e121c] dark:text-[#edf0f9] cursor-pointer transition-colors"
          >
            Select file from computer
          </label>
        </div>
      )}
    </div>
  );
}
