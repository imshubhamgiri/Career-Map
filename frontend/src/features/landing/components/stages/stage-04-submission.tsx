"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Play, Send, Zap, Clock, Cpu, HardDrive, Check } from "lucide-react";

export function StageSubmission() {
  const [hasSubmitted, setHasSubmitted] = useState(true);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-3 font-sans">
      {/* LeetCode Header Nav Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-3">
          {/* LeetCode Logo simulation */}
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
            <span className="w-4 h-4 rounded-sm bg-[#FFA116] flex items-center justify-center text-[10px] text-black font-extrabold">
              L
            </span>
            <span>LeetCode</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-zinc-400 text-[11px]">
            <span className="text-white border-b-2 border-white pb-0.5">Problem</span>
            <span>Editorial</span>
            <span>Submissions</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-xs">
            42. Trapping Rain Water
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Hard
          </span>
        </div>
      </div>

      {/* LeetCode Code Editor Mock */}
      <div className="rounded-xl border border-zinc-800 bg-[#1e1e1e] p-3 text-[11px] font-mono leading-relaxed text-zinc-300 shadow-inner">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
          <span>Python3 · Solution.py</span>
          <span>Auto-saved</span>
        </div>
        <div className="space-y-0.5 select-none text-[11px]">
          <div><span className="text-purple-400">class</span> <span className="text-yellow-300">Solution</span>:</div>
          <div className="pl-4"><span className="text-purple-400">def</span> <span className="text-blue-400">trap</span>(self, height: List[int]) -&gt; int:</div>
          <div className="pl-8">l, r = <span className="text-emerald-400">0</span>, len(height) - <span className="text-emerald-400">1</span></div>
          <div className="pl-8">l_max, r_max, res = <span className="text-emerald-400">0</span>, <span className="text-emerald-400">0</span>, <span className="text-emerald-400">0</span></div>
          <div className="pl-8 text-zinc-400 italic"># two pointers scan inwards...</div>
        </div>

        {/* LeetCode Bottom Buttons: Run & Submit */}
        <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Run</span>
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setHasSubmitted(true)}
            className="px-3.5 py-1 rounded bg-[#2cbb5d] hover:bg-[#26a853] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Submit</span>
          </motion.button>
        </div>
      </div>

      {/* LeetCode Accepted Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl p-3.5 border border-emerald-500/40 bg-[#16261c] text-white relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2cbb5d]" />
            <span className="text-base font-extrabold text-[#2cbb5d] tracking-tight">
              Accepted
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-300">
            322 / 322 testcases passed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
          <div className="p-2 rounded bg-black/40 border border-emerald-500/20 flex justify-between items-center">
            <span className="text-zinc-400">Runtime: 42 ms</span>
            <span className="text-[#2cbb5d] font-bold">Beats 91.4%</span>
          </div>
          <div className="p-2 rounded bg-black/40 border border-emerald-500/20 flex justify-between items-center">
            <span className="text-zinc-400">Memory: 18.6 MB</span>
            <span className="text-[#2cbb5d] font-bold">Beats 84.2%</span>
          </div>
        </div>

        {/* Career OS Extension Intercept Banner */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 p-2.5 rounded-lg border border-brand-cyan/40 bg-black/80 flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
            <div>
              <span className="font-bold text-brand-cyan">
                Career OS Extension:
              </span>{" "}
              <span className="text-zinc-200">
                Solution captured! Marking roadmap complete...
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan">
            ✓ Done
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
