"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, LogOut, User as UserIcon, Plus, Settings } from "lucide-react";
import { useTheme } from "@core/hooks/use-theme";
import { useAuth } from "@features/auth";
import { useState, useRef, useEffect } from "react";

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Home", href: "/dashboard" },
    { label: "Import", href: "/dashboard/import" },
    { label: "About", href: "/dashboard/about" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/roadmaps";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-white/10 bg-[#f7f8f9]/80 dark:bg-[#07090f]/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <span className="font-mono text-base font-bold text-[#14a0bc] dark:text-[#21c6e8] tracking-tight group-hover:opacity-90 transition-opacity">
              [io]
            </span>
            <span className="font-semibold text-lg tracking-tight text-[#0e121c] dark:text-[#edf0f9]">
              Career OS
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? "bg-zinc-200/80 dark:bg-white/10 text-[#0e121c] dark:text-[#edf0f9] shadow-xs"
                      : "text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] hover:bg-zinc-100/60 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Tools: Import CTA, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/import"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#5963e8] hover:bg-[#4b55dc] dark:bg-[#7c82f4] dark:hover:bg-[#6c72e8] text-white transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[#21c6e8]" />
            ) : (
              <Moon className="w-4 h-4 text-[#5963e8]" />
            )}
          </button>

          {/* User Profile / Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-[#0e121c] dark:text-[#edf0f9] transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#5963e8] to-[#21c6e8] flex items-center justify-center text-white text-xs font-semibold uppercase">
                {user?.name?.[0] || user?.email?.[0] || "U"}
              </div>
              <span className="hidden md:inline-block text-xs font-medium max-w-[120px] truncate">
                {user?.name || user?.email || "Account"}
              </span>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#10131c] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/5 mb-1">
                  <p className="text-xs font-semibold text-[#0e121c] dark:text-[#edf0f9] truncate">
                    {user?.name || "Career OS User"}
                  </p>
                  <p className="text-[11px] text-[#666d7c] dark:text-[#8c96aa] truncate mt-0.5">
                    {user?.email || "user@example.com"}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Roadmaps</span>
                  </Link>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-[#666d7c] dark:text-[#8c96aa] hover:text-[#0e121c] dark:hover:text-[#edf0f9] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="border-t border-zinc-100 dark:border-white/5 mt-1 pt-1">
                  <button
                    onClick={async () => {
                      setProfileOpen(false);
                      await logout();
                      window.location.href = "/login";
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
