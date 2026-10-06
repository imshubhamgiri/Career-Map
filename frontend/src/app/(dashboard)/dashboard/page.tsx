"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@features/auth";
import { fetchUserRoadmaps, RoadmapCard, EmptyRoadmaps, type Roadmap } from "@features/roadmaps";

export default function DashboardPage() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoadmaps = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserRoadmaps();
      setRoadmaps(data);
    } catch {
      setRoadmaps([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmaps();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/60 dark:border-white/5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
            Welcome back{user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="text-sm text-[#666d7c] dark:text-[#8c96aa] mt-1">
            Manage your career roadmaps, track practice velocity, and stay focused.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRoadmaps}
            aria-label="Refresh roadmaps"
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-[#666d7c] dark:text-[#8c96aa] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#5963e8] hover:bg-[#4b55dc] dark:bg-[#7c82f4] dark:hover:bg-[#6c72e8] text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Import Roadmap</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-[#10131c] rounded-2xl p-6 border border-zinc-200/80 dark:border-white/10 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-20 h-5 bg-zinc-200 dark:bg-white/10 rounded-md" />
                <div className="w-3/4 h-7 bg-zinc-200 dark:bg-white/10 rounded-md mt-2" />
                <div className="w-full h-3 bg-zinc-200 dark:bg-white/10 rounded-full mt-6" />
              </div>
              <div className="w-28 h-4 bg-zinc-200 dark:bg-white/10 rounded-md" />
            </div>
          ))}
        </div>
      ) : roadmaps.length === 0 ? (
        /* Empty State */
        <EmptyRoadmaps />
      ) : (
        /* Roadmap Cards Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0e121c] dark:text-[#edf0f9]">
              Active Roadmaps ({roadmaps.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((r) => (
              <RoadmapCard key={r.id} roadmap={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
