"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [mounted, setMounted] = useState(false);

  function applyTheme(newTheme: Theme) {
    if (newTheme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    try {
      localStorage.setItem("cos-theme", newTheme);
      document.cookie = `cos-theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    setThemeState(newTheme);
  }

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("cos-theme") as Theme | null;
      if (saved && (saved === "light" || saved === "dark")) {
        if (saved !== theme) {
          applyTheme(saved);
        }
      } else {
        localStorage.setItem("cos-theme", initialTheme);
        document.cookie = `cos-theme=${initialTheme}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {}
  }, []);

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, mounted, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as Theme,
      mounted: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
