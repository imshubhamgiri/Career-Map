"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Moon, ArrowRight, Sparkles } from "lucide-react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { useTheme } from "@core/hooks/use-theme";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#f7f8f9] dark:bg-[#07090f] text-[#0e121c] dark:text-[#edf0f9] transition-colors duration-200 flex flex-col justify-between selection:bg-[#7c82f4]/30 selection:text-white">
      {/* Top Header / Brand */}
      <header className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-base font-bold text-[#14a0bc] dark:text-[#21c6e8] tracking-tight">
            [io]
          </span>
          <span className="font-semibold text-lg tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
            Career OS
          </span>
        </div>

        {/* Theme Toggle & Auth Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9]"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#21c6e8]" />
                <span>Light mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#5963e8]" />
                <span>Dark mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="w-full max-w-360 mx-auto px-6 sm:px-10 lg:px-14 py-8 lg:py-12 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-7">
            {/* Kicker */}
            <p className="text-[#666d7c] dark:text-[#8c96aa] text-base md:text-lg font-normal tracking-wide">
              A calmer way to build your career.
            </p>

            {/* Main Headline */}
            <h1 className="text-[#0e121c] dark:text-[#edf0f9] font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[64px] tracking-tight leading-[1.08]">
              Your career,
              <br />
              with a system.
            </h1>

            {/* Subtitle / Value Prop */}
            <p className="text-[#666d7c] dark:text-[#8c96aa] text-base md:text-lg leading-relaxed max-w-xl">
              Turn learning, coding practice and career progress into one
              focused workspace. Know what to do next, keep your context, and
              build momentum.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login"
                className="bg-[#5963e8] hover:bg-[#4b55dc] dark:bg-[#7c82f4] dark:hover:bg-[#6c72e8] text-white dark:text-[#edf0f9] px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2"
                prefetch= {false}
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 opacity-80" />
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className="border border-[#0e121c]/25 hover:border-[#0e121c] dark:border-[#edf0f9]/30 dark:hover:border-[#edf0f9] text-[#0e121c] dark:text-[#edf0f9] px-6 py-3 rounded-xl font-medium text-sm transition-all hover:bg-black/5 dark:hover:bg-white/5"
              >
                Log in
              </Link>
            </div>

            {/* AI Badge */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium bg-[#f0f3f6] dark:bg-[#131822] text-[#5963e8] dark:text-[#21c6e8] border border-[#5963e8]/20 dark:border-[#21c6e8]/25">
                <Sparkles className="w-3.5 h-3.5" />
                AI-powered career workspace
              </span>
            </div>
          </div>

          {/* Right Column: Preview Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[560px] bg-white dark:bg-[#10131c] rounded-[28px] p-7 sm:p-8 border border-zinc-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-200">
              {/* Top Accent Line */}
              <div className="h-[2px] w-full rounded-full bg-[rgba(89,99,232,0.25)] dark:bg-[rgba(124,130,244,0.35)] mb-6" />

              {/* Card Sub-heading */}
              <div className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#5963e8] dark:text-[#21c6e8]">
                CAREER OS
              </div>

              {/* Card Headline */}
              <h2 className="text-[#0e121c] dark:text-[#edf0f9] text-2xl sm:text-[28px] font-bold leading-tight tracking-tight mt-2.5">
                Build momentum
                <br />
                without losing context.
              </h2>

              <p className="text-[#666d7c] dark:text-[#8c96aa] text-sm mt-2">
                One place for your roadmap, practice and progress.
              </p>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3.5 my-6">
                {/* Metric 1: Problems Solved */}
                <div className="bg-[#f0f3f6] dark:bg-[#131822] rounded-[18px] p-5 border border-zinc-200/50 dark:border-white/5 transition-colors duration-200">
                  <div className="text-[#666d7c] dark:text-[#8c96aa] text-[11px] font-semibold tracking-wider uppercase">
                    PROBLEMS SOLVED
                  </div>
                  <div className="text-[#0e121c] dark:text-[#edf0f9] text-2xl sm:text-3xl font-bold tracking-tight mt-2">
                    34 / 180
                  </div>
                  <div className="text-[#666d7c] dark:text-[#8c96aa] text-xs mt-1.5">
                    18.8% overall
                  </div>
                </div>

                {/* Metric 2: Today's Queue */}
                <div className="bg-[#f0f3f6] dark:bg-[#131822] rounded-[18px] p-5 border border-zinc-200/50 dark:border-white/5 transition-colors duration-200">
                  <div className="text-[#5963e8] dark:text-[#21c6e8] text-[11px] font-semibold tracking-wider uppercase">
                    TODAY&apos;S QUEUE
                  </div>
                  <div className="text-[#0e121c] dark:text-[#edf0f9] text-2xl sm:text-3xl font-bold tracking-tight mt-2">
                    2
                  </div>
                  <div className="text-[#666d7c] dark:text-[#8c96aa] text-xs mt-1.5">
                    problems waiting
                  </div>
                </div>
              </div>

              {/* Learning Trajectory */}
              <div className="pt-1">
                <div className="text-[#0e121c] dark:text-[#edf0f9] text-sm font-semibold mb-3">
                  Learning trajectory
                </div>

                {/* Segmented Progress Bar */}
                <div className="h-[7px] w-full rounded-full bg-[#f0f3f6] dark:bg-[#262b38] overflow-hidden flex transition-colors duration-200">
                  <div className="h-full w-[52%] bg-[#5963e8] dark:bg-[#7c82f4] rounded-l-full" />
                  <div className="h-full w-[13%] bg-[#14a0bc] dark:bg-[#21c6e8]" />
                  <div className="h-full w-[35%]" />
                </div>

                {/* Bar Labels */}
                <div className="flex items-center justify-between text-xs text-[#666d7c] dark:text-[#8c96aa] mt-3 font-medium">
                  <span>Roadmap</span>
                  <span>Practice</span>
                  <span>Career</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 py-8 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[#0e121c] dark:text-[#edf0f9] text-xs sm:text-sm font-medium">
          Built for focused learners who want to become undeniable.
        </p>
        <span className="text-[#666d7c] dark:text-[#8c96aa] font-mono text-[11px] tracking-wider uppercase">
          LIGHT + DARK THEMING
        </span>
      </footer>
    </div>
  );
}
