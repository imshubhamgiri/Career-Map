"use client";

import Link from "next/link";
import { Button } from "@core/components/ui/button";

export function LoginForm() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800/80 dark:bg-[#18181b] backdrop-blur-sm">
      <div className="mb-6 flex flex-col space-y-2">
        <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome back
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Enter your credentials to access your Career OS workspace
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <span className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">
              Forgot?
            </span>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
        </div>

        <Button type="button" className="w-full mt-2">
          Sign in
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/"
          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
