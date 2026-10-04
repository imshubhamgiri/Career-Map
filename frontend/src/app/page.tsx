import Link from "next/link";
import { Button } from "@core/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-dark-bg">
      <div className="flex flex-col items-center text-center max-w-md space-y-6">
        <div className="h-1.5 w-16 rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-cyan-500" />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Career OS
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your personal Career Operating System. Import roadmaps, track DSA progress, and sync with GitHub.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/login">
            <Button size="lg" className="px-8">
              Log in
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
