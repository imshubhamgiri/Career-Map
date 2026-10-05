"use client";

import { useContext } from "react";
import {
  AuthContext,
  type AuthContextValue,
} from "../context/auth-context";

/**
 * Public auth hook. Components use this hook instead of knowing
 * how the AuthContext is created or where its provider is mounted.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
