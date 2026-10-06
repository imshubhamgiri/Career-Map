"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUser,
  logoutUser,
  loginUser,
  registerUser,
  resendVerification as resendVerificationRequest,
  verifyEmail as verifyEmailRequest,
} from "../services/auth.service";
import { ApiError } from "@/lib/api-client";
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  VerificationResponse,
} from "../types";

export interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<RegisterResponse>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<VerificationResponse>;
  refreshUser: () => Promise<AuthUser | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

// Module-level cache: persists across client-side page transitions,
// resets naturally when browser page refresh occurs.
let cachedUser: AuthUser | null = null;
let sessionRestored = false;
let ongoingRestore: Promise<AuthUser | null> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [isInitializing, setIsInitializing] = useState(!sessionRestored);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // If session was already restored in this browser runtime, do not hit /auth/me again
    if (sessionRestored) {
      if (!cancelled) {
        setUser(cachedUser);
        setIsInitializing(false);
      }
      return;
    }

    async function restoreSession() {
      try {
        if (!ongoingRestore) {
          ongoingRestore = getCurrentUser()
            .then((u) => {
              cachedUser = u;
              sessionRestored = true;
              return u;
            })
            .catch((cause) => {
              cachedUser = null;
              sessionRestored = true;
              return null;
            })
            .finally(() => {
              ongoingRestore = null;
            });
        }

        const resolvedUser = await ongoingRestore;
        if (!cancelled) {
          setUser(resolvedUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser(credentials);

      if (!response.success || !response.user) {
        setError(response.message || "Unable to sign in.");
        return response;
      }
      cachedUser = response.user;
      sessionRestored = true;
      setUser(response.user);
      return response;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to sign in.",
      );
      return {
        success: false,
        message: cause instanceof Error ? cause.message : "Unable to sign in.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerUser(credentials);
      if (!response.success || !response.user) {
        setError(response.message || "Unable to register.");
        return response;
      }
      cachedUser = response.user;
      sessionRestored = true;
      setUser(response.user);
      return response;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to register.",
      );
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to register.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await logoutUser();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to sign out.",
      );
    } finally {
      cachedUser = null;
      sessionRestored = true;
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await verifyEmailRequest(email, code);
      if (!response.success || !response.user) {
        setError(response.message || "Unable to verify email.");
        return false;
      }
      cachedUser = response.user;
      sessionRestored = true;
      setUser(response.user);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to verify email.",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      return await resendVerificationRequest(email);
    } catch (cause) {
      return {
        success: false,
        message: cause instanceof Error
          ? cause.message
          : "Unable to resend verification code.",
      };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      cachedUser = currentUser;
      sessionRestored = true;
      setUser(currentUser);
      return currentUser;
    } catch {
      cachedUser = null;
      sessionRestored = true;
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      isLoading,
      isAuthenticated: user !== null && user.isEmailVerified !== false,
      error,
      login,
      logout,
      register,
      verifyEmail,
      isEmailVerified: user?.isEmailVerified ?? false,
      resendVerification,
      refreshUser,
    }),
    [user, isInitializing, isLoading, error, login, logout, register, verifyEmail, resendVerification, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
