"use client";

import { AuthProvider } from "@features/auth";
import { ThemeProvider } from "@core/providers/theme-provider";

export function Providers({
  children,
  initialTheme = "dark",
}: {
  children: React.ReactNode;
  initialTheme?: "dark" | "light";
}) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
