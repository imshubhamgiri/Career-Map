"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      const redirectUrl = pathname
        ? `/login?from=${encodeURIComponent(pathname)}`
        : "/login";
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, isInitializing, router, pathname]);

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 animate-pulse">
        <div className="w-full max-w-4xl space-y-6">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50" />
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50" />
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50" />
          </div>
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
