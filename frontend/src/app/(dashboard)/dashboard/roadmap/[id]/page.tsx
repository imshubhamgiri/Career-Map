"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchRoadmapById, RoadmapView, type RoadmapDetail } from "@features/roadmaps";

export default function SpecificRoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoadmap() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchRoadmapById(id);
        if (!cancelled) {
          if (data) {
            setRoadmap(data);
          } else {
            setError("Roadmap not found");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load roadmap");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRoadmap();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="w-24 h-4 bg-zinc-200 dark:bg-white/10 rounded" />
          <div className="w-72 h-10 bg-zinc-200 dark:bg-white/10 rounded-lg" />
          <div className="w-48 h-4 bg-zinc-200 dark:bg-white/10 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-3 h-40 bg-zinc-200 dark:bg-white/10 rounded-2xl" />
          <div className="md:col-span-4 h-40 bg-zinc-200 dark:bg-white/10 rounded-2xl" />
          <div className="md:col-span-5 h-40 bg-zinc-200 dark:bg-white/10 rounded-2xl" />
        </div>

        <div className="h-64 bg-zinc-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-[#0e121c] dark:text-[#edf0f9]">
          Roadmap Not Found
        </h2>
        <p className="text-sm text-[#666d7c] dark:text-[#8c96aa]">
          {error || "The requested roadmap could not be loaded."}
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#5963e8] dark:bg-[#7c82f4] text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb back link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Roadmaps</span>
        </Link>
      </div>

      {/* Specific Roadmap Content */}
      <RoadmapView roadmap={roadmap} />
    </div>
  );
}
