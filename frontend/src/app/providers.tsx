"use client";

import { AuthProvider } from "@features/auth";
import { ThemeProvider } from "@core/providers/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
